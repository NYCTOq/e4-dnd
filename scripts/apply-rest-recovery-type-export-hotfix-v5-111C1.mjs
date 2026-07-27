import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const runtimePath = resolve(
  projectRoot,
  "src/core/rulesets/restRecoveryRules.ts",
);

let source = await readFile(runtimePath, "utf8");

const marker =
  'export type RestState={currentHp:number;maxHp:number;tempHp:number;hitDice:HitDiePool[];spellSlots:SpellSlotPool[];resources:ResourcePool[];exhaustion:number;deathSaves:{successes:number;failures:number};concentrating:boolean;activeEffects:ActiveEffect[]};';

const alias =
  `${marker}\nexport type RestRecoveryState = RestState;`;

if (source.includes("export type RestRecoveryState = RestState;")) {
  console.log("RestRecoveryState alias zaten mevcut.");
} else {
  if (!source.includes(marker)) {
    throw new Error(
      "RestState type tanımı bulunamadı. Runtime dosyası beklenenden farklı.",
    );
  }

  source = source.replace(marker, alias);
  await writeFile(runtimePath, source, "utf8");
}

const packagePath = resolve(projectRoot, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.version = "5.111.4";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log("v5.111C1 RestRecoveryState type export alias eklendi.");
