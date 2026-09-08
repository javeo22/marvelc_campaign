"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ComicHeader, ComicPanel } from "@/components/comic/ComicPrimitives";
import { searchLocalCards } from "@/integrations/marvelcdb/local-card-search";
import { RemoteCardPreview } from "./RemoteCardPreview";

export function CardSearch() {
  const [query, setQuery] = useState("");
  const result = useMemo(() => searchLocalCards({ q: query, locale: "both", limit: 30 }), [query]);

  return (
    <>
      <ComicHeader
        eyebrow="Reference"
        title="Bilingual card search"
        subtitle="Search English or Spanish public metadata from the bundled tracker export. MarvelCDB live details are optional."
      />
      <ComicPanel>
        <label>
          Search cards, sets, packs, or collector numbers
          <div className="counter-control" style={{ gridTemplateColumns: "1fr auto" }}>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="MODOK, Civiles, 01001a, Under Attack" />
            <button type="button" aria-label="Search"><Search aria-hidden="true" /></button>
          </div>
        </label>
      </ComicPanel>
      <div className="form-stack">
        {result.hits.map((hit) => (
          <ComicPanel className="card-search-result" key={hit.record.record_id}>
            <div className="card-result-grid">
              <RemoteCardPreview
                code={hit.record.marvelcdb_code}
                name={hit.record.name_en}
                pack={hit.record.pack_en}
                collectorNumber={hit.record.collector_number}
              />
              <div className="card-result-copy">
                <span className="caption-box">{hit.record.category}</span>
                <h2>{hit.record.name_en} · {hit.record.name_es}</h2>
                <p>{hit.record.pack_en} · {hit.record.pack_es} · #{hit.record.collector_number}</p>
                <p className="small">{hit.record.set_en} · {hit.record.set_es}</p>
                <p className="small">Match status: {hit.record.match_status}</p>
                <div className="chip-row">
                  <a className="button" href={hit.record.source_en} target="_blank" rel="noreferrer">English source</a>
                  <a className="button" href={hit.record.source_es} target="_blank" rel="noreferrer">Spanish source</a>
                  {hit.record.marvelcdb_code ? <a className="button" href={`/api/cards/${hit.record.marvelcdb_code}`}>Metadata JSON</a> : null}
                </div>
              </div>
            </div>
          </ComicPanel>
        ))}
      </div>
    </>
  );
}
