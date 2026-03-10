import Layout from "../components/Layout";
import DiagramCard, { DiagramItem } from "../components/DiagramCard";
import { motion, Variants } from "framer-motion";
import { ShieldAlert, Cpu, User } from "lucide-react";

const lifecycleItems: DiagramItem[] = [
  { label: "Initial Access", tooltip: "Gaining the first foothold in the AI agent's environment or context." },
  { label: "Execution", tooltip: "Running unauthorized commands or code via the agent's capabilities." },
  { label: "Persistence", tooltip: "Maintaining access or influence over the agent across sessions or turns." },
  { label: "Latent Activation", tooltip: "A dormant payload is triggered by specific context or time." },
  { label: "Escalation", tooltip: "Gaining higher privileges or access to more sensitive tools." },
  { label: "Exfiltration", tooltip: "Stealing or leaking sensitive data out of the agent's environment." }
];

const architectureItems: DiagramItem[] = [
  { label: "User Input", tooltip: "Direct prompts or files provided by the user." },
  { label: "Memory", tooltip: "Long-term or short-term storage where the agent saves context." },
  { label: "Planner", tooltip: "The reasoning component that decides which steps to take next." },
  { label: "Tool Router", tooltip: "The mechanism that selects and formats tool calls." },
  { label: "External Tools", tooltip: "Third-party APIs or local commands the agent can execute." },
  { label: "Data Stores", tooltip: "Databases or document stores the agent queries for retrieval." }
];

const latentTimelineItems: DiagramItem[] = [
  { label: "Session 1: Seed", tooltip: "The attacker injects a dormant payload into the agent's memory or data." },
  { label: "Session 2..N: Dormancy", tooltip: "The payload remains hidden while the agent performs normal tasks." },
  { label: "Session N+1: Trigger Activation", tooltip: "A specific condition is met, causing the payload to execute." }
];

const toolFlowItems: DiagramItem[] = [
  { label: "Malicious prompt", tooltip: "An input designed to manipulate the agent's parsing or tool selection." },
  { label: "Tool selection confusion", tooltip: "The agent is tricked into picking a dangerous tool instead of a safe one." },
  { label: "Dangerous invocation", tooltip: "The agent executes the malicious action using the selected tool." },
  { label: "Data exposure", tooltip: "The result of the action leads to unauthorized data access or leakage." }
];

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
          <span className="text-accent font-mono text-sm tracking-widest uppercase font-semibold">Security Research Benchmark</span>
        </div>
        <h1 className="relative z-10 max-w-4xl text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent pb-1">
          Evaluating Persistent Compromise in Autonomous AI Squads
        </h1>
        <p className="relative z-10 mt-4 max-w-2xl text-xl leading-relaxed text-gray-400">
          AgentKillChain is an open, reproducible framework for stress-testing AI agents against latent prompt injection and memory poisoning attacks.
        </p>
        <div className="mt-8 flex gap-4 relative z-10">
          <a href="/paper" className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-black transition-transform hover:scale-105 hover:bg-green-400">
            Read Whitepaper
          </a>
          <a href="https://github.com/KevinOBytes/agentkillchain" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-3 font-semibold text-white transition-all hover:scale-105">
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
        <h2 className="text-3xl font-bold text-white mb-6 text-center">The New Metrics</h2>
        <p className="text-gray-400 text-center max-w-3xl mx-auto mb-8">
          Running a true 720 attack scenarios produced these updated global baseline metrics, which actually remained roughly stable despite adding all the new architectures:
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass p-6 rounded-2xl border-t-2 border-red-500 flex flex-col items-center text-center transition-transform hover:scale-105">
            <h3 className="text-gray-300 font-medium mb-2 uppercase tracking-wider text-sm">Global Compromise Rate</h3>
            <div className="text-5xl font-extrabold text-white mb-2">1.71%</div>
            <p className="text-sm text-gray-500">(Up slightly from 1.63%)</p>
          </div>
          <div className="glass p-6 rounded-2xl border-t-2 border-orange-500 flex flex-col items-center text-center transition-transform hover:scale-105">
            <h3 className="text-gray-300 font-medium mb-2 uppercase tracking-wider text-sm">Toolchain Abuse Rate</h3>
            <div className="text-5xl font-extrabold text-white mb-2">0.38%</div>
            <p className="text-sm text-gray-500">(Down slightly)</p>
          </div>
          <div className="glass p-6 rounded-2xl border-t-2 border-yellow-500 flex flex-col items-center text-center transition-transform hover:scale-105">
            <h3 className="text-gray-300 font-medium mb-2 uppercase tracking-wider text-sm">Data Exfiltration</h3>
            <div className="text-5xl font-extrabold text-white mb-2">0.19%</div>
            <p className="text-sm text-gray-500">(Down slightly)</p>
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 relative z-10 mb-16"
      >
        <motion.div variants={item}>
          <DiagramCard title="Attacker Lifecycle" items={lifecycleItems} separator="->" />
        </motion.div>
        <motion.div variants={item}>
          <DiagramCard title="Attack Surface" items={architectureItems} separator="/" />
        </motion.div>
        <motion.div variants={item}>
          <DiagramCard title="Latent Timeline Profile" items={latentTimelineItems} separator="->" />
        </motion.div>
        <motion.div variants={item}>
          <DiagramCard title="Toolchain Confusion Strategy" items={toolFlowItems} separator="->" />
        </motion.div>
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
          <img src="/kevinbytes-logo.png" alt="Kevin O'Connor" className="w-24 h-24 rounded-full bg-white/5 p-2 object-contain" />
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Kevin O&apos;Connor</h3>
            <p className="text-accent font-mono text-sm mb-4">NSA Alum | Adlumin</p>
            <p className="text-gray-300 leading-relaxed max-w-3xl">
              Kevin O&apos;Connor is a security researcher specializing in autonomous systems and advanced threat modeling. Drawing from his experience at the National Security Agency (NSA) and as a researcher at Adlumin, Kevin explores the convergence of AI capabilities and offensive security, focusing on latent vulnerabilities and emergent behaviors in multi-agent environments.
            </p>
          </div>
        </div>
      </motion.section>
    </Layout>
  );
}
