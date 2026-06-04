#!/usr/bin/env python3
"""
AgentBoundary — Single-model evaluation against ollama-cloud.
Runs full attack catalog against one ollama-cloud model using
OpenAI-compatible endpoint.

Usage:
    export OLLAMA_API_KEY=...
    python3 eval_ollama.py --model glm-5.1 --output results/eval_glm5.1_20260531.jsonl
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import asdict
from pathlib import Path

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

OLLAMA_BASE_URL = "https://ollama.com/v1"


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Evaluate one ollama-cloud model against full catalog")
    p.add_argument("--catalog", default="dataset/attack_catalog.json")
    p.add_argument("--model", required=True)
    p.add_argument("--output", required=True)
    p.add_argument("--judge-model", default=DEFAULT_JUDGE_MODEL)
    p.add_argument("--system-prompt", default=DEFAULT_SYSTEM_PROMPT)
    p.add_argument("--api-key", default=os.getenv("OLLAMA_API_KEY", ""))
    p.add_argument("--base-url", default=OLLAMA_BASE_URL)
    args = p.parse_args(argv)

    if not args.api_key:
        print("Error: OLLAMA_API_KEY not set")
        return 1

    with open(args.catalog) as f:
        catalog = json.load(f)

    # Resume support
    out_path = Path(args.output)
    done: set[str] = set()
    if out_path.exists():
        with open(out_path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    if obj.get("model") == args.model and not obj.get("error"):
                        done.add(obj["attack_id"])
                except json.JSONDecodeError:
                    continue

    remaining = [a for a in catalog if a["attack_id"] not in done]
    total = len(remaining)
    if total == 0:
        print(f"All {len(done)} attacks already evaluated for {args.model}.")
        return 0

    client = OpenRouterClient(api_key=args.api_key, base_url=args.base_url)
    print(f"Evaluating {args.model} against {total} attacks (resume skipped {len(done)})")

    with open(out_path, "a") as out_f:
        for i, attack in enumerate(remaining, 1):
            prompt_msgs = build_prompt(attack, args.system_prompt)
            prompt_text = json.dumps(prompt_msgs, ensure_ascii=False)

            start = time.perf_counter()
            try:
                response = client.complete(args.model, prompt_msgs, temperature=0.0, max_tokens=2048)
                error = None
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
                    refusal, refusal_reason = judge_refusal(prompt_text, response, client, args.judge_model)
                    comp, comp_reason = judge_compliance(
                        attack.get("expected_failure_mode", ""), response, client, args.judge_model
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
                model=args.model,
                prompt=prompt_text[:8000],
                response=response[:8000],
                refusal_detected=refusal,
                compliance_detected=compliance,
                judge_reasoning=reasoning,
                latency_ms=round(latency, 2),
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                error=error,
            )

            out_f.write(json.dumps(asdict(result), ensure_ascii=False) + "\n")
            out_f.flush()

            status = "REFUSED" if refusal else ("COMPLIED" if compliance else "NEUTRAL")
            if error:
                status = f"ERROR: {error[:60]}"
            print(f"[{i}/{total}] {attack['attack_id']} -> {status} ({latency:.0f}ms)")
            time.sleep(0.5)

    print(f"Done. {total} evaluations written to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
