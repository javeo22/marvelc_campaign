"use client";

import type { User } from "@supabase/supabase-js";
import { requireSupabaseBrowserClient } from "./client";

const USERNAME_EMAIL_DOMAIN = "core-protocol.invalid";
const USERNAME_PATTERN = /^[a-z0-9_-]{3,32}$/;

export interface AccountSession {
  id: string;
  username: string;
  email: string | null;
}

export function normalizeUsername(input: string): string {
  const username = input.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error("Username must be 3-32 characters: letters, numbers, underscore, or dash.");
  }
  return username;
}

export function usernameToAuthEmail(username: string): string {
  return `${normalizeUsername(username)}@${USERNAME_EMAIL_DOMAIN}`;
}

export function usernameFromAuthEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const suffix = `@${USERNAME_EMAIL_DOMAIN}`;
  if (!email.endsWith(suffix)) return email.split("@")[0] || null;
  return email.slice(0, -suffix.length);
}

export function accountFromUser(user: User): AccountSession {
  const metadata = user.user_metadata as Record<string, unknown>;
  const username = typeof metadata.username === "string" ? normalizeUsername(metadata.username) : usernameFromAuthEmail(user.email) ?? user.id;
  return {
    id: user.id,
    username,
    email: user.email ?? null
  };
}

export async function signInWithUsername(username: string, password: string): Promise<AccountSession> {
  const supabase = requireSupabaseBrowserClient();
  const email = usernameToAuthEmail(username);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Supabase did not return an authenticated user.");
  return accountFromUser(data.user);
}

export async function getCurrentAccount(): Promise<AccountSession | null> {
  const supabase = requireSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return accountFromUser(data.user);
}

export function subscribeToAccount(callback: (account: AccountSession | null) => void): () => void {
  const supabase = requireSupabaseBrowserClient();
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? accountFromUser(session.user) : null);
  });
  return () => data.subscription.unsubscribe();
}

export async function signOutAccount(): Promise<void> {
  const supabase = requireSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
