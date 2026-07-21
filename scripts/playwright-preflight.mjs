import { existsSync } from "node:fs";
import { chromium } from "@playwright/test";

const executable = process.env.E4_CHROMIUM_PATH || chromium.executablePath();
if (!existsSync(executable)) {
  console.error("Playwright Chromium bulunamadı.");
  console.error("Bir kez `npx playwright install chromium` çalıştır veya E4_CHROMIUM_PATH ile mevcut Chrome yolunu belirt.");
  process.exit(1);
}
console.log(`Playwright browser hazır: ${executable}`);
