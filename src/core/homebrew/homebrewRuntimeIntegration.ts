import type { Character, CharacterResource, ResourceRecovery } from "../character/character.types";
import type { HomebrewEntity, HomebrewPackage, HomebrewRecovery, HomebrewRuntimeAction } from "./homebrewFoundation";
import { getHomebrewResourceMaximum, recoverHomebrewResource } from "./homebrewFoundation";

export type HomebrewRuntimeResource = CharacterResource & {
  sourceEntityId: string;
  definitionId: string;
};

export type HomebrewRuntimeActionState = {
  id: string;
  entityId: string;
  entityName: string;
  action: HomebrewRuntimeAction;
  resourceId?: string;
  available: boolean;
  reason?: string;
};

export type HomebrewCharacterRuntime = {
  entities: HomebrewEntity[];
  resources: HomebrewRuntimeResource[];
  actions: HomebrewRuntimeActionState[];
  progressionFeatures: Array<{ entityId: string; entityName: string; level: number; name: string; summary: string }>;
  needsResourceSync: boolean;
};

function normalize(value: string | undefined): string {
  return (value ?? "").trim().toLocaleLowerCase("tr-TR");
}

export function getHomebrewCharacterEntities(character: Character, packages: HomebrewPackage[]): HomebrewEntity[] {
  const inventoryIds = new Set(character.inventory.map((entry) => entry.itemId));
  const spellIds = new Set([...character.knownSpellIds, ...character.preparedSpellIds]);
  return packages.flatMap((pkg) => pkg.entities).filter((entity) => {
    const payload = entity.payload as { id?: string; name?: string; className?: string };
    switch (entity.type) {
      case "class": return normalize(payload.name) === normalize(character.className) || payload.id === character.className;
      case "subclass": return normalize(payload.name) === normalize(character.subclass) || payload.id === character.subclass;
      case "species": return normalize(payload.name) === normalize(character.race) || payload.id === character.race;
      case "background": return normalize(payload.name) === normalize(character.background) || payload.id === character.background;
      case "feat": return character.featIds.includes(entity.id);
      case "spell": return spellIds.has(entity.id);
      case "item": return inventoryIds.has(entity.id);
    }
  });
}

function runtimeResourceId(entityId: string, definitionId: string): string {
  return `homebrew:${entityId}:${definitionId}`;
}

function mapRecovery(recovery: HomebrewRecovery): ResourceRecovery {
  if (recovery === "short-rest") return "short";
  if (recovery === "long-rest" || recovery === "dawn") return "long";
  return "manual";
}

export function getHomebrewCharacterRuntime(character: Character, packages: HomebrewPackage[]): HomebrewCharacterRuntime {
  const entities = getHomebrewCharacterEntities(character, packages);
  const resources: HomebrewRuntimeResource[] = entities.flatMap((entity) => (entity.resources ?? []).map((definition) => {
    const id = runtimeResourceId(entity.id, definition.id);
    const existing = character.resources.find((resource) => resource.id === id);
    const max = getHomebrewResourceMaximum(definition, character.level);
    return {
      id,
      name: definition.name,
      max,
      used: Math.min(max, Math.max(0, existing?.used ?? 0)),
      recovery: mapRecovery(definition.recovery),
      sourceEntityId: entity.id,
      definitionId: definition.id,
    };
  }));
  const resourceMap = new Map(resources.map((resource) => [resource.id, resource]));
  const actions = entities.flatMap((entity) => (entity.actions ?? []).map((action): HomebrewRuntimeActionState => {
    const resourceId = action.resourceId ? runtimeResourceId(entity.id, action.resourceId) : undefined;
    const resource = resourceId ? resourceMap.get(resourceId) : undefined;
    const cost = action.resourceCost ?? 0;
    const available = action.economy === "passive" || !resourceId || Boolean(resource && resource.max - resource.used >= cost);
    return {
      id: `${entity.id}:${action.id}`,
      entityId: entity.id,
      entityName: entity.name,
      action,
      resourceId,
      available,
      reason: available ? undefined : resource ? `${resource.name} yetersiz.` : "Bağlı Homebrew kaynağı bulunamadı.",
    };
  }));
  const progressionFeatures = entities.flatMap((entity) => {
    if (entity.type === "class") {
      const payload = entity.payload as { levels?: Array<{ level: number; features?: Array<string | { name?: string; summary?: string }> }> };
      return (payload.levels ?? []).filter((row) => row.level <= character.level).flatMap((row) => (row.features ?? []).map((feature) => ({
        entityId: entity.id,
        entityName: entity.name,
        level: row.level,
        name: typeof feature === "string" ? feature : feature.name ?? "Homebrew Feature",
        summary: typeof feature === "string" ? feature : feature.summary ?? feature.name ?? "Homebrew feature.",
      })));
    }
    if (entity.type === "subclass") {
      const payload = entity.payload as { features?: Array<{ level: number; name: string; summary: string }> };
      return (payload.features ?? []).filter((feature) => feature.level <= character.level).map((feature) => ({ entityId: entity.id, entityName: entity.name, ...feature }));
    }
    return [];
  });
  const needsResourceSync = resources.some((resource) => {
    const existing = character.resources.find((item) => item.id === resource.id);
    return !existing || existing.max !== resource.max || existing.recovery !== resource.recovery || existing.name !== resource.name;
  });
  return { entities, resources, actions, progressionFeatures, needsResourceSync };
}

export function synchronizeHomebrewResources(character: Character, packages: HomebrewPackage[]): CharacterResource[] {
  const runtime = getHomebrewCharacterRuntime(character, packages);
  const runtimeIds = new Set(runtime.resources.map((resource) => resource.id));
  return [
    ...character.resources.filter((resource) => !resource.id.startsWith("homebrew:") || runtimeIds.has(resource.id)).map((resource) => {
      const expected = runtime.resources.find((item) => item.id === resource.id);
      return expected ? { ...resource, name: expected.name, max: expected.max, used: Math.min(expected.max, resource.used), recovery: expected.recovery } : resource;
    }),
    ...runtime.resources.filter((resource) => !character.resources.some((existing) => existing.id === resource.id)).map(({ sourceEntityId: _source, definitionId: _definition, ...resource }) => resource),
  ];
}

export function executeHomebrewRuntimeAction(character: Character, packages: HomebrewPackage[], actionId: string): Character {
  const prepared = { ...character, resources: synchronizeHomebrewResources(character, packages) };
  const runtime = getHomebrewCharacterRuntime(prepared, packages);
  const state = runtime.actions.find((candidate) => candidate.id === actionId);
  if (!state) throw new Error("Homebrew action bulunamadı.");
  if (!state.available) throw new Error(state.reason ?? "Homebrew action kullanılamıyor.");
  if (!state.resourceId || state.action.economy === "passive") return prepared;
  const cost = state.action.resourceCost ?? 0;
  return {
    ...prepared,
    resources: prepared.resources.map((resource) => resource.id === state.resourceId ? { ...resource, used: Math.min(resource.max, resource.used + cost) } : resource),
    updatedAt: new Date().toISOString(),
  };
}

export function recoverHomebrewCharacterResources(character: Character, packages: HomebrewPackage[], trigger: HomebrewRecovery): CharacterResource[] {
  const entities = getHomebrewCharacterEntities(character, packages);
  const definitions = new Map(entities.flatMap((entity) => (entity.resources ?? []).map((definition) => [runtimeResourceId(entity.id, definition.id), definition] as const)));
  return synchronizeHomebrewResources(character, packages).map((resource) => {
    const definition = definitions.get(resource.id);
    if (!definition) return resource;
    return { ...resource, used: recoverHomebrewResource(definition, resource.used, trigger, character.level) };
  });
}
