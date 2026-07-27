import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const testPath = resolve(
  projectRoot,
  "src/certification/differential/equipmentCombatDifferential.test.ts",
);

let content = await readFile(testPath, "utf8");

const typedRestCallback =
  `(...inventory: Array<{ itemId: string; quantity: number }>) =>`;

if (!content.includes(typedRestCallback)) {
  const weightCallbackPattern =
    /(\)\s*\(\s*["'`]weight matches oracle:[^"'`]*["'`]\s*,\s*)\(inventory\)\s*=>/;

  if (!weightCallbackPattern.test(content)) {
    throw new Error(
      "Weight differential callback bulunamadı. Test dosyası beklenenden farklı.",
    );
  }

  content = content.replace(
    weightCallbackPattern,
    `$1${typedRestCallback}`,
  );
}

await writeFile(testPath, content, "utf8");

const packagePath = resolve(projectRoot, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.version = "5.110.4";
await writeFile(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

console.log("v5.110B3 weight matrix callback düzeltildi.");
