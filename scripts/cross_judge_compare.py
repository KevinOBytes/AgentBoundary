#!/usr/bin/env python3
"""Compare v2.2 (gpt-4o-mini judge) vs v2.3 (gpt-5.4 judge) on the same 552 entries.
Computes Cohen's Kappa for inter-judge agreement.

Usage:
    python3 scripts/cross_judge_compare.py results/v2_2_eval_20260528_final.jsonl results/v2_3_rejudged.jsonl
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from collections import Counter


def cohens_kappa(a: list[bool], b: list[bool]) -> float:
    """Compute Cohen's Kappa for binary agreement."""
    n = len(a)
    if n == 0:
        return 0.0

    # Observed agreement
    po = sum(1 for x, y in zip(a, b) if x == y) / n

    # Expected agreement by chance
    pa = sum(a) / n  # Proportion positive in a
    pb = sum(b) / n  # Proportion positive in b
    pe = pa * pb + (1 - pa) * (1 - pb)

    if pe == 1.0:
        return 1.0 if po == 1.0 else 0.0

    kappa = (po - pe) / (1 - pe)
    return kappa


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("v22_file", help="v2.2 results JSONL")
    p.add_argument("v23_file", help="v2.3 re-judged results JSONL")
    p.add_argument("--output", default="results/cross_judge_compare.json")
    args = p.parse_args()

    v22_entries: dict[str, dict] = {}
    with open(args.v22_file) as f:
        for line in f:
            if line.strip():
                e = json.loads(line)
                key = f"{e['attack_id']}::{e['model']}"
                v22_entries[key] = e

    v23_entries: dict[str, dict] = {}
    with open(args.v23_file) as f:
        for line in f:
            if line.strip():
                e = json.loads(line)
                key = f"{e['attack_id']}::{e['model']}"
                v23_entries[key] = e

    # Find common keys
    common = sorted(set(v22_entries.keys()) & set(v23_entries.keys()))
    print(f"Common entries: {len(common)} (v22: {len(v22_entries)}, v23: {len(v23_entries)})")

    if len(common) == 0:
        print("ERROR: No common entries found!")
        return 1

    v22_ref = []
    v23_ref = []
    v22_comp = []
    v23_comp = []

    changes = []
    for key in common:
        v22 = v22_entries[key]
        v23 = v23_entries[key]

        v22_ref.append(v22["refusal_detected"])
        v23_ref.append(v23["refusal_detected"])
        v22_comp.append(v22["compliance_detected"])
        v23_comp.append(v23["compliance_detected"])

        # Track significant changes
        if v22["refusal_detected"] != v23["refusal_detected"] or v22["compliance_detected"] != v23["compliance_detected"]:
            changes.append({
                "key": key,
                "v22_refusal": v22["refusal_detected"],
                "v23_refusal": v23["refusal_detected"],
                "v22_compliance": v22["compliance_detected"],
                "v23_compliance": v23["compliance_detected"],
                "v22_reason": v22.get("judge_reasoning", "")[:100],
                "v23_reason": v23.get("judge_reasoning", "")[:100],
            })

    kappa_ref = cohens_kappa(v22_ref, v23_ref)
    kappa_comp = cohens_kappa(v22_comp, v23_comp)

    # Combined agreement (only when both match)
    combined_agree = sum(
        1 for i in range(len(common))
        if v22_ref[i] == v23_ref[i] and v22_comp[i] == v23_comp[i]
    ) / len(common)

    print(f"\n=== Inter-Judge Agreement (v2.2 gpt-4o-mini vs v2.3 gpt-5.4) ===")
    print(f"Refusal    κ = {kappa_ref:.3f}")
    print(f"Compliance κ = {kappa_comp:.3f}")
    print(f"Combined agreement (both labels match) = {combined_agree:.1%}")
    print(f"Entries with changed verdicts: {len(changes)}/{len(common)} ({len(changes)/len(common)*100:.1f}%)")

    # Per-verdict breakdown
    v22_ref_true = sum(v22_ref)
    v23_ref_true = sum(v23_ref)
    v22_comp_true = sum(v22_comp)
    v23_comp_true = sum(v23_comp)

    print(f"\nRefusal rates:")
    print(f"  v2.2 (gpt-4o-mini): {v22_ref_true}/{len(common)} = {v22_ref_true/len(common)*100:.1f}%")
    print(f"  v2.3 (gpt-5.4):     {v23_ref_true}/{len(common)} = {v23_ref_true/len(common)*100:.1f}%")

    print(f"\nCompliance rates:")
    print(f"  v2.2 (gpt-4o-mini): {v22_comp_true}/{len(common)} = {v22_comp_true/len(common)*100:.1f}%")
    print(f"  v2.3 (gpt-5.4):     {v23_comp_true}/{len(common)} = {v23_comp_true/len(common)*100:.1f}%")

    # Per-model breakdown for changes
    model_changes: dict[str, int] = Counter()
    for c in changes:
        model = c["key"].split("::")[1]
        model_changes[model] += 1

    print(f"\nChanges per model:")
    for model, count in model_changes.most_common():
        pct = count / sum(1 for k in common if k.split("::")[1] == model) * 100
        print(f"  {model}: {count} changed ({pct:.1f}% of its entries)")

    # Save
    result = {
        "v22_judge": "gpt-4o-mini",
        "v23_judge": "gpt-5.4",
        "total_entries": len(common),
        "refusal_kappa": kappa_ref,
        "compliance_kappa": kappa_comp,
        "combined_agreement": combined_agree,
        "changes_count": len(changes),
        "changes": changes[:50],  # First 50 for inspection
        "per_model_changes": dict(model_changes.most_common()),
    }

    with open(args.output, "w") as f:
        json.dump(result, f, indent=2)
    print(f"\nSaved detailed comparison to {args.output}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
