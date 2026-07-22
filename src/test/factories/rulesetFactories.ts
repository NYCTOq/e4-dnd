import type { DndItemData } from "../../core/rulesets/ruleset.types";

export function createDndItem(
  overrides: Partial<DndItemData> & Pick<DndItemData, "id" | "name" | "category">,
): DndItemData {
  return {
    cost: "0 gp",
    weight: 0,
    description: "",
    tags: [],
    ...overrides,
  };
}
