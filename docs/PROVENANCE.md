# AgentBoundary Run Provenance

**Release:** v1.0  
**Evaluation date:** 2026-06-03  
**Total evaluations:** 552 (51 entries × 11 models, `temperature=0.0`)  
**Attempted evaluations:** 561 (9 endpoint errors excluded)  
**Judge:** gpt-5.4 (non-reasoning, OpenAI API) with few-shot exemplified rubrics and structured JSON output  
**Re-judge basis:** Same 552 model responses were re-judged; models were **not** re-run between judge versions  
**API routing:** OpenRouter (with fallback to direct OpenAI for judge)  
**Catalog:** `dataset/attack_catalog.json` (51 entries, 8 families)  
**Manifest:** `dataset/manifest.json`  
**Raw results:** `results/v2_2_eval_20260528_final.jsonl` (definitive 552-evaluation dataset)  

## Model Cohort (11 models)

| Model | Provider | Evals attempted | Evals valid | Notes |
|-------|----------|-----------------|-------------|-------|
| GPT-5-pro | OpenAI | 51 | 42 | 9 endpoint errors (empty/null responses) |
| Claude Opus-4.7 | Anthropic | 51 | 51 | |
| Gemini 3.5 Flash | Google | 51 | 51 | |
| DeepSeek V4 Pro | DeepSeek | 51 | 51 | |
| Llama-4 Maverick | Meta | 51 | 51 | |
| GPT-5-mini | OpenAI | 51 | 51 | |
| DeepSeek V4 Flash | DeepSeek | 51 | 51 | |
| Gemini 3.1 Pro Preview | Google | 51 | 51 | |
| O3-mini | OpenAI | 51 | 51 | |
| MIMO-v2.5-pro | Xiaomi | 51 | 51 | |
| GLM-5.1 | Zhipu AI | 51 | 51 | Injection-aware baseline |

## Endpoint Errors (9 excluded evaluations)

All 9 errors were from GPT-5-pro returning empty/null responses. A neutral ping test confirmed the endpoint was returning `None` on all prompts, including harmless ones. These were excluded as endpoint errors, not scored as safe refusals.

The 9 affected entries have `n_entry = 10` valid evaluations; all other 42 entries have `n_entry = 11`. Severity thresholds are adjusted proportionally for the 10-eval entries.

## Known Gaps in Provenance

The following artifacts are **not** currently available. Their absence limits full reproducibility:

- **Frozen model response hashes:** SHA-256 digests of raw model outputs were not retained at the time of evaluation.
- **API request/response IDs:** OpenRouter and provider trace IDs were not logged.
- **Provider version hashes:** Exact model weights/revisions are opaque through the OpenRouter routing layer.
- **Judge prompt text:** Few-shot exemplars and structured JSON schema are in `scripts/rejudge_compliance.py` but not pinned with a cryptographic hash.
- **Pre-registration:** No pre-registered analysis plan or rubric.

## Reproducibility Checklist

- [x] Evaluation harness code available (`eval_live.py`, `harness/`)
- [x] Dataset schema documented (`dataset/manifest.json`)
- [x] Attack catalog open (`dataset/attack_catalog.json`)
- [x] Per-row results with verdicts (`results/v2_2_eval_20260528_final.jsonl`)
- [x] Wilson CIs reported for all proportions
- [ ] Frozen output hashes
- [ ] API trace IDs
- [ ] Human ground-truth validation
- [ ] Pre-registered rubric

## Citation

See `CITATION.cff` for academic metadata.
