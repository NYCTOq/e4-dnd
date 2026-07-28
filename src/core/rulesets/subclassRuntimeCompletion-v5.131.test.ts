import { describe, expect, it } from "vitest";
import type { CharacterResource } from "../character/character.types";
import {
  canUseSubclassAction,
  getSubclassActionResourceState,
  recoverSubclassResources,
  spendSubclassActionResource,
  type SubclassRuntimeAction,
} from "./subclassRuntimeRules";

const action: SubclassRuntimeAction = {
  id: "preserve-life",
  name: "Preserve Life",
  type: "action",
  resourceId: "channel-divinity",
  summary: "Healing pool.",
};

const resources = (): CharacterResource[] => [
  { id: "channel-divinity", name: "Channel Divinity", max: 2, used: 1, recovery: "short" },
  { id: "bardic-inspiration", name: "Bardic Inspiration", max: 4, used: 3, recovery: "long" },
  { id: "manual-resource", name: "Manual", max: 1, used: 1, recovery: "manual" },
  { id: "unlimited", name: "Unlimited", max: 1, used: 1, recovery: "short", unlimited: true },
];

describe("v5.131 subclass runtime completion", () => {
  it("exposes remaining shared resource uses for subclass actions", () => {
    expect(getSubclassActionResourceState(action, resources())).toMatchObject({
      remaining: 1,
      maximum: 2,
      available: true,
    });
  });

  it("spends a subclass resource without exceeding its maximum", () => {
    const spent = spendSubclassActionResource(action, resources());
    expect(getSubclassActionResourceState(action, spent)).toMatchObject({ remaining: 0, available: false });
    expect(canUseSubclassAction(action, spent)).toBe(false);
    expect(spendSubclassActionResource(action, spent).find((item) => item.id === "channel-divinity")?.used).toBe(2);
  });

  it("short rest restores only short-recovery subclass resources", () => {
    const recovered = recoverSubclassResources(resources(), "short");
    expect(recovered.find((item) => item.id === "channel-divinity")?.used).toBe(0);
    expect(recovered.find((item) => item.id === "bardic-inspiration")?.used).toBe(3);
    expect(recovered.find((item) => item.id === "manual-resource")?.used).toBe(1);
  });

  it("long rest restores short and long resources but preserves manual and unlimited state", () => {
    const recovered = recoverSubclassResources(resources(), "long");
    expect(recovered.find((item) => item.id === "channel-divinity")?.used).toBe(0);
    expect(recovered.find((item) => item.id === "bardic-inspiration")?.used).toBe(0);
    expect(recovered.find((item) => item.id === "manual-resource")?.used).toBe(1);
    expect(recovered.find((item) => item.id === "unlimited")?.used).toBe(1);
  });
});
