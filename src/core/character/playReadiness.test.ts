import { describe, expect, it } from "vitest";
import { makeCharacter } from "../../test/fixtures";
import { getPlayReadiness } from "./playReadiness";

describe("play readiness", () => {
  it("marks a structurally valid saved character as ready", () => expect(getPlayReadiness(makeCharacter(), null).status).toBe("ready"));
  it("blocks invalid HP and identity data", () => {
    const result = getPlayReadiness(makeCharacter({ name: "", currentHp: 50, maxHp: 20 }), null);
    expect(result.status).toBe("needs-attention");
    expect(result.issues.filter((issue) => issue.severity === "error").map((issue) => issue.id)).toEqual(["identity", "hp"]);
  });
  it("detects equipped items missing from inventory", () => expect(getPlayReadiness(makeCharacter({ equippedWeaponIds: ["longsword"] }), null).issues.some((issue) => issue.id === "equipment")).toBe(true));
});
