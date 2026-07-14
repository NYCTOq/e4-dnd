import type { DiceRollResult, RollInput } from "./dice.types";

export function rollDice(input: RollInput): DiceRollResult {
  const count = clampInteger(input.count, 1, 100);
  const sides = clampInteger(input.sides, 2, 1000);
  const modifier = clampInteger(input.modifier, -999, 999);

  const rolls = Array.from({ length: count }, () => {
    return Math.floor(Math.random() * sides) + 1;
  });

  const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;

  return {
    id: crypto.randomUUID(),
    notation: formatNotation({ count, sides, modifier }),
    count,
    sides,
    modifier,
    rolls,
    total,
    createdAt: new Date().toISOString(),
  };
}

export function formatNotation(input: RollInput): string {
  const count = clampInteger(input.count, 1, 100);
  const sides = clampInteger(input.sides, 2, 1000);
  const modifier = clampInteger(input.modifier, -999, 999);

  if (modifier === 0) {
    return `${count}d${sides}`;
  }

  return `${count}d${sides}${modifier > 0 ? "+" : ""}${modifier}`;
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  const integer = Math.trunc(value);

  return Math.min(Math.max(integer, min), max);
}
