import { motion } from "framer-motion";
import { Terminal } from "lucide-react";

export type DiagramItem = {
  label: string;
  tooltip: string;
};

export default function DiagramCard({ 
  title, 
  content, 
  items, 
  separator = "->",
}: { 
  title: string; 
  content?: string; 
  items?: DiagramItem[]; 
  separator?: string;
}) {
  return (
    <motion.div 
      whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(74, 222, 128, 0.3)" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="relative rounded-xl border border-white/5 bg-panel p-6 shadow-2xl transition-all"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Terminal size={64} />
      </div>
      <div className="relative z-10">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-accent">
          <Terminal size={18} className="text-accent" />
          {title}
        </h3>
        
        {items ? (
          <div className="font-mono text-sm antialiased flex flex-wrap items-center gap-2">
            {items.map((item, i) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="group relative cursor-help">
                  <span className="text-gray-300 hover:text-white transition-colors border-b border-dashed border-white/20 hover:border-accent">
                    {item.label}
                  </span>
                  
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[250px] opacity-0 transition-opacity group-hover:opacity-100 z-50">
                    <div className="bg-neutral-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl border border-white/10 backdrop-blur-sm relative font-sans text-center leading-relaxed">
                      {item.tooltip}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-neutral-900"></div>
                    </div>
                  </div>
                </div>
                {i < items.length - 1 && (
                  <span className="text-gray-500 whitespace-pre">{separator}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <pre className="font-mono overflow-x-auto whitespace-pre-wrap text-sm text-gray-300 antialiased">{content}</pre>
        )}
      </div>
    </motion.div>
  );
}
