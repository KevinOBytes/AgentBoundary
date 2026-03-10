import fs from "fs";
import path from "path";
import Layout from "../components/Layout";
import { motion } from "framer-motion";
import { Activity, Shield, ShieldAlert, ShieldCheck, Database, Target, Skull, Cpu, Crosshair } from "lucide-react";
import type { ResultsFile, MetricSet } from "../types/results";

interface Props {
  data: ResultsFile | null;
}

export async function getStaticProps(): Promise<{ props: Props }> {
  const filePath = path.join(process.cwd(), "..", "results", "model_results.json");
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

export default function ResultsPage({ data }: Props) {
  if (!data) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <Activity className="text-accent animate-pulse mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white">No Results Found</h2>
          <p className="text-gray-400">Please run the evaluation harness to generate metrics.</p>
        </div>
      </Layout>
    );
  }

  const { metadata, metrics, metrics_by_model } = data;
  const models = Object.keys(metrics_by_model).sort((a, b) => 
    metrics_by_model[a].injection_success_rate - metrics_by_model[b].injection_success_rate
  );

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-xl">
              <Activity className="text-accent" size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Aggregate Results Dashboard</h1>
              <p className="text-gray-400">Diagnostic telemetry from {metadata.attacks} orchestrated attacks across {metadata.models.length} sovereign models.</p>
            </div>
          </div>
        </div>

        {/* Global Aggregate Highlights */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
          <div className="glass p-6 rounded-2xl border-t-2 border-t-accent shadow-[0_0_30px_-10px_rgba(var(--accent-glow),0.3)]">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Global Compromise Rate</h3>
               <Target className="text-accent/50" size={20} />
             </div>
             <div className="flex items-end gap-2">
               <span className="text-5xl font-bold text-white">{(metrics.injection_success_rate * 100).toFixed(1)}%</span>
             </div>
             <p className="text-xs text-gray-500 mt-4 leading-relaxed">Percentage of all cross-model attacks that achieved arbitrary exploitation objectives natively.</p>
          </div>

          <div className="glass p-6 rounded-2xl border-t-2 border-t-orange-500">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Latent Activation</h3>
               <Skull className="text-orange-500/50" size={20} />
             </div>
             <div className="flex items-end gap-2">
               <span className="text-5xl font-bold text-orange-400">{(metrics.latent_activation_rate * 100).toFixed(1)}%</span>
             </div>
             <p className="text-xs text-gray-500 mt-4 leading-relaxed">Rate at which dormant malicious tokens successfully activated from seemingly benign context buffers.</p>
          </div>

          <div className="glass p-6 rounded-2xl border-t-2 border-t-red-500">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Data Exfiltration</h3>
               <Database className="text-red-500/50" size={20} />
             </div>
             <div className="flex items-end gap-2">
               <span className="text-5xl font-bold text-red-500">{(metrics.data_exfiltration_rate * 100).toFixed(1)}%</span>
             </div>
             <p className="text-xs text-gray-500 mt-4 leading-relaxed">Percentage of attacks that successfully bypassed simulated egress filtration logic securely.</p>
          </div>
        </div>

        {/* Model Efficacy Leaderboard */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
             <Crosshair className="text-accent" /> Resilience Leaderboard
          </h2>
          <p className="text-gray-400 mt-2 mb-8">Isolated metrics and relative scoring per top-tier provider architecture.</p>
        </div>

        <div className="space-y-4">
          {models.map((model, index) => {
             const m = metrics_by_model[model];
             const isClean = m.injection_success_rate === 0;
             const scoreClass = isClean ? "text-green-400" : (m.injection_success_rate > 0.05 ? "text-red-400" : "text-orange-400");
             
             return (
               <motion.div 
                 key={model}
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: index * 0.1 }}
                 className="glass p-6 rounded-2xl flex flex-col md:flex-row items-center gap-8 border border-white/5 hover:border-white/10 transition-colors"
               >
                 <div className="flex items-center gap-4 w-full md:w-1/4 shrink-0">
                    <div className={`p-3 rounded-xl ${isClean ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                      {isClean ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
                    </div>
                    <div>
                      <h3 className="font-mono text-sm text-gray-300 font-bold truncate max-w-[200px]" title={model}>{model.split('/').pop()}</h3>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">{model.split('/')[0]}</p>
                    </div>
                 </div>

                 <div className="w-full md:flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Injection Success</p>
                      <p className={`text-xl font-bold ${scoreClass}`}>{(m.injection_success_rate * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Direct Inject</p>
                      <p className={`text-xl font-bold ${m.injection_success_rate > 0 ? "text-orange-400" : "text-gray-300"}`}>{(m.injection_success_rate * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Tool Abuse</p>
                      <p className={`text-xl font-bold ${m.toolchain_abuse_rate > 0 ? "text-red-400" : "text-gray-300"}`}>{(m.toolchain_abuse_rate * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Data Exfil.</p>
                      <p className={`text-xl font-bold ${m.data_exfiltration_rate > 0 ? "text-purple-400" : "text-gray-300"}`}>{(m.data_exfiltration_rate * 100).toFixed(1)}%</p>
                    </div>
                 </div>
               </motion.div>
             )
          })}
        </div>
      </motion.div>
    </Layout>
  );
}
