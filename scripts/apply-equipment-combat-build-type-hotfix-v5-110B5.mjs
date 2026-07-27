import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const testPath = resolve(
  projectRoot,
  "src/certification/differential/equipmentCombatDifferential.test.ts",
);

let source = await readFile(testPath, "utf8");

if (!source.includes('cost:"0 gp"') && !source.includes('cost: "0 gp"')) {
  const compactNeedle = 'description:"",tags:[]';
  const spacedNeedle = 'description: "", tags: []';

  if (source.includes(compactNeedle)) {
    source = source.replace(
      compactNeedle,
      'cost:"0 gp",description:"",tags:[]',
    );
  } else if (source.includes(spacedNeedle)) {
    source = source.replace(
      spacedNeedle,
      'cost: "0 gp", description: "", tags: []',
    );
  } else {
    throw new Error(
      "DndItemData fixture objesi bulunamadı. Test dosyası beklenenden farklı.",
    );
  }
}

await writeFile(testPath, source, "utf8");

const packagePath = resolve(projectRoot, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.version = "5.110.6";
await writeFile(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

console.log("v5.110B5 DndItemData cost alanı eklendi.");
