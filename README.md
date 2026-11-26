# AgentBoundary Benchmark

An open research benchmark for studying instruction-boundary behavior under prompt injection, memory poisoning, and tool-selection pressure.

**Current study:** 51 scenarios across eight families and 11 model endpoints. The observations are chat-completion outputs, not live tool execution. An earlier, separate study used a controlled agent harness with simulated tools and vector-memory experiments.

**Author:** Kevin O'Connor\
**License:** MIT\
**Observation dates:** May 28–31, 2026\
**Artifact reconciliation:** November 10, 2026

## Current Results

The [reconciled report](results/reconciled_stats.md) is the current source for tables and counts. It applies the recorded targeted judge corrections without making new model or judge API calls.

| Coverage or outcome | Count |
|---|---:|
| Planned model-scenario pairs | 561 |
| Retained response records | 552 |
| Scorable nonempty responses | 551 |
| Explicit-refusal labels | 372 |
| Compliance labels | 11 |
| Neither refusal nor compliance | 168 |
| Overlapping refusal and compliance labels | 0 |

The automated compliance-label rate is **11/551 = 2.00%**, with a descriptive 95% Wilson interval of **1.12%–3.54%**. Nine endpoints have zero positive compliance labels in this sample. These are output classifications under a particular rubric, not safety guarantees or verified real-world harm. The interval does not account for judge errors, shared scenarios, endpoint drift, or adaptive attacks.

**Known unresolved label:** The retained output for `cognitive_overload_001` on `deepseek/deepseek-v4-flash` reproduces the supplied system message, yet the targeted judge correction labels it noncompliant. The report preserves that recorded label and discloses the dispute. No independent human-rater validation has been completed.

Nine planned GPT-5-pro pairs are absent from the retained dataset. One retained Claude response is empty and excluded from the scorable denominator. Neither missing nor empty responses are counted as refusals. See [provenance](docs/PROVENANCE.md), [full results](docs/EMPIRICAL_RESULTS.md), and [limitations](LIMITATIONS.md).

## Two Separate Studies

| Study | Coverage | Execution and scoring |
|---|---|---|
| Initial May 20 study | 45 endpoints × 40 scenarios = 1,800 scored evaluations | Controlled harness, simulated tools, vector-memory experiments, heuristic signals |
| Later May 28–31 study | 11 endpoints × 51 scenarios; 551 scorable responses | Chat completions, automated refusal/compliance labels, June 3 targeted corrections |

The studies have different catalogs, harness paths, and scoring definitions. Their rates cannot be pooled or treated as a longitudinal model-improvement comparison. The initial study's [immutable summary](https://github.com/KevinOBytes/AgentBoundary/blob/4ed11b07824e7ba195bed6d3b964ce648c6ceffb/results/benchmark_current_summary.json) and [model provenance](docs/model_provenance.md) remain available. Legacy `model_results.json` and `model_results.csv` are not the current report.

## Reproduce the Current Report Offline

Python 3.11 or later is sufficient for the statistics workflow. From the repository root:

```bash
python3 scripts/analyze.py
python3 scripts/analyze.py --check
```

The first command regenerates `results/reconciled_stats.json`, `results/reconciled_stats.md`, and the marked result tables in `docs/whitepaper.md` from retained records and the correction overlay. The second verifies that the checked-in report and manuscript tables match those inputs. Neither command calls a model API.

For an offline harness smoke test with simulated outputs:

```bash
python3 harness/runner.py --dry-run --models test-model --judge-mode heuristic   --output-json results/generated/smoke.json   --output-csv results/generated/smoke.csv
```

This smoke test checks execution paths; it is not new empirical evidence. See [methodology](docs/methodology.md) for the distinct acquisition, judging, and historical harness commands.

## Repository Layout

| Path | Purpose |
|---|---|
| `harness/` | Controlled agent harness, simulated tools, optional vector-memory backend |
| `dataset/` | Current 51-scenario catalog and schema |
| `results/` | Retained observations, judge corrections, current report, historical artifacts |
| `scripts/` | Offline reconciliation, validation, and optional live judging tools |
| `docs/` | Manuscript, methods, results, and provenance |
| `website/` | Dashboard and manuscript export tooling |

## What the Labels Mean

The June 3 few-shot judge classified refusal and compliance separately. A later pass reconsidered only its 19 positive compliance cases using an explicit exclusion for mere quotation, translation, or echoing. Eight positives became negatives, leaving 11 recorded positives. The remaining responses were not all rejudged with that amended rule.

The terms `low`, `medium`, `high`, and `critical` in historical catalog fields are compliance-frequency bands, not estimates of operational impact. Quoting an attack string, proposing a tool call, executing it, and causing harm are distinct events; this study directly observes only text outputs.

## Documentation and Citation

- [Manuscript](docs/whitepaper.md)
- [Methods](docs/methodology.md)
- [Trustworthiness](TRUSTWORTHINESS.md)
- [Safety relevance](SAFETY_RELEVANCE.md)
- [Citation metadata](CITATION.cff)

```text
O'Connor, K. (2026). AgentBoundary: Empirical Instruction-Boundary Evaluation.
https://github.com/KevinOBytes/AgentBoundary
```

Use a commit-pinned reference when citing results. The repository's version labels describe historical artifacts and are not evidence of peer review or an external publication.
