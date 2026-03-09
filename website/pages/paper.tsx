import fs from "fs";
import path from "path";
import Layout from "../components/Layout";
import ReactMarkdown from "react-markdown";

interface PaperPageProps {
  paperContent: string;
}

export default function PaperPage({ paperContent }: PaperPageProps) {
  return (
    <Layout>
      <div className="prose prose-invert prose-accent max-w-none">
        <ReactMarkdown>{paperContent}</ReactMarkdown>
      </div>
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
