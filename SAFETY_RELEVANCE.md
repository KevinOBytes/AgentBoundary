# Safety Relevance

AgentBoundary examines how adversarial text can cross instruction and context boundaries. The current study supplies output-level evidence for fixed prompts and model endpoints. The security questions are relevant to agents, while many downstream agent behaviors require separate tests.

## Questions and Evidence Boundaries

| Security question | Current later study | Additional evidence needed |
|---|---|---|
| Does untrusted document text influence the response? | Model outputs under HTML, Markdown, and retrieved-document framing | Task-specific human adjudication and comparison with benign controls |
| Does stored text influence a later decision? | Seed/trigger text with synthetic conversation history | Actual memory writes, retrieval traces, and later-session execution |
| Does a model propose an unauthorized tool action? | Text that the judge may classify as compliance | Structured tool calls, authorization decisions, and destination effects |
| Are system instructions or secrets disclosed? | Stored response text and automated labels | Comparison with the exact protected material and legitimate task context |
| Does a defense preserve useful task completion? | Not established by the reported compliance counts | Benign-task outcomes, false-positive costs, and controlled defense comparisons |
| Does a deployed agent remain contained? | Not established by chat-completion outputs | Live tool bindings, credentials, network boundaries, failure handling, and adversarial system tests |

## Retrieved Context and Instruction Boundaries

The catalog includes document fragments, tool catalogs, notes, and formatting conventions that ask for behavior inconsistent with the supplied system instruction. These scenarios can help formulate hypotheses about how models interpret trusted instructions versus untrusted task data.

The current automated labels contain positives in five of eight families. The observed rates do not establish that those families dominate production risk, that the other families are safe, or that any proposed defense is effective. They identify examples for inspection and follow-up experiments.

## Memory Poisoning and Delayed Activation

The initial 45-endpoint study included a controlled ChromaDB-backed memory path with embedded retrieval. The later 11-endpoint study uses chat-completion messages and a synthetic `Stored.` reply when a seed is supplied. Its seed/activation fields do not demonstrate that a real agent stored, retained, or later retrieved poisoned state.

A persistence evaluation should separately observe the write, retention policy, retrieval selection, authorization context, and eventual action. A payload that is harmless at ingestion may become consequential later, but this later study does not quantify that causal chain.

## Tool Selection and Execution

Tool-selection prompts can expose unsafe proposals. A proposal is distinct from an authorized call, successful execution, and a harmful destination effect. The later study has no live tools; the earlier harness uses simulated tool behavior. Neither supports a claim that real tool misuse is contained at scale.

For a deployment evaluation, outcomes should include requested capability, enforced authority, actual effect, and whether attempted misuse was rejected at the relevant boundary. These are research directions, not capabilities validated by the current report.

## Interpretation of the Current Result

The current report records 11 positive compliance labels among 551 scorable responses. It also discloses a disputed negative: a DeepSeek V4 Flash response to `cognitive_overload_001` reproduces the supplied system message despite being relabeled noncompliant. This illustrates why a low aggregate rate and zero-positive endpoints require scrutiny of the actual output and rubric.

The highest-value use of the artifact is to support reproducible inspection of specific cases, comparison of scoring definitions, and design of stronger experiments. It does not establish general alignment, deployment readiness, or a safety ranking of model vendors.
