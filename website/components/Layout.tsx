import { ReactNode } from "react";
import Link from "next/link";

type NavItem = {
  label: string;
  href: string;
  isExternal?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Paper", href: "/paper" },
  { label: "Dataset", href: "/dataset" },
  { label: "Framework", href: "/framework" },
  { label: "Results", href: "/results" },
  { label: "Documentation", href: "/documentation" },
  { label: "GitHub", href: "https://github.com/agentkillchain/agentkillchain", isExternal: true }
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-gray-100">
      <header className="border-b border-gray-800 bg-panel/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-4 px-6 py-4 text-sm">
          {NAV_ITEMS.map((item) => (
            item.isExternal ? (
              <a key={item.label} href={item.href} className="hover:text-accent" target="_blank" rel="noreferrer">{item.label}</a>
            ) : (
              <Link key={item.label} href={item.href} className="hover:text-accent">{item.label}</Link>
            )
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
