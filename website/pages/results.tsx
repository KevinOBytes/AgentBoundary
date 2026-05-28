import fs from "fs";
import path from "path";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { motion } from "framer-motion";
import { Activity, Shield, ShieldAlert, ShieldCheck, Target, BarChart3, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ModelResult {
  model: string;
  evaluations: number;
  safe_count: number;
  safe_pct: number;
  compliant_count: number;
  compliant_pct: number;
  neutral_count: number;
  neutral_pct: number;
  ambiguous_count: number;
  ambiguous_pct: number;
  error_count: number;
  error_pct: number;
  mean_latency_ms: number;
  max_latency_ms: number;
}

interface Dashboard {
  metadata: {
    benchmark_version: string;
    run_label: string;
    run_timestamp: string;
    catalog_entries: number;
    models_tested: number;
    total_evaluations: number;
    temperature: number;
    judge_model: string;
  };
  severity_distribution: Record<string, number>;
  model_ranking: ModelResult[];
  most_vulnerable_entries: Array<{
    attack_id: string;
    clear_compliance: number;
    total_models: number;
    compliant_models: string[];
  }>;
  family_compliance: Array<{
    family: string;
    evaluations: number;
    compliant_count: number;
    compliance_rate: number;
  }>;
}

interface Props {
  data: Dashboard | null;
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
          <p className="text-gray-400">Run the evaluation harness to generate metrics.</p>
        </div>
      </Layout>
    );
  }

  const { metadata, severity_distribution, model_ranking, family_compliance, most_vulnerable_entries } = data;

  const complianceChartData = model_ranking.map(m => ({
    name: m.model.split('/').pop() || m.model,
    Compliance: m.compliant_pct,
    Safe: m.safe_pct,
    Neutral: m.neutral_pct,
    Ambiguous: m.ambiguous_pct,
  }));

  const familyChartData = family_compliance.map(f => ({
    name: f.family.replace(/_/g, ' '),
    rate: f.compliance_rate,
  }));

  const totalSafe = model_ranking.reduce((s, m) => s + m.safe_count, 0);
  const totalCompliant = model_ranking.reduce((s, m) => s + m.compliant_count, 0);
  const totalNeutral = model_ranking.reduce((s, m) => s + m.neutral_count, 0);
  const totalAmbiguous = model_ranking.reduce((s, m) => s + m.ambiguous_count, 0);

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
              <h1 className="text-4xl font-bold tracking-tight text-white mb-2">v2.2 Empirical Results</h1>
              <p className="text-gray-400">
                {metadata.total_evaluations} evaluations at temp={metadata.temperature} across {metadata.models_tested} models.
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase tracking-widest">Version</div>
            <div className="text-accent font-mono font-bold">{metadata.benchmark_version}</div>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
          <div className="glass p-6 rounded-2xl border-t-2 border-t-green-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Safe (Refused)</h3>
              <ShieldCheck className="text-green-500/50" size={20} />
            </div>
            <div className="text-5xl font-bold text-white">{((totalSafe / metadata.total_evaluations) * 100).toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-2">{totalSafe} / {metadata.total_evaluations} evaluations</p>
          </div>

          <div className="glass p-6 rounded-2xl border-t-2 border-t-red-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Complied</h3>
              <ShieldAlert className="text-red-500/50" size={20} />
            </div>
            <div className="text-5xl font-bold text-red-400">{((totalCompliant / metadata.total_evaluations) * 100).toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-2">{totalCompliant} / {metadata.total_evaluations} evaluations</p>
          </div>

          <div className="glass p-6 rounded-2xl border-t-2 border-t-orange-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Neutral</h3>
              <Target className="text-orange-500/50" size={20} />
            </div>
            <div className="text-5xl font-bold text-orange-400">{((totalNeutral / metadata.total_evaluations) * 100).toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-2">{totalNeutral} / {metadata.total_evaluations} evaluations</p>
          </div>

          <div className="glass p-6 rounded-2xl border-t-2 border-t-purple-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Ambiguous</h3>
              <AlertTriangle className="text-purple-500/50" size={20} />
            </div>
            <div className="text-5xl font-bold text-purple-400">{((totalAmbiguous / metadata.total_evaluations) * 100).toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-2">{totalAmbiguous} / {metadata.total_evaluations} evaluations</p>
          </div>
        </div>

        {/* Model Ranking Chart */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <BarChart3 className="text-accent" /> Model Vulnerability Ranking
          </h2>
          <div className="glass p-6 rounded-2xl h-[400px] border border-white/5">
            {chartReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceChartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#888" tick={{ fill: '#888', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#888" tick={{ fill: '#888' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#ccc' }}
                    formatter={(value: any, name: string) => [`${value}%`, name]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="Safe" stackId="a" fill="#2ecc71" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Compliant" stackId="a" fill="#e74c3c" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Neutral" stackId="a" fill="#f39c12" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Ambiguous" stackId="a" fill="#9b59b6" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full" />
            )}
          </div>
        </div>

        {/* Family Compliance */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <Target className="text-accent" /> Compliance by Attack Family
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {family_compliance.map(fam => (
              <div key={fam.family} className="glass p-5 rounded-2xl border border-white/5">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">{fam.family.replace(/_/g, ' ')}</div>
                <div className="text-3xl font-bold text-white mb-1">{fam.compliance_rate}%</div>
                <div className="text-xs text-gray-500">{fam.compliant_count} / {fam.evaluations} compliant</div>
                <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${fam.compliance_rate}%`,
                      backgroundColor: fam.compliance_rate > 10 ? '#e74c3c' : fam.compliance_rate > 5 ? '#f39c12' : '#2ecc71'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Vulnerable Entries */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <AlertTriangle className="text-accent" /> Most Vulnerable Entries
          </h2>
          <div className="space-y-3">
            {most_vulnerable_entries.slice(0, 10).map((entry, i) => (
              <motion.div
                key={entry.attack_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass p-4 rounded-xl flex items-center gap-4 border border-white/5"
              >
                <div className="text-gray-500 font-mono text-sm w-8">#{i + 1}</div>
                <div className="flex-1">
                  <div className="font-mono text-sm text-white">{entry.attack_id}</div>
                  <div className="text-xs text-gray-500">
                    {entry.clear_compliance}/{entry.total_models} models complied
                  </div>
                </div>
                <div className="flex gap-1">
                  {entry.compliant_models.map(m => (
                    <span key={m} className="text-[10px] bg-red-500/20 text-red-300 px-2 py-1 rounded font-mono">
                      {m.split('/').pop()}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <Shield className="text-accent" /> Severity Distribution
          </h2>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Low', count: severity_distribution.low, color: 'bg-green-500' },
              { label: 'Medium', count: severity_distribution.medium, color: 'bg-yellow-500' },
              { label: 'High', count: severity_distribution.high, color: 'bg-red-500' },
              { label: 'Critical', count: severity_distribution.critical, color: 'bg-purple-500' },
            ].map(sev => (
              <div key={sev.label} className="glass p-6 rounded-2xl text-center border border-white/5">
                <div className={`text-4xl font-bold text-white mb-2 ${sev.color.replace('bg-', 'text-')}`}>{sev.count}</div>
                <div className="text-sm text-gray-400">{sev.label}</div>
                <div className="text-xs text-gray-600 mt-1">{((sev.count / metadata.catalog_entries) * 100).toFixed(0)}% of catalog</div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-model Table */}
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <Shield className="text-accent" /> Per-Model Breakdown
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-white/10">
                  <th className="pb-3 pr-4">Model</th>
                  <th className="pb-3 pr-4 text-right">Safe %</th>
                  <th className="pb-3 pr-4 text-right">Compliant %</th>
                  <th className="pb-3 pr-4 text-right">Neutral %</th>
                  <th className="pb-3 pr-4 text-right">Ambiguous %</th>
                  <th className="pb-3 pr-4 text-right">Mean Latency</th>
                </tr>
              </thead>
              <tbody>
                {model_ranking.map((m, i) => (
                  <tr key={m.model} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 pr-4 font-mono text-gray-300">{m.model.split('/').pop()}</td>
                    <td className="py-3 pr-4 text-right text-green-400">{m.safe_pct}%</td>
                    <td className="py-3 pr-4 text-right text-red-400 font-bold">{m.compliant_pct}%</td>
                    <td className="py-3 pr-4 text-right text-orange-400">{m.neutral_pct}%</td>
                    <td className="py-3 pr-4 text-right text-purple-400">{m.ambiguous_pct}%</td>
                    <td className="py-3 pr-4 text-right text-gray-500">{(m.mean_latency_ms / 1000).toFixed(1)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
