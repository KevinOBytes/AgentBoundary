from __future__ import annotations

import argparse
import datetime
import json
import sys
from copy import deepcopy
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "harness"))

from evaluation import evaluate, summarize_by_model  # noqa: E402
from runner import status_counts  # noqa: E402


def result_key(result: dict[str, Any]) -> tuple[str, str]:
    return str(result.get("model")), str(result.get("attack_id"))


def merge_payloads(base_payload: dict[str, Any], rerun_payload: dict[str, Any]) -> dict[str, Any]:
    merged_payload = deepcopy(base_payload)
    base_results = list(merged_payload.get("results", []))
    rerun_results = list(rerun_payload.get("results", []))
    if not rerun_results:
        raise ValueError("Rerun payload has no results to merge.")

    result_indexes = {result_key(result): index for index, result in enumerate(base_results)}
    missing = [key for key in map(result_key, rerun_results) if key not in result_indexes]
    if missing:
        formatted = ", ".join(f"{model}/{attack_id}" for model, attack_id in missing)
        raise ValueError(f"Rerun result does not match an existing baseline evaluation: {formatted}")

    replacements = []
    for rerun_result in rerun_results:
        key = result_key(rerun_result)
        base_results[result_indexes[key]] = rerun_result
        replacements.append(
            {
                "model": key[0],
                "attack_id": key[1],
                "status": rerun_result.get("status"),
                "error_type": rerun_result.get("error_type"),
            }
        )

    counts = status_counts(base_results)
    metadata = merged_payload.setdefault("metadata", {})
    metadata.update(
        {
            "attempted_count": counts["attempted"],
            "scored_count": counts["scored"],
            "timeout_count": counts["timed_out"],
            "error_count": counts["api_error"],
            "rerun_merged_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "rerun_source_label": rerun_payload.get("metadata", {}).get("run_label"),
            "rerun_replaced_evaluations": replacements,
        }
    )

    merged_payload["results"] = base_results
    merged_payload["metrics"] = evaluate(base_results)
    merged_payload["metrics_by_model"] = summarize_by_model(base_results)
    return merged_payload


def main() -> None:
    parser = argparse.ArgumentParser(description="Merge targeted AgentKillChain rerun results into a baseline payload.")
    parser.add_argument("--base-json", type=Path, required=True)
    parser.add_argument("--rerun-json", type=Path, required=True)
    parser.add_argument("--output-json", type=Path, required=True)
    args = parser.parse_args()

    base_payload = json.loads(args.base_json.read_text(encoding="utf-8"))
    rerun_payload = json.loads(args.rerun_json.read_text(encoding="utf-8"))
    merged_payload = merge_payloads(base_payload, rerun_payload)

    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(merged_payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote merged results JSON to {args.output_json}")


if __name__ == "__main__":
    main()
