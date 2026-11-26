from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]

FORBIDDEN_TRACKED_PATTERNS = (
    ".env",
    "results/generated/",
    "results/raw/",
    "results/private/",
    "results/archive/",
    "results/dry_run_results.",
)

SECRET_PATTERNS = (
    re.compile(r"sk-or-v1-[A-Za-z0-9_-]{20,}"),
    re.compile(r"ghp_[A-Za-z0-9_]{20,}"),
    re.compile(r"github_pat_[A-Za-z0-9_]{20,}"),
    re.compile(r"ollama_[A-Za-z0-9-]{20,}"),
    re.compile(r"(?i)(api[_-]?key|secret|password|token)\s*=\s*['\"]?[A-Za-z0-9_./+=-]{20,}"),
)

ALLOWLISTED_FILES = {
    ".env.example",
    "docs/agentboundary-preprint.pdf",
}


def tracked_files() -> list[str]:
    output = subprocess.check_output(["git", "ls-files"], cwd=ROOT, text=True)
    return [line for line in output.splitlines() if line]


def assert_no_forbidden_tracked_paths(files: list[str]) -> None:
    violations: list[str] = []
    for file in files:
        if file == ".env.example":
            continue
        if file == ".env" or any(file.startswith(pattern) for pattern in FORBIDDEN_TRACKED_PATTERNS):
            violations.append(file)
    if violations:
        raise SystemExit("Forbidden private/raw files are tracked:\n" + "\n".join(sorted(violations)))


def assert_public_results_redacted(path: Path) -> None:
    payload = json.loads(path.read_text(encoding="utf-8"))
    metadata = payload.get("metadata", {})
    if metadata.get("public_artifact_redacted") is not True:
        raise SystemExit(f"{path} is not marked as a redacted public artifact")
    for index, row in enumerate(payload.get("results", [])):
        if row.get("trace_redacted") is not True:
            raise SystemExit(f"Result row {index} is not marked trace_redacted")
        if not str(row.get("prompt", "")).startswith("[redacted:"):
            raise SystemExit(f"Result row {index} has an unredacted prompt")
        if not str(row.get("output", "")).startswith("[redacted:"):
            raise SystemExit(f"Result row {index} has an unredacted output")


def assert_no_secret_patterns(files: list[str]) -> None:
    hits: list[str] = []
    for file in files:
        if file in ALLOWLISTED_FILES:
            continue
        path = ROOT / file
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                hits.append(file)
                break
    if hits:
        raise SystemExit("Potential secret patterns found in tracked files:\n" + "\n".join(sorted(set(hits))))


def validate_current_reports() -> None:
    """Verify the current study without substituting synthetic legacy results."""
    subprocess.run([sys.executable, str(ROOT / "scripts/analyze.py"), "--check"],
                   cwd=ROOT, check=True)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Check tracked release content and current study artifacts")
    parser.add_argument("--legacy-results-json", type=Path,
                        help="Check redaction of an explicit legacy harness artifact instead of current reports")
    args = parser.parse_args(argv)
    files = tracked_files()
    assert_no_forbidden_tracked_paths(files)
    if args.legacy_results_json is not None:
        assert_public_results_redacted(args.legacy_results_json)
    else:
        validate_current_reports()
    assert_no_secret_patterns(files)
    print("Public release guard passed")


if __name__ == "__main__":
    main()
