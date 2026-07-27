import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const bridgePath = resolve(
  root,
  "src/core/rulesets/spellCastingPersistenceBridge.ts",
);

let source = await readFile(bridgePath, "utf8");

const before = `    if (mutation.type === "spend-slot") {
      return spendCharacterSpellSlot(
        character,
        mutation.level,
        Boolean(mutation.pact),
      );
    }

    if (mutation.type === "restore-slot") {
      return restoreCharacterSpellSlot(
        character,
        mutation.level,
        Boolean(mutation.pact),
      );
    }

    return setCharacterConcentration(character, mutation.spellId);`;

const after = `    if (mutation.type === "spend-slot") {
      return spendCharacterSpellSlot(
        character,
        mutation.level,
        Boolean(mutation.pact),
      );
    }

    if (mutation.type === "restore-slot") {
      return restoreCharacterSpellSlot(
        character,
        mutation.level,
        Boolean(mutation.pact),
      );
    }

    if (mutation.type === "set-concentration") {
      return setCharacterConcentration(
        character,
        mutation.spellId,
      );
    }

    return character;`;

if (!source.includes(after)) {
  if (!source.includes(before)) {
    throw new Error(
      "Caster mutation discriminant bloğu bulunamadı.",
    );
  }

  source = source.replace(before, after);
}

await writeFile(bridgePath, source, "utf8");

const packagePath = resolve(root, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.version = "5.113.6";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log(
  "v5.113D2.1 spell casting mutation discriminant hotfix uygulandı.",
);
