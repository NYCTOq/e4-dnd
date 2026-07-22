import { describe, expect, it } from "vitest";
import { emptyDraft } from "../../features/characters/characterShared";
import type { RulesetData } from "./ruleset.types";
import { getLevelOneActionEconomyReadiness } from "./levelOneActionEconomyReadiness";

const data: RulesetData = {
  id: "dnd_2024",
  name: "2024",
  subclasses: [], feats: [], monsters: [], items: [], races: [], backgrounds: [],
  classes: [{ id: "fighter", name: "Fighter", hitDie: 10, primaryAbilities: ["str"], savingThrows: ["str", "con"], armorProficiencies: ["Light", "Medium", "Heavy", "Shields"], weaponProficiencies: ["Simple", "Martial"], skillChoices: { choose: 2, from: ["Athletics"] }, description: "", subclassLevel: 3, spellProgression: "none", spellcastingAbility: null, levels: [] }],
  spells: [{ id: "shield", name: "Shield", level: 1, school: "Abjuration", castingTime: "Reaction", range: "Self", components: ["V", "S"], duration: "1 round", concentration: false, ritual: false, classes: ["Wizard"], description: "+5 AC." }],
};

function fighter() {
  return {
    ...emptyDraft,
    ruleset: "dnd_2024" as const,
    className: "Fighter",
    level: 1,
    resources: [{ id: "second-wind", name: "Second Wind", max: 2, used: 0, recovery: "short" as const, shortRecoveryAmount: 1 }],
  };
}

describe("level one action economy readiness", () => {
  it("accepts valid fighter resources and actions", () => {
    const status = getLevelOneActionEconomyReadiness(fighter(), data);
    expect(status.ready).toBe(true);
    expect(status.summary.join(" ")).toMatch(/Second Wind/);
  });

  it("blocks a missing generated class resource", () => {
    const status = getLevelOneActionEconomyReadiness({ ...fighter(), resources: [] }, data);
    expect(status.ready).toBe(false);
    expect(status.blockers.join(" ")).toMatch(/Second Wind/);
  });

  it("blocks invalid resource usage", () => {
    const status = getLevelOneActionEconomyReadiness({ ...fighter(), resources: [{ id: "second-wind", name: "Second Wind", max: 2, used: 3, recovery: "short" }] }, data);
    expect(status.ready).toBe(false);
    expect(status.blockers.join(" ")).toMatch(/resource/);
  });

  it("summarizes reaction spells", () => {
    const status = getLevelOneActionEconomyReadiness({ ...fighter(), knownSpellIds: ["shield"] }, data);
    expect(status.ready).toBe(true);
    expect(status.summary.join(" ")).toMatch(/R1/);
  });
});
