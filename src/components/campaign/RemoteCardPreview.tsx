"use client";

import { useEffect, useState } from "react";
import { ExternalCardImage } from "./ExternalCardImage";

type PreviewState = {
  code: string | null;
  imageUrl: string | null;
  status: "ready" | "unavailable";
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
  const [state, setState] = useState<PreviewState>({ code: null, imageUrl: null, status: "unavailable" });

  useEffect(() => {
    let active = true;
    if (publicImageMode !== "remote" || !code) {
      return;
    }

    const load = async () => {
      try {
        const response = await fetch(`/api/cards/${code}?locale=en`, { cache: "no-store" });
        if (!response.ok) {
          if (active) setState({ code, imageUrl: null, status: "unavailable" });
          return;
        }
        const detail = (await response.json()) as { imageUrl?: unknown };
        const imageUrl = typeof detail.imageUrl === "string" ? detail.imageUrl : null;
        if (active) setState({ code, imageUrl, status: imageUrl ? "ready" : "unavailable" });
      } catch {
        if (active) setState({ code, imageUrl: null, status: "unavailable" });
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [code]);

  const status =
    publicImageMode !== "remote"
      ? "off"
      : !code
        ? "unavailable"
        : state.code === code
          ? state.status
          : "loading";
  const imageUrl = status === "ready" ? state.imageUrl : null;
  const reason =
    status === "loading"
      ? "Checking remote image gate."
      : status === "unavailable"
        ? "Remote image gate is closed or metadata is unavailable."
        : "Card images are disabled by the global launch gate.";

  return (
    <ExternalCardImage
      mode={publicImageMode}
      src={imageUrl}
      alt={`${name}, ${pack} ${collectorNumber}`}
      label={name}
      meta={`${pack} #${collectorNumber}`}
      unavailableReason={reason}
    />
  );
}
