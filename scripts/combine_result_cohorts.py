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


def annotate_results(payload: dict[str, Any], provider: str, cohort_label: str) -> list[dict[str, Any]]:
    annotated = []
    for result in payload.get("results", []):
        row = deepcopy(result)
        row["provider"] = row.get("provider") or provider
        row["cohort_label"] = row.get("cohort_label") or cohort_label
        annotated.append(row)
    return annotated


def cohort_summary(payload: dict[str, Any], provider: str, cohort_label: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
    metadata = payload.get("metadata", {})
    counts = status_counts(rows)
    return {
        "label": cohort_label,
        "provider": provider,
        "run_label": metadata.get("run_label", cohort_label),
        "run_timestamp": metadata.get("run_timestamp"),
        "models_requested": metadata.get("models_requested", sorted({row["model"] for row in rows})),
        "models_total": len({row["model"] for row in rows}),
        "attacks_total": metadata.get("attacks_total"),
        "attempted_count": counts["attempted"],
        "scored_count": counts["scored"],
        "timeout_count": counts["timed_out"],
        "error_count": counts["api_error"],
        "metrics": evaluate(rows),
    }


def combine_cohorts(cohorts: list[tuple[dict[str, Any], str, str]]) -> dict[str, Any]:
    if not cohorts:
        raise ValueError("At least one cohort is required.")

    all_results: list[dict[str, Any]] = []
    summaries = []
    for payload, provider, cohort_label in cohorts:
        rows = annotate_results(payload, provider, cohort_label)
        all_results.extend(rows)
        summaries.append(cohort_summary(payload, provider, cohort_label, rows))

    models = sorted({row["model"] for row in all_results})
    model_providers = {row["model"]: row["provider"] for row in all_results}
    model_cohorts = {row["model"]: row["cohort_label"] for row in all_results}
    counts = status_counts(all_results)
    attacks_total = max(int(summary.get("attacks_total") or 0) for summary in summaries)

    return {
        "metadata": {
            "benchmark_version": "1.1.0-multi-provider",
            "run_label": "multi-provider-public-release-2026-05-20",
            "run_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "provider": "multi-provider",
            "providers": sorted({provider for _payload, provider, _label in cohorts}),
            "cohorts": summaries,
            "model_providers": model_providers,
            "model_cohorts": model_cohorts,
            "models_requested": models,
            "models_total": len(models),
            "attacks_total": attacks_total,
            "campaigns_total": max(
                int(payload.get("metadata", {}).get("campaigns_total") or 0) for payload, _provider, _label in cohorts
            ),
            "attempted_count": counts["attempted"],
            "expected_count": len(models) * attacks_total,
            "scored_count": counts["scored"],
            "timeout_count": counts["timed_out"],
            "error_count": counts["api_error"],
            "result_grain": "One model-scenario evaluation.",
        },
        "metrics": evaluate(all_results),
        "metrics_by_model": summarize_by_model(all_results),
        "results": all_results,
    }


def parse_cohort_arg(raw: str) -> tuple[Path, str, str]:
    parts = raw.split(":", 2)
    if len(parts) != 3:
        raise argparse.ArgumentTypeError("Cohorts must use path:provider:label")
    return Path(parts[0]), parts[1], parts[2]


def main() -> None:
    parser = argparse.ArgumentParser(description="Combine multiple AgentKillChain result cohorts into one payload.")
    parser.add_argument(
        "--cohort",
        action="append",
        required=True,
        type=parse_cohort_arg,
        help="Cohort descriptor as path:provider:label",
    )
    parser.add_argument("--output-json", type=Path, required=True)
    args = parser.parse_args()

    cohorts = []
    for path, provider, label in args.cohort:
        payload = json.loads(path.read_text(encoding="utf-8"))
        cohorts.append((payload, provider, label))

    combined = combine_cohorts(cohorts)
    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(combined, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote combined results JSON to {args.output_json}")


if __name__ == "__main__":
    main()
