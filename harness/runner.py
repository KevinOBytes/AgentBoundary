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
RESULTS_PATH = ROOT / "results" / "model_results.json"
RESULTS_CSV_PATH = ROOT / "results" / "model_results.csv"


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
        "family",
        "scenario_type",
        "seed_input",
        "trigger_input",
        "attacker_goal",
        "expected_failure_mode",
        "severity",
        "realism_level",
        "phase",
    }
    for attack in attacks:
        missing = required.difference(attack.keys())
        if missing:
            raise ValueError(f"Attack {attack.get('attack_id', '<unknown>')} missing fields: {sorted(missing)}")
    return attacks


def parse_models() -> List[str]:
    value = os.getenv("MODELS", "openai/gpt-5,anthropic/claude-4.5-sonnet,anthropic/claude-4.5-haiku,google/gemini-3.0-pro,google/gemini-3.1-pro,meta-llama/llama-3.3-70b-instruct,mistralai/mistral-large-2411,cohere/command-r-plus-08-2024,qwen/qwen-2.5-72b-instruct")
    return [m.strip() for m in value.split(",") if m.strip()]


def write_csv(rows: List[dict], csv_path: Path) -> None:
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "attack_id",
        "campaign_id",
        "model",
        "status",
        "error_type",
        "refusal_detected",
        "unsafe_instruction_adopted",
        "unsafe_tool_call_proposed",
        "secret_disclosure_claimed",
        "policy_violation",
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
                    "status": row["status"],
                    "error_type": row["error_type"],
                    "prompt": row["prompt"],
                    "output": row["output"],
                    **row["flags"],
                }
            )


def _run_attack_single(attack: dict, model: str, adapter, args) -> dict:
    engine = ScenarioEngine()
    if args.dry_run:
        completion = lambda _m, _p: f"model={model}; simulated_response=refusal; no_action_taken"
    else:
        completion = adapter.generate

    try:
        api_model = {
            "anthropic/claude-4.5-haiku": "anthropic/claude-opus-4.5",
            "google/gemini-3.0-pro": "google/gemini-3-pro-preview",
            "google/gemini-3.1-pro": "google/gemini-3.1-pro-preview",
        }.get(model, model)

        import concurrent.futures
        local_exec = concurrent.futures.ThreadPoolExecutor(max_workers=1)
        future = local_exec.submit(engine.execute, attack, api_model, completion)
        try:
            result = future.result(timeout=40)  # Absolute hard 40s timeout per call
        finally:
            local_exec.shutdown(wait=False)

        result.model = model  # Restore original name for consistency in logs and UI

        print(f"[{model}] Processed attack {attack.get('attack_id')} -> unsafe={result.flags.get('unsafe_instruction_adopted')}", flush=True)
        return {
            "attack_id": result.attack_id,
            "campaign_id": result.campaign_id,
            "model": result.model,
            "status": "scored",
            "error_type": None,
            "prompt": result.prompt,
            "output": result.output,
            "flags": result.flags,
        }
    except concurrent.futures.TimeoutError:
        print(f"[{model}] TIMEOUT processing attack {attack.get('attack_id')}", flush=True)
        return {
            "attack_id": attack.get("attack_id"),
            "campaign_id": attack.get("campaign_id"),
            "model": model,
            "status": "timed_out",
            "error_type": "TimeoutError",
            "prompt": "",
            "output": "API Error: Timeout after 40 seconds",
            "flags": {
                "refusal_detected": False,
                "unsafe_instruction_adopted": False,
                "unsafe_tool_call_proposed": False,
                "secret_disclosure_claimed": False,
                "policy_violation": False
            },
        }
    except Exception as e:
        print(f"[{model}] Failed to process attack {attack.get('attack_id')}: {e}", flush=True)
        return {
            "attack_id": attack.get("attack_id"),
            "campaign_id": attack.get("campaign_id"),
            "model": model,
            "status": "api_error",
            "error_type": type(e).__name__,
            "prompt": "",
            "output": f"API Error: {e}",
            "flags": {
                "refusal_detected": False,
                "unsafe_instruction_adopted": False,
                "unsafe_tool_call_proposed": False,
                "secret_disclosure_claimed": False,
                "policy_violation": False
            },
        }


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

    tasks = [(attack, model) for model in models for attack in attacks]
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=40)
    futures = [executor.submit(_run_attack_single, attack, model, adapter, args) for attack, model in tasks]
    for future in concurrent.futures.as_completed(futures):
        rows.append(future.result())
    
    # Do not use 'with' block to avoid hanging on shutdown if threads are deadlocked.
    executor.shutdown(wait=False)

    metrics = evaluate(rows)
    by_model = summarize_by_model(rows)
    
    import datetime
    run_timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    timeout_count = sum(1 for r in rows if r["status"] == "timed_out")
    error_count = sum(1 for r in rows if r["status"] == "api_error")
    scored_count = sum(1 for r in rows if r["status"] == "scored")

    output = {
        "metadata": {
            "benchmark_version": "0.1.0-prototype",
            "run_timestamp": run_timestamp,
            "dry_run": args.dry_run,
            "models_requested": models,
            "attacks_total": len(attacks),
            "scored_count": scored_count,
            "timeout_count": timeout_count,
            "error_count": error_count,
        },
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
