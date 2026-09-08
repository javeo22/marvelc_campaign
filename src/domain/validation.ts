import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { z } from "zod";
import campaignDefinitionSchema from "../../schemas/campaign-definition.schema.json";
import campaignSaveSchema from "../../schemas/campaign-save.schema.json";
import cardAnchorSchema from "../../schemas/card-anchor.schema.json";
import cardReferenceSchema from "../../schemas/card-reference.schema.json";
import uiSettingsSchema from "../../schemas/ui-settings.schema.json";
import type { CampaignDefinition, UiSettings } from "./types";

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const validators = new Map<string, ValidateFunction>();

function validatorFor(name: string, schema: object) {
  const cached = validators.get(name);
  if (cached) return cached;
  const validate = ajv.compile(schema);
  validators.set(name, validate);
  return validate;
}

export function formatSchemaErrors(errors: ErrorObject[] | null | undefined): string[] {
  return (errors ?? []).map((error) => `${error.instancePath || "$"} ${error.message ?? "is invalid"}`);
}

function validateWithSchema<T>(name: string, schema: object, value: unknown): { ok: true; value: T } | { ok: false; errors: string[] } {
  const validate = validatorFor(name, schema);
  if (validate(value)) return { ok: true, value: value as T };
  return { ok: false, errors: formatSchemaErrors(validate.errors) };
}

export function validateCampaignDefinition(value: unknown) {
  return validateWithSchema<CampaignDefinition>("campaign-definition", campaignDefinitionSchema, value);
}

export function validateCampaignSave(value: unknown) {
  return validateWithSchema("campaign-save", campaignSaveSchema, value);
}

export function validateCardReference(value: unknown) {
  return validateWithSchema("card-reference", cardReferenceSchema, value);
}

export function validateCardAnchors(value: unknown) {
  return validateWithSchema("card-anchor", cardAnchorSchema, value);
}

export function validateUiSettings(value: unknown) {
  return validateWithSchema<UiSettings>("ui-settings", uiSettingsSchema, value);
}

export const envSchema = z.object({
  NEXT_PUBLIC_CARD_IMAGE_MODE: z.enum(["off", "remote"]).default("off"),
  CARD_IMAGES_ENABLED: z.enum(["true", "false"]).default("false"),
  NEXT_PUBLIC_CLOUD_SYNC_ENABLED: z.enum(["true", "false"]).default("false"),
  NEXT_PUBLIC_ANALYTICS_ENABLED: z.enum(["true", "false"]).default("false"),
  NEXT_PUBLIC_BETA_NOINDEX: z.enum(["true", "false"]).default("true"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PROJECT_REF: z.string().regex(/^[a-z0-9]{20}$/).optional(),
  MARVELCDB_USER_AGENT: z.string().min(1).default("Core Protocol Companion metadata-only fan project"),
  MARVELCDB_CONTACT: z.string().optional().default(""),
  MARVELCDB_EN_BASE_URL: z.string().url().default("https://marvelcdb.com"),
  MARVELCDB_ES_BASE_URL: z.string().url().default("https://es.marvelcdb.com")
});

export function readEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`);
  }
  const imageMode = parsed.data.NEXT_PUBLIC_CARD_IMAGE_MODE;
  const serverImagesEnabled = parsed.data.CARD_IMAGES_ENABLED === "true";
  return {
    ...parsed.data,
    cardImagesAllowed: imageMode === "remote" && serverImagesEnabled,
    cloudSyncEnabled: parsed.data.NEXT_PUBLIC_CLOUD_SYNC_ENABLED === "true",
    analyticsEnabled: parsed.data.NEXT_PUBLIC_ANALYTICS_ENABLED === "true",
    noindex: parsed.data.NEXT_PUBLIC_BETA_NOINDEX === "true"
  };
}

export const importEnvelopeSchema = z.object({
  manifest: z.object({
    app: z.literal("core-protocol-companion"),
    schemaVersion: z.string(),
    exportedAt: z.string(),
    contentVersion: z.string()
  }),
  saves: z.array(z.unknown()),
  settings: z.unknown().optional(),
  deckLogs: z.array(z.unknown()).default([]),
  rulesLogs: z.array(z.unknown()).default([]),
  checksum: z.string().optional()
});
