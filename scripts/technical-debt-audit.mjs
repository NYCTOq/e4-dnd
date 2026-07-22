import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFile(resolve(root, path), "utf8");

const checks = [];

const inventoryTest = await read("src/core/rulesets/inventoryEconomyRuntime.test.ts");
checks.push({
  ok: inventoryTest.includes('cost: "0 gp"') || inventoryTest.includes('cost: "'),
  message: "Inventory item fixtures must use string costs.",
});
checks.push({
  ok: inventoryTest.includes("toMatchObject([{ itemId: \"arrow\", quantity: 12 }])"),
  message: "Normalized inventory assertions must tolerate canonical fields.",
});
checks.push({
  ok: !inventoryTest.includes("as DndItemData[]"),
  message: "Inventory tests must use the typed item factory instead of array casting.",
});

const combatSpec = await read("e2e/combat-runtime-automation.spec.ts");
checks.push({
  ok: combatSpec.includes('page.goto("/combat")') && !combatSpec.includes("/combat-tracker"),
  message: "Combat E2E must use the real /combat route.",
});

const e2eFiles = [
  "e2e/save-migration-data-safety.spec.ts",
  "e2e/combat-runtime-automation.spec.ts",
  "e2e/inventory-economy-runtime.spec.ts",
  "e2e/mobile-accessibility-performance.spec.ts",
];

for (const path of e2eFiles) {
  const contents = await read(path);
  checks.push({
    ok: contents.includes('from "./support/appState"'),
    message: `${path} must use the shared app-state helper.`,
  });
  checks.push({
    ok: !contents.includes("e4_dnd_first_run_guide_v1"),
    message: `${path} must not duplicate onboarding storage details.`,
  });
}

const failures = checks.filter((check) => !check.ok);
for (const check of checks) {
  console.log(`${check.ok ? "✓" : "✗"} ${check.message}`);
}

if (failures.length > 0) {
  console.error(`\nTechnical debt audit failed with ${failures.length} regression(s).`);
  process.exit(1);
}

console.log(`\nTechnical debt audit passed: ${checks.length}/${checks.length} checks.`);
