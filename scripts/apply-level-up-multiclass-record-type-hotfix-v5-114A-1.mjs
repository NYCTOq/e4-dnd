import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const testPath = resolve(
  root,
  "src/certification/oracle/levelUpProgressionOracle.test.ts",
);

let source = await readFile(testPath, "utf8");

const before = `  for (const levels of [
    { fighter: 1 },
    { fighter: 5, wizard: 3 },
    { rogue: 10, ranger: 5, cleric: 5 },
    { wizard: -2, cleric: 4 },
  ]) {`;

const after = `  const multiclassLevelCases: Array<Record<string, number>> = [
    { fighter: 1 },
    { fighter: 5, wizard: 3 },
    { rogue: 10, ranger: 5, cleric: 5 },
    { wizard: -2, cleric: 4 },
  ];

  for (const levels of multiclassLevelCases) {`;

if (!source.includes(after)) {
  if (!source.includes(before)) {
    throw new Error(
      "Multiclass level case bloğu bulunamadı.",
    );
  }

  source = source.replace(before, after);
}

await writeFile(testPath, source, "utf8");

const packagePath = resolve(root, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.version = "5.114.1";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log(
  "v5.114A.1 multiclass Record type hotfix uygulandı.",
);
