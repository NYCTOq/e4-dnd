import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const testPath = resolve(
  process.cwd(),
  "src/certification/differential/equipmentCombatDifferential.test.ts",
);

const oldImport = "../../features/character/CharacterEditor";
const newImport = "../../features/characters/characterShared";

let content = await readFile(testPath, "utf8");

if (!content.includes(oldImport) && !content.includes(newImport)) {
  throw new Error(
    "Beklenen CharacterEditor import satırı bulunamadı. Dosya yapısı beklenenden farklı.",
  );
}

content = content.replaceAll(oldImport, newImport);
await writeFile(testPath, content, "utf8");

const packagePath = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.version = "5.110.2";
await writeFile(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

console.log("v5.110B1 import yolu düzeltildi.");
