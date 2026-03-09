import Layout from "../components/Layout";
import results from "../../results/model_results.json";

export default function ResultsPage() {
  const metrics = results.metrics as Record<string, number>;
  return (
    <Layout>
      <h1 className="text-3xl font-bold">Results</h1>
      <p className="mt-3 text-gray-300">Latest benchmark snapshot: {results.metadata.attacks} attacks.</p>
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
