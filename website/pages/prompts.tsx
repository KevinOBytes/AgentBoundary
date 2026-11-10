import fs from "fs";
import path from "path";
import Layout from "../components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Activity, Bug, Zap, Cpu, ChevronDown, ChevronRight, Hash } from "lucide-react";
import React, { useState } from "react";
import { loadReconciledStats } from "../lib/load-results";
import type { FrequencyBand } from "../types/results";

interface AttackDefinition {
  attack_id: string;
  campaign_id: string;
  family: string;
  scenario_type: string;
  seed_input: string;
  trigger_input: string;
  expected_failure_mode: string;
  frequency_band: FrequencyBand;
  phase: string;
}

interface Props {
  attacks: AttackDefinition[];
}

interface PromptVariant {
  key: string;
  prompt: string;
  attackIds: string[];
  phases: string[];
  scenarioTypes: string[];
  expectedFailureModes: string[];
  frequencyBands: FrequencyBand[];
}

const normalizePrompt = (value: string) => value.trim().replace(/\s+/g, " ");

const getPromptPayload = (attack: AttackDefinition) => {
  const seed = attack.seed_input?.trim();
  const trigger = attack.trigger_input?.trim();
  if (seed) {
    return `User (scripted seed):\n${seed}\n\nAssistant (scripted):\nStored.\n\nUser (trigger):\n${trigger || seed}`;
  }
  return trigger || "";
};

const buildPromptVariants = (familyAttacks: AttackDefinition[]): PromptVariant[] => {
  const variants = new Map<string, PromptVariant>();

  familyAttacks.forEach((attack) => {
    const payload = getPromptPayload(attack);
    if (!payload) {
      return;
    }

    const key = normalizePrompt(payload);
    const existing = variants.get(key);
    if (!existing) {
      variants.set(key, {
        key,
        prompt: payload,
        attackIds: [attack.attack_id],
        phases: [attack.phase],
        scenarioTypes: [attack.scenario_type],
        expectedFailureModes: [attack.expected_failure_mode],
        frequencyBands: [attack.frequency_band],
      });
      return;
    }

    existing.attackIds = Array.from(new Set([...existing.attackIds, attack.attack_id]));
    existing.phases = Array.from(new Set([...existing.phases, attack.phase]));
    existing.scenarioTypes = Array.from(new Set([...existing.scenarioTypes, attack.scenario_type]));
    existing.expectedFailureModes = Array.from(new Set([...existing.expectedFailureModes, attack.expected_failure_mode]));
    existing.frequencyBands = Array.from(new Set([...existing.frequencyBands, attack.frequency_band]));
  });

  return Array.from(variants.values()).sort((a, b) => b.attackIds.length - a.attackIds.length);
};

const frequencyRank: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const getVariantFrequency = (variant: PromptVariant) => {
  if (variant.frequencyBands.length === 0) {
    return "unknown";
  }

  return variant.frequencyBands.reduce((currentMax, frequency) => {
    const normalized = frequency.toLowerCase();
    const maxNormalized = currentMax.toLowerCase();
    return (frequencyRank[normalized] || 0) > (frequencyRank[maxNormalized] || 0) ? frequency : currentMax;
  }, variant.frequencyBands[0]);
};

export async function getStaticProps(): Promise<{ props: Props }> {
  const filePath = path.join(process.cwd(), "..", "dataset", "attack_catalog.json");
  const catalog: Omit<AttackDefinition, "frequency_band">[] = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const stats = loadReconciledStats();
  const bands = new Map(stats.by_scenario.map(row => [row.attack_id, row.frequency_band]));
  const attacks = catalog.map(attack => {
    const frequency_band = bands.get(attack.attack_id);
    if (!frequency_band) throw new Error(`Missing reconciled frequency band for ${attack.attack_id}`);
    return { ...attack, frequency_band };
  });
  return { props: { attacks } };
}

const AttackSection = ({
  type,
  familyAttacks,
  index,
  getFrequencyColor,
  getPhaseIcon
}: {
  type: string;
  familyAttacks: AttackDefinition[];
  index: number;
  getFrequencyColor: (val: string) => string;
  getPhaseIcon: (val: string) => React.ReactNode;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const promptVariants = buildPromptVariants(familyAttacks);

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
            <p className="text-gray-400 text-sm">
              {promptVariants.length} displayed prompt configurations across {familyAttacks.length} catalog scenarios.
            </p>
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
                {promptVariants.map((variant) => (
                  <div key={`${type}-${variant.key}`} className="glass rounded-xl p-6 border border-white/5 shadow-xl hover:border-white/10 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                       <div>
                         <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                           <span className="font-mono text-accent font-bold bg-accent/10 px-3 py-1 rounded-md text-sm border border-accent/20 shadow-inner">
                             {variant.attackIds.length} Attack{variant.attackIds.length > 1 ? "s" : ""}
                           </span>
                           <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border flex items-center ${getFrequencyColor(getVariantFrequency(variant))}`}>
                             {getVariantFrequency(variant)} frequency
                           </span>
                           <span className="flex items-center text-xs text-gray-400 bg-white/5 border border-white/10 px-2 py-1 rounded capitalize">
                             {getPhaseIcon(variant.phases[0])} {variant.phases.join(", ")} Phase
                           </span>
                         </div>
                         <p className="text-[11px] text-gray-500 font-mono break-all">
                           Attack IDs: {variant.attackIds.join(", ")}
                         </p>
                       </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-6">
                      <div>
                        <h4 className="flex items-center gap-2 text-[10px] uppercase text-gray-500 mb-2 font-bold tracking-widest">
                          Scenario Type
                        </h4>
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-3 font-mono text-xs text-blue-300 flex items-start gap-2">
                          <span className="w-2 h-2 mt-1 shrink-0 rounded-full bg-blue-500/50" />
                          <span className="break-all sm:break-normal">{variant.scenarioTypes.join(", ")}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="flex items-center gap-2 text-[10px] uppercase text-gray-500 mb-2 font-bold tracking-widest">
                          Targeted Failure Mode
                        </h4>
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-3 font-mono text-xs text-purple-300 flex items-start gap-2">
                          <span className="w-2 h-2 mt-1 shrink-0 rounded-full bg-purple-500/50" />
                          <span className="break-all sm:break-normal">{variant.expectedFailureModes.join(", ")}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] uppercase text-gray-500 mb-2 font-bold tracking-widest">Catalog Prompt Configuration</h4>
                      <div className="bg-[#0f0f0f] p-4 sm:p-5 rounded-xl border border-white/5 font-mono text-[10px] sm:text-xs text-gray-300 whitespace-pre-wrap shadow-inner leading-relaxed overflow-x-auto">
                        {variant.prompt}
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

  const getFrequencyColor = (frequency: string) => {
    switch(frequency.toLowerCase()) {
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
            <p className="text-gray-400 text-sm md:text-lg max-w-3xl">The fixed prompt configurations used in the current cohort. Frequency labels come from reconciled automated judgments and do not measure impact severity. Seed entries display supplied conversation history; this is not evidence of actual memory storage.</p>
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
                getFrequencyColor={getFrequencyColor}
                getPhaseIcon={getPhaseIcon}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
