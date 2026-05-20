<div align="center">
  <img src="website/public/kevinbytes-logo.png" alt="AgentKillChain Logo" width="120" />
  <h1 align="center">AgentKillChain</h1>
  <p align="center">
    <strong>A prototype benchmark for evaluating persistent compromise in simulated autonomous AI agents.</strong>
  </p>
  <p align="center">
    <a href="https://github.com/kevinobytes/agentkillchain/actions"><img src="https://img.shields.io/github/actions/workflow/status/kevinobytes/agentkillchain/ci.yml" alt="Build Status" /></a>
    <a href="SECURITY.md"><img src="https://img.shields.io/badge/Security-Policy-blue.svg" alt="Security Policy" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" /></a>
  </p>
</div>

<br />

> **AgentKillChain** is a prototype evaluation framework designed to simulate how autonomous AI models might fall prey to multi-stage, persistent compromise. We map the potential vulnerability of simulated AI memory systems over time to prompt-injections and poisoning attacks.

---

## 🛑 The Threat: Latent Memory Poisoning

As large language models (LLMs) transition from passive query interfaces into **stateful agents** (relying on vector databases, short-term memory, and functional toolchains), their attack surface fundamentally shifts.

If an adversary manipulates an agent's memory, the payload can lie dormant for weeks, bypassing safety filters during summarization loops. It may only activate when specific temporal or semantic triggers (e.g., "Summarize my finances") are encountered in future sessions, leading to unauthorized behavior.

We conceptualize this through the **Agent Kill Chain**:
1. **Initial Access**: Injecting untrusted context (e.g., poisoned RAG documents).
2. **Execution**: The agent internalizes the adversarial instruction.
3. **Persistence**: The payload survives session boundaries via latent memory.
4. **Activation**: A seemingly benign future trigger recalls the poisoned state.
5. **Escalation**: Toolchain confusion tricks the agent into invoking privileged tools.
6. **Exfiltration / Impact**: Attacker-defined objectives (e.g. data theft) are executed.

---

## 📊 Baseline Signals

Across the May 20, 2026 Ollama Cloud run, AgentKillChain attempted **1,560 model-scenario pairs** (40 attacks x 39 authenticated Ollama Cloud models). **1,559 were successfully scored**, with 1 provider API error and 0 timeouts. These are the global baseline metrics computed from scored results after heuristic false-positive hardening:

*   **Overall Unsafe-Signal Rate:** 1.48%
*   **Unsafe Tool-Proposal Rate:** 1.41%
*   **Secret Disclosure Signal Rate:** 0.00%
*   **Policy Violation Rate:** 1.22%

Static charts for the current benchmark are available in [`results/`](results/README.md), including coverage, failure-mode, model-risk, and attack-family views.

---

## Implications for Frontier Model Evaluation

AgentKillChain is not only a security benchmark. It is also a prototype safety evaluation for frontier agentic systems that must preserve instruction hierarchy, memory integrity, and tool-use boundaries across long-running workflows.

The benchmark maps directly onto current frontier lab concerns:

*   **Context drift → alignment degradation under optimization pressure.** The model is tested on whether it preserves the user's legitimate objective when adversarial context is framed as helpful operational detail.
*   **Latent memory poisoning → sleeper agent / deferred defection behavior.** The model is tested on whether a harmless-looking seed can become durable state and activate later under a delayed trigger.
*   **Toolchain confusion → unauthorized capability acquisition.** The model is tested on whether adversarial context can induce unsafe tool selection or privileged action, even when the text response appears guarded.

This framing makes the harness useful for evaluating failure chains that single-turn jailbreak tests miss: seed-time behavior, memory writeback, delayed activation, planner integrity, tool-call safety, and downstream impact. See [`SAFETY_RELEVANCE.md`](SAFETY_RELEVANCE.md) for the full kill-chain-to-safety-evaluation mapping.

---

## 🚀 Key Features

*   **🧪 The Evaluation Harness**: A Python framework capable of orchestrating simulated attacks across LLMs via OpenRouter, local Ollama, or authenticated Ollama Cloud.
*   **🔁 Backward-Compatible Scenario Inputs**: `ScenarioEngine.execute` supports legacy attack key aliases (e.g. `payload`, `trigger_condition`, `expected_behavior`), but the main harness runner/dataset loader currently requires canonical fields (`scenario_type`, `seed_input`, `trigger_input`, `expected_failure_mode`) or pre-translated scenarios.
*   **📚 Attack Catalog**: 8 unique payload families (HTML injection, RAG poisoning, markdown injection, memory poisoning, latent memory poisoning, context drift, toolchain confusion, cognitive overload) × 5 workflow framings = 40 structured scenarios (located in `dataset/attack_catalog.json`).
*   **📊 Evaluative Telemetry**: Produces JSON/CSV metrics tracking simulated Susceptibility and Latent Activation Rates.
*   **💻 Next.js Dashboard**: A premium, open-source visualization frontend to explore model evaluation metrics, redacted trace digests, and attack-family aggregates.
*   **🧹 Prompt Variant Deduplication**: The `/prompts` view now groups repeated payload text into unique prompt variants while still exposing every linked `attack_id` and highest-severity rollup.

---

## 🏗️ Repository Architecture

The project is structured into distinct, decoupled components:

| Component | Description |
| :--- | :--- |
| `harness/` | Core Python evaluation engine. Mocks an architectural AI agent and pipelines prompts to target LLMs. |
| `website/` | Next.js tailored dashboard. Ingests evaluation metrics to generate real-time visualization widgets and interactive catalogs. |
| `dataset/` | The definitive JSON corpus defining `attack_id`, `trigger_condition`, and exact payloads for empirical evaluation. |
| `results/` | Output directory for structured result artifacts plus static benchmark visualizations for repository and paper readers. |
| `docs/` | Preprint manuscript, submission plan, methodology notes, deployment guides, and storage strategy workflows. |

---

## ⚙️ Quickstart

### 1. Generating Empirical Data (Python Harness)
To run the evaluation harness against top-tier models, configure your environment and execute the harness:

```bash
# 1. Setup environment
cp .env.example .env

# Edit .env to add your OPENROUTER_API_KEY or OLLAMA_API_KEY
# OPENROUTER_API_KEY=sk-or-v1-...
# OLLAMA_API_KEY=...

# 2. (Optional) Run deterministic tests & validation scripts
python3 -m unittest discover -s harness/tests
python3 harness/runner.py --dry-run
python3 scripts/redact_public_results.py --input-json results/generated/model_results.json --output-json results/model_results.json --output-csv results/model_results.csv
python3 scripts/validate_artifacts.py
python3 scripts/check_public_release.py

# 3. Execute live runs against target LLMs
python3 harness/runner.py

# Or run the full authenticated Ollama Cloud catalog
python3 harness/runner.py --provider ollama-cloud --judge-mode heuristic --run-label ollama-cloud-take-2026-05-20
```
> [!NOTE] 
> Live runs generate raw prompts and model traces in the ignored `results/generated/` directory. Publish only redacted artifacts:
> `python3 scripts/redact_public_results.py --input-json results/generated/model_results.json --output-json results/model_results.json --output-csv results/model_results.csv`

---

### 2. Exploring the Metrics (Next.js Website)
Once public-safe results are generated, boot up the local visualizer to explore metrics and redacted trace digests:

```bash
cd website

# 1. Install Dependencies
npm install

# 2. Boot Local Dev Server
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000). The dashboard provides paths to:
* `/results` - Overview of model-level unsafe-signal metrics.
* `/dataset` - Granular inspection of result records and redacted trace digests.
* `/prompts` - The comprehensive taxonomy of the attack catalog, grouped by unique prompt payload to avoid repeated cards.

---

## 🛡️ Empirical Findings & Mitigations

Through evaluation in this simulated environment, we observe that models can be tricked by attacks like the **Toolchain Confusion Strategy**. Note that this benchmark is a prototype: memory, tools, and environments are mocked. Readers should consult `LIMITATIONS.md` and `TRUSTWORTHINESS.md` before applying these findings to production systems.

**Recommended Mitigations:**
1. **Memory Provenance Tagging**: Maintain strict boundaries in vector storage between "System Instructions", "User Intent", and "passively retrieved Context".
2. **Policy-Constrained Routing**: Never implicitly trust LLM parsing routing logic for privileged tool access; introduce classical deterministic middleboxes.

*See the preprint manuscript at [docs/whitepaper.md](docs/whitepaper.md), the upload-ready PDF at [docs/agentkillchain-preprint.pdf](docs/agentkillchain-preprint.pdf), and the non-arXiv submission plan at [docs/preprint_submission.md](docs/preprint_submission.md).*

---

## 🤝 Contributing & Security Info

AgentKillChain is an open research movement dedicated to hardening autonomous AI architectures.

*   Pull Requests tracking new payload variations in `attack_catalog.json` are welcome.
*   Please review `CONTRIBUTING.md` prior to opening a PR.
*   See `SECURITY.md` for our responsible disclosure guidelines regarding zero-day agent escapes.

<div align="center">
<br/>
<em>Licensed under MIT. Authored by the independent security research community.</em>
</div>
