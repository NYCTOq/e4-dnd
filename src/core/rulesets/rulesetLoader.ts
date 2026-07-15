import type { RulesetId } from "../character/character.types";
import type { DndBackgroundData, DndClassData, DndItemData, DndSubclassData, DndMonsterData, DndFeatData, DndRaceData, DndSpellData, RulesetData } from "./ruleset.types";
import { getRulesetDefinition } from "./rulesetRegistry";

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
  return { id, name: definition.name, classes, subclasses, races, backgrounds, feats, spells, items, monsters };
}

export const loadDnd2014Ruleset = () => loadRuleset("dnd_2014");
export const loadDnd2024Ruleset = () => loadRuleset("dnd_2024");
