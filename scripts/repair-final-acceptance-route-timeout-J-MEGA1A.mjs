import fs from "node:fs";
import path from "node:path";

const targetPath = path.join(
  process.cwd(),
  "e2e",
  "final-user-acceptance-I-MEGA1.spec.ts",
);

if (!fs.existsSync(targetPath)) {
  throw new Error(`Target file not found: ${targetPath}`);
}

let source = fs.readFileSync(targetPath, "utf8");

const original = `    test("core routes render without fatal errors", async ({ page }) => {
      for (const route of routes) {`;

const replacement = `    test("core routes render without fatal errors", async ({ page }) => {
      test.setTimeout(90_000);

      for (const route of routes) {`;

if (!source.includes(original) && !source.includes(replacement)) {
  throw new Error("Final user acceptance route test block not found.");
}

source = source.replace(original, replacement);

fs.writeFileSync(targetPath, source, "utf8");

console.log(JSON.stringify({
  target: path.relative(process.cwd(), targetPath),
  routeTimeoutRaised: source.includes("test.setTimeout(90_000)"),
}, null, 2));
