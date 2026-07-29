import fs from "node:fs";
import path from "node:path";

const filePath = path.join(
  process.cwd(),
  "src",
  "certification",
  "player-readiness",
  "originFeatRuntimeMatrix-v6.2C7.test.ts",
);

if (!fs.existsSync(filePath)) {
  throw new Error(`Target file not found: ${filePath}`);
}

let source = fs.readFileSync(filePath, "utf8");

const oldBlock = `function featText(feat: DndFeatData): string {
  return [
    feat.name,
    feat.description,
    JSON.stringify(feat.prerequisite ?? ""),
  ]
    .join(" ")
    .toLowerCase();
}`;

const newBlock = `function featText(feat: DndFeatData): string {
  const raw = feat as DndFeatData & Record<string, unknown>;

  return [
    feat.name,
    typeof raw.description === "string" ? raw.description : "",
    typeof raw.summary === "string" ? raw.summary : "",
    typeof raw.details === "string" ? raw.details : "",
    JSON.stringify(feat.prerequisite ?? ""),
  ]
    .join(" ")
    .toLowerCase();
}`;

if (!source.includes(oldBlock) && !source.includes(newBlock)) {
  throw new Error("featText block not found.");
}

source = source.replace(oldBlock, newBlock);

fs.writeFileSync(filePath, source, "utf8");

console.log(JSON.stringify({
  path: path.relative(process.cwd(), filePath),
  safeFeatTextInstalled: source.includes("const raw = feat as DndFeatData & Record<string, unknown>;"),
}, null, 2));
