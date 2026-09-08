export type Locale = 'en' | 'es';
export type Aspect = 'aggression' | 'justice' | 'leadership' | 'protection';
export type TierId = 'standard' | 'veteran' | 'expert';
export type CampaignPhase = 'new' | 'preparing' | 'in-progress' | 'debrief' | 'interlude' | 'complete' | 'mirror';
export type IssueResult = 'win' | 'hero_defeat' | 'main_scheme_loss' | 'other_loss' | 'abandoned';
export type CardImageMode = 'off' | 'remote';

export interface LocalizedText {
  en: string;
  es: string | null;
}

export interface NullableLocalizedText {
  en: string | null;
  es: string | null;
}

export interface CollectionRequirement {
  pack: string;
  packEs: string;
  required: boolean;
}

export interface RulesAuthorityDefinition {
  text: string;
  sourceDocument: string;
}

export interface AspectPassportDefinition {
  mainStoryRule: string;
  firstMirrorRule: string;
  basicCardsReusable: boolean;
  recommendedRoutesAreDefaultsNotRules: boolean;
}

export interface OptionalModeDefinition {
  id: string;
  label: string;
  text: string;
}

export interface LocalizationDefinition {
  defaultUiLanguage: Locale;
  physicalCardLanguageDefault: Locale | 'both';
  narrativeLanguagesAvailable: Locale[];
  cardNameLanguagesAvailable: Locale[];
  fallbackRule: string;
}

export interface CampaignDefinition {
  $schema?: string;
  schemaVersion: string;
  id: 'core-protocol';
  version: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  format: 'true-solo';
  sourceEdition: string;
  collectionRequirements: CollectionRequirement[];
  rulesAuthority: RulesAuthorityDefinition;
  principles: string[];
  contentWarnings: string[];
  setupOrder: SetupOrderStep[];
  setupActionPhases: SetupActionPhase[];
  tiers: TierDefinition[];
  aspects: Aspect[];
  aspectPassport: AspectPassportDefinition;
  progression: ProgressionDefinition;
  networkAdaptations: NetworkAdaptation[];
  fieldAssets: FieldAssetDefinitionSet;
  heroes: HeroDefinition[];
  acts: ActDefinition[];
  interludes: InterludeDefinition[];
  finalPreparation: FinalPreparationDefinition;
  issues: IssueDefinition[];
  endings: EndingDefinition[];
  unresolvedEndingState: UnresolvedEndingState;
  secretEpilogue: SecretEpilogueDefinition;
  mirrorProtocol: MirrorProtocolDefinition;
  optionalModes: OptionalModeDefinition[];
  localization: LocalizationDefinition;
  sourceFiles: string[];
}

export interface SetupOrderStep { step: number; id: string; text: string; }
export type SetupActionPhaseId = 'issue-pre-setup' | 'normal-scenario-setup' | 'campaign-continuity' | 'network-and-final-prep' | 'opening-hand' | 'in-game-reminder';
export interface SetupActionPhase { id: SetupActionPhaseId; order: number; label: string; description: string; }
export type SetupActionCondition =
  | { kind: 'always' }
  | { kind: 'flag_present' | 'flag_absent'; flagId: string }
  | { kind: 'interlude_choice'; interludeId: string; choiceId: string }
  | { kind: 'intel_at_least'; value: number };
export interface SetupAction {
  id: string; phase: Exclude<SetupActionPhaseId, 'normal-scenario-setup' | 'opening-hand'>; kind: string; actor: 'player'; text: string;
  sourceStep: number; condition: SetupActionCondition; appBehavior: 'confirm' | 'generated' | 'initialize_tracker' | 'persistent_reminder' | 'interactive';
  trigger?: string; cardAnchorName?: string;
}

export interface ComposedSetupAction extends SetupAction {
  includedBecause: string;
  sourceText: string;
  completed: boolean;
}

export interface ComposedSetupPlanGroup {
  phaseId: SetupActionPhaseId;
  label: string;
  order: number;
  actions: ComposedSetupAction[];
}

export interface ComposedSetupPlan {
  issueNumber: number;
  groups: ComposedSetupPlanGroup[];
  inGameReminders: ComposedSetupAction[];
  sourceVerbatimSteps: string[];
}
export interface TierDefinition {
  id: TierId;
  label: string;
  officialClear: 'standard' | 'expert' | null;
  villainStages: Array<'I' | 'II' | 'III'>;
  encounterSets: Array<'standard' | 'expert'>;
  note?: string;
}

export interface ProgressionDefinition {
  intel: { initial: number; minimum: number; deltas: { issueWin: number; optionalObjective: number; firstHeroMastery: number }; unlockThresholds: number[] };
  network: { initial: number; minimum: number; deltas: { heroDefeat: number; mainSchemeLoss: number }; adaptationsCumulative: boolean };
  scars: { initialPerHero: number; maximumPerHero: 2; onHeroDefeat: number; onHeroWin: number; setupEffect: string };
  recording: { objectivePersistsAfterLoss: boolean; masteryPersistsAfterLoss: boolean; exception: string };
}

export interface NetworkAdaptation {
  id: string; threshold: number; name: LocalizedText; effect: LocalizedText; cumulative: true;
}

export interface FieldAssetDefinition {
  id: string; unlockIntel: number; name: LocalizedText; effect: LocalizedText;
  usesPerGame: 1; outOfPlayReference: true; special: 'issue-15-only' | null;
}
export interface FieldAssetDefinitionSet {
  selectionRule: { defaultLimit: 1; networkAtLeast: 6; elevatedLimit: 2 };
  outOfPlayRule: string;
  assets: FieldAssetDefinition[];
  endgameProtocolException: string;
}

export interface HeroDefinition {
  id: string; name: LocalizedText;
  recommendedAspectRoute: { mainStory: [Aspect, Aspect, Aspect]; firstMirror: Aspect };
  mastery: { heroId: string; heroName: LocalizedText; signature: LocalizedText; condition: LocalizedText; firstCompletionIntel: 1; persistsAfterLoss: true };
  scarMaximum: 2;
}

export interface ActDefinition { id: 'act-1' | 'act-2' | 'act-3'; number: 1 | 2 | 3; title: LocalizedText; issueRange: [number, number]; tierId: TierId; }
export interface InterludeChoiceEffect { issue: number; effect: string; }
export interface InterludeDefinition {
  id: 'act-1-lead' | 'act-2-assault'; afterIssue: 5 | 10; title: LocalizedText; prompt: LocalizedText;
  choices: Array<{ id: string; name: LocalizedText; effects: InterludeChoiceEffect[] }>;
  actRecovery: { actId: 'act-1' | 'act-2'; objectiveThreshold: 3; lowWinThreshold: 2; networkReductionEach: 1; minimumNetwork: 0 };
}

export type ObjectiveTracker =
  | { kind: 'check'; checklist: string[] }
  | { kind: 'deadline_check'; checklist: string[]; deadline: string }
  | { kind: 'compound_check'; checklist: string[] }
  | { kind: 'counter'; counterId: string; label: string; target: number; incrementHint?: string }
  | { kind: 'compound_counter'; checklist: string[]; counterId: string; label: string; target: number }
  | { kind: 'distinct_counter'; counterId: string; label: string; target: number }
  | { kind: 'end_state'; checklist: string[] }
  | { kind: 'round_deadline'; checklist: string[]; deadlineRound: number }
  | { kind: 'win_end_state'; winRequired: true; checklist?: string[]; metric?: 'mainSchemeThreat'; operator?: '<='; target?: number };

export interface IssueDefinition {
  number: number; id: string; actId: 'act-1' | 'act-2' | 'act-3'; title: LocalizedText;
  heroId: string; heroName: LocalizedText; villainId: string; villainName: LocalizedText;
  modularSetId: string; modularSetName: LocalizedText; tierId: TierId;
  villainStages: Array<'I' | 'II' | 'III'>; encounterSets: Array<'standard' | 'expert'>;
  aspectAppearance: 1 | 2 | 3; recommendedAspect: Aspect;
  narrative: { previously: LocalizedText };
  setupSteps: string[]; setupActions: SetupAction[]; continuityInputs: string[];
  objective: { description: LocalizedText; completionNote: NullableLocalizedText; flag: string; flagId: string; recordImmediately: boolean; winGated: boolean; tracker: ObjectiveTracker };
  outcomes: { win: LocalizedText; loss: LocalizedText };
  cardAnchorNames: string[];
  liveTrackerPreset: LiveTrackerPreset;
  source: SourceReference;
}

export interface LiveTrackerPreset {
  showRoundCounter: boolean;
  showMainSchemeThreat: boolean;
  showVillainStage: boolean;
  showObjectiveTracker: boolean;
  showBoardStateChecklist: boolean;
}

export interface SourceReference {
  document: string;
  section: string;
}

export interface FinalPreparationDefinition {
  issue: 15; sourceFlags: string[]; pointsPerFlag: 1; spendAfterAllSetupEffects: true;
  spendOptions: Array<{ id: 'remove-threat' | 'damage-minion' | 'heal-iron-man'; effect: string }>;
  repeatOptionsAllowed: true;
}

export interface EndingDefinition { id: string; title: string; criteria: Record<string, unknown>; text: string; }
export interface UnresolvedEndingState { criteria: Record<string, unknown>; behavior: 'Return needs_author_decision. Do not silently assign another ending.'; reason: string; }
export interface SecretEpilogueDefinition { id: string; title: string; criteria: Record<string, unknown>; marksFlag: string; text: string; }
export interface MirrorProtocolDefinition { resetBeforeStarting: string[]; sameModularAsOriginal: true; firstGameFourthAspectRequired: true; rows: MirrorDefinition[]; completionTarget: 20; totalJourneyGames: 35; }
export interface MirrorDefinition { number: number; id: string; heroId: string; heroName: LocalizedText; villainId: string; villainName: LocalizedText; modularSetId: string; modularSetName: LocalizedText; mode: 'standard' | 'expert'; }

export interface CampaignSave {
  schemaVersion: string; saveId: string; campaignId: 'core-protocol'; definitionVersion: string;
  playMode: 'fail-forward' | 'canon'; createdAt: string; updatedAt: string; deviceId: string;
  sequence: number; snapshot: CampaignSnapshot; events: CampaignEvent[];
}

export interface CampaignSnapshot {
  phase: CampaignPhase; currentIssueNumber: number | null; intel: number; network: number;
  scars: Record<string, number>; flags: string[]; masteries: string[];
  usedAspects: Record<string, Aspect[]>; interludeChoices: Record<string, string>;
  activeSession: LiveSession | null; issueResults: IssueResultRecord[]; mirrorResults: MirrorResultRecord[];
  finalEndingId: string | null; secretEpilogueEarned: boolean;
}

export interface LiveSession {
  issueNumber: number; startedAt: string; aspect: Aspect; selectedFieldAssetIds: string[];
  usedFieldAssetIds: string[]; round: number; heroHp?: number; villainStage?: 'I' | 'II' | 'III';
  villainHp?: number; mainSchemeThreat?: number; objectiveCounters: Record<string, number>;
  objectiveChecks: Record<string, boolean>; objectiveCompleted: boolean; masteryEarnedThisSession: boolean;
  notes: string[]; undoCursor: number;
}

export interface IssueResultRecord {
  attemptId: string; issueNumber: number; result: IssueResult; completedAt: string;
  objectiveCompleted: boolean; masteryEarned: boolean; intelAfter: number; networkAfter: number;
  heroScarsAfter: number; notes?: string;
}
export interface MirrorResultRecord { mirrorNumber: number; result: IssueResult; aspect: Aspect; completedAt: string; notes?: string; }

export type CampaignEventType =
  | 'CAMPAIGN_CREATED' | 'ISSUE_PREPARATION_STARTED' | 'ASPECT_SELECTED'
  | 'FIELD_ASSET_EQUIPPED' | 'ISSUE_STARTED' | 'ROUND_CHANGED' | 'COUNTER_CHANGED'
  | 'CHECKLIST_CHANGED' | 'FIELD_ASSET_USED' | 'OBJECTIVE_COMPLETED' | 'MASTERY_EARNED'
  | 'NOTE_ADDED' | 'ISSUE_COMPLETED' | 'INTERLUDE_CHOICE_MADE' | 'ACT_RECOVERY_APPLIED'
  | 'FINAL_PREP_SPENT' | 'MIRROR_STARTED' | 'MIRROR_COMPLETED' | 'SAVE_IMPORTED'
  | 'MANUAL_CORRECTION';
export interface CampaignEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  eventId: string; sequence: number; type: CampaignEventType; occurredAt: string; payload: TPayload;
  deviceId?: string; clientMutationId?: string;
}

export interface EndingResolution { status: 'resolved'; endingId: string; secretEpilogueEarned: boolean }
export interface EndingNeedsDecision { status: 'needs_author_decision'; reason: string }
export type EndingResult = EndingResolution | EndingNeedsDecision;
