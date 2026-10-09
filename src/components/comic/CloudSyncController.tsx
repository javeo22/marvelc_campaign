"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cloudFeatureEnabled } from "@/integrations/cloud/client";
import { CLOUD_SYNC_EVENT, synchronizeLinkedSaves, type SyncNotice } from "@/integrations/cloud/sync";
import { CAMPAIGN_SAVES_CHANGED_EVENT } from "@/storage/indexeddb";

export function CloudSyncController() {
  const [notice, setNotice] = useState<SyncNotice | null>(null);
  useEffect(() => {
    if (!cloudFeatureEnabled()) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { void synchronizeLinkedSaves(); }, 1500);
    };
    const notify = (event: Event) => setNotice((event as CustomEvent<SyncNotice>).detail);
    window.addEventListener("online", schedule);
    window.addEventListener("focus", schedule);
    window.addEventListener(CAMPAIGN_SAVES_CHANGED_EVENT, schedule);
    window.addEventListener(CLOUD_SYNC_EVENT, notify);
    const interval = setInterval(() => { if (document.visibilityState === "visible") schedule(); }, 30000);
    schedule();
    return () => {
      clearTimeout(timer); clearInterval(interval);
      window.removeEventListener("online", schedule); window.removeEventListener("focus", schedule);
      window.removeEventListener(CAMPAIGN_SAVES_CHANGED_EVENT, schedule); window.removeEventListener(CLOUD_SYNC_EVENT, notify);
    };
  }, []);
  return notice?.error ? <div className="status-banner" role="status">{notice.message} <Link href="/account">Manage cloud saves</Link></div> : null;
}
