import type { CampaignDefinition, CampaignSnapshot, IssueDefinition } from "@/domain/types";
import type { CSSProperties } from "react";
import { Boxes, ChevronDown, Info, RadioTower, Shield, Zap } from "lucide-react";
import { selectActiveNetworkAdaptations, selectNormalFieldAssetLimit, selectUnlockedAssets } from "@/domain/selectors";
import { formatAspectLabel, formatIdLabel } from "./display-labels";

export function TrackMeter({
  label,
  value,
  thresholds,
  tone
}: {
  label: string;
  value: number;
  thresholds: Array<{ value: number; label: string }>;
  tone: "intel" | "network";
}) {
  const max = Math.max(...thresholds.map((threshold) => threshold.value), value, 1);
  const segments = Array.from({ length: max }, (_, index) => index + 1);
  const color = tone === "intel" ? "var(--gold)" : "var(--crimson)";
  const next = thresholds.find((threshold) => threshold.value > value);
  const Icon = tone === "intel" ? Zap : RadioTower;
  return (
    <div className="track-meter metric-card" aria-label={`${label}: ${value}. ${next ? `Next threshold ${next.value}, ${next.label}.` : "All thresholds reached."}`}>
      <div className="stat-row">
        <span className="icon-badge" data-tone={tone}><Icon aria-hidden="true" /></span>
        <strong>{label}</strong>
        <span className="metric-card__value">{value}</span>
      </div>
      <div className="track-meter__bar" style={{ "--segments": segments.length, "--meter-color": color } as CSSProperties}>
        {segments.map((segment) => (
          <span className="track-meter__segment" data-active={segment <= value} key={segment} aria-hidden="true" />
        ))}
      </div>
      <span className="small">{next ? `Next: ${next.label} at ${next.value}` : "All listed thresholds reached."}</span>
    </div>
  );
}

export function ScarChip({ count }: { count: number }) {
  return (
    <span className="scar-chip">
      <Shield aria-hidden="true" />
      <span>Scars {count}/2</span>
      <small>Recovery {count > 0 ? `-${count}` : "Same"}</small>
    </span>
  );
}

export function HeroScarTile({
  heroName,
  count,
  maximum = 2
}: {
  heroName: string;
  count: number;
  maximum?: number;
}) {
  return (
    <article
      className="scar-tile"
      aria-label={`${heroName}: ${count} of ${maximum} scars. Recovery dial ${count > 0 ? `minus ${count}` : "same"}.`}
    >
      <span className="icon-badge" data-tone={count > 0 ? "network" : "intel"} aria-hidden="true">
        <Shield />
      </span>
      <span className="scar-tile__copy">
        <strong>{heroName}</strong>
        <small>Scars {count}/{maximum}</small>
      </span>
      <span className="scar-tile__dial">Recovery {count > 0 ? `-${count}` : "Same"}</span>
    </article>
  );
}

export function IssueCover({ issue, action }: { issue: IssueDefinition; action?: React.ReactNode }) {
  return (
    <article className="issue-cover">
      <div>
        <span className="caption-box">Issue {String(issue.number).padStart(2, "0")}</span>
        <h2>{issue.title.en}</h2>
      </div>
      <div className="dense-grid">
        <span><strong>Hero</strong><br />{issue.heroName.en}{issue.heroName.es ? ` · ${issue.heroName.es}` : ""}</span>
        <span><strong>Villain</strong><br />{issue.villainName.en}{issue.villainName.es ? ` · ${issue.villainName.es}` : ""}</span>
        <span><strong>Modular</strong><br />{issue.modularSetName.en}{issue.modularSetName.es ? ` · ${issue.modularSetName.es}` : ""}</span>
        <span><strong>Tier</strong><br />{formatIdLabel(issue.tierId)} · Stages {issue.villainStages.join("/")}</span>
        <span><strong>Recommended aspect</strong><br />{formatAspectLabel(issue.recommendedAspect)}</span>
      </div>
      {action ? <div>{action}</div> : null}
    </article>
  );
}

export function CampaignMeters({ definition, snapshot }: { definition: CampaignDefinition; snapshot: CampaignSnapshot }) {
  const intelThresholds = definition.progression.intel.unlockThresholds.map((value) => ({
    value,
    label: `${selectUnlockedAssets(definition, { ...snapshot, intel: value } as CampaignSnapshot).length} Field Assets`
  }));
  const networkThresholds = definition.networkAdaptations.map((adaptation) => ({
    value: adaptation.threshold,
    label: adaptation.name.en
  }));
  return (
    <div className="campaign-track-grid">
      <details className="track-help">
        <summary aria-label="Open Intel guide">
          <TrackMeter label="Intel" value={snapshot.intel} thresholds={intelThresholds} tone="intel" />
          <span className="track-help__prompt"><Info aria-hidden="true" /> How Intel works <ChevronDown aria-hidden="true" /></span>
        </summary>
        <div className="track-help__body">
          <p><strong>Intel records what the Avengers learn.</strong> Gain 1 for an issue win, a completed optional objective, and the first Hero Mastery.</p>
          <p>Objectives and first Masteries remain earned even if the issue is later lost.</p>
          <ul>
            {intelThresholds.map((threshold) => (
              <li key={threshold.value} data-active={snapshot.intel >= threshold.value}>
                <strong>Intel {threshold.value}</strong> — {threshold.label}
              </li>
            ))}
          </ul>
        </div>
      </details>
      <details className="track-help">
        <summary aria-label="Open Network guide">
          <TrackMeter label="Network" value={snapshot.network} thresholds={networkThresholds} tone="network" />
          <span className="track-help__prompt"><Info aria-hidden="true" /> How Network works <ChevronDown aria-hidden="true" /></span>
        </summary>
        <div className="track-help__body">
          <p><strong>Network represents Ultron learning from Avengers failures.</strong> Hero defeat adds 1; main-scheme completion adds 2. Every reached adaptation remains active.</p>
          <ul>
            {definition.networkAdaptations.map((adaptation) => (
              <li key={adaptation.id} data-active={snapshot.network >= adaptation.threshold}>
                <strong>{adaptation.threshold} — {adaptation.name.en}</strong><br />
                {adaptation.effect.en}
              </li>
            ))}
          </ul>
          <p>Act Recovery can lower Network after Issues 5 and 10. At Network 6+, true solo gains two normal Field Asset slots instead of one.</p>
        </div>
      </details>
    </div>
  );
}

export function AdaptationStack({ definition, snapshot, issueNumber }: { definition: CampaignDefinition; snapshot: CampaignSnapshot; issueNumber: number }) {
  const selected = selectActiveNetworkAdaptations(definition, snapshot, issueNumber);
  const next = definition.networkAdaptations.find((adaptation) => adaptation.threshold > snapshot.network);
  return (
    <div className="form-stack">
      <strong>Network {snapshot.network} · cumulative adaptations</strong>
      {selected.active.length === 0 ? <span className="small">No active adaptations.</span> : null}
      {selected.active.map((adaptation) => (
        <div className="adaptation-card" key={adaptation.id} data-suppressed={selected.suppressed?.id === adaptation.id}>
          <strong>{adaptation.name.en} · Network {adaptation.threshold}</strong>
          <span>{adaptation.effect.en}</span>
          {selected.suppressed?.id === adaptation.id ? <small>Suppressed through Round 1</small> : null}
        </div>
      ))}
      {next ? (
        <div className="adaptation-card" data-upcoming="true">
          <strong>Next at Network {next.threshold}: {next.name.en}</strong>
          <span>{next.effect.en}</span>
        </div>
      ) : <span className="small">All Network adaptations are active.</span>}
    </div>
  );
}

export function ScarGuide({ heroName, count }: { heroName?: string; count?: number }) {
  return (
    <details className="rules-help">
      <summary><Info aria-hidden="true" /> How Scars work <ChevronDown aria-hidden="true" /></summary>
      <div className="rules-help__body">
        <p>A hero defeated during an issue gains 1 Scar, up to 2. Each Scar lowers that hero’s starting hit-point dial by 1 the next time they begin an issue.</p>
        <p><strong>Maximum hit points do not change.</strong> Winning an issue with that hero removes 1 Scar.</p>
        {heroName !== undefined && count !== undefined ? (
          <p>{heroName} currently has {count} Scar{count === 1 ? "" : "s"}, so the starting dial adjustment is {count > 0 ? `-${count}` : "none"}.</p>
        ) : null}
      </div>
    </details>
  );
}

export function FieldAssetSummary({ definition, snapshot, issueNumber }: { definition: CampaignDefinition; snapshot: CampaignSnapshot; issueNumber: number }) {
  const assets = selectUnlockedAssets(definition, snapshot).filter((asset) => asset.special !== "issue-15-only" || issueNumber === 15);
  return (
    <div className="form-stack">
      <span className="stat-row"><span className="icon-badge" data-tone="intel"><Boxes aria-hidden="true" /></span><strong>Field Assets</strong></span>
      <span className="small">Normal slots: {selectNormalFieldAssetLimit(definition, snapshot)}. Endgame Protocol is special for Issue 15 at 15+ Intel.</span>
      {assets.length === 0 ? <span className="small">No Field Assets unlocked yet.</span> : null}
      <div className="asset-badge-grid">
        {assets.map((asset) => (
          <span className="asset-badge" key={asset.id}>
            <Boxes aria-hidden="true" />
            <strong>{asset.name.en}</strong>
            <small>Intel {asset.unlockIntel}</small>
          </span>
        ))}
      </div>
    </div>
  );
}
