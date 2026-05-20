# Submission and DOI Plan

AgentKillChain does not need arXiv as the first public venue. The practical route is to upload the manuscript to SSRN and archive the code/results bundle with a DOI.

## Recommended Route

1. **Zenodo for code and artifact DOI**
   - Use a GitHub release and archive that release on Zenodo.
   - Zenodo supports versioned records and GitHub release archiving.
   - Sources:
     - https://help.zenodo.org/docs/github/
     - https://zenodo.org/help/versioning

2. **SSRN Computer Science Research Network for the manuscript**
   - SSRN accepts direct author submissions through its submission portal and has a Computer Science Research Network.
   - Sources:
     - https://www.ssrn.com/ssrn/
     - https://www.elsevier.support/ssrn/answer/how-do-papers-get-on-ssrn

## Submission Package

- Manuscript source: `docs/whitepaper.md`
- Upload-ready PDF: `docs/agentkillchain-paper.pdf`
- Print HTML: `docs/agentkillchain-paper.html`
- Public result artifacts: `results/model_results.json`, `results/model_results.csv`
- Visualizations: `results/benchmark_current_*.svg`
- Reproducibility notes: `docs/methodology.md`, `TRUSTWORTHINESS.md`, `LIMITATIONS.md`
- Code release: GitHub release from `main`

## Exclude From Public Uploads

- `.env` and any `.env.*` files except `.env.example`
- `results/generated/`
- `results/raw/`, `results/private/`, and `results/archive/`
- any `*.raw.*`, `*.trace.*`, `*.log`, SQLite, or local database files
- `website/node_modules/`, `website/.next/`, Python caches, and local release bundles

Use `git archive` or a GitHub release archive for the software bundle so only tracked, public-safe files are included.

## Before Upload

1. Create a GitHub release tag, for example `v1.1.0`.
2. Archive the release on Zenodo and capture the DOI.
3. Replace the repository line in `docs/whitepaper.md` with both the GitHub release URL and Zenodo DOI.
4. Regenerate the manuscript PDF with `cd website && npm run export:paper`, then print `docs/agentkillchain-paper.html` to `docs/agentkillchain-paper.pdf`.
5. Include the redaction policy in the submission notes so reviewers understand why raw traces are not public.
