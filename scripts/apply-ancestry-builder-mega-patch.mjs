import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFile(resolve(root, path), "utf8");
const write = (path, value) => writeFile(resolve(root, path), value, "utf8");

function replaceOnce(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`${label}: expected source marker was not found.`);
  }
  return source.replace(needle, replacement);
}

const typePath = "src/core/character/character.types.ts";
let types = await read(typePath);
if (!types.includes("ancestryChoiceId?: string;")) {
  const marker = /(\n\s*subrace(?:\?)?:\s*string;\s*)/g;
  let count = 0;
  types = types.replace(marker, (match) => {
    count += 1;
    return `${match}
  ancestryChoiceId?: string;
  ancestrySkillProficiencies?: string[];
  ancestryOriginFeatId?: string;
  ancestryLanguageChoices?: string[];
  ancestrySize?: "Small" | "Medium";
  ancestrySpellIds?: string[];
`;
  });
  if (!count) throw new Error("character.types.ts: subrace field marker not found.");
  await write(typePath, types);
}

const proficiencyPath = "src/core/rulesets/proficiencyRules.ts";
let proficiency = await read(proficiencyPath);
if (!proficiency.includes("ancestrySkills: string[] = []")) {
  proficiency = replaceOnce(
    proficiency,
    `export function buildFinalSkillProficiencies(selected: string[], classData: DndClassData | null, background: DndBackgroundData | null) {
  return uniqueStrings([...getGrantedSkills(background), ...normalizeClassSkillChoices(selected, classData, background)]);
}`,
    `export function buildFinalSkillProficiencies(
  selected: string[],
  classData: DndClassData | null,
  background: DndBackgroundData | null,
  ancestrySkills: string[] = [],
) {
  return uniqueStrings([
    ...getGrantedSkills(background),
    ...normalizeClassSkillChoices(selected, classData, background),
    ...ancestrySkills,
  ]);
}`,
    "proficiencyRules.ts",
  );
  await write(proficiencyPath, proficiency);
}

const builderPath = "src/features/builder/Builder.tsx";
let builder = await read(builderPath);

if (!builder.includes('AncestryChoicePanel')) {
  builder = replaceOnce(
    builder,
    'import { NumberStepper } from "../../shared/forms/NumberStepper";',
    'import { NumberStepper } from "../../shared/forms/NumberStepper";\nimport { AncestryChoicePanel } from "./AncestryChoicePanel";\nimport { getAncestryBuilderContract, mergeAncestrySkills } from "../../core/rulesets/ancestryChoiceRules";',
    "Builder imports",
  );
}

if (!builder.includes("const ancestryContract = useMemo")) {
  builder = replaceOnce(
    builder,
    '  const selectedBackground = useMemo(() => activeRulesetData?.backgrounds.find((item) => item.name === draft.background) ?? null, [activeRulesetData, draft.background]);',
    `  const selectedBackground = useMemo(() => activeRulesetData?.backgrounds.find((item) => item.name === draft.background) ?? null, [activeRulesetData, draft.background]);
  const ancestryContract = useMemo(
    () => getAncestryBuilderContract(draft.ruleset, selectedRace, draft.subrace, draft.level),
    [draft.ruleset, draft.subrace, draft.level, selectedRace],
  );`,
    "Builder ancestry contract",
  );
}

builder = builder.replace(
  'const selectedFeatData = useMemo(() => (activeRulesetData?.feats ?? []).filter((feat) => draft.featIds.includes(feat.id)), [activeRulesetData, draft.featIds]);',
  'const selectedFeatData = useMemo(() => (activeRulesetData?.feats ?? []).filter((feat) => draft.featIds.includes(feat.id) || feat.id === draft.ancestryOriginFeatId), [activeRulesetData, draft.featIds, draft.ancestryOriginFeatId]);',
);

builder = builder.replace(
  'const finalSkillProficiencies = useMemo(() => buildFinalSkillProficiencies(draft.skillProficiencies, selectedClass, selectedBackground), [draft.skillProficiencies, selectedClass, selectedBackground]);',
  'const finalSkillProficiencies = useMemo(() => mergeAncestrySkills(buildFinalSkillProficiencies(draft.skillProficiencies, selectedClass, selectedBackground), ancestryContract, draft.ancestrySkillProficiencies), [draft.skillProficiencies, selectedClass, selectedBackground, ancestryContract, draft.ancestrySkillProficiencies]);',
);

if (!builder.includes('<AncestryChoicePanel')) {
  const marker = '              {activeRulesetError ? (';
  const index = builder.indexOf(marker, builder.indexOf('{activeStep.id === "class"'));
  if (index < 0) throw new Error("Builder class step insertion marker not found.");
  builder =
    builder.slice(0, index) +
    `              <AncestryChoicePanel
                draft={draft}
                race={selectedRace}
                feats={activeRulesetData?.feats ?? []}
                spells={activeRulesetData?.spells ?? []}
                onChange={setDraft}
              />

` +
    builder.slice(index);
}

const resetFragments = [
  'race: "", subrace: "", className:',
  'race: event.target.value, subrace: "", flexibleRaceAbilityPrimary:',
];
for (const fragment of resetFragments) {
  if (builder.includes(fragment) && !builder.includes(`${fragment} ancestryChoiceId:`)) {
    builder = builder.replace(
      fragment,
      `${fragment} ancestryChoiceId: undefined, ancestrySkillProficiencies: [], ancestryOriginFeatId: undefined, ancestryLanguageChoices: [], ancestrySize: undefined, ancestrySpellIds: [],`,
    );
  }
}
await write(builderPath, builder);

const packagePath = "package.json";
const pkg = JSON.parse(await read(packagePath));
pkg.version = "5.104.0";
pkg.scripts ??= {};
pkg.scripts["apply:ancestry-mega"] = "node scripts/apply-ancestry-builder-mega-patch.mjs";
pkg.scripts["verify:ancestry-mega"] =
  "npm run test -- ancestryChoiceRules levelOneAncestryReadiness proficiencyRules ancestryRuntimeRules && npm run build";
await write(packagePath, JSON.stringify(pkg, null, 2) + "\n");

const lockPath = "package-lock.json";
try {
  const lock = JSON.parse(await read(lockPath));
  lock.version = "5.104.0";
  if (lock.packages?.[""]) lock.packages[""].version = "5.104.0";
  await write(lockPath, JSON.stringify(lock, null, 2) + "\n");
} catch {
  console.warn("package-lock.json could not be updated.");
}

console.log("Ancestry/species builder mega patch applied.");
