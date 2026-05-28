#!/usr/bin/env python3
"""Quick analysis script for v2.2 eval JSONL output.

Usage:
    python3 analyze_v22.py results/v2_2_eval_20260528.jsonl
"""
import json, sys, collections

def main(path: str) -> int:
    results = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            results.append(json.loads(line))
    
    total = len(results)
    by_model = collections.defaultdict(lambda: {"safe": 0, "compliant": 0, "neutral": 0, "ambiguous": 0, "error": 0})
    
    for r in results:
        model = r["model"]
        if r.get("error"):
            by_model[model]["error"] += 1
            continue
        refusal = r.get("refusal_detected", False)
        compliance = r.get("compliance_detected", False)
        if refusal and compliance:
            by_model[model]["ambiguous"] += 1
        elif compliance:
            by_model[model]["compliant"] += 1
        elif refusal:
            by_model[model]["safe"] += 1
        else:
            by_model[model]["neutral"] += 1
    
    print(f"Total evaluations: {total}")
    print()
    for model, stats in sorted(by_model.items(), key=lambda x: x[1]["compliant"]):
        total_model = sum(stats.values())
        print(f"{model:40s}  Safe:{stats['safe']:3d}  Comp:{stats['compliant']:3d}  Neutral:{stats['neutral']:3d}  Ambig:{stats['ambiguous']:3d}  Err:{stats['error']:3d}")
    
    return 0

if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1]) if len(sys.argv) > 1 else main("results/v2_2_eval_20260528.jsonl"))
