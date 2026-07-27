import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getFeatRuntime } from "../../core/rulesets/featRuntimeRules";
import { getItemEffectRuntime } from "../../core/rulesets/itemEffectRuntimeRules";
import { ITEM_EXPANSION_2014 } from "../../core/rulesets/itemExpansion";
import {
  classifyFeat, classifyItem, classifySpell, classifySubclass,
} from "../../core/rulesets/runtimeCoverageCertification";
import type {
  DndFeatData, DndItemData, DndSpellData, DndSubclassData,
} from "../../core/rulesets/ruleset.types";

const read = <T>(edition: string, file: string) =>
  JSON.parse(readFileSync(new URL(`../../../public/data/${edition}/${file}.json`, import.meta.url), "utf8")) as T[];
const roundTrip = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

describe("v5.119C runtime entity persistence bridge", () => {
  it("keeps runtime tier stable after catalog JSON round-trip", () => {
    const entities = {
      feat: read<DndFeatData>("dnd_2024", "feats").find((entry) => entry.name === "Alert")!,
      spell: read<DndSpellData>("dnd_2014", "spells").find((entry) => entry.id === "fire-bolt")!,
      item: [...read<DndItemData>("dnd_2014", "items"), ...ITEM_EXPANSION_2014]
        .find((entry) => entry.id === "potion-speed")!,
      subclass: read<DndSubclassData>("dnd_2014", "subclasses").find((entry) => entry.id === "champion")!,
    };
    expect(classifyFeat(roundTrip(entities.feat)).tier).toBe(classifyFeat(entities.feat).tier);
    expect(classifySpell(roundTrip(entities.spell)).tier).toBe(classifySpell(entities.spell).tier);
    expect(classifyItem(roundTrip(entities.item)).tier).toBe(classifyItem(entities.item).tier);
    expect(classifySubclass(roundTrip(entities.subclass)).tier).toBe(classifySubclass(entities.subclass).tier);
  });

  it("keeps selected feat and item effect runtime deterministic after round-trip", () => {
    const selection = roundTrip({
      featNames: ["Alert", "Lucky", "Observant"],
      itemEffects: ["item:potion-speed", "item:potion-heroism"],
    });
    expect(getFeatRuntime(selection.featNames, 9, "dnd_2024")).toMatchObject({
      alertInitiativeBonus: 4, luckyUses: 4, passivePerceptionBonus: 5,
    });
    expect(getItemEffectRuntime(selection.itemEffects.map((spellId) => ({
      id: spellId, spellId, name: spellId, remainingRounds: 10,
      concentration: false, summary: "",
    })))).toMatchObject({
      armorClassBonus: 2, speedMultiplier: 2, attackSaveBonusDice: "1d4",
    });
  });
});
