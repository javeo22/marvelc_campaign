export type LoginProvider = "github" | "google";
export interface CloudConfigStatus {
  enabled: boolean;
  configured: boolean;
  providers: LoginProvider[];
}

export function cloudConfigStatus(env: Record<string, string | undefined> = process.env): CloudConfigStatus {
  const providers: LoginProvider[] = [];
  if (env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET) providers.push("github");
  if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) providers.push("google");
  let validUrl = false;
  let validDatabase = false;
  try {
    const url = new URL(env.NEXTAUTH_URL ?? "");
    validUrl = url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
    const db = new URL(env.DATABASE_URL ?? "");
    validDatabase = ["postgres:", "postgresql:"].includes(db.protocol);
  } catch { /* Missing or invalid optional configuration disables cloud only. */ }
  return {
    enabled: env.NEXT_PUBLIC_CLOUD_SYNC_ENABLED === "true",
    configured: Boolean(validUrl && validDatabase && env.NEXTAUTH_SECRET && env.NEXTAUTH_SECRET.length >= 32 && providers.length),
    providers
  };
}
