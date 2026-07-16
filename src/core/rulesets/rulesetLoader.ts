import type { RulesetId } from "../character/character.types";
import type { DndBackgroundData, DndClassData, DndItemData, DndSubclassData, DndMonsterData, DndFeatData, DndRaceData, DndSpellData, RulesetData } from "./ruleset.types";
import { getRulesetDefinition } from "./rulesetRegistry";
import { SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024 } from "./subclassExpansion";
import { FEAT_EXPANSION_2014, FEAT_EXPANSION_2024 } from "./featExpansion";
import { SPELL_EXPANSION_2014, SPELL_EXPANSION_2024 } from "./spellExpansion";
import { ITEM_EXPANSION_2014, ITEM_EXPANSION_2024 } from "./itemExpansion";
import { enrichClassProgression } from "./classProgressionAudit";

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Data could not be loaded: ${path}`);
  return response.json() as Promise<T>;
}

export async function loadRuleset(id: RulesetId): Promise<RulesetData> {
  const sourceId = id === "homebrew" ? "dnd_2014" : id;
  const baseUrl = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const root = `${baseUrl}data/${sourceId}`;
  const [classes, subclasses, races, backgrounds, feats, spells, items, monsters] = await Promise.all([
    loadJson<DndClassData[]>(`${root}/classes.json`),
    loadJson<DndSubclassData[]>(`${root}/subclasses.json`),
    loadJson<DndRaceData[]>(`${root}/races.json`),
    loadJson<DndBackgroundData[]>(`${root}/backgrounds.json`),
    loadJson<DndFeatData[]>(`${root}/feats.json`),
    loadJson<DndSpellData[]>(`${root}/spells.json`),
    loadJson<DndItemData[]>(`${root}/items.json`),
    loadJson<DndMonsterData[]>(`${root}/monsters.json`),
  ]);
  const definition = getRulesetDefinition(id);
  const expansion = sourceId === "dnd_2024" ? SUBCLASS_EXPANSION_2024 : SUBCLASS_EXPANSION_2014;
  const mergedSubclasses = [...subclasses, ...expansion.filter((candidate) => !subclasses.some((existing) => existing.id === candidate.id))];
  const featExpansion = sourceId === "dnd_2024" ? FEAT_EXPANSION_2024 : FEAT_EXPANSION_2014;
  const mergedFeats = [...feats, ...featExpansion.filter((candidate) => !feats.some((existing) => existing.id === candidate.id))];
  const spellExpansion = sourceId === "dnd_2024" ? SPELL_EXPANSION_2024 : SPELL_EXPANSION_2014;
  const mergedSpells = [...spells, ...spellExpansion.filter((candidate) => !spells.some((existing) => existing.id === candidate.id))];
  const itemExpansion = sourceId === "dnd_2024" ? ITEM_EXPANSION_2024 : ITEM_EXPANSION_2014;
  const mergedItems = [...items, ...itemExpansion.filter((candidate) => !items.some((existing) => existing.id === candidate.id))];
  const enrichedClasses = classes.map((classData) => enrichClassProgression(classData, sourceId));
  return { id, name: definition.name, classes: enrichedClasses, subclasses: mergedSubclasses, races, backgrounds, feats: mergedFeats, spells: mergedSpells, items: mergedItems, monsters };
}

export const loadDnd2014Ruleset = () => loadRuleset("dnd_2014");
export const loadDnd2024Ruleset = () => loadRuleset("dnd_2024");
