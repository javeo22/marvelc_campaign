import type { ReactNode } from "react";

export function ComicHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  tone = "neutral"
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  tone?: "neutral" | "intel" | "network" | "danger" | "success";
}) {
  return (
    <header className="comic-header" data-tone={tone}>
      {eyebrow ? <span className="comic-header__eyebrow">{eyebrow}</span> : null}
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {actions ? <div className="chip-row" style={{ marginTop: "1rem" }}>{actions}</div> : null}
    </header>
  );
}

export function ComicPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`comic-panel ${className}`}>{children}</section>;
}

export function CaptionBox({ children }: { children: ReactNode }) {
  return <span className="caption-box">{children}</span>;
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="empty-state">
      <CaptionBox>Empty</CaptionBox>
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

export function ErrorPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="error-panel" role="alert">
      <CaptionBox>Recovery</CaptionBox>
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}
