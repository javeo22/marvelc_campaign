import { afterEach, describe, expect, it, vi } from "vitest";
import { accountIdentity, authOptions } from "@/integrations/cloud/auth";
import { cloudConfigStatus } from "@/integrations/cloud/config";
afterEach(() => vi.unstubAllEnvs());
describe("OAuth account identity and configuration", () => {
  it("uses immutable provider subjects and separates Google/GitHub identities", () => {
    expect(accountIdentity("github", "123")).toBe("github:123");
    expect(accountIdentity("google", "123")).not.toBe(accountIdentity("github", "123"));
    expect(() => accountIdentity("credentials", "123")).toThrow();
    expect(() => accountIdentity("github", "")).toThrow();
  });
  it("disables cloud without secrets, preserving local mode", () => {
    expect(cloudConfigStatus({})).toMatchObject({ enabled: false, configured: false, providers: [] });
    expect(cloudConfigStatus({ NEXT_PUBLIC_CLOUD_SYNC_ENABLED: "true" }).configured).toBe(false);
  });
  it("accepts either provider and requires a secure app origin", () => {
    const env = { NEXT_PUBLIC_CLOUD_SYNC_ENABLED: "true", DATABASE_URL: "postgresql://user:password@db.example.com/db?sslmode=verify-full", NEXTAUTH_URL: "https://companion.example.com", NEXTAUTH_SECRET: "x".repeat(32), AUTH_GITHUB_ID: "test-id", AUTH_GITHUB_SECRET: "test-secret" };
    expect(cloudConfigStatus(env)).toEqual({ enabled: true, configured: true, providers: ["github"] });
    expect(cloudConfigStatus({ ...env, NEXTAUTH_URL: "http://companion.example.com" }).configured).toBe(false);
    expect(cloudConfigStatus({ ...env, NEXTAUTH_SECRET: "short" }).configured).toBe(false);
  });
  it("uses JWT sessions without persisting provider tokens", () => {
    vi.stubEnv("AUTH_GITHUB_ID", "test-id"); vi.stubEnv("AUTH_GITHUB_SECRET", "test-secret");
    const options = authOptions();
    expect(options.session?.strategy).toBe("jwt");
    expect(options.providers.map((provider) => provider.id)).toContain("github");
    expect(options.adapter).toBeUndefined();
  });
});
