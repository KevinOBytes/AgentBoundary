import Layout from "../components/Layout";

export default function PaperPage() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold">Paper</h1>
      <p className="mt-4 text-gray-300">
        AgentKillChain introduces a persistent-compromise evaluation model centered on latent prompt injection via memory poisoning across sessions.
      </p>
      <p className="mt-2 text-gray-400">See docs/whitepaper.md for the complete manuscript draft.</p>
    </Layout>
  );
}
