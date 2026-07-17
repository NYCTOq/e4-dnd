import { describe, expect, it } from "vitest";
import { makeCharacter } from "../../test/fixtures";
import { createCharacterTransfer, parseCharacterTransfer, resolveImportedCharacter } from "./characterTransfer";

describe("single character transfer", () => {
  it("round-trips through the versioned format", () => {
    const character = makeCharacter({ name: "Tengiz", level: 8 });
    expect(parseCharacterTransfer(createCharacterTransfer(character))).toMatchObject({ id: character.id, name: "Tengiz", level: 8 });
  });
  it("rejects unrelated and future files", () => {
    expect(() => parseCharacterTransfer({ format: "other" })).toThrow();
    expect(() => parseCharacterTransfer({ ...createCharacterTransfer(makeCharacter()), version: 99 })).toThrow(/daha yeni/);
  });
  it("forks identity instead of overwriting on id collision", () => {
    const character = makeCharacter({ id: "same", name: "Sora" });
    expect(resolveImportedCharacter(character, [character], () => "new-id")).toMatchObject({ id: "new-id", name: "Sora (İçe Aktarılan)" });
  });
});
