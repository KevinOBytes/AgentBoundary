import fs from "fs";
import path from "path";
import Link from "next/link";
import Layout from "../components/Layout";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import { loadReconciledStats } from "../lib/load-results";
import { interval, paperLinkUrl, percent } from "../lib/results";
import type { ReconciledStats } from "../types/results";

interface Props { paperContent: string; data: ReconciledStats }

export async function getStaticProps(): Promise<{ props: Props }> {
  const paperContent = fs.readFileSync(path.join(process.cwd(), "..", "docs", "whitepaper.md"), "utf8");
  return { props: { paperContent, data: loadReconciledStats() } };
}

export default function PaperPage({ paperContent, data }: Props) {
  const { coverage, overall, metadata } = data;
  return (
    <Layout>
      <div className="max-w-4xl mx-auto mb-8 text-gray-300">
        <p>{metadata.model_count} model endpoints; {metadata.catalog_scenarios} scenarios; {coverage.recorded_evaluations} retained records; {overall.n} scorable responses.</p>
        <p className="text-sm mt-2">Reconciled automated compliance: {overall.complied}/{overall.n} ({percent(overall.compliance_rate)}; 95% Wilson CI {interval(overall.compliance_ci_low, overall.compliance_ci_high)}). {coverage.excluded_evaluations} empty response excluded; {coverage.missing_evaluations} planned evaluations absent.</p>
        <div className="flex flex-wrap gap-5 mt-4"><a href="/agentboundary-paper.pdf" className="text-accent hover:underline">Download PDF</a><Link href="/results" className="text-accent hover:underline">Results and uncertainty</Link><Link href="/dataset" className="text-accent hover:underline">Coverage and source artifacts</Link></div>
      </div>
      <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="prose prose-invert prose-accent prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-accent prose-strong:text-white prose-code:text-accent prose-pre:bg-black prose-pre:border prose-pre:border-white/10 max-w-4xl mx-auto bg-panel p-8 md:p-12 rounded-2xl border border-white/5 shadow-2xl shadow-black/50">
        <ReactMarkdown skipHtml remarkPlugins={[remarkGfm]} components={{ a: ({ href, children }) => <a href={paperLinkUrl(href)}>{children}</a> }}>{paperContent}</ReactMarkdown>
      </motion.article>
    </Layout>
  );
}
