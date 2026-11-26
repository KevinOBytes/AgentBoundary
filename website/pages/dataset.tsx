import { useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import { motion } from "framer-motion";
import { Database } from "lucide-react";
import { loadReconciledStats } from "../lib/load-results";
import { interval, LEGACY_SUMMARY_URL, percent, sourceUrl } from "../lib/results";
import type { ReconciledStats } from "../types/results";

interface Props { data: ReconciledStats }

export async function getStaticProps(): Promise<{ props: Props }> {
  return { props: { data: loadReconciledStats() } };
}

export default function DatasetPage({ data }: Props) {
  const [family, setFamily] = useState("");
  const [query, setQuery] = useState("");
  const { metadata, coverage, overall, by_scenario, review_flags } = data;
  const families = Array.from(new Set(by_scenario.map(row => row.family))).sort();
  const filtered = by_scenario.filter(row => (!family || row.family === family) && `${row.attack_id} ${row.attacker_goal} ${row.expected_failure_mode}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-xl"><Database className="text-accent" size={32} /></div>
          <div><h1 className="text-4xl font-bold tracking-tight text-white">Dataset and Coverage</h1>
            <p className="mt-2 text-gray-400">Current cohort: {metadata.catalog_scenarios} scenarios across {metadata.model_count} model endpoints.</p>
          </div>
        </div>
        <p className="text-gray-300 leading-relaxed mb-4">The retained dataset contains {coverage.recorded_evaluations} records from {coverage.expected_evaluations} planned evaluations. {coverage.excluded_evaluations} empty response is excluded, leaving {overall.n} scorable responses; {coverage.missing_evaluations} planned evaluations have no retained record. Missing and empty responses are not counted as refusals or successful defenses.</p>
        <p className="text-gray-400 text-sm mb-8">This table reports automated refusal and compliance flags. “Neither” means neither flag was set, not a verified safe outcome. Frequency bands describe observed compliance frequency, not impact. <Link href="/results" className="text-accent hover:underline">View aggregate results and thresholds</Link>.</p>

        <div className="flex flex-wrap gap-4 mb-6">
          <label className="text-sm text-gray-300">Attack family
            <select value={family} onChange={event => setFamily(event.target.value)} className="block mt-2 bg-black border border-white/10 rounded-lg p-2 text-white">
              <option value="">All families</option>{families.map(value => <option key={value} value={value}>{value.replace(/_/g, " ")}</option>)}
            </select>
          </label>
          <label className="text-sm text-gray-300 flex-1 min-w-48">Search scenario or goal
            <input value={query} onChange={event => setQuery(event.target.value)} className="block mt-2 w-full bg-black border border-white/10 rounded-lg p-2 text-white" placeholder="Filter scenarios" />
          </label>
        </div>
        <div className="overflow-x-auto glass rounded-2xl border border-white/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-gray-300"><tr>
              {["Scenario", "Scorable / planned", "Refusal", "Compliance", "Neither", "Compliance 95% CI", "Frequency band"].map(label => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-white/5">{filtered.map(row => <tr key={row.attack_id} className="hover:bg-white/5">
              <td className="px-4 py-4"><div className="font-mono text-accent">{row.attack_id}</div><div className="text-xs text-gray-400 mt-1">{row.expected_failure_mode}</div></td>
              <td className="px-4 py-4">{row.n} / {row.expected}</td>
              <td className="px-4 py-4">{row.refused}</td>
              <td className="px-4 py-4">{row.complied} ({percent(row.compliance_rate)})</td>
              <td className="px-4 py-4">{row.neutral}</td>
              <td className="px-4 py-4 whitespace-nowrap">{interval(row.compliance_ci_low, row.compliance_ci_high)}</td>
              <td className="px-4 py-4 capitalize">{row.frequency_band}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <p className="text-sm text-gray-400 mt-4 mb-12">Showing {filtered.length} of {by_scenario.length} scenarios. <Link href="/prompts" className="text-accent hover:underline">Inspect the prompt catalog</Link>.</p>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Excluded and Absent Evaluations</h2>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead><tr className="border-b border-white/10 text-gray-400"><th className="py-3 pr-4">Scenario</th><th className="py-3 pr-4">Model endpoint</th><th className="py-3 pr-4">Status</th></tr></thead>
            <tbody>{coverage.excluded.map(row => <tr key={`excluded-${row.model}-${row.attack_id}`} className="border-b border-white/5"><td className="py-3 pr-4 font-mono">{row.attack_id}</td><td className="py-3 pr-4 font-mono">{row.model}</td><td className="py-3 pr-4">Excluded: {row.reason}</td></tr>)}
              {coverage.missing.map(row => <tr key={`missing-${row.model}-${row.attack_id}`} className="border-b border-white/5"><td className="py-3 pr-4 font-mono">{row.attack_id}</td><td className="py-3 pr-4 font-mono">{row.model}</td><td className="py-3 pr-4">No retained record</td></tr>)}</tbody>
          </table></div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Review Flags</h2>
          <p className="text-sm text-gray-400 mb-4">Deterministic checks flagged {review_flags.length} records for review, including {review_flags.filter(row => row.disputed).length} disagreement with a stored label. These flags do not silently overwrite the automated labels; human review remains outstanding.</p>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead><tr className="border-b border-white/10 text-gray-400"><th className="py-3 pr-4">Scenario</th><th className="py-3 pr-4">Model endpoint</th><th className="py-3 pr-4">Check</th><th className="py-3 pr-4">Stored verdict</th><th className="py-3 pr-4">Disputed</th></tr></thead>
            <tbody>{review_flags.map((row, index) => <tr key={`${row.model}-${row.attack_id}-${index}`} className="border-b border-white/5"><td className="py-3 pr-4 font-mono">{row.attack_id}</td><td className="py-3 pr-4 font-mono">{row.model}</td><td className="py-3 pr-4">{row.kind.replace(/_/g, " ")}</td><td className="py-3 pr-4">{typeof row.stored_verdict === "string" ? row.stored_verdict : JSON.stringify(row.stored_verdict)}</td><td className="py-3 pr-4">{row.disputed ? "Yes" : "No"}</td></tr>)}</tbody>
          </table></div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Retained Sources</h2>
          <p className="text-sm text-gray-400 mb-4">The reconciled summary records each source hash so this exact artifact set can be checked. <a href={sourceUrl("results/reconciled_stats.json")} className="text-accent hover:underline">Read the summary</a>.</p>
          <ul className="space-y-4">{metadata.source_files.map(source => <li key={source.path} className="glass p-4 rounded-xl border border-white/5"><a href={sourceUrl(source.path)} className="text-accent hover:underline break-all">{source.path}</a><p className="text-sm text-gray-400 mt-1">{source.role}</p><p className="font-mono text-xs text-gray-400 mt-2 break-all">SHA-256: {source.sha256}</p></li>)}</ul>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Earlier Harness Cohort</h2>
          <p className="text-gray-300 leading-relaxed">The earlier 45-model, 40-scenario cohort contains 1,800 model-scenario evaluations with different harness and scoring methods. Its figures are not combined with the current cohort. <a href={LEGACY_SUMMARY_URL} className="text-accent hover:underline">Read the immutable legacy summary</a> and <a href={sourceUrl("docs/whitepaper_v0_archive.md")} className="text-accent hover:underline">archived manuscript</a>.</p>
        </section>
      </motion.div>
    </Layout>
  );
}
