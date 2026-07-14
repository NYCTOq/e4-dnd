import type { Character } from "../../core/character/character.types";
import type { DndMonsterData } from "../../core/rulesets/ruleset.types";
import type { CampaignEncounter } from "./campaignTypes";
import { calculateEncounterDifficulty } from "./encounterDifficulty";

const numberFormatter = new Intl.NumberFormat("tr-TR");

export function EncounterDifficultyPanel({
  encounter,
  campaignParty,
  monsters,
}: {
  encounter: CampaignEncounter;
  campaignParty: Character[];
  monsters: DndMonsterData[];
}) {
  const result = calculateEncounterDifficulty({
    encounter,
    campaignParty,
    monsters,
  });

  const hasParty = result.partySize > 0;
  const hasMonsters = result.monsterCount > 0;

  return (
    <section className="encounter-difficulty-panel">
      <div className="encounter-difficulty-head">
        <div>
          <span className="mini-label">Encounter Balance</span>
          <h3>Zorluk HesabÄ±</h3>
          <p>
            D&D 5e 2014 XP threshold ve monster multiplier mantÄ±ÄŸÄ±yla yaklaÅŸÄ±k
            sonuÃ§. Zarlar yine insan planlarÄ±na saygÄ± duymayabilir.
          </p>
        </div>

        <div
          className={`difficulty-badge difficulty-${result.difficulty.toLowerCase()}`}
        >
          <span>Difficulty</span>
          <strong>{result.difficulty}</strong>
        </div>
      </div>

      <div className="encounter-difficulty-grid">
        <div>
          <span>Party</span>
          <strong>{result.partySize}</strong>
          <small>
            Ort. Lv {result.averageLevel.toFixed(1)} â€¢ {result.partySource === "encounter" ? "Encounter" : "Campaign"}
          </small>
        </div>
        <div>
          <span>Monsters</span>
          <strong>{result.monsterCount}</strong>
          <small>XP hesabÄ±na giren instance sayÄ±sÄ±</small>
        </div>
        <div>
          <span>Base XP</span>
          <strong>{numberFormatter.format(result.baseXp)}</strong>
          <small>Monster XP toplamÄ±</small>
        </div>
        <div>
          <span>Adjusted XP</span>
          <strong>{numberFormatter.format(result.adjustedXp)}</strong>
          <small>Ã—{result.multiplier} encounter Ã§arpanÄ±</small>
        </div>
      </div>

      <div className="encounter-thresholds">
        <div>
          <span>Easy</span>
          <strong>{numberFormatter.format(result.thresholds.easy)}</strong>
        </div>
        <div>
          <span>Medium</span>
          <strong>{numberFormatter.format(result.thresholds.medium)}</strong>
        </div>
        <div>
          <span>Hard</span>
          <strong>{numberFormatter.format(result.thresholds.hard)}</strong>
        </div>
        <div>
          <span>Deadly</span>
          <strong>{numberFormatter.format(result.thresholds.deadly)}</strong>
        </div>
      </div>

      {!hasParty && (
        <p className="encounter-difficulty-warning">
          Zorluk hesaplamak iÃ§in campaignâ€™e veya encounterâ€™a en az bir karakter
          eklenmeli.
        </p>
      )}

      {!hasMonsters && (
        <p className="encounter-difficulty-warning">
          Encounterâ€™a monster eklenmediÄŸi iÃ§in XP deÄŸeri henÃ¼z sÄ±fÄ±r.
        </p>
      )}

      {result.unknownMonsterCount > 0 && (
        <p className="encounter-difficulty-warning">
          {result.unknownMonsterCount} monster iÃ§in geÃ§erli CR/XP bulunamadÄ± ve
          toplamÄ±n dÄ±ÅŸÄ±nda bÄ±rakÄ±ldÄ±.
        </p>
      )}
    </section>
  );
}

