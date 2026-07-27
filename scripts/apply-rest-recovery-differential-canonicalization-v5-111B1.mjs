import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const testPath = resolve(
  projectRoot,
  "src/certification/differential/restRecoveryDifferential.test.ts",
);

let source = await readFile(testPath, "utf8");

const oldClean =
  'const clean=(s:any)=>JSON.parse(JSON.stringify(s));';

const newClean = `const clean = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(clean);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const normalized: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(record)) {
      if (key === "pact" && entry === false) {
        continue;
      }

      normalized[key] = clean(entry);
    }

    return normalized;
  }

  return value;
};`;

if (!source.includes(oldClean)) {
  throw new Error(
    "Differential clean helper bulunamadı. Dosya beklenenden farklı.",
  );
}

source = source.replace(oldClean, newClean);

await writeFile(testPath, source, "utf8");

const packagePath = resolve(projectRoot, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.version = "5.111.2";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log("v5.111B1 differential canonicalization uygulandı.");
