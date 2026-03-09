export default function DiagramCard({ title, content }: { title: string; content: string }) {
  return (
    <section className="rounded-xl border border-gray-800 bg-panel p-5 shadow-lg shadow-black/30">
      <h3 className="mb-3 text-lg font-semibold text-accent">{title}</h3>
      <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-gray-300">{content}</pre>
    </section>
  );
}
