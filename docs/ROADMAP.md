# AgentBoundary Benchmark Roadmap

## v1.0 (Complete)
Open benchmark for prompt-injection robustness. 51 scenarios across 8 families, 552 live evaluations, LLM-as-judge with active-execution compliance standard.

## v1.1 — Sensitivity & Paraphrase (Planned)
- Generate 3-5 semantically equivalent prompt variants per attack entry using adversarial paraphrasing (e.g., GPT-4o, Claude, Qwen)
- Re-run evaluation on the empirically most vulnerable families (RAG poisoning, context drift)
- Measure compliance rate variance across prompt formulation
- Add "adaptive paraphrase" column to dataset entries

**Value:** Addresses Limitation #1 (single prompt variant). Does not change threat model.

## v1.2 — Multi-Turn Conversation (Planned)
- Extend harness to support multi-turn dialog state (priming phase, adversarial injection, probe)
- Add scenarios where attacker seeds a benign conversation history, then triggers malicious behavior
- Evaluate boundary robustness across conversation turns
- Track "conversation drift" as a new metric (did refusal degrade over turns?)

**Value:** Addresses limitation that current tests are single-turn. New threat dimension without needing live tools.

## v2.0 — Live Agent Framework (Major Extension)
Requires live tool schemas, agent memory, and/or agent frameworks (LangChain, AutoGen, etc.). Evaluates the LLM-as-agent layer, not just the LLM chat-completion layer. This is a meaningfully different threat model that warrants a separate major version.

**Value:** Tests the thing users actually deploy.

## Research Questions
1. Does temperature > 0 significantly change relative family rankings?
2. How does judge prompt design affect compliance count under multi-turn conditions?
3. Can we establish a human-judge baseline for a stratified sample of 200 entries?
4. What is the cross-model transferability of high-compliance attacks?
