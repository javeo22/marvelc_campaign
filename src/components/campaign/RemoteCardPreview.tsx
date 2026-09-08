"use client";

import { useEffect, useState } from "react";
import { ExternalCardImage } from "./ExternalCardImage";

type PreviewState = {
  imageUrl: string | null;
  status: "off" | "loading" | "ready" | "unavailable";
};

const publicImageMode = process.env.NEXT_PUBLIC_CARD_IMAGE_MODE === "remote" ? "remote" : "off";

export function RemoteCardPreview({
  code,
  name,
  pack,
  collectorNumber
}: {
  code: string | null;
  name: string;
  pack: string;
  collectorNumber: string;
}) {
  const [state, setState] = useState<PreviewState>({ imageUrl: null, status: publicImageMode === "remote" ? "loading" : "off" });

  useEffect(() => {
    let active = true;
    if (publicImageMode !== "remote" || !code) {
      return;
    }

    const load = async () => {
      try {
        const response = await fetch(`/api/cards/${code}?locale=en`, { cache: "no-store" });
        if (!response.ok) {
          if (active) setState({ imageUrl: null, status: "unavailable" });
          return;
        }
        const detail = (await response.json()) as { imageUrl?: unknown };
        const imageUrl = typeof detail.imageUrl === "string" ? detail.imageUrl : null;
        if (active) setState({ imageUrl, status: imageUrl ? "ready" : "unavailable" });
      } catch {
        if (active) setState({ imageUrl: null, status: "unavailable" });
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [code]);

  const reason =
    state.status === "loading"
      ? "Checking remote image gate."
      : state.status === "unavailable"
        ? "Remote image gate is closed or metadata is unavailable."
        : "Card images are disabled by the global launch gate.";

  return (
    <ExternalCardImage
      mode={publicImageMode}
      src={state.imageUrl}
      alt={`${name}, ${pack} ${collectorNumber}`}
      label={name}
      meta={`${pack} #${collectorNumber}`}
      unavailableReason={reason}
    />
  );
}
