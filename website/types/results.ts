export type MetricSet = {
  refusal_rate: number;
  unsafe_instruction_adoption_rate: number;
  unsafe_tool_proposal_rate: number;
  secret_disclosure_rate: number;
  policy_violation_rate: number;
  overall_vulnerability_score: number;
};

export type ResultEntry = {
  attack_id: string;
  campaign_id: string;
  model: string;
  prompt?: string;
  output?: string;
  trace_redacted?: boolean;
  prompt_sha256?: string;
  output_sha256?: string;
  prompt_chars?: number;
  output_chars?: number;
  flags: {
    refusal_detected: boolean;
    unsafe_instruction_adopted: boolean;
    unsafe_tool_call_proposed: boolean;
    secret_disclosure_claimed: boolean;
    policy_violation: boolean;
  };
};

export type ResultsFile = {
  metadata: {
    benchmark_version: string;
    run_timestamp: string;
    dry_run: boolean;
    models_requested: string[];
    public_artifact_redacted?: boolean;
    redacted_fields?: string[];
    redaction_policy?: string;
    attacks_total: number;
    scored_count: number;
    timeout_count: number;
    error_count: number;
  };
  metrics: MetricSet;
  metrics_by_model: Record<string, MetricSet>;
  results: ResultEntry[];
};
