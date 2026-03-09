import Layout from "../components/Layout";
import DiagramCard from "../components/DiagramCard";
import { motion, Variants } from "framer-motion";
import { ShieldAlert, Cpu, User } from "lucide-react";

const lifecycle = `Initial Access -> Execution -> Persistence -> Latent Activation -> Escalation -> Exfiltration`;
const architecture = `User Input / Memory / Planner / Tool Router / External Tools / Data Stores`;
const latentTimeline = `Session 1: Seed -> Session 2..N: Dormancy -> Session N+1: Trigger Activation`;
const toolFlow = `Malicious prompt -> Tool selection confusion -> Dangerous invocation -> Data exposure`;

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
          <a href="https://github.com/agentkillchain/agentkillchain" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-3 font-semibold text-white transition-all hover:scale-105">
            <Cpu size={18} />
            View GitHub
          </a>
        </div>
      </motion.section>

      <motion.section 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 relative z-10 mb-16"
      >
        <motion.div variants={item}>
          <DiagramCard title="Attacker Lifecycle" content={lifecycle} />
        </motion.div>
        <motion.div variants={item}>
          <DiagramCard title="Attack Surface" content={architecture} />
        </motion.div>
        <motion.div variants={item}>
          <DiagramCard title="Latent Timeline Profile" content={latentTimeline} />
        </motion.div>
        <motion.div variants={item}>
          <DiagramCard title="Toolchain Confusion Strategy" content={toolFlow} />
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
