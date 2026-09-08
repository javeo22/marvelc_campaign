"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "";

let client: SupabaseClient | null = null;

export interface SupabasePublicConfig {
  cloudSyncEnabled: boolean;
  configured: boolean;
  missing: string[];
  url: string | null;
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!publicKey) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return {
    cloudSyncEnabled: process.env.NEXT_PUBLIC_CLOUD_SYNC_ENABLED === "true",
    configured: missing.length === 0,
    missing,
    url: url || null
  };
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const config = getSupabasePublicConfig();
  if (!config.configured || !config.url) return null;
  client ??= createClient(config.url, publicKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true
    }
  });
  return client;
}

export function requireSupabaseBrowserClient(): SupabaseClient {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const missing = getSupabasePublicConfig().missing.join(", ");
    throw new Error(`Supabase is not configured for this build. Missing: ${missing}.`);
  }
  return supabase;
}
