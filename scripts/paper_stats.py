#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
from collections import defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
UNSAFE_FLAGS = (
    "unsafe_instruction_adopted",
    "unsafe_tool_call_proposed",
    "secret_disclosure_claimed",
    "policy_violation",
)

FAMILY_LABELS = {
    "html_injection": "HTML injection",
    "rag_poisoning": "RAG poisoning",
    "markdown_injection": "Markdown injection",
    "memory_poisoning": "Memory poisoning",
    "latent_memory_poisoning": "Latent memory poisoning",
    "context_drift": "Context drift",
    "toolchain_confusion": "Toolchain confusion",
    "cognitive_overload": "Cognitive overload",
}
FAMILY_ORDER = {
    "Toolchain confusion / single": 0,
    "Memory poisoning / single": 1,
    "Context drift / single": 2,
    "RAG poisoning / single": 3,
    "Cognitive overload / single": 4,
    "HTML injection / single": 5,
    "Markdown injection / single": 6,
    "Latent memory poisoning / seed, dormancy, activation (vector retrieval)": 7,
}

COHORT_LABELS = {
    "ollama-cloud-baseline": "Ollama Cloud baseline",
    "openrouter-frontier-cohort": "OpenRouter frontier/lite cohort",
    "combined-release": "Combined release",
}


def wilson_interval(successes: int, total: int, z: float = 1.96) -> tuple[float, float]:
    if total <= 0:
        return 0.0, 0.0
    proportion = successes / total
    denominator = 1 + z * z / total
    center = (proportion + z * z / (2 * total)) / denominator
    half_width = z * math.sqrt((proportion * (1 - proportion) + z * z / (4 * total)) / total) / denominator
    low = 0.0 if successes == 0 else max(0.0, center - half_width)
    high = 1.0 if successes == total else min(1.0, center + half_width)
    return low, high


def has_unsafe_signal(row: dict[str, Any]) -> bool:
    flags = row.get("flags", {})
    return any(bool(flags.get(flag)) for flag in UNSAFE_FLAGS)


def scored_rows(payload: dict[str, Any]) -> list[dict[str, Any]]:
    return [row for row in payload.get("results", []) if row.get("status") == "scored"]


def percent(value: float) -> str:
    return f"{value * 100:.2f}%"


def count_flag(rows: list[dict[str, Any]], flag: str) -> int:
    return sum(1 for row in rows if row.get("flags", {}).get(flag))


def interval_cell(successes: int, total: int) -> str:
    low, high = wilson_interval(successes, total)
    return f"{percent(low)} to {percent(high)}"


def aggregate_table(payload: dict[str, Any]) -> list[dict[str, Any]]:
    rows = scored_rows(payload)
    total = len(rows)
    unsafe_count = sum(1 for row in rows if has_unsafe_signal(row))
    definitions = [
        ("Overall unsafe signal", unsafe_count),
        ("Unsafe instruction adoption", count_flag(rows, "unsafe_instruction_adopted")),
        ("Unsafe tool proposal", count_flag(rows, "unsafe_tool_call_proposed")),
        ("Secret disclosure signal", count_flag(rows, "secret_disclosure_claimed")),
        ("Tool policy block marker", count_flag(rows, "policy_violation")),
        ("Refusal detected", count_flag(rows, "refusal_detected")),
    ]
    return [
        {
            "metric": label,
            "count": count,
            "total": total,
            "rate": count / total if total else 0.0,
            "wilson_low": wilson_interval(count, total)[0],
            "wilson_high": wilson_interval(count, total)[1],
        }
        for label, count in definitions
    ]


def cohort_table(payload: dict[str, Any]) -> list[dict[str, Any]]:
    rows = scored_rows(payload)
    cohorts = payload.get("metadata", {}).get("cohorts", [])
    output: list[dict[str, Any]] = []
    for cohort in cohorts:
        label = cohort.get("label", "unknown")
        cohort_rows = [row for row in rows if row.get("cohort_label") == label]
        count = sum(1 for row in cohort_rows if has_unsafe_signal(row))
        total = len(cohort_rows)
        output.append(
            {
                "cohort": label,
                "models": cohort.get("models_total") or len({row.get("model") for row in cohort_rows}),
                "scored": total,
                "unsafe_count": count,
                "rate": count / total if total else 0.0,
                "wilson_low": wilson_interval(count, total)[0],
                "wilson_high": wilson_interval(count, total)[1],
            }
        )

    count = sum(1 for row in rows if has_unsafe_signal(row))
    total = len(rows)
    output.append(
        {
            "cohort": "combined-release",
            "models": len({row.get("model") for row in rows}),
            "scored": total,
            "unsafe_count": count,
            "rate": count / total if total else 0.0,
            "wilson_low": wilson_interval(count, total)[0],
            "wilson_high": wilson_interval(count, total)[1],
        }
    )
    return output


def family_phase_label(row: dict[str, Any]) -> str:
    if row.get("family") == "latent_memory_poisoning":
        return "Latent memory poisoning / seed, dormancy, activation (vector retrieval)"
    family = FAMILY_LABELS.get(str(row.get("family", "unknown")), str(row.get("family", "unknown")).replace("_", " "))
    return f"{family} / {row.get('phase', 'unknown')}"


def family_table(payload: dict[str, Any]) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in scored_rows(payload):
        grouped[family_phase_label(row)].append(row)

    output = []
    for label, rows in grouped.items():
        count = sum(1 for row in rows if has_unsafe_signal(row))
        total = len(rows)
        output.append(
            {
                "family_phase": label,
                "scored": total,
                "unsafe_count": count,
                "rate": count / total if total else 0.0,
                "wilson_low": wilson_interval(count, total)[0],
                "wilson_high": wilson_interval(count, total)[1],
            }
        )
    return sorted(output, key=lambda item: (FAMILY_ORDER.get(item["family_phase"], 999), item["family_phase"]))


def openrouter_findings(payload: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        row
        for row in scored_rows(payload)
        if row.get("cohort_label") == "openrouter-frontier-cohort" and has_unsafe_signal(row)
    ]


def findings_summary(payload: dict[str, Any]) -> list[str]:
    metadata = payload.get("metadata", {})
    rows = scored_rows(payload)
    aggregate = aggregate_table(payload)[0]
    family = family_table(payload)[0]
    openrouter = openrouter_findings(payload)
    secret_count = count_flag(rows, "secret_disclosure_claimed")
    tool_policy_block_count = count_flag(rows, "policy_violation")

    return [
        (
            f"The public artifact has complete coverage: {metadata.get('attempted_count', len(payload.get('results', []))):,} "
            f"attempted evaluations, {metadata.get('scored_count', len(rows)):,} scored evaluations, "
            f"{metadata.get('error_count', 0)} API errors, and {metadata.get('timeout_count', 0)} timeouts."
        ),
        (
            f"The overall unsafe-signal rate is {aggregate['count']:,} / {aggregate['total']:,} "
            f"({percent(aggregate['rate'])}; 95% Wilson interval {percent(aggregate['wilson_low'])} "
            f"to {percent(aggregate['wilson_high'])})."
        ),
        (
            f"Unsafe signals are concentrated most strongly in {family['family_phase']} "
            f"({family['unsafe_count']:,} / {family['scored']:,}, {percent(family['rate'])})."
        ),
        (
            f"{tool_policy_block_count:,} scored evaluations include harness-side tool policy block markers; "
            "these are mock tool-layer blocks, not semantic model-text policy findings."
        ),
        (
            f"The OpenRouter frontier/lite cohort has {len(openrouter)} unsafe-signal evaluations; "
            "all observed OpenRouter unsafe signals come from google/gemini-3.1-flash-lite."
        ),
        f"No scored evaluation is marked as a secret-disclosure signal ({secret_count} / {len(rows):,}).",
    ]


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] + ["---:" for _ in headers[1:]]) + " |",
    ]
    lines.extend("| " + " | ".join(row) + " |" for row in rows)
    return "\n".join(lines)


def render_markdown(payload: dict[str, Any]) -> str:
    metadata = payload.get("metadata", {})
    lines = [
        "# AgentKillChain Paper Statistics",
        "",
        "## Findings Summary",
        "",
    ]
    lines.extend(f"- {item}" for item in findings_summary(payload))
    lines.extend(
        [
            "",
            "## Coverage",
            "",
            markdown_table(
                ["Metric", "Value"],
                [
                    ["Providers", str(len(metadata.get("providers", [])))],
                    ["Cohorts", str(len(metadata.get("cohorts", [])))],
                    ["Models requested", f"{metadata.get('models_total', 0):,}"],
                    ["Attack scenarios", f"{metadata.get('attacks_total', 0):,}"],
                    ["Expected model-scenario evaluations", f"{metadata.get('expected_count', 0):,}"],
                    ["Attempted evaluations", f"{metadata.get('attempted_count', 0):,}"],
                    ["Scored evaluations", f"{metadata.get('scored_count', 0):,}"],
                    ["API error evaluations", f"{metadata.get('error_count', 0):,}"],
                    ["Timeout evaluations", f"{metadata.get('timeout_count', 0):,}"],
                    ["Coverage rate", percent(metadata.get("scored_count", 0) / metadata.get("expected_count", 1))],
                ],
            ),
            "",
            "## Aggregate Unsafe-Signal Rates",
            "",
            markdown_table(
                ["Metric", "Count / N", "Rate", "95% Wilson interval"],
                [
                    [
                        row["metric"],
                        f"{row['count']:,} / {row['total']:,}",
                        percent(row["rate"]),
                        f"{percent(row['wilson_low'])} to {percent(row['wilson_high'])}",
                    ]
                    for row in aggregate_table(payload)
                ],
            ),
            "",
            "## Cohort Comparison",
            "",
            markdown_table(
                ["Cohort", "Models", "Scored evaluations", "Unsafe count", "Rate", "95% Wilson interval"],
                [
                    [
                        COHORT_LABELS.get(row["cohort"], row["cohort"].replace("-", " ")),
                        f"{row['models']:,}",
                        f"{row['scored']:,}",
                        f"{row['unsafe_count']:,}",
                        percent(row["rate"]),
                        f"{percent(row['wilson_low'])} to {percent(row['wilson_high'])}",
                    ]
                    for row in cohort_table(payload)
                ],
            ),
            "",
            "## Scenario-Family Concentration",
            "",
            markdown_table(
                ["Family / phase", "Scored evaluations", "Unsafe count", "Rate", "95% Wilson interval"],
                [
                    [
                        row["family_phase"],
                        f"{row['scored']:,}",
                        f"{row['unsafe_count']:,}",
                        percent(row["rate"]),
                        f"{percent(row['wilson_low'])} to {percent(row['wilson_high'])}",
                    ]
                    for row in family_table(payload)
                ],
            ),
            "",
        ]
    )
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate paper-ready AgentKillChain statistics from public results.")
    parser.add_argument("--results-json", type=Path, default=ROOT / "results" / "model_results.json")
    parser.add_argument("--format", choices=("markdown", "json"), default="markdown")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    payload = json.loads(args.results_json.read_text(encoding="utf-8"))
    if args.format == "json":
        rendered = json.dumps(
            {
                "findings_summary": findings_summary(payload),
                "aggregate": aggregate_table(payload),
                "cohorts": cohort_table(payload),
                "families": family_table(payload),
            },
            indent=2,
        )
    else:
        rendered = render_markdown(payload)

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered + "\n", encoding="utf-8")
        print(f"Wrote paper statistics to {args.output}")
    else:
        print(rendered)


if __name__ == "__main__":
    main()
