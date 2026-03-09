from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class OpenRouterAdapter:
    api_key: str
    base_url: str = "https://openrouter.ai/api/v1/chat/completions"

    def generate(self, model: str, prompt: str) -> str:
        payload: Dict[str, Any] = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a secure autonomous agent."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0,
        }
        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            self.base_url,
            data=body,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                data = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            raise RuntimeError(f"OpenRouter request failed: {exc.read().decode('utf-8')}") from exc
        return data["choices"][0]["message"]["content"]


def build_adapter() -> OpenRouterAdapter:
    key = os.getenv("OPENROUTER_API_KEY", "")
    if not key:
        raise RuntimeError("OPENROUTER_API_KEY is not set.")
    return OpenRouterAdapter(api_key=key)
