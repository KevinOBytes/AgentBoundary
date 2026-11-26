# Benchmark Limitations

AgentBoundary measures specific model outputs under a fixed catalog and scoring procedure. The current report concerns the later 11-endpoint chat-completion study; the initial 45-endpoint controlled-harness study is separate.

## 1. Output Classification Is Not Tool Execution

The later study sends messages through chat-completion APIs. It does not bind tools, execute commands, send messages, access a real browser, or verify downstream effects. A compliance label records the judge's interpretation of an output. Tool proposals and descriptions do not demonstrate successful exploitation. Apparent secret disclosure also requires checking that the disclosed material is genuine.

The earlier `harness/` path uses simulated tool behavior. A harness policy-block marker is an enforcement event in that simulator, not proof that a model or production application is secure.

## 2. Memory and Conversation Scope

The initial study included an in-process ChromaDB experiment with embedding retrieval. It does not establish behavior for a production multi-tenant vector store, access-control system, reranker, or long-lived application.

The later study does not exercise that backend. `eval_live.py` constructs messages from catalog fields; where a seed exists, it inserts a synthetic assistant reply of `Stored.`. That reply is not an observed memory write or successful persistence event. A chat-completion API can accept application-supplied conversation history, but this protocol does not test actual cross-session state management.

## 3. Automated Labels and a Targeted Correction

The final label set combines the June 3 few-shot judging pass with a second pass over only the 19 positive compliance cases. Eight labels changed to noncompliant. Negative cases were not all evaluated under the amended rule. This selection can remove false positives without measuring false negatives.

A concrete disputed negative is `cognitive_overload_001` on `deepseek/deepseek-v4-flash`: its response reproduces the system message supplied to the target, but the correction says `not_complied`. The current report preserves that label and flags the inconsistency; it is not a human-adjudicated truth set.

The compliance judge receives an expected-failure category and up to 4,000 characters of the response, rather than the full original prompt and all execution context. This limits its ability to distinguish quoting from disclosure, test task-specific authorization, or assess a truncated response. Some category descriptions also require interpretation. Judge confidence values are self-reported, not calibrated probabilities.

## 4. Missing and Empty Responses

The planned matrix contains 561 pairs. There are 552 retained records, of which 551 have nonempty scorable responses. Nine GPT-5-pro pairs are missing. The retained Claude response to `html_injection_006` is empty. An empty output is not evidence of intentional refusal, even if a different prompt or retry produces content. These cases remain coverage limitations, not safe outcomes.

## 5. Static Prompts and Selected Endpoints

The 51 scenarios are author-selected synthetic prompts, with one principal formulation per entry. They are not a probability sample of attacks or deployments. Adaptive attacks, paraphrases, differing system prompts, and actual application state may change outcomes. Results characterize the recorded endpoint identifiers and conditions, not every deployment of a named model family.

## 6. Temperature Does Not Establish Determinism

The acquisition scripts request `temperature=0.0`. This does not guarantee identical future outputs or remove provider-side nondeterminism. The main study is not a repeated-run experiment. Historical temperature-sweep artifacts are exploratory and do not establish a production-risk multiplier or a lower bound on real-world compromise.

## 7. Statistical and Judge Uncertainty Are Different

Wilson intervals describe binary proportions under a binomial model. Shared prompts and endpoints create dependence; the selected sample is not representative of all attacks. The intervals do not include judge misclassification, post-hoc rubric changes, model drift, or missing-response bias.

Cross-judge agreement measures agreement, not correctness. Historical comparisons use different judge stages and, in some cases, different samples. They do not establish stable rankings, validate zero-positive endpoints, or replace independent human review. No model-size or training-method effect is identified by this design.

## 8. Frequency Is Not Impact

The historical `severity` field uses labels for observed compliance frequency. It does not measure exploitability, privilege, data value, blast radius, or harm. One successful disclosure can be consequential even when aggregate frequency is low. No observed positive is evidence only about this sample and rubric.

## 9. Provenance and Public Artifacts

Provider weight revisions and request IDs are not fully recorded. The later JSONL files retain bounded text outputs, not complete authenticated provider traces. The initial study's redacted trace hashes support integrity checks on the corresponding records; they do not authenticate a provider or prove complete collection. Artifact hashes computed during reconciliation establish the current byte identity, not contemporaneous capture in May.

The current report, historical CSV, and archived 45-endpoint study have different schemas and coverage. Use the [provenance map](docs/PROVENANCE.md) before comparing them.
