import type { CampaignEvent } from "./types";

export type DomainErrorCode =
  | "INVALID_PHASE"
  | "ILLEGAL_ASPECT"
  | "ASSET_LOCKED"
  | "ASSET_LIMIT_EXCEEDED"
  | "DUPLICATE_REWARD"
  | "RECOVERY_ALREADY_APPLIED"
  | "FINAL_PREP_OVESPEND"
  | "OUT_OF_ORDER_EVENT"
  | "CONTENT_VERSION_MISMATCH"
  | "UNRESOLVED_ENDING"
  | "UNKNOWN_EVENT"
  | "INVALID_EVENT";

export interface DomainError {
  code: DomainErrorCode;
  message: string;
  event?: CampaignEvent;
  details?: Record<string, unknown>;
}

export type Result<T, E = DomainError> = { ok: true; value: T; warnings?: DomainError[] } | { ok: false; error: E };

export function ok<T>(value: T, warnings?: DomainError[]): Result<T> {
  return warnings && warnings.length > 0 ? { ok: true, value, warnings } : { ok: true, value };
}

export function err(code: DomainErrorCode, message: string, details?: Record<string, unknown>): Result<never> {
  return { ok: false, error: { code, message, details } };
}
