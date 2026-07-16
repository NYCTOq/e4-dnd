export type TurnEconomy = {
  actionUsed: boolean;
  bonusActionUsed: boolean;
  reactionUsed: boolean;
  movementUsed: number;
  attacksUsed: number;
};

export type TurnResource = "action" | "bonus-action" | "reaction";

export function createTurnEconomy(): TurnEconomy {
  return { actionUsed: false, bonusActionUsed: false, reactionUsed: false, movementUsed: 0, attacksUsed: 0 };
}

export function getAttacksPerAction(className: string, level: number) {
  const name = className.trim().toLowerCase();
  if (name === "fighter") return level >= 20 ? 4 : level >= 11 ? 3 : level >= 5 ? 2 : 1;
  if (["barbarian", "monk", "paladin", "ranger"].includes(name)) return level >= 5 ? 2 : 1;
  return 1;
}

export function spendTurnResource(turn: TurnEconomy, resource: TurnResource): TurnEconomy {
  if (resource === "action") return { ...turn, actionUsed: true };
  if (resource === "bonus-action") return { ...turn, bonusActionUsed: true };
  return { ...turn, reactionUsed: true };
}

export function spendMovement(turn: TurnEconomy, feet: number, speed: number): TurnEconomy {
  return { ...turn, movementUsed: Math.min(Math.max(0, speed), Math.max(0, turn.movementUsed + feet)) };
}

export function spendAttack(turn: TurnEconomy, attacksPerAction: number): TurnEconomy {
  const attacksUsed = Math.min(attacksPerAction, turn.attacksUsed + 1);
  return { ...turn, attacksUsed, actionUsed: attacksUsed >= attacksPerAction };
}
