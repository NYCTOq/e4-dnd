import fs from "node:fs";
import path from "node:path";

const filePath = path.join(
  process.cwd(),
  "e2e",
  "full-interactive-player-journey-E-MEGA1.spec.ts",
);

if (!fs.existsSync(filePath)) {
  throw new Error(`Target file not found: ${filePath}`);
}

let source = fs.readFileSync(filePath, "utf8");

const oldBlock = `      const manifestHref = await page
        .locator('link[rel="manifest"]')
        .getAttribute("href");`;

const newBlock = `      const manifestLinks = page.locator('link[rel="manifest"]');
      expect(await manifestLinks.count()).toBeGreaterThan(0);

      const manifestHref = await manifestLinks
        .first()
        .getAttribute("href");`;

if (!source.includes(oldBlock) && !source.includes(newBlock)) {
  throw new Error("Manifest locator block not found.");
}

source = source.replace(oldBlock, newBlock);

fs.writeFileSync(filePath, source, "utf8");

console.log(JSON.stringify({
  path: path.relative(process.cwd(), filePath),
  duplicateManifestSafe: source.includes("manifestLinks.count()"),
  firstManifestUsed: source.includes(".first()"),
}, null, 2));
