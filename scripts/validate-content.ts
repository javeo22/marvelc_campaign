import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const checks: string[] = [];
const errors: string[] = [];

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

function check(condition: boolean, message: string) {
  if (condition) {
    checks.push(message);
  } else {
    errors.push(message);
  }
}

function createAjv() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addFormat("uri-reference", true);
  return ajv;
}

function validate(dataFile: string, schemaFile: string) {
  const ajv = createAjv();
  const schema = readJson<object>(schemaFile);
  const data = readJson<unknown>(dataFile);
  const validateFn = ajv.compile(schema);
  const valid = validateFn(data);
  check(valid, `${dataFile} validates against ${schemaFile}`);
  if (!valid) {
    for (const failure of validateFn.errors ?? []) {
      errors.push(`${dataFile}${failure.instancePath}: ${failure.message ?? "schema failure"}`);
    }
  }
}

type CampaignDefinition = {
  aspects: string[];
  heroes: Array<{ id: string; recommendedAspectRoute: { mainStory: string[]; firstMirror: string } }>;
  issues: Array<{
    number: number;
    heroId: string;
    villainId: string;
    tierId: string;
    recommendedAspect: string;
    setupSteps: string[];
    setupActions: Array<{
      id: string;
      phase: string;
      sourceStep: number;
      condition: { kind: string; flagId?: string; interludeId?: string; choiceId?: string };
      cardAnchorName?: string;
    }>;
    objective: { flagId: string; flag: string };
  }>;
  interludes: Array<{ id: string; choices: Array<{ id: string }> }>;
  networkAdaptations: Array<{ threshold: number }>;
  fieldAssets: { assets: Array<{ unlockIntel: number; name: { en: string } }> };
  endings: unknown[];
  unresolvedEndingState: { behavior: string };
  mirrorProtocol: {
    rows: Array<{ number: number; heroId: string; villainId: string; mode: string }>;
    totalJourneyGames: number;
  };
};

type CardReference = {
  record_count: number;
  records: Array<{ record_id: string; name_en: string; name_es: string }>;
};

type CardAnchors = {
  anchors: Array<{
    requestedName: string;
    status: string;
    matches: Array<{
      marvelcdbCode: string | null;
      alternateMarvelcdbCodes: string[];
      matchStatus: string;
    }>;
  }>;
};

const contracts: Array<[string, string]> = [
  ["data/core-protocol.v1.1.json", "schemas/campaign-definition.schema.json"],
  ["examples/sample-save.issue-06.json", "schemas/campaign-save.schema.json"],
  ["data/card-reference.bilingual.json", "schemas/card-reference.schema.json"],
  ["data/core-protocol-card-anchors.json", "schemas/card-anchor.schema.json"]
];

for (const [dataFile, schemaFile] of contracts) {
  validate(dataFile, schemaFile);
}

for (const schemaName of fs.readdirSync(path.join(root, "schemas")).filter((item) => item.endsWith(".schema.json"))) {
  const ajv = createAjv();
  try {
    ajv.compile(readJson(path.join("schemas", schemaName)));
    checks.push(`JSON Schema is structurally valid: ${schemaName}`);
  } catch (error) {
    errors.push(`Invalid JSON Schema ${schemaName}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const campaign = readJson<CampaignDefinition>("data/core-protocol.v1.1.json");
const anchors = readJson<CardAnchors>("data/core-protocol-card-anchors.json");
const cards = readJson<CardReference>("data/card-reference.bilingual.json");

check(campaign.issues.length === 15, "campaign contains 15 story issues");
check(campaign.mirrorProtocol.rows.length === 20, "campaign contains 20 mirror rows");
check(campaign.mirrorProtocol.totalJourneyGames === 35, "campaign records 35 total journey games");
check(
  campaign.issues.map((issue) => issue.number).join(",") === "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15",
  "story issue numbers are exactly 1-15"
);
check(
  campaign.mirrorProtocol.rows.map((row) => row.number).join(",") ===
    "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20",
  "Mirror Protocol numbers are exactly 1-20"
);

const heroCounts = new Map<string, number>();
const villainCounts = new Map<string, number>();
const storyPairs = new Set<string>();
const flags = new Set<string>();
for (const issue of campaign.issues) {
  heroCounts.set(issue.heroId, (heroCounts.get(issue.heroId) ?? 0) + 1);
  villainCounts.set(issue.villainId, (villainCounts.get(issue.villainId) ?? 0) + 1);
  storyPairs.add(`${issue.heroId}:${issue.villainId}`);
  flags.add(issue.objective.flagId);
  const coveredSteps = new Set(issue.setupActions.map((action) => action.sourceStep));
  check(
    coveredSteps.size === issue.setupSteps.length &&
      Array.from(coveredSteps).every((step) => step >= 1 && step <= issue.setupSteps.length),
    `Issue ${String(issue.number).padStart(2, "0")} structured setup actions cover every source setup step`
  );
}
check(heroCounts.size === 5 && Array.from(heroCounts.values()).every((count) => count === 3), "each hero appears three times");
check(villainCounts.size === 3 && Array.from(villainCounts.values()).every((count) => count === 5), "each villain appears five times");
check(storyPairs.size === 15, "all story hero-villain pairings are unique");
check(flags.size === 15, "all objective flags are unique");

const aspects = new Set(campaign.aspects);
for (const hero of campaign.heroes) {
  const storyAspects = campaign.issues.filter((issue) => issue.heroId === hero.id).map((issue) => issue.recommendedAspect);
  const missing = Array.from(aspects).filter((aspect) => !storyAspects.includes(aspect));
  check(new Set(storyAspects).size === 3, `${hero.id} has three distinct story aspects`);
  check(
    storyAspects.join(",") === hero.recommendedAspectRoute.mainStory.join(","),
    `${hero.id} route matches recommended main-story route`
  );
  check(missing.length === 1 && missing[0] === hero.recommendedAspectRoute.firstMirror, `${hero.id} first mirror aspect is fourth`);
}

check(
  campaign.networkAdaptations.map((item) => item.threshold).join(",") === "2,4,6,8,10",
  "Network Adaptation thresholds are 2/4/6/8/10"
);
check(campaign.fieldAssets.assets.length === 9, "Field Asset inventory contains eight standard assets plus Endgame Protocol");
check(campaign.endings.length === 4, "four authored endings are present");
check(
  campaign.unresolvedEndingState.behavior.startsWith("Return needs_author_decision"),
  "undefined finale branch remains explicit"
);
check(cards.record_count === 359 && cards.records.length === 359, "bilingual card reference contains 359 records");
check(new Set(cards.records.map((record) => record.record_id)).size === cards.records.length, "card record IDs are unique");
check(cards.records.every((record) => record.name_en && record.name_es), "every card record has English and Spanish names");
check(
  anchors.anchors.every((anchor) => anchor.status === "matched" && anchor.matches.length === 1),
  "campaign-critical anchors have exactly one local match"
);

const expectedCodes = new Map<string, [string, string[]]>([
  ["Spider-Man", ["01001a", ["01001b"]]],
  ["Captain Marvel", ["01010a", ["01010b"]]],
  ["She-Hulk", ["01019a", ["01019b"]]],
  ["Iron Man", ["01029a", ["01029b"]]],
  ["Black Panther", ["01040a", ["01040b"]]],
  ["Wakanda Forever!", ["01043a", ["01043b", "01043c", "01043d"]]]
]);

for (const [name, [primary, alternates]] of expectedCodes) {
  const match = anchors.anchors.find((anchor) => anchor.requestedName === name)?.matches[0];
  check(
    match?.marvelcdbCode === primary && match.alternateMarvelcdbCodes.join(",") === alternates.join(","),
    `suffix-sensitive MarvelCDB mapping is retained for ${name}`
  );
}

const envText = fs.readFileSync(path.join(root, ".env.example"), "utf8");
check(envText.includes('NEXT_PUBLIC_CARD_IMAGE_MODE="off"'), "example env defaults public image mode off");
check(envText.includes('CARD_IMAGES_ENABLED="false"'), "example env defaults server image switch false");

if (errors.length > 0) {
  console.error(`FAIL - ${errors.length} error(s); ${checks.length} checks passed`);
  for (const error of errors) {
    console.error(`  ERROR: ${error}`);
  }
  process.exit(1);
}

console.log(`PASS - ${checks.length} checks passed`);
