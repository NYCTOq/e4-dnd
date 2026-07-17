import type { RulesetData } from "../rulesets/ruleset.types";
import type { HomebrewEntity, HomebrewEntityType, HomebrewPackage } from "./homebrewFoundation";

export type HomebrewBuilderCatalog = {
  classes: HomebrewEntity<"class">[];
  subclasses: HomebrewEntity<"subclass">[];
  species: HomebrewEntity<"species">[];
  backgrounds: HomebrewEntity<"background">[];
  feats: HomebrewEntity<"feat">[];
  spells: HomebrewEntity<"spell">[];
  items: HomebrewEntity<"item">[];
};

const TYPES: HomebrewEntityType[] = ["class", "subclass", "species", "background", "feat", "spell", "item"];

function entitiesOf<T extends HomebrewEntityType>(packages: HomebrewPackage[], type: T): HomebrewEntity<T>[] {
  return packages.flatMap((pkg) => pkg.entities).filter((entity): entity is HomebrewEntity<T> => entity.type === type);
}

export function getHomebrewBuilderCatalog(packages: HomebrewPackage[]): HomebrewBuilderCatalog {
  return {
    classes: entitiesOf(packages, "class"),
    subclasses: entitiesOf(packages, "subclass"),
    species: entitiesOf(packages, "species"),
    backgrounds: entitiesOf(packages, "background"),
    feats: entitiesOf(packages, "feat"),
    spells: entitiesOf(packages, "spell"),
    items: entitiesOf(packages, "item"),
  };
}

function mergeById<T extends { id: string }>(base: T[], additions: T[]): T[] {
  const merged = new Map(base.map((item) => [item.id, item]));
  for (const item of additions) merged.set(item.id, item);
  return [...merged.values()];
}

export function mergeHomebrewIntoRuleset(base: RulesetData | null, packages: HomebrewPackage[]): RulesetData | null {
  if (!base) return null;
  const catalog = getHomebrewBuilderCatalog(packages);
  return {
    ...base,
    classes: mergeById(base.classes, catalog.classes.map((entity) => entity.payload)),
    subclasses: mergeById(base.subclasses, catalog.subclasses.map((entity) => entity.payload)),
    races: mergeById(base.races, catalog.species.map((entity) => entity.payload)),
    backgrounds: mergeById(base.backgrounds, catalog.backgrounds.map((entity) => entity.payload)),
    feats: mergeById(base.feats, catalog.feats.map((entity) => entity.payload)),
    spells: mergeById(base.spells, catalog.spells.map((entity) => entity.payload)),
    items: mergeById(base.items, catalog.items.map((entity) => entity.payload)),
  };
}

export function getHomebrewSelectionLabel(id: string, name: string, packages: HomebrewPackage[]): string {
  const isHomebrew = packages.some((pkg) => pkg.entities.some((entity) => entity.id === id));
  return isHomebrew ? `${name} · Homebrew` : name;
}

export function getHomebrewLevelUpOptions(ruleset: RulesetData | null, packages: HomebrewPackage[]) {
  const merged = mergeHomebrewIntoRuleset(ruleset, packages);
  return {
    classes: merged?.classes ?? [],
    subclasses: merged?.subclasses ?? [],
    feats: merged?.feats ?? [],
  };
}

export const HOMEBREW_BUILDER_ENTITY_TYPES = TYPES;
