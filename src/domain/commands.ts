import type { CampaignEvent, CampaignEventType } from "./types";

export interface Clock {
  now(): string;
}

export interface IdFactory {
  next(prefix?: string): string;
}

export class FixedClock implements Clock {
  constructor(private readonly value = "2026-09-08T12:00:00.000Z") {}
  now(): string {
    return this.value;
  }
}

export class IncrementingIdFactory implements IdFactory {
  private index = 0;
  next(prefix = "evt"): string {
    this.index += 1;
    return `${prefix}-${String(this.index).padStart(4, "0")}`;
  }
}

export class BrowserClock implements Clock {
  now(): string {
    return new Date().toISOString();
  }
}

export class BrowserIdFactory implements IdFactory {
  next(prefix = "evt"): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

export function createEvent<TPayload extends Record<string, unknown>>(
  type: CampaignEventType,
  sequence: number,
  payload: TPayload,
  options: {
    clock: Clock;
    ids: IdFactory;
    deviceId?: string;
    clientMutationId?: string;
  }
): CampaignEvent<TPayload> {
  return {
    eventId: options.ids.next("event"),
    sequence,
    type,
    occurredAt: options.clock.now(),
    payload,
    ...(options.deviceId ? { deviceId: options.deviceId } : {}),
    clientMutationId: options.clientMutationId ?? options.ids.next("mutation")
  };
}

export function nextEvent<TPayload extends Record<string, unknown>>(
  type: CampaignEventType,
  currentSequence: number,
  payload: TPayload,
  options: {
    clock?: Clock;
    ids?: IdFactory;
    deviceId?: string;
    clientMutationId?: string;
  } = {}
) {
  return createEvent(type, currentSequence + 1, payload, {
    clock: options.clock ?? new BrowserClock(),
    ids: options.ids ?? new BrowserIdFactory(),
    deviceId: options.deviceId,
    clientMutationId: options.clientMutationId
  });
}
