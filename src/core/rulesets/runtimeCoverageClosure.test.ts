import { describe, expect, it } from "vitest";
import { buildRuntimeCoverageClosureReport, formatRuntimeCoverageClosureSummary, getRuntimeClosureEntry } from "./runtimeCoverageClosure";
import type { DndClassData, DndItemData, DndSubclassData, RulesetData } from "./ruleset.types";

const base = (): RulesetData => ({
  id: "dnd_2014",
  name: "Test",
  classes: [{ id: "fighter", name: "Fighter", levels: [], subclassLevel: 3, spellProgression: "none" } as unknown as DndClassData],
  subclasses: [{ id: "champion", name: "Champion", className: "Fighter", ruleset: "dnd_2014", selectionLevel: 3, description: "", features: [{ level: 3, name: "Improved Critical" }] } as unknown as DndSubclassData],
  races: [], backgrounds: [], monsters: [],
  feats: [{ id: "alert", name: "Alert", ruleset: "dnd_2014", category: "general", summary: "", benefits: ["Initiative"] }],
  spells: [{ id: "fire", name: "Fire", level: 1, school: "Evocation", castingTime: "1 action", range: "60 ft", components: [], duration: "Instantaneous", concentration: false, ritual: false, classes: ["Wizard"], description: "", effectType: "damage", attackType: "saving-throw", damageDice: "3d6" }],
  items: [{ id: "potion", name: "Potion", category: "gear", cost: "", weight: 0, description: "", healingFormula: "2d4+2" } as DndItemData],
});

describe("runtime coverage closure", () => {
  it("closes a fully mechanical ruleset", () => { const report = buildRuntimeCoverageClosureReport(base()); expect(report).toMatchObject({ ready: true, missing: 0, automatic: 5 }); });
  it("blocks missing behavior", () => { const data = base(); data.items.push({ id: "blank", name: "Blank", category: "gear", cost: "", weight: 0, description: "" }); const report = buildRuntimeCoverageClosureReport(data); expect(report.ready).toBe(false); expect(report.blockers[0]).toContain("Blank"); });
  it("keeps assisted behavior visible", () => { const data = base(); data.spells.push({ ...data.spells[0], id: "mist", name: "Mist", effectType: "movement", damageDice: undefined }); const report = buildRuntimeCoverageClosureReport(data); expect(report.assisted).toBe(1); expect(report.warnings.some((item) => item.includes("Mist"))).toBe(true); });
  it("documents manual table rulings", () => { const data = base(); data.feats.push({ id: "gift", name: "Narrative Gift", ruleset: "dnd_2014", category: "general", summary: "", benefits: ["Narrative benefit"] }); const report = buildRuntimeCoverageClosureReport(data); expect(report.manual).toBe(1); expect(getRuntimeClosureEntry(report, "feats", "gift")?.disposition).toBe("table-ruling"); });
  it("returns blocked output for missing ruleset data", () => { const report = buildRuntimeCoverageClosureReport(null); expect(report.ready).toBe(false); expect(report.blockers.length).toBeGreaterThan(0); });
  it("formats a release-friendly summary", () => { expect(formatRuntimeCoverageClosureSummary(buildRuntimeCoverageClosureReport(base()))).toContain("Runtime closure v5.2.0 · READY"); });
});
