# Benchmark Visualizations

This directory contains raw benchmark outputs and static visualizations for the
current AgentKillChain benchmark run.

The current artifact is the Ollama Cloud run from May 20, 2026: 40 attack
scenarios across 39 authenticated Ollama Cloud models, for 1,560 attempted
model-scenario pairs. The run produced 1,559 scored rows, 1 API error row, and
0 timeouts. Rates are computed over scored scenarios unless explicitly labeled
as attempted-rate metrics.

## Coverage

![Current benchmark coverage](benchmark_current_coverage.svg)

## Safety-Relevant Failure Modes

![Safety-relevant failure modes](benchmark_current_failure_modes.svg)

## Model-Level Risk

![Model-level vulnerability and refusal rates](benchmark_current_model_risk.svg)

## Attack Family Risk

![Unsafe outcomes by attack family](benchmark_current_attack_family_risk.svg)

## Reproduce

```bash
python3 scripts/generate_results_visualizations.py
```

The generator writes:

- `results/benchmark_current_summary.json`
- `results/benchmark_current_coverage.svg`
- `results/benchmark_current_failure_modes.svg`
- `results/benchmark_current_model_risk.svg`
- `results/benchmark_current_attack_family_risk.svg`
