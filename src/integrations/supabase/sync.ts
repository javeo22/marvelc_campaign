import type { CampaignSave } from "@/domain/types";

export type SupabaseSyncStatus =
  | { enabled: false; configured: boolean; reason: "feature_flag_disabled" }
  | { enabled: true; configured: false; reason: "missing_public_config" }
  | { enabled: true; configured: true; reason: "auth_not_configured" };

export function getSupabaseSyncStatus(): SupabaseSyncStatus {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF);
  if (process.env.NEXT_PUBLIC_CLOUD_SYNC_ENABLED !== "true") {
    return { enabled: false, configured, reason: "feature_flag_disabled" };
  }
  if (!configured) return { enabled: true, configured: false, reason: "missing_public_config" };
  return { enabled: true, configured: true, reason: "auth_not_configured" };
}

export async function pushCampaignSave(save: CampaignSave): Promise<never> {
  void save;
  throw new Error("Supabase sync is not configured. Local IndexedDB saves remain authoritative.");
}

export async function pullCampaignSave(saveId: string): Promise<never> {
  void saveId;
  throw new Error("Supabase sync is not configured. Local IndexedDB saves remain authoritative.");
}
