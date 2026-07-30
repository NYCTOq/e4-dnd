import { useMemo, useState } from "react";
import {
  applyConcentrationDamage,
  buildSpellRuntimeSnapshot,
  castCharacterSpell,
  setCharacterConcentration,
  spendCharacterSpellSlot,
  restoreCharacterSpellSlot,
  type SpellCompatibleCharacter,
} from "../../core/rulesets/spellCharacterCombatAdapter";
import { recoverSpellcastingResources } from "../../core/rulesets/spellRuntimeCompletion";
import { resolveSpellOutcome, resolveSpellTargets } from "../../core/rulesets/spellOutcomeResolution";
import type { SpellDamageRelation } from "../../core/rulesets/spellRuntimeCombatRules";
import { advanceOngoingSpellEffects, endOngoingSpellEffect, resolveOngoingEffectSave, startOngoingSpellEffect, type OngoingEffectCharacter, type OngoingSpellEffect } from "../../core/rulesets/spellOngoingEffectRuntime";

export type SpellCastingRuntimePanelProps<T extends SpellCompatibleCharacter & OngoingEffectCharacter> = {
  character: T;
  onCharacterChange: (character: T) => void;
  compact?: boolean;
};

export function SpellCastingRuntimePanel<T extends SpellCompatibleCharacter & OngoingEffectCharacter>({ character, onCharacterChange, compact = false }: SpellCastingRuntimePanelProps<T>) {
  const snapshot = useMemo(() => buildSpellRuntimeSnapshot(character), [character]);
  const [concentrationSpellId, setConcentrationSpellId] = useState(String(character.concentrationSpellId ?? ""));
  const [concentrationDamage, setConcentrationDamage] = useState(1);
  const [constitutionSave, setConstitutionSave] = useState(10);
  const [feedback, setFeedback] = useState("Büyü kaynakları hazır.");
  const availableSpells = Array.isArray(character.spells) ? character.spells : [];
  const [selectedSpellId, setSelectedSpellId] = useState(String(availableSpells[0]?.id ?? ""));
  const selectedSpell = availableSpells.find((spell) => String(spell.id) === selectedSpellId) ?? null;
  const [castLevel, setCastLevel] = useState(Number(selectedSpell?.level ?? 0));
  const [slotSource, setSlotSource] = useState<"spell" | "pact">("spell");
  const [targetArmorClass, setTargetArmorClass] = useState(10);
  const [targetSaveTotal, setTargetSaveTotal] = useState(10);
  const [targetCount, setTargetCount] = useState(1);
  const [targetDamageRelation, setTargetDamageRelation] = useState<SpellDamageRelation>("normal");
  const [ongoingDurationRounds, setOngoingDurationRounds] = useState(10);
  const [ongoingSaveTotal, setOngoingSaveTotal] = useState(10);

  const castableLevels = useMemo(() => {
    if (!selectedSpell) return [];
    if (selectedSpell.level === 0) return [0];
    const slots = slotSource === "pact" ? snapshot.pactSlots : snapshot.spellSlots;
    return slots
      .filter((slot) => slot.level >= selectedSpell.level && slot.used < slot.max)
      .map((slot) => slot.level);
  }, [selectedSpell, slotSource, snapshot.pactSlots, snapshot.spellSlots]);

  const selectSpell = (spellId: string) => {
    setSelectedSpellId(spellId);
    const spell = availableSpells.find((entry) => String(entry.id) === spellId);
    setCastLevel(Number(spell?.level ?? 0));
  };

  const castSelectedSpell = () => {
    if (!selectedSpell) { setFeedback("Kullanılacak büyüyü seç."); return; }
    const transaction = castCharacterSpell(character, selectedSpell, castLevel, slotSource);
    if (!transaction.ok) { setFeedback(transaction.reason ?? "Büyü kullanılamadı."); return; }
    onCharacterChange(transaction.character as T);
    const upcast = transaction.castLevel > selectedSpell.level ? " (" + transaction.castLevel + ". seviyede)" : "";
    const replaced = transaction.replacedConcentrationSpellId ? " Önceki konsantrasyon sona erdi: " + transaction.replacedConcentrationSpellId + "." : "";
    setFeedback(String(selectedSpell.name ?? selectedSpell.id) + upcast + " kullanıldı." + replaced);
  };

  const resolveSelectedSpell = () => {
    if (!selectedSpell) { setFeedback("Çözümlenecek büyüyü seç."); return; }
    const attackD20 = Math.floor(Math.random() * 20) + 1;
    const result = resolveSpellOutcome({ spell: selectedSpell, characterLevel: snapshot.characterLevel, castLevel, spellAttackBonus: snapshot.spellAttackBonus, spellSaveDc: snapshot.spellSaveDc, attackD20, targetArmorClass, targetSaveTotal });
    setFeedback(result.summary);
  };

  const resolveTargetGroup = () => {
    if (!selectedSpell) { setFeedback("Çözümlenecek büyüyü seç."); return; }
    const targets = Array.from({ length: Math.max(1, Math.min(50, targetCount)) }, (_, index) => ({ id: "target-" + (index + 1), label: "Hedef " + (index + 1), armorClass: targetArmorClass, saveTotal: targetSaveTotal, damageRelation: targetDamageRelation }));
    const result = resolveSpellTargets({ spell: selectedSpell, characterLevel: snapshot.characterLevel, castLevel, spellAttackBonus: snapshot.spellAttackBonus, spellSaveDc: snapshot.spellSaveDc, targets });
    setFeedback(result.summary + " · " + result.targetOutcomes.map((entry) => entry.targetLabel + ": " + (entry.appliedTotal ?? "etki")).join(", "));
  };

  const startSelectedOngoingEffect = () => {
    if (!selectedSpell) { setFeedback("Sürdürülecek büyüyü seç."); return; }
    const next = startOngoingSpellEffect(character, { spellId: String(selectedSpell.id), spellName: String(selectedSpell.name ?? selectedSpell.id), castLevel, durationRounds: ongoingDurationRounds, concentration: Boolean(selectedSpell.concentration), repeatSaveAbility: typeof selectedSpell.saveAbility === "string" ? selectedSpell.saveAbility : undefined, saveDc: snapshot.spellSaveDc, targetCount });
    onCharacterChange(next as T);
    setFeedback(String(selectedSpell.name ?? selectedSpell.id) + " devam eden etki olarak başlatıldı.");
  };

  const mutateSlot = (level: number, mode: "spend" | "restore", pact = false) => {
    const next = mode === "spend"
      ? spendCharacterSpellSlot(character, level, pact)
      : restoreCharacterSpellSlot(character, level, pact);
    onCharacterChange(next as T);
    setFeedback(`${pact ? "Pact" : "Büyü"} slotu seviye ${level} ${mode === "spend" ? "harcandı" : "yenilendi"}.`);
  };

  const recover = (rest: "short" | "long") => {
    onCharacterChange(recoverSpellcastingResources(character, rest) as T);
    setFeedback(rest === "short" ? "Kısa dinlenme: Pact slotları yenilendi." : "Uzun dinlenme: tüm büyü slotları yenilendi.");
  };

  const checkConcentration = () => {
    const result = applyConcentrationDamage(character, concentrationDamage, constitutionSave);
    onCharacterChange(result.character as T);
    setFeedback(result.maintained
      ? `Konsantrasyon korundu. CON save ${constitutionSave}, DC ${result.dc}.`
      : `Konsantrasyon bozuldu. CON save ${constitutionSave}, DC ${result.dc}.`);
  };

  const renderSlots = (title: string, slots: typeof snapshot.spellSlots, pact = false) => (
    <section className="spell-casting-runtime-panel__slot-group" aria-label={title}>
      <h3>{title}</h3>
      {slots.length === 0 ? <p>Slot bulunamadı.</p> : (
        <div className="spell-casting-runtime-panel__slot-list">
          {slots.map((slot) => {
            const remaining = Math.max(0, slot.max - slot.used);
            const kind = pact ? "pact" : "normal";
            return (
              <article key={`${kind}-${slot.level}`} className="spell-slot-runtime-card" data-testid={`spell-slot-${kind}-${slot.level}`}>
                <strong>Seviye {slot.level}</strong>
                <span data-testid={`spell-slot-remaining-${kind}-${slot.level}`}>{remaining}/{slot.max}</span>
                <button type="button" disabled={remaining <= 0} onClick={() => mutateSlot(slot.level, "spend", pact)} data-testid={`spell-slot-spend-${kind}-${slot.level}`}>Harca</button>
                <button type="button" disabled={slot.used <= 0} onClick={() => mutateSlot(slot.level, "restore", pact)} data-testid={`spell-slot-restore-${kind}-${slot.level}`}>Yenile</button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <section className={`spell-casting-runtime-panel${compact ? " is-compact" : ""}`} data-testid="spell-casting-runtime-panel">
      <header className="spell-casting-runtime-panel__header">
        <h2>Büyü Kullanımı</h2>
        <div>
          <span data-testid="spell-runtime-save-dc">DC {snapshot.spellSaveDc}</span>
          <span data-testid="spell-runtime-attack-bonus">Saldırı {snapshot.spellAttackBonus >= 0 ? "+" : ""}{snapshot.spellAttackBonus}</span>
          <span data-testid="spell-runtime-cantrip-dice">Cantrip {snapshot.cantripDice} zar</span>
        </div>
      </header>

      <section className="spell-casting-runtime-panel__cast" aria-label="Büyü kullanma kontrolleri" data-testid="spell-runtime-cast-controls">
        <h3>Büyü Kullan</h3>
        {availableSpells.length === 0 ? <p>Karakterde kayıtlı büyü bulunmuyor.</p> : (
          <div>
            <label>Büyü
              <select value={selectedSpellId} onChange={(event) => selectSpell(event.target.value)} data-testid="spell-runtime-spell-select">
                {availableSpells.map((spell) => <option key={String(spell.id)} value={String(spell.id)}>{spell.name ?? spell.id} (Seviye {spell.level})</option>)}
              </select>
            </label>
            {selectedSpell && selectedSpell.level > 0 && (
              <>
                <label>Slot kaynağı
                  <select value={slotSource} onChange={(event) => { const source = event.target.value as "spell" | "pact"; setSlotSource(source); setCastLevel(Number(selectedSpell.level)); }} data-testid="spell-runtime-slot-source">
                    <option value="spell">Normal slot</option>
                    {snapshot.pactSlots.length > 0 && <option value="pact">Pact slotu</option>}
                  </select>
                </label>
                <label>Kullanım seviyesi
                  <select value={castLevel} onChange={(event) => setCastLevel(Number(event.target.value))} data-testid="spell-runtime-cast-level">
                    {castableLevels.length === 0 && <option value={selectedSpell.level}>Uygun slot yok</option>}
                    {castableLevels.map((level) => <option key={level} value={level}>{level}. seviye</option>)}
                  </select>
                </label>
              </>
            )}
            <button type="button" onClick={castSelectedSpell} disabled={!selectedSpell || (selectedSpell.level > 0 && castableLevels.length === 0)} data-testid="spell-runtime-cast-button">Kullan</button>
            <label>Hedef AC <input type="number" min="1" value={targetArmorClass} onChange={(event) => setTargetArmorClass(Math.max(1, Number(event.target.value) || 1))} data-testid="spell-runtime-target-ac" /></label>
            <label>Hedef save toplamı <input type="number" value={targetSaveTotal} onChange={(event) => setTargetSaveTotal(Number(event.target.value) || 0)} data-testid="spell-runtime-target-save" /></label>
            <button type="button" onClick={resolveSelectedSpell} disabled={!selectedSpell} data-testid="spell-runtime-resolve-button">Etkiyi Zar Atarak Çöz</button>
            <label>Hedef sayısı <input type="number" min="1" max="50" value={targetCount} onChange={(event) => setTargetCount(Math.max(1, Math.min(50, Number(event.target.value) || 1)))} data-testid="spell-runtime-target-count" /></label>
            <label>Hasar ilişkisi
              <select value={targetDamageRelation} onChange={(event) => setTargetDamageRelation(event.target.value as SpellDamageRelation)} data-testid="spell-runtime-damage-relation">
                <option value="normal">Normal</option>
                <option value="resistant">Dirençli</option>
                <option value="immune">Bağışık</option>
                <option value="vulnerable">Savunmasız</option>
              </select>
            </label>
            <button type="button" onClick={resolveTargetGroup} disabled={!selectedSpell} data-testid="spell-runtime-resolve-group-button">Hedef Grubunu Çöz</button>
          </div>
        )}
      </section>

      <section className="spell-casting-runtime-panel__ongoing" data-testid="spell-runtime-ongoing-effects">
        <h3>Devam Eden Büyü Etkileri</h3>
        <div>
          <label>Süre (tur) <input type="number" min="1" value={ongoingDurationRounds} onChange={(event) => setOngoingDurationRounds(Math.max(1, Number(event.target.value) || 1))} data-testid="spell-runtime-ongoing-duration" /></label>
          <button type="button" onClick={startSelectedOngoingEffect} disabled={!selectedSpell} data-testid="spell-runtime-start-ongoing">Etkiyi Başlat</button>
          <button type="button" onClick={() => { onCharacterChange(advanceOngoingSpellEffects(character) as T); setFeedback("Devam eden büyü etkileri bir tur ilerletildi."); }} data-testid="spell-runtime-advance-effects">Turu İlerlet</button>
        </div>
        {((character.ongoingSpellEffects ?? []) as OngoingSpellEffect[]).length === 0 ? <p>Devam eden büyü etkisi yok.</p> : ((character.ongoingSpellEffects ?? []) as OngoingSpellEffect[]).map((effect: OngoingSpellEffect) => (
          <article key={effect.id} data-testid={`spell-runtime-effect-${effect.id}`}>
            <strong>{effect.spellName}</strong>
            <span>{effect.remainingRounds === null ? "Süresiz" : effect.remainingRounds + " tur"}</span>
            <span>{effect.targets.filter((target: OngoingSpellEffect["targets"][number]) => target.active).length}/{effect.targets.length} aktif hedef</span>
            <label>Tekrar save <input type="number" value={ongoingSaveTotal} onChange={(event) => setOngoingSaveTotal(Number(event.target.value) || 0)} /></label>
            <button type="button" disabled={!effect.targets.some((target: OngoingSpellEffect["targets"][number]) => target.active)} onClick={() => { const target = effect.targets.find((entry: OngoingSpellEffect["targets"][number]) => entry.active); if (!target) return; const result = resolveOngoingEffectSave(character, effect.id, target.id, ongoingSaveTotal); onCharacterChange(result.character as T); setFeedback(result.succeeded ? target.label + " save başarılı." : target.label + " save başarısız."); }}>Aktif Hedefe Save</button>
            <button type="button" onClick={() => { onCharacterChange(endOngoingSpellEffect(character, effect.id) as T); setFeedback(effect.spellName + " etkisi sona erdi."); }}>Bitir</button>
          </article>
        ))}
      </section>

      <div className="spell-casting-runtime-panel__rest-actions" aria-label="Büyü slotu dinlenme kontrolleri">
        <button type="button" onClick={() => recover("short")} data-testid="spell-runtime-short-rest">Kısa Dinlenme</button>
        <button type="button" onClick={() => recover("long")} data-testid="spell-runtime-long-rest">Uzun Dinlenme</button>
      </div>

      {renderSlots("Büyü Slotları", snapshot.spellSlots)}
      {snapshot.pactSlots.length > 0 && renderSlots("Pact Slotları", snapshot.pactSlots, true)}

      <section className="spell-casting-runtime-panel__concentration">
        <h3>Konsantrasyon</h3>
        <p data-testid="spell-runtime-concentration-state">{character.concentrating ? `Aktif: ${String(character.concentrationSpellId ?? "Bilinmeyen büyü")}` : "Aktif değil"}</p>
        <div>
          <input value={concentrationSpellId} onChange={(event) => setConcentrationSpellId(event.target.value)} placeholder="Büyü kimliği" aria-label="Konsantrasyon büyüsü" data-testid="spell-concentration-input" />
          <button type="button" disabled={!concentrationSpellId.trim()} onClick={() => { onCharacterChange(setCharacterConcentration(character, concentrationSpellId.trim()) as T); setFeedback(`${concentrationSpellId.trim()} konsantrasyonu başladı.`); }} data-testid="spell-concentration-start">Başlat</button>
          <button type="button" disabled={!character.concentrating} onClick={() => { onCharacterChange(setCharacterConcentration(character, null) as T); setFeedback("Konsantrasyon sona erdi."); }} data-testid="spell-concentration-stop">Bitir</button>
        </div>
        <div className="spell-casting-runtime-panel__concentration-check">
          <label>Alınan hasar <input type="number" min="0" value={concentrationDamage} onChange={(event) => setConcentrationDamage(Math.max(0, Number(event.target.value) || 0))} data-testid="spell-concentration-damage" /></label>
          <label>CON save <input type="number" value={constitutionSave} onChange={(event) => setConstitutionSave(Number(event.target.value) || 0)} data-testid="spell-concentration-save" /></label>
          <button type="button" disabled={!character.concentrating} onClick={checkConcentration} data-testid="spell-concentration-check">Kontrol Et</button>
        </div>
      </section>

      <p className="spell-casting-runtime-panel__feedback" role="status" aria-live="polite" data-testid="spell-runtime-feedback">{feedback}</p>
    </section>
  );
}

export default SpellCastingRuntimePanel;
