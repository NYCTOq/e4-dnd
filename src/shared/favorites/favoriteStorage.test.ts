import { describe, expect, it } from "vitest";
import { addRecentItem, toggleFavoriteItem, type FavoriteItem } from "./favoriteStorage";

const item = {
  id: "spell-fireball",
  title: "Fireball",
  subtitle: "3. seviye",
  to: "/spellbook?search=Fireball",
  icon: "✧",
  category: "Büyü",
};

describe("favorites and recent items", () => {
  it("adds and removes a favorite", () => {
    const added = toggleFavoriteItem([], item);
    expect(added).toHaveLength(1);
    expect(toggleFavoriteItem(added, item)).toEqual([]);
  });

  it("moves an opened item to the front without duplicates", () => {
    const old: FavoriteItem = { ...item, updatedAt: "2026-01-01T00:00:00.000Z" };
    const recents = addRecentItem([{ ...old, openedAt: old.updatedAt }], item);
    expect(recents).toHaveLength(1);
    expect(recents[0].id).toBe(item.id);
  });

  it("keeps only twelve recent items", () => {
    let recents = [] as ReturnType<typeof addRecentItem>;
    for (let index = 0; index < 15; index += 1) {
      recents = addRecentItem(recents, { ...item, id: `item-${index}`, title: `Item ${index}` });
    }
    expect(recents).toHaveLength(12);
  });
});
