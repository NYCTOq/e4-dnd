import { describe, expect, it, vi } from "vitest";
import { createSessionPlan, getSessionProgress, sanitizeSessionPlan } from "./sessionPlannerStorage";

describe("session planner storage", () => {
  it("creates a usable blank plan", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "session-1" });
    const plan = createSessionPlan("Alabasta Finali", "campaign-1");
    expect(plan.id).toBe("session-1");
    expect(plan.title).toBe("Alabasta Finali");
    expect(plan.campaignId).toBe("campaign-1");
  });

  it("sanitizes imported plan data", () => {
    const plan = sanitizeSessionPlan({ id: "1", title: "Test", scenes: [], tasks: [] });
    expect(plan?.quickNotes).toBe("");
    expect(plan?.campaignId).toBe("");
  });

  it("calculates scene and task progress", () => {
    const plan = {
      ...createSessionPlan("Test"),
      scenes: [{ id: "s1", title: "Scene", notes: "", completed: true }],
      tasks: [{ id: "t1", text: "Task", completed: false }],
    };
    expect(getSessionProgress(plan)).toBe(50);
  });
});
