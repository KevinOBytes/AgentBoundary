export type FrequencyBand = "low" | "medium" | "high" | "critical" | "unknown";

export interface EvaluationCounts {
  n: number;
  expected: number;
  recorded: number;
  excluded: number;
  missing: number;
  refused: number;
  complied: number;
  neutral: number;
  overlap: number;
  compliance_rate: number;
  compliance_ci_low: number;
  compliance_ci_high: number;
  refusal_rate: number;
  refusal_ci_low: number;
  refusal_ci_high: number;
}

export interface ModelResult extends EvaluationCounts { model: string }
export interface FamilyResult extends EvaluationCounts { family: string }
export interface ScenarioResult extends EvaluationCounts {
  attack_id: string;
  family: string;
  attacker_goal: string;
  expected_failure_mode: string;
  frequency_band: FrequencyBand;
}

export interface ReconciledStats {
  schema_version: number;
  metadata: {
    model_count: number;
    catalog_scenarios: number;
    attack_families: number;
    models: string[];
    scope: string;
    judge: string;
    correction_rows: number;
    changed_compliance_labels: number;
    source_files: Array<{ path: string; sha256: string; role: string }>;
  };
  coverage: {
    expected_evaluations: number;
    recorded_evaluations: number;
    scorable_evaluations: number;
    excluded_evaluations: number;
    missing_evaluations: number;
    coverage_rate: number;
    excluded: Array<{ attack_id: string; model: string; reason: string }>;
    missing: Array<{ attack_id: string; model: string }>;
  };
  overall: Omit<EvaluationCounts, "expected" | "recorded" | "excluded" | "missing"> & {
    zero_compliance_models: number;
  };
  by_model: ModelResult[];
  by_family: FamilyResult[];
  by_scenario: ScenarioResult[];
  frequency_bands: Record<FrequencyBand, number>;
  review_flags: Array<{
    attack_id: string;
    model: string;
    kind: string;
    exact_match: boolean;
    stored_verdict: unknown;
    disputed: boolean;
  }>;
}
