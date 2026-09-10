import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { campaignDefinition } from "@/domain/content";
import { createInitialSnapshot } from "@/domain/reducer";
import { CampaignMeters, HeroScarTile, IssueCover, ScarChip, TrackMeter } from "@/components/campaign/CampaignBits";
import { ExternalCardImage } from "@/components/campaign/ExternalCardImage";
import { cardOrientationForType } from "@/components/campaign/RemoteCardPreview";

describe("comic campaign components", () => {
  it("exposes TrackMeter numeric state and threshold text accessibly", () => {
    render(
      <TrackMeter
        label="Intel"
        value={3}
        thresholds={[{ value: 3, label: "Field Assets" }, { value: 6, label: "More assets" }]}
        tone="intel"
      />
    );
    expect(screen.getByLabelText(/Intel: 3/i)).toBeInTheDocument();
    expect(screen.getByText(/Next: More assets at 6/i)).toBeInTheDocument();
  });

  it("shows Scar count and starting dial adjustment as text", () => {
    render(<ScarChip count={2} />);
    expect(screen.getByText(/Scars 2\/2/i)).toBeInTheDocument();
    expect(screen.getByText(/Recovery -2/i)).toBeInTheDocument();
  });

  it("renders dashboard scar tiles with hero names and recovery state", () => {
    render(<HeroScarTile count={0} heroName="Captain Marvel" maximum={2} />);
    expect(screen.getByLabelText(/Captain Marvel: 0 of 2 scars/i)).toBeInTheDocument();
    expect(screen.getByText("Recovery Same")).toBeInTheDocument();
  });

  it("renders an issue cover without requiring card images", () => {
    render(<IssueCover issue={campaignDefinition.issues[0]!} />);
    expect(screen.getByRole("heading", { name: /THE BREAK-IN/i })).toBeInTheDocument();
    expect(screen.getByText(/Bomb Scare/i)).toBeInTheDocument();
  });

  it("renders campaign meters from selector data", () => {
    render(<CampaignMeters definition={campaignDefinition} snapshot={createInitialSnapshot(campaignDefinition)} />);
    expect(screen.getByLabelText(/Intel: 0/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Network: 0/i)).toBeInTheDocument();
  });

  it("uses a landscape, uncropped frame for scheme card images", () => {
    expect(cardOrientationForType("Main Scheme")).toBe("landscape");
    expect(cardOrientationForType("Side Scheme")).toBe("landscape");
    expect(cardOrientationForType("Villain")).toBe("portrait");

    render(
      <ExternalCardImage
        mode="remote"
        src="https://marvelcdb.com/bundles/cards/01097.png"
        alt="The Break-In!"
        orientation="landscape"
      />
    );

    const image = screen.getByRole("img", { name: "The Break-In!" });
    expect(image).toHaveStyle({ objectFit: "contain" });
    expect(image.parentElement).toHaveAttribute("data-orientation", "landscape");
  });
});
