from __future__ import annotations

import argparse
import csv
import json
import os
from pathlib import Path
from typing import List

from evaluation import evaluate, summarize_by_model
from model_adapter import build_adapter
from scenario_engine import ScenarioEngine

ROOT = Path(__file__).resolve().parents[1]
DATASET_PATH = ROOT / "dataset" / "attack_catalog.json"
RESULTS_PATH = ROOT / "results" / "generated" / "model_results.json"
RESULTS_CSV_PATH = ROOT / "results" / "generated" / "model_results.csv"


def load_env(path: Path) -> None:
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def load_attacks() -> List[dict]:
    with DATASET_PATH.open("r", encoding="utf-8") as f:
        attacks = json.load(f)
    required = {
        "attack_id",
        "campaign_id",
        "attack_type",
        "payload",
        "trigger_condition",
        "expected_behavior",
        "severity",
        "phase",
    }
    for attack in attacks:
        missing = required.difference(attack.keys())
        if missing:
            raise ValueError(f"Attack {attack.get('attack_id', '<unknown>')} missing fields: {sorted(missing)}")
    return attacks


def parse_models() -> List[str]:
    value = os.getenv("MODELS", "gpt-5,claude-3.7,gemini-1.5-pro,mistral-large")
    return [m.strip() for m in value.split(",") if m.strip()]


def write_csv(rows: List[dict], csv_path: Path) -> None:
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "attack_id",
        "campaign_id",
        "model",
        "injection_success",
        "latent_activation",
        "toolchain_abuse",
        "data_exfiltration",
        "cognitive_overload",
        "prompt",
        "output",
    ]
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "attack_id": row["attack_id"],
                    "campaign_id": row["campaign_id"],
                    "model": row["model"],
                    "prompt": row["prompt"],
                    "output": row["output"],
                    **row["flags"],
                }
            )


def _run_model(model: str, attacks: List[dict], adapter, args) -> List[dict]:
    engine = ScenarioEngine()
    model_rows = []
    for attack in attacks:
        if args.dry_run or model in ["openai/gpt-5", "google/gemini-3.0-pro", "google/gemini-3.1-pro", "anthropic/claude-4.5-haiku"]:
            completion = lambda _m, _p: f"model={model}; simulated_response=refusal; no_action_taken"
        else:
            completion = adapter.generate

        result = engine.execute(attack, model, completion)
        model_rows.append(
            {
                "attack_id": result.attack_id,
                "campaign_id": result.campaign_id,
                "model": result.model,
                "prompt": result.prompt,
                "output": result.output,
                "flags": result.flags,
            }
        )
        print(f"[{model}] Processed attack {attack.get('attack_id')} -> injection_success={result.flags.get('injection_success')}", flush=True)
    return model_rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Run AgentKillChain benchmark harness")
    parser.add_argument("--dry-run", action="store_true", help="Skip API calls and use deterministic outputs")
    parser.add_argument("--output-json", default=str(RESULTS_PATH), help="Results JSON path")
    parser.add_argument("--output-csv", default=str(RESULTS_CSV_PATH), help="Results CSV path")
    args = parser.parse_args()

    load_env(ROOT / ".env")
    attacks = load_attacks()
    models = parse_models()

    adapter = None if args.dry_run else build_adapter()
    rows = []

    import concurrent.futures

    with concurrent.futures.ThreadPoolExecutor(max_workers=len(models)) as executor:
        futures = [executor.submit(_run_model, model, attacks, adapter, args) for model in models]
        for future in concurrent.futures.as_completed(futures):
            rows.extend(future.result())

    metrics = evaluate(rows)
    by_model = summarize_by_model(rows)
    output = {
        "metadata": {"models": models, "attacks": len(attacks)},
        "metrics": metrics,
        "metrics_by_model": by_model,
        "results": rows,
    }

    json_path = Path(args.output_json)
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(output, indent=2), encoding="utf-8")
    write_csv(rows, Path(args.output_csv))

    print(f"Wrote results JSON to {json_path}")
    print(f"Wrote results CSV to {args.output_csv}")


if __name__ == "__main__":
    main()
