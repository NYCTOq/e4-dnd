import { describe, expect, it } from "vitest";
import { calculateLootTotal, createLootRecord, sanitizeLootRecord } from "./lootTrackerStorage";
describe("loot tracker storage", () => {
  it("creates a safe default record", () => { const record = createLootRecord("Ancient Ring", "campaign-1"); expect(record.name).toBe("Ancient Ring"); expect(record.quantity).toBe(1); expect(record.status).toBe("Bekliyor"); });
  it("sanitizes invalid numeric values", () => { const record = sanitizeLootRecord({ id: "loot-1", name: "Gold", quantity: -4, valueGp: -10 }); expect(record?.quantity).toBe(1); expect(record?.valueGp).toBe(0); });
  it("calculates quantity based total value", () => { expect(calculateLootTotal([{ quantity: 2, valueGp: 50 }, { quantity: 3, valueGp: 10 }])).toBe(130); });
});
