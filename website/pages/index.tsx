import Layout from "../components/Layout";
import DiagramCard from "../components/DiagramCard";

const lifecycle = `Initial Access -> Execution -> Persistence -> Latent Activation -> Escalation -> Exfiltration`;
const architecture = `User Input / Memory / Planner / Tool Router / External Tools / Data Stores`;
const latentTimeline = `Session 1: Seed -> Session 2..N: Dormancy -> Session N+1: Trigger Activation`;
const toolFlow = `Malicious prompt -> Tool selection confusion -> Dangerous invocation -> Data exposure`;

export default function Home() {
  return (
    <Layout>
      <section className="mb-10">
        <h1 className="text-4xl font-bold">AgentKillChain</h1>
        <p className="mt-3 max-w-3xl text-lg text-gray-300">
          A framework for evaluating security vulnerabilities in autonomous AI agents.
        </p>
        <p className="mt-3 text-sm text-gray-400">
          Canonical publication: agentkillchain.com and kevinbytes.com/research/agentkillchain
        </p>
      </section>
      <section className="grid gap-6 md:grid-cols-2">
        <DiagramCard title="AgentKillChain lifecycle" content={lifecycle} />
        <DiagramCard title="Agent architecture attack surface" content={architecture} />
        <DiagramCard title="Latent prompt injection timeline" content={latentTimeline} />
        <DiagramCard title="Toolchain confusion attack flow" content={toolFlow} />
      </section>
    </Layout>
  );
}
