import type { RulesetData } from "./ruleset.types";
import type { ContentIntegrityAudit } from "./contentIntegrityAudit";

export type CompletionState = "complete" | "usable" | "incomplete";

export interface ContentCompletionTarget {
  id: keyof Pick<RulesetData, "classes" | "subclasses" | "races" | "backgrounds" | "feats" | "spells" | "items" | "monsters">;
  label: string;
  minimum: number;
  current: number;
  state: CompletionState;
  detail: string;
}

export interface ContentCompletionPlan {
  state: CompletionState;
  score: number;
  blockers: string[];
  reviewItems: string[];
  targets: ContentCompletionTarget[];
  compatibilityEntities: string[];
}

const minimums = {
  dnd_2014: { classes: 12, subclasses: 12, races: 9, backgrounds: 13, feats: 12, spells: 58, items: 35, monsters: 10 },
  dnd_2024: { classes: 12, subclasses: 12, races: 10, backgrounds: 16, feats: 20, spells: 58, items: 35, monsters: 10 },
  homebrew: { classes: 1, subclasses: 0, races: 1, backgrounds: 1, feats: 0, spells: 0, items: 0, monsters: 0 },
} as const;

const labels: Record<ContentCompletionTarget["id"], string> = {
  classes: "Classes",
  subclasses: "Subclasses",
  races: "Race / Species",
  backgrounds: "Backgrounds",
  feats: "Feats",
  spells: "Spells",
  items: "Items",
  monsters: "Monsters",
};

export function getContentCompletionPlan(ruleset: RulesetData | null, audit: ContentIntegrityAudit): ContentCompletionPlan {
  if (!ruleset) return { state: "incomplete", score: 0, blockers: ["Ruleset verisi yüklenmedi."], reviewItems: [], targets: [], compatibilityEntities: [] };
  const expected = minimums[ruleset.id];
  const ids = Object.keys(expected) as ContentCompletionTarget["id"][];
  const targets = ids.map((id) => {
    const minimum = expected[id];
    const current = ruleset[id].length;
    const state: CompletionState = current >= minimum ? "complete" : current > 0 ? "usable" : "incomplete";
    return { id, label: labels[id], minimum, current, state, detail: current >= minimum ? `Minimum hedef karşılandı: ${current}/${minimum}.` : `Katalog hedefi eksik: ${current}/${minimum}.` };
  });
  const compatibilityEntities = ruleset.monsters.filter((entry) => entry.source?.includes("compatibility baseline")).map((entry) => entry.name);
  const blockers = [
    ...audit.issues.filter((entry) => entry.severity === "blocker").map((entry) => entry.message),
    ...targets.filter((entry) => entry.state === "incomplete").map((entry) => `${entry.label} kataloğu boş.`),
  ];
  const reviewItems = [
    ...audit.issues.filter((entry) => entry.severity === "warning").map((entry) => entry.message),
    ...targets.filter((entry) => entry.state === "usable").map((entry) => `${entry.label} minimum hedefin altında.`),
    ...(compatibilityEntities.length ? [`${compatibilityEntities.length} monster compatibility stat block kullanıyor; 2024 revizyon kontrolü gerekiyor.`] : []),
  ];
  const completed = targets.reduce((sum, entry) => sum + Math.min(1, entry.current / Math.max(1, entry.minimum)), 0);
  const score = Math.round((completed / Math.max(1, targets.length)) * 100);
  return { state: blockers.length ? "incomplete" : reviewItems.length ? "usable" : "complete", score, blockers: [...new Set(blockers)], reviewItems: [...new Set(reviewItems)], targets, compatibilityEntities };
}
