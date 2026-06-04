#!/usr/bin/env python3
"""
AgentBoundary parallel evaluation runner.
Spawns one worker per model. Each worker resumes from the shared JSONL,
runs remaining attacks for its assigned model, and appends results with
file locking (fcntl) for safe concurrent writes.

Usage:
    PYTHONUNBUFFERED=1 python3 eval_parallel.py \
        --models openai/gpt-5-pro anthropic/claude-opus-4.7 ... \
        --output results/v2_2_eval_20260528.jsonl \
        --workers 10
"""
from __future__ import annotations

import argparse
import json
import multiprocessing
import os
import sys
import time
import fcntl
from dataclasses import asdict
from pathlib import Path
from typing import Any

# Load .env at module scope so multiprocessing workers get the API key
_env_path = Path(__file__).with_suffix("").parent / ".env"
if _env_path.exists():
    with open(_env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from eval_live import (
    OpenRouterClient,
    judge_refusal,
    judge_compliance,
    build_prompt,
    EvalResult,
    DEFAULT_JUDGE_MODEL,
    DEFAULT_SYSTEM_PROMPT,
)


def append_locked(path: Path, obj: dict) -> None:
    """Append a JSON line to a shared file using advisory locking."""
    with open(path, "a") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")
        f.flush()
        fcntl.flock(f, fcntl.LOCK_UN)


def worker(args: tuple) -> dict:
    model, catalog_path, global_jsonl, judge_model, system_prompt = args

    with open(catalog_path) as f:
        catalog = json.load(f)

    # Resume: read global JSONL for entries already done for THIS model
    done: set[str] = set()
    jsonl_path = Path(global_jsonl)
    if jsonl_path.exists():
        with open(jsonl_path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if obj.get("model") == model and not obj.get("error"):
                    done.add(obj["attack_id"])

    remaining = [a for a in catalog if a["attack_id"] not in done]
    total = len(remaining)
    if total == 0:
        print(f"[{model}] All {len(done)} attacks already evaluated. Nothing to do.")
        return {"model": model, "done": 0}

    client = OpenRouterClient()
    completed = 0
    print(f"[{model}] Starting {total} remaining attacks (resume skipped {len(done)})")

    for attack in remaining:
        prompt_msgs = build_prompt(attack, system_prompt)
        prompt_text = json.dumps(prompt_msgs, ensure_ascii=False)

        start = time.perf_counter()
        try:
            response = client.complete(model, prompt_msgs, temperature=0.0, max_tokens=2048)
            error: str | None = None
        except Exception as e:
            response = ""
            error = str(e)

        latency = (time.perf_counter() - start) * 1000
        if response is None:
            response = ""
            error = error or "Empty model response (None)"

        refusal = False
        compliance = False
        reasoning = ""
        if not error:
            try:
                refusal, refusal_reason = judge_refusal(prompt_text, response, client, judge_model)
                comp, comp_reason = judge_compliance(
                    attack.get("expected_failure_mode", ""), response, client, judge_model
                )
                compliance = comp
                reasoning = f"Refusal: {refusal_reason} | Compliance: {comp_reason}"
            except Exception as e:
                reasoning = f"Judge error: {e}"

        result = EvalResult(
            attack_id=attack["attack_id"],
            campaign_id=attack.get("campaign_id", ""),
            family=attack.get("family", ""),
            scenario_type=attack.get("scenario_type", ""),
            attacker_goal=attack.get("attacker_goal", ""),
            expected_failure_mode=attack.get("expected_failure_mode", ""),
            severity=attack.get("severity", ""),
            model=model,
            prompt=prompt_text[:8000],
            response=response[:8000],
            refusal_detected=refusal,
            compliance_detected=compliance,
            judge_reasoning=reasoning,
            latency_ms=round(latency, 2),
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            error=error,
        )

        append_locked(jsonl_path, asdict(result))
        completed += 1

        status = "REFUSED" if refusal else ("COMPLIED" if compliance else "NEUTRAL")
        if error:
            status = f"ERROR: {error[:60]}"
        print(f"[{model} {completed}/{total}] {attack['attack_id']} -> {status} ({latency:.0f}ms)")
        time.sleep(0.5)

    print(f"[{model}] Done. {completed} evaluations appended.")
    return {"model": model, "done": completed}


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="AgentBoundary parallel evaluation runner")
    p.add_argument("--catalog", default="dataset/attack_catalog.json")
    p.add_argument(
        "--models",
        nargs="+",
        default=[
            "openai/gpt-5-pro",
            "anthropic/claude-opus-4.7",
            "google/gemini-3.5-flash",
            "deepseek/deepseek-v4-pro",
            "meta-llama/llama-4-maverick",
            "openai/gpt-5-mini",
            "deepseek/deepseek-v4-flash",
            "google/gemini-3.1-pro-preview",
            "openai/o3-mini",
            "xiaomi/mimo-v2.5-pro",
        ],
    )
    p.add_argument("--output", default="results/v2_2_eval_20260528.jsonl")
    p.add_argument("--judge-model", default=DEFAULT_JUDGE_MODEL)
    p.add_argument("--system-prompt", default=DEFAULT_SYSTEM_PROMPT)
    p.add_argument(
        "--workers",
        type=int,
        default=None,
        help="Max concurrent model workers (default: number of models)",
    )
    args = p.parse_args(argv)

    models = args.models
    workers = args.workers or min(10, len(models))

    work = [
        (m, args.catalog, args.output, args.judge_model, args.system_prompt)
        for m in models
    ]

    print(f"AgentBoundary parallel eval: {len(models)} models, {workers} workers")
    print(f"Output: {args.output}")
    print("-" * 50)

    with multiprocessing.Pool(processes=workers) as pool:
        results = pool.map(worker, work)

    total_new = sum(r["done"] for r in results)
    print("-" * 50)
    print(f"All workers complete. {total_new} new evaluations appended to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
