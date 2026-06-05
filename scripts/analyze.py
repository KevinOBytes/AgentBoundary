#!/usr/bin/env python3
"""Compute v2.3 statistics from re-judged results.

Usage:
    python3 scripts/analyze.py results/v2_3_rejudged.jsonl
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from collections import defaultdict


def wilson_ci(k: int, n: int, z: float = 1.96) -> tuple[float, float, float]:
    """Return Wilson score CI (p, lower, upper) for k successes in n trials."""
    if n == 0:
        return 0.0, 0.0, 0.0
    p = k / n
    denom = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / denom
    margin = z * math.sqrt((p * (1 - p) + z * z / (4 * n)) / n) / denom
    return p, max(0.0, centre - margin), min(1.0, centre + margin)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("input_file")
    p.add_argument("--output", default="results/v2_3_stats.json")
    args = p.parse_args()

    entries = []
    with open(args.input_file) as f:
        for line in f:
            if line.strip():
                entries.append(json.loads(line))

    total = len(entries)

    # Overall
    refused = sum(1 for e in entries if e["refusal_detected"])
    complied = sum(1 for e in entries if e["compliance_detected"])
    neutral = total - refused - complied  # approximate; some overlap possible

    r_p, r_lo, r_hi = wilson_ci(refused, total)
    c_p, c_lo, c_hi = wilson_ci(complied, total)

    print(f"=== AgentBoundary v2.3 Statistics (n={total}) ===")
    print(f"\nOverall:")
    print(f"  Refused:    {refused}/{total} = {r_p*100:.1f}% (95% CI: {r_lo*100:.1f}%–{r_hi*100:.1f}%)")
    print(f"  Complied:   {complied}/{total} = {c_p*100:.1f}% (95% CI: {c_lo*100:.1f}%–{c_hi*100:.1f}%)")
    print(f"  Neutral:    {neutral}/{total} = {neutral/total*100:.1f}%")

    # Per-model
    by_model: dict[str, list[dict]] = defaultdict(list)
    for e in entries:
        by_model[e["model"]].append(e)

    print(f"\nPer-model compliance rates:")
    model_stats = []
    for model, items in sorted(by_model.items(), key=lambda x: sum(1 for e in x[1] if e["compliance_detected"]), reverse=True):
        n = len(items)
        ref = sum(1 for e in items if e["refusal_detected"])
        comp = sum(1 for e in items if e["compliance_detected"])
        cp, clo, chi = wilson_ci(comp, n)
        model_stats.append({
            "model": model,
            "n": n,
            "refused": ref,
            "complied": comp,
            "compliance_rate": cp,
            "compliance_ci_low": clo,
            "compliance_ci_high": chi,
            "refusal_rate": ref / n,
        })
        print(f"  {model:40s} {comp:2d}/{n} = {cp*100:5.1f}% [{clo*100:4.1f}–{chi*100:4.1f}%]")

    # Per-family
    by_family: dict[str, list[dict]] = defaultdict(list)
    for e in entries:
        by_family[e.get("family", "unknown")].append(e)

    print(f"\nPer-attack-family compliance:")
    family_stats = []
    for family, items in sorted(by_family.items(), key=lambda x: sum(1 for e in x[1] if e["compliance_detected"]), reverse=True):
        n = len(items)
        comp = sum(1 for e in items if e["compliance_detected"])
        cp, clo, chi = wilson_ci(comp, n)
        family_stats.append({
            "family": family,
            "n": n,
            "complied": comp,
            "compliance_rate": cp,
            "compliance_ci_low": clo,
            "compliance_ci_high": chi,
        })
        print(f"  {family:30s} {comp:2d}/{n} = {cp*100:5.1f}% [{clo*100:4.1f}–{chi*100:4.1f}%]")

    # Save
    result = {
        "total": total,
        "judge": entries[0].get("v23_judge", "unknown") if entries else "unknown",
        "overall": {
            "refused": refused,
            "complied": complied,
            "neutral": neutral,
            "refusal_rate": r_p,
            "refusal_ci_low": r_lo,
            "refusal_ci_high": r_hi,
            "compliance_rate": c_p,
            "compliance_ci_low": c_lo,
            "compliance_ci_high": c_hi,
        },
        "by_model": model_stats,
        "by_family": family_stats,
    }

    with open(args.output, "w") as f:
        json.dump(result, f, indent=2)
    print(f"\nSaved to {args.output}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
