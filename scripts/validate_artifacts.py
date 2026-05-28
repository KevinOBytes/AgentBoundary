from __future__ import annotations

import json
import csv
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATASET_PATH = ROOT / "dataset" / "attack_catalog.json"
RESULTS_PATH = ROOT / "results" / "model_results.json"
CSV_PATH = ROOT / "results" / "model_results.csv"


def validate_dataset() -> None:
    data = json.loads(DATASET_PATH.read_text(encoding="utf-8"))
    if len(data) < 40:
        raise ValueError("Dataset must include at least 40 attacks")
    required = {
        "attack_id",
        "campaign_id",
        "family",
        "scenario_type",
        "seed_input",
        "trigger_input",
        "attacker_goal",
        "expected_failure_mode",
        "severity",
        "realism_level",
        "phase",
    }
    for row in data:
        missing = required.difference(row.keys())
        if missing:
            raise ValueError(f"Dataset row missing fields: {sorted(missing)}")
    phase_order = {"seed": 0, "dormancy": 1, "activation": 2, "single": 3}
    campaigns: dict[str, list[str]] = defaultdict(list)
    for row in data:
        campaigns[row["campaign_id"]].append(row["phase"])
    for campaign_id, phases in campaigns.items():
        non_single = [phase for phase in phases if phase != "single"]
        if not non_single:
            continue
        ordered = sorted(non_single, key=lambda phase: phase_order.get(phase, 99))
        if non_single != ordered:
            raise ValueError(f"Campaign {campaign_id} phases are not ordered: {non_single}")


def validate_results_json() -> None:
    if not RESULTS_PATH.exists():
        raise FileNotFoundError(f"Missing results file: {RESULTS_PATH}")
    payload = json.loads(RESULTS_PATH.read_text(encoding="utf-8"))
    for key in ("metadata", "metrics", "metrics_by_model", "results"):
        if key not in payload:
            raise ValueError(f"Missing results key: {key}")
    dataset = json.loads(DATASET_PATH.read_text(encoding="utf-8"))
    attacks = {row["attack_id"]: row for row in dataset}
    metadata = payload["metadata"]
    rows = payload["results"]
    models = metadata.get("models_requested", [])
    public_redacted = bool(metadata.get("public_artifact_redacted"))
    expected_count = len(models) * len(attacks)
    if metadata.get("expected_count") != expected_count:
        raise ValueError(f"metadata.expected_count mismatch: {metadata.get('expected_count')} != {expected_count}")
    if metadata.get("attempted_count") != len(rows):
        raise ValueError(f"metadata.attempted_count mismatch: {metadata.get('attempted_count')} != {len(rows)}")
    if len(rows) != expected_count:
        raise ValueError(f"Expected {expected_count} result rows, found {len(rows)}")

    status_counts = Counter(row.get("status") for row in rows)
    if metadata.get("scored_count") != status_counts["scored"]:
        raise ValueError("metadata.scored_count does not match rows")
    if metadata.get("timeout_count") != status_counts["timed_out"]:
        raise ValueError("metadata.timeout_count does not match rows")
    if metadata.get("error_count") != status_counts["api_error"]:
        raise ValueError("metadata.error_count does not match rows")

    required_row_keys = {
        "attack_id", "campaign_id", "family", "phase", "scenario_type", "model",
        "status", "error_type", "prompt", "output", "flags",
    }
    if public_redacted:
        required_row_keys.update(
            {
                "trace_redacted",
                "prompt_sha256",
                "output_sha256",
                "prompt_chars",
                "output_chars",
            }
        )
    if metadata.get("cohorts"):
        required_row_keys.update({"provider", "cohort_label"})
    seen_pairs = set()
    for row in rows:
        missing = required_row_keys.difference(row.keys())
        if missing:
            raise ValueError(f"Result row missing keys: {sorted(missing)}")
        if public_redacted:
            if not row.get("trace_redacted"):
                raise ValueError(f"Public artifact row is not marked redacted: {row['model']} {row['attack_id']}")
            if not row.get("prompt_sha256") or not row.get("output_sha256"):
                raise ValueError(f"Public artifact row lacks trace digests: {row['model']} {row['attack_id']}")
            if not str(row.get("prompt", "")).startswith("[redacted:"):
                raise ValueError(f"Public artifact prompt is not redacted: {row['model']} {row['attack_id']}")
            if not str(row.get("output", "")).startswith("[redacted:"):
                raise ValueError(f"Public artifact output is not redacted: {row['model']} {row['attack_id']}")
            if "System Memory:" in str(row.get("prompt", "")) or "System Memory:" in str(row.get("output", "")):
                raise ValueError(f"Public artifact leaked activation memory text: {row['model']} {row['attack_id']}")
        attack = attacks.get(row["attack_id"])
        if not attack:
            raise ValueError(f"Unknown attack_id in results: {row['attack_id']}")
        if row["family"] != attack["family"] or row["phase"] != attack["phase"]:
            raise ValueError(f"Result metadata mismatch for {row['attack_id']}")
        seen_pairs.add((row["model"], row["attack_id"]))
    expected_pairs = {(model, attack_id) for model in models for attack_id in attacks}
    missing_pairs = sorted(expected_pairs.difference(seen_pairs))
    if missing_pairs:
        raise ValueError(f"Missing model/attack rows: {missing_pairs[:5]}")

    rows_by_model_campaign: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for row in rows:
        rows_by_model_campaign[(row["model"], row["campaign_id"])].append(row)
    for (_model, campaign_id), campaign_rows in rows_by_model_campaign.items():
        if public_redacted:
            continue
        phases = [row["phase"] for row in campaign_rows]
        if "activation" not in phases or "seed" not in phases:
            continue
        seed_or_dormancy_scored = any(
            row["phase"] in {"seed", "dormancy"} and row["status"] == "scored"
            for row in campaign_rows
        )
        if not seed_or_dormancy_scored:
            continue
        for row in campaign_rows:
            if row["phase"] == "activation" and row["status"] == "scored":
                prompt = row["prompt"]
                if "System Memory:" not in prompt and "[RETRIEVED_MEMORY" not in prompt:
                    raise ValueError(f"Activation row lacks carried memory for campaign {campaign_id}: {row['attack_id']}")

    metrics = payload["metrics"]
    for key in (
        "coverage_rate",
        "timeout_rate",
        "api_error_rate",
        "overall_vulnerability_attempt_rate",
        "tool_policy_block_rate",
        "policy_violation_rate",
        "expected_count",
    ):
        if key not in metrics:
            raise ValueError(f"Missing coverage metric: {key}")
    if metrics["expected_count"] != expected_count:
        raise ValueError(f"metrics.expected_count mismatch: {metrics['expected_count']} != {expected_count}")
    expected_coverage_rate = round(status_counts["scored"] / expected_count, 4) if expected_count else 0.0
    if metrics["coverage_rate"] != expected_coverage_rate:
        raise ValueError(
            f"metrics.coverage_rate mismatch: {metrics['coverage_rate']} != {expected_coverage_rate}"
        )
    if metrics["policy_violation_rate"] != metrics["tool_policy_block_rate"]:
        raise ValueError("policy_violation_rate alias does not match tool_policy_block_rate")


def validate_results_csv() -> None:
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"Missing csv file: {CSV_PATH}")
    with CSV_PATH.open(newline="", encoding="utf-8") as handle:
        row_count = sum(1 for _ in csv.DictReader(handle))
    payload = json.loads(RESULTS_PATH.read_text(encoding="utf-8"))
    if row_count != len(payload["results"]):
        raise ValueError(f"CSV row count {row_count} does not match JSON results {len(payload['results'])}")


def main() -> None:
    validate_dataset()
    validate_results_json()
    validate_results_csv()
    print("Artifacts validation passed")


if __name__ == "__main__":
    main()
