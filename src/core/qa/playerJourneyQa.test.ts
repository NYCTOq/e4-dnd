import { describe, expect, it } from "vitest";
import { getQaScenario, PLAYER_JOURNEY_QA_SCENARIOS, summarizeQaCoverage } from "./playerJourneyQa";
describe("player journey QA certification", () => {
  it("keeps ids unique", () => { const ids = PLAYER_JOURNEY_QA_SCENARIOS.map((item) => item.id); expect(new Set(ids).size).toBe(ids.length); });
  it("marks stable scenarios critical", () => expect(PLAYER_JOURNEY_QA_SCENARIOS.every((item) => item.critical)).toBe(true));
  it("reports missing coverage", () => expect(summarizeQaCoverage(["dashboard-smoke"]).ready).toBe(false));
  it("certifies complete coverage", () => expect(summarizeQaCoverage(PLAYER_JOURNEY_QA_SCENARIOS.map((item) => item.id)).ready).toBe(true));
  it("resolves scenarios", () => expect(getQaScenario("offline-shell").layer).toBe("pwa"));
});
