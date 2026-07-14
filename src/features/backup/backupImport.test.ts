import { describe, expect, it } from "vitest";
import { mergeRecordsById, mergeUniqueStrings } from "./backupImport";

describe("backup import merging", () => {
  it("replaces matching IDs and keeps unrelated records", () => {
    expect(mergeRecordsById(
      [{ id: "a", value: 1 }, { id: "b", value: 2 }],
      [{ id: "b", value: 20 }, { id: "c", value: 3 }],
    )).toEqual([
      { id: "a", value: 1 }, { id: "b", value: 20 }, { id: "c", value: 3 },
    ]);
  });

  it("deduplicates string IDs", () => {
    expect(mergeUniqueStrings(["a", "b"], ["b", "c"])).toEqual(["a", "b", "c"]);
  });
});
