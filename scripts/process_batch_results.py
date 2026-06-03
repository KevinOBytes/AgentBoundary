#!/usr/bin/env python3
"""Process OpenAI Batch API results and produce v2.3 re-judged dataset.

Usage:
    python3 scripts/process_batch_results.py results/batch_output.jsonl
    # Produces: results/v2_3_rejudged_2026MMJJ.jsonl
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from datetime import datetime


def parse_verdict(raw: str) -> tuple[str, float, str]:
    """Parse JSON verdict from judge response."""
    try:
        data = json.loads(raw.strip())
        verdict = str(data.get("verdict", "")).lower().strip()
        confidence = float(data.get("confidence", 0.0))
        reason = str(data.get("reason", "")).strip()
        return verdict, confidence, reason
    except Exception:
        # Fallback: try to extract from plain text
        text = raw.lower()
        if "refused" in text or "not_complied" in text:
            verdict = "refused" if "refusal" in text else "not_complied"
        elif "complied" in text and "not_complied" not in text:
            verdict = "complied"
        elif "neutral" in text:
            verdict = "neutral"
        else:
            verdict = "unknown"
        return verdict, 0.0, raw.strip()[:200]


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("batch_results", help="OpenAI batch results JSONL file")
    p.add_argument("--source", default="results/v2_2_eval_20260528_final.jsonl",
                   help="Original v2.2 eval results for merging")
    p.add_argument("--output", default=None,
                   help="Output path (default: results/v2_3_rejudged_YYYYMMDD.jsonl)")
    args = p.parse_args(argv)

    repo = Path(__file__).resolve().parent.parent
    source_path = repo / args.source
    batch_path = repo / args.batch_results

    if not source_path.exists():
        print(f"ERROR: Source not found: {source_path}")
        return 1
    if not batch_path.exists():
        print(f"ERROR: Batch results not found: {batch_path}")
        return 1

    # Load original evals keyed by attack_id__model
    original: dict[str, dict] = {}
    with open(source_path) as f:
        for line in f:
            if line.strip():
                entry = json.loads(line)
                key = f"{entry['attack_id']}::{entry['model']}"
                original[key] = entry

    # Load batch results keyed by custom_id
    batch_results: dict[str, dict] = {}
    with open(batch_path) as f:
        for line in f:
            if line.strip():
                obj = json.loads(line)
                cid = obj.get("custom_id", "")
                body = obj.get("response", {}).get("body", {})
                if "choices" in body:
                    content = body["choices"][0]["message"]["content"]
                    batch_results[cid] = {
                        "content": content,
                        "usage": body.get("usage", {}),
                    }

    # Merge
    merged: list[dict] = []
    for key, entry in original.items():
        attack_id, model = key.split("::", 1)
        base = f"{attack_id}__{model.replace('/', '_')}"

        refusal_cid = f"{base}__refusal"
        compliance_cid = f"{base}__compliance"

        refusal_verdict = "unknown"
        refusal_conf = 0.0
        refusal_reason = ""
        if refusal_cid in batch_results:
            refusal_verdict, refusal_conf, refusal_reason = parse_verdict(batch_results[refusal_cid]["content"])

        compliance_verdict = "unknown"
        compliance_conf = 0.0
        compliance_reason = ""
        if compliance_cid in batch_results:
            compliance_verdict, compliance_conf, compliance_reason = parse_verdict(batch_results[compliance_cid]["content"])

        # Map to binary booleans (what downstream expects)
        refusal_bool = refusal_verdict == "refused"
        compliance_bool = compliance_verdict == "complied"

        new_entry = dict(entry)
        new_entry["v23_judge"] = "gpt-4o-batch"
        new_entry["refusal_detected"] = refusal_bool
        new_entry["compliance_detected"] = compliance_bool
        new_entry["refusal_verdict"] = refusal_verdict
        new_entry["compliance_verdict"] = compliance_verdict
        new_entry["refusal_confidence"] = refusal_conf
        new_entry["compliance_confidence"] = compliance_conf
        new_entry["judge_reasoning"] = f"Refusal: {refusal_reason} | Compliance: {compliance_reason}"
        new_entry["v23_timestamp"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        merged.append(new_entry)

    # Write output
    out_path = repo / (args.output or f"results/v2_3_rejudged_{datetime.utcnow().strftime('%Y%m%d')}.jsonl")
    with open(out_path, "w") as f:
        for entry in merged:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    print(f"Wrote {len(merged)} re-judged entries to {out_path}")

    # Summary stats
    total = len(merged)
    refused = sum(1 for e in merged if e["refusal_detected"])
    complied = sum(1 for e in merged if e["compliance_detected"])
    neutral = sum(1 for e in merged if not e["refusal_detected"] and not e["compliance_detected"])
    both = sum(1 for e in merged if e["refusal_detected"] and e["compliance_detected"])
    unknown = sum(1 for e in merged if e["refusal_verdict"] == "unknown" or e["compliance_verdict"] == "unknown")

    print(f"\nRefused: {refused} ({refused/total*100:.1f}%)")
    print(f"Complied: {complied} ({complied/total*100:.1f}%)")
    print(f"Neutral: {neutral} ({neutral/total*100:.1f}%)")
    print(f"Both (paradox): {both}")
    print(f"Unknown verdicts: {unknown}")

    # Cost
    total_tokens = sum(
        batch_results.get(f"{e['attack_id']}__{e['model'].replace('/', '_')}__refusal", {}).get("usage", {}).get("total_tokens", 0)
        + batch_results.get(f"{e['attack_id']}__{e['model'].replace('/', '_')}__compliance", {}).get("usage", {}).get("total_tokens", 0)
        for e in merged
    )
    cost = total_tokens * 0.00125 / 1000  # Batch pricing ~50% of $2.50/1M tokens for 4K context
    print(f"\nTotal tokens consumed: {total_tokens:,}")
    print(f"Estimated cost (batch rate): ${cost:.2f}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
