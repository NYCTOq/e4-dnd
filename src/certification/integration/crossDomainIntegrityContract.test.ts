import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CROSS_DOMAIN_EDGES } from "../discovery/crossDomainIntegrityDiscovery";

describe("v5.121A cross-domain evidence contract", () => {
  it("keeps every declared bridge evidence path grounded in the project", () => {
    for (const edge of CROSS_DOMAIN_EDGES) {
      for (const evidence of edge.evidence) {
        expect(existsSync(new URL(`../../../${evidence}`, import.meta.url)), `${edge.id}: ${evidence}`).toBe(true);
      }
    }
  });

  it("keeps the foundation commands, report generator and handoff explicit", () => {
    const packageSource = readFileSync(new URL("../../../package.json", import.meta.url), "utf8");
    expect(packageSource).toContain("certify:cross-domain:discovery");
    expect(packageSource).toContain("certify:cross-domain:contract");
    expect(packageSource).toContain("certify:cross-domain:report");
    expect(packageSource).toContain("certify:cross-domain:foundation");
    expect(packageSource).toContain("discover-cross-domain-integrity-v5-121A.mjs");
    expect(CROSS_DOMAIN_EDGES.filter((edge) => edge.status === "selected").map((edge) => edge.id))
      .toEqual(["builder-record-sheet"]);
  });
});
