import { describe, expect, it } from "vitest";
import { makeCharacter } from "../../test/fixtures";
import { buildEditedCharacter, characterToEditDraft } from "./characterEditorRules";

describe("character editor rules", () => {
  it("preserves multiclass and runtime pools while creating an isolated draft", () => {
    const character = makeCharacter({ classLevels: [{ className: "Fighter", level: 3 }, { className: "Wizard", level: 2 }], level: 5, pactMagicSlots: [{ level: 2, max: 2, used: 1 }] });
    const draft = characterToEditDraft(character);
    expect(draft.classLevels).toEqual(character.classLevels);
    expect(draft.pactMagicSlots).toEqual(character.pactMagicSlots);
    expect(draft.abilities).not.toBe(character.abilities);
  });

  it("does not flatten multiclass slot and hit die pools on save", () => {
    const character = makeCharacter({ classLevels: [{ className: "Fighter", level: 3 }, { className: "Wizard", level: 2 }], level: 5, spellSlots: [{ level: 1, max: 4, used: 2 }], hitDice: [{ die: 10, max: 3, used: 1 }, { die: 6, max: 2, used: 1 }] });
    const result = buildEditedCharacter(character, characterToEditDraft(character), null);
    expect(result.spellSlots).toEqual(character.spellSlots);
    expect(result.hitDice).toEqual(character.hitDice);
  });
});
