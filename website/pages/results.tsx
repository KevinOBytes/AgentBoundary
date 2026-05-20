import fs from "fs";
import path from "path";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { motion } from "framer-motion";
import { Activity, Shield, ShieldAlert, ShieldCheck, Database, Target, Skull, Cpu, Crosshair } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import type { ResultsFile, MetricSet } from "../types/results";

interface Props {
  data: ResultsFile | null;
  expectedModels: string[];
}

export async function getStaticProps(): Promise<{ props: Props }> {
  const filePath = path.join(process.cwd(), "..", "results", "model_results.json");
  let data = null;
  let expectedModels: string[] = [];

  try {
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
      data = {
        metadata: parsed.metadata,
        metrics: parsed.metrics,
        metrics_by_model: parsed.metrics_by_model,
        results: [],
      };
      expectedModels = parsed?.metadata?.models_requested ?? [];
    }
  } catch (e) {
    console.error("Failed to load model results", e);
  }
  return { props: { data, expectedModels } };
}

export default function ResultsPage({ data, expectedModels }: Props) {
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    setChartReady(true);
  }, []);

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
  
  const evaluatedModels = Object.keys(metrics_by_model);
  const allModels = Array.from(new Set([...expectedModels, ...evaluatedModels]));

  const models = allModels.sort((a, b) => {
    const mA = metrics_by_model[a];
    const mB = metrics_by_model[b];
    if (mA && mB) return mA.overall_vulnerability_score - mB.overall_vulnerability_score;
    if (mA) return -1;
    if (mB) return 1;
    return a.localeCompare(b);
  });

  const totalModelsCount = Math.max(metadata.models_requested?.length || 0, expectedModels.length);

  const modelProvider = (model: string) => metadata.model_providers?.[model] || (model.includes("/") ? model.split("/")[0] : "ollama-cloud");
  const modelCohort = (model: string) => metadata.model_cohorts?.[model];

  const chartData = models.map(model => {
    const m = metrics_by_model[model] || { overall_vulnerability_score: 0, unsafe_tool_proposal_rate: 0, secret_disclosure_rate: 0 };
    return {
      name: model.split('/').pop(),
      UnsafeSignal: Number((m.overall_vulnerability_score * 100).toFixed(1)),
      UnsafeTools: Number((m.unsafe_tool_proposal_rate * 100).toFixed(1)),
      Disclosure: Number((m.secret_disclosure_rate * 100).toFixed(1))
    };
  });
  const chartWidth = Math.max(960, chartData.length * 30);

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
              <p className="text-gray-400">Diagnostic telemetry from {metadata.attacks_total || 0} controlled scenarios across {totalModelsCount} evaluated models.</p>
            </div>
          </div>
        </div>

        {metadata.cohorts && metadata.cohorts.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {metadata.cohorts.map(cohort => (
              <div key={cohort.label} className="glass p-5 rounded-2xl border border-white/5">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">{cohort.provider}</div>
                <h3 className="text-white font-semibold mb-3">{cohort.label.replace(/-/g, " ")}</h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs uppercase">Models</div>
                    <div className="text-gray-200 font-mono">{cohort.models_requested.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase">Scored</div>
                    <div className="text-gray-200 font-mono">{cohort.scored_count}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase">Unsafe</div>
                    <div className="text-gray-200 font-mono">{(cohort.metrics.overall_vulnerability_score * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Global Aggregate Highlights */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
          <div className="glass p-6 rounded-2xl border-t-2 border-t-accent shadow-[0_0_30px_-10px_rgba(var(--accent-glow),0.3)]">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Overall Unsafe Signal</h3>
               <Target className="text-accent/50" size={20} />
             </div>
             <div className="flex items-end gap-2">
               <span className="text-5xl font-bold text-white">{(metrics.overall_vulnerability_score * 100).toFixed(1)}%</span>
             </div>
	             <p className="text-xs text-gray-500 mt-4 leading-relaxed">Share of scored evaluations with at least one unsafe behavior flag.</p>
          </div>

          <div className="glass p-6 rounded-2xl border-t-2 border-t-orange-500">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Unsafe Instruction</h3>
               <Skull className="text-orange-500/50" size={20} />
             </div>
             <div className="flex items-end gap-2">
               <span className="text-5xl font-bold text-orange-400">{(metrics.unsafe_instruction_adoption_rate * 100).toFixed(1)}%</span>
             </div>
             <p className="text-xs text-gray-500 mt-4 leading-relaxed">Rate at which the hardened heuristic marked unsafe instruction adoption.</p>
          </div>

          <div className="glass p-6 rounded-2xl border-t-2 border-t-red-500">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Secret Disclosure</h3>
               <Database className="text-red-500/50" size={20} />
             </div>
             <div className="flex items-end gap-2">
               <span className="text-5xl font-bold text-red-500">{(metrics.secret_disclosure_rate * 100).toFixed(1)}%</span>
             </div>
	             <p className="text-xs text-gray-500 mt-4 leading-relaxed">Share of scored evaluations marked as secret-disclosure signals.</p>
          </div>
        </div>

        {/* Global Chart Visualization */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
	             <Activity className="text-accent" /> Unsafe Signal Distribution
          </h2>
          <div className="glass p-6 rounded-2xl h-[400px] w-full border border-white/5 overflow-x-auto custom-scrollbar">
            {chartReady ? (
                <BarChart width={chartWidth} height={340} data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#888" tick={{fill: '#888', fontSize: 12}} />
                  <YAxis stroke="#888" tick={{fill: '#888'}} domain={[0, 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#ccc' }}
                    formatter={(value: any) => [`${value}%`]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
	                  <Bar dataKey="UnsafeSignal" name="Overall Unsafe Signal" fill="#fb923c" radius={[4, 4, 0, 0]} />
	                  <Bar dataKey="UnsafeTools" name="Unsafe Tool Proposal" fill="#f87171" radius={[4, 4, 0, 0]} />
	                  <Bar dataKey="Disclosure" name="Secret Disclosure Signal" fill="#c084fc" radius={[4, 4, 0, 0]} />
                </BarChart>
            ) : (
              <div className="h-full w-full" />
            )}
          </div>
        </div>

        {/* Model-level signal summary */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
             <Crosshair className="text-accent" /> Model-Level Signal Summary
          </h2>
	             <p className="text-gray-400 mt-2 mb-8">Per-model metrics from one representative agent architecture and heuristic scoring.</p>
        </div>

        <div className="space-y-4">
          {models.map((model, index) => {
             const m = metrics_by_model[model];
             if (!m) {
               return (
                 <div key={model} className="glass p-5 rounded-xl border-l-4 border-l-gray-600 opacity-60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div className="flex items-center gap-4">
                     <div className="text-gray-500 font-bold opacity-50 w-6">#{index + 1}</div>
                     <div>
                       <h3 className="font-mono text-sm text-gray-400 font-bold">{model}</h3>
                       <div className="flex items-center gap-2 mt-1">
                         <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Evaluation Pending</span>
                       </div>
                     </div>
                   </div>
                 </div>
               );
             }

             const isClean = m.overall_vulnerability_score === 0;
             const scoreClass = isClean ? "text-green-400" : (m.overall_vulnerability_score > 0.05 ? "text-red-400" : "text-orange-400");
             
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
	                      <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">{modelProvider(model)}</p>
                        {modelCohort(model) && <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">{modelCohort(model)?.replace(/-/g, " ")}</p>}
                    </div>
                 </div>

                 <div className="w-full md:flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
	                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Unsafe Signal</p>
                      <p className={`text-xl font-bold ${scoreClass}`}>{(m.overall_vulnerability_score * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Unsafe Instruct</p>
                      <p className={`text-xl font-bold ${m.unsafe_instruction_adoption_rate > 0 ? "text-orange-400" : "text-gray-300"}`}>{(m.unsafe_instruction_adoption_rate * 100).toFixed(1)}%</p>
                    </div>
                    <div>
	                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Unsafe Tools</p>
                      <p className={`text-xl font-bold ${m.unsafe_tool_proposal_rate > 0 ? "text-red-400" : "text-gray-300"}`}>{(m.unsafe_tool_proposal_rate * 100).toFixed(1)}%</p>
                    </div>
                    <div>
	                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Disclosure</p>
                      <p className={`text-xl font-bold ${m.secret_disclosure_rate > 0 ? "text-purple-400" : "text-gray-300"}`}>{(m.secret_disclosure_rate * 100).toFixed(1)}%</p>
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
