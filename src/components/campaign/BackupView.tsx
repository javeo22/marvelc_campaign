"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { ComicHeader, ComicPanel, ErrorPanel } from "@/components/comic/ComicPrimitives";
import { exportJson, importEnvelope, parseImportJson } from "@/storage/export-import";

export function BackupView({ saveId }: { saveId?: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runExport = async () => {
    setError(null);
    const text = await exportJson(saveId);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `core-protocol-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Export created. It contains events, snapshots, settings, and logs. It contains no images.");
  };

  const runImport = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setStatus(null);
    try {
      const envelope = await parseImportJson(await file.text());
      const result = await importEnvelope(envelope);
      setStatus(`Imported ${result.importedSaveCount} save(s). ${result.actions.join(" ")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <>
      <ComicHeader eyebrow="Backup" title="Export and import" subtitle="Backups are plain JSON and exclude bundled content, metadata caches, and every image binary." />
      {status ? <div className="status-banner" role="status">{status}</div> : null}
      {error ? <ErrorPanel title="Backup action failed"><p>{error}</p></ErrorPanel> : null}
      <div className="split-grid">
        <ComicPanel>
          <span className="caption-box">Export</span>
          <h2>{saveId ? "Selected save" : "All local data"}</h2>
          <p>Includes append-only events and the derived snapshot checksum for recovery checks.</p>
          <button type="button" onClick={() => void runExport()}><Download aria-hidden="true" /> Export JSON</button>
        </ComicPanel>
        <ComicPanel>
          <span className="caption-box">Import</span>
          <h2>Validate before writing</h2>
          <p>Imports are size-limited, schema-checked, migrated, and written only after preflight succeeds.</p>
          <label>
            Choose backup JSON
            <input type="file" accept="application/json" onChange={(event) => void runImport(event.target.files?.[0] ?? null)} />
          </label>
          <button type="button" disabled><Upload aria-hidden="true" /> Awaiting file</button>
        </ComicPanel>
      </div>
    </>
  );
}
