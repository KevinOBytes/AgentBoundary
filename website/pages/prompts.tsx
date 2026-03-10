import fs from "fs";
import path from "path";
import Layout from "../components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Activity, Bug, Zap, Cpu, ChevronDown, ChevronRight, Hash } from "lucide-react";
import React, { useState } from "react";

interface AttackDefinition {
  attack_id: string;
  campaign_id: string;
  family: string;
  scenario_type: string;
  seed_input: string;
  trigger_input: string;
  expected_failure_mode: string;
  severity: string;
  phase: string;
}

interface Props {
  attacks: AttackDefinition[];
}

export async function getStaticProps(): Promise<{ props: Props }> {
  const filePath = path.join(process.cwd(), "..", "dataset", "attack_catalog.json");
  let attacks: AttackDefinition[] = [];
  try {
    if (fs.existsSync(filePath)) {
      attacks = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (e) {
    console.error("Failed to load attack catalog", e);
  }
  return { props: { attacks } };
}

const AttackSection = ({ 
  type, 
  familyAttacks, 
  index, 
  getSeverityColor, 
  getPhaseIcon 
}: { 
  type: string; 
  familyAttacks: AttackDefinition[]; 
  index: number;
  getSeverityColor: (val: string) => string;
  getPhaseIcon: (val: string) => React.ReactNode;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div 
      id={`section-${type}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative mb-12 scroll-mt-24"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-accent/20 rounded-full" />
      <div className="pl-6 md:pl-8">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left group flex items-start sm:items-center justify-between hover:bg-white/5 p-4 -ml-4 rounded-xl transition-colors"
        >
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1 uppercase tracking-wider font-mono flex items-center gap-3">
              <span className="text-accent opacity-50">/</span> {type.replace(/_/g, ' ')}
            </h2>
            <p className="text-gray-400 text-sm">Targeting `{type}` primitive bypass logic across {familyAttacks.length} variants.</p>
          </div>
          <div className="text-gray-500 group-hover:text-accent transition-colors ml-4 mt-1 sm:mt-0 shrink-0">
            {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
          </div>
        </button>
        
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid gap-6 mt-6 pb-2">
                {familyAttacks.map((attack) => (
                  <div key={attack.attack_id} className="glass rounded-xl p-6 border border-white/5 shadow-xl hover:border-white/10 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                       <div>
                         <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                           <span className="font-mono text-accent font-bold bg-accent/10 px-3 py-1 rounded-md text-sm border border-accent/20 shadow-inner">
                             {attack.attack_id}
                           </span>
                           <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border flex items-center ${getSeverityColor(attack.severity)}`}>
                             {attack.severity} Priority
                           </span>
                           <span className="flex items-center text-xs text-gray-400 bg-white/5 border border-white/10 px-2 py-1 rounded capitalize">
                             {getPhaseIcon(attack.phase)} {attack.phase} Phase
                           </span>
                         </div>
                       </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-6">
                      <div>
                        <h4 className="flex items-center gap-2 text-[10px] uppercase text-gray-500 mb-2 font-bold tracking-widest">
                          Scenario Type
                        </h4>
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-3 font-mono text-xs text-blue-300 flex items-start gap-2">
                          <span className="w-2 h-2 mt-1 shrink-0 rounded-full bg-blue-500/50" />
                          <span className="break-all sm:break-normal">{attack.scenario_type}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="flex items-center gap-2 text-[10px] uppercase text-gray-500 mb-2 font-bold tracking-widest">
                          Expected Arbitrary Execution
                        </h4>
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-3 font-mono text-xs text-purple-300 flex items-start gap-2">
                          <span className="w-2 h-2 mt-1 shrink-0 rounded-full bg-purple-500/50" />
                          <span className="break-all sm:break-normal">{attack.expected_failure_mode}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] uppercase text-gray-500 mb-2 font-bold tracking-widest">Base Payload Structure</h4>
                      <div className="bg-[#0f0f0f] p-4 sm:p-5 rounded-xl border border-white/5 font-mono text-[10px] sm:text-xs text-gray-300 whitespace-pre-wrap shadow-inner leading-relaxed overflow-x-auto">
                        {attack.seed_input || attack.trigger_input}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default function PromptsPage({ attacks }: Props) {
  // Group by attack family
  const groupedAttacks = attacks.reduce((acc, attack) => {
    if (!acc[attack.family]) {
      acc[attack.family] = [];
    }
    acc[attack.family].push(attack);
    return acc;
  }, {} as Record<string, AttackDefinition[]>);

  const getSeverityColor = (severity: string) => {
    switch(severity.toLowerCase()) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch(phase) {
      case 'seed': return <Bug size={14} className="mr-1" />;
      case 'dormancy': return <Activity size={14} className="mr-1 opacity-50" />;
      case 'activation': return <Zap size={14} className="mr-1 text-accent" />;
      default: return <Cpu size={14} className="mr-1" />;
    }
  }

  const sections = Object.keys(groupedAttacks);

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-12 flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-xl">
            <Terminal className="text-accent" size={32} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">Adversarial Catalog</h1>
            <p className="text-gray-400 text-sm md:text-lg max-w-3xl">An exhaustive taxonomy of prompt configurations, logic bombs, and boundary exploits leveraged during empirical simulation.</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* Left Navigation */}
          {sections.length > 0 && (
            <div className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 glass p-6 rounded-xl border border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                <Hash size={14} /> Categories
              </h3>
              <div className="flex flex-col gap-1">
                {sections.map(type => (
                  <a 
                    key={type} 
                    href={`#section-${type}`} 
                    className="text-gray-400 hover:text-accent hover:bg-white/5 px-3 py-2 rounded-lg transition-all text-sm font-mono capitalize truncate"
                  >
                    {type.replace(/_/g, ' ')}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 w-full min-w-0">
            {Object.entries(groupedAttacks).map(([type, familyAttacks], i) => (
              <AttackSection 
                key={type}
                type={type}
                familyAttacks={familyAttacks}
                index={i}
                getSeverityColor={getSeverityColor}
                getPhaseIcon={getPhaseIcon}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
