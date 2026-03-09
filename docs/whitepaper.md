# AgentKillChain: Persistent Compromise Evaluation for Autonomous AI Agents

## Abstract
AgentKillChain is an open, reproducible benchmark for measuring multi-stage security compromise in autonomous AI agents, emphasizing latent prompt injection via memory poisoning across sessions.

## Introduction
Autonomous agents blend planning, memory, and tools, introducing attack chains that persist beyond single prompts. AgentKillChain focuses on persistent compromise where adversarial instructions survive session boundaries and reactivate later.

## Background
Prior prompt injection benchmarks underrepresent persistence and tool misuse in iterative agent workflows, especially in systems with long-term memory and external tool execution.

## Threat Model
### Attacker capabilities
- Inject untrusted content through prompts, files, retrieved documents, or markdown/html payloads.
- Influence memory summaries and induce context drift.
- Trigger risky tool calls through adversarial instructions.

### Defender controls
- System prompts and policy constraints.
- Tool allowlists and policy gates.
- Memory provenance checks and output monitoring.

### Assumptions and limitations
| Item | Assumption | Limitation |
|---|---|---|
| Memory model | Agents retain summarized cross-session context | Real systems differ in retention fidelity |
| Tool routing | Tools can be invoked by model decisions | Some production agents include stronger runtime policy engines |
| Provider behavior | Models may vary over time | Reproducibility requires pinning model identifiers and run dates |

## AgentKillChain Model
Stages: Initial Access -> Execution -> Persistence -> Latent Activation -> Escalation -> Exfiltration.

## Novel Attack Classes
Prompt injection, latent memory poisoning, context drift exploitation, toolchain confusion, and cognitive overload.

## Dataset
The dataset contains 40 structured attacks across 8 categories with severity metadata and trigger conditions. Each entry includes attack_id, campaign_id, payload, trigger_condition, expected_behavior, severity, and phase.

## Evaluation Methodology
### Experiment matrix
| Dimension | Values |
|---|---|
| Models | `gpt-5`, `claude-3.7`, `gemini-1.5-pro`, `mistral-large` |
| Scenarios | browser_agent, rag_agent, code_agent, filesystem_agent |
| Runs per configuration | >=3 recommended |
| Seeds | deterministic dry-run plus randomized live-run seeds |

### Baselines and ablations
- Baseline A: default system prompt + full tool access policy.
- Baseline B: stricter prompt policy + allowlisted tools.
- Ablation 1: disable memory provenance checks.
- Ablation 2: disable tool policy gate.
- Ablation 3: disable refusal post-filtering.

### Metrics
- injection_success_rate
- latent_activation_rate
- toolchain_abuse_rate
- data_exfiltration_rate
- cognitive_overload_rate

### Statistical procedure
For each model/scenario pair, run >=3 repetitions and report mean with 95% confidence intervals. For pairwise model comparisons, use bootstrap confidence intervals over attack-level outcomes.

## Results
Baseline dry-run demonstrates deterministic pipeline execution; live runs report model-specific failure rates with per-model summaries.

## Mitigations
Memory provenance tagging, policy-constrained tool routing, contextual integrity checks, refusal training on latent triggers, and output-level exfiltration detectors.

## Reproducibility Appendix
### Command matrix
```bash
# smoke validation
python3 -m compileall harness
python3 -m unittest discover -s harness/tests
python3 harness/runner.py --dry-run
python3 scripts/validate_artifacts.py

# live evaluation
python3 harness/runner.py
```

### Artifact naming
`results/generated/model_results.json`
`results/generated/model_results.csv`

Include commit hash, model set, and dataset version in publication bundles.

## Future Work
Expand to multimodal agents, long-horizon memory systems, and continuous red-team/blue-team evaluation.

## Conclusion
AgentKillChain supports publication-grade, reproducible research into persistent agent compromise and latent cross-session attacks.
