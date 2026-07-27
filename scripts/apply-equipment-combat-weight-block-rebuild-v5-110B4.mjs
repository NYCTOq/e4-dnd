import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const testPath = resolve(
  projectRoot,
  "src/certification/differential/equipmentCombatDifferential.test.ts",
);

let source = await readFile(testPath, "utf8");

function findStatementStart(text, position) {
  const candidate = text.lastIndexOf("it.each(", position);
  if (candidate < 0) {
    throw new Error("Weight testinin it.each başlangıcı bulunamadı.");
  }
  return candidate;
}

function findCallEnd(text, start) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "(" || char === "[" || char === "{") depth += 1;
    if (char === ")" || char === "]" || char === "}") depth -= 1;

    if (depth === 0 && char === ";") {
      return index + 1;
    }
  }

  throw new Error("Weight testinin bitişi bulunamadı.");
}

const weightCallPosition = source.indexOf("getInventoryWeight(");
if (weightCallPosition < 0) {
  throw new Error("getInventoryWeight çağrısı differential testte bulunamadı.");
}

const blockStart = findStatementStart(source, weightCallPosition);
const blockEnd = findCallEnd(source, blockStart);

const replacement = `
    const weightCases = [
      { name: "empty", inventory: [] },
      {
        name: "rope",
        inventory: [{ itemId: "rope", quantity: 1 }],
      },
      {
        name: "rope and longsword",
        inventory: [
          { itemId: "rope", quantity: 2 },
          { itemId: "longsword", quantity: 1 },
        ],
      },
      {
        name: "armor and shield",
        inventory: [
          { itemId: "chain-mail", quantity: 1 },
          { itemId: "shield", quantity: 1 },
        ],
      },
    ];

    for (const weightCase of weightCases) {
      it(\`weight \${weightCase.name}\`, () => {
        expect(
          getInventoryWeight(weightCase.inventory, ACTUAL_ITEMS),
        ).toBe(
          inventoryWeight(weightCase.inventory, REFERENCE_ITEMS),
        );
      });
    }
`;

source = source.slice(0, blockStart) + replacement + source.slice(blockEnd);
await writeFile(testPath, source, "utf8");

const packagePath = resolve(projectRoot, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.version = "5.110.5";
await writeFile(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

console.log("v5.110B4 weight test bloğu yeniden kuruldu.");
