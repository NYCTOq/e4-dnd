import { describe, expect, it } from "vitest";
import {
  addTagToItem,
  deleteTag,
  getAllTags,
  removeTagFromItem,
  renameTag,
} from "./tagCollectionStorage";

describe("tag collections", () => {
  it("adds normalized unique tags", () => {
    const first = addTagToItem({}, "spell:fireball", "  Boss   Fight ");
    const second = addTagToItem(first, "spell:fireball", "boss fight");
    expect(second["spell:fireball"]).toEqual(["Boss Fight"]);
  });

  it("removes empty item tag entries", () => {
    const result = removeTagFromItem({ "item:1": ["Loot"] }, "item:1", "Loot");
    expect(result).toEqual({});
  });

  it("renames and deletes collections across items", () => {
    const renamed = renameTag({ a: ["Boss"], b: ["Boss", "Session"] }, "Boss", "Finale");
    expect(getAllTags(renamed)).toEqual(["Finale", "Session"]);
    expect(deleteTag(renamed, "Finale")).toEqual({ b: ["Session"] });
  });
});
