#!/usr/bin/env python3
"""Combine v1 cohort outputs, redact for public release, recompute paper stats.

Usage:
    python3 scripts/build_release.py

Inputs (from results/generated/):
    v1_openrouter_non_lmp.json
    v1_openrouter_lmp_vector.json
    v1_ollama_cloud_non_lmp.json
    v1_ollama_cloud_lmp_vector.json
    v1_openrouter_non_lmp_generic.json        (ablation)
    v1_openrouter_non_lmp_filter.json         (ablation)

Outputs:
    results/generated/model_results.combined-v1.json    (private, with traces)
    results/model_results.json                              (public, redacted)
    results/model_results.csv                               (public, redacted)
    results/ablation/openrouter_hardened.json
    results/ablation/openrouter_generic.json
    results/ablation/openrouter_filter.json
    results/paper_stats_v1.md
"""
from __future__ import annotations
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GEN = ROOT / "results" / "generated"
PUBLIC = ROOT / "results"
ABLATION = ROOT / "results" / "ablation"
sys.path.insert(0, str(ROOT / "harness"))
sys.path.insert(0, str(ROOT / "scripts"))


def load(path):
    if not path.exists():
        print(f"  MISSING: {path}", file=sys.stderr)
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def tag_rows(payload, memory_backend, defense_variant):
    """Stamp each row with backend/defense so downstream filtering is unambiguous."""
    for row in payload.get("results", []):
        row.setdefault("memory_backend", memory_backend)
        row.setdefault("defense_variant", defense_variant)
    return payload


def main():
    print("=== AgentBoundary v1 release builder ===\n")
    ABLATION.mkdir(parents=True, exist_ok=True)

    or_non_lmp = load(GEN / "v1_openrouter_non_lmp.json")
    or_lmp = load(GEN / "v1_openrouter_lmp_vector.json")
    oc_non_lmp = load(GEN / "v1_ollama_cloud_non_lmp.json")
    oc_lmp = load(GEN / "v1_ollama_cloud_lmp_vector.json")
    or_generic = load(GEN / "v1_openrouter_non_lmp_generic.json")
    or_filter = load(GEN / "v1_openrouter_non_lmp_filter.json")

    if or_non_lmp:
        tag_rows(or_non_lmp, "flat", "hardened")
    if or_lmp:
        tag_rows(or_lmp, "vector", "hardened")
    if oc_non_lmp:
        tag_rows(oc_non_lmp, "flat", "hardened")
    if oc_lmp:
        tag_rows(oc_lmp, "vector", "hardened")

    # Main public release: combined hardened-defense cohorts
    main_cohorts = []
    if or_non_lmp:
        main_cohorts.append((or_non_lmp, "openrouter", "openrouter-frontier-cohort"))
    if or_lmp:
        main_cohorts.append((or_lmp, "openrouter", "openrouter-frontier-cohort"))
    if oc_non_lmp:
        main_cohorts.append((oc_non_lmp, "ollama-cloud", "ollama-cloud-baseline"))
    if oc_lmp:
        main_cohorts.append((oc_lmp, "ollama-cloud", "ollama-cloud-baseline"))

    print(f"\nMain release cohorts: {len(main_cohorts)}")
    for _payload, prov, label in main_cohorts:
        print(f"  - {label} ({prov})")

    # Combine
    from combine_result_cohorts import combine_cohorts
    combined = combine_cohorts(main_cohorts)

    # Add v1 release metadata
    combined["metadata"]["benchmark_version"] = "1.2.0-multi-provider"
    combined["metadata"]["run_label"] = "v1-public-release-2026-05-20"
    combined["metadata"]["catalog_revision"] = "v1-diversified"
    combined["metadata"]["catalog_unique_prompts"] = 42
    combined["metadata"]["catalog_total_scenarios"] = 55
    combined["metadata"]["catalog_paraphrase_variants"] = 10
    combined["metadata"]["catalog_lmp_obfuscated_variants"] = 5
    combined["metadata"]["release_changelog"] = "See CHANGELOG.md and docs/whitepaper.md for v1 changes vs v0."

    # Sanity-check duplicates: paraphrase variants are intentional duplicates of base attack_ids on the
    # PROMPT axis, but each variant gets its own attack_id, so the (provider, model, attack_id) key
    # should be unique. The previous combine_result_cohorts raises on dupes.

    private_path = GEN / "model_results.combined-v1.json"
    private_path.write_text(json.dumps(combined, indent=2) + "\n", encoding="utf-8")
    print(f"\nWrote private combined artifact: {private_path}")

    # Redact for public
    redact_cmd = [
        "python3", str(ROOT / "scripts" / "redact_public_results.py"),
        "--input-json", str(private_path),
        "--output-json", str(PUBLIC / "model_results.json"),
        "--output-csv", str(PUBLIC / "model_results.csv"),
    ]
    r = subprocess.run(redact_cmd, capture_output=True, text=True)
    print(r.stdout.strip())
    if r.returncode != 0:
        print(f"REDACTION FAILED: {r.stderr}", file=sys.stderr)
        sys.exit(1)

    # Ablation: save the three defense variants separately for paper appendix
    if or_non_lmp:
        # Tag the hardened cohort copy for the ablation comparison
        ablation_hardened = json.loads(json.dumps(or_non_lmp))
        for r in ablation_hardened["results"]:
            r["defense_variant"] = "hardened"
        (ABLATION / "openrouter_hardened.json").write_text(
            json.dumps(ablation_hardened, indent=2) + "\n", encoding="utf-8"
        )
        print(f"Wrote ablation/openrouter_hardened.json")

    if or_generic:
        tag_rows(or_generic, "flat", "generic")
        (ABLATION / "openrouter_generic.json").write_text(
            json.dumps(or_generic, indent=2) + "\n", encoding="utf-8"
        )
        print(f"Wrote ablation/openrouter_generic.json")

    if or_filter:
        tag_rows(or_filter, "flat", "generic_plus_memory_filter")
        (ABLATION / "openrouter_filter.json").write_text(
            json.dumps(or_filter, indent=2) + "\n", encoding="utf-8"
        )
        print(f"Wrote ablation/openrouter_filter.json")

    # Generate paper stats markdown
    stats_cmd = [
        "python3", str(ROOT / "scripts" / "paper_stats.py"),
        "--results-json", str(PUBLIC / "model_results.json"),
        "--output", str(PUBLIC / "paper_stats_v1.md"),
    ]
    r2 = subprocess.run(stats_cmd, capture_output=True, text=True)
    print(r2.stdout.strip())
    if r2.returncode != 0:
        print(f"PAPER_STATS FAILED: {r2.stderr}", file=sys.stderr)

    print("\n=== v1 release build complete ===")
    print(f"\nMain release: {PUBLIC / 'model_results.json'}")
    print(f"Paper stats:  {PUBLIC / 'paper_stats_v1.md'}")
    print(f"Ablation:     {ABLATION}/")


if __name__ == "__main__":
    main()
