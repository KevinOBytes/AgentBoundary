# Attack Taxonomy

## Core categories
- html_injection
- rag_poisoning
- markdown_injection
- memory_poisoning
- latent_memory_poisoning
- context_drift
- toolchain_confusion
- cognitive_overload

## Diagram: lifecycle
```mermaid
flowchart LR
  A[Initial Access] --> B[Execution]
  B --> C[Persistence]
  C --> D[Latent Activation]
  D --> E[Escalation]
  E --> F[Exfiltration]
```

## Diagram: latent timeline
```mermaid
sequenceDiagram
  participant S1 as Session 1
  participant M as Memory Store
  participant S2 as Session N
  S1->>M: seed malicious memory
  S2->>M: summarize context
  M-->>S2: mutated instruction
  S2->>S2: activation trigger fires
```
