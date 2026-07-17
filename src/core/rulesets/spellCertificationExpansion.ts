import type { DndSpellData, RulesetData } from "./ruleset.types";
import { getSpellRuntimePlan, type SpellRuntimeTier } from "./globalSpellRuntime";

export type SpellCertificationFamily =
  | "damage"
  | "healing"
  | "concentration-control"
  | "summoning"
  | "movement"
  | "reaction"
  | "restoration"
  | "resurrection"
  | "material-cost"
  | "utility";

export type SpellCertificationDisposition = "automatic" | "guided" | "table-ruling" | "blocked";

export interface SpellCertificationEntry {
  spellId: string;
  spellName: string;
  level: number;
  families: SpellCertificationFamily[];
  runtimeTier: SpellRuntimeTier;
  disposition: SpellCertificationDisposition;
  ready: boolean;
  blockers: string[];
  guidance: string[];
}

export interface SpellFamilyCertification {
  family: SpellCertificationFamily;
  total: number;
  ready: number;
  automatic: number;
  guided: number;
  tableRuling: number;
  blocked: number;
  score: number;
}

export interface SpellCertificationExpansionReport {
  version: string;
  ready: boolean;
  score: number;
  total: number;
  automatic: number;
  guided: number;
  tableRuling: number;
  blocked: number;
  blockers: string[];
  warnings: string[];
  families: SpellFamilyCertification[];
  entries: SpellCertificationEntry[];
}

const FAMILY_ORDER: SpellCertificationFamily[] = [
  "damage",
  "healing",
  "concentration-control",
  "summoning",
  "movement",
  "reaction",
  "restoration",
  "resurrection",
  "material-cost",
  "utility",
];

const textOf = (spell: DndSpellData) => `${spell.name} ${spell.description} ${spell.higherLevels ?? ""}`.toLowerCase();

export function getSpellCertificationFamilies(spell: DndSpellData): SpellCertificationFamily[] {
  const text = textOf(spell);
  const families = new Set<SpellCertificationFamily>();
  if (spell.effectType === "damage" || spell.damageDice || spell.damageType) families.add("damage");
  if (spell.effectType === "healing" || spell.healingDice || /regain|restore.*hit point|healing/i.test(text)) families.add("healing");
  if (spell.concentration || spell.conditionEffect || /restrained|frightened|charmed|paralyzed|stunned|incapacitated/i.test(text)) families.add("concentration-control");
  if (spell.effectType === "summoning" || spell.tags?.includes("summon") || /summon|conjure|companion/i.test(text)) families.add("summoning");
  if (spell.effectType === "movement" || /teleport|move.*feet|movement speed|fly speed|misty step|dimension door/i.test(text)) families.add("movement");
  if (spell.reactionTrigger || /reaction/i.test(spell.castingTime) || /when .* (hits|attacks|takes damage)/i.test(text)) families.add("reaction");
  if (/remove.*condition|cure|disease|poison|curse|restoration|dispel/i.test(text)) families.add("restoration");
  if (/return.*life|raise dead|resurrect|revivify|revive/i.test(text)) families.add("resurrection");
  if (spell.materialCost || spell.materialConsumed) families.add("material-cost");
  if (!families.size) families.add("utility");
  return FAMILY_ORDER.filter((family) => families.has(family));
}

function validateSpell(spell: DndSpellData, families: SpellCertificationFamily[]): string[] {
  const blockers: string[] = [];
  if (!spell.description.trim()) blockers.push("Spell description is missing.");
  if (spell.level < 0 || spell.level > 9) blockers.push("Spell level must be between 0 and 9.");
  if (!spell.castingTime.trim()) blockers.push("Casting time is missing.");
  if (!spell.range.trim()) blockers.push("Range is missing.");
  if (families.includes("damage") && !spell.damageDice && !spell.attackType && !spell.saveAbility) blockers.push("Damage spell lacks dice or attack/save resolution metadata.");
  if (families.includes("healing") && !spell.healingDice && !/regain|restore.*hit point|healing/i.test(textOf(spell))) blockers.push("Healing spell lacks healing formula or explicit healing guidance.");
  if (families.includes("reaction") && !spell.reactionTrigger && !/reaction/i.test(spell.castingTime)) blockers.push("Reaction spell lacks a reaction trigger.");
  if (families.includes("material-cost") && !spell.materialCost) blockers.push("Costly or consumed material lacks a readable material cost.");
  if (families.includes("resurrection") && !spell.materialCost) blockers.push("Resurrection spell lacks material-cost metadata.");
  return blockers;
}

function dispositionFor(tier: SpellRuntimeTier, blockers: string[]): SpellCertificationDisposition {
  if (blockers.length) return "blocked";
  if (tier === "automatic") return "automatic";
  if (tier === "assisted") return "guided";
  return "table-ruling";
}

export function certifySpell(spell: DndSpellData, characterLevel = 20): SpellCertificationEntry {
  const families = getSpellCertificationFamilies(spell);
  const plan = getSpellRuntimePlan(spell, characterLevel, spell.level);
  const blockers = validateSpell(spell, families);
  const guidance = [...plan.guidance];
  if (families.includes("restoration")) guidance.push("Choose the exact condition, curse or magical effect removed.");
  if (families.includes("resurrection")) guidance.push("Confirm death window, body requirements and consumed material before resolving.");
  if (families.includes("reaction") && spell.reactionTrigger) guidance.push(`Reaction trigger: ${spell.reactionTrigger}`);
  if (plan.tier === "manual" && !blockers.length) guidance.push("Keep the spell rules visible and record the table ruling in the action result.");
  const disposition = dispositionFor(plan.tier, blockers);
  return {
    spellId: spell.id,
    spellName: spell.name,
    level: spell.level,
    families,
    runtimeTier: plan.tier,
    disposition,
    ready: disposition !== "blocked",
    blockers,
    guidance: [...new Set(guidance)],
  };
}

export function buildSpellCertificationExpansionReport(
  data: Pick<RulesetData, "spells"> | null,
  version = "5.3.0",
): SpellCertificationExpansionReport {
  if (!data) {
    return {
      version,
      ready: false,
      score: 0,
      total: 0,
      automatic: 0,
      guided: 0,
      tableRuling: 0,
      blocked: 0,
      blockers: ["Ruleset spell data could not be loaded."],
      warnings: [],
      families: [],
      entries: [],
    };
  }
  const entries = data.spells.map((spell) => certifySpell(spell));
  const count = (disposition: SpellCertificationDisposition) => entries.filter((entry) => entry.disposition === disposition).length;
  const automatic = count("automatic");
  const guided = count("guided");
  const tableRuling = count("table-ruling");
  const blocked = count("blocked");
  const total = entries.length;
  const score = total ? Math.round(((automatic + guided * 0.75 + tableRuling * 0.35) / total) * 100) : 0;
  const blockers = entries.flatMap((entry) => entry.blockers.map((blocker) => `${entry.spellName}: ${blocker}`));
  const warnings = entries
    .filter((entry) => entry.disposition === "guided" || entry.disposition === "table-ruling")
    .map((entry) => `${entry.spellName}: ${entry.disposition === "guided" ? "guided resolution" : "table ruling"} remains.`);
  const families = FAMILY_ORDER.map((family) => {
    const familyEntries = entries.filter((entry) => entry.families.includes(family));
    const familyCount = (disposition: SpellCertificationDisposition) => familyEntries.filter((entry) => entry.disposition === disposition).length;
    const familyAutomatic = familyCount("automatic");
    const familyGuided = familyCount("guided");
    const familyTableRuling = familyCount("table-ruling");
    const familyBlocked = familyCount("blocked");
    const familyTotal = familyEntries.length;
    return {
      family,
      total: familyTotal,
      ready: familyTotal - familyBlocked,
      automatic: familyAutomatic,
      guided: familyGuided,
      tableRuling: familyTableRuling,
      blocked: familyBlocked,
      score: familyTotal ? Math.round(((familyAutomatic + familyGuided * 0.75 + familyTableRuling * 0.35) / familyTotal) * 100) : 100,
    };
  }).filter((family) => family.total > 0);
  return { version, ready: blockers.length === 0, score, total, automatic, guided, tableRuling, blocked, blockers, warnings, families, entries };
}

export function formatSpellCertificationExpansionSummary(report: SpellCertificationExpansionReport): string {
  return `Spell certification v${report.version} · ${report.ready ? "READY" : "BLOCKED"} · ${report.score}% · ${report.automatic} automatic · ${report.guided} guided · ${report.tableRuling} table-ruling · ${report.blocked} blocked`;
}
