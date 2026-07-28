import { describe, expect, it } from "vitest";
import { buildCrossDomainIntegrityDiscovery, CROSS_DOMAIN_EDGES } from "./crossDomainIntegrityDiscovery";

describe("v5.121A cross-domain integrity discovery", () => {
  it("inventories the complete player lifecycle and release bridge map", () => {
    expect(CROSS_DOMAIN_EDGES).toHaveLength(8);
    expect(CROSS_DOMAIN_EDGES.every((edge) => edge.evidence.length >= 4)).toBe(true);
    expect(CROSS_DOMAIN_EDGES.every((edge) => edge.verifiedFields.length > 0)).toBe(true);
    expect(CROSS_DOMAIN_EDGES.every((edge) => edge.gaps.length > 0)).toBe(true);
    expect(CROSS_DOMAIN_EDGES.every((edge) => edge.exitCriteria.length > 0)).toBe(true);
    expect(new Set(CROSS_DOMAIN_EDGES.map((edge) => edge.id)).size).toBe(CROSS_DOMAIN_EDGES.length);
  });

  it("locks one P0 bridge and the v5.121B differential handoff", () => {
    const report = buildCrossDomainIntegrityDiscovery();
    expect(report).toMatchObject({
      package: "v5.121A",
      version: "5.121.0",
      status: "READY_FOR_DIFFERENTIAL",
      selectedEdge: "builder-record-sheet",
      nextPackage: "v5.121B",
      counts: { P0: 1, P1: 6, P2: 1 },
      edgeCount: 8,
    });
    expect(report.evidenceCount).toBeGreaterThanOrEqual(25);
    expect(report.blockers.length).toBeGreaterThanOrEqual(7);
  });
});
