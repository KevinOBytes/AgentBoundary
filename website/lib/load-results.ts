import fs from "fs";
import path from "path";
import type { ReconciledStats } from "../types/results";

export function loadReconciledStats(): ReconciledStats {
  const source = path.join(process.cwd(), "..", "results", "reconciled_stats.json");
  const data: ReconciledStats = JSON.parse(fs.readFileSync(source, "utf8"));
  if (
    data.schema_version !== 1 ||
    !Array.isArray(data.by_model) ||
    !Array.isArray(data.by_family) ||
    !Array.isArray(data.by_scenario) ||
    !Array.isArray(data.metadata?.source_files) ||
    data.by_model.length !== data.metadata.model_count ||
    data.by_scenario.length !== data.metadata.catalog_scenarios ||
    data.overall?.n !== data.coverage?.scorable_evaluations ||
    data.coverage.recorded_evaluations !== data.coverage.scorable_evaluations + data.coverage.excluded_evaluations ||
    data.coverage.expected_evaluations !== data.coverage.recorded_evaluations + data.coverage.missing_evaluations ||
    data.by_model.reduce((total, row) => total + row.n, 0) !== data.overall.n ||
    [data.overall, ...data.by_model, ...data.by_family, ...data.by_scenario].some(row =>
      row.n <= 0 || ![row.compliance_rate, row.compliance_ci_low, row.compliance_ci_high, row.refusal_rate, row.refusal_ci_low, row.refusal_ci_high].every(value => typeof value === "number" && Number.isFinite(value))
    )
  ) {
    throw new Error("Reconciled results are missing required fields or have inconsistent cohort counts.");
  }
  return data;
}
