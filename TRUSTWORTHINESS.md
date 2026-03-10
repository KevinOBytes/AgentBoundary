# Benchmark Trustworthiness

This document outlines the trustworthiness and methodological transparency of the AgentKillChain prototype benchmark.

## Data Contamination Risks
The `attack_catalog.json` contains novel, structured scenarios devised specifically for this framework. Since this repository is public, future foundation models may include this dataset in their alignment training (RLHF/DPO), artificially inflating their resistance to these specific payloads. We plan to keep the core prompt templates open but evaluate models against a hidden hold-out set in future iterations.

## Refusal Variability
AI models are non-deterministic, and safety refusals vary. A run may yield an API Error or a safe refusal on one attempt, and yield a successful injection on another. The benchmark employs robust parsing (scoring) to detect explicit refusals, but some models exhibit "silent failures" where they neither refuse nor execute the payload. These are correctly marked as unsuccessful attacks, but may skew perceived "safety" when the model is simply failing to follow benign instructions.

## LLM-as-a-Judge Efficacy
To eliminate the brittleness of traditional regex/substring matching, AgentKillChain employs an objective LLM judge (typically a frontier model) to read the agent's execution trace and determine if an unsafe instruction was authentically adopted. 
- **False Positives:** The judge may misclassify an agent summarizing the malicious payload as an agent *adopting* it. We mitigate this by instructing the judge to look for explicit tool invocation or active disclosure.
- **False Negatives:** An agent might execute a subtle, obfuscated attack that the judge misses.

## Versioning & Provenance
Every evaluation run outputs exact cryptographic traceability points in `results/model_results.json`:
- Run timestamps
- Exact models requested vs. models invoked (via OpenRouter fallback routing)
- Execution timeouts vs. API errors
- Pass/fail flags per individual scenario phase
