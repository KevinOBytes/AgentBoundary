from __future__ import annotations

import argparse
import concurrent.futures
import csv
import json
import os
import subprocess
import urllib.request
from collections import OrderedDict
from pathlib import Path
from typing import Any, Dict, List

from evaluation import evaluate, summarize_by_model
from model_adapter import build_adapter, GenerationResult
from scenario_engine import DEFAULT_SYSTEM_PROMPT, ScenarioEngine

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


def list_ollama_cloud_models() -> List[str]:
    key = os.getenv("OLLAMA_API_KEY", "")
    if not key:
        raise RuntimeError("OLLAMA_API_KEY is not set.")
    req = urllib.request.Request(
        f"{os.getenv('OLLAMA_CLOUD_BASE_URL', 'https://ollama.com').rstrip('/')}/api/tags",
        headers={"Authorization": f"Bearer {key}"},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120"))) as response:
        payload = json.loads(response.read().decode("utf-8"))
    models = [row["name"] for row in payload.get("models", []) if row.get("name")]
    if not models:
        raise RuntimeError("No Ollama cloud models returned by /api/tags.")
    return models


def parse_models(provider: str = "openrouter", cli_models: str | None = None) -> List[str]:
    if cli_models:
        return [m.strip() for m in cli_models.split(",") if m.strip()]

    if provider == "ollama-cloud":
        env_value = os.getenv("OLLAMA_CLOUD_MODELS")
        if env_value:
            return [m.strip() for m in env_value.split(",") if m.strip()]
        return list_ollama_cloud_models()

    if provider == "ollama":
        value = os.getenv("OLLAMA_MODELS")
        if not value:
            value = ",".join([
                    "llama3.2:latest",
                    "phi4:latest",
                    "deepseek-r1:14b",
                    "gemma3:27b",
                    "qwen2.5-coder:32b",
                ])
        return [m.strip() for m in value.split(",") if m.strip()]

    env_value = os.getenv("MODELS")
    if env_value:
        return [m.strip() for m in env_value.split(",") if m.strip()]

    # Updated 2026-04: Version pairs (latest + previous) for temporal regression analysis.
    # Each provider has its newest flagship plus the prior version for comparison.
    # Removed 4 models that produced 0/40 scored results in v0.1 run:
    #   microsoft/phi-4, nousresearch/hermes-4-70b, liquid/lfm-2-24b-a2b, perplexity/sonar-reasoning-pro
    value = ",".join([
        # --- OpenAI ---
        "openai/gpt-5.4",                     # Latest flagship (2026)
        "openai/gpt-5",                        # Previous flagship (v0.1 baseline)

        # --- Anthropic ---
        "anthropic/claude-sonnet-4.6",         # Latest Sonnet (2026)
        "anthropic/claude-sonnet-4.5",         # Previous Sonnet (v0.1 baseline)

        # --- Google ---
        "google/gemini-3.1-pro-preview",       # Latest Pro (2026)
        "google/gemini-3.0-pro",               # Previous Pro (v0.1 baseline; was gemini-3.0-pro)

        # --- Meta ---
        "meta-llama/llama-4-maverick",         # Latest flagship (Llama 4)
        "meta-llama/llama-3.3-70b-instruct",   # Previous (v0.1 baseline)

        # --- Mistral ---
        "mistralai/mistral-large-3-2512",      # Latest Large (Dec 2025)
        "mistralai/mistral-large-2411",         # Previous Large (v0.1 baseline, 3 positives)

        # --- Cohere ---
        "cohere/command-r-plus-08-2024",       # Stable (no newer version on OpenRouter)

        # --- Qwen ---
        "qwen/qwen-2.5-72b-instruct",         # Stable (latest large instruct)

        # --- xAI ---
        "x-ai/grok-4.20",                     # Latest flagship (2026)
        "x-ai/grok-4-fast",                    # Previous (v0.1 baseline)

        # --- DeepSeek ---
        "deepseek/deepseek-v3.2",              # Latest (2026)
        "deepseek/deepseek-chat-v3.1",         # Previous

        # --- Amazon ---
        "amazon/nova-premier-v1",              # Stable

    ])
    return [m.strip() for m in value.split(",") if m.strip()]


def parse_attack_ids(cli_attack_ids: str | None = None) -> set[str] | None:
    if not cli_attack_ids:
        return None
    attack_ids = {attack_id.strip() for attack_id in cli_attack_ids.split(",") if attack_id.strip()}
    return attack_ids or None


def filter_attacks(attacks: List[dict], attack_ids: set[str] | None = None) -> List[dict]:
    if not attack_ids:
        return attacks

    available_ids = {attack["attack_id"] for attack in attacks}
    missing_ids = sorted(attack_ids.difference(available_ids))
    if missing_ids:
        raise ValueError(f"Unknown attack_id values: {', '.join(missing_ids)}")

    return [attack for attack in attacks if attack["attack_id"] in attack_ids]


def write_csv(rows: List[dict], csv_path: Path) -> None:
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "attack_id",
        "campaign_id",
        "family",
        "phase",
        "scenario_type",
        "model",
        "provider",
        "cohort_label",
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
        writer = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "attack_id": row["attack_id"],
                    "campaign_id": row["campaign_id"],
                    "family": row["family"],
                    "phase": row["phase"],
                    "scenario_type": row["scenario_type"],
                    "model": row["model"],
                    "provider": row.get("provider"),
                    "cohort_label": row.get("cohort_label"),
                    "status": row["status"],
                    "error_type": row["error_type"],
                    "prompt": row["prompt"],
                    "output": row["output"],
                    **row["flags"],
                }
            )


def _base_error_row(
    attack: dict,
    model: str,
    status: str,
    error_type: str,
    output: str,
    provider: str | None = None,
    cohort_label: str | None = None,
) -> dict:
    return {
        "attack_id": attack.get("attack_id"),
        "campaign_id": attack.get("campaign_id"),
        "family": attack.get("family"),
        "phase": attack.get("phase"),
        "scenario_type": attack.get("scenario_type"),
        "model": model,
        "provider": provider,
        "cohort_label": cohort_label,
        "status": status,
        "error_type": error_type,
        "prompt": "",
        "output": output,
        "flags": {
            "refusal_detected": False,
            "unsafe_instruction_adopted": False,
            "unsafe_tool_call_proposed": False,
            "secret_disclosure_claimed": False,
            "policy_violation": False
        },
    }


def _model_alias(model: str) -> str:
    return {
        "anthropic/claude-4.5-haiku": "anthropic/claude-opus-4.5",
        "google/gemini-3.0-pro": "google/gemini-3-pro-preview",
        "google/gemini-3.1-pro": "google/gemini-3.1-pro-preview",
    }.get(model, model)


def _run_attack_single(attack: dict, model: str, engine: ScenarioEngine, adapter, args) -> dict:
    if args.dry_run:
        completion = lambda _m, _p: GenerationResult(f"model={model}; simulated_response=refusal; no_action_taken", [])
    else:
        completion = adapter.generate

    try:
        api_model = _model_alias(model) if args.provider == "openrouter" else model

        local_exec = concurrent.futures.ThreadPoolExecutor(max_workers=1)
        future = local_exec.submit(engine.execute, attack, api_model, completion)
        try:
            result = future.result(timeout=args.per_attack_timeout)
        finally:
            local_exec.shutdown(wait=False)

        result.model = model  # Restore original name for consistency in logs and UI

        print(f"[{model}] Processed attack {attack.get('attack_id')} -> unsafe={result.flags.get('unsafe_instruction_adopted')}", flush=True)
        return {
            "attack_id": result.attack_id,
            "campaign_id": result.campaign_id,
            "family": attack.get("family"),
            "phase": attack.get("phase"),
            "scenario_type": attack.get("scenario_type"),
            "model": result.model,
            "provider": args.provider,
            "cohort_label": args.run_label,
            "status": "scored",
            "error_type": None,
            "prompt": result.prompt,
            "output": result.output,
            "flags": result.flags,
        }
    except concurrent.futures.TimeoutError:
        print(f"[{model}] TIMEOUT processing attack {attack.get('attack_id')}", flush=True)
        return _base_error_row(
            attack,
            model,
            "timed_out",
            "TimeoutError",
            f"API Error: Timeout after {args.per_attack_timeout} seconds",
            args.provider,
            args.run_label,
        )
    except Exception as e:
        print(f"[{model}] Failed to process attack {attack.get('attack_id')}: {e}", flush=True)
        return _base_error_row(attack, model, "api_error", type(e).__name__, f"API Error: {e}", args.provider, args.run_label)


def campaign_groups(attacks: List[dict]) -> "OrderedDict[str, List[dict]]":
    groups: "OrderedDict[str, List[dict]]" = OrderedDict()
    for attack in attacks:
        groups.setdefault(attack["campaign_id"], []).append(attack)
    return groups


def _run_model(attacks: List[dict], model: str, adapter, args) -> List[dict]:
    rows: List[dict] = []
    for _campaign_id, campaign_attacks in campaign_groups(attacks).items():
        engine = ScenarioEngine(judge_mode=args.judge_mode, system_prompt=args.system_prompt)
        for attack in campaign_attacks:
            row = _run_attack_single(attack, model, engine, adapter, args)
            rows.append(row)
            if row["status"] != "scored":
                engine = ScenarioEngine(judge_mode=args.judge_mode, system_prompt=args.system_prompt)
    return rows


def git_commit() -> str | None:
    try:
        return subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    except Exception:
        return None


def status_counts(rows: List[dict]) -> Dict[str, int]:
    return {
        "scored": sum(1 for r in rows if r["status"] == "scored"),
        "timed_out": sum(1 for r in rows if r["status"] == "timed_out"),
        "api_error": sum(1 for r in rows if r["status"] == "api_error"),
        "attempted": len(rows),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run AgentKillChain benchmark harness")
    parser.add_argument("--dry-run", action="store_true", help="Skip API calls and use deterministic outputs")
    parser.add_argument("--provider", choices=["openrouter", "ollama", "ollama-cloud"], default=os.getenv("AKC_PROVIDER", "openrouter"))
    parser.add_argument("--models", help="Comma-separated model list. Overrides MODELS/OLLAMA_MODELS/defaults.")
    parser.add_argument("--attack-ids", help="Comma-separated attack_id filter for targeted reruns.")
    parser.add_argument("--judge-mode", choices=["llm", "heuristic"], default=None)
    parser.add_argument("--system-prompt", default=None)
    parser.add_argument("--max-workers", type=int, default=None)
    parser.add_argument("--per-attack-timeout", type=int, default=int(os.getenv("AKC_PER_ATTACK_TIMEOUT", "120")))
    parser.add_argument("--run-label", default=os.getenv("AKC_RUN_LABEL", "first-local-release"))
    parser.add_argument("--output-json", default=str(RESULTS_PATH), help="Results JSON path")
    parser.add_argument("--output-csv", default=str(RESULTS_CSV_PATH), help="Results CSV path")
    args = parser.parse_args()

    load_env(ROOT / ".env")
    attacks = filter_attacks(load_attacks(), parse_attack_ids(args.attack_ids))
    models = parse_models(args.provider, args.models)
    if args.judge_mode is None:
        args.judge_mode = "heuristic" if args.provider in {"ollama", "ollama-cloud"} or args.dry_run else "llm"
    if args.system_prompt is None:
        args.system_prompt = os.getenv("AGENT_SYSTEM_PROMPT", DEFAULT_SYSTEM_PROMPT)

    adapter = None if args.dry_run else build_adapter(args.provider)
    rows = []

    max_workers = args.max_workers
    if max_workers is None:
        if args.provider == "ollama":
            max_workers = 1
        elif args.provider == "ollama-cloud":
            max_workers = min(4, len(models))
        else:
            max_workers = min(40, len(models))

    executor = concurrent.futures.ThreadPoolExecutor(max_workers=max_workers)
    futures = [executor.submit(_run_model, attacks, model, adapter, args) for model in models]
    for future in concurrent.futures.as_completed(futures):
        rows.extend(future.result())
    
    # Do not use 'with' block to avoid hanging on shutdown if threads are deadlocked.
    executor.shutdown(wait=False)

    metrics = evaluate(rows)
    by_model = summarize_by_model(rows)
    
    import datetime
    run_timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    counts = status_counts(rows)

    output = {
        "metadata": {
            "benchmark_version": "1.0.0-local" if args.provider != "ollama-cloud" else "1.0.0-ollama-cloud",
            "run_label": args.run_label,
            "run_timestamp": run_timestamp,
            "git_commit": git_commit(),
            "provider": args.provider,
            "judge_mode": args.judge_mode,
            "system_prompt_configured": bool(args.system_prompt),
            "dry_run": args.dry_run,
            "models_requested": models,
            "models_total": len(models),
            "attacks_total": len(attacks),
            "campaigns_total": len(campaign_groups(attacks)),
            "attempted_count": counts["attempted"],
            "expected_count": len(models) * len(attacks),
            "scored_count": counts["scored"],
            "timeout_count": counts["timed_out"],
            "error_count": counts["api_error"],
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
