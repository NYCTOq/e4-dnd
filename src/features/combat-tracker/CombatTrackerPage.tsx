import { useEffect, useMemo, useState } from "react";
import type { Character } from "../../core/character/character.types";
import type { DndMonsterData } from "../../core/rulesets/ruleset.types";
import type { Campaign } from "../campaigns/campaignTypes";
import { loadNpcRecords } from "../npc-manager/npcManagerStorage";
import { PageShell } from "../../shared/layout/PageShell";
import {
  advanceTurn,
  COMBAT_CONDITIONS,
  createCombatEffect,
  getActiveConditions,
  applyDamage,
  applyHealing,
  createCombatEncounter,
  createCombatant,
  loadCombatEncounters,
  saveCombatEncounters,
  sortCombatants,
  type CombatCondition,
  type CombatEncounter,
  type Combatant,
} from "./combatTrackerStorage";

type CombatTrackerPageProps = {
  campaigns: Campaign[];
  characters: Character[];
  monsters: DndMonsterData[];
};

function getDexModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function sortEncounters(items: CombatEncounter[]) {
  return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function CombatTrackerPage({ campaigns, characters, monsters }: CombatTrackerPageProps) {
  const [encounters, setEncounters] = useState<CombatEncounter[]>(() => sortEncounters(loadCombatEncounters()));
  const [selectedId, setSelectedId] = useState(() => encounters[0]?.id ?? "");
  const [damageAmount, setDamageAmount] = useState(0);
  const [sourceType, setSourceType] = useState<"character" | "npc" | "monster" | "custom">("character");
  const [sourceId, setSourceId] = useState("");
  const [customName, setCustomName] = useState("");
  const [effectCondition, setEffectCondition] = useState<CombatCondition>("Blessed");
  const [effectDuration, setEffectDuration] = useState(10);
  const [effectSource, setEffectSource] = useState("");
  const npcs = useMemo(() => loadNpcRecords(), []);
  const selected = encounters.find((item) => item.id === selectedId) ?? null;
  const active = selected?.combatants.find((item) => item.id === selected.activeCombatantId) ?? null;

  useEffect(() => { saveCombatEncounters(encounters); }, [encounters]);

  function updateSelected(updater: (encounter: CombatEncounter) => CombatEncounter) {
    setEncounters((current) => sortEncounters(current.map((item) => item.id === selectedId ? { ...updater(item), updatedAt: new Date().toISOString() } : item)));
  }

  function addEncounter() {
    const encounter = createCombatEncounter(`Savaş ${encounters.length + 1}`, campaigns[0]?.id ?? "");
    setEncounters((current) => sortEncounters([encounter, ...current]));
    setSelectedId(encounter.id);
  }

  function deleteEncounter() {
    if (!selected || !confirm(`“${selected.name}” silinsin mi?`)) return;
    const next = encounters.filter((item) => item.id !== selected.id);
    setEncounters(next);
    setSelectedId(next[0]?.id ?? "");
  }

  function addCombatant() {
    let combatant: Combatant;
    if (sourceType === "character") {
      const character = characters.find((item) => item.id === sourceId) ?? characters[0];
      if (!character) return;
      combatant = { ...createCombatant(character.name, "Karakter"), sourceId: character.id, initiative: getDexModifier(character.abilities.dex), armorClass: character.armorClass, maxHp: character.maxHp, currentHp: character.currentHp, tempHp: character.tempHp, conditions: [...character.conditions], effects: [] };
    } else if (sourceType === "npc") {
      const npc = npcs.find((item) => item.id === sourceId) ?? npcs[0];
      if (!npc) return;
      combatant = { ...createCombatant(npc.name, "NPC"), sourceId: npc.id, notes: npc.role };
    } else if (sourceType === "monster") {
      const monster = monsters.find((item) => item.id === sourceId) ?? monsters[0];
      if (!monster) return;
      combatant = { ...createCombatant(monster.name, "Canavar"), sourceId: monster.id, initiative: getDexModifier(monster.abilities.dex), armorClass: monster.armorClass, maxHp: monster.hitPoints, currentHp: monster.hitPoints, notes: `CR ${monster.challengeRating}` };
    } else {
      combatant = createCombatant(customName || "Özel savaşçı", "Özel");
    }
    updateSelected((encounter) => {
      const combatants = sortCombatants([...encounter.combatants, combatant]);
      return { ...encounter, combatants, activeCombatantId: encounter.activeCombatantId || combatants[0]?.id || "" };
    });
    setCustomName("");
  }

  function updateCombatant(id: string, updater: (item: Combatant) => Combatant) {
    updateSelected((encounter) => ({ ...encounter, combatants: sortCombatants(encounter.combatants.map((item) => item.id === id ? updater(item) : item)) }));
  }

  function removeCombatant(id: string) {
    updateSelected((encounter) => {
      const combatants = encounter.combatants.filter((item) => item.id !== id);
      return { ...encounter, combatants, activeCombatantId: encounter.activeCombatantId === id ? combatants[0]?.id ?? "" : encounter.activeCombatantId };
    });
  }

  const sourceOptions = sourceType === "character" ? characters.map((item) => ({ id: item.id, name: item.name })) : sourceType === "npc" ? npcs.map((item) => ({ id: item.id, name: item.name })) : sourceType === "monster" ? monsters.map((item) => ({ id: item.id, name: item.name })) : [];

  return <PageShell eyebrow="Canlı oyun" title="Initiative + Combat Tracker" description="Sıra, round, HP, koşul ve süreli etkileri tek savaş ekranında yönet. Round bittiğinde sayaçlar otomatik azalır; insan hafızasına gereksiz iş çıkmaz.">
    <section className="combat-summary">
      <article><strong>{encounters.length}</strong><span>karşılaşma</span></article>
      <article><strong>{selected?.round ?? 0}</strong><span>mevcut round</span></article>
      <article><strong>{selected?.combatants.length ?? 0}</strong><span>savaşçı</span></article>
      <article><strong>{active?.name ?? "-"}</strong><span>aktif sıra</span></article>
    </section>

    <section className="combat-toolbar">
      <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} aria-label="Karşılaşma seç">
        <option value="">Karşılaşma seç</option>
        {encounters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <button type="button" onClick={addEncounter}>+ Yeni savaş</button>
      {selected ? <><button type="button" className="combat-next" onClick={() => updateSelected(advanceTurn)}>Sonraki sıra</button><button type="button" className="danger" onClick={deleteEncounter}>Savaşı sil</button></> : null}
    </section>

    {selected ? <>
      <section className="combat-header-card">
        <input value={selected.name} onChange={(event) => updateSelected((encounter) => ({ ...encounter, name: event.target.value }))} aria-label="Karşılaşma adı" />
        <label>Campaign<select value={selected.campaignId} onChange={(event) => updateSelected((encounter) => ({ ...encounter, campaignId: event.target.value }))}><option value="">Campaign yok</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label>
        <label>Round<input type="number" min="1" value={selected.round} onChange={(event) => updateSelected((encounter) => ({ ...encounter, round: Math.max(1, Number(event.target.value) || 1) }))} /></label>
      </section>

      <section className="combat-add-card">
        <select value={sourceType} onChange={(event) => { setSourceType(event.target.value as typeof sourceType); setSourceId(""); }}>
          <option value="character">Karakter</option><option value="npc">NPC</option><option value="monster">Canavar</option><option value="custom">Özel</option>
        </select>
        {sourceType === "custom" ? <input value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Savaşçı adı" /> : <select value={sourceId} onChange={(event) => setSourceId(event.target.value)}><option value="">Seç...</option>{sourceOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
        <button type="button" onClick={addCombatant}>Savaşa ekle</button>
      </section>

      <section className="combat-list">
        {selected.combatants.map((combatant) => {
          const hpPercent = Math.max(0, Math.min(100, (combatant.currentHp / combatant.maxHp) * 100));
          const isActive = combatant.id === selected.activeCombatantId;
          return <article key={combatant.id} className={`${isActive ? "active" : ""} ${combatant.isDefeated ? "defeated" : ""}`}>
            <button type="button" className="combat-active-button" onClick={() => updateSelected((encounter) => ({ ...encounter, activeCombatantId: combatant.id }))}>{isActive ? "▶" : "○"}</button>
            <div className="combat-main">
              <div className="combat-title-row"><input value={combatant.name} onChange={(event) => updateCombatant(combatant.id, (item) => ({ ...item, name: event.target.value }))} aria-label="Savaşçı adı" /><span>{combatant.kind}</span></div>
              <div className="combat-hp-track"><i style={{ width: `${hpPercent}%` }} /><span>{combatant.currentHp}/{combatant.maxHp} HP {combatant.tempHp ? `+${combatant.tempHp} geçici` : ""}</span></div>
              <div className="combat-condition-row">{COMBAT_CONDITIONS.map((condition) => { const activeConditions = getActiveConditions(combatant); return <button key={condition} type="button" className={activeConditions.includes(condition) ? "active" : ""} onClick={() => updateCombatant(combatant.id, (item) => ({ ...item, conditions: item.conditions.includes(condition) ? item.conditions.filter((value) => value !== condition) : [...item.conditions, condition] }))}>{condition}</button>; })}</div>
              <div className="combat-effect-controls">
                <select value={effectCondition} onChange={(event) => setEffectCondition(event.target.value as CombatCondition)}>{COMBAT_CONDITIONS.map((condition) => <option key={condition}>{condition}</option>)}</select>
                <input type="number" min="1" value={effectDuration} onChange={(event) => setEffectDuration(Math.max(1, Number(event.target.value) || 1))} aria-label="Etki süresi" />
                <input value={effectSource} onChange={(event) => setEffectSource(event.target.value)} placeholder="Kaynak: Bless, büyücü..." />
                <button type="button" onClick={() => updateCombatant(combatant.id, (item) => ({ ...item, effects: [...item.effects, createCombatEffect(effectCondition, effectDuration, effectSource)] }))}>Süreli etki ekle</button>
              </div>
              {combatant.effects.length ? <div className="combat-effects-list">{combatant.effects.map((effect) => <span key={effect.id}><strong>{effect.condition}</strong><small>{effect.remainingRounds === null ? "Süresiz" : `${effect.remainingRounds} round`}{effect.source ? ` · ${effect.source}` : ""}</small><button type="button" aria-label={`${effect.condition} etkisini kaldır`} onClick={() => updateCombatant(combatant.id, (item) => ({ ...item, effects: item.effects.filter((value) => value.id !== effect.id) }))}>×</button></span>)}</div> : null}
              <textarea rows={2} value={combatant.notes} onChange={(event) => updateCombatant(combatant.id, (item) => ({ ...item, notes: event.target.value }))} placeholder="Savaş notu..." />
            </div>
            <div className="combat-stats">
              <label>Init<input type="number" value={combatant.initiative} onChange={(event) => updateCombatant(combatant.id, (item) => ({ ...item, initiative: Number(event.target.value) || 0 }))} /></label>
              <label>AC<input type="number" min="0" value={combatant.armorClass} onChange={(event) => updateCombatant(combatant.id, (item) => ({ ...item, armorClass: Math.max(0, Number(event.target.value) || 0) }))} /></label>
              <label>Max HP<input type="number" min="1" value={combatant.maxHp} onChange={(event) => updateCombatant(combatant.id, (item) => ({ ...item, maxHp: Math.max(1, Number(event.target.value) || 1), currentHp: Math.min(item.currentHp, Math.max(1, Number(event.target.value) || 1)) }))} /></label>
              <label>Geçici<input type="number" min="0" value={combatant.tempHp} onChange={(event) => updateCombatant(combatant.id, (item) => ({ ...item, tempHp: Math.max(0, Number(event.target.value) || 0) }))} /></label>
              <div className="combat-damage-controls"><input type="number" min="0" value={damageAmount} onChange={(event) => setDamageAmount(Math.max(0, Number(event.target.value) || 0))} /><button type="button" onClick={() => updateCombatant(combatant.id, (item) => applyDamage(item, damageAmount))}>Hasar</button><button type="button" onClick={() => updateCombatant(combatant.id, (item) => applyHealing(item, damageAmount))}>İyileştir</button></div>
              <button type="button" className="danger" onClick={() => removeCombatant(combatant.id)}>Çıkar</button>
            </div>
          </article>;
        })}
        {!selected.combatants.length ? <div className="combat-empty">Savaş alanı boş. Bir karakter, NPC veya canavar ekle.</div> : null}
      </section>
    </> : <div className="combat-empty"><strong>Henüz savaş kaydı yok.</strong><button type="button" onClick={addEncounter}>İlk savaşı oluştur</button></div>}
  </PageShell>;
}
