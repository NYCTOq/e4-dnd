import type { Combatant } from "./combatTrackerStorage";
import type { CombatAutomationState } from "../../core/rulesets/combatAutomationRuntime";

type Props = {
  active: Combatant | null;
  state: CombatAutomationState;
  onSpend: (resource: "action" | "bonus-action" | "reaction") => void;
  onMove: (feet: number) => void;
  onDeathSave: (roll: number) => void;
  onResetDeathSaves: () => void;
};

export function CombatTurnAutomationPanel({ active, state, onSpend, onMove, onDeathSave, onResetDeathSaves }: Props) {
  if (!active) return null;
  const economy = state.economyByCombatant[active.id];
  const death = state.deathSavesByCombatant[active.id];
  const speed = state.speedByCombatant[active.id] ?? 30;
  const concentrationDc = state.concentrationDcByCombatant[active.id] ?? null;
  return <section className="combat-automation-panel" data-testid="combat-turn-automation">
    <div className="combat-automation-heading">
      <div><span className="mini-label">Turn Automation</span><strong>{active.name}</strong></div>
      <span>Round {state.round}</span>
    </div>
    <div className="combat-economy-grid">
      <button type="button" className={economy?.actionUsed ? "is-spent" : ""} onClick={() => onSpend("action")}>Action {economy?.actionUsed ? "✓" : ""}</button>
      <button type="button" className={economy?.bonusActionUsed ? "is-spent" : ""} onClick={() => onSpend("bonus-action")}>Bonus Action {economy?.bonusActionUsed ? "✓" : ""}</button>
      <button type="button" className={economy?.reactionUsed ? "is-spent" : ""} onClick={() => onSpend("reaction")}>Reaction {economy?.reactionUsed ? "✓" : ""}</button>
      <button type="button" onClick={() => onMove(5)}>Move +5 ft</button>
    </div>
    <div className="combat-automation-stats">
      <span>Movement <strong>{economy?.movementUsed ?? 0}/{speed} ft</strong></span>
      <span>Concentration <strong>{concentrationDc ? `DC ${concentrationDc}` : "-"}</strong></span>
      <span>Death Saves <strong>{death?.successes ?? 0} ✓ / {death?.failures ?? 0} ✕</strong></span>
    </div>
    {active.currentHp === 0 && <div className="combat-death-save-controls">
      <button type="button" onClick={() => onDeathSave(Math.floor(Math.random() * 20) + 1)} disabled={death?.dead || death?.stabilized}>Death Save Roll</button>
      <button type="button" onClick={onResetDeathSaves}>Reset</button>
      {death?.stabilized && <strong>Stabilized</strong>}
      {death?.dead && <strong>Dead</strong>}
    </div>}
  </section>;
}
