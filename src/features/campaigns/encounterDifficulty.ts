import type { Character } from "../../core/character/character.types";
import type { DndMonsterData } from "../../core/rulesets/ruleset.types";
import type { CampaignEncounter } from "./campaignTypes";

export type EncounterDifficulty =
  | "Trivial"
  | "Easy"
  | "Medium"
  | "Hard"
  | "Deadly"
  | "Absurd";

export type EncounterThresholds = {
  easy: number;
  medium: number;
  hard: number;
  deadly: number;
};

export type EncounterDifficultyResult = {
  partySize: number;
  averageLevel: number;
  monsterCount: number;
  baseXp: number;
  adjustedXp: number;
  multiplier: number;
  thresholds: EncounterThresholds;
  difficulty: EncounterDifficulty;
  unknownMonsterCount: number;
  partySource: "encounter" | "campaign";
};

const XP_THRESHOLDS_BY_LEVEL: Record<number, EncounterThresholds> = {
  1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
  2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
  3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
  4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
  5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
  6: { easy: 300, medium: 600, hard: 900, deadly: 1400 },
  7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
  8: { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
  9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
  10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
  11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 },
};

const XP_BY_CR: Record<string, number> = {
  "0": 10,
  "1/8": 25,
  "1/4": 50,
  "1/2": 100,
  "1": 200,
  "2": 450,
  "3": 700,
  "4": 1100,
  "5": 1800,
  "6": 2300,
  "7": 2900,
  "8": 3900,
  "9": 5000,
  "10": 5900,
  "11": 7200,
  "12": 8400,
  "13": 10000,
  "14": 11500,
  "15": 13000,
  "16": 15000,
  "17": 18000,
  "18": 20000,
  "19": 22000,
  "20": 25000,
  "21": 33000,
  "22": 41000,
  "23": 50000,
  "24": 62000,
  "25": 75000,
  "26": 90000,
  "27": 105000,
  "28": 120000,
  "29": 135000,
  "30": 155000,
};

const MULTIPLIER_STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5] as const;

function normalizeChallengeRating(challengeRating: string): string {
  const normalized = challengeRating.trim().toLowerCase().replace(/^cr\s*/, "");
  const direct = XP_BY_CR[normalized];

  if (direct !== undefined) {
    return normalized;
  }

  const numericValue = Number(normalized);
  if (Number.isFinite(numericValue)) {
    return String(numericValue);
  }

  return normalized;
}

function getMonsterXp(monster: DndMonsterData): number | null {
  const normalizedCr = normalizeChallengeRating(monster.challengeRating);
  return XP_BY_CR[normalizedCr] ?? null;
}

function getBaseMultiplier(monsterCount: number): number {
  if (monsterCount <= 0) return 1;
  if (monsterCount === 1) return 1;
  if (monsterCount === 2) return 1.5;
  if (monsterCount <= 6) return 2;
  if (monsterCount <= 10) return 2.5;
  if (monsterCount <= 14) return 3;
  return 4;
}

function adjustMultiplierForPartySize(
  multiplier: number,
  partySize: number,
): number {
  const currentIndex = MULTIPLIER_STEPS.indexOf(
    multiplier as (typeof MULTIPLIER_STEPS)[number],
  );

  if (currentIndex < 0) {
    return multiplier;
  }

  if (partySize > 0 && partySize < 3) {
    return MULTIPLIER_STEPS[Math.min(currentIndex + 1, MULTIPLIER_STEPS.length - 1)];
  }

  if (partySize >= 6) {
    return MULTIPLIER_STEPS[Math.max(currentIndex - 1, 0)];
  }

  return multiplier;
}

function getPartyThresholds(party: Character[]): EncounterThresholds {
  return party.reduce<EncounterThresholds>(
    (totals, character) => {
      const safeLevel = Math.min(20, Math.max(1, Math.round(character.level)));
      const thresholds = XP_THRESHOLDS_BY_LEVEL[safeLevel];

      return {
        easy: totals.easy + thresholds.easy,
        medium: totals.medium + thresholds.medium,
        hard: totals.hard + thresholds.hard,
        deadly: totals.deadly + thresholds.deadly,
      };
    },
    { easy: 0, medium: 0, hard: 0, deadly: 0 },
  );
}

function getDifficulty(
  adjustedXp: number,
  thresholds: EncounterThresholds,
): EncounterDifficulty {
  if (thresholds.deadly > 0 && adjustedXp >= thresholds.deadly * 2) {
    return "Absurd";
  }
  if (adjustedXp >= thresholds.deadly) return "Deadly";
  if (adjustedXp >= thresholds.hard) return "Hard";
  if (adjustedXp >= thresholds.medium) return "Medium";
  if (adjustedXp >= thresholds.easy) return "Easy";
  return "Trivial";
}

export function calculateEncounterDifficulty({
  encounter,
  campaignParty,
  monsters,
}: {
  encounter: CampaignEncounter;
  campaignParty: Character[];
  monsters: DndMonsterData[];
}): EncounterDifficultyResult {
  const encounterCharacterIds = new Set(
    encounter.participants
      .filter((participant) => participant.sourceType === "character")
      .map((participant) => participant.sourceId),
  );

  const encounterParty = campaignParty.filter((character) =>
    encounterCharacterIds.has(character.id),
  );
  const party = encounterParty.length > 0 ? encounterParty : campaignParty;
  const partySource = encounterParty.length > 0 ? "encounter" : "campaign";

  const monsterById = new Map(monsters.map((monster) => [monster.id, monster]));
  const encounterMonsters = encounter.participants.filter(
    (participant) => participant.sourceType === "monster",
  );

  let baseXp = 0;
  let unknownMonsterCount = 0;

  encounterMonsters.forEach((participant) => {
    const monster = monsterById.get(participant.sourceId);
    const xp = monster ? getMonsterXp(monster) : null;

    if (xp === null) {
      unknownMonsterCount += 1;
      return;
    }

    baseXp += xp;
  });

  const baseMultiplier = getBaseMultiplier(encounterMonsters.length);
  const multiplier = adjustMultiplierForPartySize(baseMultiplier, party.length);
  const adjustedXp = Math.round(baseXp * multiplier);
  const thresholds = getPartyThresholds(party);
  const averageLevel =
    party.length > 0
      ? party.reduce((total, character) => total + character.level, 0) / party.length
      : 0;

  return {
    partySize: party.length,
    averageLevel,
    monsterCount: encounterMonsters.length,
    baseXp,
    adjustedXp,
    multiplier,
    thresholds,
    difficulty: getDifficulty(adjustedXp, thresholds),
    unknownMonsterCount,
    partySource,
  };
}
