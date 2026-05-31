#!/usr/bin/env python3
"""Cross-judge validation: re-judge a 10% sample with Claude Opus-4.7.

Compares against the original gpt-4o-mini verdicts and computes Cohen's kappa.
"""

import json, os, random, sys, time
from pathlib import Path

# Load .env before importing eval_live (which needs OPENROUTER_API_KEY)
env_path = Path(__file__).with_suffix("").parent / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value

sys.path.insert(0, str(Path(__file__).parent))
from eval_live import OpenRouterClient, judge_refusal, judge_compliance

FINAL_PATH = Path("results/v2_2_eval_20260528_final.jsonl")
CROSS_JUDGE_MODEL = "anthropic/claude-opus-4.7"
SAMPLE_SIZE = 50
SEED = 42

# Load records
records = [json.loads(line) for line in open(FINAL_PATH)]

# Stratified sample: ensure coverage across models and families
models = sorted(set(r["model"] for r in records))
families = sorted(set(r["family"] for r in records))

# Pick 5 entries per model (50 total)
random.seed(SEED)
sample = []
for m in models:
    m_recs = [r for r in records if r["model"] == m]
    n = min(5, len(m_recs))
    picked = random.sample(m_recs, n)
    sample.extend(picked)

# If we have more than 50, trim randomly; if less, supplement
if len(sample) > SAMPLE_SIZE:
    sample = random.sample(sample, SAMPLE_SIZE)
elif len(sample) < SAMPLE_SIZE:
    remaining = [r for r in records if r not in sample]
    needed = SAMPLE_SIZE - len(sample)
    sample.extend(random.sample(remaining, needed))

print(f"Cross-judge sample: {len(sample)} entries across {len(set(r['model'] for r in sample))} models and {len(set(r['family'] for r in sample))} families")

client = OpenRouterClient()

# Containers for comparison
refusal_agreement = []
compliance_agreement = []
overlaps = []

for i, rec in enumerate(sample):
    print(f"\n[{i+1}/{len(sample)}] {rec['model']} | {rec['attack_id']}")
    prompt_text = rec["prompt"]
    response_text = rec["response"]
    expected = rec.get("expected_failure_mode", "")
    
    # Original verdicts
    orig_refusal = rec.get("refusal_detected", False)
    orig_compliance = rec.get("compliance_detected", False)
    
    # Re-judge with Claude Opus-4.7
    try:
        new_refusal, refusal_reason = judge_refusal(prompt_text, response_text, client, CROSS_JUDGE_MODEL)
    except Exception as e:
        print(f"  Refusal judge error: {e}")
        new_refusal = orig_refusal  # fallback to original
        refusal_reason = "ERROR"
    
    time.sleep(0.5)
    
    try:
        new_compliance, compliance_reason = judge_compliance(expected, response_text, client, CROSS_JUDGE_MODEL)
    except Exception as e:
        print(f"  Compliance judge error: {e}")
        new_compliance = orig_compliance
        compliance_reason = "ERROR"
    
    time.sleep(0.5)
    
    refusal_agreement.append((orig_refusal, new_refusal))
    compliance_agreement.append((orig_compliance, new_compliance))
    overlaps.append({
        "model": rec["model"],
        "attack_id": rec["attack_id"],
        "family": rec["family"],
        "orig_refusal": orig_refusal,
        "new_refusal": new_refusal,
        "orig_compliance": orig_compliance,
        "new_compliance": new_compliance,
        "refusal_reason": refusal_reason,
        "compliance_reason": compliance_reason,
    })
    
    r_match = "✓" if orig_refusal == new_refusal else "✗"
    c_match = "✓" if orig_compliance == new_compliance else "✗"
    print(f"  Refusal:  orig={orig_refusal} new={new_refusal} {r_match}")
    print(f"  Compliance: orig={orig_compliance} new={new_compliance} {c_match}")

# Compute Cohen's kappa
from collections import Counter

def cohen_kappa(pairs):
    n = len(pairs)
    if n == 0:
        return 0.0
    # Observed agreement
    agree = sum(1 for a, b in pairs if a == b)
    p_o = agree / n
    
    # Expected agreement (by chance)
    a_counts = Counter(a for a, b in pairs)
    b_counts = Counter(b for a, b in pairs)
    p_e = sum(a_counts.get(k, 0) * b_counts.get(k, 0) for k in set(list(a_counts.keys()) + list(b_counts.keys()))) / (n * n)
    
    if p_e >= 1.0:
        return 1.0 if p_o == 1.0 else 0.0
    
    kappa = (p_o - p_e) / (1 - p_e)
    return kappa

r_kappa = cohen_kappa(refusal_agreement)
c_kappa = cohen_kappa(compliance_agreement)

# Combined verdict (clear compliance = refusal=False AND compliance=True)
def verdict(refusal, compliance):
    if refusal and not compliance:
        return "refused"
    if compliance and not refusal:
        return "complied"
    if not refusal and not compliance:
        return "neutral"
    return "ambiguous"

orig_verdicts = [verdict(r, c) for r, c in refusal_agreement]
new_verdicts = [verdict(r, c) for r, c in zip([p[1] for p in refusal_agreement], [p[1] for p in compliance_agreement])]
# Actually we need to zip correctly
orig_v = [verdict(r, c) for r, c in zip([p[0] for p in refusal_agreement], [p[0] for p in compliance_agreement])]
new_v = [verdict(r, c) for r, c in zip([p[1] for p in refusal_agreement], [p[1] for p in compliance_agreement])]

v_pairs = list(zip(orig_v, new_v))
v_kappa = cohen_kappa(v_pairs)

print(f"\n{'='*60}")
print(f"COHEN'S KAPPA RESULTS (n={len(sample)})")
print(f"{'='*60}")
print(f"  Refusal detection:      κ = {r_kappa:.3f}")
print(f"  Compliance detection:   κ = {c_kappa:.3f}")
print(f"  Combined verdict:       κ = {v_kappa:.3f}")
print(f"\n  Interpretation:")
print(f"    κ < 0.20        — Slight agreement")
print(f"    0.21 – 0.40     — Fair agreement")
print(f"    0.41 – 0.60     — Moderate agreement")
print(f"    0.61 – 0.80     — Substantial agreement")
print(f"    0.81 – 1.00     — Almost perfect agreement")

# Save results
out = {
    "sample_size": len(sample),
    "seed": SEED,
    "judge_models": {"original": "openai/gpt-4o-mini", "cross": CROSS_JUDGE_MODEL},
    "cohen_kappa": {
        "refusal": round(r_kappa, 4),
        "compliance": round(c_kappa, 4),
        "combined_verdict": round(v_kappa, 4),
    },
    "entries": overlaps,
}

out_path = Path("results/cross_judge_20260531.json")
with open(out_path, 'w') as f:
    json.dump(out, f, indent=2)
print(f"\nSaved detailed results to {out_path}")

# Disagreement summary
print(f"\nDisagreement breakdown:")
for label, pairs in [("Refusal", refusal_agreement), ("Compliance", compliance_agreement), ("Verdict", v_pairs)]:
    disagree = [(i+1, a, b) for i, (a, b) in enumerate(pairs) if a != b]
    print(f"  {label}: {len(disagree)}/{len(pairs)} disagreements")
    for idx, a, b in disagree[:5]:
        entry = overlaps[idx-1]
        print(f"    [{idx}] {entry['model']} {entry['attack_id']}: orig={a} new={b}")
