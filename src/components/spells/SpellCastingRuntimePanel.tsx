import { useMemo, useState } from "react";
import {
  applyConcentrationDamage,
  buildSpellRuntimeSnapshot,
  setCharacterConcentration,
  spendCharacterSpellSlot,
  restoreCharacterSpellSlot,
  type SpellCompatibleCharacter,
} from "../../core/rulesets/spellCharacterCombatAdapter";
import { recoverSpellcastingResources } from "../../core/rulesets/spellRuntimeCompletion";

export type SpellCastingRuntimePanelProps<T extends SpellCompatibleCharacter> = {
  character: T;
  onCharacterChange: (character: T) => void;
  compact?: boolean;
};

export function SpellCastingRuntimePanel<T extends SpellCompatibleCharacter>({ character, onCharacterChange, compact = false }: SpellCastingRuntimePanelProps<T>) {
  const snapshot = useMemo(() => buildSpellRuntimeSnapshot(character), [character]);
  const [concentrationSpellId, setConcentrationSpellId] = useState(String(character.concentrationSpellId ?? ""));
  const [concentrationDamage, setConcentrationDamage] = useState(1);
  const [constitutionSave, setConstitutionSave] = useState(10);
  const [feedback, setFeedback] = useState("Büyü kaynakları hazır.");

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
