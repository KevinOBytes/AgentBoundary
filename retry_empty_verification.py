#!/usr/bin/env python3
"""Retry the 10 empty-response entries from v2.2 clean dataset.

Rationale: determine whether the empty responses were endpoint flakes
(model temporarily unavailable / throttled) or genuine implicit refusals.
If the model now returns content, the earlier empties were errors and
should be excluded. If it returns empty again, classification as refusal
is defensible.

Uses OpenRouter directly (same key, fresh request) — if the endpoint is
now healthy, a flake would have recovered.
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

import urllib.request
import urllib.error

OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "")
if not OPENROUTER_KEY:
    raise RuntimeError("OPENROUTER_API_KEY not set")

CLEAN_PATH = Path("results/v2_2_eval_20260528_clean.jsonl")


from typing import Optional, Tuple

def call_openrouter(model: str, messages: list, temperature: float = 0.0, max_tokens: int = 2048) -> Tuple[str, Optional[str]]:
    """Returns (response_text, error_or_none)."""
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=data,
        headers={
            "Authorization": f"Bearer {OPENROUTER_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            choices = body.get("choices", [])
            if not choices:
                return "", "No choices in response"
            content = choices[0].get("message", {}).get("content", "")
            if content is None:
                content = ""
            return content, None
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        return "", f"HTTP {e.code}: {body[:200]}"
    except Exception as e:
        return "", f"Exception: {e}"


def main():
    # Load the 10 problematic entries
    problematic = []
    with open(CLEAN_PATH, "r") as f:
        for i, line in enumerate(f):
            rec = json.loads(line)
            response = rec.get("response", "")
            if (response is None) or (isinstance(response, str) and response.strip() == ""):
                # also only those with the implicit-refusal reasoning
                reasoning = rec.get("judge_reasoning", "")
                if "Implicit refusal" in reasoning:
                    problematic.append(rec)

    print(f"Loaded {len(problematic)} entries marked as implicit refusals.\n")

    # Group by model
    by_model = {}
    for rec in problematic:
        by_model.setdefault(rec["model"], []).append(rec)

    for model, entries in by_model.items():
        print(f"=== Model: {model} ({len(entries)} entries) ===")

        # 1) Neutral ping first (harmless prompt)
        ping_msgs = [{"role": "user", "content": "Say 'pong' and nothing else."}]
        ping_resp, ping_err = call_openrouter(model, ping_msgs)
        print(f"  Neutral ping -> response={repr(ping_resp)[:60]} error={ping_err}")
        time.sleep(1.0)

        # 2) Retry each attack prompt
        for rec in entries:
            attack_id = rec["attack_id"]
            prompt_text = rec["prompt"]
            # prompt is stored as JSON string of messages; parse it
            try:
                messages = json.loads(prompt_text)
            except Exception:
                messages = [{"role": "user", "content": prompt_text}]

            retry_resp, retry_err = call_openrouter(model, messages)
            status = "EMPTY" if retry_resp.strip() == "" else "CONTENT"
            if retry_err:
                status = f"ERROR:{retry_err[:40]}"
            print(f"    [{attack_id}] -> {status} | len={len(retry_resp)} | {repr(retry_resp)[:60]}")
            time.sleep(0.8)

        print()

    print("Done. If neutral ping also returns empty, the endpoint is flaky.")
    print("If neutral ping returns content but attack prompts are empty, these are genuine refusals.")


if __name__ == "__main__":
    main()
