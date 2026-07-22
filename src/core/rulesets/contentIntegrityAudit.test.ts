import { describe, expect, it } from "vitest";
import type { RulesetData } from "./ruleset.types";
import { getContentIntegrityAudit } from "./contentIntegrityAudit";

const baseRuleset = (): RulesetData => ({
  id: "dnd_2024",
  name: "2024",
  classes: Array.from({ length: 12 }, (_, index) => ({
    id: `class-${index}`,
    name: `Class ${index}`,
    hitDie: 8,
    primaryAbilities: ["wis"],
    savingThrows: ["wis", "cha"],
    spellcastingAbility: null,
    armorProficiencies: [],
    weaponProficiencies: [],
    skillChoices: { choose: 2, from: ["Insight"] },
    description: "",
    subclassLevel: 3,
    spellProgression: "none",
    levels: Array.from({ length: 20 }, (_, level) => ({ level: level + 1, proficiencyBonus: 2 + Math.floor(level / 4), features: [] })),
  })),
  subclasses: Array.from({ length: 12 }, (_, index) => ({
    id: `sub-${index}`,
    name: `Subclass ${index}`,
    className: `Class ${index}`,
    ruleset: "dnd_2024",
    selectionLevel: 3,
    description: "",
    features: [{ level: 3, name: "Feature", summary: "Feature" }],
  })),
  races: [{ id: "human", name: "Human", speed: 30, size: "Medium", abilityBonuses: {}, traits: ["Resourceful"], description: "" }],
  backgrounds: [{ id: "soldier", name: "Soldier", description: "", skillProficiencies: ["Athletics"] }],
  feats: [],
  spells: [],
  items: [],
  monsters: [],
});

describe("content integrity audit", () => {
  it("accepts structurally valid core catalogs while reporting empty optional catalogs", () => {
    const audit = getContentIntegrityAudit(baseRuleset());
    expect(audit.blockerCount).toBe(0);
    expect(audit.warningCount).toBeGreaterThan(0);
    expect(audit.missingCatalogs).toContain("Monsters");
  });

  it("blocks duplicate ids and broken spell class references", () => {
    const ruleset = baseRuleset();
    ruleset.races.push({ ...ruleset.races[0] });
    ruleset.spells.push({
      id: "mystery",
      name: "Mystery",
      level: 1,
      school: "Illusion",
      castingTime: "Action",
      range: "60 feet",
      components: ["V"],
      duration: "Instantaneous",
      concentration: false,
      ritual: false,
      classes: ["Missing Class"],
      description: "",
    });
    const audit = getContentIntegrityAudit(ruleset);
    expect(audit.status).toBe("blocked");
    expect(audit.issues.some((entry) => entry.id.includes("duplicate"))).toBe(true);
    expect(audit.issues.some((entry) => entry.id.includes("spell-class"))).toBe(true);
  });

  it("detects incomplete level tables", () => {
    const ruleset = baseRuleset();
    ruleset.classes[0].levels = ruleset.classes[0].levels.slice(0, 19);
    const audit = getContentIntegrityAudit(ruleset);
    expect(audit.issues.some((entry) => entry.id === "class-levels-class-0")).toBe(true);
  });

  it("returns a blocked report when ruleset data is missing", () => {
    expect(getContentIntegrityAudit(null).status).toBe("blocked");
  });
});
