import fs from "fs";
import path from "path";
import Layout from "../components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Activity, X, Filter, ShieldAlert, ChevronRight, ChevronDown } from "lucide-react";
import React, { useState } from "react";

interface ModelMetrics {
  total: number;
  refusal_rate: number;
  unsafe_instruction_adoption_rate: number;
  unsafe_tool_proposal_rate: number;
  secret_disclosure_rate: number;
  tool_policy_block_rate?: number;
  policy_violation_rate: number;
  overall_vulnerability_score: number;
}

interface AttackResult {
  attack_id: string;
  campaign_id: string;
  model: string;
  provider?: string;
  cohort_label?: string;
  status?: string;
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
}

interface HarnessOutput {
  metadata: { 
    benchmark_version: string;
    run_timestamp: string;
    dry_run: boolean;
    provider?: string;
    providers?: string[];
    models_requested: string[]; 
    model_providers?: Record<string, string>;
    model_cohorts?: Record<string, string>;
    result_grain?: string;
    attacks_total: number;
    scored_count: number;
    timeout_count: number;
    error_count: number;
    public_artifact_redacted?: boolean;
    redacted_fields?: string[];
    redaction_policy?: string;
  };
  metrics: ModelMetrics;
  metrics_by_model: Record<string, ModelMetrics>;
  results: AttackResult[];
}

interface Props {
  data: HarnessOutput | null;
  expectedModels: string[];
}

export async function getStaticProps(): Promise<{ props: Props }> {
  const filePath = path.join(process.cwd(), "..", "results", "model_results.json");
  let data = null;
  let expectedModels: string[] = [];

  try {
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (parsed?.metadata?.public_artifact_redacted && Array.isArray(parsed.results)) {
        parsed.results = parsed.results.map(({ prompt, output, ...row }: AttackResult) => row);
      }
      data = parsed;
      expectedModels = parsed?.metadata?.models_requested ?? [];
    }
  } catch (e) {
    console.error("Failed to load model results", e);
  }
  return { props: { data, expectedModels } };
}

function shortDigest(value?: string) {
  return value ? `${value.slice(0, 12)}...` : "unavailable";
}

function traceText(value?: string) {
  return value ?? "";
}

function TraceDigest({ label, hash, chars }: { label: string; hash?: string; chars?: number }) {
  return (
    <div className="bg-[#0f0f0f] p-4 rounded-xl font-mono text-xs text-gray-300 border border-white/5 shadow-inner">
      <div className="text-[10px] uppercase text-gray-500 mb-2 font-bold tracking-widest">{label}</div>
      <div className="flex flex-col gap-1">
        <span>sha256: <span className="text-accent">{shortDigest(hash)}</span></span>
        <span>chars: <span className="text-gray-200">{chars ?? "unknown"}</span></span>
      </div>
    </div>
  );
}

export default function DatasetPage({ data, expectedModels }: Props) {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedAttacks, setSelectedAttacks] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeModalModel, setActiveModalModel] = useState<string | null>(null);

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
  const publicArtifactRedacted = Boolean(metadata.public_artifact_redacted);
  
  // Create a combined list of expected models from run metadata and any models in the results
  const evaluatedModels = Object.keys(metrics_by_model);
  const allModels = Array.from(new Set([...expectedModels, ...evaluatedModels]));
  
  // Sort evaluated models first by unsafe-signal rate, then pending models.
  const models = allModels.sort((a, b) => {
    const mA = metrics_by_model[a];
    const mB = metrics_by_model[b];
    if (mA && mB) return mA.overall_vulnerability_score - mB.overall_vulnerability_score;
    if (mA) return -1;
    if (mB) return 1;
    return a.localeCompare(b);
  });
  
  const uniqueAttacks = Array.from(new Set(results.map(r => r.attack_id))).sort();

  const modelProvider = (model: string) => metadata.model_providers?.[model] || (model.includes("/") ? model.split("/")[0] : "ollama-cloud");
  const modelCohort = (model: string) => metadata.model_cohorts?.[model];

  // Derived providers & categories
  const providers = Array.from(new Set(models.map(modelProvider))).sort();
  
  const getAttackCategory = (id: string) => {
    const parts = id.split('_');
    if (parts.length > 1 && !isNaN(parseInt(parts[parts.length-1]))) {
      return parts.slice(0, -1).join('_');
    }
    return id;
  };
  const attackCategories = Array.from(new Set(uniqueAttacks.map(getAttackCategory)));

  // Toggle helpers
  const toggleModel = (m: string) => setSelectedModels(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  const toggleAttack = (a: string) => setSelectedAttacks(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  
  const selectProvider = (p: string) => {
     const pModels = models.filter(m => modelProvider(m) === p);
     setSelectedModels(prev => Array.from(new Set([...prev, ...pModels])));
  };
  const unselectProvider = (p: string) => {
     const pModels = models.filter(m => modelProvider(m) === p);
     setSelectedModels(prev => prev.filter(m => !pModels.includes(m)));
  };

  const selectCategory = (cat: string) => {
    const catAttacks = uniqueAttacks.filter(a => getAttackCategory(a) === cat);
    setSelectedAttacks(prev => Array.from(new Set([...prev, ...catAttacks])));
  }
  const unselectCategory = (cat: string) => {
    const catAttacks = uniqueAttacks.filter(a => getAttackCategory(a) === cat);
    setSelectedAttacks(prev => prev.filter(a => !catAttacks.includes(a)));
  }

  const toggleRow = (key: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredResults = results.filter(res => {
    const matchModel = selectedModels.length === 0 || selectedModels.includes(res.model);
    const matchAttack = selectedAttacks.length === 0 || selectedAttacks.includes(res.attack_id);
    return matchModel && matchAttack;
  }).sort((a, b) => {
    if (a.flags.unsafe_instruction_adopted && !b.flags.unsafe_instruction_adopted) return -1;
    if (!a.flags.unsafe_instruction_adopted && b.flags.unsafe_instruction_adopted) return 1;
    return 0;
  });

  const getUnsafeSignals = (modelId: string) => {
    return results.filter(r => r.model === modelId && hasUnsafeSignal(r));
  };

  const hasUnsafeSignal = (res: AttackResult) => Boolean(
    res.flags.unsafe_instruction_adopted ||
    res.flags.unsafe_tool_call_proposed ||
    res.flags.secret_disclosure_claimed ||
    res.flags.policy_violation
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
            <p className="mt-2 text-gray-400">Comparing evaluated models against {metadata.attacks_total} controlled scenarios. Ran at {metadata.run_timestamp}.</p>
          </div>
        </div>

        {/* Aggregate Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {models.map((model) => {
            const m = metrics_by_model[model];
            if (!m) {
              return (
                <div key={model} className="glass p-6 rounded-2xl border-t-2 border-t-gray-600 opacity-60 flex flex-col justify-center items-center h-full min-h-[160px]">
                  <Activity className="text-gray-500 animate-pulse mb-3" size={24} />
                  <h3 className="font-mono text-sm text-gray-400 mb-2 truncate max-w-full">{model.split('/').pop()}</h3>
                  <span className="text-xs text-gray-500 font-semibold tracking-wider uppercase">Evaluating...</span>
                </div>
              );
            }

            const score = (m.overall_vulnerability_score * 100).toFixed(1);
	            const hasModelUnsafeSignal = m.overall_vulnerability_score > 0;
	            const unsafeSignalCount = getUnsafeSignals(model).length;
            
            return (
              <motion.div 
                key={model}
                whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(var(--accent-glow), 0.3)" }}
                onClick={() => setActiveModalModel(model)}
                className={`glass p-6 rounded-2xl border-t-2 cursor-pointer ${hasModelUnsafeSignal ? 'border-t-orange-500 hover:border-orange-400' : 'border-t-green-500 hover:border-green-400'}`}
              >
	                <h3 className="font-mono text-sm text-gray-400 truncate mb-1">{model.split('/').pop()}</h3>
                  <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-3">
                    {modelProvider(model)}{modelCohort(model) ? ` / ${modelCohort(model)?.replace(/-/g, " ")}` : ""}
                  </div>
	                <div className="flex items-end gap-2 mb-4">
	                  <span className="text-4xl font-bold text-white">{score}%</span>
	                  <span className="text-sm text-gray-500 mb-1">Unsafe Signal</span>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Unsafe Instruction</span>
                    <span className={m.unsafe_instruction_adoption_rate > 0 ? "text-orange-400" : "text-gray-300"}>
                      {(m.unsafe_instruction_adoption_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
	                    <span className="text-gray-500">Secret Disclosure</span>
                    <span className={m.secret_disclosure_rate > 0 ? "text-red-400" : "text-gray-300"}>
                      {(m.secret_disclosure_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                {unsafeSignalCount > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/5 text-center text-accent text-xs font-semibold">
	                    View {unsafeSignalCount} Signal{unsafeSignalCount !== 1 && 's'} &rarr;
                  </div>
                )}
                {unsafeSignalCount === 0 && (
                  <div className="mt-4 pt-3 border-t border-white/5 text-center text-green-500 text-xs font-semibold opacity-50">
	                    No Unsafe Signal
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
	          <h2 className="text-2xl font-bold text-white">Evaluation Records</h2>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="flex items-center text-gray-400 px-2">
              <Filter size={16} className="mr-2" />
              <span className="text-sm font-semibold uppercase tracking-wider">Filters</span>
            </div>
            
            <details className="relative group">
              <summary className="bg-black border border-white/10 text-white hover:border-white/20 transition-colors text-sm rounded-lg p-2 cursor-pointer list-none flex items-center justify-between min-w-[150px]">
                {selectedModels.length === 0 ? "All Models" : `${selectedModels.length} Models Selected`}
                <ChevronDown size={14} className="ml-2 opacity-50" />
              </summary>
              <div className="absolute top-full left-0 mt-2 w-64 bg-[#0f0f0f] border border-white/10 rounded-xl p-3 z-50 shadow-2xl space-y-4 max-h-[400px] overflow-auto custom-scrollbar">
                {providers.map(p => {
                   const pModels = models.filter(m => m.startsWith(p + '/'));
                   const allSelected = pModels.every(m => selectedModels.includes(m));
                   return (
                     <div key={p}>
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{p}</span>
                         <button onClick={() => allSelected ? unselectProvider(p) : selectProvider(p)} className="text-[10px] text-accent font-semibold uppercase">
                           {allSelected ? 'Deselect All' : 'Select All'}
                         </button>
                       </div>
                       {pModels.map(m => (
                         <label key={m} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white cursor-pointer mb-1.5 ml-1">
                           <input type="checkbox" checked={selectedModels.includes(m)} onChange={() => toggleModel(m)} className="accent-accent" />
                           <span className="truncate">{m.split('/').pop()}</span>
                         </label>
                       ))}
                     </div>
                   )
                })}
              </div>
            </details>

            <details className="relative group">
              <summary className="bg-black border border-white/10 text-white hover:border-white/20 transition-colors text-sm rounded-lg p-2 cursor-pointer list-none flex items-center justify-between min-w-[150px]">
                {selectedAttacks.length === 0 ? "All Attacks" : `${selectedAttacks.length} Attacks Selected`}
                <ChevronDown size={14} className="ml-2 opacity-50" />
              </summary>
              <div className="absolute top-full right-0 mt-2 w-max max-w-[800px] min-w-[400px] bg-[#0f0f0f] border border-white/10 rounded-xl p-4 z-50 shadow-2xl max-h-[500px] overflow-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                {attackCategories.map(cat => {
                   const catAttacks = uniqueAttacks.filter(a => getAttackCategory(a) === cat);
                   const allSelected = catAttacks.every(a => selectedAttacks.includes(a));
                   return (
                     <div key={cat}>
                       <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-1">
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-widest truncate max-w-[200px]" title={cat.replace(/_/g, ' ')}>{cat.replace(/_/g, ' ')}</span>
                         <button onClick={() => allSelected ? unselectCategory(cat) : selectCategory(cat)} className="text-[10px] text-accent font-semibold uppercase ml-2 whitespace-nowrap">
                           {allSelected ? 'Deselect' : 'Select'}
                         </button>
                       </div>
                       <div className="space-y-1.5 ml-1">
                         {catAttacks.map(a => (
                           <label key={a} className="flex flex-wrap items-start gap-2 text-sm text-gray-300 hover:text-white cursor-pointer" title={a}>
                             <input type="checkbox" checked={selectedAttacks.includes(a)} onChange={() => toggleAttack(a)} className="accent-accent flex-shrink-0 mt-1" />
                             <span className="text-[11px] font-mono leading-tight break-all flex-1">{a.split('_').pop()}</span>
                           </label>
                         ))}
                       </div>
                     </div>
                   )
                })}
              </div>
            </details>

            {(selectedModels.length > 0 || selectedAttacks.length > 0) && (
              <button 
                onClick={() => { setSelectedModels([]); setSelectedAttacks([]); }}
                className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 flex items-center gap-1 font-semibold uppercase"
              >
                <X size={14} /> Clear All
              </button>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-gray-400 relative">
              <thead className="bg-[#0a0a0a] text-xs uppercase text-gray-300 sticky top-0 z-10 shadow-md">
                <tr>
                  <th className="px-6 py-4 font-medium border-b border-white/5 w-1/4">Model</th>
                  <th className="px-6 py-4 font-medium border-b border-white/5 w-1/4">Attack ID</th>
	                  <th className="px-6 py-4 font-medium text-center border-b border-white/5 w-1/12">Unsafe Signal</th>
                  <th className="px-6 py-4 font-medium border-b border-white/5">Trace Availability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredResults.map((res, i) => {
                  const key = `${res.model}-${res.attack_id}-${i}`;
                  const isExpanded = expandedRows.has(key);
                  return (
                    <React.Fragment key={key}>
                      <tr onClick={() => toggleRow(key)} className="hover:bg-white/5 transition-colors group cursor-pointer">
                        <td className="px-6 py-4 font-mono text-xs whitespace-nowrap flex items-center gap-2">
                          <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </span>
	                          <span>{res.model.split('/').pop()}</span>
                            <span className="text-[10px] text-gray-600 uppercase tracking-widest">{res.provider || modelProvider(res.model)}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-accent text-xs whitespace-nowrap">{res.attack_id}</td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
	                          <span className={`px-2 py-1 rounded text-xs font-semibold ${hasUnsafeSignal(res) ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/50' : 'bg-green-500/20 text-green-300 ring-1 ring-green-500/30'}`}>
	                            {hasUnsafeSignal(res) ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td className="px-6 py-4 truncate max-w-sm font-mono text-[11px] opacity-80 group-hover:opacity-100 transition-opacity" title={res.trace_redacted ? "Raw trace redacted from public artifact" : traceText(res.output)}>
                          {res.trace_redacted
                            ? `redacted; output ${shortDigest(res.output_sha256)}`
                            : `${traceText(res.output).substring(0, 80)}${traceText(res.output).length > 80 ? '...' : ''}`}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-black/40 shadow-inner">
                          <td colSpan={4} className="px-8 py-6 border-b border-white/5">
                            {res.trace_redacted ? (
                              <div>
                                <div className="mb-4 rounded-xl border border-accent/20 bg-accent/10 p-4 text-sm text-gray-300">
	                                  Raw request and response traces are withheld from the public artifact. Metrics, flags, evaluation counts, character counts, and digests are retained for verification. Public attack prompts remain available in the attack catalog.
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <TraceDigest label="Prompt Digest" hash={res.prompt_sha256} chars={res.prompt_chars} />
                                  <TraceDigest label="Output Digest" hash={res.output_sha256} chars={res.output_chars} />
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="text-[10px] uppercase text-gray-500 mb-2 font-bold tracking-widest flex items-center justify-between">
                                    <span>Request Body / Prompt</span>
                                  </h4>
                                  <div className="bg-[#0f0f0f] p-4 rounded-xl font-mono text-xs text-blue-300/90 border border-white/5 whitespace-pre-wrap max-h-[300px] overflow-auto custom-scrollbar shadow-inner">
                                    {traceText(res.prompt)}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-[10px] uppercase text-gray-500 mb-2 font-bold tracking-widest flex items-center justify-between">
                                    <span>Model Output Payload</span>
	                                    {hasUnsafeSignal(res) && <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded">Unsafe Signal</span>}
                                  </h4>
	                                  <div className={`bg-[#0f0f0f] p-4 rounded-xl font-mono text-xs border whitespace-pre-wrap max-h-[300px] overflow-auto custom-scrollbar shadow-inner ${hasUnsafeSignal(res) ? 'border-red-500/20 text-red-300/90' : 'border-white/5 text-orange-300/90'}`}>
                                    {traceText(res.output)}
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {filteredResults.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No trace logs match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-black/60 text-center text-sm text-gray-500 border-t border-white/5">
	            Showing {filteredResults.length} of {results.length} total evaluations.
          </div>
        </div>
        {publicArtifactRedacted && (
          <div className="mt-4 text-center text-xs text-gray-500">
            Public artifact redaction is active; raw request and response traces are not rendered.
          </div>
        )}
      </motion.div>

      {/* Model Detail Modal */}
      <AnimatePresence>
        {activeModalModel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setActiveModalModel(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative glass w-full max-w-4xl max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-start bg-black/40">
                <div>
                  <h2 className="text-2xl font-bold text-white font-mono">{activeModalModel.split('/').pop()}</h2>
                  <p className="text-gray-400 mt-1">
	                    {getUnsafeSignals(activeModalModel).length} Unsafe Signal{getUnsafeSignals(activeModalModel).length !== 1 && "s"} Logged
                  </p>
                </div>
                <button 
                  onClick={() => setActiveModalModel(null)}
                  className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar">
                {getUnsafeSignals(activeModalModel).length > 0 ? (
                  <div className="space-y-6">
                    {getUnsafeSignals(activeModalModel).map((res, i) => (
                      <div key={i} className="bg-black/50 border border-white/5 rounded-xl p-5 shadow-inner">
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-mono text-accent text-sm font-bold bg-accent/10 px-3 py-1 rounded-md">{res.attack_id}</span>
	                          <span className="text-xs text-red-400 font-bold uppercase tracking-wide border border-red-500/30 bg-red-500/10 px-2 py-1 rounded">Unsafe Signal</span>
                        </div>
                        <div className="mb-4">
	                          <h4 className="text-[10px] uppercase text-gray-500 mb-2 font-bold tracking-widest">Request Trace</h4>
                          {res.trace_redacted ? (
                            <TraceDigest label="Prompt Digest" hash={res.prompt_sha256} chars={res.prompt_chars} />
                          ) : (
                            <div className="bg-[#0f0f0f] p-4 rounded-xl font-mono text-xs text-blue-300 border border-white/5 whitespace-pre-wrap max-h-64 overflow-auto custom-scrollbar">
                              {traceText(res.prompt)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-[10px] uppercase text-gray-500 mb-2 font-bold tracking-widest">Model Output</h4>
                          {res.trace_redacted ? (
                            <TraceDigest label="Output Digest" hash={res.output_sha256} chars={res.output_chars} />
                          ) : (
                            <div className="bg-[#0f0f0f] p-4 rounded-xl font-mono text-xs text-red-300 border border-red-500/20 whitespace-pre-wrap max-h-64 overflow-auto custom-scrollbar relative">
                              {traceText(res.output)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 border border-green-500/20">
                      <ShieldAlert className="text-green-500" size={32} />
                    </div>
	                    <h3 className="text-xl font-bold text-white mb-2">No Unsafe Signals</h3>
	                    <p className="text-gray-400 max-w-sm">No unsafe behavior signals were recorded for this model across the evaluated scenarios.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
