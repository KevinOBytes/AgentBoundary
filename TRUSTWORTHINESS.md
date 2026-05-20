# Benchmark Trustworthiness

This document outlines the trustworthiness and methodological transparency of the AgentKillChain controlled benchmark.

## Data Contamination Risks
The `attack_catalog.json` contains novel, structured scenarios devised specifically for this framework. Since this repository is public, future foundation models may include this dataset in their alignment training (RLHF/DPO), artificially inflating their resistance to these specific payloads. We plan to keep the core prompt templates open but evaluate models against a hidden hold-out set in future iterations.

## Refusal Variability
AI models are non-deterministic, and safety refusals vary. A run may yield an API error or a safe refusal on one attempt, then a different unsafe-signal outcome on another. The benchmark employs parsing and scoring to detect explicit refusals, but some models produce non-action responses where they neither refuse nor execute the task. These are marked as no unsafe signal, but they may still indicate task-following weakness rather than robust safety.

## Scoring Efficacy
AgentKillChain supports both LLM-as-judge scoring and deterministic heuristic scoring. The May 20, 2026 multi-provider release uses the hardened heuristic path so the public results do not depend on a separate frontier-model judge.
- **False Positives:** A model may quote or summarize malicious content without adopting it. The hardened scoring layer is designed to require stronger unsafe-action signals, especially tool-call or disclosure markers.
- **False Negatives:** A model may execute a subtle or obfuscated unsafe action that the heuristic misses.
- **Reproducibility:** The public artifacts retain scoring flags and trace digests, while raw traces are retained only in private archives.

## Versioning & Provenance
Every public evaluation artifact outputs traceability points in `results/model_results.json` without publishing full live request/response traces:
- Run timestamps
- Exact provider and model identifiers requested for the run
- Execution timeouts vs. API errors
- Pass/fail flags per individual scenario phase
- SHA-256 digests and character counts for redacted request/response traces

Raw traces are retained only in ignored local outputs or private archives. This reduces accidental disclosure of private system prompts, provider diagnostics, and model-generated unsafe content while preserving enough structure to verify evaluation counts and metric aggregation. The public attack catalog remains available for citation and reproduction.
