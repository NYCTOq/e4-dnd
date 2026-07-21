import type { CharacterDraft } from "../character/character.types";

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export type ClassSpellSelection = {
  knownSpellIds: string[];
  preparedSpellIds: string[];
};

export function getClassSpellSelection(
  draft: Pick<CharacterDraft, "knownSpellIds" | "preparedSpellIds" | "classKnownSpellIds" | "classPreparedSpellIds">,
  className: string,
): ClassSpellSelection {
  const key = normalizeKey(className);
  return {
    knownSpellIds: unique(draft.classKnownSpellIds?.[key] ?? []),
    preparedSpellIds: unique(draft.classPreparedSpellIds?.[key] ?? []),
  };
}

export function setClassSpellSelection(
  draft: CharacterDraft,
  className: string,
  selection: ClassSpellSelection,
): CharacterDraft {
  const key = normalizeKey(className);
  const classKnownSpellIds = {
    ...(draft.classKnownSpellIds ?? {}),
    [key]: unique(selection.knownSpellIds),
  };
  const classPreparedSpellIds = {
    ...(draft.classPreparedSpellIds ?? {}),
    [key]: unique(selection.preparedSpellIds),
  };

  const knownSpellIds = unique(Object.values(classKnownSpellIds).flat());
  const preparedSpellIds = unique(Object.values(classPreparedSpellIds).flat());
  const spellSources = { ...(draft.spellSources ?? {}) };

  for (const [sourceClass, ids] of Object.entries(classKnownSpellIds)) {
    for (const spellId of ids) spellSources[spellId] = sourceClass;
  }

  for (const spellId of Object.keys(spellSources)) {
    if (!knownSpellIds.includes(spellId)) delete spellSources[spellId];
  }

  return {
    ...draft,
    knownSpellIds,
    preparedSpellIds,
    spellSources,
    classKnownSpellIds,
    classPreparedSpellIds,
  };
}

export function hydrateClassSpellSelections(
  draft: CharacterDraft,
  classNames: string[],
): CharacterDraft {
  if (Object.keys(draft.classKnownSpellIds ?? {}).length) return draft;
  const fallbackClass = normalizeKey(classNames[0] ?? draft.className);
  if (!fallbackClass) return draft;
  return setClassSpellSelection(draft, fallbackClass, {
    knownSpellIds: draft.knownSpellIds,
    preparedSpellIds: draft.preparedSpellIds,
  });
}
