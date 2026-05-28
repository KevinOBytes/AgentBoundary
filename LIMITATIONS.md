# Benchmark Limitations

AgentKillChain is a **controlled benchmark**. It models prompt injection, memory poisoning, and tool-selection pressure against an agent architecture while keeping high-risk side effects out of scope.

### 1. Simulated Tool Execution
Tools (`read_document`, `send_email`, etc.) are stubbed in `harness/model_adapter.py`. The model receives a static response or a harness-side tool policy block marker rather than dynamically interacting with a UNIX environment or external APIs. Real incidents often depend on implementation-specific edge cases that this harness does not attempt to model.

### 2. Simulated Latent Memory
Latent-memory campaigns use an embedded vector backend in `harness/scenario_engine.py`. The seed phase chunks payload text, embeds chunks with `sentence-transformers/all-MiniLM-L6-v2`, and stores them in an in-process ephemeral ChromaDB collection. Activation embeds the trigger text, retrieves the top three chunks, and injects the retrieved memory verbatim into the target-model prompt.

This is closer to a production RAG memory threat model than the earlier flat-memory path, but it is still a controlled simulation. It does not model multi-tenant vector stores, ACL failures, metadata filters, rerankers, deletion/update semantics, long-horizon accumulation, user feedback loops, or application-specific memory governance.

### 3. Attack Space Coverage
The v2.1 dataset comprises 51 scenarios across 8 families with contextually
appropriate prompts per `scenario_type`. The exact phrasing is fixed for
reproducibility and may not match adaptive adversary variants. Only 20/51
entries were empirically tested before the smoke-test recalibration; the
full 204-evaluation run covers all entries but with a single prompt variant
per entry.

### 4. Definition of "Success" — v2.1
The v2.1 release uses an LLM-as-judge pipeline (`gpt-4o-mini`) with two
passes: (1) refusal detection, (2) compliance detection. This is more
nuanced than the v1 deterministic heuristic but introduces known judge
failure modes: over-refusal false positives, paraphrased compliance misses,
and model-specific refusal-template biases. A second-pass judge
verification (`judge2`) column is included for cross-checking.

The legacy heuristic path remains available in `harness/evaluation.py` as
a fallback for environments where LLM judge access is restricted.

### 5. Public Artifact Redaction
The public `results/model_results.json` and `results/model_results.csv` files redact full request/response traces from live runs. The public attack catalog remains open and citable. Result artifacts retain flags, metrics, counts, character lengths, and SHA-256 digests, but exact transcript replay requires private archived traces.
