import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { CharacterSpellEffect } from "../../core/character/character.types";
import { getFeatRuntime } from "../../core/rulesets/featRuntimeRules";
import { FEAT_EXPANSION_2014, FEAT_EXPANSION_2024 } from "../../core/rulesets/featExpansion";
import { getItemEffectRuntime, getItemTempHp } from "../../core/rulesets/itemEffectRuntimeRules";
import { ITEM_EXPANSION_2014 } from "../../core/rulesets/itemExpansion";
import {
  classifyFeat, classifyItem, classifySpell, classifySubclass,
} from "../../core/rulesets/runtimeCoverageCertification";
import {
  resolveSpellDamagePipeline, runtimeApplyHealing,
} from "../../core/rulesets/spellRuntimeCombatRules";
import { getSubclassRuntime } from "../../core/rulesets/subclassRuntimeRules";
import { SUBCLASS_EXPANSION_2014 } from "../../core/rulesets/subclassExpansion";
import type {
  DndFeatData, DndItemData, DndSpellData, DndSubclassData,
} from "../../core/rulesets/ruleset.types";
import { RUNTIME_ENTITY_GOLDEN } from "../reference/runtimeEntityGolden.reference";

const read = <T>(edition: string, file: string) =>
  JSON.parse(readFileSync(new URL(`../../../public/data/${edition}/${file}.json`, import.meta.url), "utf8")) as T[];
const effect = (spellId: string): CharacterSpellEffect => ({
  id: spellId, spellId, name: spellId, remainingRounds: 10, concentration: false, summary: "",
});

describe("v5.119C golden runtime entity integration", () => {
  it("resolves edition-aware feat packages from real catalog names", () => {
    for (const golden of RUNTIME_ENTITY_GOLDEN.feats) {
      const catalog = [
        ...read<DndFeatData>(golden.edition, "feats"),
        ...(golden.edition === "dnd_2014" ? FEAT_EXPANSION_2014 : FEAT_EXPANSION_2024),
      ];
      const selected = golden.names.map((name) => catalog.find((feat) => feat.name === name));
      expect(selected.every(Boolean), golden.id).toBe(true);
      expect(selected.map((feat) => classifyFeat(feat!).tier)).toEqual(golden.names.map(() => "automatic"));
      expect(getFeatRuntime([...golden.names], golden.level, golden.edition)).toEqual(golden.expected);
    }
  });

  it("resolves spell damage and healing through the shared runtime", () => {
    const fireBolt = read<DndSpellData>("dnd_2014", "spells").find((spell) => spell.id === "fire-bolt")!;
    const cureWounds = read<DndSpellData>("dnd_2024", "spells").find((spell) => spell.id === "cure-wounds")!;
    expect(classifySpell(fireBolt).tier).toBe("automatic");
    expect(classifySpell(cureWounds).tier).toBe("automatic");
    const damage = RUNTIME_ENTITY_GOLDEN.spells[0];
    expect(resolveSpellDamagePipeline(damage)).toBe(damage.expectedDamage);
    const healing = RUNTIME_ENTITY_GOLDEN.spells[1];
    expect(runtimeApplyHealing(healing.currentHp, healing.maxHp, healing.healing)).toBe(healing.expectedHealing);
  });

  it("combines real potion catalog entries in one item runtime snapshot", () => {
    const itemCatalog = [...read<DndItemData>("dnd_2014", "items"), ...ITEM_EXPANSION_2014];
    const golden = RUNTIME_ENTITY_GOLDEN.items[0];
    const items = golden.effects.map((id) => {
      const itemId = id.replace("item:", "");
      return itemCatalog.find((item) => item.id === itemId);
    });
    expect(items.every(Boolean)).toBe(true);
    expect(items.map((item) => classifyItem(item!).tier)).toEqual(["automatic", "automatic"]);
    expect(getItemEffectRuntime(golden.effects.map(effect))).toMatchObject(golden.expected);
    expect(getItemTempHp(items[1]!)).toBe(golden.expectedTempHp);
  });

  it("runs real Champion and Order Domain subclass entries", () => {
    const champion = read<DndSubclassData>("dnd_2014", "subclasses")
      .find((subclass) => subclass.id === "champion")!;
    const order = SUBCLASS_EXPANSION_2014.find((subclass) => subclass.id === "order-domain")!;
    expect(classifySubclass(champion).tier).toBe("automatic");
    expect(classifySubclass(order).tier).toBe("automatic");
    expect(getSubclassRuntime(champion, 15)).toMatchObject(RUNTIME_ENTITY_GOLDEN.subclasses[0].expected);
    expect(getSubclassRuntime(order, 3).actions[0]).toMatchObject(RUNTIME_ENTITY_GOLDEN.subclasses[1].expectedAction);
  });
});
