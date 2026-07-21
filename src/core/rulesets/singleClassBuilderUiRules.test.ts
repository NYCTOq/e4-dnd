import { describe, expect, it } from "vitest";
import { getSingleClassBuilderUiStatus } from "./singleClassBuilderUiRules";

describe("single-class builder UI guardrails", () => {
  it("does not require a Fighter subclass before level 3", () => {
    const result = getSingleClassBuilderUiStatus({ ruleset: "dnd_2024", level: 1, race: "Human", className: "Fighter", subclass: "", subclassLevel: 3 });
    expect(result.ready).toBe(true);
    expect(result.subclassRequired).toBe(false);
  });

  it("requires a Fighter subclass at level 3", () => {
    const result = getSingleClassBuilderUiStatus({ ruleset: "dnd_2024", level: 3, race: "Human", className: "Fighter", subclass: "", subclassLevel: 3 });
    expect(result.ready).toBe(false);
    expect(result.messages).toContain("Level 3 itibarıyla subclass seçimi gerekli.");
  });

  it("accepts a selected subclass after it unlocks", () => {
    expect(getSingleClassBuilderUiStatus({ ruleset: "dnd_2024", level: 3, race: "Human", className: "Fighter", subclass: "Champion", subclassLevel: 3 }).ready).toBe(true);
  });

  it("supports 2014 classes whose subclass unlocks earlier", () => {
    expect(getSingleClassBuilderUiStatus({ ruleset: "dnd_2014", level: 2, race: "Elf", className: "Wizard", subclass: "Evocation", subclassLevel: 2 }).ready).toBe(true);
  });

  it("keeps homebrew outside the official readiness badge", () => {
    const result = getSingleClassBuilderUiStatus({ ruleset: "homebrew", level: 1, race: "Custom", className: "Custom", subclass: "", subclassLevel: 1 });
    expect(result.officialRuleset).toBe(false);
    expect(result.ready).toBe(false);
  });
});
