import { describe, expect, it } from "vitest";
import { createEntityFromDraft, createPackageFromDraft, DEFAULT_HOMEBREW_CREATOR_DRAFT, slugifyHomebrewId } from "./homebrewCreator";
import { recoverHomebrewResource, validateHomebrewPackage } from "./homebrewFoundation";

describe("homebrew creator", () => {
  it("creates stable ids", () => expect(slugifyHomebrewId("Çöl Yumruğu! ")).toBe("col-yumrugu"));
  it("creates a feat entity", () => {
    const entity = createEntityFromDraft({ ...DEFAULT_HOMEBREW_CREATOR_DRAFT, name: "Çöl Yumruğu", description: "Ek hasar verir." });
    expect(entity.type).toBe("feat");
    expect(entity.payload.id).toBe(entity.id);
  });
  it("builds resource-linked actions", () => {
    const entity = createEntityFromDraft({ ...DEFAULT_HOMEBREW_CREATOR_DRAFT, name: "Kum Rahibi", resourceName: "Kum Zarları", resourceMaximum: 3, actionName: "Kum Patlaması", actionSummary: "Hedefe kum savurur." });
    expect(entity.actions?.[0].resourceId).toBe(entity.resources?.[0].id);
  });
  it("recovers creator resources", () => {
    const entity = createEntityFromDraft({ ...DEFAULT_HOMEBREW_CREATOR_DRAFT, name: "Kum Rahibi", resourceName: "Kum Zarları", resourceMaximum: 3, resourceRecovery: "short-rest", resourceRecoveryAmount: 2 });
    expect(recoverHomebrewResource(entity.resources![0], 3, "short-rest", 5)).toBe(1);
  });
  it("creates valid packages", () => {
    const draft = { ...DEFAULT_HOMEBREW_CREATOR_DRAFT, name: "Çöl Yumruğu" };
    const pkg = createPackageFromDraft(draft, [createEntityFromDraft(draft)]);
    expect(validateHomebrewPackage(pkg).valid).toBe(true);
  });
  it("requires a name", () => expect(() => createEntityFromDraft(DEFAULT_HOMEBREW_CREATOR_DRAFT)).toThrow());
});
