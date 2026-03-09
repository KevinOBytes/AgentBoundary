import fs from "fs";
import path from "path";
import Layout from "../components/Layout";

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
