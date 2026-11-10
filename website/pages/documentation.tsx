import Layout from "../components/Layout";
import { sourceUrl } from "../lib/results";

const docs = [
  ["Paper", "docs/whitepaper.md"],
  ["Submission Plan", "docs/preprint_submission.md"],
  ["Methodology", "docs/methodology.md"],
  ["Taxonomy", "docs/attack_taxonomy.md"],
  ["Mitigations", "docs/mitigation_guidelines.md"],
  ["Reconciled Results", "results/reconciled_stats.md"],
  ["Source Provenance", "docs/PROVENANCE.md"],
  ["Human Validation Protocol", "docs/HUMAN_VALIDATION_PROTOCOL.md"]
];

export default function DocumentationPage() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold">Documentation</h1>
      <ul className="mt-6 space-y-3">
        {docs.map(([title, path]) => (
          <li key={title} className="rounded-lg border border-gray-800 bg-panel p-4">
            <a href={sourceUrl(path)} className="font-semibold text-accent hover:underline">{title}</a>
            <p className="text-sm text-gray-300">Source: {path}</p>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
