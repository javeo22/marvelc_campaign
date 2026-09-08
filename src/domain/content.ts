import campaignJson from "@/content/core-protocol.v1.1.json";
import type { CampaignDefinition } from "./types";

export const campaignDefinition = campaignJson as unknown as CampaignDefinition;

export function getCampaignDefinition(): CampaignDefinition {
  return campaignDefinition;
}
