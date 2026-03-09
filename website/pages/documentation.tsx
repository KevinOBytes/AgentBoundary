import Layout from "../components/Layout";

const docs = [
  ["Whitepaper", "../../docs/whitepaper.md"],
  ["Methodology", "../../docs/methodology.md"],
  ["Taxonomy", "../../docs/attack_taxonomy.md"],
  ["Mitigations", "../../docs/mitigation_guidelines.md"]
];

export default function DocumentationPage() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold">Documentation</h1>
      <ul className="mt-6 space-y-3">
        {docs.map(([title, path]) => (
          <li key={title} className="rounded-lg border border-gray-800 bg-panel p-4">
            <p className="font-semibold text-accent">{title}</p>
            <p className="text-sm text-gray-300">Source: {path}</p>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
