import { describe, expect, it } from "vitest";
import { getReleaseReadiness } from "./releaseReadiness";

describe("release readiness", () => {
  it("reports missing runtime inputs without throwing", () => {
    const result = getReleaseReadiness([], null);
    expect(result.status).toBe("needs-attention");
    expect(result.checks.find((check) => check.id === "ruleset")?.status).toBe("fail");
  });
});
