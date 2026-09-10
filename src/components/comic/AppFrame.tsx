import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, Cog, UserRound } from "lucide-react";
import { PwaController } from "./PwaController";

const navItems = [
  { href: "/", label: "Campaign", icon: BookOpen },
  { href: "/account", label: "Account", icon: UserRound },
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
