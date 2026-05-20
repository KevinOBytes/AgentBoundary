#!/usr/bin/env python3
"""Generate static benchmark visualizations for repository readers.

The charts intentionally use plain SVG and the standard library so they can be
regenerated without a notebook, browser build, or plotting dependency.
"""

from __future__ import annotations

import argparse
import html
import json
import subprocess
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_RESULTS = ROOT / "results" / "model_results.json"
RESULTS_DIR = ROOT / "results"
BENCHMARK_PREFIX = "benchmark_current"

PALETTE = {
    "ink": "#111827",
    "muted": "#6B7280",
    "grid": "#E5E7EB",
    "panel": "#F9FAFB",
    "scored": "#2563EB",
    "timeout": "#D97706",
    "error": "#DC2626",
    "safe": "#059669",
    "warn": "#D97706",
    "risk": "#DC2626",
    "accent": "#7C3AED",
}


def load_results(input_path: Path | None, git_ref: str | None) -> tuple[dict[str, Any], str]:
    if git_ref:
        raw = subprocess.check_output(
            ["git", "show", f"{git_ref}:results/model_results.json"],
            cwd=ROOT,
        )
        return json.loads(raw), f"{git_ref}:results/model_results.json"

    path = input_path or DEFAULT_RESULTS
    return json.loads(path.read_text()), str(path.relative_to(ROOT))


def pct(value: float) -> str:
    return f"{value * 100:.2f}%"


def model_label(model: str) -> str:
    return model.split("/")[-1]


def status_summary(results: dict[str, Any]) -> dict[str, int]:
    metadata = results["metadata"]
    attempted = int(
        metadata.get("attempted_count")
        or metadata.get("expected_count")
        or len(metadata.get("models_requested", [])) * metadata["attacks_total"]
    )
    return {
        "scored": int(metadata.get("scored_count", 0)),
        "timed_out": int(metadata.get("timeout_count", 0)),
        "api_error": int(metadata.get("error_count", 0)),
        "attempted": attempted,
    }


def matrix_label(results: dict[str, Any]) -> str:
    metadata = results["metadata"]
    attempted = status_summary(results)["attempted"]
    models = int(metadata.get("models_total") or len(metadata.get("models_requested", [])))
    attacks = int(metadata.get("attacks_total", 0))
    return f"{attempted:,} evaluations: {attacks} scenarios x {models} models"


def family_summary(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    families: dict[str, Counter[str]] = defaultdict(Counter)
    for row in rows:
        family = row["attack_id"].rsplit("_", 1)[0]
        status = row.get("status")
        families[family]["attempted"] += 1
        if status != "scored":
            families[family][status or "unscored"] += 1
            continue

        flags = row.get("flags", {})
        families[family]["scored"] += 1
        families[family]["refusal"] += int(bool(flags.get("refusal_detected")))
        unsafe = any(
            bool(flags.get(key))
            for key in (
                "unsafe_instruction_adopted",
                "unsafe_tool_call_proposed",
                "secret_disclosure_claimed",
                "policy_violation",
            )
        )
        families[family]["unsafe"] += int(unsafe)
        families[family]["toolchain_abuse"] += int(bool(flags.get("unsafe_tool_call_proposed")))
        families[family]["secret_disclosure"] += int(bool(flags.get("secret_disclosure_claimed")))

    rows_out: list[dict[str, Any]] = []
    for family, counts in sorted(families.items()):
        scored = counts["scored"]
        rows_out.append(
            {
                "family": family,
                "attempted": counts["attempted"],
                "scored": scored,
                "unsafe": counts["unsafe"],
                "unsafe_rate": counts["unsafe"] / scored if scored else 0,
                "refusal_rate": counts["refusal"] / scored if scored else 0,
                "toolchain_abuse": counts["toolchain_abuse"],
                "secret_disclosure": counts["secret_disclosure"],
            }
        )
    return rows_out


def write_summary(results: dict[str, Any], source: str, output: Path) -> None:
    metadata = results["metadata"]
    rows = results["results"]
    payload = {
        "source": source,
        "run_timestamp": metadata.get("run_timestamp"),
        "benchmark_version": metadata.get("benchmark_version"),
        "models_requested": metadata.get("models_requested", []),
        "attacks_total": metadata.get("attacks_total"),
        "attempted_evaluations": status_summary(results)["attempted"],
        "outcomes": status_summary(results),
        "global_metrics": results["metrics"],
        "metrics_by_model": results["metrics_by_model"],
        "metrics_by_attack_family": family_summary(rows),
    }
    output.write_text(json.dumps(payload, indent=2) + "\n")


def svg_header(title: str, subtitle: str, width: int, height: int) -> list[str]:
    return [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc">',
        f'<title id="title">{html.escape(title)}</title>',
        f'<desc id="desc">{html.escape(subtitle)}</desc>',
        '<rect width="100%" height="100%" rx="0" fill="#FFFFFF"/>',
        f'<text x="32" y="42" fill="{PALETTE["ink"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="24" font-weight="700">{html.escape(title)}</text>',
        f'<text x="32" y="68" fill="{PALETTE["muted"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="13">{html.escape(subtitle)}</text>',
    ]


def svg_footer(parts: list[str]) -> str:
    parts.append("</svg>")
    return "\n".join(parts) + "\n"


def write_outcome_chart(results: dict[str, Any], output: Path) -> None:
    summary = status_summary(results)
    attempted = summary["attempted"]
    segments = [
        ("Scored", summary["scored"], PALETTE["scored"]),
        ("Timed out", summary["timed_out"], PALETTE["timeout"]),
        ("API error", summary["api_error"], PALETTE["error"]),
    ]
    width, height = 920, 430
    parts = svg_header(
        f"{attempted:,}-Evaluation Benchmark Coverage",
        f"Outcome mix across {matrix_label(results)}.",
        width,
        height,
    )

    bar_x, bar_y, bar_w, bar_h = 72, 154, 776, 48
    parts.append(f'<rect x="{bar_x}" y="{bar_y}" width="{bar_w}" height="{bar_h}" rx="6" fill="{PALETTE["grid"]}"/>')
    cursor = bar_x
    for label, count, color in segments:
        seg_w = round(bar_w * count / attempted, 2)
        parts.append(f'<rect x="{cursor}" y="{bar_y}" width="{seg_w}" height="{bar_h}" rx="6" fill="{color}"/>')
        cursor += seg_w

    label_y = 282
    for index, (label, count, color) in enumerate(segments):
        x = 92 + index * 270
        parts.extend(
            [
                f'<rect x="{x}" y="{label_y - 48}" width="14" height="14" rx="2" fill="{color}"/>',
                f'<text x="{x + 24}" y="{label_y - 36}" fill="{PALETTE["ink"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="15" font-weight="700">{html.escape(label)}</text>',
                f'<text x="{x}" y="{label_y}" fill="{PALETTE["ink"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="38" font-weight="800">{count}</text>',
                f'<text x="{x}" y="{label_y + 26}" fill="{PALETTE["muted"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="13">{count / attempted * 100:.1f}% of evaluations</text>',
            ]
        )

    parts.extend(
        [
            f'<line x1="72" y1="340" x2="848" y2="340" stroke="{PALETTE["grid"]}" />',
            f'<text x="72" y="374" fill="{PALETTE["ink"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="16" font-weight="700">Scored denominator: {summary["scored"]}</text>',
            f'<text x="72" y="398" fill="{PALETTE["muted"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="13">Global rates below are computed only from scored results, not from transport failures.</text>',
        ]
    )
    output.write_text(svg_footer(parts))


def write_global_metrics_chart(results: dict[str, Any], output: Path) -> None:
    summary = status_summary(results)
    metrics = [
        ("Unsafe instruction adoption", results["metrics"]["unsafe_instruction_adoption_rate"], PALETTE["risk"]),
        ("Unsafe tool proposal", results["metrics"]["unsafe_tool_proposal_rate"], PALETTE["warn"]),
        ("Secret disclosure signal", results["metrics"]["secret_disclosure_rate"], PALETTE["accent"]),
        ("Policy violation", results["metrics"]["policy_violation_rate"], PALETTE["muted"]),
    ]
    width, height = 920, 450
    parts = svg_header(
        "Safety-Relevant Failure Modes",
        f"Rates over {summary['scored']:,} scored evaluations from the {summary['attempted']:,}-evaluation benchmark.",
        width,
        height,
    )

    max_value = 0.02
    chart_x, chart_y, chart_w = 300, 132, 500
    for i in range(5):
        x = chart_x + chart_w * i / 4
        parts.append(f'<line x1="{x:.1f}" y1="112" x2="{x:.1f}" y2="346" stroke="{PALETTE["grid"]}" />')
        parts.append(f'<text x="{x - 14:.1f}" y="372" fill="{PALETTE["muted"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="11">{i * 0.5:.1f}%</text>')

    for index, (label, value, color) in enumerate(metrics):
        y = chart_y + index * 56
        bar_w = chart_w * value / max_value
        parts.extend(
            [
                f'<text x="72" y="{y + 18}" fill="{PALETTE["ink"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="14" font-weight="650">{html.escape(label)}</text>',
                f'<rect x="{chart_x}" y="{y}" width="{chart_w}" height="24" rx="4" fill="{PALETTE["panel"]}" stroke="{PALETTE["grid"]}"/>',
                f'<rect x="{chart_x}" y="{y}" width="{bar_w:.1f}" height="24" rx="4" fill="{color}"/>',
                f'<text x="{chart_x + chart_w + 18}" y="{y + 18}" fill="{PALETTE["ink"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="14" font-weight="700">{pct(value)}</text>',
            ]
        )

    parts.extend(
        [
            f'<text x="72" y="418" fill="{PALETTE["muted"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="12">Interpretation: low absolute rates still matter because these are latent, tool-mediated agent failures under a controlled harness.</text>',
        ]
    )
    output.write_text(svg_footer(parts))


def write_model_chart(results: dict[str, Any], output: Path) -> None:
    metrics = results["metrics_by_model"]
    rows = sorted(
        metrics.items(),
        key=lambda item: (item[1]["overall_vulnerability_score"], item[1]["refusal_rate"], item[0]),
        reverse=True,
    )
    width, height = 1080, 760
    height = max(height, 150 + len(rows) * 34)
    parts = svg_header(
        "Model-Level Risk and Refusal Rates",
        "Overall unsafe-signal score and refusal behavior among scored evaluations.",
        width,
        height,
    )
    max_risk = max(row[1]["overall_vulnerability_score"] for row in rows) or 0.01
    max_refusal = max(row[1]["refusal_rate"] for row in rows) or 0.01
    left, top, risk_w, refusal_w = 296, 112, 270, 270

    parts.extend(
        [
            f'<text x="{left}" y="94" fill="{PALETTE["risk"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="12" font-weight="700">Unsafe signal</text>',
            f'<text x="{left + risk_w + 82}" y="94" fill="{PALETTE["scored"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="12" font-weight="700">Refusal</text>',
        ]
    )

    for index, (model, model_metrics) in enumerate(rows):
        y = top + index * 34
        risk = model_metrics["overall_vulnerability_score"]
        refusal = model_metrics["refusal_rate"]
        risk_bar = risk_w * risk / max_risk
        refusal_bar = refusal_w * refusal / max_refusal
        label = model_label(model)
        parts.extend(
            [
                f'<text x="32" y="{y + 15}" fill="{PALETTE["ink"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="12">{html.escape(label)}</text>',
                f'<rect x="{left}" y="{y}" width="{risk_w}" height="18" rx="3" fill="{PALETTE["panel"]}" stroke="{PALETTE["grid"]}"/>',
                f'<rect x="{left}" y="{y}" width="{risk_bar:.1f}" height="18" rx="3" fill="{PALETTE["risk"]}"/>',
                f'<text x="{left + risk_w + 12}" y="{y + 14}" fill="{PALETTE["ink"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="11">{risk * 100:.1f}%</text>',
                f'<rect x="{left + risk_w + 82}" y="{y}" width="{refusal_w}" height="18" rx="3" fill="{PALETTE["panel"]}" stroke="{PALETTE["grid"]}"/>',
                f'<rect x="{left + risk_w + 82}" y="{y}" width="{refusal_bar:.1f}" height="18" rx="3" fill="{PALETTE["scored"]}"/>',
                f'<text x="{left + risk_w + 82 + refusal_w + 12}" y="{y + 14}" fill="{PALETTE["ink"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="11">{refusal * 100:.1f}%</text>',
            ]
        )

    output.write_text(svg_footer(parts))


def write_family_chart(results: dict[str, Any], output: Path) -> None:
    rows = sorted(family_summary(results["results"]), key=lambda row: row["unsafe_rate"], reverse=True)
    width, height = 920, 540
    parts = svg_header(
        "Unsafe Outcomes by Attack Family",
        "Unsafe rate by family, with scored denominator shown for each family.",
        width,
        height,
    )
    max_rate = max(row["unsafe_rate"] for row in rows) or 0.01
    left, top, bar_w = 270, 120, 500

    for index, row in enumerate(rows):
        y = top + index * 44
        width_px = bar_w * row["unsafe_rate"] / max_rate
        label = row["family"].replace("_", " ")
        parts.extend(
            [
                f'<text x="48" y="{y + 17}" fill="{PALETTE["ink"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="13" font-weight="650">{html.escape(label)}</text>',
                f'<rect x="{left}" y="{y}" width="{bar_w}" height="24" rx="4" fill="{PALETTE["panel"]}" stroke="{PALETTE["grid"]}"/>',
                f'<rect x="{left}" y="{y}" width="{width_px:.1f}" height="24" rx="4" fill="{PALETTE["risk"]}"/>',
                f'<text x="{left + bar_w + 18}" y="{y + 17}" fill="{PALETTE["ink"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="12" font-weight="700">{row["unsafe_rate"] * 100:.1f}%</text>',
                f'<text x="{left + bar_w + 72}" y="{y + 17}" fill="{PALETTE["muted"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="12">n={row["scored"]}</text>',
            ]
        )

    parts.extend(
        [
            f'<line x1="48" y1="488" x2="850" y2="488" stroke="{PALETTE["grid"]}" />',
            f'<text x="48" y="516" fill="{PALETTE["muted"]}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="12">Unsafe means at least one unsafe instruction adoption, unsafe tool proposal, secret disclosure, or policy violation flag.</text>',
        ]
    )
    output.write_text(svg_footer(parts))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, help="Path to a model_results.json file.")
    parser.add_argument("--git-ref", help="Read results/model_results.json from a git revision.")
    args = parser.parse_args()

    results, source = load_results(args.input, args.git_ref)
    RESULTS_DIR.mkdir(exist_ok=True)
    write_summary(results, source, RESULTS_DIR / f"{BENCHMARK_PREFIX}_summary.json")
    write_outcome_chart(results, RESULTS_DIR / f"{BENCHMARK_PREFIX}_coverage.svg")
    write_global_metrics_chart(results, RESULTS_DIR / f"{BENCHMARK_PREFIX}_failure_modes.svg")
    write_model_chart(results, RESULTS_DIR / f"{BENCHMARK_PREFIX}_model_risk.svg")
    write_family_chart(results, RESULTS_DIR / f"{BENCHMARK_PREFIX}_attack_family_risk.svg")
    print(f"Wrote benchmark visualizations from {source}")


if __name__ == "__main__":
    main()
