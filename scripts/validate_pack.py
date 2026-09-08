#!/usr/bin/env python3
"""Validate the Core Protocol code-agent build pack.

Run from any directory:
    python scripts/validate_pack.py

This validator checks JSON contracts, source-derived campaign invariants, bilingual
card data, setup-action traceability, and the no-card-image-binary release gate.
It performs no network calls.
"""
from __future__ import annotations

import csv
import hashlib
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

try:
    import yaml
    from jsonschema import Draft202012Validator
except ImportError as exc:  # pragma: no cover
    print("Missing validation dependency. Install jsonschema and PyYAML.", file=sys.stderr)
    raise SystemExit(2) from exc

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []
CHECKS: list[str] = []


def check(condition: bool, message: str) -> None:
    if condition:
        CHECKS.append(message)
    else:
        ERRORS.append(message)


def load_json(relative: str) -> Any:
    return json.loads((ROOT / relative).read_text(encoding="utf-8"))


def validate_schema(data_file: str, schema_file: str) -> None:
    data = load_json(data_file)
    schema = load_json(schema_file)
    failures = sorted(
        Draft202012Validator(schema).iter_errors(data),
        key=lambda e: [str(part) for part in e.absolute_path],
    )
    check(not failures, f"{data_file} validates against {schema_file}")
    for failure in failures:
        path = ".".join(str(part) for part in failure.absolute_path) or "$"
        ERRORS.append(f"{data_file}:{path}: {failure.message}")


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    contracts = [
        ("data/core-protocol.v1.1.json", "schemas/campaign-definition.schema.json"),
        ("examples/sample-save.issue-06.json", "schemas/campaign-save.schema.json"),
        ("data/card-reference.bilingual.json", "schemas/card-reference.schema.json"),
        ("data/core-protocol-card-anchors.json", "schemas/card-anchor.schema.json"),
    ]
    for data_file, schema_file in contracts:
        validate_schema(data_file, schema_file)

    for schema_path in sorted((ROOT / "schemas").glob("*.schema.json")):
        try:
            Draft202012Validator.check_schema(json.loads(schema_path.read_text(encoding="utf-8")))
        except Exception as exc:  # jsonschema exposes several schema-error subclasses
            ERRORS.append(f"Invalid JSON Schema {schema_path.name}: {exc}")
        else:
            CHECKS.append(f"JSON Schema is structurally valid: {schema_path.name}")

    settings_schema = load_json("schemas/ui-settings.schema.json")
    check(settings_schema.get("$schema", "").endswith("2020-12/schema"), "UI settings schema declares Draft 2020-12")

    campaign = load_json("data/core-protocol.v1.1.json")
    issues = campaign["issues"]
    mirrors = campaign["mirrorProtocol"]["rows"]
    aspects = set(campaign["aspects"])

    check([issue["number"] for issue in issues] == list(range(1, 16)), "story issue numbers are exactly 1–15")
    check([row["number"] for row in mirrors] == list(range(1, 21)), "Mirror Protocol numbers are exactly 1–20")
    check(campaign["mirrorProtocol"]["totalJourneyGames"] == 35, "total journey is 35 games")

    hero_counts = Counter(issue["heroId"] for issue in issues)
    villain_counts = Counter(issue["villainId"] for issue in issues)
    check(len(hero_counts) == 5 and set(hero_counts.values()) == {3}, "each of five heroes appears three times in the story")
    check(len(villain_counts) == 3 and set(villain_counts.values()) == {5}, "each of three villains appears five times in the story")
    story_pairs = {(issue["heroId"], issue["villainId"]) for issue in issues}
    check(len(story_pairs) == 15, "all 15 hero-villain story pairings are unique")

    issue_aspects: dict[str, list[str]] = defaultdict(list)
    for issue in issues:
        issue_aspects[issue["heroId"]].append(issue["recommendedAspect"])
    heroes_by_id = {hero["id"]: hero for hero in campaign["heroes"]}
    for hero_id, chosen in issue_aspects.items():
        route = heroes_by_id[hero_id]["recommendedAspectRoute"]
        check(len(set(chosen)) == 3, f"{hero_id} has three distinct recommended story aspects")
        check(chosen == route["mainStory"], f"{hero_id} issue route matches recommended main-story route")
        missing = aspects - set(chosen)
        check(missing == {route["firstMirror"]}, f"{hero_id} first Mirror aspect is the unique unused aspect")

    mirror_hero_counts = Counter(row["heroId"] for row in mirrors)
    check(len(mirror_hero_counts) == 5 and set(mirror_hero_counts.values()) == {4}, "each hero has four Mirror Protocol games")

    official: dict[tuple[str, str], set[str]] = defaultdict(set)
    for issue in issues:
        if issue["tierId"] in {"standard", "expert"}:
            official[(issue["heroId"], issue["villainId"])].add(issue["tierId"])
    for row in mirrors:
        official[(row["heroId"], row["villainId"])].add(row["mode"])
    check(len(official) == 15 and all(modes == {"standard", "expert"} for modes in official.values()),
          "story plus mirrors yields Standard and Expert for every hero-villain pairing")

    flags = [issue["objective"]["flagId"] for issue in issues]
    check(len(flags) == len(set(flags)) == 15, "all 15 objective flag IDs are unique")
    valid_flags = set(flags)
    valid_interludes = {item["id"]: {choice["id"] for choice in item["choices"]} for item in campaign["interludes"]}
    phase_ids = {phase["id"] for phase in campaign["setupActionPhases"]}
    action_ids: set[str] = set()
    for issue in issues:
        covered_steps = {action["sourceStep"] for action in issue["setupActions"]}
        check(covered_steps == set(range(1, len(issue["setupSteps"]) + 1)),
              f"Issue {issue['number']:02d} structured setup actions cover every source setup step")
        for action in issue["setupActions"]:
            check(action["id"] not in action_ids, f"setup action ID is unique: {action['id']}")
            action_ids.add(action["id"])
            check(action["phase"] in phase_ids, f"setup action phase exists: {action['id']}")
            condition = action["condition"]
            if condition["kind"] in {"flag_present", "flag_absent"}:
                check(condition["flagId"] in valid_flags, f"setup action flag reference exists: {action['id']}")
            if condition["kind"] == "interlude_choice":
                choices = valid_interludes.get(condition["interludeId"], set())
                check(condition["choiceId"] in choices, f"setup action Interlude choice exists: {action['id']}")

    check([item["threshold"] for item in campaign["networkAdaptations"]] == [2, 4, 6, 8, 10],
          "Network Adaptation thresholds are 2/4/6/8/10")
    assets = campaign["fieldAssets"]["assets"]
    check(len(assets) == 9, "Field Asset inventory contains eight standard assets plus Endgame Protocol")
    check(Counter(item["unlockIntel"] for item in assets) == Counter({3: 2, 6: 2, 9: 2, 12: 2, 15: 1}),
          "Field Asset unlock distribution matches source thresholds")
    check(len(campaign["endings"]) == 4, "four authored endings are present")
    check(campaign["unresolvedEndingState"]["behavior"].startswith("Return needs_author_decision"),
          "undefined low-Network/low-Mastery finale branch remains explicit")

    cards = load_json("data/card-reference.bilingual.json")
    records = cards["records"]
    check(cards["record_count"] == len(records) == 359, "bilingual card reference contains 359 records")
    check(len({row["record_id"] for row in records}) == len(records), "bilingual card record IDs are unique")
    check(all(row["name_en"] and row["name_es"] for row in records), "every card record has English and Spanish names")

    with (ROOT / "data/card-reference.bilingual.csv").open(encoding="utf-8-sig", newline="") as handle:
        csv_rows = list(csv.DictReader(handle))
    check(len(csv_rows) == len(records), "card-reference CSV row count matches JSON")

    with (ROOT / "data/issue-map.csv").open(encoding="utf-8-sig", newline="") as handle:
        issue_rows = list(csv.DictReader(handle))
    check(len(issue_rows) == 15, "issue-map CSV contains 15 issue rows")
    for row, issue in zip(issue_rows, issues, strict=True):
        expected = {
            "number": str(issue["number"]),
            "act": issue["actId"],
            "title": issue["title"]["en"],
            "hero_en": issue["heroName"]["en"],
            "hero_es": issue["heroName"]["es"] or "",
            "villain_en": issue["villainName"]["en"],
            "villain_es": issue["villainName"]["es"] or "",
            "modular_en": issue["modularSetName"]["en"],
            "modular_es": issue["modularSetName"]["es"] or "",
            "tier": issue["tierId"],
            "recommended_aspect": issue["recommendedAspect"],
            "objective_flag": issue["objective"]["flag"],
        }
        check(row == expected, f"issue-map CSV matches Issue {issue['number']:02d}")

    with (ROOT / "data/mirror-protocol.csv").open(encoding="utf-8-sig", newline="") as handle:
        mirror_rows = list(csv.DictReader(handle))
    check(len(mirror_rows) == 20, "mirror-protocol CSV contains 20 rows")
    for row, mirror in zip(mirror_rows, mirrors, strict=True):
        expected = {
            "number": str(mirror["number"]),
            "hero": mirror["heroName"]["en"],
            "villain": mirror["villainName"]["en"],
            "modular": mirror["modularSetName"]["en"],
            "mode": mirror["mode"],
        }
        check(row == expected, f"mirror-protocol CSV matches Mirror {mirror['number']:02d}")

    anchors = load_json("data/core-protocol-card-anchors.json")
    check(len(anchors["anchors"]) == 25, "25 campaign-critical card anchors are present")
    check(all(item["status"] == "matched" and len(item["matches"]) == 1 for item in anchors["anchors"]),
          "every campaign-critical card anchor has exactly one local match")
    anchor_names = {item["requestedName"] for item in anchors["anchors"]}
    campaign_only_reference_names = {asset["name"]["en"] for asset in campaign["fieldAssets"]["assets"]}
    referenced_anchor_names = {
        action["cardAnchorName"]
        for issue in issues
        for action in issue["setupActions"]
        if "cardAnchorName" in action
    }
    check(referenced_anchor_names <= anchor_names | campaign_only_reference_names,
          "every setup card reference resolves to a physical-card anchor or campaign-only asset")

    # Ensure the suffix-sensitive cases identified from upstream remain encoded.
    expected_codes = {
        "Spider-Man": ("01001a", ["01001b"]),
        "Captain Marvel": ("01010a", ["01010b"]),
        "She-Hulk": ("01019a", ["01019b"]),
        "Iron Man": ("01029a", ["01029b"]),
        "Black Panther": ("01040a", ["01040b"]),
        "Wakanda Forever!": ("01043a", ["01043b", "01043c", "01043d"]),
    }
    anchor_map = {item["requestedName"]: item["matches"][0] for item in anchors["anchors"]}
    for name, (primary, alternates) in expected_codes.items():
        match = anchor_map[name]
        check(match["marvelcdbCode"] == primary and match["alternateMarvelcdbCodes"] == alternates,
              f"suffix-sensitive MarvelCDB mapping is retained for {name}")

    openapi = yaml.safe_load((ROOT / "api/openapi.yaml").read_text(encoding="utf-8"))
    check(openapi.get("openapi") == "3.1.0", "OpenAPI document parses and declares 3.1.0")
    check(not any("image" in path.lower() for path in openapi.get("paths", {})), "OpenAPI has no image proxy endpoint")

    env_text = (ROOT / ".env.example").read_text(encoding="utf-8")
    env_values: dict[str, str] = {}
    for raw_line in env_text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env_values[key.strip()] = value.strip().strip('"').strip("'")
    check(env_values.get("NEXT_PUBLIC_CARD_IMAGE_MODE") == "off", "example environment defaults card-image mode to off")
    check(env_values.get("CARD_IMAGES_ENABLED") == "false", "server card-image flag defaults to false")

    image_modes = settings_schema.get("properties", {}).get("cardImageMode", {}).get("enum", [])
    check(image_modes == ["off", "remote"], "V1 UI settings expose only off and remote card-image modes")
    image_contract_text = "\n".join([
        (ROOT / "types/domain.ts").read_text(encoding="utf-8"),
        (ROOT / "api/openapi.yaml").read_text(encoding="utf-8"),
        (ROOT / "schemas/ui-settings.schema.json").read_text(encoding="utf-8"),
    ])
    check("user-provided" not in image_contract_text, "V1 contracts do not expose user-hosted card-image mode")
    expected_docs = {f"{index:02d}" for index in range(17)}
    present_doc_prefixes = {path.name[:2] for path in (ROOT / "docs").glob("[0-9][0-9]-*.md")}
    check(expected_docs <= present_doc_prefixes, "numbered implementation documentation 00–16 is complete")
    check((ROOT / "MASTER_BUILD_SPEC.md").is_file(), "canonical master build specification is included")
    review_docx = ROOT / "Core_Protocol_Companion_Web_App_Build_Spec.docx"
    check(review_docx.is_file() and review_docx.stat().st_size > 500_000,
          "polished review DOCX is included and nontrivial")
    check((ROOT / "qa/VALIDATION_REPORT.md").is_file(), "final validation report is included")
    card_path_pattern = (
        openapi.get("paths", {})
        .get("/cards/{code}", {})
        .get("get", {})
        .get("parameters", [{}])[0]
        .get("schema", {})
        .get("pattern")
    )
    check(card_path_pattern == "^[0-9]{5}[a-z]?$", "card API accepts suffix-sensitive MarvelCDB codes")

    # No official image binaries should be included outside immutable source files.
    image_suffixes = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"}
    disallowed_images = [
        path.relative_to(ROOT).as_posix()
        for path in ROOT.rglob("*")
        if path.is_file() and path.suffix.lower() in image_suffixes and "source-materials" not in path.parts
    ]
    check(not disallowed_images, "build pack contains no card/image binaries outside source materials")
    if disallowed_images:
        ERRORS.extend(f"Disallowed image binary: {item}" for item in disallowed_images)

    required_sources = {
        "Marvel_Champions_Core_Protocol_Campaign_v1.1_Balanced(1).docx",
        "Core_Protocol_v1.1_Quickplay_Companion(1).docx",
        "Core_Protocol_v1.1_Quickplay_Companion(1).pdf",
        "marvel_champions_journey_tracker_v2_core_protocol(1).xlsx",
    }
    present_sources = {path.name for path in (ROOT / "source-materials").iterdir() if path.is_file()}
    check(required_sources <= present_sources, "all four supplied source files are included")
    expected_source_hashes = {
        "Marvel_Champions_Core_Protocol_Campaign_v1.1_Balanced(1).docx": "f6a313e0a8d791bc1f70ac045e150360f1d5dc51eecb74a9d33e1b56f6f4f35a",
        "Core_Protocol_v1.1_Quickplay_Companion(1).docx": "51ccf3d601aae781eed369dec76c2af27e2bdd694e2bb8bd7ce6c96589e4fbfa",
        "Core_Protocol_v1.1_Quickplay_Companion(1).pdf": "3e3a69aa091f9a9e5123a44ee9f5301c38597a520912ad7df235d63b5b06af7e",
        "marvel_champions_journey_tracker_v2_core_protocol(1).xlsx": "e0c0f5b9cf317b10d769d09bab2db65a6bf5bc7e08e6ba111a7afa2947811a1d",
    }
    for filename, expected_hash in expected_source_hashes.items():
        source_path = ROOT / "source-materials" / filename
        check(source_path.is_file() and sha256(source_path) == expected_hash, f"source hash matches: {filename}")

    if ERRORS:
        print(f"FAIL — {len(ERRORS)} error(s); {len(CHECKS)} checks passed")
        for error in ERRORS:
            print(f"  ERROR: {error}")
        return 1

    print(f"PASS — {len(CHECKS)} checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
