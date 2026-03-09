import fs from "fs";
import path from "path";
import Layout from "../components/Layout";
import { motion } from "framer-motion";
import { Database, ShieldAlert, Activity, Target } from "lucide-react";

interface ModelMetrics {
  total: number;
  injection_success_rate: number;
  data_exfiltration_rate: number;
  latent_activation_rate: number;
  cognitive_overload_rate: number;
  overall_vulnerability_score: number;
}

interface AttackResult {
  attack_id: string;
  campaign_id: string;
  model: string;
  prompt: string;
  output: string;
  flags: {
    injection_success: boolean;
    latent_activation: boolean;
    toolchain_abuse: boolean;
    data_exfiltration: boolean;
    cognitive_overload: boolean;
  };
}

interface HarnessOutput {
  metadata: { models: string[]; attacks: number };
  metrics: ModelMetrics;
  metrics_by_model: Record<string, ModelMetrics>;
  results: AttackResult[];
}

interface Props {
  data: HarnessOutput | null;
}

export async function getStaticProps(): Promise<{ props: Props }> {
  const filePath = path.join(process.cwd(), "..", "results", "generated", "model_results.json");
  let data = null;
  try {
    if (fs.existsSync(filePath)) {
      data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (e) {
    console.error("Failed to load model results", e);
  }
  return { props: { data } };
}

export default function DatasetPage({ data }: Props) {
  if (!data) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <Activity className="text-accent animate-pulse mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white">Evaluation Running...</h2>
          <p className="text-gray-400">The evaluation harness is currently gathering empirical data.</p>
        </div>
      </Layout>
    );
  }

  const { metadata, metrics_by_model, results } = data;
  const models = Object.keys(metrics_by_model).sort((a, b) => 
    metrics_by_model[a].overall_vulnerability_score - metrics_by_model[b].overall_vulnerability_score
  );

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-10 flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-xl">
            <Database className="text-accent" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Empirical Evaluation Results</h1>
            <p className="mt-2 text-gray-400">Comparing state-of-the-art LLMs against {metadata.attacks} multi-stage injection scenarios.</p>
          </div>
        </div>

        {/* Aggregate Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {models.map((model) => {
            const m = metrics_by_model[model];
            const score = (m.overall_vulnerability_score * 100).toFixed(1);
            const isVulnerable = m.overall_vulnerability_score > 0.1;
            
            return (
              <motion.div 
                key={model}
                whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(var(--accent-glow), 0.3)" }}
                className={`glass p-6 rounded-2xl border-t-2 ${isVulnerable ? 'border-t-orange-500' : 'border-t-green-500'}`}
              >
                <h3 className="font-mono text-sm text-gray-400 truncate mb-1">{model.split('/').pop()}</h3>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-4xl font-bold text-white">{score}%</span>
                  <span className="text-sm text-gray-500 mb-1">Vuln. Score</span>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Injection Success</span>
                    <span className={m.injection_success_rate > 0 ? "text-orange-400" : "text-gray-300"}>
                      {(m.injection_success_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Data Exfil</span>
                    <span className={m.data_exfiltration_rate > 0 ? "text-red-400" : "text-gray-300"}>
                      {(m.data_exfiltration_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <h2 className="text-2xl font-bold text-white mb-6">Execution Trace Log</h2>
        <div className="glass rounded-2xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-white/5 text-xs uppercase text-gray-300">
                <tr>
                  <th className="px-6 py-4 font-medium">Model</th>
                  <th className="px-6 py-4 font-medium">Attack ID</th>
                  <th className="px-6 py-4 font-medium text-center">Injected?</th>
                  <th className="px-6 py-4 font-medium">Sample Output</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {results.filter(r => r.flags.injection_success).concat(results.filter(r => !r.flags.injection_success)).slice(0, 20).map((res, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{res.model.split('/').pop()}</td>
                    <td className="px-6 py-4 font-mono text-accent text-xs">{res.attack_id}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${res.flags.injection_success ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                        {res.flags.injection_success ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 truncate max-w-xs" title={res.output}>
                      {res.output.substring(0, 60)}{res.output.length > 60 ? '...' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-black/40 text-center text-sm text-gray-500 border-t border-white/5">
            Showing top 20 records (prioritizing successful injections). Download full CSV for complete trace.
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
