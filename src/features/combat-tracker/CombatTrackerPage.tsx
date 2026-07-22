import { useEffect, useMemo, useState } from "react";
import type { Character } from "../../core/character/character.types";
import type { DndMonsterData } from "../../core/rulesets/ruleset.types";
import type { Campaign } from "../campaigns/campaignTypes";
import { loadNpcRecords } from "../npc-manager/npcManagerStorage";
import { PageShell } from "../../shared/layout/PageShell";
import { CombatTurnAutomationPanel } from "./CombatTurnAutomationPanel";
import {
  beginAutomatedTurn,
  createCombatAutomationState,
  registerConcentrationDamage,
  resetDeathSaves,
  resolveDeathSave,
  spendAutomatedMovement,
  spendAutomatedResource,
} from "../../core/rulesets/combatAutomationRuntime";
import {
  addCombatLog,
  advanceTurn,
  BATTLEFIELD_ZONE_KINDS,
  BATTLEFIELD_ZONE_SHAPES,
  COMBAT_CONDITIONS,
  createBattlefieldZone,
  createCombatEffect,
  createCombatLogEntry,
  getActiveConditions,
  getCombatSummary,
  applyDamage,
  applyHealing,
  createCombatEncounter,
  createCombatant,
  createCombatTemplate,
  createEncounterFromCampaignEncounter,
  createEncounterFromTemplate,
  loadCombatEncounters,
  loadCombatTemplates,
  saveCombatEncounters,
  saveCombatTemplates,
  sortCombatants,
  type BattlefieldZone,
  type BattlefieldZoneKind,
  type BattlefieldZoneShape,
  type CombatCondition,
  type CombatEncounter,
  type Combatant,
  type CombatTemplate,
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
  const [logNote, setLogNote] = useState("");
  const [templates, setTemplates] = useState<CombatTemplate[]>(() => loadCombatTemplates());
  const [templateId, setTemplateId] = useState("");
  const [campaignEncounterKey, setCampaignEncounterKey] = useState("");
  const [zoneName, setZoneName] = useState("");
  const [zoneKind, setZoneKind] = useState<BattlefieldZoneKind>("Spell Area");
  const [automation, setAutomation] = useState(() => createCombatAutomationState());
  const npcs = useMemo(() => loadNpcRecords(), []);
  const selected = encounters.find((item) => item.id === selectedId) ?? null;
  const active = selected?.combatants.find((item) => item.id === selected.activeCombatantId) ?? null;
  const summary = selected ? getCombatSummary(selected) : null;

  useEffect(() => { saveCombatEncounters(encounters); }, [encounters]);
  useEffect(() => { saveCombatTemplates(templates); }, [templates]);
  useEffect(() => {
    if (!selected?.activeCombatantId) return;
    setAutomation((current) => beginAutomatedTurn(current, selected.activeCombatantId, selected.round));
  }, [selected?.activeCombatantId, selected?.round]);

  function updateSelected(updater: (encounter: CombatEncounter) => CombatEncounter) {
    setEncounters((current) => sortEncounters(current.map((item) => item.id === selectedId ? { ...updater(item), updatedAt: new Date().toISOString() } : item)));
  }

  function addEncounter() {
    const base = createCombatEncounter(`Savaş ${encounters.length + 1}`, campaigns[0]?.id ?? "");
    const encounter = addCombatLog(base, createCombatLogEntry("Sistem", 1, "Karşılaşma oluşturuldu."));
    setEncounters((current) => sortEncounters([encounter, ...current]));
    setSelectedId(encounter.id);
  }

  function importCampaignEncounter() {
    const [campaignId, encounterId] = campaignEncounterKey.split(":");
    const campaign = campaigns.find((item) => item.id === campaignId);
    const source = campaign?.encounters.find((item) => item.id === encounterId);
    if (!campaign || !source) return;
    const base = createEncounterFromCampaignEncounter(source, campaign.id);
    const encounter = addCombatLog(base, createCombatLogEntry("Sistem", base.round, `Campaign encounter içe aktarıldı: ${campaign.name}.`));
    setEncounters((current) => sortEncounters([encounter, ...current]));
    setSelectedId(encounter.id);
  }

  function saveSelectedAsTemplate() {
    if (!selected || !selected.combatants.length) return;
    const template = createCombatTemplate(selected);
    setTemplates((current) => [template, ...current]);
    setTemplateId(template.id);
  }

  function createFromSelectedTemplate() {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    const base = createEncounterFromTemplate(template);
    const encounter = addCombatLog(base, createCombatLogEntry("Sistem", 1, `Savaş şablondan oluşturuldu: ${template.name}.`));
    setEncounters((current) => sortEncounters([encounter, ...current]));
    setSelectedId(encounter.id);
  }

  function deleteSelectedTemplate() {
    if (!templateId) return;
    setTemplates((current) => current.filter((item) => item.id !== templateId));
    setTemplateId("");
  }

  function deleteEncounter() {
    if (!selected || !confirm(`“${selected.name}” silinsin mi?`)) return;
    const next = encounters.filter((item) => item.id !== selected.id);
    setEncounters(next);
    setSelectedId(next[0]?.id ?? "");
  }

  function addZone() {
    if (!selected) return;
    const zone = createBattlefieldZone(zoneName || `Alan ${selected.zones.length + 1}`, zoneKind);
    updateSelected((encounter) => addCombatLog({ ...encounter, zones: [zone, ...encounter.zones] }, createCombatLogEntry("Alan", encounter.round, `${zone.name} savaş alanına eklendi.`)));
    setZoneName("");
  }

  function updateZone(id: string, updater: (zone: BattlefieldZone) => BattlefieldZone) {
    updateSelected((encounter) => ({ ...encounter, zones: encounter.zones.map((zone) => zone.id === id ? updater(zone) : zone) }));
  }

  function removeZone(zone: BattlefieldZone) {
    updateSelected((encounter) => addCombatLog({ ...encounter, zones: encounter.zones.filter((item) => item.id !== zone.id) }, createCombatLogEntry("Alan", encounter.round, `${zone.name} savaş alanından kaldırıldı.`)));
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
      const next = { ...encounter, combatants, activeCombatantId: encounter.activeCombatantId || combatants[0]?.id || "" };
      return addCombatLog(next, createCombatLogEntry("Sistem", encounter.round, `${combatant.name} savaşa eklendi.`, combatant));
    });
    setCustomName("");
  }

  function updateCombatant(id: string, updater: (item: Combatant) => Combatant) {
    updateSelected((encounter) => ({ ...encounter, combatants: sortCombatants(encounter.combatants.map((item) => item.id === id ? updater(item) : item)) }));
  }

  function removeCombatant(id: string) {
    updateSelected((encounter) => {
      const removed = encounter.combatants.find((item) => item.id === id);
      const combatants = encounter.combatants.filter((item) => item.id !== id);
      const next = { ...encounter, combatants, activeCombatantId: encounter.activeCombatantId === id ? combatants[0]?.id ?? "" : encounter.activeCombatantId };
      return removed ? addCombatLog(next, createCombatLogEntry("Sistem", encounter.round, `${removed.name} savaştan çıkarıldı.`, removed)) : next;
    });
  }

  function handleAdvanceTurn() {
    updateSelected((encounter) => {
      const advanced = advanceTurn(encounter);
      const nextActive = advanced.combatants.find((item) => item.id === advanced.activeCombatantId) ?? null;
      const roundText = advanced.round > encounter.round ? `Round ${advanced.round} başladı. ` : "";
      return addCombatLog(advanced, createCombatLogEntry("Sıra", advanced.round, `${roundText}Sıra ${nextActive?.name ?? "bilinmeyen savaşçı"}.`, nextActive));
    });
  }

  function handleDamage(combatant: Combatant) {
    updateSelected((encounter) => {
      const combatants = sortCombatants(encounter.combatants.map((item) => item.id === combatant.id ? applyDamage(item, damageAmount) : item));
      const next = { ...encounter, combatants };
      const concentrating = getActiveConditions(combatant).includes("Concentration");
      setAutomation((current) => registerConcentrationDamage(current, combatant.id, damageAmount, concentrating));
      return addCombatLog(next, createCombatLogEntry("Hasar", encounter.round, `${combatant.name} ${damageAmount} hasar aldı.`, combatant, damageAmount));
    });
  }

  function handleHealing(combatant: Combatant) {
    updateSelected((encounter) => {
      const combatants = sortCombatants(encounter.combatants.map((item) => item.id === combatant.id ? applyHealing(item, damageAmount) : item));
      const next = { ...encounter, combatants };
      return addCombatLog(next, createCombatLogEntry("İyileştirme", encounter.round, `${combatant.name} ${damageAmount} HP iyileşti.`, combatant, damageAmount));
    });
  }

  function addTimedEffect(combatant: Combatant) {
    updateSelected((encounter) => {
      const effect = createCombatEffect(effectCondition, effectDuration, effectSource);
      const combatants = encounter.combatants.map((item) => item.id === combatant.id ? { ...item, effects: [...item.effects, effect] } : item);
      const next = { ...encounter, combatants };
      return addCombatLog(next, createCombatLogEntry("Etki", encounter.round, `${combatant.name}: ${effectCondition} (${effectDuration} round) eklendi.`, combatant));
    });
  }

  function addManualLog() {
    if (!logNote.trim()) return;
    updateSelected((encounter) => addCombatLog(encounter, createCombatLogEntry("Not", encounter.round, logNote)));
    setLogNote("");
  }

  const sourceOptions = sourceType === "character" ? characters.map((item) => ({ id: item.id, name: item.name })) : sourceType === "npc" ? npcs.map((item) => ({ id: item.id, name: item.name })) : sourceType === "monster" ? monsters.map((item) => ({ id: item.id, name: item.name })) : [];

  return <PageShell eyebrow="Canlı oyun" title="Initiative + Combat Tracker" description="Sıra, round, HP, koşul ve süreli etkileri tek savaş ekranında yönet. Round bittiğinde sayaçlar otomatik azalır; insan hafızasına gereksiz iş çıkmaz.">
    <section className="combat-summary">
      <article><strong>{encounters.length}</strong><span>karşılaşma</span></article>
      <article><strong>{selected?.round ?? 0}</strong><span>mevcut round</span></article>
      <article><strong>{selected?.combatants.length ?? 0}</strong><span>savaşçı</span></article>
      <article><strong>{active?.name ?? "-"}</strong><span>aktif sıra</span></article>
      <article><strong>{summary?.damage ?? 0}</strong><span>toplam hasar</span></article>
      <article><strong>{summary?.healing ?? 0}</strong><span>toplam iyileştirme</span></article>
      <article><strong>{summary?.defeated ?? 0}</strong><span>yenilen savaşçı</span></article>
      <article><strong>{summary?.events ?? 0}</strong><span>kayıtlı olay</span></article>
    </section>

    <CombatTurnAutomationPanel
      active={active}
      state={automation}
      onSpend={(resource) => active && setAutomation((current) => spendAutomatedResource(current, active.id, resource))}
      onMove={(feet) => active && setAutomation((current) => spendAutomatedMovement(current, active.id, feet))}
      onDeathSave={(roll) => active && setAutomation((current) => resolveDeathSave(current, active.id, roll))}
      onResetDeathSaves={() => active && setAutomation((current) => resetDeathSaves(current, active.id))}
    />

    <section className="combat-bridge-card">
      <div>
        <strong>Encounter Bridge</strong>
        <span>Campaign encounter'ını canlı savaşa aktar veya mevcut dizilimi tekrar kullanılabilir şablon olarak sakla.</span>
      </div>
      <div className="combat-bridge-controls">
        <select value={campaignEncounterKey} onChange={(event) => setCampaignEncounterKey(event.target.value)} aria-label="Campaign encounter seç">
          <option value="">Campaign encounter seç</option>
          {campaigns.flatMap((campaign) => campaign.encounters.map((encounter) => <option key={`${campaign.id}:${encounter.id}`} value={`${campaign.id}:${encounter.id}`}>{campaign.name} · {encounter.name} ({encounter.participants.length})</option>))}
        </select>
        <button type="button" onClick={importCampaignEncounter} disabled={!campaignEncounterKey}>Canlı savaşa aktar</button>
      </div>
      <div className="combat-bridge-controls">
        <select value={templateId} onChange={(event) => setTemplateId(event.target.value)} aria-label="Savaş şablonu seç">
          <option value="">Savaş şablonu seç</option>
          {templates.map((template) => <option key={template.id} value={template.id}>{template.name} ({template.combatants.length})</option>)}
        </select>
        <button type="button" onClick={createFromSelectedTemplate} disabled={!templateId}>Şablondan oluştur</button>
        <button type="button" onClick={saveSelectedAsTemplate} disabled={!selected?.combatants.length}>Mevcut savaşı kaydet</button>
        <button type="button" className="danger" onClick={deleteSelectedTemplate} disabled={!templateId}>Şablonu sil</button>
      </div>
    </section>

    <section className="combat-toolbar">
      <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} aria-label="Karşılaşma seç">
        <option value="">Karşılaşma seç</option>
        {encounters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <button type="button" onClick={addEncounter}>+ Yeni savaş</button>
      {selected ? <><button type="button" className="combat-next" onClick={handleAdvanceTurn}>Sonraki sıra</button><button type="button" className="danger" onClick={deleteEncounter}>Savaşı sil</button></> : null}
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

      <section className="battlefield-zone-panel">
        <div className="battlefield-zone-header">
          <div><strong>Battlefield Zones</strong><span>Aura, hazard, spell area ve difficult terrain sayaçlarını round bazında takip et.</span></div>
          <div className="battlefield-zone-add"><input value={zoneName} onChange={(event) => setZoneName(event.target.value)} placeholder="Alan adı: Spirit Guardians..." /><select value={zoneKind} onChange={(event) => setZoneKind(event.target.value as BattlefieldZoneKind)}>{BATTLEFIELD_ZONE_KINDS.map((kind) => <option key={kind}>{kind}</option>)}</select><button type="button" onClick={addZone}>Alan ekle</button></div>
        </div>
        <div className="battlefield-zone-list">
          {selected.zones.map((zone) => <article key={zone.id}>
            <div className="battlefield-zone-title"><input value={zone.name} onChange={(event) => updateZone(zone.id, (item) => ({ ...item, name: event.target.value }))} aria-label="Alan adı" /><button type="button" className="danger" onClick={() => removeZone(zone)}>Sil</button></div>
            <div className="battlefield-zone-grid">
              <label>Tür<select value={zone.kind} onChange={(event) => updateZone(zone.id, (item) => ({ ...item, kind: event.target.value as BattlefieldZoneKind }))}>{BATTLEFIELD_ZONE_KINDS.map((kind) => <option key={kind}>{kind}</option>)}</select></label>
              <label>Şekil<select value={zone.shape} onChange={(event) => updateZone(zone.id, (item) => ({ ...item, shape: event.target.value as BattlefieldZoneShape }))}>{BATTLEFIELD_ZONE_SHAPES.map((shape) => <option key={shape}>{shape}</option>)}</select></label>
              <label>Boyut (ft)<input type="number" min="0" value={zone.sizeFeet} onChange={(event) => updateZone(zone.id, (item) => ({ ...item, sizeFeet: Math.max(0, Number(event.target.value) || 0) }))} /></label>
              <label>Süre<input type="number" min="1" value={zone.remainingRounds ?? ""} placeholder="Süresiz" onChange={(event) => updateZone(zone.id, (item) => ({ ...item, remainingRounds: event.target.value ? Math.max(1, Number(event.target.value) || 1) : null }))} /></label>
              <label>Hasar<input value={zone.damage} placeholder="3d8 radiant" onChange={(event) => updateZone(zone.id, (item) => ({ ...item, damage: event.target.value }))} /></label>
              <label>Save DC<input type="number" min="0" value={zone.saveDc ?? ""} placeholder="-" onChange={(event) => updateZone(zone.id, (item) => ({ ...item, saveDc: event.target.value ? Math.max(0, Number(event.target.value) || 0) : null }))} /></label>
              <label>Koşul<select value={zone.condition} onChange={(event) => updateZone(zone.id, (item) => ({ ...item, condition: event.target.value as CombatCondition | "" }))}><option value="">Koşul yok</option>{COMBAT_CONDITIONS.map((condition) => <option key={condition}>{condition}</option>)}</select></label>
              <label>Kaynak<input value={zone.source} placeholder="Cleric, tuzak..." onChange={(event) => updateZone(zone.id, (item) => ({ ...item, source: event.target.value }))} /></label>
            </div>
            <div className="battlefield-zone-targets"><span>Etkilenenler</span>{selected.combatants.map((combatant) => <button key={combatant.id} type="button" className={zone.affectedCombatantIds.includes(combatant.id) ? "active" : ""} onClick={() => updateZone(zone.id, (item) => ({ ...item, affectedCombatantIds: item.affectedCombatantIds.includes(combatant.id) ? item.affectedCombatantIds.filter((id) => id !== combatant.id) : [...item.affectedCombatantIds, combatant.id] }))}>{combatant.name}</button>)}</div>
            <textarea rows={2} value={zone.notes} onChange={(event) => updateZone(zone.id, (item) => ({ ...item, notes: event.target.value }))} placeholder="Alan etkisi, tetikleme zamanı veya kurtulma koşulu..." />
          </article>)}
          {!selected.zones.length ? <div className="battlefield-zone-empty">Aktif alan etkisi yok. Savaş alanı şimdilik şaşırtıcı biçimde güvenli.</div> : null}
        </div>
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
                <button type="button" onClick={() => addTimedEffect(combatant)}>Süreli etki ekle</button>
              </div>
              {combatant.effects.length ? <div className="combat-effects-list">{combatant.effects.map((effect) => <span key={effect.id}><strong>{effect.condition}</strong><small>{effect.remainingRounds === null ? "Süresiz" : `${effect.remainingRounds} round`}{effect.source ? ` · ${effect.source}` : ""}</small><button type="button" aria-label={`${effect.condition} etkisini kaldır`} onClick={() => updateCombatant(combatant.id, (item) => ({ ...item, effects: item.effects.filter((value) => value.id !== effect.id) }))}>×</button></span>)}</div> : null}
              <textarea rows={2} value={combatant.notes} onChange={(event) => updateCombatant(combatant.id, (item) => ({ ...item, notes: event.target.value }))} placeholder="Savaş notu..." />
            </div>
            <div className="combat-stats">
              <label>Init<input type="number" value={combatant.initiative} onChange={(event) => updateCombatant(combatant.id, (item) => ({ ...item, initiative: Number(event.target.value) || 0 }))} /></label>
              <label>AC<input type="number" min="0" value={combatant.armorClass} onChange={(event) => updateCombatant(combatant.id, (item) => ({ ...item, armorClass: Math.max(0, Number(event.target.value) || 0) }))} /></label>
              <label>Max HP<input type="number" min="1" value={combatant.maxHp} onChange={(event) => updateCombatant(combatant.id, (item) => ({ ...item, maxHp: Math.max(1, Number(event.target.value) || 1), currentHp: Math.min(item.currentHp, Math.max(1, Number(event.target.value) || 1)) }))} /></label>
              <label>Geçici<input type="number" min="0" value={combatant.tempHp} onChange={(event) => updateCombatant(combatant.id, (item) => ({ ...item, tempHp: Math.max(0, Number(event.target.value) || 0) }))} /></label>
              <div className="combat-damage-controls"><input type="number" min="0" value={damageAmount} onChange={(event) => setDamageAmount(Math.max(0, Number(event.target.value) || 0))} /><button type="button" onClick={() => handleDamage(combatant)}>Hasar</button><button type="button" onClick={() => handleHealing(combatant)}>İyileştir</button></div>
              <button type="button" className="danger" onClick={() => removeCombatant(combatant.id)}>Çıkar</button>
            </div>
          </article>;
        })}
        {!selected.combatants.length ? <div className="combat-empty">Savaş alanı boş. Bir karakter, NPC veya canavar ekle.</div> : null}
      </section>

      <section className="combat-log-panel">
        <div className="combat-log-header">
          <div><strong>Combat Log</strong><span>Round, hasar, iyileştirme ve etkiler otomatik kaydedilir.</span></div>
          <button type="button" onClick={() => updateSelected((encounter) => ({ ...encounter, log: [] }))} disabled={!selected.log.length}>Kaydı temizle</button>
        </div>
        <div className="combat-log-note"><input value={logNote} onChange={(event) => setLogNote(event.target.value)} placeholder="Manuel savaş notu..." onKeyDown={(event) => { if (event.key === "Enter") addManualLog(); }} /><button type="button" onClick={addManualLog}>Not ekle</button></div>
        <div className="combat-log-list">
          {selected.log.map((entry) => <article key={entry.id} className={`kind-${entry.kind.toLocaleLowerCase("tr")}`}><span>R{entry.round}</span><strong>{entry.kind}</strong><p>{entry.message}</p><time>{new Date(entry.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</time></article>)}
          {!selected.log.length ? <div className="combat-log-empty">Henüz savaş olayı kaydedilmedi.</div> : null}
        </div>
      </section>
    </> : <div className="combat-empty"><strong>Henüz savaş kaydı yok.</strong><button type="button" onClick={addEncounter}>İlk savaşı oluştur</button></div>}
  </PageShell>;
}
