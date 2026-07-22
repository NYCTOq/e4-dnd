import type {
  DndBackgroundData,
  DndClassData,
  DndFeatData,
  DndItemData,
  DndMonsterData,
  DndRaceData,
  DndSpellData,
  DndSubclassData,
  RulesetData,
} from "./ruleset.types";

export type ContentAuditSeverity = "blocker" | "warning" | "info";
export type ContentCatalogId =
  | "classes"
  | "subclasses"
  | "races"
  | "backgrounds"
  | "feats"
  | "spells"
  | "items"
  | "monsters";

export interface ContentAuditIssue {
  id: string;
  severity: ContentAuditSeverity;
  catalog: ContentCatalogId | "cross-reference";
  entity?: string;
  message: string;
}

export interface ContentCatalogAudit {
  id: ContentCatalogId;
  label: string;
  count: number;
  blockers: number;
  warnings: number;
  status: "pass" | "warning" | "fail";
}

export interface ContentIntegrityAudit {
  rulesetId: RulesetData["id"] | "missing";
  score: number;
  status: "certified" | "review" | "blocked";
  blockerCount: number;
  warningCount: number;
  infoCount: number;
  totalEntities: number;
  catalogs: ContentCatalogAudit[];
  issues: ContentAuditIssue[];
  missingCatalogs: string[];
}

const labels: Record<ContentCatalogId, string> = {
  classes: "Classes",
  subclasses: "Subclasses",
  races: "Race / Species",
  backgrounds: "Backgrounds",
  feats: "Feats",
  spells: "Spells",
  items: "Items",
  monsters: "Monsters",
};

function normalized(value: string | undefined | null): string {
  return (value ?? "").trim().toLocaleLowerCase("en-US");
}

function issue(
  issues: ContentAuditIssue[],
  severity: ContentAuditSeverity,
  catalog: ContentAuditIssue["catalog"],
  id: string,
  message: string,
  entity?: string,
): void {
  issues.push({ id, severity, catalog, message, entity });
}

function auditUniqueIds<T extends { id: string; name?: string }>(
  catalog: ContentCatalogId,
  values: T[],
  issues: ContentAuditIssue[],
): void {
  const ids = new Map<string, number>();
  for (const value of values) {
    const key = normalized(value.id);
    if (!key) {
      issue(issues, "blocker", catalog, `${catalog}-empty-id`, "Boş ID kaydı bulundu.", value.name);
      continue;
    }
    ids.set(key, (ids.get(key) ?? 0) + 1);
  }
  for (const [id, count] of ids) {
    if (count > 1) issue(issues, "blocker", catalog, `${catalog}-duplicate-${id}`, `Aynı ID ${count} kez kullanılıyor: ${id}.`);
  }
}

function auditClasses(classes: DndClassData[], issues: ContentAuditIssue[]): void {
  auditUniqueIds("classes", classes, issues);
  const names = new Set<string>();
  for (const item of classes) {
    const name = normalized(item.name);
    if (!name) issue(issues, "blocker", "classes", `class-name-${item.id}`, "Class adı boş.", item.id);
    if (names.has(name)) issue(issues, "blocker", "classes", `class-name-duplicate-${name}`, `Class adı tekrar ediyor: ${item.name}.`, item.name);
    names.add(name);
    if (![6, 8, 10, 12].includes(item.hitDie)) issue(issues, "blocker", "classes", `class-hit-die-${item.id}`, `Geçersiz Hit Die: d${item.hitDie}.`, item.name);
    const levels = [...item.levels].sort((a, b) => a.level - b.level);
    const seenLevels = new Set(levels.map((entry) => entry.level));
    if (levels.length !== 20 || seenLevels.size !== 20 || levels[0]?.level !== 1 || levels.at(-1)?.level !== 20) {
      issue(issues, "blocker", "classes", `class-levels-${item.id}`, "Class progression tablosu level 1–20 aralığını eksiksiz içermiyor.", item.name);
    }
    if (item.spellProgression === "none" && item.spellcastingAbility !== null) {
      issue(issues, "warning", "classes", `class-spell-ability-${item.id}`, "Spell progression olmayan class spellcasting ability taşıyor.", item.name);
    }
    if (item.spellProgression !== "none" && item.spellcastingAbility === null) {
      issue(issues, "blocker", "classes", `class-missing-spell-ability-${item.id}`, "Spellcaster class için spellcasting ability eksik.", item.name);
    }
    if (item.savingThrows.length !== 2) issue(issues, "blocker", "classes", `class-saves-${item.id}`, "Class tam olarak iki saving throw proficiency taşımalı.", item.name);
  }
  if (classes.length < 12) issue(issues, "blocker", "classes", "class-core-count", `Core class kataloğu eksik: ${classes.length}/12.`);
}

function auditSubclasses(subclasses: DndSubclassData[], classes: DndClassData[], issues: ContentAuditIssue[]): void {
  auditUniqueIds("subclasses", subclasses, issues);
  const classByName = new Map(classes.map((item) => [normalized(item.name), item]));
  for (const item of subclasses) {
    const parent = classByName.get(normalized(item.className));
    if (!parent) {
      issue(issues, "blocker", "subclasses", `subclass-parent-${item.id}`, `Bağlı class bulunamadı: ${item.className}.`, item.name);
      continue;
    }
    if (item.selectionLevel !== parent.subclassLevel) {
      issue(issues, "warning", "subclasses", `subclass-level-${item.id}`, `Selection level ${item.selectionLevel}, class beklentisi ${parent.subclassLevel}.`, item.name);
    }
    if (item.features.length === 0) issue(issues, "blocker", "subclasses", `subclass-feature-${item.id}`, "Subclass feature listesi boş.", item.name);
    if (item.features.some((feature) => feature.level < item.selectionLevel || feature.level > 20)) {
      issue(issues, "blocker", "subclasses", `subclass-feature-level-${item.id}`, "Subclass feature level aralığı geçersiz.", item.name);
    }
  }
  for (const classData of classes) {
    const count = subclasses.filter((item) => normalized(item.className) === normalized(classData.name)).length;
    if (count === 0) issue(issues, "blocker", "subclasses", `subclass-missing-${classData.id}`, `${classData.name} için subclass kaydı yok.`, classData.name);
  }
}

function auditRaces(races: DndRaceData[], issues: ContentAuditIssue[]): void {
  auditUniqueIds("races", races, issues);
  for (const item of races) {
    if (item.speed <= 0) issue(issues, "blocker", "races", `race-speed-${item.id}`, "Speed değeri pozitif olmalı.", item.name);
    if (!item.size) issue(issues, "blocker", "races", `race-size-${item.id}`, "Size kaydı eksik.", item.name);
    if (item.traits.length === 0) issue(issues, "warning", "races", `race-traits-${item.id}`, "Trait listesi boş.", item.name);
    if (item.subraces) auditUniqueIds("races", item.subraces, issues);
  }
}

function auditBackgrounds(backgrounds: DndBackgroundData[], feats: DndFeatData[], issues: ContentAuditIssue[]): void {
  auditUniqueIds("backgrounds", backgrounds, issues);
  const featNames = new Set(feats.map((feat) => normalized(feat.name)));
  const featIds = new Set(feats.map((feat) => normalized(feat.id)));
  for (const item of backgrounds) {
    if (item.skillProficiencies.length === 0) issue(issues, "warning", "backgrounds", `background-skills-${item.id}`, "Skill proficiency listesi boş.", item.name);
    if (item.originFeat && !featNames.has(normalized(item.originFeat)) && !featIds.has(normalized(item.originFeat))) {
      issue(issues, "blocker", "cross-reference", `background-feat-${item.id}`, `Origin feat bulunamadı: ${item.originFeat}.`, item.name);
    }
  }
}

function auditFeats(feats: DndFeatData[], rulesetId: RulesetData["id"], issues: ContentAuditIssue[]): void {
  auditUniqueIds("feats", feats, issues);
  for (const item of feats) {
    if (rulesetId !== "homebrew" && item.ruleset !== rulesetId) issue(issues, "blocker", "feats", `feat-ruleset-${item.id}`, `Feat ruleset kimliği uyuşmuyor: ${item.ruleset}.`, item.name);
    if (!item.summary.trim() || item.benefits.length === 0) issue(issues, "warning", "feats", `feat-description-${item.id}`, "Feat mekanik özeti eksik.", item.name);
    if ((item.choiceCount ?? 0) < 0) issue(issues, "blocker", "feats", `feat-choice-count-${item.id}`, "Choice count negatif olamaz.", item.name);
  }
}

function auditSpells(spells: DndSpellData[], classes: DndClassData[], issues: ContentAuditIssue[]): void {
  auditUniqueIds("spells", spells, issues);
  const classNames = new Set(classes.map((item) => normalized(item.name)));
  for (const item of spells) {
    if (item.level < 0 || item.level > 9) issue(issues, "blocker", "spells", `spell-level-${item.id}`, `Spell level geçersiz: ${item.level}.`, item.name);
    if (!item.school || !item.castingTime || !item.range || !item.duration) issue(issues, "blocker", "spells", `spell-metadata-${item.id}`, "Zorunlu spell metadata alanı eksik.", item.name);
    if (item.classes.length === 0) issue(issues, "warning", "spells", `spell-classless-${item.id}`, "Spell hiçbir class listesine bağlı değil.", item.name);
    for (const className of item.classes) {
      if (!classNames.has(normalized(className))) issue(issues, "blocker", "cross-reference", `spell-class-${item.id}-${normalized(className)}`, `Spell bilinmeyen class listesine bağlı: ${className}.`, item.name);
    }
    if (item.attackType === "saving-throw" && !item.saveAbility) issue(issues, "blocker", "spells", `spell-save-${item.id}`, "Saving throw spell için save ability eksik.", item.name);
  }
}

function auditItems(items: DndItemData[], issues: ContentAuditIssue[]): void {
  auditUniqueIds("items", items, issues);
  const itemIds = new Set(items.map((item) => normalized(item.id)));
  for (const item of items) {
    if (item.weight < 0) issue(issues, "blocker", "items", `item-weight-${item.id}`, "Item weight negatif olamaz.", item.name);
    if (item.category === "weapon" && !item.damage) issue(issues, "blocker", "items", `weapon-damage-${item.id}`, "Weapon damage formülü eksik.", item.name);
    if (item.category === "armor" && !item.armorClass) issue(issues, "blocker", "items", `armor-ac-${item.id}`, "Armor Class değeri eksik.", item.name);
    for (const content of item.contents ?? []) {
      if (!itemIds.has(normalized(content.itemId))) issue(issues, "blocker", "cross-reference", `item-content-${item.id}-${content.itemId}`, `Pack içeriği bulunamadı: ${content.itemId}.`, item.name);
      if (content.quantity <= 0) issue(issues, "blocker", "items", `item-content-quantity-${item.id}-${content.itemId}`, "Pack quantity pozitif olmalı.", item.name);
    }
  }
}

function auditMonsters(monsters: DndMonsterData[], issues: ContentAuditIssue[]): void {
  auditUniqueIds("monsters", monsters, issues);
  for (const item of monsters) {
    if (item.armorClass <= 0 || item.hitPoints <= 0) issue(issues, "blocker", "monsters", `monster-survival-${item.id}`, "Monster AC ve HP pozitif olmalı.", item.name);
    if (!item.challengeRating) issue(issues, "warning", "monsters", `monster-cr-${item.id}`, "Challenge Rating eksik.", item.name);
  }
}

export function getContentIntegrityAudit(ruleset: RulesetData | null): ContentIntegrityAudit {
  if (!ruleset) {
    return {
      rulesetId: "missing",
      score: 0,
      status: "blocked",
      blockerCount: 1,
      warningCount: 0,
      infoCount: 0,
      totalEntities: 0,
      catalogs: [],
      issues: [{ id: "ruleset-missing", severity: "blocker", catalog: "cross-reference", message: "Ruleset verisi yüklenmedi." }],
      missingCatalogs: ["Ruleset data"],
    };
  }

  const issues: ContentAuditIssue[] = [];
  auditClasses(ruleset.classes, issues);
  auditSubclasses(ruleset.subclasses, ruleset.classes, issues);
  auditRaces(ruleset.races, issues);
  auditBackgrounds(ruleset.backgrounds, ruleset.feats, issues);
  auditFeats(ruleset.feats, ruleset.id, issues);
  auditSpells(ruleset.spells, ruleset.classes, issues);
  auditItems(ruleset.items, issues);
  auditMonsters(ruleset.monsters, issues);

  const values: Record<ContentCatalogId, unknown[]> = {
    classes: ruleset.classes,
    subclasses: ruleset.subclasses,
    races: ruleset.races,
    backgrounds: ruleset.backgrounds,
    feats: ruleset.feats,
    spells: ruleset.spells,
    items: ruleset.items,
    monsters: ruleset.monsters,
  };
  const missingCatalogs = (Object.keys(values) as ContentCatalogId[])
    .filter((id) => values[id].length === 0)
    .map((id) => labels[id]);
  for (const catalog of missingCatalogs) issue(issues, "warning", "cross-reference", `catalog-empty-${catalog}`, `${catalog} kataloğu boş.`);

  const catalogs = (Object.keys(values) as ContentCatalogId[]).map((id) => {
    const related = issues.filter((entry) => entry.catalog === id);
    const blockers = related.filter((entry) => entry.severity === "blocker").length;
    const warnings = related.filter((entry) => entry.severity === "warning").length;
    return {
      id,
      label: labels[id],
      count: values[id].length,
      blockers,
      warnings,
      status: blockers > 0 ? "fail" : warnings > 0 ? "warning" : "pass",
    } satisfies ContentCatalogAudit;
  });

  const blockerCount = issues.filter((entry) => entry.severity === "blocker").length;
  const warningCount = issues.filter((entry) => entry.severity === "warning").length;
  const infoCount = issues.filter((entry) => entry.severity === "info").length;
  const totalEntities = Object.values(values).reduce((sum, entries) => sum + entries.length, 0);
  const penalty = blockerCount * 12 + warningCount * 2;
  const score = Math.max(0, Math.min(100, 100 - penalty));
  return {
    rulesetId: ruleset.id,
    score,
    status: blockerCount > 0 ? "blocked" : warningCount > 0 ? "review" : "certified",
    blockerCount,
    warningCount,
    infoCount,
    totalEntities,
    catalogs,
    issues,
    missingCatalogs,
  };
}
