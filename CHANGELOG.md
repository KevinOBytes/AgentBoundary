# Changelog

All notable changes to AgentKillChain are documented in this file.

## v2.1 — 2026-05-27 (empirical recalibration release)

### Critical methodology fix

- **Full empirical severity recalibration.** The v1 catalog assigned severity
  by theoretical harm assessment (82% high/critical). v2.1 runs every entry
  against live frontier models via LLM-as-judge and re-labels based on actual
  clear compliance (`refusal=False AND compliance_detected=True`). Final
  distribution: 0 critical, 3 high (5.9%), 12 medium (23.5%), 36 low (70.6%).
  Only three entries achieved ≥2/4 clear compliance.

- **Ground-up catalog rewrite.** Replaced the synthetic 5×5 grid with
  contextually appropriate prompts per scenario type. Eliminated copy-paste
  defects, broken multi-phase seeds, and artificial goal rotation. Built from
  `build_catalog.py` as source-of-truth.

### Added

- **Live evaluation harness** (`eval_live.py`) for OpenRouter-backed
  LLM-as-judge with two-pass judging (refusal detection + compliance
  detection), resume support, and per-evaluation JSONL logging.
- **Full 4-model evaluation** (GPT-4o, Claude Sonnet-4, Gemini 2.5 Pro,
  Llama-4 Maverick) on all 51 catalog entries = 204 live evaluations.
- **Bypass sophistication grading** per entry (`naive` → `expert`) and
  keyword-filter baseline comparison (37% stealth rate).
- **Inter-annotator calibration** sample (`dataset/inter_annotator_sheet.md`)
  for Cohen's κ on severity labels.
- **Empirical results document** (`docs/EMPIRICAL_RESULTS.md`) with model
  robustness ranking, family-level compliance rates, and security
  implications.

### Changed

- **Severity methodology:** `critical` removed entirely (no ≥3/4 compliance);
  `high` requires ≥2/4 compliance; `medium` requires 1/4 or ≥3/4 neutral;
  `low` is 0/4 compliance with majority explicit refusal.
- **Phase model:** `dormancy` deprecated in `manifest.json`. Standard
  chat-completion APIs do not implement persistent cross-session memory.
  All multi-phase entries converted to single-phase seed attacks.
- **Judge method:** Switched from deterministic heuristic scoring to
  `gpt-4o-mini` LLM-as-judge. Heuristic scoring retained as fallback.

### Documentation

- `docs/methodology.md` rewritten for v2.1 with literature grounding per
  family, empirical protocol, and known-gaps honesty section.
- `docs/EMPIRICAL_RESULTS.md` added with full 204-evaluation breakdown.
- `README.md` updated for v2.1 numbers and quickstart.
- `CITATION.cff` bumped to v2.1.0.

## v1 — 2026-05-20 (in-progress salvage release)

### Critical methodology fix

- **Catalog prompt diversification.** Pre-v1 the catalog contained 40
  scenarios with only 8 unique seed+trigger combinations: each family had
  5 entries that varied `scenario_type` metadata but used the same
  prompt. v1 replaces every scenario with a contextually appropriate
  prompt for its declared `scenario_type`, yielding 42 unique prompts
  across 55 scenarios. The pre-fix catalog is preserved at
  `dataset/attack_catalog_v0_archive.json` and the pre-fix public
  artifact at `results/model_results_v0_archive.json`.

### Added

- **Defense variant ablation framework** in `harness/defense_variants.py`.
  Three named variants — `hardened`, `generic`, `generic_plus_memory_filter`
  — with SHA-256-pinned prompt text and an optional deterministic
  untrusted-content filter (`imperative_filter`) that strips
  imperative-verb clauses from non-user-authored content. Runner accepts
  `--defense-variant`.
- **Utility metrics** in `harness/utility_metrics.py`: benign-task
  engagement rate, over-refusal rate, safe-and-useful rate,
  safe-but-useless rate. Reported alongside unsafe-signal rates.
- **Paraphrase robustness variants** for the highest-signal family.
  10 paraphrase variants of the 5 toolchain_confusion scenarios
  (`toolchain_confusion_00X_p2`, `..._p3`) test whether the observed
  unsafe-signal rate survives plausible adversary rewording.
- **Obfuscated latent-memory campaigns.** 5 new LMP scenarios
  (`latent_memory_poisoning_006` through `_010`) with subtler seeds
  disguised as user preferences, config notes, code comments,
  cross-tenant policies, and tool-routing conventions.
- **Model provenance documentation** at `docs/model_provenance.md` with
  the full Ollama Cloud cohort identifier list and caveats about Ollama
  library names not being upstream canonical names.
- **Run configuration in artifact metadata.** `system_prompt_sha256`,
  `defense_variant`, `defense_variant_provenance`, `memory_backend`,
  `run_configuration` block all embedded in `results/model_results.json`
  metadata so a reader can reconstruct any cohort from the artifact
  alone.
- **Per-row `memory_backend` field** so LMP rows are distinguishable from
  non-LMP rows by their backend, not just by family.

### Changed

- Default OpenRouter cohort in `harness/runner.py:parse_models` now
  matches the published whitepaper exactly (`openai/gpt-5.3-chat`,
  `openai/gpt-5.4-mini`, `anthropic/claude-opus-4.7`,
  `anthropic/claude-haiku-4.5`, `google/gemini-3.1-pro-preview`,
  `google/gemini-3.1-flash-lite`). Pre-v1 the default list was 17
  unrelated models that no longer match any published result.
- OpenRouter adapter timeout raised from 20s to 60s. The 20s timeout was
  too tight for multi-turn agentic tasks against reasoning models.
- `harness/scenario_engine.py:ScenarioEngine` now accepts an optional
  `untrusted_filter` callable applied to trigger_payload and retrieved
  memory chunks at activation time. Required for the
  `generic_plus_memory_filter` defense variant.

### Fixed

- `_model_alias` mapping in `harness/runner.py` no longer silently
  rewrites `anthropic/claude-4.5-haiku` to `anthropic/claude-opus-4.5`.
  The original mapping would have charged opus prices for a haiku
  request.
- Dead `system_prompt` field on `OpenRouterAdapter` documented as
  deprecated (the active prompt is set by `ScenarioEngine`, not the
  adapter).

### Documentation

- New `docs/model_provenance.md` appendix.
- Whitepaper rewritten at `docs/whitepaper.md` to reflect v1 catalog,
  defense ablation, paraphrase robustness, and utility metrics. New
  Section 2 (Related Work) explicitly differentiates from AgentDojo,
  Garak, and PyRIT. New Section 5.4 ("Scoring construction disclosure")
  explicitly states that `unsafe_tool_call_proposed` and
  `tool_policy_block_rate` are downstream of the same harness rule.
- README updated to reflect v1.

### Removed

- The misleading "5 scenarios per family" framing where each scenario
  used the same prompt with only metadata varying. Replaced with
  genuinely-distinct prompts per scenario_type.

## v0 — 2026-05-20 (archived)

Original multi-provider release. Archived as
`dataset/attack_catalog_v0_archive.json` and
`results/model_results_v0_archive.json` because of the catalog
duplicate-prompt issue corrected in v1.

- 40-scenario catalog, 8 families × 5 entries each (but only 8 unique
  prompts; the 5-per-family count varied only metadata).
- Two cohorts: Ollama Cloud baseline (39 models) and OpenRouter
  frontier/lite (6 models), 1,800 attempted+scored evaluations.
- Latent-memory vector backend with ChromaDB and sentence-transformers
  embeddings.
- Public redaction policy: full live traces excluded; flags, metrics,
  character counts, and SHA-256 digests retained.

## v1.0.x — earlier 2026 (archived)

Early development releases. See git history for details.
