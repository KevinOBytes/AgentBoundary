import { motion } from "framer-motion";
import { Terminal } from "lucide-react";

export default function DiagramCard({ title, content }: { title: string; content: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(74, 222, 128, 0.3)" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="relative overflow-hidden rounded-xl border border-white/5 bg-panel p-6 shadow-2xl transition-all"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Terminal size={64} />
      </div>
      <div className="relative z-10">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-accent">
          <Terminal size={18} className="text-accent" />
          {title}
        </h3>
        <pre className="font-mono overflow-x-auto whitespace-pre-wrap text-sm text-gray-300 antialiased">{content}</pre>
      </div>
    </motion.div>
  );
}
