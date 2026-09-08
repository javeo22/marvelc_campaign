import type { CampaignSnapshot, IssueDefinition, LiveSession, ObjectiveTracker } from "./types";

export type ObjectiveStatus = "available" | "progressing" | "eligible" | "completed" | "missed" | "corrected";

export function initialObjectiveState(tracker: ObjectiveTracker) {
  const objectiveCounters: Record<string, number> = {};
  const objectiveChecks: Record<string, boolean> = {};

  if ("counterId" in tracker) {
    objectiveCounters[tracker.counterId] = 0;
  }
  if ("checklist" in tracker && Array.isArray(tracker.checklist)) {
    tracker.checklist.forEach((item, index) => {
      objectiveChecks[checkId(item, index)] = false;
    });
  }
  return { objectiveCounters, objectiveChecks, distinctObjectiveNames: [] as string[] };
}

export function checkId(label: string, index: number): string {
  return `${index + 1}:${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export function trackerCheckIds(tracker: ObjectiveTracker): Array<{ id: string; label: string }> {
  if (!("checklist" in tracker) || !Array.isArray(tracker.checklist)) return [];
  return tracker.checklist.map((label, index) => ({ id: checkId(label, index), label }));
}

function allChecksComplete(session: LiveSession, tracker: ObjectiveTracker): boolean {
  const ids = trackerCheckIds(tracker);
  return ids.length > 0 && ids.every((item) => session.objectiveChecks[item.id]);
}

function counterAtTarget(session: LiveSession, tracker: Extract<ObjectiveTracker, { counterId: string; target: number }>): boolean {
  return (session.objectiveCounters[tracker.counterId] ?? 0) >= tracker.target;
}

export function selectObjectiveStatus(issue: IssueDefinition, snapshot: CampaignSnapshot): ObjectiveStatus {
  const session = snapshot.activeSession;
  if (!session || session.issueNumber !== issue.number) {
    return snapshot.flags.includes(issue.objective.flagId) ? "completed" : "available";
  }
  if (session.objectiveCompleted || snapshot.flags.includes(issue.objective.flagId)) return "completed";

  const tracker = issue.objective.tracker;
  switch (tracker.kind) {
    case "check":
    case "compound_check":
    case "deadline_check":
    case "round_deadline":
    case "end_state":
      return allChecksComplete(session, tracker) ? (issue.objective.winGated ? "eligible" : "progressing") : "available";
    case "counter":
    case "distinct_counter":
      return counterAtTarget(session, tracker) ? (issue.objective.winGated ? "eligible" : "progressing") : "progressing";
    case "compound_counter":
      return allChecksComplete(session, tracker) && counterAtTarget(session, tracker)
        ? issue.objective.winGated
          ? "eligible"
          : "progressing"
        : "progressing";
    case "win_end_state":
      return "eligible";
    default:
      return "available";
  }
}

export function canObjectiveBeRecordedNow(issue: IssueDefinition, snapshot: CampaignSnapshot): boolean {
  if (issue.objective.winGated || !issue.objective.recordImmediately) return false;
  if (snapshot.flags.includes(issue.objective.flagId)) return false;
  const session = snapshot.activeSession;
  if (!session || session.issueNumber !== issue.number) return false;
  const tracker = issue.objective.tracker;
  if (tracker.kind === "win_end_state") return false;
  if (tracker.kind === "check" || tracker.kind === "compound_check" || tracker.kind === "deadline_check" || tracker.kind === "round_deadline" || tracker.kind === "end_state") {
    return allChecksComplete(session, tracker);
  }
  if (tracker.kind === "counter" || tracker.kind === "distinct_counter") {
    return counterAtTarget(session, tracker);
  }
  if (tracker.kind === "compound_counter") {
    return allChecksComplete(session, tracker) && counterAtTarget(session, tracker);
  }
  return false;
}
