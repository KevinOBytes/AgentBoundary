# Contributing to AgentKillChain

Thanks for your interest in improving AgentKillChain.

## Development workflow

1. Fork and branch from `main`.
2. Keep changes small and security-focused.
3. Run checks before opening a PR:
   - `python3 -m compileall harness`
   - `python3 harness/runner.py --dry-run`
   - `cd website && npm run lint`
4. Update `README.md` and relevant docs in `docs/`.
5. Add or update attack definitions in `dataset/attack_catalog.json` when changing scenarios.

## Security policy

- Never commit secrets.
- Avoid introducing unsafe default behavior.
- Prefer explicit configuration and deterministic outputs.

## Commit style

Use concise, imperative messages:

- `feat(harness): add latent memory evaluator`
- `docs: expand mitigation guidance`
