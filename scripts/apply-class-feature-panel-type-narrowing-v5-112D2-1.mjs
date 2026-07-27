import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const panelPath = resolve(
  root,
  "src/components/classFeatures/ClassFeaturePanel.tsx",
);

let source = await readFile(panelPath, "utf8");

const before = `              {features.map((feature) => {
                const hasUses =
                  typeof feature.maxUses === "number" &&
                  typeof feature.currentUses === "number";

                return (
                  <article`;

const after = `              {features.map((feature) => {
                const currentUses =
                  typeof feature.currentUses === "number"
                    ? feature.currentUses
                    : null;
                const maxUses =
                  typeof feature.maxUses === "number"
                    ? feature.maxUses
                    : null;
                const hasUses =
                  currentUses !== null && maxUses !== null;

                return (
                  <article`;

if (!source.includes(after)) {
  if (!source.includes(before)) {
    throw new Error(
      "ClassFeaturePanel feature map bloğu bulunamadı.",
    );
  }

  source = source.replace(before, after);
}

source = source.replace(
  `{feature.currentUses}/{feature.maxUses}`,
  `{currentUses}/{maxUses}`,
);

source = source.replace(
  `disabled={feature.currentUses <= 0}`,
  `disabled={currentUses === null || currentUses <= 0}`,
);

source = source.replace(
  `disabled={feature.currentUses >= feature.maxUses}`,
  `disabled={
                            currentUses === null ||
                            maxUses === null ||
                            currentUses >= maxUses
                          }`,
);

if (
  source.includes("feature.currentUses <= 0") ||
  source.includes("feature.currentUses >= feature.maxUses")
) {
  throw new Error(
    "Type narrowing dönüşümü tamamlanamadı.",
  );
}

await writeFile(panelPath, source, "utf8");

const packagePath = resolve(root, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.version = "5.112.5";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log("v5.112D2.1 Class Feature Panel type narrowing uygulandı.");
