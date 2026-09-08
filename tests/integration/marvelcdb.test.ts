import { describe, expect, it } from "vitest";
import { searchLocalCards } from "@/integrations/marvelcdb/local-card-search";
import { imagesAllowed, normalizeMarvelCard } from "@/integrations/marvelcdb/normalize";

describe("local bilingual card search", () => {
  it("matches accents, punctuation, English, Spanish, and collector numbers", () => {
    expect(searchLocalCards({ q: "MODOK" }).hits[0]?.record.name_en).toBe("M.O.D.O.K.");
    expect(searchLocalCards({ q: "civiles peligro" }).hits[0]?.record.name_en).toBe("Under Attack");
    expect(searchLocalCards({ q: "01001a" }).hits[0]?.record.name_en).toBe("Spider-Man");
    expect(searchLocalCards({ q: "Ultron" }).hits.length).toBeGreaterThan(0);
  });
});

describe("MarvelCDB metadata normalization", () => {
  const raw = {
    code: "01001a",
    name: "Spider-Man",
    pack_code: "core",
    pack_name: "Core Set",
    type_name: "Hero",
    url: "https://marvelcdb.com/card/01001a",
    imagesrc: "/bundles/cards/01001a.png",
    linked_card: { imagesrc: "/bundles/cards/01001b.png" }
  };

  it("returns no image URLs when either kill switch is off", () => {
    const detail = normalizeMarvelCard(raw, "en", "https://marvelcdb.com", {
      publicMode: "off",
      serverEnabled: true,
      allowedHosts: ["marvelcdb.com"]
    });
    expect(detail.imageUrl).toBeNull();
    expect(imagesAllowed({ publicMode: "remote", serverEnabled: false, allowedHosts: ["marvelcdb.com"] })).toBe(false);
  });

  it("resolves same-host relative image URLs only when both switches are enabled", () => {
    const detail = normalizeMarvelCard(raw, "en", "https://marvelcdb.com", {
      publicMode: "remote",
      serverEnabled: true,
      allowedHosts: ["marvelcdb.com"]
    });
    expect(detail.imageUrl).toBe("https://marvelcdb.com/bundles/cards/01001a.png");
    expect(detail.backImageUrl).toBe("https://marvelcdb.com/bundles/cards/01001b.png");
    expect(detail.mayCacheImages).toBe(false);
  });

  it("rejects cross-host and non-https image URLs", () => {
    const detail = normalizeMarvelCard({ ...raw, imagesrc: "http://evil.test/card.png", backimagesrc: "https://cdn.test/card.png" }, "en", "https://marvelcdb.com", {
      publicMode: "remote",
      serverEnabled: true,
      allowedHosts: ["marvelcdb.com"]
    });
    expect(detail.imageUrl).toBeNull();
    expect(detail.backImageUrl).toBeNull();
  });
});
