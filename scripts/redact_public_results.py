from __future__ import annotations

import argparse
import csv
import hashlib
import json
from copy import deepcopy
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_JSON = ROOT / "results" / "model_results.json"
DEFAULT_CSV = ROOT / "results" / "model_results.csv"
PROMPT_REDACTION = "[redacted: raw prompt omitted from public artifact]"
OUTPUT_REDACTION = "[redacted: raw model output omitted from public artifact]"


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def redact_row(row: dict[str, Any]) -> dict[str, Any]:
    redacted = deepcopy(row)
    prompt = str(row.get("prompt", ""))
    output = str(row.get("output", ""))
    redacted.update(
        {
            "trace_redacted": True,
            "prompt_sha256": row.get("prompt_sha256") or sha256_text(prompt),
            "output_sha256": row.get("output_sha256") or sha256_text(output),
            "prompt_chars": row.get("prompt_chars", len(prompt)),
            "output_chars": row.get("output_chars", len(output)),
            "prompt": PROMPT_REDACTION,
            "output": OUTPUT_REDACTION,
        }
    )
    return redacted


def write_csv(rows: list[dict[str, Any]], csv_path: Path) -> None:
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "attack_id",
        "campaign_id",
        "family",
        "phase",
        "scenario_type",
        "model",
        "status",
        "error_type",
        "refusal_detected",
        "unsafe_instruction_adopted",
        "unsafe_tool_call_proposed",
        "secret_disclosure_claimed",
        "policy_violation",
        "trace_redacted",
        "prompt_sha256",
        "output_sha256",
        "prompt_chars",
        "output_chars",
        "prompt",
        "output",
    ]
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "attack_id": row.get("attack_id"),
                    "campaign_id": row.get("campaign_id"),
                    "family": row.get("family"),
                    "phase": row.get("phase"),
                    "scenario_type": row.get("scenario_type"),
                    "model": row.get("model"),
                    "status": row.get("status"),
                    "error_type": row.get("error_type"),
                    "trace_redacted": row.get("trace_redacted"),
                    "prompt_sha256": row.get("prompt_sha256"),
                    "output_sha256": row.get("output_sha256"),
                    "prompt_chars": row.get("prompt_chars"),
                    "output_chars": row.get("output_chars"),
                    "prompt": row.get("prompt"),
                    "output": row.get("output"),
                    **row.get("flags", {}),
                }
            )


def redact_payload(payload: dict[str, Any]) -> dict[str, Any]:
    public_payload = deepcopy(payload)
    metadata = public_payload.setdefault("metadata", {})
    metadata.update(
        {
            "public_artifact_redacted": True,
            "redacted_fields": ["results[].prompt", "results[].output"],
            "redaction_policy": (
                "Raw prompts and model outputs are omitted from public artifacts. "
                "Per-row flags, metrics, row counts, character counts, and SHA-256 digests are retained."
            ),
        }
    )
    public_payload["results"] = [redact_row(row) for row in public_payload.get("results", [])]
    return public_payload


def main() -> None:
    parser = argparse.ArgumentParser(description="Create public-safe AgentKillChain result artifacts.")
    parser.add_argument("--input-json", type=Path, default=DEFAULT_JSON)
    parser.add_argument("--output-json", type=Path, default=DEFAULT_JSON)
    parser.add_argument("--output-csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--private-json", type=Path, help="Optional ignored path to preserve the raw JSON.")
    args = parser.parse_args()

    payload = json.loads(args.input_json.read_text(encoding="utf-8"))
    if args.private_json:
        args.private_json.parent.mkdir(parents=True, exist_ok=True)
        args.private_json.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    public_payload = redact_payload(payload)
    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(public_payload, indent=2) + "\n", encoding="utf-8")
    write_csv(public_payload["results"], args.output_csv)
    print(f"Wrote public redacted JSON to {args.output_json}")
    print(f"Wrote public redacted CSV to {args.output_csv}")


if __name__ == "__main__":
    main()
