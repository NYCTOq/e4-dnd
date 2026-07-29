import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const inventoryPath = path.join(
  projectRoot,
  "reports",
  "PLAYER_CONTENT_INVENTORY_v6.2A1.json",
);

if (!fs.existsSync(inventoryPath)) {
  throw new Error(
    "PLAYER_CONTENT_INVENTORY_v6.2A1.json not found. Run v6.2A1 first.",
  );
}

const parsed = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
const inventories = Array.isArray(parsed.inventories)
  ? parsed.inventories
  : [];

if (inventories.length !== 2) {
  throw new Error("Expected both dnd_2014 and dnd_2024 inventories.");
}

const priorities = [];

function pushPriority(entry) {
  priorities.push({
    id: `${entry.ruleset}-${entry.category}-${priorities.length + 1}`,
    ...entry,
  });
}

for (const inventory of inventories) {
  const ruleset = inventory.ruleset;
  const issues = Array.isArray(inventory.issues) ? inventory.issues : [];
  const subclassByClass = inventory.subclassByClass ?? {};
  const spellLevels = inventory.spellLevelDistribution ?? {};
  const spellClasses = inventory.spellClassDistribution ?? {};
  const progression = inventory.progression ?? {
    completeClasses: [],
    incompleteClasses: [],
  };

  for (const issue of issues) {
    pushPriority({
      ruleset,
      priority: issue.severity === "blocker" ? "P0" : "P2",
      category: issue.category,
      target: issue.message,
      reason:
        issue.severity === "blocker"
          ? "Oyuncu karakter kurma veya ilerletme akışını bozabilir."
          : "Katalog kapsamını inceltiyor ancak temel akışı doğrudan engellemiyor.",
    });
  }

  for (const [className, subclasses] of Object.entries(subclassByClass)) {
    const count = Array.isArray(subclasses) ? subclasses.length : 0;

    if (count === 0) {
      pushPriority({
        ruleset,
        priority: "P0",
        category: "subclass-coverage",
        target: className,
        reason: "Bu class için seçilebilir subclass bulunmuyor.",
      });
    } else if (count === 1) {
      pushPriority({
        ruleset,
        priority: "P1",
        category: "subclass-coverage",
        target: className,
        reason: "Oyuncu seçimi tek subclass ile sınırlı.",
      });
    } else if (count < 4) {
      pushPriority({
        ruleset,
        priority: "P2",
        category: "subclass-coverage",
        target: className,
        reason: `Yalnızca ${count} subclass mevcut; katalog genişletilmeli.`,
      });
    }
  }

  for (let level = 0; level <= 9; level += 1) {
    const count = Number(spellLevels[String(level)] ?? 0);

    if (count === 0) {
      pushPriority({
        ruleset,
        priority: "P0",
        category: "spell-level-coverage",
        target: `Spell level ${level}`,
        reason: "Bu spell seviyesinde hiç içerik bulunmuyor.",
      });
    } else if (count < 3) {
      pushPriority({
        ruleset,
        priority: "P1",
        category: "spell-level-coverage",
        target: `Spell level ${level}`,
        reason: `Yalnızca ${count} spell mevcut.`,
      });
    } else if (count < 8) {
      pushPriority({
        ruleset,
        priority: "P2",
        category: "spell-level-coverage",
        target: `Spell level ${level}`,
        reason: `Katalog ${count} spell ile sınırlı.`,
      });
    }
  }

  const classNames = Array.isArray(inventory.classNames)
    ? inventory.classNames
    : [];

  for (const className of classNames) {
    const spellCount = Number(spellClasses[className] ?? 0);

    if (spellCount > 0 && spellCount < 5) {
      pushPriority({
        ruleset,
        priority: "P1",
        category: "class-spell-coverage",
        target: className,
        reason: `Class spell listesinde yalnızca ${spellCount} spell mevcut.`,
      });
    }
  }

  for (const entry of progression.incompleteClasses ?? []) {
    pushPriority({
      ruleset,
      priority: "P0",
      category: "level-progression",
      target: entry.className,
      reason: `Eksik seviyeler: ${(entry.missingLevels ?? []).join(", ")}`,
    });
  }

  if ((inventory.counts?.races ?? 0) < 6) {
    pushPriority({
      ruleset,
      priority: "P1",
      category: "race-ancestry-coverage",
      target: `${inventory.counts?.races ?? 0} entry`,
      reason: "Oyuncu karakter kökeni seçimi dar.",
    });
  }

  if ((inventory.counts?.backgrounds ?? 0) < 6) {
    pushPriority({
      ruleset,
      priority: "P1",
      category: "background-coverage",
      target: `${inventory.counts?.backgrounds ?? 0} entry`,
      reason: "Background seçimi oyuncu çeşitliliği için yetersiz.",
    });
  }

  if ((inventory.counts?.feats ?? 0) < 10) {
    pushPriority({
      ruleset,
      priority: "P1",
      category: "feat-coverage",
      target: `${inventory.counts?.feats ?? 0} feat`,
      reason: "Feat ve ASI seçim aşamalarında seçenek havuzu dar.",
    });
  }
}

const rank = { P0: 0, P1: 1, P2: 2, P3: 3 };
priorities.sort((a, b) => {
  const priorityDifference = rank[a.priority] - rank[b.priority];
  if (priorityDifference !== 0) return priorityDifference;
  const rulesetDifference = a.ruleset.localeCompare(b.ruleset);
  if (rulesetDifference !== 0) return rulesetDifference;
  return a.category.localeCompare(b.category);
});

const summary = {
  P0: priorities.filter((entry) => entry.priority === "P0").length,
  P1: priorities.filter((entry) => entry.priority === "P1").length,
  P2: priorities.filter((entry) => entry.priority === "P2").length,
  total: priorities.length,
};

const output = {
  generatedAt: new Date().toISOString(),
  source: "reports/PLAYER_CONTENT_INVENTORY_v6.2A1.json",
  summary,
  priorities,
  recommendedExecutionOrder: [
    "P0 structural and progression blockers",
    "P1 player choice bottlenecks",
    "Class-by-class subclass completion",
    "Spell-level and class spell-list expansion",
    "Race, ancestry, background and feat expansion",
    "Official target manifest comparison",
  ],
};

const reportDir = path.join(projectRoot, "reports");
fs.mkdirSync(reportDir, { recursive: true });

fs.writeFileSync(
  path.join(reportDir, "PLAYER_CONTENT_GAP_PRIORITY_v6.2A2.json"),
  JSON.stringify(output, null, 2),
  "utf8",
);

const lines = [
  "# E4 D&D Player Content Gap Priority v6.2A2",
  "",
  `- P0: ${summary.P0}`,
  `- P1: ${summary.P1}`,
  `- P2: ${summary.P2}`,
  `- Total findings: ${summary.total}`,
  "",
  "## Ordered findings",
  "",
];

if (priorities.length === 0) {
  lines.push("- No threshold-based content gap found.");
} else {
  for (const entry of priorities) {
    lines.push(
      `- **${entry.priority} · ${entry.ruleset} · ${entry.category} · ${entry.target}:** ${entry.reason}`,
    );
  }
}

lines.push(
  "",
  "## Recommended execution order",
  "",
  ...output.recommendedExecutionOrder.map((entry, index) => `${index + 1}. ${entry}`),
  "",
  "This report prioritizes the current application inventory. It does not yet claim full official-book coverage.",
  "",
);

fs.writeFileSync(
  path.join(reportDir, "PLAYER_CONTENT_GAP_PRIORITY_v6.2A2.md"),
  lines.join("\n"),
  "utf8",
);

console.log(JSON.stringify(summary, null, 2));
