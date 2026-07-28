import { describe,expect,it } from "vitest";
import { buildGoldenSearchIntentReport, GOLDEN_SEARCH_INTENTS } from "./navigationSearchGoldenIntentIntegration";
describe("v5.123C golden search intent integration",()=>{
 const report=buildGoldenSearchIntentReport();
 it("projects all canonical aliases into production page search entries",()=>{expect(report.aliasCount).toBeGreaterThan(80);expect(report.missingAliases).toEqual([]);});
 it("keeps twelve representative player intents discoverable",()=>{expect(GOLDEN_SEARCH_INTENTS).toHaveLength(12);expect(report.missingIntents).toEqual([]);});
 it("keeps deterministic intent metadata",()=>{expect(report.intents.every(x=>x.rank>=0&&x.topRoute)).toBe(true);});
 it("covers every static navigation route",()=>{expect(report.routeCount).toBe(32);});
});
