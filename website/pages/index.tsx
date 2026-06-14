import Layout from "../components/Layout";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { ShieldAlert, Cpu, User } from "lucide-react";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Home() {
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
          <span className="text-accent font-mono text-sm tracking-widest uppercase font-semibold">AgentBoundary v1.0</span>
        </div>
        <h1 className="relative z-10 max-w-4xl text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent pb-1">
          Empirical Prompt-Injection Robustness for LLM Agents
        </h1>
        <p className="relative z-10 mt-4 max-w-2xl text-xl leading-relaxed text-gray-400">
          I built AgentBoundary because I was tired of benchmarks that label attacks as critical without ever testing them against a live model. This is a 51-scenario, empirically scored evaluation suite. Every severity label comes from measured compliance, not synthetic guesswork.
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
        <h2 className="text-3xl font-bold text-white mb-6 text-center">What We Actually Found</h2>
        <p className="text-gray-400 text-center max-w-3xl mx-auto mb-8">
          552 live evaluations across 11 models at temperature zero.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass p-6 rounded-2xl border-t-2 border-red-500 flex flex-col items-center text-center transition-transform hover:scale-105">
            <h3 className="text-gray-300 font-medium mb-2 uppercase tracking-wider text-sm">Overall Compliance</h3>
            <div className="text-5xl font-extrabold text-white mb-2">2.0%</div>
            <p className="text-sm text-gray-500">11/552, down from 10.0% with zero-shot judge</p>
          </div>
          <div className="glass p-6 rounded-2xl border-t-2 border-orange-500 flex flex-col items-center text-center transition-transform hover:scale-105">
            <h3 className="text-gray-300 font-medium mb-2 uppercase tracking-wider text-sm">Zero-Compliance Models</h3>
            <div className="text-5xl font-extrabold text-white mb-2">9/11</div>
            <p className="text-sm text-gray-500">Claude, GPT-5-pro, Gemini, MIMO, GLM-5.1 all clean</p>
          </div>
          <div className="glass p-6 rounded-2xl border-t-2 border-green-500 flex flex-col items-center text-center transition-transform hover:scale-105">
            <h3 className="text-gray-300 font-medium mb-2 uppercase tracking-wider text-sm">Claude Opus-4.7</h3>
            <div className="text-5xl font-extrabold text-white mb-2">0.0%</div>
            <p className="text-sm text-gray-500">Zero clear compliance across 51 entries</p>
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
            AgentBoundary evaluates prompt-injection robustness via standard chat-completion APIs at temperature=0.0.
            It does not simulate live tool execution, persistent cross-session memory, or multi-turn agent frameworks.
            The 51 scenarios test the LLM layer&apos;s instruction-boundary behavior — what the model does when it
            receives an injected prompt. This is a narrower but more controlled scope than full agent evaluation.
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
            <p className="text-accent font-mono text-sm mb-4">NSA Veteran | Sr Security Architect | TKOResearch LLC</p>
            <p className="text-gray-300 leading-relaxed max-w-3xl">
              Security researcher focused on adversarial robustness and empirical evaluation. Previously: National Security Agency (Operations Research, Deckert Foster Award, NMU Citation), CrowdStrike. AgentBoundary started as an honest attempt to separate real AI-agent attack surfaces from synthetic hype. My day job is adversarial robustness; my night job is making sure the numbers match the claims.
            </p>
          </div>
        </div>
      </motion.section>
    </Layout>
  );
}
