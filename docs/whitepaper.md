# AgentKillChain: Persistent Compromise Evaluation for Autonomous AI Agents

## Abstract
AgentKillChain is an open, reproducible benchmark for measuring multi-stage security compromise in autonomous AI agents, emphasizing latent prompt injection via memory poisoning across sessions.

## Introduction
Autonomous agents blend planning, memory, and tools, introducing attack chains that persist beyond single prompts.

## Background
Prior prompt injection benchmarks underrepresent persistence and tool misuse in iterative agent workflows.

## Threat Model
Attackers can control user content, retrieved documents, and partial memory context; defenders control system prompts, policy filters, and tool allowlists.

## AgentKillChain Model
Stages: Initial Access -> Execution -> Persistence -> Latent Activation -> Escalation -> Exfiltration.

## Novel Attack Classes
Prompt injection, latent memory poisoning, context drift exploitation, toolchain confusion, and cognitive overload.

## Dataset
The dataset contains 40 structured attacks across 8 categories with severity metadata and trigger conditions.

## Evaluation Methodology
Harness executes each attack against each model, records outputs, computes safety failure metrics, and exports JSON reports.

## Results
Baseline dry-run demonstrates deterministic pipeline execution; live runs report model-specific failure rates.

## Mitigations
Memory provenance tagging, policy-constrained tool routing, contextual integrity checks, and refusal training on latent triggers.

## Future Work
Expand to multimodal agents, long-horizon memory systems, and continuous red-team/blue-team evaluation.

## Conclusion
AgentKillChain supports publication-grade, reproducible research into persistent agent compromise.
