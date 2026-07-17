import type { RulesetData } from "./ruleset.types";
import {
  getRuntimeCoverageCertification,
  type RuntimeCategory,
  type RuntimeCoverageCertification,
  type RuntimeEntity,
  type RuntimeTier,
} from "./runtimeCoverageCertification";

export type RuntimeClosureDisposition = "closed" | "guided" | "table-ruling" | "blocked";

export type RuntimeClosureEntry = RuntimeEntity & {
  categoryId: RuntimeCategory["id"];
  categoryLabel: string;
  disposition: RuntimeClosureDisposition;
  action: string;
};

export type RuntimeCoverageClosureReport = {
  version: string;
  ready: boolean;
  score: number;
  missing: number;
  automatic: number;
  assisted: number;
  manual: number;
  blockers: string[];
  warnings: string[];
  entries: RuntimeClosureEntry[];
  certification: RuntimeCoverageCertification;
};

const DISPOSITION_BY_TIER: Record<RuntimeTier, RuntimeClosureDisposition> = {
  automatic: "closed",
  assisted: "guided",
  manual: "table-ruling",
  missing: "blocked",
};

function actionFor(entity: RuntimeEntity): string {
  if (entity.tier === "automatic") return "Shared runtime resolves the mechanical result.";
  if (entity.tier === "assisted") return "Keep the guided Play Mode plan visible and capture player/DM choices.";
  if (entity.tier === "manual") return "Keep the rules summary visible and document why a table ruling is required.";
  return "Add runtime metadata or an explicit manual policy before release.";
}

export function buildRuntimeCoverageClosureReport(
  data: RulesetData | null,
  version = "5.2.0",
): RuntimeCoverageClosureReport {
  const certification = getRuntimeCoverageCertification(data);
  const entries = certification.categories.flatMap((category) => category.entities.map((entity) => ({
    ...entity,
    categoryId: category.id,
    categoryLabel: category.label,
    disposition: DISPOSITION_BY_TIER[entity.tier],
    action: actionFor(entity),
  })));
  const count = (tier: RuntimeTier) => entries.filter((entry) => entry.tier === tier).length;
  const missing = count("missing");
  const manualEntries = entries.filter((entry) => entry.tier === "manual");
  const assistedEntries = entries.filter((entry) => entry.tier === "assisted");
  const blockers = entries
    .filter((entry) => entry.tier === "missing")
    .map((entry) => `${entry.categoryLabel} · ${entry.name}: ${entry.reason}`);
  if (!data) blockers.push(...certification.priorities);
  const warnings = [
    ...manualEntries.map((entry) => `${entry.categoryLabel} · ${entry.name}: table ruling required.`),
    ...assistedEntries.map((entry) => `${entry.categoryLabel} · ${entry.name}: guided runtime remains.`),
  ];

  return {
    version,
    ready: blockers.length === 0 && certification.status === "certified",
    score: certification.score,
    missing,
    automatic: count("automatic"),
    assisted: assistedEntries.length,
    manual: manualEntries.length,
    blockers,
    warnings,
    entries,
    certification,
  };
}

export function getRuntimeClosureEntry(
  report: RuntimeCoverageClosureReport,
  categoryId: RuntimeCategory["id"],
  entityId: string,
): RuntimeClosureEntry | undefined {
  return report.entries.find((entry) => entry.categoryId === categoryId && entry.id === entityId);
}

export function formatRuntimeCoverageClosureSummary(report: RuntimeCoverageClosureReport): string {
  return `Runtime closure v${report.version} · ${report.ready ? "READY" : "BLOCKED"} · ${report.score}% · ${report.automatic} automatic · ${report.assisted} assisted · ${report.manual} manual · ${report.missing} missing`;
}
