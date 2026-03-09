import { ReactNode } from "react";

export default function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-800 bg-panel p-6">
      <h2 className="mb-3 text-xl font-semibold text-accent">{title}</h2>
      <div className="space-y-2 text-gray-300">{children}</div>
    </section>
  );
}
