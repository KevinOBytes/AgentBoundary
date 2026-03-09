import fs from "fs";
import path from "path";
import Layout from "../components/Layout";
import type { ResultsFile, MetricSet } from "../types/results";

interface Props {
  data: ResultsFile;
}

export async function getStaticProps(): Promise<{ props: Props }> {
  const filePath = path.join(process.cwd(), "..", "results", "generated", "model_results.json");
  const data: ResultsFile = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return { props: { data } };
}

export default function ResultsPage({ data }: Props) {
  const metrics: MetricSet = data.metrics;
  return (
    <Layout>
      <h1 className="text-3xl font-bold">Results</h1>
      <p className="mt-3 text-gray-300">Latest benchmark snapshot: {data.metadata.attacks} attacks.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {Object.entries(metrics).map(([metric, value]) => (
          <div key={metric} className="rounded-lg border border-gray-800 bg-panel p-4">
            <p className="font-semibold text-accent">{metric}</p>
            <p className="text-sm text-gray-300">{(value * 100).toFixed(2)}%</p>
          </div>
        ))}
      </div>
    </Layout>
  );
}
