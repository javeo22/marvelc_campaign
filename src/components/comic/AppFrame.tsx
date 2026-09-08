import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, ClipboardList, Cog, Library, Map } from "lucide-react";
import { PwaController } from "./PwaController";

const navItems = [
  { href: "/", label: "Campaign", icon: BookOpen },
  { href: "/cards", label: "Cards", icon: Library },
  { href: "/decks", label: "Decks", icon: ClipboardList },
  { href: "/rules", label: "Rules", icon: Map },
  { href: "/settings", label: "Settings", icon: Cog }
];

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <a className="skip-link button" href="#main">
        Skip to content
      </a>
      <main id="main" className="app-main">
        <PwaController />
        {children}
      </main>
      <nav className="shell-nav" aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link href={item.href} key={item.href}>
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
