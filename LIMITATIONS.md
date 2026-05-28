# Benchmark Limitations

AgentKillChain is a controlled benchmark. I built it to find real attack surfaces, not to simulate every possible failure mode in every possible deployment.

### 1. Simulated Tool Execution
Tools (`read_document`, `send_email`, etc.) are stubbed in `harness/model_adapter.py`. The model receives a static response or a harness-side tool policy block marker rather than executing real commands on a UNIX host. That means real incidents — which often depend on parser edge cases, shell-escape bugs, or API-specific behavior — are outside scope. I can model the intent, not the exploitation chain.

### 2. Simulated Persistent Memory
Latent-memory campaigns use an in-process ChromaDB collection with sentence-transformer embeddings. The seed phase embeds payload text; activation retrieves it and injects it into the prompt. This is closer to a production RAG threat model than flat memory, but it is still a controlled environment. It does not model multi-tenant vector stores, ACL failures, rerankers, metadata filters, or long-horizon accumulation. If your agent runs on a platform with user feedback loops or cross-tenant memory, the actual risk surface is wider.

### 3. Static Prompts
The v2.1 dataset uses one prompt variant per entry. I lock them for reproducibility — a reviewer must get the same number I get. Adaptive adversaries with white-box access to the harness, or attackers who can paraphrase and encode payloads, are not modeled. The 37.3% stealth rate against keyword filters gives a baseline, but it is not an upper bound.

### 4. Temperature Zero
All v2.2 evaluations run at `temperature=0.0`. This removes sampling noise and makes the judge's flags reproducible, but it also means I am not measuring compliance variance. A production attacker does not run at temp=0. Future work should report both: a deterministic baseline and a variance sweep.

### 5. Single-Judge Scoring
Every evaluation uses `gpt-4o-mini` as the LLM-as-judge. I chose it because it is cheap, fast, and empirically aligned with human labels on refusal detection pilot data. But it is still one model's interpretation of compliance. Cross-judge validation with Claude Opus and human annotation is on the roadmap. The heuristic fallback in `harness/evaluation.py` is there for environments where LLM judge access is restricted.

### 6. OpenRouter Routing
Results characterize the specific endpoint reachable through OpenRouter on the evaluation date. The same model ID may route to different upstream weights, quantization parameters, or infrastructure patches on different days. This is a known and unavoidable limitation of API-based evaluation. I flag the exact run timestamp and model identifiers so reviewers can see if drift has occurred.

### 7. No Persistent Cross-Session Memory for Chat APIs
Standard chat-completion APIs (OpenAI, Anthropic, Gemini) do not implement persistent memory across turns. True multi-phase latent memory poisoning requires a framework with session persistence (e.g., LangChain's `ChatMessageHistory`, ChromaDB, or a custom vector store). In v2.1, I converted all multi-phase entries to single-phase attacks to keep the catalog runnable against standard APIs. The temporal-separation threat model remains valid for stateful agent frameworks.

### 8. What I Am Not Claiming
This benchmark does not claim a generalizable safety ranking of foundation models, vendors, or products. It evaluates specific endpoints at a specific date under specific conditions. The numbers are real; the scope is bounded.
