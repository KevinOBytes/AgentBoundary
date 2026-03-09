import Layout from "../components/Layout";
import { motion, Variants } from "framer-motion";
import { GitBranch, Box, Code, Cpu, Workflow } from "lucide-react";

export default function FrameworkPage() {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-12 flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-xl">
            <Workflow className="text-accent" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Evaluation Framework</h1>
            <p className="mt-2 max-w-2xl text-gray-400">The AgentKillChain harness is a Python-based execution environment designed to systematically test LLM agents against persistent threats.</p>
          </div>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="glass p-8 rounded-2xl flex flex-col md:flex-row gap-6 items-start">
            <div className="p-4 bg-white/5 rounded-xl shrink-0">
              <Cpu className="text-accent" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Multi-Agent Testing Environment</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                The framework supports evaluating arbitrary agent architectures (e.g., ReAct, Plan-and-Solve) by providing a uniform harness that acts as the user, the environment, and the target. It manages LLM interactions via API providers like OpenRouter to run tests across frontier models simultaneously.
              </p>
            </div>
          </motion.div>

          <motion.div variants={item} className="glass p-8 rounded-2xl flex flex-col md:flex-row gap-6 items-start">
            <div className="p-4 bg-white/5 rounded-xl shrink-0">
              <GitBranch className="text-blue-400" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Latent State Propagation</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Unlike simple prompt injections that trigger immediately, AgentKillChain models realistically advanced threats. Tests are structured into &apos;campaigns&apos; across multiple simulated user sessions. The framework tests if an agent will carry a poisoned memory from an initial innocent interaction into a future sensitive task.
              </p>
            </div>
          </motion.div>

          <motion.div variants={item} className="glass p-8 rounded-2xl flex flex-col md:flex-row gap-6 items-start">
            <div className="p-4 bg-white/5 rounded-xl shrink-0">
              <Code className="text-purple-400" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Automated Grading & Heuristics</h3>
              <p className="text-gray-300 leading-relaxed">
                After an agent responds or executes a tool, the framework uses an LLM-as-a-judge (or deterministic string matching for known payloads) to assess whether the attack was successful. This yields a deterministic Compromise Rate (CR) per model and architecture permutation.
              </p>
            </div>
          </motion.div>

          <motion.div variants={item} className="glass p-8 rounded-2xl flex flex-col md:flex-row gap-6 items-start">
            <div className="p-4 bg-white/5 rounded-xl shrink-0">
              <Box className="text-orange-400" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Reproducible Reporting</h3>
              <p className="text-gray-300 leading-relaxed">
                The harness automatically emits structured JSON output and CSV aggregations at the end of every testing run. This guarantees that all metrics are reproducible and can be independently verified by other researchers evaluating the same LLM or cognitive architecture.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
