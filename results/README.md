# Benchmark Visualizations

This directory contains public benchmark outputs and static visualizations for
the current AgentBoundary benchmark release. Public result artifacts keep the
attack catalog public while redacting full live request/response traces. They
retain metrics, flags, evaluation counts, character counts, and SHA-256 digests.

The current artifact is the May 20, 2026 multi-provider release: 40 attack
scenarios across 45 models from authenticated Ollama Cloud and OpenRouter
cohorts, for 1,800 scored model-scenario evaluations. The final artifact has
0 API errors and 0 timeouts. Rates are computed over scored evaluations unless
explicitly labeled as attempted-rate metrics.

The latent-memory poisoning scenarios in this artifact use the vector-memory
rerun path: seed payloads are stored in an in-process ChromaDB collection and
activation retrieves top-k chunks into `[RETRIEVED_MEMORY]` prompt blocks before
the target model is called.

The legacy JSON flag `policy_violation` is reported in aggregate as
`tool_policy_block_rate`. It marks a harness-side mock tool policy block, not a
semantic finding that the model text independently violated provider policy.

## Coverage

![Current benchmark coverage](benchmark_current_coverage.svg)

## Safety-Relevant Failure Modes

![Safety-relevant failure modes](benchmark_current_failure_modes.svg)

## Model-Level Risk

![Model-level unsafe-signal and refusal rates](benchmark_current_model_risk.svg)

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

Raw live-run and dry-run traces should stay outside the public repository,
preferably under the ignored `results/generated/` directory or in private
archival storage.
