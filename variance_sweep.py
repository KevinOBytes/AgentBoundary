#!/usr/bin/env python3
"""Variance sweep: run rag_poisoning_003 and markdown_injection_006
across all 10 models at temperature 0.0, 0.5, 1.0.

Shows whether compliance is deterministic (temp doesn't matter) or
a sampling tail (higher temp = more compliance).
"""

import json, os, sys, time
from pathlib import Path

# Load .env
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
from eval_live import OpenRouterClient, judge_refusal, judge_compliance, build_prompt, EvalResult, DEFAULT_SYSTEM_PROMPT, DEFAULT_JUDGE_MODEL

client = OpenRouterClient()
judge_model = DEFAULT_JUDGE_MODEL
system_prompt = DEFAULT_SYSTEM_PROMPT

MODELS = [
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
]

ATTACK_IDS = ["rag_poisoning_003", "markdown_injection_006"]
TEMPERATURES = [0.0, 0.5, 1.0]

OUTPUT = Path("results/variance_sweep_20260531.jsonl")

catalog = json.load(open("dataset/attack_catalog.json"))
catalog_by_id = {a["attack_id"]: a for a in catalog}

results = []

for attack_id in ATTACK_IDS:
    attack = catalog_by_id[attack_id]
    prompt_msgs = build_prompt(attack, system_prompt)
    prompt_text = json.dumps(prompt_msgs, ensure_ascii=False)
    expected = attack.get("expected_failure_mode", "")
    
    for model in MODELS:
        for temp in TEMPERATURES:
            print(f"[{attack_id}] {model} temp={temp}")
            start = time.perf_counter()
            try:
                response = client.complete(model, prompt_msgs, temperature=temp, max_tokens=2048)
                error = None
            except Exception as e:
                response = ""
                error = str(e)
            latency = (time.perf_counter() - start) * 1000
            
            refusal = False
            compliance = False
            reasoning = ""
            if not error:
                try:
                    refusal, refusal_reason = judge_refusal(prompt_text, response, client, judge_model)
                    comp, comp_reason = judge_compliance(expected, response, client, judge_model)
                    compliance = comp
                    reasoning = f"Refusal: {refusal_reason} | Compliance: {comp_reason}"
                except Exception as e:
                    reasoning = f"Judge error: {e}"
            
            rec = {
                "attack_id": attack_id,
                "model": model,
                "temperature": temp,
                "response": response[:4000] if response else "",
                "refusal_detected": refusal,
                "compliance_detected": compliance,
                "judge_reasoning": reasoning,
                "latency_ms": round(latency, 2),
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "error": error,
            }
            results.append(rec)
            with open(OUTPUT, "a") as f:
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")
            
            status = "REFUSED" if (refusal and not compliance) else ("COMPLIED" if (compliance and not refusal) else ("NEUTRAL" if not refusal and not compliance else "AMBIGUOUS"))
            if error:
                status = f"ERROR: {error[:40]}"
            print(f"  -> {status} ({latency:.0f}ms)")
            time.sleep(1.0)

# Summary
print(f"\n{'='*60}")
print("VARIANCE SWEEP SUMMARY")
print(f"{'='*60}")
for attack_id in ATTACK_IDS:
    print(f"\n{attack_id}:")
    for model in MODELS:
        m_results = [r for r in results if r["model"] == model and r["attack_id"] == attack_id]
        if not m_results:
            continue
        temps = {r["temperature"]: r for r in m_results}
        outcomes = []
        for temp in TEMPERATURES:
            r = temps.get(temp, {})
            if r.get("error"):
                outcomes.append("ERR")
            elif r.get("compliance_detected") and not r.get("refusal_detected"):
                outcomes.append("COMP")
            elif r.get("refusal_detected") and not r.get("compliance_detected"):
                outcomes.append("REF")
            else:
                outcomes.append("NEUT")
        print(f"  {model:35} | t=0.0:{outcomes[0]:4} | t=0.5:{outcomes[1]:4} | t=1.0:{outcomes[2]:4}")

print(f"\nSaved raw results to {OUTPUT}")
