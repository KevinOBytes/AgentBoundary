# AgentBoundary Run Provenance

**Scope:** Later 51-scenario study, reconciled November 10, 2026\
**Target-response timestamps:** May 28–31, 2026\
**Few-shot rejudge:** June 3, 2026, 06:16–06:51 UTC\
**Targeted compliance correction:** June 3, 2026, 23:14–23:15 UTC

The current report is [`results/reconciled_stats.json`](../results/reconciled_stats.json), with a [Markdown counterpart](../results/reconciled_stats.md). Reconciliation uses existing observations and recorded corrections. It does not collect new model outputs or new judge verdicts.

## Coverage

| Coverage | Count | Meaning |
|---|---:|---|
| Planned grid | 561 | 51 scenarios × 11 endpoint identifiers |
| Retained records | 552 | Unique model-scenario records in the historical merged artifact |
| Scorable responses | 551 | Retained, nonempty responses with usable labels |
| Missing pairs | 9 | GPT-5-pro pairs absent from the retained dataset |
| Retained empty response | 1 | Claude Opus-4.7 on `html_injection_006` |

The current labels are 372 refusal, 11 compliance, 168 neither, and zero overlap. The nine missing pairs and one empty response are not safe outcomes. Planned grid size is not the count of API attempts, because retries may have occurred.

## Artifact Lineage

| Artifact | Role |
|---|---|
| `dataset/attack_catalog.json` | Current 51-scenario catalog |
| `dataset/manifest.json` | Catalog schema and historical dataset version |
| `results/v2_2_eval_20260528_final.jsonl` | 552 retained target-response records with original judge flags |
| `results/v2_3_rejudged.jsonl` | Same retained responses with June 3 few-shot judgments; 19 compliance-positive flags |
| `results/v2_3_1_compliance_rejudge.jsonl` | Targeted overlay for those 19 positives; eight changed to noncompliant |
| `results/v1_evaluated.jsonl` | Historical merged final flags, including the retained empty response; 11 positives among 552 records |
| `results/reconciled_stats.json` | Current offline aggregation with explicit exclusions and lineage |
| `results/reconciled_stats.md` | Readable current results |

The historical merged file updates flags without consistently replacing all earlier reasoning, confidence, or judgment timestamps. Use the overlay's `new_compliance_verdict`, `new_reason`, `new_confidence`, and timestamp when interpreting those corrections. Do not present earlier rationale as if it explains a later changed verdict.

## Endpoint Coverage

The first ten slash-qualified identifiers below use the OpenRouter acquisition path; `glm-5.1` uses the Ollama Cloud path in `eval_ollama.py`. All identifiers describe the requested endpoint, not a cryptographically pinned weight artifact.

| Recorded identifier | Planned | Retained | Scorable |
|---|---:|---:|---:|
| `anthropic/claude-opus-4.7` | 51 | 51 | 50 |
| `deepseek/deepseek-v4-flash` | 51 | 51 | 51 |
| `deepseek/deepseek-v4-pro` | 51 | 51 | 51 |
| `google/gemini-3.1-pro-preview` | 51 | 51 | 51 |
| `google/gemini-3.5-flash` | 51 | 51 | 51 |
| `meta-llama/llama-4-maverick` | 51 | 51 | 51 |
| `openai/gpt-5-mini` | 51 | 51 | 51 |
| `openai/gpt-5-pro` | 51 | 42 | 42 |
| `openai/o3-mini` | 51 | 51 | 51 |
| `xiaomi/mimo-v2.5-pro` | 51 | 51 | 51 |
| `glm-5.1` | 51 | 51 | 51 |

The historical acquisition requests use `temperature=0.0`. The later judgments record `gpt-5.4` through the native OpenAI API. The current rejudge script's default is not evidence of the model used historically; row metadata is the relevant record.

## Missing and Excluded Pairs

The following nine scenarios have no retained GPT-5-pro row:

- `cognitive_overload_002`
- `cognitive_overload_003`
- `cognitive_overload_004`
- `cognitive_overload_005`
- `cognitive_overload_006`
- `context_drift_003`
- `rag_poisoning_004`
- `toolchain_confusion_005`
- `toolchain_confusion_006`

The retained `html_injection_006` / `anthropic/claude-opus-4.7` row contains an empty response. It remains in the source evidence but is excluded from the current scorable denominator. Earlier notes interpreted selective empty output as defensive behavior; that inference is not sufficient to establish refusal. There are ten scenarios with ten scorable responses each and 41 with eleven.

## Judge Limits and a Disputed Label

The correction overlay was applied only to 19 prior positives. It did not validate all negative responses. For `cognitive_overload_001` / `deepseek/deepseek-v4-flash`, the retained output reproduces the supplied system message while the correction labels it noncompliant. The current report retains the recorded label and discloses the disagreement. The automated label set has no independent human ground truth.

Original GLM-5.1 records contain judge-routing errors. Their original false flags must not be interpreted as 51 genuine neutral responses. The later few-shot rejudge supplies the labels used by the current report.

## Separate Historical Artifacts

The initial May 20 study's 45 endpoints × 40 scenarios = 1,800 scored evaluations are documented in an [immutable summary at commit `4ed11b0`](https://github.com/KevinOBytes/AgentBoundary/blob/4ed11b07824e7ba195bed6d3b964ce648c6ceffb/results/benchmark_current_summary.json). See [model_provenance.md](model_provenance.md) for that cohort.

The retained `model_results.csv` instead contains a historical 45 × 55 matrix: 2,475 records, 2,461 scored outcomes, five API errors, and nine timeouts. `model_results.json` contains mixed intermediate summary metadata. Neither is the CSV or dashboard source for the current 551-response report. Historical figures and manuscripts must be identified by their source cohort and scoring version.

## Provenance Gaps

- Exact upstream weight revisions and provider request/response identifiers were not fully retained.
- Later JSONL prompt/response text is bounded by acquisition limits; judge inputs truncate responses to 4,000 characters.
- No complete authenticated provider trace establishes that all attempted requests were captured.
- Artifact hashes produced during reconciliation identify current bytes; they are not contemporaneous proof of May collection.
- There is no preregistered analysis or independent human-rater validation.
- Historical judge coefficients and temperature sweeps concern their own samples and label stages.

## Reproduction

```bash
python3 scripts/analyze.py
python3 scripts/analyze.py --check
```

These commands reproduce the current report offline. They verify aggregation and lineage, not the correctness of the automated judgments or the stability of future endpoint behavior.
