import { describe, expect, it } from "vitest";
import { journalIsPrefix, summarizeSave, validateCloudSave } from "@/integrations/cloud/saves";
import { fixtureSave, progressed } from "../fixtures/cloud-save";
describe("Cloud journal validation", () => {
  it("replays a valid existing local save and summarizes its progress", () => {
    const save = progressed();
    expect(validateCloudSave(save)).toEqual(save);
    expect(summarizeSave(save, 2, save.updatedAt)).toMatchObject({ sequence: 2, currentIssueNumber: 1, revision: 2 });
  });
  it("rejects malformed envelopes and user-controlled owner IDs", () => {
    expect(() => validateCloudSave({ ...fixtureSave(), ownerId: "other" })).toThrow(/format/);
    expect(() => validateCloudSave({ events: [] })).toThrow(/format/);
  });
  it("rejects fabricated snapshots, checksum corruption, and future definitions", () => {
    const save = fixtureSave();
    expect(() => validateCloudSave({ ...save, snapshot: { ...save.snapshot, intel: 999 } })).toThrow(/snapshot/);
    expect(() => validateCloudSave({ ...save, checksum: "invalid" })).toThrow(/checksum/);
    expect(() => validateCloudSave({ ...save, definitionVersion: "unknown" })).toThrow(/version/);
  });
  it("rejects gaps, repeated creation, and unknown events", () => {
    const save = progressed();
    expect(() => validateCloudSave({ ...save, sequence: 4 })).toThrow(/journal/);
    expect(() => validateCloudSave({ ...save, events: [save.events[0], { ...save.events[1], type: "UNKNOWN" }] })).toThrow(/journal/);
    expect(() => validateCloudSave({ ...save, events: [save.events[0], { ...save.events[1], type: "CAMPAIGN_CREATED" }] })).toThrow(/repeated/);
  });
  it("compares entire events to detect rewritten payloads even with identical event IDs", () => {
    const save = progressed();
    const changed = progressed(fixtureSave(), "event-next", "aggression");
    expect(journalIsPrefix(save, changed)).toBe(false);
    expect(journalIsPrefix(save, fixtureSave())).toBe(false);
    expect(journalIsPrefix(fixtureSave(), save)).toBe(true);
  });
});
