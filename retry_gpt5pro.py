#!/usr/bin/env python3
"""Retry the 9 GPT-5-pro entries that returned None/empty responses."""
import json, os, sys, time
from pathlib import Path

# Load .env manually
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

sys.path.insert(0, str(Path(__file__).with_suffix("").parent))
from eval_live import (
    OpenRouterClient, judge_refusal, judge_compliance,
    build_prompt, EvalResult, DEFAULT_JUDGE_MODEL, DEFAULT_SYSTEM_PROMPT,
)

OUTPUT = Path("results/v2_2_eval_20260528.jsonl")
RETRY_MODEL = "openai/gpt-5-pro"

# Find the 9 error entries for GPT-5-pro
rows = []
if OUTPUT.exists():
    with open(OUTPUT) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            rows.append(obj)

error_attack_ids = sorted(set(
    r["attack_id"] for r in rows
    if r.get("model") == RETRY_MODEL and r.get("error")
))
print(f"Retrying {len(error_attack_ids)} entries for {RETRY_MODEL}")
print(f"Attacks: {error_attack_ids}")

# Load catalog
catalog = json.load(open("dataset/attack_catalog.json"))
catalog_by_id = {a["attack_id"]: a for a in catalog}

client = OpenRouterClient()
judge_model = DEFAULT_JUDGE_MODEL
system_prompt = DEFAULT_SYSTEM_PROMPT
success_count = 0

for attack_id in error_attack_ids:
    attack = catalog_by_id[attack_id]
    prompt_msgs = build_prompt(attack, system_prompt)
    prompt_text = json.dumps(prompt_msgs, ensure_ascii=False)

    start = time.perf_counter()
    try:
        response = client.complete(RETRY_MODEL, prompt_msgs, temperature=0.0, max_tokens=2048)
        error = None
    except Exception as e:
        response = ""
        error = str(e)

    if response is None:
        response = ""
        error = error or "Empty model response (None)"

    latency = (time.perf_counter() - start) * 1000

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
            success_count += 1
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
        model=RETRY_MODEL,
        prompt=prompt_text[:8000],
        response=response[:8000],
        refusal_detected=refusal,
        compliance_detected=compliance,
        judge_reasoning=reasoning,
        latency_ms=round(latency, 2),
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        error=error,
    )

    # Append to file (no locking needed, single process)
    with open(OUTPUT, "a") as f:
        f.write(json.dumps(result.__dict__, ensure_ascii=False) + "\n")

    status = "REFUSED" if refusal else ("COMPLIED" if compliance else "NEUTRAL")
    if error:
        status = f"ERROR: {error[:60]}"
    print(f"  [{attack_id}] -> {status} ({latency:.0f}ms)")
    time.sleep(0.5)

print(f"\nRetry complete. {success_count}/{len(error_attack_ids)} now have valid responses.")
