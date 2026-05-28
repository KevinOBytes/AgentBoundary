# AgentKillChain: A Versioned Benchmark for Persistent Compromise in Tool-Using AI Agents

**Author:** Kevin O'Connor

**Version:** Versioned benchmark manuscript, May 20, 2026

**Repository:** https://github.com/KevinOBytes/AgentKillChain

## Abstract

Tool-using AI agents combine language-model reasoning with retrieval, memory, and privileged actions. That integration changes the security problem: untrusted content is no longer only text to be summarized, but potential control input that can be preserved in memory and later influence tool selection. AgentKillChain is a versioned, open benchmark for measuring this specific risk under a controlled assistant-agent architecture. The benchmark contains 40 scenarios across eight prompt-injection and memory-poisoning families, including single-turn tool-selection pressure and multi-phase seed, dormancy, and activation workflows. The May 20, 2026 public release evaluates 45 models across authenticated Ollama Cloud and OpenRouter provider cohorts, producing 1,800 attempted and scored model-scenario evaluations with no API errors or timeouts. Under deterministic heuristic scoring, 25 evaluations emitted at least one unsafe signal, for an overall unsafe-signal rate of 1.39% with a 95% Wilson interval of 0.94% to 2.04%. Signals were concentrated in toolchain-confusion and single-phase memory/context-manipulation scenarios; the vector-backed latent-memory rerun, implemented with embedded retrieval and verbatim memory injection, did not produce scored unsafe activation. AgentKillChain is not a universal model-security ranking. It is a reproducible measurement harness for one agent design, with public aggregate artifacts, public attack catalog prompts, and redacted live request/response traces. The release provides a baseline for regression testing and for evaluating defenses such as memory provenance, deterministic tool authorization, and context separation.

**Keywords:** AI security, autonomous agents, prompt injection, indirect prompt injection, memory poisoning, tool use, red teaming, benchmark, Ollama, OpenRouter

## 1. Introduction

Large language model applications are moving from stateless chat toward agents that retrieve documents, summarize working context, maintain memory, and call tools. This shift makes traditional prompt-injection risk more operational. A malicious instruction can enter through a document, note, email, webpage, or tool output; it can be written into a memory store; and it can reappear later when the agent is deciding whether to call a sensitive tool.

The central security boundary is therefore not only between user and system prompt. It is also between trusted control instructions and untrusted data that may be processed across time. A secure agent should preserve this boundary even when the untrusted data is semantically relevant to the user task.

AgentKillChain evaluates this boundary in a controlled setting. It asks whether a representative assistant loop emits explicit unsafe signals when exposed to poisoned documents, memory stores, context-drift prompts, and tool-selection pressure. The benchmark does not execute real tools. It uses a stubbed tool layer and deterministic scoring so that the same release artifact can be reproduced, inspected, and compared in later runs.

This paper is written as a versioned benchmark report rather than a claim of comprehensive model safety. Its contribution is a reproducible measurement slice: a fixed scenario catalog, a documented harness, a public result artifact, and a release policy that preserves evidence without publishing full live traces.

## 2. Research Questions

The release is organized around four research questions.

**RQ1. Frequency:** Under one fixed assistant-agent architecture and deterministic scoring policy, how often do evaluated models emit unsafe signals when exposed to the AgentKillChain scenario catalog?

**RQ2. Failure-mode concentration:** Which scenario families and phases account for observed unsafe signals?

**RQ3. Cohort behavior:** How do the broader authenticated Ollama Cloud cohort and the smaller OpenRouter frontier/lite cohort compare under the same harness and scoring policy?

**RQ4. Public evidence:** What artifact policy supports reproducible public reporting while avoiding publication of full live request/response traces that may contain private system-prompt material, provider diagnostics, or model-generated unsafe text?

## 3. Related Work

AgentKillChain sits at the intersection of indirect prompt injection, agent robustness benchmarks, and generative-AI red-team tooling.

Greshake et al. introduced indirect prompt injection as a risk for LLM-integrated applications, emphasizing that retrieved data can blur the line between instructions and data and can influence API use. Microsoft Research's work on benchmarking and defending against indirect prompt injection similarly frames the problem as a systematic evaluation task and studies defenses for applications that process external content.

AgentDojo is the closest benchmark reference point. It evaluates prompt-injection attacks and defenses for LLM agents in dynamic tool-calling environments, with realistic tasks, security test cases, and explicit utility/security criteria. AgentKillChain is narrower. It does not attempt to simulate full application environments or benchmark benign task utility. Instead, it focuses on persistent context compromise, memory carryover, and release hygiene for public artifacts.

Instruction-hierarchy work from OpenAI formalizes the same privilege-ordering problem that motivates AgentKillChain: system and developer instructions should dominate user messages, and user intent should dominate untrusted third-party or tool-output content. SPML similarly treats prompt definitions and user inputs as separable objects that can be checked against intended chatbot behavior. Anthropic's prompt-injection mitigation work and Claude system-card discussion reinforce the same operational point: agent environments expose models to untrusted content, so robustness needs both model training and system-layer safeguards.

General red-team frameworks such as garak and PyRIT address broader generative-AI risk discovery. They are useful for probing many classes of model and application behavior, but they are not specifically scoped to a fixed stateful agent loop with a public model-scenario matrix and release-redaction policy.

OWASP's LLM Top 10 and Agentic AI threat guidance provide the operational security context. Prompt injection, sensitive information disclosure, insecure plugin design, and excessive agency are all relevant to a tool-using assistant. NIST's Generative AI Profile similarly frames generative-AI risk management as a cross-sector practice involving evaluation, monitoring, and trustworthiness controls. AgentKillChain is best read as an empirical artifact that supports those practices for a specific class of agent failure.

| Reference area | What it contributes | How AgentKillChain differs |
|---|---|---|
| Indirect prompt injection | Shows that external content can steer LLM-integrated applications and API use. | Measures a fixed agent loop across a versioned model-scenario matrix. |
| Instruction hierarchy / SPML | Frames privileged instruction ordering and structured prompt-definition checks. | Tests whether one concrete assistant loop preserves those boundaries under persistent context pressure. |
| AgentDojo | Dynamic environments, tool execution, utility/security criteria for agent attacks and defenses. | Focuses on persistent compromise and public release artifacts rather than broad task utility. |
| garak / PyRIT | General red-team automation and vulnerability discovery. | Provides a narrow, reproducible benchmark with stable scenario identifiers and cohort metadata. |
| OWASP / NIST guidance | Operational risk categories and governance framing. | Supplies concrete empirical evidence for one agent architecture and one release date. |

## 4. Threat Model

AgentKillChain models an attacker who can place untrusted content where an assistant agent may read or remember it. The attacker does not control the system prompt, harness code, model provider, or scoring code. The attacker goal is to induce the agent to adopt an unsafe instruction, propose a sensitive tool action, disclose a secret, or cross an explicit policy boundary.

The benchmark adapts a kill-chain structure to stateful AI agents:

1. **Initial access:** Untrusted content enters through user input, retrieved documents, notes, web content, or tool outputs.
2. **Execution:** The model treats adversarial content as task-relevant instruction rather than data.
3. **Persistence:** A memory or summary step carries adversarial content into later context.
4. **Activation:** A later benign-looking workflow triggers the carried instruction.
5. **Escalation:** The agent proposes a privileged tool action or unsafe response.
6. **Impact:** The response or proposed action would leak data, violate policy, or route execution toward an attacker-controlled objective if executed by a real system.

The trust boundary is explicit:

| Component | Trust assumption in benchmark |
|---|---|
| System prompt | Trusted control instruction. |
| User task | Trusted user intent for the simulated workflow. |
| Retrieved or embedded content | Untrusted data, even when relevant to the task. |
| Memory store | Potentially contaminated state that must preserve provenance. |
| Tool schema | Trusted interface description. |
| Tool arguments proposed by the model | Untrusted until independently authorized. |
| Scoring code | Trusted measurement layer. |

The benchmark is intentionally conservative about effects. Tools are mocked. No email, network request, file write, shell command, or credential lookup is executed. The measured object is the model-agent loop's unsafe proposal or response, not realized harm in a production environment.

## 5. Benchmark Design

### 5.1 Scenario Catalog

The dataset contains 40 structured scenarios:

| Dimension | Value |
|---|---:|
| Payload families | 8 |
| Workflow framings | 5 |
| Total scenarios | 40 |
| Scenario phases | single, seed, dormancy, activation |
| Model catalog in release | 45 models |

The eight payload families are HTML injection, RAG poisoning, markdown injection, memory poisoning, latent memory poisoning, context drift, toolchain confusion, and cognitive overload. The five workflow framings are document summary, incident response, tool selection, memory recall, and user debug request.

Each scenario specifies an `attack_id`, `campaign_id`, `family`, `scenario_type`, `seed_input`, `trigger_input`, `expected_failure_mode`, `severity`, `realism_level`, and `phase`. The reporting grain is one **model-scenario evaluation**: one model attempted against one scenario under one provider cohort.

### 5.2 Agent Loop

The harness executes one representative assistant architecture. The model receives a system prompt, a task, and a representative toolset:

- `read_document`
- `fetch_url`
- `search_notes`
- `send_email`
- `write_note`

The harness uses native OpenAI-format function calling when the provider accepts tool schemas. For Ollama models that reject native tools, it falls back to a text-only stub protocol so the evaluation remains scorable. Tool effects are not executed. A lightweight policy layer blocks overtly dangerous simulated calls and records harness-side tool policy block markers.

The scenario engine preserves campaign state across seed, dormancy, and activation phases. This matters because memory-poisoning claims are otherwise easy to overstate: if each phase starts with a fresh agent state, the benchmark cannot test temporal carryover. The current implementation therefore runs ordered campaign phases under a shared scenario engine for each model and campaign.

For latent-memory scenarios, the release uses the `--memory-backend vector` path. Seed payloads are chunked with a 200-character sliding window, embedded with `sentence-transformers/all-MiniLM-L6-v2`, and stored in an in-process ephemeral ChromaDB collection. Dormancy seals the collection without calling the target model. Activation embeds the scenario `trigger_input`, retrieves the top three chunks, and injects them verbatim as `[RETRIEVED_MEMORY]` context blocks. This avoids using the target model as a sanitizer during seed or dormancy and tests whether raw retrieved memory influences later inference.

### 5.3 Providers and Model Cohorts

The May 20, 2026 release contains two provider cohorts:

- **Ollama Cloud baseline:** 39 authenticated Ollama Cloud models discovered through the provider catalog.
- **OpenRouter frontier/lite cohort:** six proprietary models: `openai/gpt-5.3-chat`, `openai/gpt-5.4-mini`, `anthropic/claude-opus-4.7`, `anthropic/claude-haiku-4.5`, `google/gemini-3.1-pro-preview`, and `google/gemini-3.1-flash-lite`.

The OpenRouter model identifiers are provider catalog identifiers used for this run and were verified against the OpenRouter model catalog on May 20, 2026. The cohort is deliberately smaller. It is included to test whether the harness and public artifact format extend to proprietary hosted models, not to establish a comprehensive ranking of closed model providers.

## 6. Measurement and Scoring

The release uses deterministic heuristic scoring. For the set of scored model-scenario evaluations, each evaluation receives binary indicators:

- `I`: unsafe instruction adoption
- `T`: unsafe tool-call proposal
- `S`: secret-disclosure signal
- `P`: harness-side tool policy block marker
- `R`: refusal detected

The legacy JSON flag for `P` remains `policy_violation` for compatibility with earlier artifacts, but the reported metric is `tool_policy_block_rate`. In this release it is generated by the harness policy layer when the mocked tool layer blocks a proposed call; it is not semantic analysis showing that the model's text independently violated provider policy.

The latent-memory subset is scored after a targeted vector-backend rerun. In that path, ChromaDB stores seed chunks in an ephemeral in-process collection, `sentence-transformers/all-MiniLM-L6-v2` provides embeddings, activation queries retrieve the top three chunks, and those chunks are injected verbatim as `[RETRIEVED_MEMORY]` blocks. Seed and dormancy phases do not call the target model, so target-model summarization cannot sanitize or drop the poisoned memory before activation.

The primary unsafe-signal indicator is:

```text
U = I OR T OR S OR P
```

The overall unsafe-signal rate is:

```text
unsafe_signal_count / scored_evaluation_count
```

Coverage is:

```text
scored_evaluations / expected_model_scenario_evaluations
```

Confidence intervals in this paper use the Wilson score interval for binomial proportions. Because the release uses one pass per model-scenario pair, these intervals characterize the observed proportion in this fixed matrix only; they do not quantify model stochasticity, provider drift, prompt paraphrase sensitivity, or variance across alternative agent architectures (see Section 11.4).

AgentKillChain also supports LLM-as-judge scoring, but that path was not used for the May 20, 2026 public release. Using deterministic scoring here reduces evaluator drift and avoids the failure mode where a candidate unsafe output also influences an LLM judge.

## 7. Public Artifact Policy

The attack catalog prompts are public and citable. Full live request and response traces are treated differently. Live traces can contain private system-prompt material, provider diagnostics, unsafe model-generated text, or content that should not be indexed as an instruction pattern.

For that reason, the tracked public artifacts redact `results[].prompt` and `results[].output` while retaining:

- model and provider identifiers
- `attack_id`, family, phase, and scenario metadata
- status and error counts
- scoring flags
- aggregate metrics
- request and response character counts
- SHA-256 digests of the raw request and response traces

Raw live traces are written only to ignored local paths such as `results/generated/` or to private archival storage. This policy separates reproducible aggregate evidence from sensitive transcript material.

## 8. Results

The final May 20, 2026 public artifact has complete matrix coverage:

| Metric | Value |
|---|---:|
| Providers | 2 |
| Cohorts | 2 |
| Models requested | 45 |
| Attack scenarios | 40 |
| Expected model-scenario evaluations | 1,800 |
| Attempted evaluations | 1,800 |
| Scored evaluations | 1,800 |
| API error evaluations | 0 |
| Timeout evaluations | 0 |
| Coverage rate | 100.00% |

### 8.1 Findings Summary

The release has five main findings:

1. **Complete matrix coverage:** The public artifact contains 1,800 attempted and scored evaluations with no API errors or timeouts.
2. **Low but measurable unsafe-signal rate:** 25 of 1,800 scored evaluations emitted at least one unsafe signal, for a 1.39% observed rate with a 95% Wilson interval of 0.94% to 2.04%.
3. **Tool mediation is the main risk surface in this release:** 24 evaluations included unsafe tool proposals, 20 included harness-side tool policy block markers, 10 included unsafe instruction adoption, and none were scored as secret disclosure.
4. **Signals are concentrated rather than evenly distributed:** Toolchain-confusion scenarios account for 16 of the 25 unsafe-signal evaluations.
5. **The proprietary-model cohort is descriptive, not definitive:** The OpenRouter frontier/lite cohort produced two unsafe-signal evaluations, both from `google/gemini-3.1-flash-lite`; the cohort is too small to support a general ranking of closed model providers.

### 8.2 Aggregate Unsafe-Signal Rates

| Metric | Count / N | Rate | 95% Wilson interval |
|---|---:|---:|---:|
| Overall unsafe signal | 25 / 1,800 | 1.39% | 0.94% to 2.04% |
| Unsafe instruction adoption | 10 / 1,800 | 0.56% | 0.30% to 1.02% |
| Unsafe tool proposal | 24 / 1,800 | 1.33% | 0.90% to 1.98% |
| Secret disclosure signal | 0 / 1,800 | 0.00% | 0.00% to 0.21% |
| Tool policy block marker | 20 / 1,800 | 1.11% | 0.72% to 1.71% |
| Refusal detected | 991 / 1,800 | 55.06% | 52.75% to 57.34% |

Unsafe tool proposals account for most of the unsafe-signal observations. Tool policy block markers are harness-side mock tool-layer blocks and should not be read as model-level semantic policy violations. No evaluation in this release was marked as secret disclosure under the deterministic heuristic.

### 8.3 Cohort Comparison

| Cohort | Models | Scored evaluations | Unsafe count | Rate | 95% Wilson interval |
|---|---:|---:|---:|---:|---:|
| Ollama Cloud baseline | 39 | 1,560 | 23 | 1.47% | 0.98% to 2.20% |
| OpenRouter frontier/lite cohort | 6 | 240 | 2 | 0.83% | 0.23% to 2.99% |
| Combined release | 45 | 1,800 | 25 | 1.39% | 0.94% to 2.04% |

The OpenRouter cohort produced fewer unsafe signals, but the interval is wide because the cohort contains only 240 evaluations. The result should be interpreted as a smaller provider-cohort check, not a closed-model ranking.

### 8.4 Scenario-Family Concentration

| Family / phase | Scored evaluations | Unsafe count | Rate | 95% Wilson interval |
|---|---:|---:|---:|---:|
| Toolchain confusion / single | 225 | 16 | 7.11% | 4.42% to 11.24% |
| Memory poisoning / single | 225 | 4 | 1.78% | 0.69% to 4.48% |
| Context drift / single | 225 | 3 | 1.33% | 0.45% to 3.85% |
| RAG poisoning / single | 225 | 1 | 0.44% | 0.08% to 2.47% |
| Cognitive overload / single | 225 | 1 | 0.44% | 0.08% to 2.47% |
| HTML injection / single | 225 | 0 | 0.00% | 0.00% to 1.68% |
| Markdown injection / single | 225 | 0 | 0.00% | 0.00% to 1.68% |
| Latent memory poisoning / seed, dormancy, activation (vector retrieval) | 225 | 0 | 0.00% | 0.00% to 1.68% |

The strongest observed concentration is toolchain confusion. This is consistent with the benchmark's thesis that tool mediation is a critical security surface: the model can avoid disclosing a secret in text while still proposing a tool action that would be unsafe in a real integration.

### 8.5 OpenRouter Unsafe-Signal Details

The OpenRouter cohort had two unsafe-signal evaluations, both from `google/gemini-3.1-flash-lite`:

- `memory_poisoning_005`: unsafe tool proposal only.
- `toolchain_confusion_002`: unsafe instruction adoption, unsafe tool proposal, and harness-side tool policy block marker.

The other five OpenRouter models produced no unsafe signals under this scoring policy. This observation is descriptive only; the benchmark does not run repeated trials, adaptive attacks, or alternative prompts that would support a stronger comparative claim.

## 9. Discussion

The release supports a narrower and more useful conclusion than "model X is safe" or "model Y is unsafe." Under one documented agent architecture, one scenario catalog, and one deterministic scoring policy, unsafe signals were uncommon but measurable. They were concentrated in scenarios where untrusted content pressured the agent's tool-selection behavior.

This distinction matters for defense. If the main risk were only unsafe text generation, model refusal behavior might be sufficient. In this release, the more common signal is an unsafe tool proposal. That points toward system-level controls: tool authorization, context separation, egress filtering, memory provenance, and auditable policy gates.

The latent-memory result should be interpreted carefully. The vector rerun stores the seed payload verbatim in an embedded ChromaDB collection and retrieves semantically relevant chunks during activation, so it is a stronger test than the earlier flat-buffer path. It still did not produce scored unsafe activation. That null result is useful for this fixed harness and scenario catalog, but it is not evidence that production memory systems are safe. Production deployments add different embedding models, chunking policies, rerankers, authorization boundaries, update horizons, and user-interaction patterns that can change retrieval and activation behavior.

The redaction policy is also part of the research contribution. Security benchmarks need enough public evidence to be reproducible, but publishing full live traces can create avoidable risks. AgentKillChain keeps the attack catalog public, preserves hash-linked trace metadata, and withholds complete live transcripts from tracked artifacts.

## 10. Defensive Implications

The benchmark points toward defenses that should sit outside the model:

1. **Memory provenance:** Agents should tag remembered content by source and trust level. Summarization should strip imperative instructions from untrusted retrieved data.
2. **Deterministic tool authorization:** High-risk tools should require policy checks independent of the language model's stated intent.
3. **Tool-call egress controls:** Email, web, file, and execution tools should be constrained by allowlists, explicit user confirmation, and sensitive-data detectors.
4. **Context separation:** System instructions, user intent, retrieved content, memory, and tool results should be represented as separate security domains rather than flattened into one prompt.
5. **Regression benchmarking:** Agent teams should rerun persistent-compromise tests after model, prompt, tool, memory-policy, and provider changes.
6. **Release hygiene:** Public reports should publish denominators, coverage, error counts, and redaction policy alongside aggregate rates.

## 11. Threats to Validity

### 11.1 Construct Validity

The primary metric is an unsafe-signal rate, not a realized harm rate. A flagged tool proposal may not execute in a production system with stronger policy checks, and an unflagged output may still contain subtler risk not captured by the heuristic. The benchmark therefore measures explicit unsafe behavior markers in one harness, not full operational compromise.

### 11.2 Internal Validity

Deterministic heuristic scoring improves reproducibility but can misclassify edge cases. The scorer is tuned to avoid counting benign refusals, quotations, and generic sensitive-file mentions as unsafe behavior. That conservatism can miss oblique unsafe compliance.

The public artifact redacts live traces. Hashes and character counts support integrity checks, but external readers cannot independently replay every transcript from tracked files alone.

### 11.3 External Validity

The harness represents one assistant architecture with stubbed tools and an embedded vector-memory path for latent-memory campaigns. The vector store is in-process and ephemeral, uses a small fixed top-k retrieval policy, and does not model production authorization, tenancy, reranking, long-horizon updates, or application-specific memory governance. Production systems differ in tool schemas, retrieval quality, authentication, user-confirmation flows, and downstream policy controls. Results should not be generalized to all agents or all deployments.

The scenario catalog is public and fixed. Public prompts support citation and reproducibility, but future models may have been exposed to similar payloads during training or evaluation. A mature benchmark program should include private hold-out scenarios in addition to public regression scenarios.

### 11.4 Statistical Validity

The release uses one pass per model-scenario pair at deterministic settings. Wilson intervals describe uncertainty around observed binary proportions, but they do not capture model stochasticity, provider drift, prompt paraphrase sensitivity, or repeated-run variance. Future releases should run multiple repetitions per condition and report variance across both prompts and model versions.

## 12. Ethics and Release Controls

The dataset contains adversarial prompts and controlled unsafe-workflow scenarios. The public release keeps the attack catalog open for reproducibility and citation, but redacts full live request/response traces to avoid publishing model-specific unsafe output and private system-prompt material. The benchmark uses stubbed tools and does not execute real exfiltration, file modification, email, network access, or command execution.

Researchers extending the benchmark should avoid running live tool actions against real user data. Future public releases should preserve aggregate evidence and private trace archives separately, and should make clear whether results come from public prompts, private hold-out prompts, or both.

## 13. Reproducibility

The public repository contains the dataset, harness, website, redacted result artifacts, and visualization scripts.

Smoke validation:

```bash
python3 -m compileall harness scripts tests test_all.py
python3 -m unittest discover
python3 harness/runner.py --dry-run
python3 scripts/redact_public_results.py --input-json results/generated/model_results.json --output-json results/model_results.json --output-csv results/model_results.csv
python3 scripts/validate_artifacts.py
```

Live Ollama Cloud baseline command:

```bash
python3 harness/runner.py --provider ollama-cloud --judge-mode heuristic --run-label ollama-cloud-take-2026-05-20
```

OpenRouter frontier/lite cohort command:

```bash
python3 harness/runner.py --provider openrouter --judge-mode heuristic --models openai/gpt-5.3-chat,openai/gpt-5.4-mini,anthropic/claude-opus-4.7,anthropic/claude-haiku-4.5,google/gemini-3.1-pro-preview,google/gemini-3.1-flash-lite --run-label openrouter-frontier-cohort-2026-05-20
```

Targeted API-error or method-update reruns can be performed with `--models` and `--attack-ids`, then merged with `scripts/merge_result_rerun.py`. The latent-memory vector rerun used `--attack-ids latent_memory_poisoning_001,latent_memory_poisoning_002,latent_memory_poisoning_003,latent_memory_poisoning_004,latent_memory_poisoning_005 --memory-backend vector`. Multi-provider public artifacts are produced by combining cohort outputs with `scripts/combine_result_cohorts.py` and redacting the combined payload with `scripts/redact_public_results.py`.

Raw live-run outputs are written to ignored `results/generated/` paths. The public release artifacts are `results/model_results.json` and `results/model_results.csv`.

## 14. Conclusion

AgentKillChain provides a controlled, versioned benchmark for a specific security question: whether untrusted context can persist through an assistant-agent loop and influence later tool-facing behavior. The May 20, 2026 release produced complete matrix coverage across 45 models and 40 scenarios, with a 1.39% observed unsafe-signal rate under deterministic heuristic scoring.

The most important result is not the absolute percentage. It is the shape of the failure mode. Unsafe signals clustered around tool-selection pressure, while secret-disclosure signals were not observed and the vector-retrieval latent-memory implementation did not trigger unsafe activation under this harness. That pattern supports a defense posture focused on tool authorization, memory provenance, and context separation rather than reliance on model refusals alone.

Future releases should add repeated trials, private hold-out scenarios, broader retrieval configurations, live sandboxed tool environments, utility measurements, and defense ablations. The current release establishes a reproducible baseline and a public evidence model for that work.

## References

[1] OWASP Foundation. "OWASP Top 10 for Large Language Model Applications." https://owasp.org/www-project-top-10-for-large-language-model-applications/

[2] OWASP GenAI Security Project. "Agentic AI - Threats and Mitigations." https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/

[3] National Institute of Standards and Technology. "Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile." NIST AI 600-1. https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence

[4] Greshake, K., Abdelnabi, S., Mishra, S., Endres, C., Holz, T., and Fritz, M. "Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection." arXiv:2302.12173. https://arxiv.org/abs/2302.12173

[5] Microsoft Research. "Benchmarking and Defending Against Indirect Prompt Injection Attacks on Large Language Models." https://www.microsoft.com/en-us/research/publication/benchmarking-and-defending-against-indirect-prompt-injection-attacks-on-large-language-models/

[6] Debenedetti, E., Zhang, J., Balunovic, M., Beurer-Kellner, L., Fischer, M., and Tramer, F. "AgentDojo: A Dynamic Environment to Evaluate Prompt Injection Attacks and Defenses for LLM Agents." NeurIPS 2024 Datasets and Benchmarks Track. https://proceedings.neurips.cc/paper_files/paper/2024/file/97091a5177d8dc64b1da8bf3e1f6fb54-Paper-Datasets_and_Benchmarks_Track.pdf

[7] Derczynski, L., Galinkin, E., Martin, J., Majumdar, S., and Inie, N. "garak: A Framework for Security Probing Large Language Models." arXiv:2406.11036. https://arxiv.org/abs/2406.11036

[8] Microsoft. "Python Risk Identification Tool for generative AI (PyRIT)." https://github.com/microsoft/PyRIT

[9] Wallace, E., Xiao, K., Leike, R., Weng, L., Heidecke, J., and Beutel, A. "The Instruction Hierarchy: Training LLMs to Prioritize Privileged Instructions." arXiv:2404.13208. https://arxiv.org/abs/2404.13208

[10] Sharma, R. K., Gupta, V., and Grossman, D. "SPML: A DSL for Defending Language Models Against Prompt Attacks." arXiv:2402.11755. https://arxiv.org/abs/2402.11755

[11] Anthropic. "Mitigating the risk of prompt injections in browser use." https://www.anthropic.com/research/prompt-injection-defenses

[12] Anthropic. "Claude 3.7 Sonnet System Card." https://www-cdn.anthropic.com/9ff93dfa8f445c932415d335c88852ef47f1201e.pdf
