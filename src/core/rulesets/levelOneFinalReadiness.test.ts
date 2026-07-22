import { describe, expect, it } from "vitest";
import { getLevelOneFinalReadiness } from "./levelOneFinalReadiness";

const status = (
  overrides: Partial<
    Parameters<typeof getLevelOneFinalReadiness>[0][number]["status"]
  > = {},
) => ({
  applicable: true,
  ready: true,
  blockers: [],
  notices: [],
  completedChecks: 4,
  totalChecks: 4,
  ...overrides,
});

describe("level one final readiness", () => {
  it("marks a character ready when all applicable sections are ready", () => {
    const result = getLevelOneFinalReadiness([
      { id: "identity", label: "Identity", status: status() },
      {
        id: "combat",
        label: "Combat",
        status: status({ notices: ["Optional warning"] }),
      },
    ]);

    expect(result.ready).toBe(true);
    expect(result.score).toBe(100);
    expect(result.noticeCount).toBe(1);
  });

  it("reports blocking sections and aggregates checks", () => {
    const result = getLevelOneFinalReadiness([
      { id: "identity", label: "Identity", status: status() },
      {
        id: "combat",
        label: "Combat",
        status: status({
          ready: false,
          blockers: ["Missing weapon"],
          completedChecks: 2,
        }),
      },
    ]);

    expect(result.ready).toBe(false);
    expect(result.blockingSections).toEqual(["Combat"]);
    expect(result.blockerCount).toBe(1);
    expect(result.score).toBe(75);
  });

  it("ignores non-applicable sections", () => {
    const result = getLevelOneFinalReadiness([
      {
        id: "spellcasting",
        label: "Spellcasting",
        status: status({
          applicable: false,
          ready: false,
          blockers: ["Not loaded"],
          completedChecks: 0,
          totalChecks: 0,
        }),
      },
      { id: "combat", label: "Combat", status: status() },
    ]);

    expect(result.ready).toBe(true);
    expect(result.applicableSections).toBe(1);
  });

  it("treats omitted applicable as true", () => {
    const implicitStatus = {
      ready: true,
      blockers: [],
      notices: [],
      completedChecks: 2,
      totalChecks: 2,
    };

    const result = getLevelOneFinalReadiness([
      { id: "playable", label: "Playable", status: implicitStatus },
    ]);

    expect(result.ready).toBe(true);
    expect(result.applicableSections).toBe(1);
    expect(result.score).toBe(100);
  });
});
