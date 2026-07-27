import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "src/features/builder/Builder.tsx");
let source = await readFile(path, "utf8");

const brokenRulesetReset = `race: "", subrace: "", className: ancestryChoiceId: undefined, ancestrySkillProficiencies: [], ancestryOriginFeatId: undefined, ancestryLanguageChoices: [], ancestrySize: undefined, ancestrySpellIds: [], "", subclass: "", background: "", originAbilityPrimary: undefined, originAbilitySecondary: undefined,`;

const fixedRulesetReset = `race: "",
                        subrace: "",
                        className: "",
                        subclass: "",
                        background: "",
                        ancestryChoiceId: undefined,
                        ancestrySkillProficiencies: [],
                        ancestryOriginFeatId: undefined,
                        ancestryLanguageChoices: [],
                        ancestrySize: undefined,
                        ancestrySpellIds: [],
                        originAbilityPrimary: undefined,
                        originAbilitySecondary: undefined,`;

const brokenRaceReset = `race: event.target.value, subrace: "", flexibleRaceAbilityPrimary: ancestryChoiceId: undefined, ancestrySkillProficiencies: [], ancestryOriginFeatId: undefined, ancestryLanguageChoices: [], ancestrySize: undefined, ancestrySpellIds: [], undefined, flexibleRaceAbilitySecondary: undefined`;

const fixedRaceReset = `race: event.target.value,
                          subrace: "",
                          ancestryChoiceId: undefined,
                          ancestrySkillProficiencies: [],
                          ancestryOriginFeatId: undefined,
                          ancestryLanguageChoices: [],
                          ancestrySize: undefined,
                          ancestrySpellIds: [],
                          flexibleRaceAbilityPrimary: undefined,
                          flexibleRaceAbilitySecondary: undefined`;

let changed = false;

if (source.includes(brokenRulesetReset)) {
  source = source.replace(brokenRulesetReset, fixedRulesetReset);
  changed = true;
}

if (source.includes(brokenRaceReset)) {
  source = source.replace(brokenRaceReset, fixedRaceReset);
  changed = true;
}

if (!changed) {
  const alreadyFixed =
    source.includes('ancestryChoiceId: undefined') &&
    source.includes('className: ""') &&
    source.includes('flexibleRaceAbilityPrimary: undefined');

  if (!alreadyFixed) {
    throw new Error("Beklenen bozuk Builder satırları bulunamadı; dosya farklı bir durumda.");
  }

  console.log("Builder syntax repair daha önce uygulanmış görünüyor.");
} else {
  await writeFile(path, source, "utf8");
  console.log("Builder syntax repair uygulandı.");
}
