import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const specPath = resolve(
  projectRoot,
  "e2e/equipment-combat-certification.spec.ts",
);

let source = await readFile(specPath, "utf8");

const oldFighterAssertions = `      await expect(page.getByTestId("inventory-economy-panel")).toBeVisible();

      await expect(page.getByText(/longsword/i).first()).toBeVisible();
      await expect(page.getByText(/chain mail|chain-mail/i).first()).toBeVisible();
      await expect(page.getByText(/shield/i).first()).toBeVisible();

      await expect(page.getByText(/18/).first()).toBeVisible();
      await expect(page.getByText(/1d8/i).first()).toBeVisible();
      await expect(page.getByText(/sap/i).first()).toBeVisible();`;

const newFighterAssertions = `      const inventoryPanel = page.getByTestId("inventory-economy-panel");
      await expect(inventoryPanel).toBeVisible();

      await expect(
        inventoryPanel.getByText(/longsword/i).filter({ visible: true }).first(),
      ).toBeVisible();

      await expect(
        inventoryPanel
          .getByText(/chain mail|chain-mail/i)
          .filter({ visible: true })
          .first(),
      ).toBeVisible();

      await expect(
        inventoryPanel.getByText(/shield/i).filter({ visible: true }).first(),
      ).toBeVisible();

      const visibleMain = page.locator("main").filter({ visible: true });

      await expect(
        visibleMain.getByText(/^18$/).filter({ visible: true }).first(),
      ).toBeVisible();

      await expect(
        visibleMain.getByText(/1d8/i).filter({ visible: true }).first(),
      ).toBeVisible();

      await expect(
        visibleMain.getByText(/sap/i).filter({ visible: true }).first(),
      ).toBeVisible();`;

if (!source.includes(oldFighterAssertions)) {
  throw new Error(
    "Fighter assertion bloğu bulunamadı. Dosya beklenenden farklı.",
  );
}

source = source.replace(oldFighterAssertions, newFighterAssertions);

const oldWizardAssertions = `      await expect(page.getByText(/fire bolt/i).first()).toBeVisible();
      await expect(page.getByText(/12/).first()).toBeVisible();`;

const newWizardAssertions = `      const visibleMain = page.locator("main").filter({ visible: true });

      await expect(
        visibleMain.getByText(/fire bolt/i).filter({ visible: true }).first(),
      ).toBeVisible();

      await expect(
        visibleMain.getByText(/^12$/).filter({ visible: true }).first(),
      ).toBeVisible();`;

if (!source.includes(oldWizardAssertions)) {
  throw new Error(
    "Wizard assertion bloğu bulunamadı. Dosya beklenenden farklı.",
  );
}

source = source.replace(oldWizardAssertions, newWizardAssertions);

await writeFile(specPath, source, "utf8");

const packagePath = resolve(projectRoot, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.version = "5.110.10";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log("v5.110D2 görünür ve scoped E2E selectorları uygulandı.");
