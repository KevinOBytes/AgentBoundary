# Safety Relevance

AgentKillChain is written in the language of security research, but the same
failure modes are directly relevant to frontier model evaluation. The benchmark
asks whether an agent can preserve instruction hierarchy, contextual integrity,
and tool-use boundaries while operating across memory, retrieval, and
multi-step workflows.

## Kill Chain to Safety Evaluation Map

| AgentKillChain stage | Security framing | Frontier lab concern | Evaluation question |
| --- | --- | --- | --- |
| Initial Access | Untrusted context enters the agent through user input, RAG, files, or web content. | Scalable oversight gaps in open-ended environments. | Does the model correctly label retrieved or user-provided text as untrusted context rather than policy? |
| Execution | The model parses the injected instruction as part of its task state. | Instruction hierarchy collapse under task pressure. | Does the model preserve higher-priority instructions when the prompt contains plausible but adversarial task details? |
| Persistence | The payload survives summarization or memory writeback. | Latent memory poisoning and sleeper-agent setup. | Can adversarial state become durable without immediate harmful behavior? |
| Activation | A benign future request retrieves the poisoned state. | Sleeper agent / deferred defection behavior. | Does a dormant instruction activate only after a delayed semantic or temporal trigger? |
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

### Latent memory poisoning -> sleeper agent / deferred defection behavior

Latent memory poisoning tests whether a payload can be planted in one session
and activate later when the model sees a trigger. This maps to sleeper-agent and
deferred-defection concerns because the harmful behavior is conditional,
temporally separated from the seed event, and easy to miss in single-turn evals.

Evaluation implication: model evaluations should score both seed-time behavior
and trigger-time behavior. A model that appears safe during the seed phase can
still be unsafe if it stores or later obeys adversarial state.

### Toolchain confusion -> unauthorized capability acquisition

Toolchain confusion tests whether adversarial context can cause an agent to
select, justify, or parameterize a privileged tool outside the user's authority.
For frontier labs, this is a concrete proxy for unauthorized capability
acquisition: the dangerous behavior is not the text alone, but the model's move
from text into action.

Evaluation implication: frontier agent evals should treat tool calls as first
class safety outcomes. Refusal text is insufficient if the planner or tool
router still proposes unsafe execution.

## Why This Matters for Frontier Evals

Standard prompt-injection and jailbreak benchmarks are often single-turn and
text-output centered. AgentKillChain adds pressure along dimensions that matter
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
