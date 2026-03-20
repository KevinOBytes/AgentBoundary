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

## 📊 The New Metrics

Running a true 720 attack scenarios produced these updated global baseline metrics, which actually remained roughly stable despite adding all the new architectures:

*   **Global Compromise Rate:** 1.71% (Up slightly from 1.63%)
*   **Toolchain Abuse Rate:** 0.38% (Down slightly)
*   **Data Exfiltration:** 0.19% (Down slightly)

---

## 🚀 Key Features

*   **🧪 The Evaluation Harness**: A Python framework capable of orchestrating simulated attacks across LLMs via the OpenRouter API.
*   **🔁 Backward-Compatible Scenario Inputs**: `ScenarioEngine.execute` supports legacy attack key aliases (e.g. `payload`, `trigger_condition`, `expected_behavior`), but the main harness runner/dataset loader currently requires canonical fields (`scenario_type`, `seed_input`, `trigger_input`, `expected_failure_mode`) or pre-translated scenarios.
*   **📚 40-Vector Attack Catalog**: Spanning Markdown Injection, HTML Injection, Context Drift, and Toolchain Confusion scenarios (located in `dataset/attack_catalog.json`).
*   **📊 Evaluative Telemetry**: Produces JSON/CSV metrics tracking simulated Susceptibility and Latent Activation Rates.
*   **💻 Next.js Dashboard**: A premium, open-source visualization frontend to interactively explore model evaluation metrics, trace logs, and execution diffs.

---

## 🏗️ Repository Architecture

The project is structured into distinct, decoupled components:

| Component | Description |
| :--- | :--- |
| `harness/` | Core Python evaluation engine. Mocks an architectural AI agent and pipelines prompts to target LLMs. |
| `website/` | Next.js tailored dashboard. Ingests evaluation metrics to generate real-time visualization widgets and interactive catalogs. |
| `dataset/` | The definitive JSON corpus defining `attack_id`, `trigger_condition`, and exact payloads for empirical evaluation. |
| `results/` | Output directory where the harness writes structured `model_results.json` datasets post-evaluation. |
| `docs/` | Deep-dive research papers, architectural deployment guides, and storage strategy workflows. |

---

## ⚙️ Quickstart

### 1. Generating Empirical Data (Python Harness)
To run the evaluation harness against top-tier models, configure your environment and execute the harness:

```bash
# 1. Setup environment
cp .env.example .env

# Edit .env to add your OPENROUTER_API_KEY
# OPENROUTER_API_KEY=sk-or-v1-...

# 2. (Optional) Run deterministic tests & validation scripts
python3 -m unittest discover -s harness/tests
python3 harness/runner.py --dry-run
python3 scripts/validate_artifacts.py

# 3. Execute liveruns against target LLMs
python3 harness/runner.py
```
> [!NOTE] 
> This will generate fresh evaluation data at `results/model_results.json`.

---

### 2. Exploring the Metrics (Next.js Website)
Once results are generated, boot up the local visualizer to explore interactive execution traces:

```bash
cd website

# 1. Install Dependencies
npm install

# 2. Boot Local Dev Server
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000). The dashboard provides paths to:
* `/results` - Overview of resilient and vulnerable models.
* `/dataset` - Granular inspection of execution traces and modal payloads.
* `/prompts` - The comprehensive taxonomy of the attack catalog.

---

## 🛡️ Empirical Findings & Mitigations

Through evaluation in this simulated environment, we observe that models can be tricked by attacks like the **Toolchain Confusion Strategy**. Note that this benchmark is a prototype: memory, tools, and environments are mocked. Readers should consult `LIMITATIONS.md` and `TRUSTWORTHINESS.md` before applying these findings to production systems.

**Recommended Mitigations:**
1. **Memory Provenance Tagging**: Maintain strict boundaries in vector storage between "System Instructions", "User Intent", and "passively retrieved Context".
2. **Policy-Constrained Routing**: Never implicitly trust LLM parsing routing logic for privileged tool access; introduce classical deterministic middleboxes.

*See the formal Whitepaper at [docs/whitepaper.md](docs/whitepaper.md) for deeper strategic analysis.*

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
