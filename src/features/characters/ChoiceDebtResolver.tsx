import type { Character } from "../../core/character/character.types";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { applyUnifiedChoice, getIncompleteUnifiedChoices } from "../../core/rulesets/unifiedCharacterChoices";

export function ChoiceDebtResolver({ character, rulesetData, onUpdateCharacter }: { character: Character; rulesetData: RulesetData | null; onUpdateCharacter: (character: Character) => void }) {
  const debts = getIncompleteUnifiedChoices(character, rulesetData);
  if (!debts.length) return <div className="empty-panel">Zorunlu seçim borcu yok.</div>;

  return <div className="level-up-panel">{debts.map((debt) => <section className="level-up-section" key={debt.id}>
    <div className="panel-heading-row"><div><h3>{debt.label}</h3><p>{debt.message}</p></div><span>{debt.validSelected.length}/{debt.required}</span></div>
    {debt.kind === "grouped-single" ? [...new Set(debt.options.map((option) => option.group).filter(Boolean))].map((group) => <label key={group}>Level {group}<select value={debt.selected.find((id) => debt.options.find((option) => option.id === id)?.group === group) ?? ""} onChange={(event) => event.target.value && onUpdateCharacter(applyUnifiedChoice(character, debt, event.target.value))}><option value="">Seç...</option>{debt.options.filter((option) => option.group === group).map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>) : <div className="level-up-choice-grid">{debt.options.map((option) => <button type="button" className={debt.selected.includes(option.id) ? "active" : ""} key={option.id} onClick={() => onUpdateCharacter(applyUnifiedChoice(character, debt, option.id))}>{option.name}{option.detail ? <small>{option.detail}</small> : null}</button>)}</div>}
  </section>)}</div>;
}
