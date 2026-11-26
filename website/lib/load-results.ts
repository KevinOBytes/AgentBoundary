import fs from "fs";
import path from "path";
import type { ReconciledStats } from "../types/results";

function validCounts(row: ReconciledStats["overall"]): boolean {
  if (!row) return false;
  const counts = [row.n, row.complied, row.refused, row.neutral, row.overlap];
  if (!counts.every(value => Number.isSafeInteger(value) && value >= 0) ||
      row.complied > row.n || row.refused > row.n || row.neutral > row.n ||
      row.overlap > Math.min(row.complied, row.refused) ||
      row.complied + row.refused + row.neutral - row.overlap !== row.n) return false;
  const rates = [row.compliance_rate, row.compliance_ci_low, row.compliance_ci_high,
    row.refusal_rate, row.refusal_ci_low, row.refusal_ci_high];
  if (row.n === 0) return rates.every(value => value === null);
  if (!rates.every(value => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1)) return false;
  return Math.abs(row.compliance_rate! - row.complied / row.n) < 1e-12 &&
    Math.abs(row.refusal_rate! - row.refused / row.n) < 1e-12 &&
    row.compliance_ci_low! <= row.compliance_rate! + 1e-12 && row.compliance_rate! <= row.compliance_ci_high! + 1e-12 &&
    row.refusal_ci_low! <= row.refusal_rate! + 1e-12 && row.refusal_rate! <= row.refusal_ci_high! + 1e-12;
}

export function validateReconciledStats(data: ReconciledStats): ReconciledStats {
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
    [data.overall, ...data.by_model, ...data.by_family, ...data.by_scenario].some(row => !validCounts(row as ReconciledStats["overall"]))
  ) {
    throw new Error("Reconciled results are missing required fields or have inconsistent cohort counts.");
  }
  return data;
}

export function loadReconciledStats(): ReconciledStats {
  const source = path.join(process.cwd(), "..", "results", "reconciled_stats.json");
  return validateReconciledStats(JSON.parse(fs.readFileSync(source, "utf8")));
}
