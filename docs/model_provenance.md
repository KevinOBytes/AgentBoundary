# Model Provenance Appendix

This appendix documents the provenance of every model evaluated in the
AgentBoundary v0 public release (May 20, 2026). Each model is listed with
its vendor of record, the API endpoint used to call it, and a public reference
where reviewers can verify that the model exists and was reachable at the time
of the run.

The release contains two cohorts:

- **Ollama Cloud baseline** (39 models): All models reachable through the
  authenticated Ollama Cloud `/api/tags` endpoint at run time, using model
  identifiers exactly as returned by that endpoint. These identifiers are not
  guaranteed to be the upstream vendor's canonical model name. Ollama may
  repackage, quantize, or fine-tune upstream weights; the Ollama identifier is
  authoritative for reproduction against Ollama Cloud but should not be read as
  an unmodified weight identity from the upstream vendor.
- **OpenRouter frontier/lite cohort** (6 models): Proprietary/closed models
  reachable through OpenRouter's `/api/v1/chat/completions` endpoint using the
  exact slug shown in the table below.

## Cohort: OpenRouter frontier/lite (6 models)

| Model slug | Vendor | Provenance reference |
|---|---|---|
| `openai/gpt-5.3-chat` | OpenAI | OpenRouter model registry; OpenAI 2026 model line |
| `openai/gpt-5.4-mini` | OpenAI | OpenRouter model registry; OpenAI 2026 model line |
| `anthropic/claude-opus-4.7` | Anthropic | OpenRouter model registry; Anthropic Claude 4 model line |
| `anthropic/claude-haiku-4.5` | Anthropic | OpenRouter model registry; Anthropic Claude 4 model line |
| `google/gemini-3.1-pro-preview` | Google | OpenRouter model registry; Google Gemini 3 preview line |
| `google/gemini-3.1-flash-lite` | Google | OpenRouter model registry; Google Gemini 3 lite line |

These are reached via the OpenRouter HTTP API using the slugs exactly as shown.
OpenRouter performs its own routing to provider endpoints; the upstream weight
identity is the provider's responsibility. Reproduction requires an OpenRouter
API key and the same slugs.

## Cohort: Ollama Cloud baseline (39 models)

The Ollama Cloud cohort was discovered programmatically. The runner calls
`GET https://ollama.com/api/tags` with the user's `OLLAMA_API_KEY`, takes the
returned `models[].name` list verbatim, and runs every scenario against every
returned model. The exact discovery query, model list, and call timestamp are
recorded in `metadata.models_requested` and `metadata.run_timestamp` of the
public artifact.

The full list of 39 model identifiers used in this release:

```
cogito-2.1:671b
deepseek-v3.1:671b
deepseek-v3.2
deepseek-v4-flash
deepseek-v4-pro
devstral-2:123b
devstral-small-2:24b
gemini-3-flash-preview
gemma3:12b
gemma3:27b
gemma3:4b
gemma4:31b
glm-4.6
glm-4.7
glm-5
glm-5.1
gpt-oss:120b
gpt-oss:20b
kimi-k2-thinking
kimi-k2.5
kimi-k2.6
kimi-k2:1t
minimax-m2
minimax-m2.1
minimax-m2.5
minimax-m2.7
ministral-3:14b
ministral-3:3b
ministral-3:8b
mistral-large-3:675b
nemotron-3-nano:30b
nemotron-3-super
qwen3-coder-next
qwen3-coder:480b
qwen3-next:80b
qwen3-vl:235b
qwen3-vl:235b-instruct
qwen3.5:397b
rnj-1:8b
```

### Important caveats for the Ollama Cloud cohort

1. **Identifiers are Ollama's library names, not upstream canonical names.**
   For example, `gpt-oss:120b` refers to the Ollama-library packaging of
   OpenAI's open-weight model release; it is not the same weight artifact as
   any closed OpenAI API model. `gemini-3-flash-preview` in the Ollama Cloud
   namespace is **not** the same endpoint as Google's
   `google/gemini-3.1-flash-lite` on OpenRouter, and the two should not be
   confused.

2. **Some identifiers may refer to community repackagings or fine-tunes.**
   Models like `rnj-1:8b` and family-named tags such as
   `mistral-large-3:675b` follow Ollama's `<library>:<tag>` convention. The
   tag may indicate a quantization level, fine-tune variant, or release
   pointer. The exact weight provenance for each Ollama Cloud library entry
   is the responsibility of the Ollama Cloud catalog at the run timestamp;
   the AgentBoundary results characterize the behavior of the endpoint
   reachable at that identifier and time, not necessarily the unmodified
   upstream weights.

3. **The cohort is descriptive of one snapshot.** Ollama Cloud's library is
   not version-locked. A reproduction six months from now may discover a
   different set of identifiers under the same names, or the same identifier
   may resolve to updated weights. The AgentBoundary artifact records
   `run_timestamp` and per-row trace SHA-256 digests so any divergence
   between the recorded behavior and a fresh run can be detected.

4. **This is not a closed-vendor model ranking.** The frontier/lite cohort
   (six models on OpenRouter) and the Ollama Cloud cohort are reported
   separately because they are not directly comparable. Any cross-cohort
   comparison should treat the Ollama Cloud entries as packaging-specific
   endpoints rather than as upstream vendor flagships.

### Reproduction notes for the Ollama Cloud cohort

```bash
# Discover the current Ollama Cloud model list
curl -s -H "Authorization: Bearer $OLLAMA_API_KEY" https://ollama.com/api/tags \
  | jq -r '.models[].name' | sort

# Run the benchmark against the discovered cohort
python3 harness/runner.py \
  --provider ollama-cloud \
  --judge-mode heuristic \
  --run-label ollama-cloud-baseline
```

If a model from the original run is not present in a future discovery, the
divergence is recorded in `metadata.cohorts[].models_requested`; the missing
model's rows simply will not be produced in the reproduction.

## What this appendix does NOT claim

- It does not claim that every Ollama Cloud identifier corresponds to an
  officially released model from the named vendor.
- It does not claim weight-level identity with upstream vendor checkpoints.
- It does not claim that the same identifier will resolve to the same weights
  in any future Ollama Cloud snapshot.

These are intentional limitations of evaluating against a managed model
catalog that does not publish per-tag checksums.
