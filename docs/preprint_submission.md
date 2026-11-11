# Manuscript and Artifact Submission Plan

The manuscript and result files in this repository form a reproducible research package. Their presence does not establish peer review, an external submission, or a DOI. Citation metadata currently points to the repository. Any future submission should identify the exact commit and disclose the current label limitations.

## Current Package

| File | Role |
|---|---|
| `docs/whitepaper.md` | Current manuscript source with a generated results block |
| `docs/agentboundary-paper.html` | Exported manuscript; regenerate after source changes |
| `docs/agentboundary-paper.pdf` | Exported manuscript PDF; regenerate after source changes |
| `results/reconciled_stats.json` | Current machine-readable report |
| `results/reconciled_stats.md` | Current readable report |
| `results/v2_3_rejudged.jsonl` | Retained few-shot judge records |
| `results/v2_3_1_compliance_rejudge.jsonl` | Targeted correction overlay |
| `results/v1_evaluated.jsonl` | Historical merged labels checked by reconciliation |
| `dataset/attack_catalog.json` | Current scenario catalog |
| `docs/PROVENANCE.md` | Source lineage and exclusions |
| `docs/methodology.md` | Acquisition, judging, inclusion, and analysis methods |
| `LIMITATIONS.md`, `TRUSTWORTHINESS.md` | Scope and evidence limitations |
| `CITATION.cff` | Repository citation metadata |

The current report contains 551 scorable responses from 552 retained records and a 561-pair planned grid. Its labels are automated and include a disclosed disputed negative. A submission must not describe them as human-validated, omit the targeted nature of the correction, or equate zero positive labels with safety.

Historical `model_results.json`, `model_results.csv`, older figures, and the initial 45-endpoint manuscript are separate artifacts. Do not use them as the current report's table, CSV, or figure counterpart. If included as supplementary history, label their source cohort and scoring version explicitly.

## Regenerate and Check

From the repository root:

```bash
python3 scripts/analyze.py
python3 scripts/analyze.py --check
npm --prefix website run export:paper
npm --prefix website run export:paper:pdf
```

The statistics commands are offline. The export commands require the website's installed dependencies and the browser/PDF environment expected by its scripts. Inspect the resulting HTML/PDF and confirm that any website-served copy matches the regenerated manuscript before publishing. Do not call an older rendered PDF current merely because its filename matches.

## Release and Submission Steps

1. Fix the commit and source inputs used for the manuscript; record the report's source hashes.
2. Confirm that the generated tables, scope, exclusions, and disclosed label dispute agree across formats.
3. Review the files included in an archive. Only add publication or DOI metadata after an actual external record exists.
4. Create a versioned release and, if desired, submit the reviewed package to the selected archive or manuscript venue.
5. Keep any later adjudication or new evaluation versioned separately so readers can distinguish corrected labels from new model observations.

Zenodo and SSRN were previously considered as possible destinations. This document is a package and provenance plan, not a completed submission or a commitment to a particular venue. Check the destination's current rules before uploading.

## Exclude Private and Generated Working Data

Exclude credentials, `.env` files other than a public example, private run directories, local logs, databases, dependency directories, caches, and unreviewed working outputs. The repository ignores several such paths, but tracking status alone is not a content-safety review.

The later public JSONL artifacts contain bounded prompt and response text; the earlier study used a different redacted-trace policy. Submission notes must describe the actual artifacts being supplied rather than claiming all live text is absent. Preserve necessary evidence and review it before public distribution.
