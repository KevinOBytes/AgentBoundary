# Historical Model Provenance Appendix

This appendix concerns the **initial May 20, 2026 study only**: 45 endpoint identifiers × 40 scenarios = 1,800 scored evaluations. It is separate from the later 11-endpoint chat-completion study. Current endpoint coverage is documented in [PROVENANCE.md](PROVENANCE.md).

## Immutable Historical Source

The [initial release summary](https://github.com/KevinOBytes/AgentBoundary/blob/4ed11b07824e7ba195bed6d3b964ce648c6ceffb/results/benchmark_current_summary.json) is pinned to commit `4ed11b07824e7ba195bed6d3b964ce648c6ceffb`. It records 45 model identifiers, 40 scenarios, 1,800 scored evaluations, and no API errors or timeouts in that released snapshot.

The corresponding [historical model-results artifact](https://github.com/KevinOBytes/AgentBoundary/blob/4ed11b07824e7ba195bed6d3b964ce648c6ceffb/results/model_results.json) belongs to that same commit. The current branch's similarly named JSON and CSV are different artifacts and must not be substituted for it.

The initial cohort consists of 39 Ollama Cloud identifiers and six OpenRouter identifiers. It used the controlled harness with simulated tools, heuristic signals, and an in-process vector-memory experiment. Those execution and scoring conditions differ from the later chat-completion study.

## OpenRouter Cohort

The following requested identifiers are preserved from the initial cohort. Their namespaces are not independent verification of a particular weight revision.

| Requested identifier | Routing provider |
|---|---|
| `openai/gpt-5.3-chat` | OpenRouter |
| `openai/gpt-5.4-mini` | OpenRouter |
| `anthropic/claude-opus-4.7` | OpenRouter |
| `anthropic/claude-haiku-4.5` | OpenRouter |
| `google/gemini-3.1-pro-preview` | OpenRouter |
| `google/gemini-3.1-flash-lite` | OpenRouter |

OpenRouter identifiers specify a routed API endpoint. Reproducing an identifier does not establish that the provider serves identical weights or infrastructure at a later date.

## Ollama Cloud Cohort

The initial record lists these 39 identifiers:

```
cogito-2.1:671b
deepseek-v3.1:671b
deepseek-v3.2
deepseek-v4-flash
deepseek-v4-pro
devstral-2:123b
devstral-small-2:24b
gemini-3-flash-preview
gemma3:12b
gemma3:27b
gemma3:4b
gemma4:31b
glm-4.6
glm-4.7
glm-5
glm-5.1
gpt-oss:120b
gpt-oss:20b
kimi-k2-thinking
kimi-k2.5
kimi-k2.6
kimi-k2:1t
minimax-m2
minimax-m2.1
minimax-m2.5
minimax-m2.7
ministral-3:14b
ministral-3:3b
ministral-3:8b
mistral-large-3:675b
nemotron-3-nano:30b
nemotron-3-super
qwen3-coder-next
qwen3-coder:480b
qwen3-next:80b
qwen3-vl:235b
qwen3-vl:235b-instruct
qwen3.5:397b
rnj-1:8b
```

These are Ollama library identifiers, not cryptographic identities for upstream checkpoints. A name or size tag alone does not establish packaging, quantization, training history, or equivalence to a similarly named endpoint on another provider. The historical results characterize the endpoint reached under that identifier and run conditions.

The runner's Ollama Cloud discovery path calls the authenticated `/api/tags` endpoint and uses returned names when no explicit model list is supplied. A fresh discovery may produce a different cohort; it must not be reported as a reproduction of the original list without checking membership.

## Reproduction Scope

Reproducing the initial study requires its original catalog, harness revision, provider identifiers, and heuristic scoring definitions. The current 51-entry catalog will not yield the historical 45 × 40 matrix. Inspect the pinned commit's artifacts and commands before acquiring new observations.

The actual controlled-harness entry point is `python3 harness/runner.py`; `--help` shows its supported provider, model-list, memory-backend, scoring, and output arguments. Live execution requires the appropriate provider credentials and may incur charges. A `--dry-run` uses simulated outputs and cannot reproduce an empirical result.

The initial release's redacted trace digests identify the corresponding stored records. They do not independently authenticate the endpoint provider, recover redacted text, establish complete collection, or guarantee identical future behavior.

## Comparison Limits

The initial 1,800-evaluation summary, the historical 2,475-row CSV, and the later 551-scorable-response report have different coverage and scoring. Keep their denominators, catalogs, and code paths separate. The current report is [`results/reconciled_stats.md`](../results/reconciled_stats.md).
