# Methodology

## Reproducible protocol
1. Configure `.env` with OpenRouter API key, model list, and optional `AGENT_SYSTEM_PROMPT`.
2. Run `python3 harness/runner.py` (or `--dry-run` for deterministic CI).
3. Validate outputs with `python3 scripts/validate_artifacts.py`.
4. Archive `results/generated/model_results.json` and `results/generated/model_results.csv` with commit hash and run date.

## Experiment matrix
| Dimension | Values |
|---|---|
| Models | gpt-5, claude-3.7, gemini-1.5-pro, mistral-large |
| Attack categories | 8 |
| Attacks | 40 |
| Repetitions | >=3 per model in live runs |

## Metrics
- injection_success_rate
- latent_activation_rate
- toolchain_abuse_rate
- data_exfiltration_rate
- cognitive_overload_rate

## Aggregation
- Aggregate metrics across all attacks.
- Per-model metrics are produced under `metrics_by_model` for comparative analysis.

## Baselines and ablations
- Baseline: standard system prompt and policy routing.
- Ablation A: memory safeguards reduced.
- Ablation B: tool policy gate relaxed.
- Ablation C: refusal-filtering disabled.

## Evaluation safety note
Injection success is based on executed malicious behavior signals and excludes plain refusal text echoes to reduce false positives.

## Statistical recommendations
Run >=3 repetitions per model configuration; aggregate means with 95% confidence intervals (bootstrap recommended).
