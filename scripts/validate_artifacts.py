from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATASET_PATH = ROOT / "dataset" / "attack_catalog.json"
RESULTS_PATH = ROOT / "results" / "generated" / "model_results.json"
CSV_PATH = ROOT / "results" / "generated" / "model_results.csv"


def validate_dataset() -> None:
    data = json.loads(DATASET_PATH.read_text(encoding="utf-8"))
    if len(data) < 40:
        raise ValueError("Dataset must include at least 40 attacks")
    required = {
        "attack_id",
        "campaign_id",
        "attack_type",
        "payload",
        "trigger_condition",
        "expected_behavior",
        "severity",
        "phase",
    }
    for row in data:
        missing = required.difference(row.keys())
        if missing:
            raise ValueError(f"Dataset row missing fields: {sorted(missing)}")


def validate_results_json() -> None:
    if not RESULTS_PATH.exists():
        raise FileNotFoundError(f"Missing results file: {RESULTS_PATH}")
    payload = json.loads(RESULTS_PATH.read_text(encoding="utf-8"))
    for key in ("metadata", "metrics", "metrics_by_model", "results"):
        if key not in payload:
            raise ValueError(f"Missing results key: {key}")


def validate_results_csv() -> None:
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"Missing csv file: {CSV_PATH}")


def main() -> None:
    validate_dataset()
    validate_results_json()
    validate_results_csv()
    print("Artifacts validation passed")


if __name__ == "__main__":
    main()
