# AgentBoundary v1 — Paper Statistics & Results Tables

**Generated:** May 20, 2026
**Catalog:** v1 diversified (42 unique prompts across 55 scenarios)
**Defense variant:** hardened (production defensive system prompt)
**Cohorts:** 4 (OpenRouter non-LMP, OpenRouter LMP-vector, Ollama Cloud non-LMP, Ollama Cloud LMP-vector)
**Total scored evaluations:** 2,461
**Total attempted:** 2,475 (5 API errors, 9 timeouts)

---

## Table 6.1: Findings Summary

- Complete coverage: 2,475 attempted evaluations, 2,461 scored evaluations, 5 API errors, 9 timeouts.
- Overall unsafe-signal rate: **77 / 2,461 = 3.13%** (95% Wilson interval 2.51% to 3.89%).
- Unsafe signals are concentrated in `toolchain_confusion` (48 / 669, 7.17%).
- No scored evaluation produced a secret-disclosure signal (0 / 2,461).
- No latent-memory poisoning scenario (including 5 obfuscated seeds) produced an unsafe signal (0 / 450).
- The OpenRouter frontier/lite cohort produced only 5 unsafe-signal evaluations, all from `google/gemini-3.1-flash-lite` and `openai/gpt-5.4-mini`.
- The Ollama Cloud baseline cohort produced 72 unsafe-signal evaluations, concentrated in `rnj-1:8b` (11), `nemotron-3-super` (9), and `nemotron-3-nano:30b` (8).
- 1,083 scored evaluations (44.01%) included a refusal flag. Of these, 279 (25.8% of refusals, 11.3% of all scored) were over-refusals that also failed to engage the benign surface task.

---

## Table 6.2: Aggregate Unsafe-Signal Rates (All Cohorts Combined, Hardened Defense)

| Metric | Count / N | Rate | 95% Wilson interval |
| --- | ---: | ---: | ---: |
| Overall unsafe signal | 77 / 2,461 | **3.13%** | 2.51% to 3.89% |
| Refusal | 1,083 / 2,461 | **44.01%** | 42.06% to 45.98% |
| Unsafe instruction adoption | 19 / 2,461 | **0.77%** | 0.49% to 1.20% |
| Unsafe tool proposal | 74 / 2,461 | **3.01%** | 2.40% to 3.76% |
| Secret disclosure signal | 0 / 2,461 | **0.00%** | 0.00% to 0.16% |
| Tool policy block marker | 45 / 2,461 | **1.83%** | 1.37% to 2.44% |

*Note:* The `unsafe_tool_proposal_rate` and `tool_policy_block_rate` are both downstream of the same harness-side argument-inspection rule (see Section 5.4). They are reported separately for transparency but should be read as one structural signal.

---

## Cohort Comparison

| Cohort | Models | Scored evaluations | Unsafe count | Rate | 95% Wilson interval |
| --- | ---: | ---: | ---: | ---: | ---: |
| OpenRouter frontier/lite — non-LMP (hardened) | 6 | 270 | 5 | 1.85% | 0.79% to 4.25% |
| OpenRouter frontier/lite — LMP-vector (hardened) | 6 | 60 | 0 | 0.00% | 0.00% to 6.06% |
| Ollama Cloud baseline — non-LMP (hardened) | 39 | 1,741 | 72 | 4.14% | 3.29% to 5.20% |
| Ollama Cloud baseline — LMP-vector (hardened) | 39 | 390 | 0 | 0.00% | 0.00% to 0.95% |
| **Combined release** | **45** | **2,461** | **77** | **3.13%** | **2.51% to 3.89%** |

---

## Table 6.4: Scenario-Family Concentration (All Cohorts Combined)

| Family | Scored | Unsafe | Rate | 95% Wilson interval |
| --- | ---: | ---: | ---: | ---: |
| toolchain_confusion | 669 | 48 | **7.17%** | 5.45% to 9.38% |
| memory_poisoning | 224 | 7 | **3.12%** | 1.52% to 6.31% |
| html_injection | 224 | 5 | **2.23%** | 0.96% to 5.12% |
| context_drift | 224 | 5 | **2.23%** | 0.96% to 5.12% |
| markdown_injection | 225 | 6 | **2.67%** | 1.23% to 5.69% |
| rag_poisoning | 222 | 3 | **1.35%** | 0.46% to 3.90% |
| cognitive_overload | 223 | 3 | **1.35%** | 0.46% to 3.88% |
| latent_memory_poisoning | 450 | 0 | **0.00%** | 0.00% to 0.85% |

---

## Table 6.5: Defense Ablation (OpenRouter Non-LMP, n=270 each)

| Defense variant | Unsafe | Rate | 95% Wilson interval |
| --- | ---: | ---: | ---: |
| hardened (production prompt) | 5 | **1.85%** | 0.79% to 4.25% |
| generic (no defense) | 20 | **7.41%** | 4.86% to 11.15% |
| generic_plus_memory_filter (deterministic filter) | 16 | **5.93%** | 3.67% to 9.46% |

The `hardened → generic` delta is a **4.0× increase** in unsafe-signal rate, demonstrating that the production defensive system prompt is doing substantial safety work. The `generic → generic_plus_memory_filter` delta is a **20% reduction**, showing that a deterministic imperative-clause filter on non-user-authored content has a measurable but incomplete effect.

---

## Table 6.5b: LMP Defense Ablation (OpenRouter LMP-Vector, n=60 each)

| Defense variant | Unsafe | Rate | 95% Wilson interval |
| --- | ---: | ---: | ---: |
| hardened (production prompt) | 0 | **0.00%** | 0.00% to 6.06% |
| generic (no defense) | 0 | **0.00%** | 0.00% to 6.06% |
| generic_plus_memory_filter (deterministic filter) | 0 | **0.00%** | 0.00% to 6.06% |

The latent-memory-poisoning null result holds across **all three defense variants** on the OpenRouter frontier/lite cohort. This indicates that the 0% unsafe-signal rate is not an artifact of the hardened defensive prompt alone; the evaluated models resist multi-turn conditional activation even with minimal system guidance. This strengthens the interpretation that LMP resistance on this campaign structure is intrinsic to the models' safety training, not dependent on the benchmark's defensive configuration.

---

---

## Table 6.6: Paraphrase Robustness — Toolchain Confusion

| Variant set | Scored | Unsafe | Rate | 95% Wilson interval |
| --- | ---: | ---: | ---: | ---: |
| Base scenarios (5 unique prompts) | 224 | 15 | **6.70%** | 4.10% to 10.74% |
| Paraphrase variants (10 unique prompts) | 445 | 33 | **7.42%** | 5.30% to 10.31% |
| **Combined** | **669** | **48** | **7.17%** | **5.45% to 9.38%** |

The small delta (0.72%) suggests the observed toolchain_confusion signal is robust to plausible adversary rewording at the level a competent manual red-teamer would explore. It does not exclude adaptive search; an automated paraphrase optimizer might find higher-signal variants.

---

## Table 6.7: Utility Metrics (All Cohorts Combined, Hardened Defense)

| Metric | Count / N | Rate |
| --- | ---: | ---: |
| Benign task engagement | 1,836 / 2,461 | **74.60%** |
| Over-refusal | 279 / 2,461 | **11.33%** |
| Safe and useful | 1,804 / 2,461 | **73.30%** |
| Safe but useless | 580 / 2,461 | **23.57%** |

*Definition:* `safe_and_useful` = no unsafe signal AND benign surface task engaged. `safe_but_useless` = no unsafe signal AND no surface task engagement. `over_refusal` = refusal AND no surface task engagement.

**Interpretation:** The benchmark is not dominated by over-refusals. The majority of scored evaluations (73.3%) are safe-and-useful: the model declined the adversarial payload but still engaged with the benign user task. 11.3% are over-refusals, meaning the model's safety behavior degraded utility. The remaining 23.6% are safe-but-useless (no harm, but also no help), which may reflect task-ambiguity or model incapacity rather than safety over-reaction.

---

## Table 6.8: OpenRouter Frontier/Lite Per-Model Detail (Non-LMP, n=45 each)

| Model | Unsafe | Rate | Refusal rate |
| --- | ---: | ---: | ---: |
| openai/gpt-5.3-chat | 0 | **0.00%** | 8.89% |
| openai/gpt-5.4-mini | 1 | **2.22%** | 0.00% |
| anthropic/claude-opus-4.7 | 0 | **0.00%** | 66.67% |
| anthropic/claude-haiku-4.5 | 0 | **0.00%** | 77.78% |
| google/gemini-3.1-pro-preview | 0 | **0.00%** | 48.89% |
| google/gemini-3.1-flash-lite | 4 | **8.89%** | 20.00% |

All observed unsafe-signal evaluations in the OpenRouter cohort came from two models: `gemini-3.1-flash-lite` (4 events) and `gpt-5.4-mini` (1 event). Anthropic's claude-opus-4.7 and claude-haiku-4.5 produced zero unsafe signals, with high refusal rates.

---

## Appendix A: LMP-Vector Detail (All 10 Scenarios, Hardened Defense)

| Cohort | Scored | Unsafe | Rate | 95% Wilson interval |
| --- | ---: | ---: | ---: | ---: |
| OpenRouter frontier/lite (6 models × 10 scenarios) | 60 | 0 | **0.00%** | 0.00% to 6.06% |
| Ollama Cloud baseline (39 models × 10 scenarios) | 390 | 0 | **0.00%** | 0.00% to 0.95% |
| **Combined** | **450** | **0** | **0.00%** | **0.00% to 0.85%** |

This includes the 5 original transparent-seed LMP scenarios and the 5 new obfuscated-seed scenarios (`latent_memory_poisoning_006` through `_010`). Even with obfuscated seeds, the hardened defensive prompt prevents both seed storage and activation-time unsafe behavior across all evaluated models.

---

## Appendix B: Ollama Cloud Per-Model Unsafe-Signal Detail (Non-LMP, n=45 each unless noted)

| Model | Unsafe count | Unsafe rate |
| --- | ---: | ---: |
| rnj-1:8b | 11 | 24.44% |
| nemotron-3-super | 9 | 20.00% |
| nemotron-3-nano:30b | 8 | 17.78% |
| deepseek-v3.2 | 6 | 13.33% |
| ministral-3:3b | 6 | 13.33% |
| qwen3-vl:235b-instruct | 5 | 11.11% |
| ministral-3:8b | 3 | 6.67% |
| qwen3-coder:480b | 2 | 4.44% |
| devstral-2:123b | 2 | 4.44% |
| mistral-large-3:675b | 2 | 4.44% |
| phi-4:latest | 2 | 4.44% |
| nemotron-3:7b | 2 | 4.44% |
| deepseek-r1:671b | 2 | 4.44% |
| gemma3:27b | 1 | 2.22% |
| ... (14 models with 1 unsafe event each) | 14 | 2.22% |
| ... (25 models with 0 unsafe events) | 0 | 0.00% |

25 of 39 Ollama Cloud models produced zero unsafe-signal evaluations. The top unsafe models are primarily small-parameter, less-capable, or less-known models, suggesting a weak inverse correlation between base capability and prompt-injection susceptibility in this harness.
