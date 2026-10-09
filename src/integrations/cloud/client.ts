"use client";
import { getSession, signIn, signOut } from "next-auth/react";
import type { CloudConfigStatus, LoginProvider } from "./config";
import type { CampaignSave } from "@/domain/types";
import { checksumSync } from "@/storage/checksum";
import { validateCloudSave, type CloudSaveSummary } from "./saves";
export type { CloudSaveSummary } from "./saves";
export interface AccountSession { id: string; username: string }
export class SyncRequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function cloudRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/cloud/${path}`, { ...init, cache: "no-store", credentials: "same-origin" });
  const result = await response.json();
  if (!response.ok) throw new SyncRequestError(response.status, result.error ?? "Cloud sync failed. Local saves are safe.");
  return result as T;
}
export function cloudFeatureEnabled() { return process.env.NEXT_PUBLIC_CLOUD_SYNC_ENABLED === "true"; }
export async function getCloudStatus(): Promise<CloudConfigStatus> {
  if (!cloudFeatureEnabled()) return { enabled: false, configured: false, providers: [] };
  return cloudRequest("status");
}
export async function getCurrentAccount(): Promise<AccountSession | null> {
  if (!cloudFeatureEnabled()) return null;
  const session = await getSession();
  return session?.user?.id ? { id: session.user.id, username: session.user.name ?? "Player" } : null;
}
export async function signInAccount(provider: LoginProvider) { await signIn(provider, { callbackUrl: "/account" }); }
export async function signOutAccount() { await signOut({ redirect: false }); }
export function listCloudCampaignSaves() { return cloudRequest<CloudSaveSummary[]>("saves"); }
export async function pullCampaignSave(saveId: string, ownerId?: string) {
  const result = await cloudRequest<{ save: CampaignSave; revision: number; cloudUpdatedAt: string }>(`saves/${encodeURIComponent(saveId)}`, { headers: ownerId ? { "X-Cloud-Account": ownerId } : {} });
  return { ...result, save: validateCloudSave(result.save) };
}
export async function pushCampaignSave(save: CampaignSave, expectedRevision: number | null, ownerId?: string) {
  return cloudRequest<{ revision: number; cloudUpdatedAt: string }>(`saves/${encodeURIComponent(save.saveId)}`, {
    method: "PUT", headers: { "Content-Type": "application/json", ...(ownerId ? { "X-Cloud-Account": ownerId } : {}) }, body: JSON.stringify({ save: { ...save, checksum: checksumSync({ snapshot: save.snapshot, events: save.events }) }, expectedRevision })
  });
}
