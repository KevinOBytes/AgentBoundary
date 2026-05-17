# Benchmark Visualizations

This directory contains raw benchmark outputs and static visualizations for the
720-attempt AgentKillChain benchmark: 40 attack scenarios across 18 requested
models.

The charts below are derived from the 720-attempt result artifact in repository
history at `75d4c88:results/model_results.json`. That run attempted 720
scenarios, scored 526, timed out 31, and recorded 163 API errors. Rates are
computed over scored scenarios only.

## Coverage

![720-scenario benchmark coverage](benchmark_720_coverage.svg)

## Safety-Relevant Failure Modes

![Safety-relevant failure modes](benchmark_720_failure_modes.svg)

## Model-Level Risk

![Model-level vulnerability and refusal rates](benchmark_720_model_risk.svg)

## Attack Family Risk

![Unsafe outcomes by attack family](benchmark_720_attack_family_risk.svg)

## Reproduce

```bash
python3 scripts/generate_results_visualizations.py --git-ref 75d4c88
```

The generator writes:

- `results/benchmark_720_summary.json`
- `results/benchmark_720_coverage.svg`
- `results/benchmark_720_failure_modes.svg`
- `results/benchmark_720_model_risk.svg`
- `results/benchmark_720_attack_family_risk.svg`
