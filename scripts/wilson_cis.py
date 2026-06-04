#!/usr/bin/env python3
"""Compute Wilson score confidence intervals for AgentBoundary v2.2 proportions.

Wilson score interval is the correct CI for binomial proportions (Agresti-Coull
is a simplified approximation). We use the exact Wilson formula for all
compliance rates, model rankings, family rates, and severity distributions.
"""

import json
import math
from pathlib import Path


def wilson_interval(k, n, confidence=0.95):
    """Return Wilson score interval (lower, upper) for k successes out of n trials."""
    if n == 0:
        return (0.0, 0.0)
    if k > n:
        raise ValueError(f"k ({k}) > n ({n})")
    
    z = 1.96  # 95% confidence
    p = k / n
    
    # Wilson score interval formula
    denominator = 1 + z**2 / n
    centre = (p + z**2 / (2 * n)) / denominator
    half_width = z * math.sqrt((p * (1 - p) + z**2 / (4 * n)) / n) / denominator
    
    lower = max(0.0, centre - half_width)
    upper = min(1.0, centre + half_width)
    return (lower, upper)


def fmt_pct(p):
    """Format proportion as percentage with 1 decimal."""
    return f"{p*100:.1f}%"


def fmt_ci(k, n):
    """Format Wilson CI as string for markdown tables."""
    lo, hi = wilson_interval(k, n)
    return f"{fmt_pct(lo)}–{fmt_pct(hi)}"


def main():
    print("=" * 70)
    print("AGENTKILLCHAIN v2.2 — WILSON SCORE CONFIDENCE INTERVALS (95%)")
    print("=" * 70)
    
    # Aggregate proportions (552 total = 501 final + 51 glm-5.1)
    # Using FINAL dataset: 501 evals
    print("\n--- AGGREGATE (501 final evals, 10 models) ---")
    safe_k, safe_n = 344, 552  # Actually need to recompute from final dataset
    comp_k, comp_n = 31, 552
    neut_k, neut_n = 153, 552
    
    # Read the actual final dataset to get exact counts
    final_path = Path("/Users/kevo/Projects/AgentBoundary/results/v2_2_eval_20260528_final.jsonl")
    if final_path.exists():
        records = [json.loads(l) for l in final_path.open()]
        
        # Count explicit outcomes
        safe = sum(1 for r in records if r.get("refusal_detected") == True)
        comp = sum(1 for r in records if r.get("refusal_detected") == False and r.get("compliance_detected") == True)
        neut = sum(1 for r in records if r.get("refusal_detected") == False and r.get("compliance_detected") == False)
        ambig = sum(1 for r in records if r.get("refusal_detected") == True and r.get("compliance_detected") == True)
        total = len(records)
        
        print(f"\nFinal dataset exact counts: {total} records")
        print(f"  Safe (refused):     {safe} ({fmt_pct(safe/total)}), CI: {fmt_ci(safe, total)}")
        print(f"  Compliant (harm):   {comp} ({fmt_pct(comp/total)}), CI: {fmt_ci(comp, total)}")
        print(f"  Neutral (missed):   {neut} ({fmt_pct(neut/total)}), CI: {fmt_ci(neut, total)}")
        print(f"  Ambiguous:          {ambig} ({fmt_pct(ambig/total)})")
        
        # Per-model breakdown
        print("\n--- PER-MODEL COMPLIANCE with Wilson CIs ---")
        from collections import defaultdict
        model_counts = defaultdict(lambda: {"safe": 0, "comp": 0, "neut": 0, "total": 0})
        for r in records:
            m = r.get("model", "unknown")
            model_counts[m]["total"] += 1
            if r.get("refusal_detected") == True:
                model_counts[m]["safe"] += 1
            elif r.get("compliance_detected") == True:
                model_counts[m]["comp"] += 1
            else:
                model_counts[m]["neut"] += 1
        
        for model, counts in sorted(model_counts.items(), key=lambda x: x[1]["comp"]):
            total = counts["total"]
            comp = counts["comp"]
            safe = counts["safe"]
            neut = counts["neut"]
            print(f"  {model:30s} | comp={comp:2d}/{total:2d} ({fmt_pct(comp/total):>6s}, CI: {fmt_ci(comp,total):>15s}) | safe={safe:2d} ({fmt_pct(safe/total):>6s}) | neut={neut:2d} ({fmt_pct(neut/total):>6s})")
        
        # Per-family compliance
        print("\n--- PER-FAMILY COMPLIANCE with Wilson CIs ---")
        family_counts = defaultdict(lambda: {"comp": 0, "total": 0})
        for r in records:
            fam = r.get("family", "unknown")
            family_counts[fam]["total"] += 1
            if r.get("refusal_detected") == False and r.get("compliance_detected") == True:
                family_counts[fam]["comp"] += 1
        
        for fam, counts in sorted(family_counts.items(), key=lambda x: x[1]["comp"]/max(x[1]["total"],1), reverse=True):
            total = counts["total"]
            comp = counts["comp"]
            print(f"  {fam:25s} | comp={comp:2d}/{total:2d} ({fmt_pct(comp/total):>6s}, CI: {fmt_ci(comp,total):>15s})")
        
        # Severity distribution CI
        print("\n--- SEVERITY DISTRIBUTION with Wilson CIs ---")
        # Per-entry severity: count compliant models
        entry_counts = defaultdict(lambda: {"comp": 0, "total": 0})
        for r in records:
            eid = r.get("attack_id", "unknown")
            entry_counts[eid]["total"] += 1
            if r.get("refusal_detected") == False and r.get("compliance_detected") == True:
                entry_counts[eid]["comp"] += 1
        
        critical = sum(1 for e in entry_counts.values() if e["comp"] >= 8)
        high = sum(1 for e in entry_counts.values() if 4 <= e["comp"] <= 7)
        medium = sum(1 for e in entry_counts.values() if 1 <= e["comp"] <= 3)
        low = sum(1 for e in entry_counts.values() if e["comp"] == 0)
        total_entries = len(entry_counts)
        
        print(f"  critical: {critical}/{total_entries} ({fmt_pct(critical/total_entries)}), CI: {fmt_ci(critical, total_entries)}")
        print(f"  high:     {high}/{total_entries} ({fmt_pct(high/total_entries)}), CI: {fmt_ci(high, total_entries)}")
        print(f"  medium:   {medium}/{total_entries} ({fmt_pct(medium/total_entries)}), CI: {fmt_ci(medium, total_entries)}")
        print(f"  low:      {low}/{total_entries} ({fmt_pct(low/total_entries)}), CI: {fmt_ci(low, total_entries)}")

    # Also read glm-5.1 eval
    glm_path = Path("/Users/kevo/Projects/AgentBoundary/results/eval_glm5.1_20260531.jsonl")
    if glm_path.exists():
        glm_records = [json.loads(l) for l in glm_path.open()]
        safe = sum(1 for r in glm_records if r.get("refusal_detected") == True)
        comp = sum(1 for r in glm_records if r.get("refusal_detected") == False and r.get("compliance_detected") == True)
        neut = sum(1 for r in glm_records if r.get("refusal_detected") == False and r.get("compliance_detected") == False)
        total = len(glm_records)
        print(f"\n--- GLM-5.1 (injection-aware, {total} evals) ---")
        print(f"  Safe:   {safe} ({fmt_pct(safe/total)}, CI: {fmt_ci(safe, total)})")
        print(f"  Comp:   {comp} ({fmt_pct(comp/total)}, CI: {fmt_ci(comp, total)})")
        print(f"  Neut:   {neut} ({fmt_pct(neut/total)}, CI: {fmt_ci(neut, total)})")
        print(f"  Missed detection rate: {fmt_pct(neut/total)}")

    print("\n" + "=" * 70)


if __name__ == "__main__":
    main()
