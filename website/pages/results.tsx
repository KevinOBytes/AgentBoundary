import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import { motion } from "framer-motion";
import { Activity, Shield, ShieldAlert, Target, BarChart3, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { interval, percent, sourceUrl } from "../lib/results";
import { loadReconciledStats } from "../lib/load-results";
import type { FrequencyBand, ReconciledStats } from "../types/results";

interface Props { data: ReconciledStats }

export async function getStaticProps(): Promise<{ props: Props }> {
  return { props: { data: loadReconciledStats() } };
}

export default function ResultsPage({ data }: Props) {
  const [chartReady, setChartReady] = useState(false);
  useEffect(() => { setChartReady(true); }, []);
  const { metadata, coverage, overall, by_model, by_family, by_scenario, frequency_bands } = data;
  const models = [...by_model].sort((a, b) => a.model.localeCompare(b.model));
  const chartData = models.map(model => ({
    name: model.model.split("/").pop() || model.model,
    Compliance: ((model.complied - model.overlap) / model.n) * 100,
    Refusal: ((model.refused - model.overlap) / model.n) * 100,
    Neither: (model.neutral / model.n) * 100,
    Both: (model.overlap / model.n) * 100,
  }));
  const compliantScenarios = by_scenario.filter(row => row.complied > 0).sort((a, b) => b.compliance_rate - a.compliance_rate || a.attack_id.localeCompare(b.attack_id));
  const bands: FrequencyBand[] = ["low", "medium", "high", "critical", "unknown"];

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-xl"><Activity className="text-accent" size={32} /></div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Reconciled Evaluation Results</h1>
            <p className="text-gray-400">{metadata.model_count} model endpoints, {metadata.catalog_scenarios} scenarios, and {overall.n} scorable responses.</p>
          </div>
        </div>
        <p className="mb-4 text-gray-300 leading-relaxed">
          {coverage.recorded_evaluations} records are present out of {coverage.expected_evaluations} planned model-scenario evaluations.
          {" "}{coverage.excluded_evaluations} empty response is excluded from scoring; {coverage.missing_evaluations} evaluations are absent.
          Rates below use nonempty responses and the reconciled automated labels. They do not establish general model safety.
        </p>
        <p className="mb-10 text-sm text-gray-400">
          Judge: {metadata.judge}. The retained correction pass covers {metadata.correction_rows} rows and changes {metadata.changed_compliance_labels} compliance labels.
          {" "}<Link href="/dataset" className="text-accent hover:underline">Inspect coverage and review flags</Link>.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
          <div className="glass p-6 rounded-2xl border-t-2 border-t-green-500">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Refusal flag</h2>
            <div className="text-5xl font-bold text-white">{percent(overall.refusal_rate)}</div>
            <p className="text-xs text-gray-400 mt-2">{overall.refused} / {overall.n} responses</p>
            <p className="text-xs text-gray-400 mt-2">95% Wilson CI: {interval(overall.refusal_ci_low, overall.refusal_ci_high)}</p>
          </div>
          <div className="glass p-6 rounded-2xl border-t-2 border-t-red-500">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Compliance flag</h2>
            <div className="text-5xl font-bold text-red-400">{percent(overall.compliance_rate)}</div>
            <p className="text-xs text-gray-400 mt-2">{overall.complied} / {overall.n} responses</p>
            <p className="text-xs text-gray-400 mt-2">95% Wilson CI: {interval(overall.compliance_ci_low, overall.compliance_ci_high)}</p>
          </div>
          <div className="glass p-6 rounded-2xl border-t-2 border-t-orange-500">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Neither flag</h2>
            <div className="text-5xl font-bold text-orange-400">{percent(overall.neutral / overall.n)}</div>
            <p className="text-xs text-gray-400 mt-2">{overall.neutral} / {overall.n} responses</p>
            <p className="text-xs text-gray-400 mt-2">Neither refusal nor compliance was flagged.</p>
          </div>
          <div className="glass p-6 rounded-2xl border-t-2 border-t-purple-500">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Scorable coverage</h2>
            <div className="text-5xl font-bold text-purple-400">{percent(coverage.scorable_evaluations / coverage.expected_evaluations)}</div>
            <p className="text-xs text-gray-400 mt-2">{coverage.scorable_evaluations} / {coverage.expected_evaluations} planned evaluations</p>
            <p className="text-xs text-gray-400 mt-2">{coverage.excluded_evaluations} excluded; {coverage.missing_evaluations} absent</p>
          </div>
        </div>
        {overall.overlap > 0 && <p className="mb-8 text-sm text-gray-300">Both flags are present on {overall.overlap} responses. The chart shows these separately.</p>}

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-3"><BarChart3 className="text-accent" /> Model Output Labels</h2>
          <p className="text-sm text-gray-400 mb-6">Alphabetical endpoint order. These are automated classifications of this fixed prompt collection, not a safety ranking.</p>
          <div className="glass p-6 rounded-2xl h-[400px] border border-white/5">
            {chartReady && <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" tick={{ fill: "#888", fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#888" domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} formatter={(value, name) => [`${Number(value).toFixed(1)}%`, String(name || "")]} />
                <Legend wrapperStyle={{ paddingTop: "10px" }} />
                <Bar dataKey="Compliance" name="Compliance only" stackId="a" fill="#e74c3c" />
                <Bar dataKey="Refusal" name="Refusal only" stackId="a" fill="#2ecc71" />
                <Bar dataKey="Neither" name="Neither flag" stackId="a" fill="#f39c12" />
                {overall.overlap > 0 && <Bar dataKey="Both" name="Both flags" stackId="a" fill="#9b59b6" />}
              </BarChart>
            </ResponsiveContainer>}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6"><Target className="text-accent" /> Compliance by Attack Family</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {by_family.map(family => <div key={family.family} className="glass p-5 rounded-2xl border border-white/5">
              <h3 className="text-xs text-gray-400 uppercase tracking-widest mb-2">{family.family.replace(/_/g, " ")}</h3>
              <div className="text-3xl font-bold text-white mb-1">{percent(family.compliance_rate)}</div>
              <div className="text-xs text-gray-400">{family.complied} / {family.n} scorable responses</div>
              <div className="text-xs text-gray-400 mt-2">95% CI: {interval(family.compliance_ci_low, family.compliance_ci_high)}</div>
              <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full rounded-full bg-accent" style={{ width: percent(family.compliance_rate) }} /></div>
            </div>)}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6"><ShieldAlert className="text-accent" /> Scenarios with Compliance Flags</h2>
          <div className="space-y-3">
            {compliantScenarios.map(scenario => <div key={scenario.attack_id} className="glass p-4 rounded-xl border border-white/5">
              <h3 className="font-mono text-sm text-white">{scenario.attack_id}</h3>
              <p className="text-sm text-gray-400 mt-1">{scenario.complied} / {scenario.n} scorable responses; {percent(scenario.compliance_rate)} compliance (95% CI: {interval(scenario.compliance_ci_low, scenario.compliance_ci_high)})</p>
            </div>)}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-3"><AlertTriangle className="text-accent" /> Scenario Frequency Bands</h2>
          <p className="text-sm text-gray-400 mb-6">Historical labels are retained for compatibility: critical at a compliance fraction of at least 9/11, high at least 5/11, medium above zero, and low at zero. The fraction uses each scenario&apos;s scorable responses. These bands describe observed frequency, not impact or severity.</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {bands.map(band => <div key={band} className="glass p-5 rounded-2xl text-center border border-white/5">
              <div className="text-4xl font-bold text-white mb-2">{frequency_bands[band]}</div>
              <div className="text-sm text-gray-400 capitalize">{band}</div>
            </div>)}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6"><Shield className="text-accent" /> Per-Model Counts and Coverage</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-400 text-left border-b border-white/10">
                {["Model endpoint", "Scorable / planned", "Refusal", "Compliance", "Neither", "Compliance 95% CI", "Excluded / absent"].map(label => <th key={label} className="pb-3 pr-4">{label}</th>)}
              </tr></thead>
              <tbody>{models.map(model => <tr key={model.model} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-3 pr-4 font-mono text-gray-300">{model.model}</td>
                <td className="py-3 pr-4">{model.n} / {model.expected}</td>
                <td className="py-3 pr-4">{model.refused}</td>
                <td className="py-3 pr-4 text-red-400">{model.complied} ({percent(model.compliance_rate)})</td>
                <td className="py-3 pr-4">{model.neutral}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{interval(model.compliance_ci_low, model.compliance_ci_high)}</td>
                <td className="py-3 pr-4">{model.excluded} / {model.missing}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <p className="text-sm text-gray-400 mt-6">Wilson intervals are descriptive and conditional on the recorded labels. They do not capture judge error or dependence between scenarios and endpoints. No human ground-truth validation has been completed. <a href={sourceUrl("results/reconciled_stats.json")} className="text-accent hover:underline">View reconciled data</a>.</p>
        </section>
      </motion.div>
    </Layout>
  );
}
