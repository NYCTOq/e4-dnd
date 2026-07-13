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
          <h3>Zorluk Hesabı</h3>
          <p>
            D&D 5e 2014 XP threshold ve monster multiplier mantığıyla yaklaşık
            sonuç. Zarlar yine insan planlarına saygı duymayabilir.
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
            Ort. Lv {result.averageLevel.toFixed(1)} • {result.partySource === "encounter" ? "Encounter" : "Campaign"}
          </small>
        </div>
        <div>
          <span>Monsters</span>
          <strong>{result.monsterCount}</strong>
          <small>XP hesabına giren instance sayısı</small>
        </div>
        <div>
          <span>Base XP</span>
          <strong>{numberFormatter.format(result.baseXp)}</strong>
          <small>Monster XP toplamı</small>
        </div>
        <div>
          <span>Adjusted XP</span>
          <strong>{numberFormatter.format(result.adjustedXp)}</strong>
          <small>×{result.multiplier} encounter çarpanı</small>
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
          Zorluk hesaplamak için campaign’e veya encounter’a en az bir karakter
          eklenmeli.
        </p>
      )}

      {!hasMonsters && (
        <p className="encounter-difficulty-warning">
          Encounter’a monster eklenmediği için XP değeri henüz sıfır.
        </p>
      )}

      {result.unknownMonsterCount > 0 && (
        <p className="encounter-difficulty-warning">
          {result.unknownMonsterCount} monster için geçerli CR/XP bulunamadı ve
          toplamın dışında bırakıldı.
        </p>
      )}
    </section>
  );
}
