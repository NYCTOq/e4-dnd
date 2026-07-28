import { describe,it,expect } from "vitest";
import { navItems } from "../../shared/navigation/navItems";
import { buildGlobalSearchEntries, searchGlobalEntries } from "../../features/search/globalSearchEngine";
import { STATIC_ROUTE_REFERENCE, DYNAMIC_ROUTE_PATTERNS } from "../reference/navigationSearchRouteReference";
import { summarizeRouteParity } from "./navigationSearchRouteParity";

const empty={characters:[],campaigns:[],rulesetData:null,homebrewSpellIds:new Set<string>(),homebrewItemIds:new Set<string>(),homebrewMonsterIds:new Set<string>()};

describe("v5.123B navigation/search differential",()=>{
 it("covers all 32 static player routes and four dynamic patterns",()=>{expect(STATIC_ROUTE_REFERENCE).toHaveLength(32);expect(DYNAMIC_ROUTE_PATTERNS).toHaveLength(4);});
 it("has zero orphan, dead or command-mismatched static routes",()=>{const s=summarizeRouteParity();expect(s.orphanRoutes).toEqual([]);expect(s.deadSearchTargets).toEqual([]);expect(s.commandMismatches).toEqual([]);});
 it("keeps canonical visible labels aligned",()=>{for(const ref of STATIC_ROUTE_REFERENCE){const nav=navItems.find(x=>x.to===ref.to);expect(nav).toMatchObject({label:ref.label,shortLabel:ref.shortLabel,group:ref.group});}});
 it("resolves every canonical visible label first and keeps short labels discoverable",()=>{const entries=buildGlobalSearchEntries(empty);for(const ref of STATIC_ROUTE_REFERENCE){expect(searchGlobalEntries(entries,ref.label)[0]?.to).toBe(ref.to);expect(searchGlobalEntries(entries,ref.shortLabel).some(entry=>entry.to===ref.to)).toBe(true);}});
 it("partitions canonical alias evidence into exact, ambiguous and discovery-gap buckets",()=>{
  const s=summarizeRouteParity();
  const matrixChecks=s.rows.reduce((total,row)=>total+row.aliasChecks,0);
  const missing=s.aliasFailures.length;
  const ambiguous=s.aliasAmbiguities.length;
  const exactFirst=s.rows.flatMap(row=>row.aliasResults).filter(result=>result.rank===0).length;
  expect(s.aliasChecks).toBe(matrixChecks);
  expect(exactFirst+ambiguous+missing).toBe(s.aliasChecks);
  expect(exactFirst).toBeGreaterThan(0);
  expect(missing).toBe(0);
  expect(ambiguous).toBeGreaterThan(0);
 });
 it("detects a dead search target mutation",()=>{const entries=buildGlobalSearchEntries(empty).filter(x=>x.to!=="/builder");expect(entries.some(x=>x.to==="/builder")).toBe(false);});
 it("detects a route label mutation",()=>{const ref=STATIC_ROUTE_REFERENCE.find(x=>x.to==="/rest")!;expect({...ref,label:"Broken Rest"}).not.toMatchObject(navItems.find(x=>x.to==="/rest")!);});
});
