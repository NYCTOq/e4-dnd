import { describe, expect, it } from "vitest";
import { getBuilderStepId, getBuilderStepIssueCounts, getFirstErrorStepIndex } from "./builderProgress";
import type { CharacterValidationIssue } from "./characterValidation";

const issues: CharacterValidationIssue[] = [
  { id: "class", severity: "error", step: "Class", message: "Class gerekli." },
  { id: "race", severity: "error", step: "Class", message: "Race gerekli." },
  { id: "equipment", severity: "warning", step: "Equipment", message: "Inventory boş." },
];

describe("builder progress", () => {
  it("maps validation labels to builder step ids", () => expect(getBuilderStepId("Skills")).toBe("proficiencies"));
  it("counts errors and warnings per step", () => expect(getBuilderStepIssueCounts("class", issues)).toEqual({ errors: 2, warnings: 0 }));
  it("finds the first builder step containing an error", () => expect(getFirstErrorStepIndex(["basic", "class", "equipment", "review"], issues)).toBe(1));
});
