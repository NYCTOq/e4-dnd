import { describe, expect, it } from "vitest";
import { emptyDraft } from "../../features/characters/characterShared";
import type { RulesetData } from "./ruleset.types";
import { getLevelOneUtilityReadiness } from "./levelOneUtilityReadiness";

const data: RulesetData = {
  id: "dnd_2024", name: "2024", subclasses: [], feats: [], monsters: [], items: [],
  classes: [],
  races: [{ id: "elf", name: "Elf", speed: 30, size: "Medium", abilityBonuses: {}, traits: ["Darkvision", "Fey Ancestry"], description: "", languages: ["Common", "Elvish"], darkvision: 60 }],
  backgrounds: [{ id: "sage", name: "Sage", description: "", skillProficiencies: [], toolProficiencies: ["Calligrapher's Supplies"], languages: ["Draconic"] }],
  spells: [{ id: "detect-magic", name: "Detect Magic", level: 1, school: "Divination", castingTime: "Action", range: "Self", components: ["V", "S"], duration: "10 minutes", concentration: true, ritual: true, classes: ["Wizard"], description: "", effectType: "utility" }],
};

function draft() {
  return {
    ...emptyDraft,
    ruleset: "dnd_2024" as const,
    race: "Elf",
    background: "Sage",
    languages: ["Common", "Elvish", "Draconic"],
    toolProficiencies: ["Calligrapher's Supplies"],
    preparedSpellIds: ["detect-magic"],
  };
}

describe("level one utility readiness", () => {
  it("accepts a valid exploration profile", () => {
    const status = getLevelOneUtilityReadiness(draft(), data);
    expect(status.ready).toBe(true);
    expect(status.summary.join(" ")).toMatch(/Speed 30/);
    expect(status.summary.join(" ")).toMatch(/Detect Magic/);
  });

  it("blocks duplicate language and tool entries", () => {
    const status = getLevelOneUtilityReadiness({ ...draft(), languages: ["Common", "common"], toolProficiencies: ["Thieves' Tools", "thieves' tools"] }, data);
    expect(status.ready).toBe(false);
    expect(status.blockers.join(" ")).toMatch(/Tekrarlanan language/);
    expect(status.blockers.join(" ")).toMatch(/Tekrarlanan tool/);
  });

  it("blocks unknown spell references", () => {
    const status = getLevelOneUtilityReadiness({ ...draft(), preparedSpellIds: ["missing-spell"] }, data);
    expect(status.ready).toBe(false);
    expect(status.blockers.join(" ")).toMatch(/katalogda bulunmayan/);
  });

  it("reports missing granted languages and tools as notices", () => {
    const status = getLevelOneUtilityReadiness({ ...draft(), languages: [], toolProficiencies: [] }, data);
    expect(status.ready).toBe(true);
    expect(status.notices.join(" ")).toMatch(/language kayıtları/);
    expect(status.notices.join(" ")).toMatch(/tool proficiency/);
  });
});
