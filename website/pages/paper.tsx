import fs from "fs";
import path from "path";
import Layout from "../components/Layout";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

interface PaperPageProps {
  paperContent: string;
}

export default function PaperPage({ paperContent }: PaperPageProps) {
  return (
    <Layout>
      <motion.article 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="prose prose-invert prose-accent prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-h2:border-b prose-h2:border-gray-800 prose-h2:pb-2 prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-code:text-accent prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-pre:bg-black prose-pre:border prose-pre:border-white/10 prose-blockquote:border-l-accent prose-blockquote:bg-white/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:text-gray-300 max-w-4xl mx-auto bg-panel p-8 md:p-12 rounded-2xl border border-white/5 shadow-2xl shadow-black/50"
      >
        <ReactMarkdown>{paperContent}</ReactMarkdown>
      </motion.article>
    </Layout>
  );
}

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), "..", "docs", "whitepaper.md");
  const paperContent = fs.readFileSync(filePath, "utf8");

  return {
    props: {
      paperContent,
    },
  };
}
