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


def _cohort_expected_count(metadata: dict[str, Any], rows: list[dict[str, Any]]) -> int:
    if metadata.get("expected_count") is not None:
        return int(metadata["expected_count"])
    models_total = int(metadata.get("models_total") or len({row["model"] for row in rows}))
    attacks_total = int(metadata.get("attacks_total") or len({row["attack_id"] for row in rows}))
    return models_total * attacks_total


def _assert_no_duplicate_results(rows: list[dict[str, Any]]) -> None:
    seen: set[tuple[str, str, str]] = set()
    for row in rows:
        key = (str(row.get("provider") or ""), str(row.get("model")), str(row.get("attack_id")))
        if key in seen:
            provider, model, attack_id = key
            label = f"{provider}/{model}/{attack_id}" if provider else f"{model}/{attack_id}"
            raise ValueError(f"Duplicate result row in combined cohorts: {label}")
        seen.add(key)


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
    expected_count = _cohort_expected_count(metadata, rows)
    attacks_total = int(metadata.get("attacks_total") or len({row["attack_id"] for row in rows}))
    return {
        "label": cohort_label,
        "provider": provider,
        "run_label": metadata.get("run_label", cohort_label),
        "run_timestamp": metadata.get("run_timestamp"),
        "memory_backend": metadata.get("memory_backend"),
        "judge_mode": metadata.get("judge_mode"),
        "system_prompt_configured": metadata.get("system_prompt_configured"),
        "git_commit": metadata.get("git_commit"),
        "models_requested": metadata.get("models_requested", sorted({row["model"] for row in rows})),
        "models_total": len({row["model"] for row in rows}),
        "attacks_total": attacks_total,
        "expected_count": expected_count,
        "attempted_count": counts["attempted"],
        "scored_count": counts["scored"],
        "timeout_count": counts["timed_out"],
        "error_count": counts["api_error"],
        "metrics": evaluate(rows, expected_count=expected_count),
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

    _assert_no_duplicate_results(all_results)

    models = sorted({row["model"] for row in all_results})
    model_providers = {row["model"]: row["provider"] for row in all_results}
    model_cohorts = {row["model"]: row["cohort_label"] for row in all_results}
    counts = status_counts(all_results)
    attacks_total = max(int(summary.get("attacks_total") or 0) for summary in summaries)
    expected_count = len(models) * attacks_total

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
            "expected_count": expected_count,
            "scored_count": counts["scored"],
            "timeout_count": counts["timed_out"],
            "error_count": counts["api_error"],
            "result_grain": "One model-scenario evaluation.",
        },
        "metrics": evaluate(all_results, expected_count=expected_count),
        "metrics_by_model": summarize_by_model(all_results, expected_per_model=attacks_total),
        "results": all_results,
    }


def parse_cohort_arg(raw: str) -> tuple[Path, str, str]:
    parts = raw.split(":", 2)
    if len(parts) != 3:
        raise argparse.ArgumentTypeError("Cohorts must use path:provider:label")
    return Path(parts[0]), parts[1], parts[2]


def infer_cohort_descriptor(path: Path, payload: dict[str, Any]) -> tuple[Path, str, str]:
    metadata = payload.get("metadata", {})
    provider = str(metadata.get("provider") or "")
    run_label = str(metadata.get("run_label") or path.stem)
    if not provider:
        raise ValueError(f"Cannot infer provider for cohort path {path}; use --cohort path:provider:label")
    if provider == "ollama-cloud":
        label = "ollama-cloud-baseline"
    elif provider == "openrouter":
        label = "openrouter-frontier-cohort"
    else:
        label = run_label
    return path, provider, label


def main() -> None:
    parser = argparse.ArgumentParser(description="Combine multiple AgentKillChain result cohorts into one payload.")
    parser.add_argument(
        "--cohort",
        action="append",
        type=parse_cohort_arg,
        help="Cohort descriptor as path:provider:label",
    )
    parser.add_argument(
        "--cohorts",
        nargs="+",
        type=Path,
        help="Compatibility form: one or more cohort JSON paths; provider and label are inferred from metadata.",
    )
    parser.add_argument("--output-json", type=Path, required=True)
    args = parser.parse_args()
    if not args.cohort and not args.cohorts:
        parser.error("At least one --cohort or --cohorts path is required.")

    cohorts = []
    for path, provider, label in args.cohort or []:
        payload = json.loads(path.read_text(encoding="utf-8"))
        cohorts.append((payload, provider, label))
    for path in args.cohorts or []:
        payload = json.loads(path.read_text(encoding="utf-8"))
        _path, provider, label = infer_cohort_descriptor(path, payload)
        cohorts.append((payload, provider, label))

    combined = combine_cohorts(cohorts)
    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(combined, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote combined results JSON to {args.output_json}")


if __name__ == "__main__":
    main()
