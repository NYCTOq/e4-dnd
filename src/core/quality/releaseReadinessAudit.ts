import { navItems } from "../../shared/navigation/navItems";
import { hasEnglishTranslation } from "../../shared/i18n/i18n";

export type AuditStatus = "pass" | "warning" | "fail";

export type AuditCheck = {
  id: string;
  area: "localization" | "accessibility" | "licensing";
  status: AuditStatus;
  summary: string;
  details: string[];
};

export const OPEN_RULES_LICENSE = {
  name: "Creative Commons Attribution 4.0 International",
  shortName: "CC BY 4.0",
  sourceDocuments: ["SRD 5.1", "SRD 5.2.1"],
  attributionFile: "SRD_ATTRIBUTION.md",
  permitsOriginalSummaries: true,
} as const;

function uniqueValues(values: string[]) {
  return new Set(values).size === values.length;
}

export function auditNavigationLocalization(): AuditCheck {
  const missing = navItems.flatMap((item) => {
    const keys = [`nav.${item.to}`];
    if (item.mobile) keys.push(`short.${item.to}`);
    return keys.filter((key) => !hasEnglishTranslation(key));
  });

  return {
    id: "navigation-localization",
    area: "localization",
    status: missing.length === 0 ? "pass" : "fail",
    summary: missing.length === 0 ? "All navigation labels have English translations." : `${missing.length} navigation translations are missing.`,
    details: missing,
  };
}

export function auditNavigationAccessibility(): AuditCheck {
  const duplicateRoutes = uniqueValues(navItems.map((item) => item.to)) ? [] : ["Navigation routes must be unique."];
  const missingLabels = navItems.filter((item) => !item.label.trim() || !item.shortLabel.trim()).map((item) => item.to);
  const mobileWithoutShortLabel = navItems.filter((item) => item.mobile && !item.shortLabel.trim()).map((item) => item.to);
  const details = [...duplicateRoutes, ...missingLabels, ...mobileWithoutShortLabel];

  return {
    id: "navigation-accessibility",
    area: "accessibility",
    status: details.length === 0 ? "pass" : "fail",
    summary: details.length === 0 ? "Navigation routes and accessible labels are structurally valid." : "Navigation accessibility has blocking issues.",
    details,
  };
}

export function auditLicensing(): AuditCheck {
  const details = [
    ...OPEN_RULES_LICENSE.sourceDocuments.map((source) => `${source} acknowledged`),
    `${OPEN_RULES_LICENSE.shortName} attribution declared`,
    `Attribution file: ${OPEN_RULES_LICENSE.attributionFile}`,
  ];

  return {
    id: "open-rules-licensing",
    area: "licensing",
    status: OPEN_RULES_LICENSE.permitsOriginalSummaries ? "pass" : "warning",
    summary: "Open rules content is tracked under the declared SRD and CC attribution policy.",
    details,
  };
}

export function buildReleaseReadinessAudit() {
  const checks = [auditNavigationLocalization(), auditNavigationAccessibility(), auditLicensing()];
  return {
    checks,
    blockers: checks.filter((check) => check.status === "fail"),
    warnings: checks.filter((check) => check.status === "warning"),
    passed: checks.filter((check) => check.status === "pass").length,
    total: checks.length,
    ready: checks.every((check) => check.status !== "fail"),
  };
}
