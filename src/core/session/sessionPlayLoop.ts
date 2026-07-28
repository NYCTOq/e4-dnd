export type SessionEventKind = "session" | "action" | "damage" | "healing" | "condition" | "rest" | "turn" | "spell" | "resource";

export type SessionEvent = {
  id: string;
  at: string;
  characterId: string;
  characterName: string;
  kind: SessionEventKind;
  label: string;
  round?: number;
  turn?: number;
};

export type PlaySession = {
  id: string;
  characterId: string;
  characterName: string;
  startedAt: string;
  endedAt?: string;
  events: SessionEvent[];
};

const PREFIX = "e4.play-session.v5.134";

function key(characterId: string) { return `${PREFIX}:${characterId}`; }

export function createPlaySession(characterId: string, characterName: string, now = new Date()): PlaySession {
  return { id: crypto.randomUUID(), characterId, characterName, startedAt: now.toISOString(), events: [] };
}

export function readPlaySession(characterId: string): PlaySession | null {
  try {
    const raw = localStorage.getItem(key(characterId));
    return raw ? JSON.parse(raw) as PlaySession : null;
  } catch { return null; }
}

export function savePlaySession(session: PlaySession): PlaySession {
  localStorage.setItem(key(session.characterId), JSON.stringify(session));
  return session;
}

export function ensurePlaySession(characterId: string, characterName: string): PlaySession {
  return readPlaySession(characterId) ?? savePlaySession(createPlaySession(characterId, characterName));
}

export function classifySessionEvent(label: string): SessionEventKind {
  const value = label.toLocaleLowerCase("tr-TR");
  if (value.includes("hasar") || value.includes("hp azalt")) return "damage";
  if (value.includes("iyile") || value.includes("hp artır")) return "healing";
  if (value.includes("condition") || value.includes("durum")) return "condition";
  if (value.includes("rest") || value.includes("dinlen")) return "rest";
  if (value.includes("spell") || value.includes("büyü") || value.includes("slot")) return "spell";
  if (value.includes("kaynak") || value.includes("kullanım") || value.includes("charge")) return "resource";
  if (value.includes("tur")) return "turn";
  return "action";
}

export function appendSessionEvent(
  session: PlaySession,
  label: string,
  options: { round?: number; turn?: number; now?: Date } = {},
): PlaySession {
  const event: SessionEvent = {
    id: crypto.randomUUID(),
    at: (options.now ?? new Date()).toISOString(),
    characterId: session.characterId,
    characterName: session.characterName,
    kind: classifySessionEvent(label),
    label,
    round: options.round,
    turn: options.turn,
  };
  return { ...session, events: [event, ...session.events].slice(0, 100) };
}

export function endPlaySession(session: PlaySession, now = new Date()): PlaySession {
  return { ...session, endedAt: now.toISOString() };
}

export function getSessionSummary(session: PlaySession) {
  const counts = session.events.reduce<Record<SessionEventKind, number>>((acc, event) => {
    acc[event.kind] = (acc[event.kind] ?? 0) + 1;
    return acc;
  }, { session: 0, action: 0, damage: 0, healing: 0, condition: 0, rest: 0, turn: 0, spell: 0, resource: 0 });
  return { total: session.events.length, counts, latest: session.events[0] ?? null, active: !session.endedAt };
}

export function clearPlaySession(characterId: string) { localStorage.removeItem(key(characterId)); }
