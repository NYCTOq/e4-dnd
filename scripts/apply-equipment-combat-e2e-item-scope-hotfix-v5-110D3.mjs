import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const specPath = resolve(
  projectRoot,
  "e2e/equipment-combat-certification.spec.ts",
);

let source = await readFile(specPath, "utf8");

const oldBlock = `      await expect(
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
      ).toBeVisible();`;

const newBlock = `      await expect(
        page.getByText(/longsword/i).filter({ visible: true }).first(),
      ).toBeVisible();

      await expect(
        page
          .getByText(/chain mail|chain-mail/i)
          .filter({ visible: true })
          .first(),
      ).toBeVisible();

      await expect(
        page.getByText(/shield/i).filter({ visible: true }).first(),
      ).toBeVisible();`;

if (!source.includes(oldBlock)) {
  throw new Error(
    "v5.110D2 item selector bloğu bulunamadı. Dosya beklenenden farklı.",
  );
}

source = source.replace(oldBlock, newBlock);

await writeFile(specPath, source, "utf8");

const packagePath = resolve(projectRoot, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.version = "5.110.11";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log("v5.110D3 item selector scope düzeltildi.");
