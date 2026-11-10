"""Current-study validation must not masquerade as a synthetic legacy run."""
from __future__ import annotations

import contextlib
import csv
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from scripts import check_public_release as release
from scripts import validate_artifacts as artifacts


def write_legacy_fixture(directory: Path) -> tuple[Path, Path]:
    catalog = json.loads(artifacts.DATASET_PATH.read_text(encoding="utf-8"))
    rows = [{
        **{key: attack[key] for key in ("attack_id", "campaign_id", "family", "phase", "scenario_type")},
        "model": "test/model", "status": "scored", "error_type": None,
        "prompt": "[redacted: prompt]", "output": "[redacted: output]", "flags": {},
        "trace_redacted": True, "prompt_sha256": "0" * 64, "output_sha256": "1" * 64,
        "prompt_chars": 100, "output_chars": 100,
    } for attack in catalog]
    payload = {
        "metadata": {"models_requested": ["test/model"], "expected_count": len(rows),
                     "attempted_count": len(rows), "scored_count": len(rows),
                     "timeout_count": 0, "error_count": 0, "public_artifact_redacted": True},
        "metrics": {"coverage_rate": 1.0, "timeout_rate": 0.0, "api_error_rate": 0.0,
                    "overall_vulnerability_attempt_rate": 0.0, "tool_policy_block_rate": 0.0,
                    "policy_violation_rate": 0.0, "expected_count": len(rows)},
        "metrics_by_model": {}, "results": rows,
    }
    json_path, csv_path = directory / "legacy.json", directory / "legacy.csv"
    json_path.write_text(json.dumps(payload), encoding="utf-8")
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["attack_id"])
        writer.writeheader()
        writer.writerows({"attack_id": row["attack_id"]} for row in rows)
    return json_path, csv_path


class ArtifactValidationTests(unittest.TestCase):
    def test_catalog_order_is_not_a_schedule_but_ids_and_phases_are_validated(self) -> None:
        # The actual current corpus has an activation row before a seed row.
        artifacts.validate_dataset()
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "catalog.json"
            catalog = json.loads(artifacts.DATASET_PATH.read_text())
            catalog[0]["phase"] = "unrecognized"
            path.write_text(json.dumps(catalog), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Unknown phase"):
                artifacts.validate_dataset(path)
            catalog = json.loads(artifacts.DATASET_PATH.read_text())
            catalog[-1]["attack_id"] = catalog[0]["attack_id"]
            path.write_text(json.dumps(catalog), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Duplicate dataset attack_id"):
                artifacts.validate_dataset(path)

    def test_no_argument_schema_validation_checks_current_reports(self) -> None:
        with patch.object(artifacts, "validate_dataset") as dataset, \
                patch.object(artifacts, "validate_current_reports") as current, \
                patch.object(artifacts, "validate_results_json") as legacy_json, \
                patch.object(artifacts, "validate_results_csv") as legacy_csv, \
                contextlib.redirect_stdout(io.StringIO()):
            artifacts.main([])
        dataset.assert_called_once_with()
        current.assert_called_once_with()
        legacy_json.assert_not_called()
        legacy_csv.assert_not_called()

    def test_no_argument_release_guard_keeps_path_and_secret_checks(self) -> None:
        files = ["example.py"]
        with patch.object(release, "tracked_files", return_value=files), \
                patch.object(release, "assert_no_forbidden_tracked_paths") as paths, \
                patch.object(release, "assert_no_secret_patterns") as secrets, \
                patch.object(release, "validate_current_reports") as current, \
                patch.object(release, "assert_public_results_redacted") as legacy, \
                contextlib.redirect_stdout(io.StringIO()):
            release.main([])
        paths.assert_called_once_with(files)
        secrets.assert_called_once_with(files)
        current.assert_called_once_with()
        legacy.assert_not_called()

    def test_current_checks_are_read_only_and_propagate_drift(self) -> None:
        for module in (artifacts, release):
            with self.subTest(module=module.__name__):
                with patch.object(module.subprocess, "run") as run:
                    module.validate_current_reports()
                run.assert_called_once_with(
                    [sys.executable, str(module.ROOT / "scripts/analyze.py"), "--check"],
                    cwd=module.ROOT, check=True,
                )
                with patch.object(module.subprocess, "run", side_effect=subprocess.CalledProcessError(1, "analyze")), \
                        self.assertRaises(subprocess.CalledProcessError):
                    module.validate_current_reports()

    def test_explicit_legacy_files_pass_and_mismatched_csv_fails(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            json_path, csv_path = write_legacy_fixture(Path(directory))
            before = json_path.read_bytes()
            with patch.object(artifacts, "validate_current_reports") as current, \
                    contextlib.redirect_stdout(io.StringIO()):
                artifacts.main(["--legacy-results-json", str(json_path), "--legacy-results-csv", str(csv_path)])
            current.assert_not_called()
            release.assert_public_results_redacted(json_path)
            self.assertEqual(json_path.read_bytes(), before)
            csv_path.write_text("attack_id\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "CSV row count"):
                artifacts.validate_results_csv(csv_path, json_path)

    def test_legacy_arguments_and_redaction_remain_strict(self) -> None:
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as exc:
            artifacts.main(["--legacy-results-json", "unused.json"])
        self.assertEqual(exc.exception.code, 2)
        with tempfile.TemporaryDirectory() as directory:
            json_path, _ = write_legacy_fixture(Path(directory))
            payload = json.loads(json_path.read_text())
            payload["results"][0]["prompt"] = "Unredacted model request"
            json_path.write_text(json.dumps(payload), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "not redacted"):
                artifacts.validate_results_json(json_path)
            with self.assertRaisesRegex(SystemExit, "unredacted prompt"):
                release.assert_public_results_redacted(json_path)

    def test_legacy_release_dispatch_does_not_skip_security_checks(self) -> None:
        path = Path("specific-legacy.json")
        with patch.object(release, "tracked_files", return_value=["example.py"]), \
                patch.object(release, "assert_no_forbidden_tracked_paths") as paths, \
                patch.object(release, "assert_no_secret_patterns") as secrets, \
                patch.object(release, "validate_current_reports") as current, \
                patch.object(release, "assert_public_results_redacted") as legacy, \
                contextlib.redirect_stdout(io.StringIO()):
            release.main(["--legacy-results-json", str(path)])
        paths.assert_called_once_with(["example.py"])
        secrets.assert_called_once_with(["example.py"])
        legacy.assert_called_once_with(path)
        current.assert_not_called()

    def test_existing_private_path_and_secret_guards_still_reject(self) -> None:
        for path in (".env", "results/generated/ci-public.json", "results/raw/trace.json"):
            with self.subTest(path=path), self.assertRaises(SystemExit):
                release.assert_no_forbidden_tracked_paths([path])
        synthetic_secret = "sk-or-v1-" + "a" * 30
        with patch.object(Path, "read_text", return_value=synthetic_secret), \
                self.assertRaisesRegex(SystemExit, "Potential secret patterns"):
            release.assert_no_secret_patterns(["example.py"])


if __name__ == "__main__":
    unittest.main()
