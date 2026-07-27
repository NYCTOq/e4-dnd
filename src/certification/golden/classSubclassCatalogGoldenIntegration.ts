import type { Character } from "../../core/character/character.types";
import { getClassResources } from "../../core/rulesets/classFeatureEngine";
import { getSubclassRuntime } from "../../core/rulesets/subclassRuntimeRules";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { hydrateCharacterRecord } from "../../core/storage/characterStorage";
import type { ClassSubclassGoldenProfile } from "../reference/classSubclassGolden.reference";

const abilities = { str: 14, dex: 14, con: 14, int: 14, wis: 14, cha: 14 } as const;

export function createGoldenClassSubclassCharacter(
  profile: ClassSubclassGoldenProfile,
  data: RulesetData,
): Character {
  const klass = data.classes.find((entry) => entry.id === profile.classId);
  const subclass = data.subclasses.find((entry) => entry.id === profile.subclassId);
  if (!klass || !subclass) throw new Error(`Golden catalog entry is missing: ${profile.id}`);
  return {
    id: `golden-${profile.id}`,
    name: `Golden ${profile.className}`,
    playerName: "E4 Certification",
    ruleset: profile.edition,
    race: data.races[0]?.name ?? "Human",
    className: klass.name,
    classLevels: [{ className: klass.name, level: profile.level, subclass: subclass.name }],
    subclass: subclass.name,
    background: data.backgrounds[0]?.name ?? "Acolyte",
    featIds: [],
    skillProficiencies: [],
    expertiseSkills: [],
    toolProficiencies: [],
    languages: [],
    level: profile.level,
    abilities: { ...abilities },
    maxHp: Math.max(1, klass.hitDie + (profile.level - 1) * (Math.ceil(klass.hitDie / 2) + 1)),
    currentHp: Math.max(1, klass.hitDie),
    tempHp: 0,
    armorClass: 10,
    armorClassMode: "manual",
    knownSpellIds: [],
    preparedSpellIds: [],
    spellSlots: [],
    inventory: [],
    equippedArmorId: null,
    equippedShieldId: null,
    equippedWeaponIds: [],
    gold: 0,
    deathSaves: { successes: 0, failures: 0 },
    hitDice: [{ die: klass.hitDie, max: profile.level, used: 0 }],
    resources: getClassResources(klass.name, profile.level, abilities, profile.edition, subclass.name),
    exhaustion: 0,
    conditionDurations: {},
    conditions: [],
    notes: `Golden catalog profile ${profile.id}`,
    createdAt: "2026-07-27T00:00:00.000Z",
    updatedAt: "2026-07-27T00:00:00.000Z",
  };
}

export function certifyGoldenClassSubclassCharacter(
  profile: ClassSubclassGoldenProfile,
  data: RulesetData,
) {
  const source = createGoldenClassSubclassCharacter(profile, data);
  const subclass = data.subclasses.find((entry) => entry.id === profile.subclassId)!;
  const runtime = getSubclassRuntime(subclass, profile.level, 2);
  const edited = { ...source, name: `${source.name} Edited`, maxHp: source.maxHp + 1 };
  const restored = hydrateCharacterRecord(JSON.parse(JSON.stringify(edited)) as Character);
  const restoredSubclass = data.subclasses.find((entry) => entry.name === restored.subclass);
  const restoredRuntime = getSubclassRuntime(restoredSubclass, restored.level, 2);
  const checks = {
    catalogIdentity: source.className === profile.className && source.subclass === profile.subclassName,
    selectionLevel: subclass.selectionLevel === profile.level,
    featureUnlock: runtime.unlockedFeatures.length > 0 &&
      runtime.unlockedFeatures.every((feature) => feature.level <= profile.level),
    editPreserved: restored.name === edited.name && restored.maxHp === edited.maxHp,
    storagePreserved: restored.ruleset === source.ruleset &&
      restored.className === source.className &&
      restored.subclass === source.subclass &&
      restored.classLevels?.[0]?.subclass === source.classLevels?.[0]?.subclass,
    runtimePreserved: JSON.stringify(restoredRuntime) === JSON.stringify(runtime),
  };
  return {
    profile,
    source,
    restored,
    runtime,
    checks,
    passed: Object.values(checks).every(Boolean),
  };
}

