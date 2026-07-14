import { useMemo, useState } from "react";
import type { DndItemData, DndMonsterData } from "../../core/rulesets/ruleset.types";
import type {
  CampaignEncounter,
  CampaignEncounterReward,
} from "./campaignTypes";

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

function normalizeCr(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/^cr\s*/, "");
  if (XP_BY_CR[normalized] !== undefined) return normalized;

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? String(numeric) : normalized;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getEncounterMonsterXp(
  encounter: CampaignEncounter,
  monsters: DndMonsterData[],
): number {
  const monsterById = new Map(monsters.map((monster) => [monster.id, monster]));

  return encounter.participants
    .filter((participant) => participant.sourceType === "monster")
    .reduce((total, participant) => {
      const monster = monsterById.get(participant.sourceId);
      if (!monster) return total;
      return total + (XP_BY_CR[normalizeCr(monster.challengeRating)] ?? 0);
    }, 0);
}

function makeReward(
  reward: Omit<CampaignEncounterReward, "id" | "createdAt">,
): CampaignEncounterReward {
  return {
    ...reward,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
}

export function EncounterLootGenerator({
  encounter,
  monsters,
  items,
  onChange,
}: {
  encounter: CampaignEncounter;
  monsters: DndMonsterData[];
  items: DndItemData[];
  onChange: (rewards: CampaignEncounterReward[]) => void;
}) {
  const [manualName, setManualName] = useState("");
  const [manualQuantity, setManualQuantity] = useState(1);
  const [manualValue, setManualValue] = useState(0);

  const monsterXp = useMemo(
    () => getEncounterMonsterXp(encounter, monsters),
    [encounter, monsters],
  );

  const totalGold = encounter.rewards.reduce(
    (total, reward) => total + reward.valueGp * reward.quantity,
    0,
  );

  function generateLoot() {
    const monsterCount = encounter.participants.filter(
      (participant) => participant.sourceType === "monster",
    ).length;

    if (monsterCount === 0) {
      alert("Ã–nce encounter'a en az bir monster ekle. BoÅŸ odadan ganimet Ã§Ä±karmak emlakÃ§Ä±lÄ±k olur.");
      return;
    }

    const safeXp = Math.max(25, monsterXp);
    const goldMin = Math.max(1, Math.round(safeXp * 0.025));
    const goldMax = Math.max(goldMin, Math.round(safeXp * 0.075));
    const gold = randomBetween(goldMin, goldMax);
    const generated: CampaignEncounterReward[] = [
      makeReward({
        type: "currency",
        name: "Gold Pieces",
        quantity: gold,
        valueGp: 1,
        notes: `Encounter XP tabanlÄ± otomatik Ã¶dÃ¼l (${monsterCount} monster).`,
      }),
    ];

    const itemChance = Math.min(90, 20 + monsterCount * 10 + Math.floor(safeXp / 500) * 5);
    const itemCount = safeXp >= 5000 ? 2 : 1;

    for (let index = 0; index < itemCount; index += 1) {
      if (items.length === 0 || randomBetween(1, 100) > itemChance) continue;

      const item = items[randomBetween(0, items.length - 1)];
      generated.push(
        makeReward({
          type: "item",
          name: item.name,
          quantity: 1,
          valueGp: 0,
          itemId: item.id,
          notes: item.description || `${item.category} Ã¶dÃ¼lÃ¼`,
        }),
      );
    }

    onChange([...generated, ...encounter.rewards]);
  }

  function addManualReward(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = manualName.trim();
    if (!name) return;

    onChange([
      makeReward({
        type: "manual",
        name,
        quantity: Math.max(1, Math.round(manualQuantity)),
        valueGp: Math.max(0, manualValue),
        notes: "Manuel encounter Ã¶dÃ¼lÃ¼",
      }),
      ...encounter.rewards,
    ]);

    setManualName("");
    setManualQuantity(1);
    setManualValue(0);
  }

  function removeReward(rewardId: string) {
    onChange(encounter.rewards.filter((reward) => reward.id !== rewardId));
  }

  function clearRewards() {
    if (encounter.rewards.length === 0) return;
    if (!confirm("Bu encounter'Ä±n tÃ¼m Ã¶dÃ¼lleri silinsin mi? Hazine sandÄ±ÄŸÄ± vergiye gidiyor.")) return;
    onChange([]);
  }

  return (
    <section className="encounter-loot-panel">
      <div className="encounter-loot-head">
        <div>
          <span className="mini-label">Loot Generator</span>
          <h3>Encounter Ã–dÃ¼lleri</h3>
          <p>AltÄ±n, eÅŸya ve Ã¶zel Ã¶dÃ¼lleri Ã¼retip encounter kaydÄ±nda saklar.</p>
        </div>

        <div className="encounter-loot-summary">
          <span>{encounter.rewards.length} kayÄ±t</span>
          <strong>{totalGold.toLocaleString("tr-TR")} GP</strong>
        </div>
      </div>

      <div className="encounter-loot-actions">
        <button type="button" className="primary-action" onClick={generateLoot}>
          HÄ±zlÄ± Ã–dÃ¼l Ãœret
        </button>
        <button type="button" onClick={clearRewards} disabled={encounter.rewards.length === 0}>
          Ã–dÃ¼lleri Temizle
        </button>
      </div>

      <form className="encounter-loot-form" onSubmit={addManualReward}>
        <label>
          Ã–dÃ¼l
          <input
            value={manualName}
            onChange={(event) => setManualName(event.target.value)}
            placeholder="Kraliyet mÃ¼hrÃ¼, Ã¶zel anahtar..."
          />
        </label>
        <label>
          Adet
          <input
            type="number"
            min={1}
            value={manualQuantity}
            onChange={(event) => setManualQuantity(Number(event.target.value))}
          />
        </label>
        <label>
          Birim GP
          <input
            type="number"
            min={0}
            step="0.1"
            value={manualValue}
            onChange={(event) => setManualValue(Number(event.target.value))}
          />
        </label>
        <button type="submit">Manuel Ekle</button>
      </form>

      {encounter.rewards.length === 0 ? (
        <div className="encounter-loot-empty">
          HenÃ¼z Ã¶dÃ¼l yok. OyuncularÄ±n sandÄ±ÄŸÄ± aÃ§madan Ã¶nce Ã¼Ã§ kez tuzak kontrolÃ¼ yapmasÄ± iÃ§in biraz daha zaman var.
        </div>
      ) : (
        <div className="encounter-loot-list">
          {encounter.rewards.map((reward) => (
            <article className="encounter-loot-item" key={reward.id}>
              <div>
                <span>{reward.type === "currency" ? "Currency" : reward.type === "item" ? "Item" : "Manual"}</span>
                <strong>{reward.name}</strong>
                <small>{reward.notes}</small>
              </div>
              <div className="encounter-loot-value">
                <b>Ã—{reward.quantity}</b>
                <em>{reward.valueGp > 0 ? `${(reward.valueGp * reward.quantity).toLocaleString("tr-TR")} GP` : "Ã–zel"}</em>
                <button type="button" onClick={() => removeReward(reward.id)}>KaldÄ±r</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

