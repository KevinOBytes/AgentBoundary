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
            <p className="mt-2 max-w-2xl text-gray-400">The current AgentBoundary cohort measures responses to fixed chat-completion requests. It does not execute live tool calls or establish persistent cross-session memory behavior.</p>
          </div>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="glass p-8 rounded-2xl flex flex-col md:flex-row gap-6 items-start">
            <div className="p-4 bg-white/5 rounded-xl shrink-0">
              <Cpu className="text-accent" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Current Evaluation Cohort</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                The current study records one measured model response per catalog scenario and endpoint. Results retain endpoint identifiers and missing-record coverage. The older 45-model harness cohort uses different execution and scoring methods and remains a separately labeled artifact.
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
                Scenarios are fixed chat-completion requests. For catalog entries with a seed, the runner inserts a scripted prior exchange, including the assistant text “Stored.”, before the trigger. This is supplied history, not observed storage or recall. The current cohort does not run a live agent framework or execute tool proposals.
              </p>
            </div>
          </motion.div>

          <motion.div variants={item} className="glass p-8 rounded-2xl flex flex-col md:flex-row gap-6 items-start">
            <div className="p-4 bg-white/5 rounded-xl shrink-0">
              <Code className="text-purple-400" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Automated Labels and Corrections</h3>
              <p className="text-gray-300 leading-relaxed">
                The current results combine the retained GPT-5.4 few-shot judge labels with a targeted correction pass over the originally positive compliance labels. Earlier negative labels did not receive that correction pass. Refusal and compliance are separate flags; neither flag does not establish safety or successful task completion. Historical compliance grading received a failure category and truncated response text, without the original prompt context. No human ground-truth validation has been completed.
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
                Current pages use one reconciled summary derived from retained source records and correction labels. Source-file SHA-256 hashes, per-model denominators, excluded empty responses, missing evaluations, and disputed records make the result auditable. The legacy harness&apos;s JSON/CSV metrics and redaction conventions belong to the earlier cohort and are not interchangeable with these current labels.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
