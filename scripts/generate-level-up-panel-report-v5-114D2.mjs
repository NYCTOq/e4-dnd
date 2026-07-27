import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const dir = resolve(
  process.cwd(),
  "certification-reports",
);
await mkdir(dir, { recursive: true });

await writeFile(
  resolve(
    dir,
    "level-up-panel-persistence-v5.114D2.json",
  ),
  JSON.stringify(
    {
      package: "v5.114D2",
      domain: "level-up-ui-integration",
      generatedAt: new Date().toISOString(),
      panel:
        "src/components/levelup/LevelUpRuntimePanel.tsx",
      bridge:
        "src/core/rulesets/levelUpPersistenceBridge.ts",
      coverage: [
        "class selection",
        "level milestone summary",
        "ASI selection",
        "feat selection",
        "subclass pending warning",
        "character persistence",
        "wrapped storage",
        "legacy storage discovery",
        "homebrew metadata preservation",
      ],
      next:
        "real Builder / Character Detail / Play Mode mount and E2E",
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log(
  "Level-up panel persistence report generated.",
);
