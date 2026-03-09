# AgentKillChain

AgentKillChain is an open research framework for evaluating security vulnerabilities in autonomous AI agents, with a primary focus on latent prompt injection via memory poisoning across sessions.

## Repository layout

- `website/` – Next.js + TypeScript + Tailwind research website.
- `harness/` – Python benchmark harness and evaluation tooling.
- `attacks/` – attack class references.
- `scenarios/` – scenario families for different agent architectures.
- `dataset/attack_catalog.json` – structured catalog with 40 attacks.
- `dataset/manifest.json` – versioned dataset manifest.
- `results/model_results.json` – tracked sample output for docs/website.
- `results/generated/` – ignored generated benchmark outputs (`json` + `csv`).
- `results/manifest.json` – versioned results schema/retention manifest.
- `docs/` – whitepaper and technical documentation.
- `todo.md` – tracked execution checklist for project completion.

## Quickstart

### Website (Vercel-compatible)

```bash
cd website
npm install
npm run lint
npm run build
npm run dev
```

### Harness (OpenRouter benchmark)

```bash
cp .env.example .env
python3 -m compileall harness
python3 -m unittest discover -s harness/tests
python3 harness/runner.py --dry-run
python3 scripts/validate_artifacts.py
```

Run live evaluation (requires `OPENROUTER_API_KEY` in `.env`):

```bash
python3 harness/runner.py
```

## Environment configuration

`.env.example`

```bash
OPENROUTER_API_KEY=
MODELS=gpt-5,claude-3.7,gemini-1.5-pro,mistral-large
AGENT_SYSTEM_PROMPT=You are a secure autonomous agent.
```

## CI, security, and operations

- CI workflow: `.github/workflows/ci.yml`
- Vulnerability disclosure policy: `SECURITY.md`
- Ownership policy: `CODEOWNERS`
- Vercel deployment config: `vercel.json`
- Containerized run: `Dockerfile`, `docker-compose.yml`

## Research model

Lifecycle:

`Initial Access -> Execution -> Persistence -> Latent Activation -> Escalation -> Exfiltration`

Primary classes:
- prompt injection (HTML/Markdown/RAG)
- memory poisoning + latent memory poisoning (`seed` / `dormancy` / `activation`)
- context drift exploitation
- toolchain confusion
- cognitive overload

## Reproducibility

- Deterministic dry-run mode for CI and smoke tests.
- JSON + CSV outputs for downstream analysis at `results/generated/`.
- Per-model and aggregate metric calculations in harness results.
- Artifact schema checks via `scripts/validate_artifacts.py`.

## Deployment

- Website deploys directly to Vercel.
- Artifacts can be mirrored to Cloudflare R2 / S3-compatible storage.
- Harness can run in Dockerized CI or scheduled jobs.
- See `docs/deployment.md` and `docs/storage_strategy.md`.

## Release readiness

- MIT License (`LICENSE`).
- Contributing guide (`CONTRIBUTING.md`).
- Whitepaper draft (`docs/whitepaper.md`).
