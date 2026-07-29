import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type CatalogDomain = {
  id: string;
  label: string;
  requiredAll: string[];
  blockers: string[];
  status: "ready" | "blocked";
};

const projectRoot = process.cwd();

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function makeDomain(
  id: string,
  label: string,
  requiredAll: string[],
): CatalogDomain {
  const blockers = requiredAll
    .filter((required) => !exists(required))
    .map((required) => `Missing required artifact: ${required}`);

  return {
    id,
    label,
    requiredAll,
    blockers,
    status: blockers.length === 0 ? "ready" : "blocked",
  };
}

function buildCatalogManifest() {
  const domains = [
    makeDomain("class-subclass", "Class and Subclass Catalogs", [
      "src/certification/discovery/classSubclassCatalogIntegrityDiscovery.test.ts",
      "src/certification/golden/classSubclassCatalogGoldenIntegration.test.ts",
      "src/core/rulesets/subclassExpansion.test.ts",
      "src/core/rulesets/contentIntegrityAudit.test.ts",
    ]),
    makeDomain("spell", "Spell Catalog and Runtime", [
      "src/core/rulesets/spellExpansion.test.ts",
      "src/core/rulesets/spellCertificationExpansion.test.ts",
      "src/core/rulesets/spellBuilderOfficial.test.ts",
      "src/core/rulesets/globalSpellRuntime.test.ts",
      "src/certification/integration/spellUiContract.test.ts",
    ]),
    makeDomain("feat-origin", "Feat and Origin Catalogs", [
      "src/core/rulesets/featOfficialCertification.test.ts",
      "src/core/rulesets/featCatalog2024Official.test.ts",
      "src/certification/player-readiness/originFeatRuntimeMatrix-v6.2C7.test.ts",
      "src/certification/oracle/classBackgroundOracle.test.ts",
    ]),
    makeDomain("items", "Equipment and Item Catalogs", [
      "src/core/rulesets/itemExpansion.test.ts",
      "src/core/rulesets/itemUseRules.test.ts",
      "src/core/rulesets/itemEffectRuntimeRules.test.ts",
      "src/core/rulesets/magicItemRules.test.ts",
      "src/core/rulesets/equipmentMagicItemFinalCoverage.integration.test.ts",
    ]),
    makeDomain("builder", "Builder and Choice Integration", [
      "src/features/builder/builderGuidance.test.ts",
      "src/core/rulesets/unifiedCharacterChoices.test.ts",
      "src/core/rulesets/levelUpChoiceCompletion.test.ts",
      "src/core/rulesets/builderSpellIntegration.test.ts",
      "src/core/rulesets/fullCharacterCertification.integration.test.ts",
    ]),
    makeDomain("discovery", "Search and Discovery", [
      "src/features/search/globalSearch.test.ts",
      "src/certification/discovery/navigationSearchDiscovery.test.ts",
      "src/certification/integration/navigationSearchDiscoveryContract.test.ts",
      "src/certification/differential/navigationSearchRouteParity.test.ts",
      "src/certification/integration/navigationSearchGoldenIntentContract.test.ts",
    ]),
    makeDomain("homebrew", "Homebrew Import and Security", [
      "src/core/homebrew/homebrewPackageSharing.test.ts",
      "src/core/homebrew/homebrewCreator.test.ts",
      "src/core/homebrew/homebrewBuilderIntegration.test.ts",
      "src/core/homebrew/homebrewRuntimeIntegration.test.ts",
      "src/core/homebrew/homebrewMarketplaceSecurity.test.ts",
      "src/core/homebrew/homebrewSecurityResolution.test.ts",
    ]),
    makeDomain("play-mode", "Catalog to Play Mode", [
      "src/core/character/sheetPlayModeConsistency.test.ts",
      "src/core/character/playReadiness.test.ts",
      "src/certification/integration/characterHubActionabilityContract.test.ts",
      "src/certification/player-readiness/finalPlayableRuntimeClosure-v6.2D6.test.ts",
      "e2e/content-catalog-expansion-F-MEGA2.spec.ts",
    ]),
  ];

  const blockers = domains.flatMap((domain) =>
    domain.blockers.map((message) => `${domain.label}: ${message}`),
  );

  return {
    domains,
    blockers,
    summary: {
      totalDomains: domains.length,
      readyDomains: domains.filter((domain) => domain.status === "ready").length,
      blockedDomains: domains.filter((domain) => domain.status === "blocked").length,
      blockerCount: blockers.length,
    },
  };
}

function writeReports(manifest: ReturnType<typeof buildCatalogManifest>) {
  const reportsDir = path.join(projectRoot, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    schemaVersion: "F-MEGA2",
    summary: manifest.summary,
    domains: manifest.domains,
    blockers: manifest.blockers,
  };

  fs.writeFileSync(
    path.join(reportsDir, "CONTENT_EXPANSION_CATALOG_CLOSURE_F_MEGA2.json"),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Content Expansion & Catalog Closure F-MEGA2",
    "",
    `- Ready domains: ${manifest.summary.readyDomains}/${manifest.summary.totalDomains}`,
    `- Blocked domains: ${manifest.summary.blockedDomains}/${manifest.summary.totalDomains}`,
    `- Blockers: ${manifest.summary.blockerCount}`,
    "",
  ];

  for (const domain of manifest.domains) {
    lines.push(
      `## ${domain.label}`,
      "",
      `- Status: **${domain.status.toUpperCase()}**`,
      `- Required artifacts: ${domain.requiredAll.length}`,
      "",
    );

    if (domain.blockers.length > 0) {
      lines.push("### Blockers", "");
      lines.push(...domain.blockers.map((entry) => `- ${entry}`), "");
    }
  }

  fs.writeFileSync(
    path.join(reportsDir, "CONTENT_EXPANSION_CATALOG_CLOSURE_F_MEGA2.md"),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("F-MEGA2 content expansion and catalog closure", () => {
  const manifest = buildCatalogManifest();
  const report = writeReports(manifest);

  it("keeps every catalog domain wired", () => {
    expect(report.summary.totalDomains).toBe(8);
    expect(report.summary.blockedDomains).toBe(0);
    expect(report.summary.blockerCount).toBe(0);
  });

  for (const domain of manifest.domains) {
    it(`${domain.label} is ready`, () => {
      expect(domain.status).toBe("ready");
      expect(domain.blockers).toEqual([]);
    });
  }
});
