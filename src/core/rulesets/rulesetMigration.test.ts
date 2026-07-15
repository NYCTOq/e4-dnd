import { describe, expect, it } from "vitest";
import { migrateCharacterRuleset, normalizeRulesetId } from "./rulesetMigration";

describe("ruleset migration", () => {
  it("keeps supported rulesets", () => {
    expect(normalizeRulesetId("dnd_2024")).toBe("dnd_2024");
    expect(normalizeRulesetId("homebrew")).toBe("homebrew");
  });

  it("moves legacy and invalid records to 2014", () => {
    expect(normalizeRulesetId(undefined)).toBe("dnd_2014");
    expect(normalizeRulesetId("5e")).toBe("dnd_2014");
  });

  it("does not mutate the source character", () => {
    const source = { id: "legacy", name: "Legacy" };
    const migrated = migrateCharacterRuleset(source);
    expect(migrated).not.toBe(source);
    expect(migrated.ruleset).toBe("dnd_2014");
  });
});
