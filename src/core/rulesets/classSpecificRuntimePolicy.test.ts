import { describe, expect, it } from "vitest";
import { getClassSpecificRuntimePolicyReport } from "./classSpecificRuntimePolicy";
import type { RulesetData } from "./ruleset.types";

const fighter = {
  id: "fighter",
  name: "Fighter",
  hitDie: 10,
  primaryAbilities: ["str" as const],
  savingThrows: ["str" as const, "con" as const],
  spellcastingAbility: null,
  armorProficiencies: [],
  weaponProficiencies: [],
  skillChoices: { choose: 2, from: [] },
  description: "",
  subclassLevel: 3,
  spellProgression: "none" as const,
  levels: [
    { level: 1, proficiencyBonus: 2, features: ["Fighting Style", "Second Wind", "Weapon Mastery"] },
    { level: 2, proficiencyBonus: 2, features: ["Action Surge"] },
    { level: 5, proficiencyBonus: 3, features: ["Extra Attack"] },
  ],
};

const data: RulesetData = {
  id: "dnd_2024",
  name: "2024",
  classes: [fighter],
  subclasses: [{ id: "battle-master", name: "Battle Master", className: "Fighter", ruleset: "dnd_2024", selectionLevel: 3, description: "", features: [{ level: 3, name: "Maneuvers", summary: "Superiority Dice" }] }],
  races: [], backgrounds: [], feats: [], spells: [], items: [], monsters: [],
};

describe("class specific runtime policy", () => {
  it("reports a loaded class and exposes per-area status", () => {
    const report = getClassSpecificRuntimePolicyReport(data);
    const fighterReport = report.classes.find((entry) => entry.classId === "fighter");
    expect(fighterReport).toBeDefined();
    expect(fighterReport?.areas.map((entry) => entry.area)).toEqual(["builder", "sheet", "play", "rest"]);
  });

  it("blocks when the ruleset is missing", () => {
    expect(getClassSpecificRuntimePolicyReport(null).state).toBe("missing");
  });

  it("reports absent classes instead of silently skipping them", () => {
    const report = getClassSpecificRuntimePolicyReport(data);
    expect(report.classes.find((entry) => entry.classId === "wizard")?.state).toBe("missing");
  });
});
