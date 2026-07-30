import { describe, expect, it } from "vitest";
import { resolveSpellTargets } from "./spellOutcomeResolution";

const maxRoll = () => 0.999999;

describe("N-MEGA7C multi-target spell resolution", () => {
  it("uses one shared damage roll for area saving throws and resolves saves per target", () => {
    const result = resolveSpellTargets({
      spell: { id: "fireball", name: "Fireball", level: 3, damageDice: "8d6", saveAbility: "dexterity", saveDamageRule: "half", area: "20-foot sphere", ritual: false, description: "" },
      characterLevel: 5,
      spellSaveDc: 15,
      targets: [
        { id: "a", saveTotal: 14 },
        { id: "b", saveTotal: 15 },
        { id: "c", saveTotal: 20, damageRelation: "resistant" },
      ],
      random: maxRoll,
    });
    expect(result.resolvedTargets).toBe(3);
    expect(result.targetOutcomes.map((entry) => entry.rawTotal)).toEqual([48, 48, 48]);
    expect(result.targetOutcomes.map((entry) => entry.appliedTotal)).toEqual([48, 24, 12]);
    expect(result.totalApplied).toBe(84);
  });

  it("rolls each spell attack independently", () => {
    const rolls = [0, 0.999999, 0.999999, 0.999999];
    const result = resolveSpellTargets({
      spell: { id: "ray", name: "Ray", level: 1, damageDice: "1d6", attackType: "spell-attack", target: "2 creatures", ritual: false, description: "" },
      characterLevel: 3,
      spellAttackBonus: 5,
      targets: [{ id: "a", armorClass: 12 }, { id: "b", armorClass: 12 }],
      random: () => rolls.shift() ?? 0.999999,
    });
    expect(result.resolvedTargets).toBe(2);
    expect(result.targetOutcomes[0].attackHit).toBe(false);
    expect(result.targetOutcomes[1].attackHit).toBe(true);
  });

  it("caps non-area targets using upcast target scaling", () => {
    const result = resolveSpellTargets({
      spell: { id: "charm", name: "Charm", level: 1, target: "1 creature", ritual: false, description: "", scaling: { mode: "slot", additionalTargetsPerStep: 1 } },
      characterLevel: 5,
      castLevel: 3,
      targets: [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }],
      random: maxRoll,
    });
    expect(result.maximumTargets).toBe(3);
    expect(result.resolvedTargets).toBe(3);
  });

  it("applies immunity and vulnerability after save resolution", () => {
    const result = resolveSpellTargets({
      spell: { id: "blast", level: 1, damageDice: "2d6", area: "cone", ritual: false, description: "" },
      characterLevel: 1,
      targets: [{ id: "immune", damageRelation: "immune" }, { id: "vulnerable", damageRelation: "vulnerable" }],
      random: maxRoll,
    });
    expect(result.targetOutcomes[0].appliedTotal).toBe(0);
    expect(result.targetOutcomes[1].appliedTotal).toBe(24);
  });
});
