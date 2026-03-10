import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";

type NavItem = {
  label: string;
  href: string;
  isExternal?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Paper", href: "/paper" },
  { label: "Dataset", href: "/dataset" },
  { label: "Prompts", href: "/prompts" },
  { label: "Framework", href: "/framework" },
  { label: "Results", href: "/results" },
  { label: "Documentation", href: "/documentation" },
  { label: "GitHub", href: "https://github.com/agentkillchain/agentkillchain", isExternal: true }
];

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg text-gray-100 selection:bg-accent/30">
      <header className="sticky top-0 z-50 glass border-b-0 border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <img src="/kevinbytes-logo.png" alt="KevinBytes Logo" className="h-8 w-auto object-contain" />
            <span className="text-lg font-bold tracking-tight text-white hidden sm:block">AgentKillChain</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-6 text-sm font-medium">
            {NAV_ITEMS.map((item) => {
              const isActive = router.pathname === item.href;
              return item.isExternal ? (
                <a key={item.label} href={item.href} className="text-gray-400 transition-colors hover:text-white" target="_blank" rel="noreferrer">{item.label}</a>
              ) : (
                <Link key={item.label} href={item.href} className={`transition-colors hover:text-white ${isActive ? "text-accent" : "text-gray-400"}`}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.main
          key={router.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mx-auto max-w-6xl px-6 py-12"
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
