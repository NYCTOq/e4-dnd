import { describe, expect, it } from "vitest";
import { emptyDraft } from "../../features/characters/characterShared";
import type { RulesetData } from "./ruleset.types";
import { getLevelOneRestReadiness } from "./levelOneRestReadiness";

const data: RulesetData = {
  id: "dnd_2024",
  name: "2024",
  subclasses: [], feats: [], monsters: [], items: [], races: [], backgrounds: [], spells: [],
  classes: [{ id: "fighter", name: "Fighter", hitDie: 10, primaryAbilities: ["str"], savingThrows: ["str", "con"], armorProficiencies: ["Light", "Medium", "Heavy", "Shields"], weaponProficiencies: ["Simple", "Martial"], skillChoices: { choose: 2, from: ["Athletics"] }, description: "", subclassLevel: 3, spellProgression: "none", spellcastingAbility: null, levels: [] }],
};

function fighter() {
  return {
    ...emptyDraft,
    ruleset: "dnd_2024" as const,
    className: "Fighter",
    level: 1,
    hitDice: [{ die: 10, max: 1, used: 0 }],
    resources: [{ id: "second-wind", name: "Second Wind", max: 2, used: 1, recovery: "short" as const, shortRecoveryAmount: 1 }],
  };
}

describe("level one rest readiness", () => {
  it("accepts a valid short-rest recovery profile", () => {
    const status = getLevelOneRestReadiness(fighter(), data);
    expect(status.ready).toBe(true);
    expect(status.summary.join(" ")).toMatch(/SR1/);
  });

  it("blocks invalid hit dice usage", () => {
    const status = getLevelOneRestReadiness({ ...fighter(), hitDice: [{ die: 10, max: 1, used: 2 }] }, data);
    expect(status.ready).toBe(false);
    expect(status.blockers.join(" ")).toMatch(/Hit Dice/);
  });

  it("blocks invalid partial short-rest recovery", () => {
    const status = getLevelOneRestReadiness({ ...fighter(), resources: [{ id: "second-wind", name: "Second Wind", max: 2, used: 1, recovery: "short", shortRecoveryAmount: 3 }] }, data);
    expect(status.ready).toBe(false);
    expect(status.blockers.join(" ")).toMatch(/Rest kaynakları/);
  });

  it("rejects Pact Magic without a Warlock class source", () => {
    const status = getLevelOneRestReadiness({ ...fighter(), pactMagicSlots: [{ level: 1, max: 1, used: 0 }] }, data);
    expect(status.ready).toBe(false);
    expect(status.blockers.join(" ")).toMatch(/Warlock/);
  });
});
