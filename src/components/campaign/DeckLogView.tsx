"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ComicHeader, ComicPanel, ErrorPanel } from "@/components/comic/ComicPrimitives";
import { listDeckLogs, upsertDeckLog, type DeckLogRecord } from "@/storage/indexeddb";

export function DeckLogView() {
  const [logs, setLogs] = useState<DeckLogRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLogs(await listDeckLogs());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    let active = true;
    const boot = async () => {
      try {
        const next = await listDeckLogs();
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
    const marvelcdbUrl = String(form.get("marvelcdbUrl") ?? "").trim();
    if (marvelcdbUrl && !/^https:\/\/(marvelcdb\.com|es\.marvelcdb\.com)\//.test(marvelcdbUrl)) {
      setError("Deck URL must be an HTTPS MarvelCDB or Spanish MarvelCDB URL.");
      return;
    }
    await upsertDeckLog({
      heroId: String(form.get("heroId") ?? ""),
      heroName: String(form.get("heroName") ?? ""),
      aspect: String(form.get("aspect") ?? ""),
      scenario: String(form.get("scenario") ?? ""),
      difficulty: String(form.get("difficulty") ?? ""),
      result: String(form.get("result") ?? ""),
      version: String(form.get("version") ?? ""),
      notes: String(form.get("notes") ?? ""),
      ...(marvelcdbUrl ? { marvelcdbUrl } : {})
    });
    event.currentTarget.reset();
    await load();
  };

  return (
    <>
      <ComicHeader eyebrow="Reference" title="Deck log" subtitle="Track deck experiments locally. No deck content is sent anywhere by default." />
      {error ? <ErrorPanel title="Deck log issue"><p>{error}</p></ErrorPanel> : null}
      <div className="split-grid">
        <ComicPanel>
          <form className="form-stack" onSubmit={(event) => void submit(event)}>
            <label>Hero ID<input name="heroId" required /></label>
            <label>Hero name<input name="heroName" required /></label>
            <label>Aspect<input name="aspect" required /></label>
            <label>Scenario<input name="scenario" required /></label>
            <label>Difficulty<input name="difficulty" required /></label>
            <label>Result<input name="result" required /></label>
            <label>Version<input name="version" /></label>
            <label>MarvelCDB URL<input name="marvelcdbUrl" inputMode="url" /></label>
            <label>Notes<textarea name="notes" maxLength={2000} /></label>
            <button type="submit">Add deck log</button>
          </form>
        </ComicPanel>
        <aside className="form-stack">
          {logs.map((log) => (
            <ComicPanel key={log.id}>
              <span className="caption-box">{log.aspect}</span>
              <h2>{log.heroName}</h2>
              <p>{log.scenario} · {log.difficulty} · {log.result}</p>
              <p>{log.notes}</p>
            </ComicPanel>
          ))}
        </aside>
      </div>
    </>
  );
}
