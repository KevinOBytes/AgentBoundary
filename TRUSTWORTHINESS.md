# Benchmark Trustworthiness

This document outlines the trustworthiness and methodological transparency of the AgentKillChain controlled benchmark.

## Data Contamination Risks
The `attack_catalog.json` contains novel, structured scenarios devised specifically for this framework. Since this repository is public, future foundation models may include this dataset in their alignment training (RLHF/DPO), artificially inflating their resistance to these specific payloads. We plan to keep the core prompt templates open but evaluate models against a hidden hold-out set in future iterations.

## Refusal Variability
AI models are non-deterministic, and safety refusals vary. A run may yield an API error or a safe refusal on one attempt, then a different unsafe-signal outcome on another. The benchmark employs parsing and scoring to detect explicit refusals, but some models produce non-action responses where they neither refuse nor execute the task. These are marked as no unsafe signal, but they may still indicate task-following weakness rather than robust safety.

The May 20, 2026 public release uses one pass per model-scenario evaluation. The paper reports Wilson intervals for observed binary proportions, but those intervals do not estimate provider drift, prompt paraphrase sensitivity, or repeated-run variance.

## Scoring Efficacy — v2.1 LLM-as-Judge

AgentKillChain now uses an LLM-as-judge pipeline (`gpt-4o-mini`) with two
orthogonal passes: (1) refusal detection, (2) compliance detection. The v1 release
used deterministic heuristic scoring; v2.1 switched to LLM judging for semantic
nuance but retains the heuristic fallback in
`harness/evaluation.py`.

**Known judge failure modes:**
- **False positives (compliance):** A model may restate or summarize poisoned
  content without executing the attack. The initial smoke test flagged
  `rag_poisoning_005` as compliant when the model merely echoed the payload.
  Severity recalibration flagged this as a judge error.
- **False negatives (compliance):** A model may execute a subtle unsafe action
  the judge template misses, especially in obfuscated RAG or style-guide
  injections.
- **Over-refusal detection:** The judge may classify a safe technical refusal
  as compliance if the refusal text resembles the attack payload.
- **Single-judge bias:** All 204 evaluations used one judge model. Cross-judge
  validation with a second model (e.g., Claude Sonnet) is planned for v2.2.

**Empirical recalibration:** The v2.1 release is the first version where
severity labels are derived from measured model compliance rather than
synthetic harm estimates. The distribution shifted from 82% high/critical (v1)
to 5.9% high, 23.5% medium, 70.6% low (v2.1). This is a methodological honesty
upgrade, not a model-improvement claim.

## Versioning & Provenance
Every public evaluation artifact outputs traceability points in
`results/full_eval_YYYYMMDD.jsonl` without publishing full live request/response
traces:
- Run timestamps
- Exact provider and model identifiers requested for the run
- Execution timeouts vs. API errors
- Pass/fail flags per individual scenario phase
- SHA-256 digests and character counts for redacted request/response traces

Raw traces are retained only in ignored local outputs or private archives. This reduces accidental disclosure of private system prompts, provider diagnostics, and model-generated unsafe content while preserving enough structure to verify evaluation counts and metric aggregation. The public attack catalog remains available for citation and reproduction.
