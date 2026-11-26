# Result artifact guide

## Current reconciled chat-completion study

Use [reconciled_stats.json](reconciled_stats.json) for machine-readable statistics and [reconciled_stats.md](reconciled_stats.md) for tables, coverage, source hashes, limitations, and review flags. Generate them and the manuscript's marked result tables with:

```bash
python3 scripts/analyze.py
python3 scripts/analyze.py --check
```

The planned grid is 51 scenarios by 11 endpoints: 561 pairs. The retained data contain 552 records. Nine GPT-5-pro pairs are absent; one retained Claude response is empty and excluded from textual behavior rates. The current automated tally is **11 compliance labels among 551 nonempty scorable responses**. A full-system-text disclosure has a disputed negative label; it remains flagged without silently changing historical judgments.

The report reconstructs these input stages exactly:

| Input | Role |
|---|---|
| `v2_3_rejudged.jsonl` | Full few-shot rejudge: 552 records, 19 positive compliance labels |
| `v2_3_1_compliance_rejudge.jsonl` | Review of those 19 positives, changing eight to negative |
| `v1_evaluated.jsonl` | Retained merged records, with 11 positive labels; reasoning/confidence/timestamps remain from before the overlay |
| `../dataset/attack_catalog.json` | Current 51-scenario catalog; old embedded empirical fields are historical metadata, not current statistics |

The overlay supplies correction reasoning and confidence. The report preserves both stages' provenance. No new judgments or model responses were generated during reconciliation.

## Historical artifacts

These files represent different stages or schemas and must not be joined as a single current release:

| Artifact | Interpretation |
|---|---|
| `v2_3_stats.json` | Intermediate 19-positive judge stage; retained for history |
| `v2_3_1_stats.json` | Earlier 11-positive summary; includes an empty response and an incorrect GPT-5-pro confidence interval; superseded by the reconciled report |
| `v2_2_eval_20260528*.jsonl` | Acquisition/cleaning stages; repeated attempts and earlier labels are not the final response denominator |
| `model_results.json` | Superseded dashboard schema with inconsistent metadata; not consumed by the current website |
| `model_results.csv` | Separate 2,475-pair cohort (45 endpoints by 55 scenarios); not a CSV counterpart of the current report |
| `benchmark_current_summary.json`, `benchmark_current*.svg`, `paper_stats_v1.md` | Historical artifacts; filenames do not establish correspondence with the current study |

The initial 45-endpoint, 40-scenario, 1,800-evaluation aggregate is anchored to the [immutable May 20 summary](https://github.com/KevinOBytes/AgentBoundary/blob/4ed11b07824e7ba195bed6d3b964ce648c6ceffb/results/benchmark_current_summary.json). Its harness, scoring and coverage differ from the later study.

The legacy `scripts/paper_stats.py`, `scripts/build_release.py`, and `scripts/generate_results_visualizations.py` operate on the older harness schema. They do not generate the current reconciled report. `gen_dashboard.py` now delegates to the current offline analysis instead of overwriting the historical dashboard.

Future targeted judging through `scripts/rejudge_compliance_edge_cases.py` uses rubric v2.3.2 and writes a separate artifact under `results/generated/`. It does not replace the historical overlay or establish new published results automatically.
