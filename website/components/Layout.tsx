import { ReactNode } from "react";
import Link from "next/link";

const NAV_ITEMS = [
  ["Home", "/"],
  ["Paper", "/paper"],
  ["Dataset", "/dataset"],
  ["Framework", "/framework"],
  ["Results", "/results"],
  ["Documentation", "/documentation"],
  ["GitHub", "https://github.com/agentkillchain/agentkillchain"]
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-gray-100">
      <header className="border-b border-gray-800 bg-panel/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-4 px-6 py-4 text-sm">
          {NAV_ITEMS.map(([label, href]) => (
            href.startsWith("http") ? (
              <a key={label} href={href} className="hover:text-accent" target="_blank" rel="noreferrer">{label}</a>
            ) : (
              <Link key={label} href={href} className="hover:text-accent">{label}</Link>
            )
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
