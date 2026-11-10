# Benchmark Trustworthiness

The current AgentBoundary report is an offline reconciliation of retained observations and recorded judge corrections. It is intended to make the evidence inspectable, including its defects. No new target-model or judge evaluations were performed for this reconciliation.

## Authoritative Inputs and Outputs

The current report is `results/reconciled_stats.json`, with a readable counterpart at `results/reconciled_stats.md`. The source chain is documented in [PROVENANCE.md](docs/PROVENANCE.md): original text-response records, the June 3 few-shot rejudge, and the targeted compliance correction overlay. `results/v1_evaluated.jsonl` is a historical merged label artifact, not a separate experiment.

The report distinguishes 561 planned pairs, 552 retained records, and 551 scorable nonempty responses. It records 372 refusal labels, 11 compliance labels, 168 cases with neither label, and zero overlaps. The 11/551 rate is an automated-label statistic; no independent human-rater study establishes its accuracy.

## Judge Interpretation and Selective Rejudging

Refusal and compliance are separate classifications. A refusal statement can coexist with harmful content, so both flags must remain visible. Neither flag being set does not establish correct benign-task completion or successful detection.

The amended exclusion rule was applied only to the 19 prior positive compliance cases, leaving 11 positives. This is a targeted correction, not a full-cohort validation of the amended rubric. It can change the apparent distribution of outcomes and cannot establish that previously negative cases were correct.

The recorded negative for `cognitive_overload_001` on `deepseek/deepseek-v4-flash` is disputed because the response reproduces the supplied system message. The report identifies this case without silently replacing its label. Independent adjudication should distinguish exact disclosure, harmless quoting, invented secrets, and descriptions of actions that did not execute.

Historical cross-judge artifacts are retained for inspection. Agreement coefficients from an earlier pair of label sets do not validate the final corrected set, and comparisons on different subsets are not interchangeable. Claims of stable model rankings or objectively improved judge accuracy are unsupported by those artifacts.

## Statistical Interpretation

The report includes descriptive Wilson intervals for observed proportions. These do not measure uncertainty from judge error, selected scenarios, correlated observations, provider updates, or post-hoc analysis choices. Nine endpoints with zero positive labels are not nine demonstrated-safe models. No causal claim about parameter count, training, or deployment security follows from these measurements.

The catalog was developed by one author. Sharing prompts and methods makes scrutiny possible but does not remove author selection bias. The scenarios are public, so training contamination or deliberate optimization against this catalog is possible; contamination has not been measured.

## Provenance and Integrity

The later JSONL artifacts contain stored prompt/response text and automated judgments. Their stored text is bounded by acquisition and judging limits; it is not a complete provider transaction log. The correction overlay contains the later decision and rationale. Some fields in the historical merged artifact retain earlier rationale or confidence values, so they must not be presented as the correction's explanation.

The earlier May 20 controlled-harness study used a different public-artifact policy with redacted traces, character counts, and SHA-256 digests. Its 45-endpoint, 1,800-evaluation summary is pinned to a historical commit. It must not be joined to the later JSONL study or the different historical CSV by filename alone.

A digest establishes the byte identity of an artifact. It does not establish provider authenticity, complete logging, or the date on which the source observation was made. Missing provider IDs, opaque upstream model revisions, and the absence of preregistration remain provenance limits.

## Reproducibility

```bash
python3 scripts/analyze.py
python3 scripts/analyze.py --check
```

These commands reproduce the aggregation without API access. They do not reproduce target behavior, validate the judge's decisions, or resolve the disputed label. The next substantive validation step is an independently adjudicated sample that includes positive cases, negative cases, and known disagreements, with the rubric fixed before review.
