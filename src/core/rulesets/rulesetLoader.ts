import type {
  DndClassData,
  DndRaceData,
  DndSpellData,
  RulesetData,
} from "./ruleset.types";

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Data could not be loaded: ${path}`);
  }

  return response.json() as Promise<T>;
}

export async function loadDnd2014Ruleset(): Promise<RulesetData> {
  const [classes, races, spells] = await Promise.all([
    loadJson<DndClassData[]>("/data/dnd_2014/classes.json"),
    loadJson<DndRaceData[]>("/data/dnd_2014/races.json"),
    loadJson<DndSpellData[]>("/data/dnd_2014/spells.json"),
  ]);

  return {
    id: "dnd_2014",
    name: "D&D 2014",
    classes,
    races,
    spells,
  };
}
