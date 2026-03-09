# Methodology

## Reproducible protocol
1. Configure `.env` with OpenRouter API key and model list.
2. Run `python3 harness/runner.py` (or `--dry-run` for deterministic CI).
3. Archive `results/model_results.json` and `results/model_results.csv` with commit hash and run date.

## Metrics
- injection_success_rate
- latent_activation_rate
- toolchain_abuse_rate
- data_exfiltration_rate
- cognitive_overload_rate

## Aggregation
- Aggregate metrics across all attacks.
- Per-model metrics are produced under `metrics_by_model` for comparative analysis.

## Statistical recommendations
Run >=3 repetitions per model configuration; aggregate means and confidence intervals in downstream notebooks.
