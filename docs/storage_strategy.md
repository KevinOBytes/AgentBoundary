# Artifact Storage Strategy

## Targets
- Primary: Cloudflare R2 (S3-compatible)
- Secondary: GitHub Releases for immutable publication bundles

## Naming convention
`agentkillchain/{dataset_version}/{run_date}/{git_sha}/model_results.{json,csv}`

## Integrity
- Generate sha256 checksum for each artifact.
- Publish checksum file alongside JSON/CSV.

## Retention
- Keep all publication-linked runs for >=365 days.
- Keep nightly CI smoke artifacts for 30 days.

## Metadata
- Include model list, date, commit hash, and dataset version in every exported run metadata object.
