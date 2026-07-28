import { describe, expect, it } from "vitest";
import { CROSS_DOMAIN_EDGES } from "../discovery/crossDomainIntegrityDiscovery";
import { buildCrossDomainScenarioMatrix } from "../matrix/crossDomainBuilderRecordSheetScenarioMatrix";

describe("v5.121B cross-domain reference contract",()=>{
  it("closes the selected v5.121A P0 edge with edition and archetype coverage",()=>{
    const selected=CROSS_DOMAIN_EDGES.find(edge=>edge.status==="selected");
    expect(selected?.id).toBe("builder-record-sheet");
    const scenarios=buildCrossDomainScenarioMatrix();
    expect(scenarios.every(s=>s.payload.id&&s.payload.className&&s.payload.ancestry&&s.payload.background)).toBe(true);
    expect(scenarios.some(s=>s.payload.classLevels.Fighter&&s.payload.classLevels.Wizard)).toBe(true);
    expect(scenarios.some(s=>s.payload.resources.some(r=>r.used>0))).toBe(true);
  });
});
