"use client";

import { useCallback, useEffect, useState } from "react";
import type { CampaignSave } from "@/domain/types";
import { appendCampaignEvents, getCampaignSave, type EventDescriptor } from "@/storage/indexeddb";

export function useCampaignSave(saveId: string) {
  const [save, setSave] = useState<CampaignSave | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getCampaignSave(saveId);
      setSave(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [saveId]);

  const append = useCallback(
    async (descriptors: EventDescriptor[]) => {
      setError(null);
      try {
        const next = await appendCampaignEvents(saveId, descriptors);
        setSave(next);
        return next;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      }
    },
    [saveId]
  );

  useEffect(() => {
    let active = true;
    const boot = async () => {
      try {
        const next = await getCampaignSave(saveId);
        if (active) setSave(next);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (active) setLoading(false);
      }
    };
    void boot();
    return () => {
      active = false;
    };
  }, [saveId]);

  return { save, loading, error, reload, append };
}
