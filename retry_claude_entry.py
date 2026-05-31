#!/usr/bin/env python3
"""Retry the single Claude empty-response entry (html_injection_006).
Also test stronger judge models for the re-judge pipeline."""

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
from eval_live import OpenRouterClient, judge_refusal, judge_compliance, build_prompt, DEFAULT_SYSTEM_PROMPT

client = OpenRouterClient()

# Load catalog and build html_injection_006 prompt
catalog = json.load(open("dataset/attack_catalog.json"))
catalog_by_id = {a["attack_id"]: a for a in catalog}
attack = catalog_by_id["html_injection_006"]
prompt_msgs = build_prompt(attack, DEFAULT_SYSTEM_PROMPT)
prompt_text = json.dumps(prompt_msgs, ensure_ascii=False)
expected = attack.get("expected_failure_mode", "")

print("=== RETRY: Claude Opus-4.7 | html_injection_006 ===")
print(f"Trigger: {attack['trigger_input'][:100]}...")
print()

# 1. Retry the attack prompt
model = "anthropic/claude-opus-4.7"
response = None
try:
    response = client.complete(model, prompt_msgs, temperature=0.0, max_tokens=2048)
except Exception as e:
    print(f"ERROR on complete: {e}")

if response is None:
    print("Claude returned None/empty again for this attack prompt.")
    print("This confirms the original empty response was consistent behavior")
    print("for this specific attack on Claude Opus-4.7.")
    print()
    # For classification: empty response = refusal (safe)
    print("Classification: REFUSED (empty response = defensive behavior)")
else:
    print(f"Response received ({len(response)} chars):")
    print(f"  {response[:300]}...")
    print()
    
    # Judge with gpt-4o-mini (original judge)
    refusal, refusal_reason = judge_refusal(prompt_text, response, client, "openai/gpt-4o-mini")
    compliance, comp_reason = judge_compliance(expected, response, client, "openai/gpt-4o-mini")
    print(f"gpt-4o-mini judge: refusal={refusal} | compliance={compliance}")
    print(f"  Refusal reasoning: {refusal_reason[:120]}")
    print(f"  Compliance reasoning: {comp_reason[:120]}")
    print()
    
    # Judge with Claude Opus-4.7 (cross-judge)
    time.sleep(1)
    refusal2, refusal_reason2 = judge_refusal(prompt_text, response, client, "anthropic/claude-opus-4.7")
    compliance2, comp_reason2 = judge_compliance(expected, response, client, "anthropic/claude-opus-4.7")
    print(f"Claude Opus-4.7 judge: refusal={refusal2} | compliance={compliance2}")
    print(f"  Refusal reasoning: {refusal_reason2[:120]}")
    print(f"  Compliance reasoning: {comp_reason2[:120]}")

# 2. Test stronger judge models on a sample response
print("\n\n=== JUDGE MODEL COMPARISON ===")
print("Testing multiple judge models on synthetic responses.")
print()
