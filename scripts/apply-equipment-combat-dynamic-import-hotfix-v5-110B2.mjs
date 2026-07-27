import { readFile, writeFile, readdir } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";

const projectRoot = process.cwd();
const srcRoot = resolve(projectRoot, "src");
const testPath = resolve(
  srcRoot,
  "certification/differential/equipmentCombatDifferential.test.ts",
);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
      continue;
    }

    if ([".ts", ".tsx"].includes(extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

async function findExportedFunction(functionName) {
  const files = await walk(srcRoot);
  const testNormalized = testPath.toLowerCase();

  for (const filePath of files) {
    if (filePath.toLowerCase() === testNormalized) continue;

    const content = await readFile(filePath, "utf8");
    const patterns = [
      `export function ${functionName}`,
      `export const ${functionName}`,
      `export async function ${functionName}`,
    ];

    if (patterns.some((pattern) => content.includes(pattern))) {
      return filePath;
    }
  }

  throw new Error(`Export edilen fonksiyon bulunamadı: ${functionName}`);
}

function toImportPath(fromFile, targetFile) {
  let importPath = relative(dirname(fromFile), targetFile)
    .split(sep)
    .join("/")
    .replace(/\.(tsx?|jsx?)$/i, "");

  if (!importPath.startsWith(".")) {
    importPath = `./${importPath}`;
  }

  return importPath;
}

let testContent = await readFile(testPath, "utf8");

const replacements = [
  {
    functionName: "getLevelOneCombatReadiness",
    oldPath: "../../core/rulesets/combatReadiness",
  },
];

for (const replacement of replacements) {
  const realFile = await findExportedFunction(replacement.functionName);
  const realImportPath = toImportPath(testPath, realFile);

  if (!testContent.includes(replacement.oldPath)) {
    if (!testContent.includes(realImportPath)) {
      throw new Error(
        `Düzeltilecek import bulunamadı: ${replacement.oldPath}`,
      );
    }
  } else {
    testContent = testContent.replaceAll(
      replacement.oldPath,
      realImportPath,
    );
  }

  console.log(
    `${replacement.functionName} bulundu: ${realImportPath}`,
  );
}

await writeFile(testPath, testContent, "utf8");

const packagePath = resolve(projectRoot, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.version = "5.110.3";
await writeFile(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

console.log("v5.110B2 dinamik import hotfix uygulandı.");
