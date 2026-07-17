import { describe, expect, it } from "vitest";
import {
  OPEN_RULES_LICENSE,
  auditLicensing,
  auditNavigationAccessibility,
  auditNavigationLocalization,
  buildReleaseReadinessAudit,
} from "./releaseReadinessAudit";

describe("localization, accessibility and licensing release audit", () => {
  it("certifies every desktop and mobile navigation translation", () => expect(auditNavigationLocalization()).toMatchObject({ status: "pass", details: [] }));
  it("certifies unique routes and non-empty navigation labels", () => expect(auditNavigationAccessibility()).toMatchObject({ status: "pass", details: [] }));
  it("declares SRD 5.1 and SRD 5.2.1 sources", () => expect(OPEN_RULES_LICENSE.sourceDocuments).toEqual(["SRD 5.1", "SRD 5.2.1"]));
  it("declares CC BY 4.0 and a repository attribution file", () => expect(OPEN_RULES_LICENSE).toMatchObject({ shortName: "CC BY 4.0", attributionFile: "SRD_ATTRIBUTION.md" }));
  it("produces a passing license audit", () => expect(auditLicensing().status).toBe("pass"));
  it("builds a blocker-free release readiness report", () => expect(buildReleaseReadinessAudit()).toMatchObject({ ready: true, passed: 3, total: 3, blockers: [] }));
});
