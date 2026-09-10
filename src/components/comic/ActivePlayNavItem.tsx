"use client";

import Link from "next/link";
import { Swords } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CAMPAIGN_SAVES_CHANGED_EVENT, listCampaignSaves } from "@/storage/indexeddb";

export function ActivePlayNavItem() {
  const [saveId, setSaveId] = useState<string | null>(null);
  const pathname = usePathname();
  const pathSaveId = pathname.match(/^\/campaigns\/([^/]+)\/play$/)?.[1] ?? null;

  const refresh = useCallback(async () => {
    try {
      const active = (await listCampaignSaves()).find((save) => save.phase === "in-progress");
      setSaveId(active?.saveId ?? null);
    } catch {
      setSaveId(null);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void refresh());
    window.addEventListener(CAMPAIGN_SAVES_CHANGED_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(CAMPAIGN_SAVES_CHANGED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [pathname, refresh]);

  const activeSaveId = pathSaveId ?? saveId;
  if (!activeSaveId) return null;

  return (
    <Link href={`/campaigns/${activeSaveId}/play`}>
      <Swords aria-hidden="true" />
      <span>Play</span>
    </Link>
  );
}
