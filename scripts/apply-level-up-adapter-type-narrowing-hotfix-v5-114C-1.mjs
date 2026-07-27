import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const adapterPath = resolve(
  root,
  "src/core/rulesets/levelUpCharacterAdapter.ts",
);

let source = await readFile(adapterPath, "utf8");

const startMarker =
  "export function applyCharacterLevelUp<";
const endMarker =
  "\nexport function serializeLevelUpCharacter";

const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker);

if (start < 0 || end < 0 || end <= start) {
  throw new Error(
    "applyCharacterLevelUp fonksiyon sınırları bulunamadı.",
  );
}

const replacement = `export function applyCharacterLevelUp<
  T extends LevelUpCompatibleCharacter,
>(
  character: T,
  choice: LevelUpChoice,
): T {
  const normalized = normalizeLevelUpCharacter(character);
  const classes = normalizeClasses(normalized.classes);
  const normalizedClassId = choice.classId
    .trim()
    .toLowerCase();

  const classEntry = classes.find(
    (entry) => entry.classId === normalizedClassId,
  );

  const previousLevel = Math.min(
    20,
    Math.max(1, int(normalized.level, 1)),
  );

  if (!classEntry || previousLevel >= 20) {
    return normalized;
  }

  const previousMaxHp = Math.max(
    1,
    int(normalized.maxHp, 1),
  );
  const ruleset = normalized.ruleset ?? "dnd_2014";

  const runtimeCharacter = runtimeApplySingleClassLevelUp(
    {
      level: previousLevel,
      ruleset,
      constitutionScore:
        resolveConstitutionScore(normalized),
      maxHp: previousMaxHp,
      classes,
    },
    classEntry.classId,
  );

  const runtimeClasses =
    runtimeCharacter.classes as CharacterClassEntry[];

  let next = {
    ...structuredClone(normalized),
    level: runtimeCharacter.level,
    maxHp: runtimeCharacter.maxHp,
    currentHp: Math.min(
      runtimeCharacter.maxHp,
      int(normalized.currentHp, previousMaxHp) +
        (runtimeCharacter.maxHp - previousMaxHp),
    ),
    classes: runtimeClasses,
    proficiencyBonus:
      runtimeProgressionPb(runtimeCharacter.level),
    cantripTier:
      runtimeCantripTier(runtimeCharacter.level),
    spellTier:
      runtimeSpellTier(runtimeCharacter.level),
  } as T;

  const nextClassEntry = runtimeClasses.find(
    (entry) => entry.classId === classEntry.classId,
  );

  const nextClassLevel =
    nextClassEntry?.classLevel ??
    classEntry.classLevel + 1;

  const milestone = runtimeBuildMilestone(
    classEntry.classId,
    ruleset,
    classEntry.classLevel,
    nextClassLevel,
  );

  if (milestone.grantsAsi) {
    if (choice.selectedFeatId) {
      next = applyFeatSelection(
        next,
        choice.selectedFeatId,
      );
    } else if (choice.abilityIncreases) {
      next = applyAbilityIncreases(
        next,
        choice.abilityIncreases,
      );
    }
  }

  next.pendingSubclassChoice =
    milestone.grantsSubclass &&
    !nextClassEntry?.subclassId;

  const history: LevelUpHistoryEntry[] =
    Array.isArray(next.levelUpHistory)
      ? next.levelUpHistory
      : [];

  const historyEntry: LevelUpHistoryEntry = {
    fromLevel: previousLevel,
    toLevel: runtimeCharacter.level,
    classId: classEntry.classId,
    hpGained:
      runtimeCharacter.maxHp - previousMaxHp,
    grantsAsi: milestone.grantsAsi,
    grantsSubclass: milestone.grantsSubclass,
    selectedFeatId:
      choice.selectedFeatId ?? null,
    abilityIncreases:
      choice.abilityIncreases,
  };

  next.levelUpHistory = [
    ...history,
    historyEntry,
  ];

  return next;
}
`;

source =
  source.slice(0, start) +
  replacement +
  source.slice(end);

await writeFile(adapterPath, source, "utf8");

const packagePath = resolve(root, "package.json");
const pkg = JSON.parse(
  await readFile(packagePath, "utf8"),
);

pkg.version = "5.114.4";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log(
  "v5.114C.1 Level-Up adapter type narrowing hotfix uygulandı.",
);
