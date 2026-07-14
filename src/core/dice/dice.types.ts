export interface DiceRollResult {
  id: string;
  notation: string;
  count: number;
  sides: number;
  modifier: number;
  rolls: number[];
  total: number;
  createdAt: string;
}

export interface RollInput {
  count: number;
  sides: number;
  modifier: number;
}
