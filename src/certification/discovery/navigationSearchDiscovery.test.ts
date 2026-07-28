import { describe, expect, it } from "vitest";
import { buildNavigationSearchDiscovery, NAVIGATION_SEARCH_DOMAINS } from "./navigationSearchDiscovery";
describe("v5.123A navigation and search discovery",()=>{
 it("classifies seven discoverability domains",()=>{expect(NAVIGATION_SEARCH_DOMAINS).toHaveLength(7);expect(NAVIGATION_SEARCH_DOMAINS.every(d=>d.evidence.length>=3)).toBe(true);expect(NAVIGATION_SEARCH_DOMAINS.every(d=>d.exitCriteria.length>=3)).toBe(true);});
 it("locks route-search parity for v5.123B",()=>{expect(buildNavigationSearchDiscovery()).toMatchObject({package:"v5.123A",version:"5.123.0",status:"READY_FOR_ROUTE_SEARCH_MATRIX",selectedDomain:"route-search-parity",nextPackage:"v5.123B",domainCount:7,counts:{P0:1,P1:4,P2:2}});});
 it("keeps continuity and favorites outside immediate blockers",()=>{const r=buildNavigationSearchDiscovery();expect(r.blockers.some(x=>x.startsWith("deep-link-query-continuity:"))).toBe(false);expect(r.blockers.some(x=>x.startsWith("recent-favorite-navigation:"))).toBe(false);});
});
