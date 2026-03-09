import Layout from "../components/Layout";
import attacks from "../../dataset/attack_catalog.json";

const byType = attacks.reduce<Record<string, number>>((acc, attack) => {
  acc[attack.attack_type] = (acc[attack.attack_type] || 0) + 1;
  return acc;
}, {});

export default function DatasetPage() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold">Dataset</h1>
      <p className="mt-3 text-gray-300">Structured attack catalog with {attacks.length} scenarios.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {Object.entries(byType).map(([attackType, count]) => (
          <div key={attackType} className="rounded-lg border border-gray-800 bg-panel p-4">
            <p className="font-semibold text-accent">{attackType}</p>
            <p className="text-sm text-gray-300">{count} attacks</p>
          </div>
        ))}
      </div>
    </Layout>
  );
}
