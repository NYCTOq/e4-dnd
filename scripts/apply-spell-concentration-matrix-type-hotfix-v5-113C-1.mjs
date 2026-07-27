import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const testPath = resolve(
  root,
  "src/certification/matrix/spellCharacterCombatPersistenceMatrix.test.ts",
);

let source = await readFile(testPath, "utf8");

const before = `      const character = setCharacterConcentration(
        { id: "caster" },
        spellId,
      );`;

const after = `      const baseCharacter: SpellCompatibleCharacter = {
        id: "caster",
      };

      const character = setCharacterConcentration(
        baseCharacter,
        spellId,
      );`;

if (!source.includes(after)) {
  if (!source.includes(before)) {
    throw new Error(
      "Concentration matrix bloğu bulunamadı.",
    );
  }

  source = source.replace(before, after);
}

await writeFile(testPath, source, "utf8");

const packagePath = resolve(root, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.version = "5.113.3";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log("v5.113C.1 concentration matrix type hotfix uygulandı.");
