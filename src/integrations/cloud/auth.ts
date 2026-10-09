import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

// The immutable provider subject, never an email or display name, owns saves.
export function accountIdentity(provider: string, providerAccountId: string): string {
  if (!["github", "google"].includes(provider) || !providerAccountId) throw new Error("Unsupported account identity.");
  return `${provider}:${providerAccountId}`;
}

export function authOptions(): NextAuthOptions {
  const providers: NextAuthOptions["providers"] = [];
  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    providers.push(GitHubProvider({ clientId: process.env.AUTH_GITHUB_ID, clientSecret: process.env.AUTH_GITHUB_SECRET }));
  }
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push(GoogleProvider({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET }));
  }
  return {
    providers,
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
    pages: { signIn: "/account", error: "/account" },
    callbacks: {
      async jwt({ token, account }) {
        if (account) token.accountId = accountIdentity(account.provider, account.providerAccountId);
        return token;
      },
      async session({ session, token }) {
        if (session.user && typeof token.accountId === "string") session.user.id = token.accountId;
        // Provider access/refresh tokens never reach the browser or database.
        return session;
      }
    }
  };
}
