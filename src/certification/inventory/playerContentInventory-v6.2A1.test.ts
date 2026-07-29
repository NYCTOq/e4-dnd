import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024 } from "../../core/rulesets/subclassExpansion";
import { FEAT_EXPANSION_2014, FEAT_EXPANSION_2024 } from "../../core/rulesets/featExpansion";
import { SPELL_EXPANSION_2014, SPELL_EXPANSION_2024 } from "../../core/rulesets/spellExpansion";
import type { DndBackgroundData, DndClassData, DndFeatData, DndRaceData, DndSpellData, DndSubclassData } from "../../core/rulesets/ruleset.types";

type RulesetId = "dnd_2014" | "dnd_2024";
type Issue = { severity: "blocker" | "warning"; category: string; message: string };

const root = process.cwd();
const readJson = <T,>(ruleset: RulesetId, file: string): T => {
  const target = path.join(root, "public", "data", ruleset, file);
  if (!fs.existsSync(target)) throw new Error(`Missing catalog: ${target}`);
  return JSON.parse(fs.readFileSync(target, "utf8")) as T;
};
const mergeById = <T extends { id: string }>(base: T[], extra: T[]): T[] => {
  const ids = new Set(base.map((entry) => entry.id));
  return [...base, ...extra.filter((entry) => !ids.has(entry.id))];
};
const duplicates = (values: string[]) => values.filter((value, index) => values.indexOf(value) !== index).filter((value, index, all) => all.indexOf(value) === index).sort();

function inventory(ruleset: RulesetId) {
  const classes = readJson<DndClassData[]>(ruleset, "classes.json");
  const subclasses = mergeById(
    readJson<DndSubclassData[]>(ruleset, "subclasses.json"),
    ruleset === "dnd_2014" ? SUBCLASS_EXPANSION_2014 : SUBCLASS_EXPANSION_2024,
  );
  const races = readJson<DndRaceData[]>(ruleset, "races.json");
  const backgrounds = readJson<DndBackgroundData[]>(ruleset, "backgrounds.json");
  const feats = mergeById(
    readJson<DndFeatData[]>(ruleset, "feats.json"),
    ruleset === "dnd_2014" ? FEAT_EXPANSION_2014 : FEAT_EXPANSION_2024,
  );
  const spells = mergeById(
    readJson<DndSpellData[]>(ruleset, "spells.json"),
    ruleset === "dnd_2014" ? SPELL_EXPANSION_2014 : SPELL_EXPANSION_2024,
  );

  const issues: Issue[] = [];
  const classNames = classes.map((entry) => entry.name).sort();
  const classSet = new Set(classNames);
  const subclassByClass: Record<string, string[]> = Object.fromEntries(classNames.map((name) => [name, []]));

  for (const [catalog, ids] of Object.entries({
    classes: classes.map((e) => e.id), subclasses: subclasses.map((e) => e.id), races: races.map((e) => e.id),
    backgrounds: backgrounds.map((e) => e.id), feats: feats.map((e) => e.id), spells: spells.map((e) => e.id),
  })) {
    const found = duplicates(ids);
    if (found.length) issues.push({ severity: "blocker", category: "duplicate-id", message: `${catalog}: ${found.join(", ")}` });
  }

  for (const subclass of subclasses) {
    if (!classSet.has(subclass.className)) issues.push({ severity: "blocker", category: "orphan-subclass", message: `${subclass.name} -> ${subclass.className}` });
    else subclassByClass[subclass.className].push(subclass.name);
  }
  for (const name of classNames) {
    subclassByClass[name].sort();
    if (!subclassByClass[name].length) issues.push({ severity: "blocker", category: "missing-subclass", message: `${name} has no subclass` });
    else if (subclassByClass[name].length < 2) issues.push({ severity: "warning", category: "thin-subclass-coverage", message: `${name} has ${subclassByClass[name].length} subclass` });
  }

  const progression = classes.map((entry) => {
    const found = [...new Set(entry.levels.map((level) => level.level))].sort((a, b) => a - b);
    const missing = Array.from({ length: 20 }, (_, index) => index + 1).filter((level) => !found.includes(level));
    if (missing.length) issues.push({ severity: "blocker", category: "progression-gap", message: `${entry.name}: ${missing.join(", ")}` });
    return { className: entry.name, levelsFound: found, missingLevels: missing };
  });

  const spellLevelDistribution: Record<string, number> = {};
  const spellClassDistribution: Record<string, number> = {};
  for (const spell of spells) {
    spellLevelDistribution[String(spell.level)] = (spellLevelDistribution[String(spell.level)] ?? 0) + 1;
    for (const className of spell.classes) {
      spellClassDistribution[className] = (spellClassDistribution[className] ?? 0) + 1;
      if (!classSet.has(className)) issues.push({ severity: "blocker", category: "orphan-spell-class", message: `${spell.name} -> ${className}` });
    }
  }

  return {
    ruleset,
    counts: { classes: classes.length, subclasses: subclasses.length, races: races.length, backgrounds: backgrounds.length, feats: feats.length, spells: spells.length },
    classNames,
    raceNames: races.map((e) => e.name).sort(),
    backgroundNames: backgrounds.map((e) => e.name).sort(),
    featNames: feats.map((e) => e.name).sort(),
    subclassByClass,
    spellLevelDistribution,
    spellClassDistribution,
    progression,
    issues,
  };
}

function markdown(items: ReturnType<typeof inventory>[]) {
  const out = ["# E4 D&D Player Content Inventory v6.2A1", "", "Actual application catalogs, including expansion modules.", ""];
  for (const item of items) {
    out.push(`## ${item.ruleset}`, "", `- Classes: ${item.counts.classes}`, `- Subclasses: ${item.counts.subclasses}`, `- Races / ancestries: ${item.counts.races}`, `- Backgrounds: ${item.counts.backgrounds}`, `- Feats: ${item.counts.feats}`, `- Spells: ${item.counts.spells}`, "", "### Subclasses by class", "");
    for (const className of item.classNames) out.push(`- **${className}:** ${item.subclassByClass[className].join(", ") || "NONE"}`);
    out.push("", "### Spell levels", "");
    for (const [level, count] of Object.entries(item.spellLevelDistribution).sort(([a], [b]) => Number(a) - Number(b))) out.push(`- Level ${level}: ${count}`);
    out.push("", "### Structural findings", "");
    if (!item.issues.length) out.push("- No structural issue detected.");
    else for (const issue of item.issues) out.push(`- **${issue.severity.toUpperCase()} · ${issue.category}:** ${issue.message}`);
    out.push("");
  }
  out.push("## Note", "", "This proves internal catalog consistency, not full official-book completeness. The next phase compares this inventory with an explicit target catalog.", "");
  return out.join("\n");
}

describe("v6.2A1 player content inventory", () => {
  it("publishes merged 2014 and 2024 inventories without structural blockers", () => {
    const inventories = [inventory("dnd_2014"), inventory("dnd_2024")];
    const reports = path.join(root, "reports");
    fs.mkdirSync(reports, { recursive: true });
    fs.writeFileSync(path.join(reports, "PLAYER_CONTENT_INVENTORY_v6.2A1.json"), JSON.stringify({ generatedAt: new Date().toISOString(), inventories }, null, 2), "utf8");
    fs.writeFileSync(path.join(reports, "PLAYER_CONTENT_INVENTORY_v6.2A1.md"), markdown(inventories), "utf8");
    for (const item of inventories) expect(item.issues.filter((issue) => issue.severity === "blocker")).toEqual([]);
  });
});
