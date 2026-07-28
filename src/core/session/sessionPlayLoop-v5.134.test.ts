import { describe, expect, it } from "vitest";
import { appendSessionEvent, classifySessionEvent, createPlaySession, endPlaySession, getSessionSummary } from "./sessionPlayLoop";

describe("v5.134 session play loop", () => {
  it("classifies core table events", () => {
    expect(classifySessionEvent("8 hasar uygulandı")).toBe("damage");
    expect(classifySessionEvent("İyileştirme uygulandı: +5 HP")).toBe("healing");
    expect(classifySessionEvent("Long Rest tamamlandı")).toBe("rest");
  });
  it("records round and turn context", () => {
    const session = createPlaySession("c1", "Aelric", new Date("2026-01-01T10:00:00Z"));
    const next = appendSessionEvent(session, "Turu Bitir", { round: 2, turn: 3, now: new Date("2026-01-01T10:01:00Z") });
    expect(next.events[0]).toMatchObject({ kind: "turn", round: 2, turn: 3 });
  });
  it("summarizes a complete play loop", () => {
    let session = createPlaySession("c1", "Aelric");
    session = appendSessionEvent(session, "Büyü slotu harcandı");
    session = appendSessionEvent(session, "6 hasar uygulandı");
    session = appendSessionEvent(session, "Long Rest tamamlandı");
    const summary = getSessionSummary(session);
    expect(summary.total).toBe(3);
    expect(summary.counts.spell).toBe(1);
    expect(summary.counts.damage).toBe(1);
    expect(summary.counts.rest).toBe(1);
  });
  it("ends without deleting the session history", () => {
    const session = appendSessionEvent(createPlaySession("c1", "Aelric"), "Turu Bitir");
    const ended = endPlaySession(session);
    expect(ended.endedAt).toBeTruthy();
    expect(ended.events).toHaveLength(1);
  });
});
