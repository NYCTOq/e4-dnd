import { describe, expect, it } from "vitest";
import type { DndSpellData } from "./ruleset.types";
import { buildSpellCertificationExpansionReport, certifySpell, formatSpellCertificationExpansionSummary, getSpellCertificationFamilies } from "./spellCertificationExpansion";

const spell = (patch: Partial<DndSpellData> = {}): DndSpellData => ({
  id: "spell",
  name: "Spell",
  level: 1,
  school: "Evocation",
  castingTime: "1 action",
  range: "60 feet",
  components: ["V", "S"],
  duration: "Instantaneous",
  concentration: false,
  ritual: false,
  classes: ["Wizard"],
  description: "A magical effect occurs.",
  ...patch,
});

describe("spell certification expansion", () => {
  it("groups spells into multiple mechanical families", () => {
    expect(getSpellCertificationFamilies(spell({ damageDice: "8d6", concentration: true, conditionEffect: "Frightened" }))).toEqual(["damage", "concentration-control"]);
  });

  it("certifies a save-for-damage spell as automatic", () => {
    expect(certifySpell(spell({ effectType: "damage", damageDice: "3d6", attackType: "saving-throw", saveAbility: "dex" }))).toMatchObject({ disposition: "automatic", ready: true, blockers: [] });
  });

  it("keeps summon and restoration effects guided with visible instructions", () => {
    const entry = certifySpell(spell({ effectType: "summoning", description: "Summon a creature and remove one curse from it." }));
    expect(entry.families).toEqual(["summoning", "restoration"]);
    expect(entry.disposition).toBe("guided");
    expect(entry.guidance.join(" ")).toContain("condition, curse or magical effect");
  });

  it("blocks reaction and resurrection spells with incomplete critical metadata", () => {
    const reaction = certifySpell(spell({ castingTime: "1 action", reactionTrigger: undefined, description: "Use your reaction when a creature hits." }));
    const resurrection = certifySpell(spell({ name: "Raise Ally", description: "Return a dead creature to life." }));
    expect(reaction.families).toContain("reaction");
    expect(reaction.disposition).toBe("blocked");
    expect(resurrection.blockers.join(" ")).toContain("material-cost");
  });

  it("builds family totals and blockers for a mixed spell catalog", () => {
    const report = buildSpellCertificationExpansionReport({ spells: [
      spell({ id: "damage", name: "Damage", effectType: "damage", damageDice: "1d8", attackType: "spell-attack" }),
      spell({ id: "heal", name: "Heal", effectType: "healing", healingDice: "1d8", description: "A creature regains hit points." }),
      spell({ id: "bad", name: "Bad", description: "", castingTime: "", range: "" }),
    ] });
    expect(report).toMatchObject({ total: 3, automatic: 2, blocked: 1, ready: false });
    expect(report.families.some((family) => family.family === "damage" && family.total === 1)).toBe(true);
  });

  it("reports missing ruleset data and formats a release summary", () => {
    const report = buildSpellCertificationExpansionReport(null);
    expect(report.blockers).toContain("Ruleset spell data could not be loaded.");
    expect(formatSpellCertificationExpansionSummary(report)).toContain("BLOCKED");
  });
});
