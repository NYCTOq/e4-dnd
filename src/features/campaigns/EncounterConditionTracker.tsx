import { useState } from "react";
import type { CampaignEncounterParticipant } from "./campaignTypes";

const PRESET_CONDITIONS = [
  "Blinded", "Blessed", "Charmed", "Concentrating", "Deafened",
  "Frightened", "Grappled", "Incapacitated", "Invisible", "Paralyzed",
  "Poisoned", "Prone", "Restrained", "Stunned", "Unconscious",
];

type Props = {
  participant: CampaignEncounterParticipant;
  onAdd: (name: string, rounds: number | null) => void;
  onRemove: (conditionId: string) => void;
  onChangeRounds: (conditionId: string, rounds: number | null) => void;
};

export function EncounterConditionTracker({ participant, onAdd, onRemove, onChangeRounds }: Props) {
  const [selectedName, setSelectedName] = useState(PRESET_CONDITIONS[0]);
  const [customName, setCustomName] = useState("");
  const [rounds, setRounds] = useState("3");

  function addCondition() {
    const name = customName.trim() || selectedName;
    if (!name) return;
    const parsedRounds = rounds === "until-removed" ? null : Math.max(1, Number(rounds) || 1);
    onAdd(name, parsedRounds);
    setCustomName("");
  }

  return (
    <section className="encounter-condition-tracker">
      <div className="encounter-condition-head">
        <div>
          <span className="mini-label">Conditions</span>
          <strong>{participant.conditions.length} aktif etki</strong>
        </div>
      </div>

      {participant.conditions.length > 0 && (
        <div className="encounter-condition-list">
          {participant.conditions.map((condition) => (
            <div className="encounter-condition-chip" key={condition.id}>
              <strong>{condition.name}</strong>
              <select
                aria-label={`${condition.name} süresi`}
                value={condition.remainingRounds ?? "until-removed"}
                onChange={(event) =>
                  onChangeRounds(
                    condition.id,
                    event.target.value === "until-removed" ? null : Number(event.target.value),
                  )
                }
              >
                <option value="until-removed">Kaldırılana dek</option>
                {[1,2,3,4,5,6,7,8,9,10].map((value) => (
                  <option value={value} key={value}>{value} round</option>
                ))}
              </select>
              <button type="button" onClick={() => onRemove(condition.id)}>×</button>
            </div>
          ))}
        </div>
      )}

      <div className="encounter-condition-add">
        <select value={selectedName} onChange={(event) => setSelectedName(event.target.value)}>
          {PRESET_CONDITIONS.map((condition) => <option key={condition}>{condition}</option>)}
        </select>
        <input value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Custom condition" />
        <select value={rounds} onChange={(event) => setRounds(event.target.value)}>
          <option value="until-removed">Süresiz</option>
          {[1,2,3,4,5,6,7,8,9,10].map((value) => <option value={value} key={value}>{value} round</option>)}
        </select>
        <button type="button" onClick={addCondition}>Condition Ekle</button>
      </div>
    </section>
  );
}
