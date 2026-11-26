import Layout from "../components/Layout";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShieldAlert, Cpu, User } from "lucide-react";
import { loadReconciledStats } from "../lib/load-results";
import { interval, percent } from "../lib/results";
import type { ReconciledStats } from "../types/results";

interface Props { data: ReconciledStats }

export async function getStaticProps(): Promise<{ props: Props }> {
  return { props: { data: loadReconciledStats() } };
}

export default function Home({ data }: Props) {
  const { metadata, coverage, overall } = data;
  return (
    <Layout>
      <motion.section
        className="mb-16 mt-8 relative"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="absolute -inset-x-20 -top-20 z-0 h-[300px] w-full bg-accent/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="relative z-10 flex items-center mb-4 gap-3">
          <ShieldAlert className="text-accent" size={32} />
          <span className="text-accent font-mono text-sm tracking-widest uppercase font-semibold">AgentBoundary</span>
        </div>
        <h1 className="relative z-10 max-w-4xl text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent pb-1">
          Measuring Instruction-Boundary Behavior
        </h1>
        <p className="relative z-10 mt-4 max-w-2xl text-xl leading-relaxed text-gray-400">
          AgentBoundary evaluates {metadata.catalog_scenarios} fixed prompt-injection scenarios across {metadata.attack_families} attack families. The current cohort measures model responses through chat-completion APIs and retains automated judgments, coverage gaps, and evidence for review.
        </p>
        <div className="mt-8 flex gap-4 relative z-10">
          <a href="/paper" className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-black transition-transform hover:scale-105 hover:bg-green-400">
            Read Paper
          </a>
          <a href="https://github.com/KevinOBytes/AgentBoundary" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-3 font-semibold text-white transition-all hover:scale-105">
            <Cpu size={18} />
            View GitHub
          </a>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-16 relative z-10"
      >
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Reconciled Findings</h2>
        <p className="text-gray-400 text-center max-w-3xl mx-auto mb-8">
          {coverage.scorable_evaluations} nonempty responses from {metadata.model_count} model endpoints.
          {" "}{coverage.recorded_evaluations} records are retained from {coverage.expected_evaluations} planned evaluations;
          {" "}{coverage.excluded_evaluations} empty response is excluded and {coverage.missing_evaluations} evaluations are absent.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass p-6 rounded-2xl border-t-2 border-red-500 flex flex-col items-center text-center transition-transform hover:scale-105">
            <h3 className="text-gray-300 font-medium mb-2 uppercase tracking-wider text-sm">Compliance Flag Rate</h3>
            <div className="text-5xl font-extrabold text-white mb-2">{percent(overall.compliance_rate)}</div>
            <p className="text-sm text-gray-400">{overall.complied}/{overall.n}; 95% Wilson CI {interval(overall.compliance_ci_low, overall.compliance_ci_high)}</p>
          </div>
          <div className="glass p-6 rounded-2xl border-t-2 border-orange-500 flex flex-col items-center text-center transition-transform hover:scale-105">
            <h3 className="text-gray-300 font-medium mb-2 uppercase tracking-wider text-sm">No Compliance Flag</h3>
            <div className="text-5xl font-extrabold text-white mb-2">{overall.zero_compliance_models}/{metadata.model_count}</div>
            <p className="text-sm text-gray-400">Endpoints with zero recorded compliance flags in their scorable responses. Coverage differs by endpoint.</p>
          </div>
          <div className="glass p-6 rounded-2xl border-t-2 border-green-500 flex flex-col items-center text-center transition-transform hover:scale-105">
            <h3 className="text-gray-300 font-medium mb-2 uppercase tracking-wider text-sm">Scorable Coverage</h3>
            <div className="text-5xl font-extrabold text-white mb-2">{percent(coverage.scorable_evaluations / coverage.expected_evaluations)}</div>
            <p className="text-sm text-gray-400">{coverage.scorable_evaluations}/{coverage.expected_evaluations} planned model-scenario evaluations</p>
          </div>
        </div>
      </motion.section>

      {/* Scope note: diagrams removed because the benchmark evaluates chat-completion instruction-boundary behavior, not live agent lifecycles or persistent memory. */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-16 relative z-10"
      >
        <div className="glass p-6 rounded-2xl border-l-4 border-accent">
          <h3 className="text-lg font-bold text-white mb-2">Scope Note</h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            This cohort tests instruction-boundary behavior through fixed chat-completion requests, with scripted history for seed entries and one measured response per evaluation.
            It does not execute live tools or test persistent cross-session memory and multi-turn agent frameworks.
            Automated labels have not been validated against human ground truth; zero observed compliance does not establish safety.
            The earlier 45-model, 40-scenario harness cohort is a separate artifact with different methods.
          </p>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="border-t border-white/10 pt-16 relative z-10"
      >
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <User className="text-accent" /> About the Author
        </h2>
        <div className="glass p-8 rounded-2xl flex flex-col md:flex-row gap-8 items-center md:items-start">
          <Image src="/kevinbytes-logo.png" alt="Kevin O'Connor" width={96} height={96} className="w-24 h-24 rounded-full bg-white/5 p-2 object-contain" />
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Kevin O&apos;Connor</h3>
            <p className="text-accent font-mono text-sm mb-4">Security Researcher | Former NSA TAO Technical Director</p>
            <p className="text-gray-300 leading-relaxed max-w-3xl">
              Security researcher focused on adversarial evaluation, systems security, and evidence integrity, with experience at NSA, CrowdStrike, and Adlumin. AgentBoundary publishes experimental methods and retained results so that its claims and limitations can be inspected.
            </p>
          </div>
        </div>
      </motion.section>
    </Layout>
  );
}
