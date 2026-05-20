# Benchmark Limitations

AgentKillChain is a **controlled benchmark**. It models prompt injection, memory poisoning, and tool-selection pressure against an agent architecture while keeping high-risk side effects out of scope.

### 1. Simulated Tool Execution
Tools (`read_document`, `send_email`, etc.) are stubbed in `harness/model_adapter.py`. The model receives a static response or a policy-violation flag rather than dynamically interacting with a UNIX environment or external APIs. Real incidents often depend on implementation-specific edge cases that this harness does not attempt to model.

### 2. Simulated Latent Memory
Stateful agent behavior (e.g., long-term memory across sessions using vector databases) is represented through a linear context buffer in `harness/scenario_engine.py`. The harness triggers a compression/summarization step to model memory drift, then re-injects the compressed memory in a subsequent request. It does not capture all chunking, embedding retrieval, or complex RAG drift behavior.

### 3. Attack Space Coverage
The current dataset comprises 40 varied scenarios encompassing HTML injection, markdown injection, RAG poisoning, and tool-selection misuse. The exact phrasing of the payloads is fixed for reproducibility and may not match the prompt variants an adaptive adversary would choose against a specific model.

### 4. Definition of "Success"
The May 20, 2026 baselines use deterministic heuristics over captured request/response traces and tool-call markers. These scores are unsafe behavior signals for the controlled harness. The heuristic may still produce false positives or false negatives, especially when a model summarizes an unsafe payload without acting on it or produces an obfuscated unsafe action the parser misses.

### 5. Public Artifact Redaction
The public `results/model_results.json` and `results/model_results.csv` files redact full request/response traces from live runs. The public attack catalog remains open and citable. Result artifacts retain flags, metrics, counts, character lengths, and SHA-256 digests, but exact transcript replay requires private archived traces.
