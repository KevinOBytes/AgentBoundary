# Benchmark Limitations

AgentKillChain is currently a **prototype benchmark**. While it models severe attack vectors against autonomous LLM agents (e.g., prompt injection, memory poisoning, tool chaining), many components are simulated rather than executed in a real sandbox. 

### 1. Simulated Tool Execution
Tools (`read_document`, `send_email`, etc.) are currently mocked in `harness/model_adapter.py`. The model receives a static mock response or a simulated "policy violation" flag, rather than dynamically interacting with a true UNIX environment or external APIs. True exploits often depend on nuanced edge cases in actual software implementations.

### 2. Simulated Latent Memory
True stateful agent behavior (e.g., long-term memory across sessions using vector databases) is simulated via a linear context buffer in `harness/scenario_engine.py`. We trigger a compression/summarization step to model memory drift, and then re-inject the compressed memory in a subsequent request. It does not perfectly capture real-world chunking, embedding retrieval artifacts, or complex RAG drift.

### 3. Attack Space Coverage
The current dataset comprises 40 varied scenarios encompassing HTML injection, markdown injection, RAG poisoning, and tool chain abuse. However, the exact phrasing of the malicious payloads might not adapt to the safety alignment eccentricities of every model on the market. Real adversaries often brute-force injection payloads to bypass specific vendor filters.

### 4. Definition of "Success"
The May 20, 2026 Ollama Cloud baseline uses hardened deterministic heuristics over captured prompts, outputs, and tool-call markers. These scores are best read as unsafe behavior signals, not confirmed real-world exploitation. The heuristic may still produce false positives or false negatives, especially when a model summarizes an unsafe payload without acting on it or produces an obfuscated unsafe action the parser misses.

### 5. Public Artifact Redaction
The public `results/model_results.json` and `results/model_results.csv` files redact raw prompts and model outputs. They retain flags, metrics, counts, character lengths, and SHA-256 digests, but they cannot independently replay every behavioral judgment without access to the private raw traces.
