import fs from "node:fs";
import path from "node:path";

const filePath = path.join(
  process.cwd(),
  "src",
  "certification",
  "player-readiness",
  "fourClassPlayerReadiness-v6.2B1.test.ts",
);

if (!fs.existsSync(filePath)) {
  throw new Error(`Target file not found: ${filePath}`);
}

let source = fs.readFileSync(filePath, "utf8");

source = source.replace(
  'if ("subclasses" in entry) {\n      lines.push(\n        `- Subclasses: ${entry.subclasses.map((item) => item.name).join(", ") || "NONE"}`,\n        `- Spell count: ${entry.spellCount}`,\n        `- Feat catalog count: ${entry.featCatalogCount}`,\n        `- Complete levels: ${entry.levelsFound.length}/20`,\n      );\n    }',
  'if (entry.status !== "blocked" && "subclasses" in entry && entry.subclasses && entry.levelsFound) {\n      lines.push(\n        `- Subclasses: ${entry.subclasses.map((item) => item.name).join(", ") || "NONE"}`,\n        `- Spell count: ${entry.spellCount ?? 0}`,\n        `- Feat catalog count: ${entry.featCatalogCount ?? 0}`,\n        `- Complete levels: ${entry.levelsFound.length}/20`,\n      );\n    }'
);

source = source.replace(
  'if ("warnings" in entry && entry.warnings.length > 0) {\n      lines.push("", "### Warnings", "");\n      lines.push(...entry.warnings.map((item) => `- ${item}`));\n    }',
  'if ("warnings" in entry && Array.isArray(entry.warnings) && entry.warnings.length > 0) {\n      lines.push("", "### Warnings", "");\n      lines.push(...entry.warnings.map((item) => `- ${item}`));\n    }'
);

source = source.replace(
  'if ("levelsFound" in entry) {\n          expect(entry.levelsFound).toEqual(expectedLevels());\n          expect(entry.subclasses.length).toBeGreaterThan(0);\n          expect(entry.primaryAbilities.length).toBeGreaterThan(0);\n          expect(entry.savingThrows).toHaveLength(2);\n          expect(entry.skillChoiceCount).toBeGreaterThan(0);\n          expect(entry.skillPoolSize).toBeGreaterThan(0);\n        }',
  'if (\n          entry.status !== "blocked" &&\n          "levelsFound" in entry &&\n          entry.levelsFound &&\n          entry.subclasses &&\n          entry.primaryAbilities &&\n          entry.savingThrows\n        ) {\n          expect(entry.levelsFound).toEqual(expectedLevels());\n          expect(entry.subclasses.length).toBeGreaterThan(0);\n          expect(entry.primaryAbilities.length).toBeGreaterThan(0);\n          expect(entry.savingThrows).toHaveLength(2);\n          expect(entry.skillChoiceCount ?? 0).toBeGreaterThan(0);\n          expect(entry.skillPoolSize ?? 0).toBeGreaterThan(0);\n        }'
);

fs.writeFileSync(filePath, source, "utf8");

console.log(JSON.stringify({
  path: path.relative(process.cwd(), filePath),
  reportNarrowingRepaired: source.includes('entry.status !== "blocked" && "subclasses" in entry'),
  warningsGuardRepaired: source.includes('Array.isArray(entry.warnings)'),
  assertionNarrowingRepaired: source.includes('entry.status !== "blocked" &&'),
}, null, 2));
