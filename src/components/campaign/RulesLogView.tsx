"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ComicHeader, ComicPanel, ErrorPanel } from "@/components/comic/ComicPrimitives";
import { listRulesLogs, upsertRulesLog, type RulesLogRecord } from "@/storage/indexeddb";

export function RulesLogView() {
  const [logs, setLogs] = useState<RulesLogRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLogs(await listRulesLogs());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    let active = true;
    const boot = async () => {
      try {
        const next = await listRulesLogs();
        if (active) setLogs(next);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : String(err));
      }
    };
    void boot();
    return () => {
      active = false;
    };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await upsertRulesLog({
      topic: String(form.get("topic") ?? ""),
      ruling: String(form.get("ruling") ?? ""),
      bilingualExample: String(form.get("bilingualExample") ?? ""),
      status: form.get("status") === "verified" ? "verified" : "personal",
      source: String(form.get("source") ?? ""),
      notes: String(form.get("notes") ?? "")
    });
    event.currentTarget.reset();
    await load();
  };

  return (
    <>
      <ComicHeader eyebrow="Reference" title="Rules log" subtitle="Personal notes are visibly separate from verified rulings." />
      {error ? <ErrorPanel title="Rules log issue"><p>{error}</p></ErrorPanel> : null}
      <div className="split-grid">
        <ComicPanel>
          <form className="form-stack" onSubmit={(event) => void submit(event)}>
            <label>Topic<input name="topic" required /></label>
            <label>Practical ruling<textarea name="ruling" maxLength={2000} required /></label>
            <label>Bilingual example<input name="bilingualExample" /></label>
            <label>Status<select name="status"><option value="personal">Personal note</option><option value="verified">Verified</option></select></label>
            <label>Source<input name="source" /></label>
            <label>Notes<textarea name="notes" maxLength={2000} /></label>
            <button type="submit">Add rules note</button>
          </form>
        </ComicPanel>
        <aside className="form-stack">
          {logs.map((log) => (
            <ComicPanel key={log.id}>
              <span className="caption-box">{log.status === "verified" ? "Verified" : "Personal"}</span>
              <h2>{log.topic}</h2>
              <p>{log.ruling}</p>
              <p className="small">{log.bilingualExample}</p>
            </ComicPanel>
          ))}
        </aside>
      </div>
    </>
  );
}
