import { describe, expect, it } from "vitest";
import { emptyDraft } from "../../features/characters/characterShared";
import { getClassSpellSelection, hydrateClassSpellSelections, setClassSpellSelection } from "./classSpellSelectionRules";

describe("class spell selection separation", () => {
  it("keeps class lists separate while maintaining legacy aggregate arrays", () => {
    let draft = setClassSpellSelection(emptyDraft, "Wizard", { knownSpellIds: ["fire-bolt", "shield"], preparedSpellIds: ["shield"] });
    draft = setClassSpellSelection(draft, "Cleric", { knownSpellIds: ["guidance", "bless"], preparedSpellIds: ["bless"] });

    expect(getClassSpellSelection(draft, "Wizard")).toEqual({ knownSpellIds: ["fire-bolt", "shield"], preparedSpellIds: ["shield"] });
    expect(getClassSpellSelection(draft, "Cleric")).toEqual({ knownSpellIds: ["guidance", "bless"], preparedSpellIds: ["bless"] });
    expect(new Set(draft.knownSpellIds)).toEqual(new Set(["fire-bolt", "shield", "guidance", "bless"]));
    expect(draft.spellSources?.shield).toBe("wizard");
    expect(draft.spellSources?.bless).toBe("cleric");
  });

  it("migrates legacy aggregate spell arrays into the primary casting class", () => {
    const migrated = hydrateClassSpellSelections({ ...emptyDraft, className: "Wizard", knownSpellIds: ["shield"], preparedSpellIds: ["shield"] }, ["Wizard"]);
    expect(migrated.classKnownSpellIds?.wizard).toEqual(["shield"]);
    expect(migrated.classPreparedSpellIds?.wizard).toEqual(["shield"]);
  });
});
