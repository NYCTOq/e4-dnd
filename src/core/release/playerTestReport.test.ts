import { describe, expect, it } from "vitest";
import { createPlayerTestReport } from "./playerTestReport";
import { makeCharacter } from "../../test/fixtures";

describe("player test report privacy", () => {
  it("does not serialize character records or private text", () => {
    const character = makeCharacter({ name: "SECRET NAME", playerName: "SECRET PLAYER", notes: "SECRET NOTES", inventory: [{ itemId: "x", quantity: 1, notes: "SECRET ITEM" }] });
    const serialized = JSON.stringify(createPlayerTestReport({ appVersion: "test", characters: [character], rulesetData: null }));
    expect(serialized).not.toContain("SECRET NAME");
    expect(serialized).not.toContain("SECRET PLAYER");
    expect(serialized).not.toContain("SECRET NOTES");
    expect(serialized).not.toContain("SECRET ITEM");
  });
});
