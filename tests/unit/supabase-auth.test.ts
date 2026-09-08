import { describe, expect, it } from "vitest";
import { normalizeUsername, usernameFromAuthEmail, usernameToAuthEmail } from "@/integrations/supabase/auth";

describe("Supabase username auth helpers", () => {
  it("maps a display username to the internal Supabase Auth email", () => {
    expect(normalizeUsername(" Javier ")).toBe("javier");
    expect(usernameToAuthEmail("Javier")).toBe("javier@core-protocol.invalid");
  });

  it("rejects usernames that would not produce stable account IDs", () => {
    expect(() => normalizeUsername("ja")).toThrow(/3-32/);
    expect(() => normalizeUsername("javier admin")).toThrow(/3-32/);
  });

  it("recovers usernames from internal auth emails", () => {
    expect(usernameFromAuthEmail("javier@core-protocol.invalid")).toBe("javier");
    expect(usernameFromAuthEmail("other@example.com")).toBe("other");
  });
});
