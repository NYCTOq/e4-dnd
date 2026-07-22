import { useMemo, useState } from "react";
import type { Character, CharacterResource, ResourceRecovery } from "../../core/character/character.types";
import { PageShell } from "../../shared/layout/PageShell";
import { addCombatLog, createCombatLogEntry, loadCombatEncounters, saveCombatEncounters } from "../combat-tracker/combatTrackerStorage";
import { applyRestToCharacters, getDefaultRestOptions, loadRestHistory, restoreRestSnapshot, saveRestHistory, type RestHistoryEntry, type RestKind } from "./restAutomation";
import { getPlayerJourneyIntegrationSnapshot } from "../../core/rulesets/playerJourneyIntegration";

type Props = { characters: Character[]; onReplaceCharacters: (characters: Character[]) => void };
const RECOVERY_LABELS: Record<ResourceRecovery, string> = { short: "Short Rest", long: "Long Rest", manual: "Manuel" };

export function RestCenterPage({ characters, onReplaceCharacters }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => characters.map((item) => item.id));
  const [kind, setKind] = useState<RestKind>("long");
  const [options, setOptions] = useState(() => getDefaultRestOptions("long"));
  const [history, setHistory] = useState<RestHistoryEntry[]>(() => loadRestHistory());
  const [resourceDrafts, setResourceDrafts] = useState<Record<string, { name: string; max: number; recovery: ResourceRecovery }>>({});
  const selectedCharacters = useMemo(() => characters.filter((item) => selectedIds.includes(item.id)), [characters, selectedIds]);

  function changeKind(next: RestKind) { setKind(next); setOptions(getDefaultRestOptions(next)); }
  function toggleCharacter(id: string) { setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }

  function applyRest() {
    if (!selectedIds.length) return;
    const result = applyRestToCharacters(characters, selectedIds, kind, options);
    const entry: RestHistoryEntry = { id: crypto.randomUUID(), kind, createdAt: new Date().toISOString(), characterIds: [...selectedIds], summaries: result.summaries, before: result.before };
    onReplaceCharacters(result.characters);
    const nextHistory = [entry, ...history].slice(0, 20); setHistory(nextHistory); saveRestHistory(nextHistory);
    const encounters = loadCombatEncounters().map((encounter) => {
      const affected = encounter.combatants.filter((combatant) => combatant.kind === "Karakter" && selectedIds.includes(combatant.sourceId));
      if (!affected.length) return encounter;
      const synced = encounter.combatants.map((combatant) => {
        const character = result.characters.find((item) => item.id === combatant.sourceId);
        return character ? { ...combatant, currentHp: character.currentHp, tempHp: character.tempHp, isDefeated: character.currentHp === 0 } : combatant;
      });
      return addCombatLog({ ...encounter, combatants: synced }, createCombatLogEntry("Sistem", encounter.round, `${kind === "long" ? "Long Rest" : "Short Rest"} uygulandı: ${affected.map((item) => item.name).join(", ")}.`));
    });
    saveCombatEncounters(encounters);
  }

  function undoLast() {
    const latest = history[0]; if (!latest) return;
    onReplaceCharacters(restoreRestSnapshot(characters, latest));
    const next = history.slice(1); setHistory(next); saveRestHistory(next);
  }

  function updateResources(character: Character, resources: CharacterResource[]) {
    onReplaceCharacters(characters.map((item) => item.id === character.id ? { ...item, resources, updatedAt: new Date().toISOString() } : item));
  }

  function addResource(character: Character) {
    const draft = resourceDrafts[character.id] ?? { name: "", max: 1, recovery: "short" as ResourceRecovery };
    if (!draft.name.trim()) return;
    updateResources(character, [...character.resources, { id: crypto.randomUUID(), name: draft.name.trim(), max: Math.max(1, draft.max), used: 0, recovery: draft.recovery }]);
    setResourceDrafts((current) => ({ ...current, [character.id]: { name: "", max: 1, recovery: "short" } }));
  }

  return <PageShell eyebrow="Character resources" title="Rest + Resource Automation" description="Short Rest ve Long Rest işlemlerini seçili karakterlere toplu uygula; HP, spell slot, Hit Dice, exhaustion ve sınıf kaynaklarını güvenli biçimde yenile.">
    <section className="rest-toolbar panel">
      <div className="rest-kind-tabs"><button className={kind === "short" ? "active" : ""} onClick={() => changeKind("short")}>Short Rest</button><button className={kind === "long" ? "active" : ""} onClick={() => changeKind("long")}>Long Rest</button></div>
      <div className="rest-options">
        <label><input type="checkbox" checked={options.healToFull} onChange={(event) => setOptions({ ...options, healToFull: event.target.checked })}/> HP'yi tamamen doldur</label>
        {kind === "short" ? <label>Harici zar sonrası iyileşme <input type="number" min="0" value={options.shortRestHealing} onChange={(event) => setOptions({ ...options, shortRestHealing: Number(event.target.value) })}/></label> : null}
        <label><input type="checkbox" checked={options.clearTempHp} onChange={(event) => setOptions({ ...options, clearTempHp: event.target.checked })}/> Geçici HP temizle</label>
        <label><input type="checkbox" checked={options.resetDeathSaves} onChange={(event) => setOptions({ ...options, resetDeathSaves: event.target.checked })}/> Death Save sıfırla</label>
        <label><input type="checkbox" checked={options.reduceExhaustion} onChange={(event) => setOptions({ ...options, reduceExhaustion: event.target.checked })}/> Exhaustion 1 azalt</label>
        <label><input type="checkbox" checked={options.clearConditions} onChange={(event) => setOptions({ ...options, clearConditions: event.target.checked })}/> Koşulları temizle</label>
      </div>
      <p className="muted">Seçili: {selectedCharacters.map((item) => item.name).join(", ") || "yok"}</p>
      <div className="rest-actions"><button className="primary-button" onClick={applyRest} disabled={!selectedIds.length}>{selectedIds.length} karaktere uygula</button><button onClick={undoLast} disabled={!history.length}>Son dinlenmeyi geri al</button></div>
    </section>
    <section className="rest-grid">
      {characters.map((character) => {
        const draft = resourceDrafts[character.id] ?? { name: "", max: 1, recovery: "short" as ResourceRecovery };
        const journeySnapshot = getPlayerJourneyIntegrationSnapshot(character);
        return <article className={`rest-card panel ${selectedIds.includes(character.id) ? "selected" : ""}`} key={character.id}>
          <header><label><input type="checkbox" checked={selectedIds.includes(character.id)} onChange={() => toggleCharacter(character.id)}/><strong>{character.name}</strong></label><span>{character.className} L{character.level}</span></header>
          <div className="rest-stats"><span>HP {character.currentHp}/{character.maxHp}</span><span>Temp {character.tempHp}</span><span>Exhaustion {character.exhaustion}</span><span>Used slots {character.spellSlots.reduce((sum, slot) => sum + slot.used, 0)}</span></div><div className="rest-journey-summary"><strong>{journeySnapshot.restRecommendation==="long"?"Long Rest":journeySnapshot.restRecommendation==="short"?"Short Rest":"Dinlenme gerekmiyor"}</strong><small>{journeySnapshot.restReason}</small></div>
          <div className="resource-list">{character.resources.length ? character.resources.map((resource) => <div className="resource-row" key={resource.id}><span><strong>{resource.name}</strong><small>{RECOVERY_LABELS[resource.recovery]}</small></span><label>Kullanılan <input type="number" min="0" max={resource.max} value={resource.used} onChange={(event) => updateResources(character, character.resources.map((item) => item.id === resource.id ? { ...item, used: Math.min(item.max, Math.max(0, Number(event.target.value))) } : item))}/></label><span>/{resource.max}</span><button aria-label={`${resource.name} sil`} onClick={() => updateResources(character, character.resources.filter((item) => item.id !== resource.id))}>×</button></div>) : <p className="muted">Henüz özel kaynak yok.</p>}</div>
          <div className="resource-add"><input placeholder="Kaynak adı" value={draft.name} onChange={(event) => setResourceDrafts((current) => ({ ...current, [character.id]: { ...draft, name: event.target.value } }))}/><input type="number" min="1" value={draft.max} onChange={(event) => setResourceDrafts((current) => ({ ...current, [character.id]: { ...draft, max: Number(event.target.value) } }))}/><select value={draft.recovery} onChange={(event) => setResourceDrafts((current) => ({ ...current, [character.id]: { ...draft, recovery: event.target.value as ResourceRecovery } }))}><option value="short">Short Rest</option><option value="long">Long Rest</option><option value="manual">Manuel</option></select><button onClick={() => addResource(character)}>Ekle</button></div>
        </article>;
      })}
    </section>
    <section className="rest-history panel"><h2>Dinlenme geçmişi</h2>{history.length ? history.slice(0, 6).map((entry) => <article key={entry.id}><strong>{entry.kind === "long" ? "Long Rest" : "Short Rest"}</strong><span>{new Date(entry.createdAt).toLocaleString("tr-TR")}</span><p>{entry.summaries.map((item) => `${item.name}: HP ${item.hpBefore}→${item.hpAfter}`).join(" • ")}</p></article>) : <p className="muted">Henüz dinlenme kaydı yok.</p>}</section>
  </PageShell>;
}
