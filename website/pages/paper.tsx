import fs from "fs";
import path from "path";
import Layout from "../components/Layout";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

interface PaperPageProps {
  paperContent: string;
  data: any | null;
}

export default function PaperPage({ paperContent, data }: PaperPageProps) {
  return (
    <Layout>
      <motion.article 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="prose prose-invert prose-accent prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-h2:border-b prose-h2:border-gray-800 prose-h2:pb-2 prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-code:text-accent prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-pre:bg-black prose-pre:border prose-pre:border-white/10 prose-blockquote:border-l-accent prose-blockquote:bg-white/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:text-gray-300 max-w-4xl mx-auto bg-panel p-8 md:p-12 rounded-2xl border border-white/5 shadow-2xl shadow-black/50"
      >
        <ReactMarkdown>{paperContent}</ReactMarkdown>

        {data && (
          <div className="mt-16 pt-8 border-t border-white/5">
            <h2 className="text-2xl font-bold text-white mb-6">Empirical Findings</h2>
            <div className="overflow-x-auto not-prose">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-white/5 text-xs uppercase text-gray-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">Model</th>
                    <th className="px-4 py-3 font-medium text-right">Inj. Success %</th>
                    <th className="px-4 py-3 font-medium text-right">Exfil %</th>
                    <th className="px-4 py-3 font-medium text-right">Overall Vuln</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {Object.entries(data.metrics_by_model)
                    .sort(([, a]: any, [, b]: any) => a.overall_vulnerability_score - b.overall_vulnerability_score)
                    .map(([model, m]: [string, any]) => (
                    <tr key={model} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono text-accent">{model.split('/').pop()}</td>
                      <td className="px-4 py-3 text-right">{(m.injection_success_rate * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right">{(m.data_exfiltration_rate * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right font-bold text-white">{(m.overall_vulnerability_score * 100).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-center text-gray-500">Live data generation from evaluation suite</p>
          </div>
        )}
      </motion.article>
    </Layout>
  );
}

export async function getStaticProps() {
  const paperPath = path.join(process.cwd(), "..", "docs", "whitepaper.md");
  const dataPath = path.join(process.cwd(), "..", "results", "generated", "model_results.json");
  
  let paperContent = "";
  let data = null;

  try { paperContent = fs.readFileSync(paperPath, "utf8"); } catch (e) {}
  try { data = JSON.parse(fs.readFileSync(dataPath, "utf8")); } catch (e) {}

  return {
    props: {
      paperContent,
      data
    },
  };
}
