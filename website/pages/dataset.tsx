import fs from "fs";
import path from "path";
import Layout from "../components/Layout";
import { motion } from "framer-motion";
import { Database, ShieldAlert, Activity, Target } from "lucide-react";

interface Attack {
  attack_id: string;
  campaign_id: string;
  attack_type: string;
  payload: string;
  trigger_condition: string;
  expected_behavior: string;
  severity: string;
  phase: string;
}

interface Props {
  attacks: Attack[];
}

export async function getStaticProps(): Promise<{ props: Props }> {
  const filePath = path.join(process.cwd(), "..", "dataset", "attack_catalog.json");
  const attacks: Attack[] = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return { props: { attacks } };
}

export default function DatasetPage({ attacks }: Props) {
  const byType = attacks.reduce<Record<string, number>>((acc, attack) => {
    acc[attack.attack_type] = (acc[attack.attack_type] || 0) + 1;
    return acc;
  }, {});
  
  const bySeverity = attacks.reduce<Record<string, number>>((acc, attack) => {
    acc[attack.severity] = (acc[attack.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-10 flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-xl">
            <Database className="text-accent" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Attack Dataset</h1>
            <p className="mt-2 text-gray-400">Comprehensive catalog of {attacks.length} generated test cases for multi-turn agent compromise.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Target className="text-accent" size={20} />
              <h3 className="font-semibold text-white">By Vector</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(byType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-mono">{type}</span>
                  <span className="text-white font-medium bg-white/5 px-2 py-1 rounded">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="text-orange-400" size={20} />
              <h3 className="font-semibold text-white">By Severity</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(bySeverity).map(([sev, count]) => (
                <div key={sev} className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 capitalize">{sev}</span>
                  <span className="text-white font-medium bg-white/5 px-2 py-1 rounded">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass p-6 rounded-2xl flex flex-col justify-center items-center text-center">
            <Activity className="text-accent mb-4" size={32} />
            <h3 className="text-3xl font-bold text-white mb-2">{attacks.length}</h3>
            <p className="text-gray-400 text-sm">Total Scenarios</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-6">Scenario Preview</h2>
        <div className="glass rounded-2xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-white/5 text-xs uppercase text-gray-300">
                <tr>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Phase</th>
                  <th className="px-6 py-4 font-medium">Severity</th>
                  <th className="px-6 py-4 font-medium">Trigger</th>
                  <th className="px-6 py-4 font-medium">Expected Behavior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {attacks.slice(0, 15).map((attack, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-accent">{attack.attack_type}</td>
                    <td className="px-6 py-4">{attack.phase}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${attack.severity === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-orange-500/20 text-orange-300'}`}>
                        {attack.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">{attack.trigger_condition}</td>
                    <td className="px-6 py-4">{attack.expected_behavior}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-black/40 text-center text-sm text-gray-500 border-t border-white/5">
            Showing first 15 of {attacks.length} records. Download the dataset for full access.
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
