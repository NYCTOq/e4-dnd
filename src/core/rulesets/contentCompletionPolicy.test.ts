import { describe, expect, it } from "vitest";
import { getContentCompletionPlan } from "./contentCompletionPolicy";
import type { ContentIntegrityAudit } from "./contentIntegrityAudit";
import type { RulesetData } from "./ruleset.types";

const audit: ContentIntegrityAudit = { rulesetId: "dnd_2024", score: 100, status: "certified", blockerCount: 0, warningCount: 0, infoCount: 0, totalEntities: 0, catalogs: [], issues: [], missingCatalogs: [] };

const ruleset = { id: "dnd_2024", name: "2024", classes: Array(12).fill({}), subclasses: Array(12).fill({}), races: Array(10).fill({}), backgrounds: Array(16).fill({}), feats: Array(20).fill({}), spells: Array(58).fill({}), items: Array(35).fill({}), monsters: Array(10).fill({ source: "" }) } as unknown as RulesetData;

describe("content completion policy", () => {
  it("marks minimum catalogue targets complete", () => {
    const result = getContentCompletionPlan(ruleset, audit);
    expect(result.score).toBe(100);
    expect(result.blockers).toEqual([]);
  });
  it("blocks an empty core catalogue", () => {
    const result = getContentCompletionPlan({ ...ruleset, classes: [] }, audit);
    expect(result.state).toBe("incomplete");
    expect(result.blockers.some((entry) => entry.includes("Classes"))).toBe(true);
  });
  it("marks compatibility monsters for review", () => {
    const result = getContentCompletionPlan({ ...ruleset, monsters: [{ source: "SRD compatibility baseline" }] as RulesetData["monsters"] }, audit);
    expect(result.reviewItems.some((entry) => entry.includes("compatibility"))).toBe(true);
  });
});
