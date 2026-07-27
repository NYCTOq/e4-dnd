import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const bridgePath = resolve(
  root,
  "src/core/rulesets/spellCastingPersistenceBridge.ts",
);

let source = await readFile(bridgePath, "utf8");

if (!source.includes('mutation.type === "set-concentration"')) {
  const pattern =
    /return\s+setCharacterConcentration\s*\(\s*character\s*,\s*mutation\.spellId\s*,?\s*\)\s*;/m;

  if (!pattern.test(source)) {
    throw new Error(
      "setCharacterConcentration dönüş satırı bulunamadı.",
    );
  }

  source = source.replace(
    pattern,
    `if (mutation.type === "set-concentration") {
      return setCharacterConcentration(
        character,
        mutation.spellId,
      );
    }

    return character;`,
  );
}

if (!source.includes('mutation.type === "set-concentration"')) {
  throw new Error(
    "Discriminant guard uygulanamadı.",
  );
}

await writeFile(bridgePath, source, "utf8");

const packagePath = resolve(root, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.version = "5.113.7";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log(
  "v5.113D2.2 regex tabanlı mutation hotfix uygulandı.",
);
