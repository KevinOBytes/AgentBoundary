# Deployment Guide

## Website (Vercel)
1. Import repository into Vercel.
2. Set project root to repository root.
3. Vercel reads `vercel.json` and builds website via `cd website && npm run build`.
4. Add environment variables if needed for future API-backed pages.

## Harness (Docker or CI job)
### Docker
```bash
docker build --target harness-runner -t agentkillchain-harness .
docker run --rm --env-file .env agentkillchain-harness
```

### Scheduled GitHub Action (recommended)
- Add a scheduled workflow using cron.
- Inject `OPENROUTER_API_KEY` from repository secrets.
- Upload `results/*` to GitHub Releases or Cloudflare R2.

## One-click compose local run
```bash
docker compose up --build
```
This starts the website on `localhost:3000` and runs harness dry-run in a service container.
