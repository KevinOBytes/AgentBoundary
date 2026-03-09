import Layout from "../components/Layout";
import SectionCard from "../components/SectionCard";

export default function FrameworkPage() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold">Framework</h1>
      <div className="mt-6 grid gap-6">
        <SectionCard title="Benchmark Harness">
          <p>Python harness executes attacks across configured OpenRouter models and records per-attack safety outcomes.</p>
        </SectionCard>
        <SectionCard title="Persistent Compromise Modeling">
          <p>Latent memory poisoning scenarios include seed, dormancy, and activation phases within campaign state.</p>
        </SectionCard>
        <SectionCard title="Reproducible Outputs">
          <p>Results are written to JSON and CSV for publication, dashboards, and external statistical analysis.</p>
        </SectionCard>
      </div>
    </Layout>
  );
}
