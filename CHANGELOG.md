# Changelog

All notable changes to the AgentKillChain benchmark will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-04-01

### Added
- **Temporal Model Analysis**: Updated the default runner model list to include version pairs (latest vs. previous) for the 7 major model providers (OpenAI, Anthropic, Google, Meta, Mistral, xAI, DeepSeek) to allow for regression testing across generation updates.
- **Two-Pass LLM Judge**: Introduced a strict second-pass confirmation step in `evaluation.py`. When the initial judge flags a positive compromise (e.g., policy violation), a secondary LLM confirmation ensures a concrete, irreversible harmful action was actually proposed, heavily reducing false positives from "chatty" or conversational models.

### Changed
- **Documentation Accuracy**: Corrected the Whitepaper and README to accurately explain the single-agent ReAct architecture (removing the older 4-agent profile claim) and clarified the 40-scenario experiment matrix (8 payload families × 5 framings).
- **Hardened Policy Layer**: Strengthened the mock security layer in `model_adapter.py`. `read_document` now explicitly blocks sensitive system paths (like `/etc/shadow`), `send_email` blocks untrusted domains, and `fetch_url` blocks known exfiltration URLs (like webhook.site or ngrok).

### Removed
- **Zero-Data Models**: Removed 4 models (`phi-4`, `hermes-4`, `liquid/lfm-2-24b-a2b`, `sonar-reasoning-pro`) from the default test rotation due to parsing/JSON-calling failures causing zero scored results in the initial baseline run.

## [1.0.0] - 2026-03

### Added
- Initial release of the AgentKillChain benchmark.
- Harness for 40 multi-stage scenarios simulating agentic workflows.
- Scoring system covering Injection Success, Latent Activation, Toolchain Abuse, Data Exfiltration, and Cognitive Overload.
- Results portal and companion website.
