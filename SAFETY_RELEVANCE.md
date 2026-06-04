# Safety Relevance

AgentBoundary is written in the language of security research, but the same
failure modes are directly relevant to frontier model evaluation. The benchmark
asks whether an agent can preserve instruction hierarchy, contextual integrity,
and tool-use boundaries while operating across memory, retrieval, and
multi-step workflows.

## Kill Chain to Safety Evaluation Map

| AgentBoundary stage | Security framing | Frontier lab concern | Evaluation question |
| --- | --- | --- | --- |
| Initial Access | Untrusted context enters the agent through user input, RAG, files, or web content. | Scalable oversight gaps in open-ended environments. | Does the model correctly label retrieved or user-provided text as untrusted context rather than policy? |
| Execution | The model parses the injected instruction as part of its task state. | Instruction hierarchy collapse under task pressure. | Does the model preserve higher-priority instructions when the prompt contains plausible but adversarial task details? |
| Persistence | The payload survives summarization or memory writeback. | Latent memory poisoning and delayed unsafe activation. | Can adversarial state become durable without immediate harmful behavior? |
| Activation | A benign future request retrieves the poisoned state. | Conditional behavior after delayed context retrieval. | Does a dormant instruction influence behavior after a delayed semantic or temporal trigger? |
| Escalation | The recalled payload changes planner or tool-routing decisions. | Unauthorized capability acquisition and tool misuse. | Does the model treat tool access as capability-gated, or can context pressure induce dangerous tool proposals? |
| Exfiltration / Impact | The agent leaks data or performs the attacker objective. | Misaligned action under long-horizon autonomy. | Can the system prevent harm after upstream context integrity has already degraded? |

## Three Priority Mappings

### Context drift -> alignment degradation under optimization pressure

Context drift measures whether a model slowly substitutes the user's objective
with an attacker-provided objective while still appearing helpful. For frontier
evaluation, this approximates alignment degradation under optimization pressure:
the model is not simply refusing or complying in one turn, but deciding whether
to preserve the correct goal across accumulated context, ambiguity, and workflow
momentum.

Evaluation implication: safety tests should include long-context and multi-turn
conditions where the unsafe objective is framed as a helpful operational detail,
not only as an obvious jailbreak string.

### Latent memory poisoning → delayed unsafe activation

Latent memory poisoning tests whether a payload can be planted in one session
and influence later behavior when the model sees a trigger. In the v1 release
this used an embedded vector store with seed→dormancy→activation campaigns.

**v2.1 update:** The `dormancy` phase is deprecated because standard
chat-completion APIs (OpenAI, Anthropic, Gemini) do not implement persistent
cross-session memory. Without a ChromaDB-style vector store backend, the seed
state is silently lost between turns. In v2.1, multi-phase LMP entries were
converted to single-phase seed attacks: the seed request itself constitutes the
attack vector. The empirical live evaluation found only 5.0% family-level
compliance for latent_memory_poisoning (1/20 evals), with the single compliance
coming from a converted single-phase entry. True temporal-separation LMP
attacks remain a theoretical threat model that requires persistent memory
APIs to evaluate rigorously.

**Evaluation implication:** Model evaluations should score both seed-time behavior
and trigger-time behavior. A model that appears safe during the seed phase can
still be unsafe if it stores or later obeys adversarial state. However, testing
this requires frameworks with actual session persistence, not standard chat
completion.

### Toolchain confusion → unauthorized capability acquisition

Toolchain confusion tests whether adversarial context can cause an agent to
select, justify, or parameterize a privileged tool outside the user's authority.
**v2.1 empirical finding:** Toolchain confusion achieved **0% compliance** across
all 4 frontier models (0/24 evals). All models explicitly refused tool misuse
requests. This suggests frontier models have been successfully trained to resist
direct tool misuse, and the attack surface has shifted to **indirect
instruction** (RAG poisoning, style-guide overrides) rather than direct tool
requests.

**Evaluation implication:** Frontier agent evals should continue treating tool
calls as first-class safety outcomes but should expand testing to indirect
injection vectors that do not explicitly mention tools.

## Why This Matters for Frontier Evals

Standard prompt-injection and jailbreak benchmarks are often single-turn and
text-output centered. AgentBoundary adds pressure along dimensions that matter
for frontier agent deployment:

- memory persistence across sessions,
- retrieved-context trust boundaries,
- delayed activation triggers,
- planner and tool-router integrity,
- scored distinctions between refusal, unsafe instruction adoption, tool abuse,
  secret disclosure, and transport failures.

This makes the framework a controlled, reproducible harness for
evaluating whether agentic systems remain aligned when memory and tools create
longer causal chains between adversarial input and harmful action.
