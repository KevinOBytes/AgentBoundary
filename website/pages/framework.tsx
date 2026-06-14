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
            <p className="mt-2 max-w-2xl text-gray-400">The AgentBoundary harness is a Python-based execution environment for measuring prompt-injection robustness via standard chat-completion APIs. It does not execute live tool calls or test persistent cross-session memory.</p>
          </div>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="glass p-8 rounded-2xl flex flex-col md:flex-row gap-6 items-start">
            <div className="p-4 bg-white/5 rounded-xl shrink-0">
              <Cpu className="text-accent" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Agent Testing Environment</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                The current framework evaluates one representative assistant loop while keeping the provider interface flexible. It manages LLM interactions through OpenRouter, local Ollama, or authenticated Ollama Cloud to run tests across model catalogs.
              </p>
            </div>
          </motion.div>

          <motion.div variants={item} className="glass p-8 rounded-2xl flex flex-col md:flex-row gap-6 items-start">
            <div className="p-4 bg-white/5 rounded-xl shrink-0">
              <GitBranch className="text-blue-400" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Static Prompt Evaluation</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Each scenario is a single-turn chat-completion prompt. The harness sends the attack text to the model and records the response. There is no multi-session state, no persistent memory, and no live tool execution. This design isolates the LLM&apos;s instruction-boundary behavior.
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
                After an agent responds, the framework scores unsafe behavior signals. All evaluations use the LLM-as-judge pipeline (gpt-5.4 with few-shot rubrics). Deterministic heuristics remain available in `harness/evaluation.py` as a fallback.
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
                The harness emits structured JSON and CSV artifacts at the end of every run. Public artifacts keep attack prompts public while redacting full live request and response traces, retaining metrics, flags, counts, character lengths, and SHA-256 digests for traceability.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
