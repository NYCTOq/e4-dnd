import { describe, expect, it } from "vitest";
import { makeCharacter, makeMonster } from "../../test/fixtures";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { buildGlobalSearchEntries, searchGlobalEntries } from "./globalSearchEngine";

const rulesetData: RulesetData = {
  id: "dnd_2014",
  name: "D&D 2014",
  classes: [],
  races: [],
  spells: [
    {
      id: "fireball",
      name: "Fireball",
      level: 3,
      school: "Evocation",
      castingTime: "1 action",
      range: "150 feet",
      components: ["V", "S", "M"],
      duration: "Instantaneous",
      concentration: false,
      ritual: false,
      classes: ["Wizard"],
      description: "A bright streak flashes and explodes.",
    },
  ],
  items: [],
  monsters: [makeMonster({ id: "goblin", name: "Goblin", type: "humanoid" })],
};

describe("global search", () => {
  const entries = buildGlobalSearchEntries({
    characters: [makeCharacter({ id: "tengiz", name: "Tengiz", className: "Cleric" })],
    campaigns: [],
    rulesetData,
    homebrewSpellIds: new Set(),
    homebrewItemIds: new Set(),
    homebrewMonsterIds: new Set(),
  });

  it("finds Turkish-insensitive character names", () => {
    const result = searchGlobalEntries(entries, "tengiz", "Karakter");
    expect(result[0]?.title).toBe("Tengiz");
  });

  it("ranks an exact spell title before broader matches", () => {
    const result = searchGlobalEntries(entries, "Fireball");
    expect(result[0]?.id).toBe("spell-fireball");
  });

  it("filters results by category", () => {
    const result = searchGlobalEntries(entries, "goblin", "Canavar");
    expect(result).toHaveLength(1);
    expect(result[0]?.to).toBe("/monsters/goblin");
  });
});
