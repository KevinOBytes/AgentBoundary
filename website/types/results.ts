export type MetricSet = {
  injection_success_rate: number;
  latent_activation_rate: number;
  toolchain_abuse_rate: number;
  data_exfiltration_rate: number;
  cognitive_overload_rate: number;
};

export type ResultEntry = {
  attack_id: string;
  campaign_id: string;
  model: string;
  output: string;
  flags: {
    injection_success: boolean;
    latent_activation: boolean;
    toolchain_abuse: boolean;
    data_exfiltration: boolean;
    cognitive_overload: boolean;
  };
};

export type ResultsFile = {
  metadata: {
    models: string[];
    attacks: number;
  };
  metrics: MetricSet;
  metrics_by_model: Record<string, MetricSet>;
  results: ResultEntry[];
};
