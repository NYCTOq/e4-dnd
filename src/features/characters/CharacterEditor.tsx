import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { getRulesetDefinition } from "../../core/rulesets/rulesetRegistry";
import { getAlwaysPreparedSpells } from "../../core/rulesets/subclassRules";
import { getHighestSpellLevel } from "../../core/rulesets/spellRules";
import { hasValidationErrors, validateCharacterDraft } from "../../core/rulesets/characterValidation";
import { normalizeDraftForProgression } from "../../core/rulesets/progressionDraftNormalization";
import { buildFinalSkillProficiencies, getAvailableClassSkills, getExpertiseLimit, getGrantedSkills, normalizeClassSkillChoices, normalizeExpertise } from "../../core/rulesets/proficiencyRules";
import { useSelectedRuleset } from "../../core/rulesets/useSelectedRuleset";
import type { Character, CharacterDraft } from "../../core/character/character.types";
import { formatModifier, getAbilityModifier, getInitiative, getPassivePerception, getProficiencyBonus, getSpellAttackBonus, getSpellSaveDc } from "../../core/character/characterCalculator";
import { PageShell } from "../../shared/layout/PageShell";
import { CharacterInventoryManager, CharacterSpellSelector, calculateEffectiveArmorClass, createCharacterFromDraft, emptyDraft } from "./characterShared";
import { buildEditedCharacter, characterToEditDraft } from "./characterEditorRules";

export function CharacterEditor({
  characters,
  onUpdateCharacter,
  rulesetData,
  isRulesetLoading,
  rulesetError,
}: {
  characters: Character[];
  onUpdateCharacter: (character: Character) => void;
  rulesetData: RulesetData | null;
  isRulesetLoading: boolean;
  rulesetError: string | null;
}) {
  const { characterId } = useParams();
  const navigate = useNavigate();

  const character = characters.find((item) => item.id === characterId);

  const [draft, setDraft] = useState<CharacterDraft>(emptyDraft);
  const selectedRuleset = useSelectedRuleset(draft.ruleset, rulesetData);
  const activeRulesetData = selectedRuleset.data;
  const activeRulesetLoading = selectedRuleset.loading || (draft.ruleset === rulesetData?.id && isRulesetLoading);
  const activeRulesetError = selectedRuleset.error ?? (draft.ruleset === rulesetData?.id ? rulesetError : null);
  const rulesetDefinition = getRulesetDefinition(draft.ruleset);

  useEffect(() => {
    if (!character) {
      return;
    }

    setDraft(characterToEditDraft(character));
  }, [character]);

  const selectedRace = useMemo(() => {
    return activeRulesetData?.races.find((race) => race.name === draft.race) ?? null;
  }, [activeRulesetData, draft.race]);

  const selectedClass = useMemo(() => {
    return (
      activeRulesetData?.classes.find(
        (classItem) => classItem.name === draft.className,
      ) ?? null
    );
  }, [activeRulesetData, draft.className]);
  const selectedSubclass = useMemo(() => activeRulesetData?.subclasses.find((item) => item.name === draft.subclass && item.className === draft.className) ?? null, [activeRulesetData, draft.subclass, draft.className]);
  const selectedBackground = useMemo(() => activeRulesetData?.backgrounds.find((item) => item.name === draft.background) ?? null, [activeRulesetData, draft.background]);
  const alwaysPreparedSpells = useMemo(() => getAlwaysPreparedSpells(selectedSubclass, getHighestSpellLevel(selectedClass ?? undefined, draft.level), activeRulesetData?.spells ?? []), [selectedSubclass, selectedClass, draft.level, activeRulesetData]);
  const validationIssues = useMemo(() => validateCharacterDraft(draft, activeRulesetData, draft.abilities), [draft, activeRulesetData]);
  const classSkillChoices = useMemo(() => normalizeClassSkillChoices(draft.skillProficiencies, selectedClass, selectedBackground), [draft.skillProficiencies, selectedClass, selectedBackground]);
  const finalSkills = useMemo(() => buildFinalSkillProficiencies(draft.skillProficiencies, selectedClass, selectedBackground), [draft.skillProficiencies, selectedClass, selectedBackground]);
  const expertiseLimit = getExpertiseLimit(draft.className, draft.level, draft.ruleset);

  function updateDraft<K extends keyof CharacterDraft>(
    key: K,
    value: CharacterDraft[K],
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateAbility(
    ability: keyof CharacterDraft["abilities"],
    value: number,
  ) {
    setDraft((current) => ({
      ...current,
      abilities: {
        ...current.abilities,
        [ability]: value,
      },
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!character) {
      return;
    }

    if (hasValidationErrors(validationIssues)) {
      document.getElementById("character-edit-validation")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    onUpdateCharacter(buildEditedCharacter(character, draft, activeRulesetData));
    navigate(`/characters/${character.id}`);
  }

  const previewCharacter = useMemo(
    () => createCharacterFromDraft(draft),
    [draft],
  );

  if (!character) {
    return (
      <PageShell
        eyebrow="Character Editor"
        title="Karakter Bulunamadı"
        description="Düzenlenecek karakter ya silindi ya da Git conflict görüp kaçtı."
      >
        <button
          className="primary-action"
          onClick={() => navigate("/characters")}
        >
          Karakterlere Dön
        </button>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Character Editor"
      title={`${character.name} Düzenle`}
      description="Karakter bilgilerini güncelle. D&D karakterleri zaten sabit kalmaz, oyuncular da durduk yere fikir değiştirir."
    >
      <form className="builder-form" onSubmit={handleSubmit}>
        <section className="form-panel">
          <h2>Temel Bilgiler</h2>

          <div className="form-grid">
            <label>
              Karakter Adı
              <input
                value={draft.name}
                onChange={(event) => updateDraft("name", event.target.value)}
                placeholder="Sora, Tengiz, Akai..."
              />
            </label>

            <label>
              Oyuncu
              <input
                value={draft.playerName}
                onChange={(event) =>
                  updateDraft("playerName", event.target.value)
                }
                placeholder="Oyuncu adı"
              />
            </label>

            <label>
              Ruleset
              <select
                value={draft.ruleset}
                onChange={(event) => {
                  const nextRuleset = event.target.value as CharacterDraft["ruleset"];
                  setDraft((current) => ({ ...current, ruleset: nextRuleset, race: "", subrace: "", className: "", classLevels: [], subclass: "", background: "", originAbilityPrimary: undefined, originAbilitySecondary: undefined, featIds: [], fightingStyleIds: [], masteredWeaponIds: [], metamagicIds: [], invocationIds: [], wildShapeFormIds: [], maneuverIds: [], knownSpellIds: [], preparedSpellIds: [], spellSlots: [], pactMagicSlots: [], inventory: [], equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: [], skillProficiencies: [], expertiseSkills: [] }));
                }}
              >
                <option value="dnd_2014">D&D 2014</option>
                <option value="dnd_2024">D&D 2024</option>
                <option value="homebrew">Homebrew</option>
              </select>
            </label>

            <label>
              Level
              <input
                type="number"
                min={1}
                max={20}
                value={draft.level}
                onChange={(event) => { const level = Number(event.target.value); setDraft((current) => normalizeDraftForProgression({ ...current, level }, activeRulesetData)); }}
              />
            </label>

            <label>
              Race
              {draft.ruleset !== "homebrew" ? (
                <select
                  value={draft.race}
                  disabled={activeRulesetLoading || !!activeRulesetError || !activeRulesetData}
                  onChange={(event) => setDraft((current) => ({ ...current, race: event.target.value, subrace: "" }))}
                >
                  <option value="">
                    {activeRulesetLoading ? `${rulesetDefinition.raceTerm} data yükleniyor...` : `${rulesetDefinition.raceTerm} seç`}
                  </option>

                  {activeRulesetData?.races.map((race) => (
                    <option key={race.id} value={race.name}>
                      {race.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={draft.race}
                  onChange={(event) => updateDraft("race", event.target.value)}
                  placeholder="Custom race..."
                />
              )}
            </label>

            {selectedRace?.subraces?.length ? <label>Alt soy<select value={draft.subrace ?? ""} onChange={(event) => updateDraft("subrace", event.target.value)}><option value="">Alt soy seç</option>{selectedRace.subraces.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label> : null}

            <label>
              Class
              {draft.ruleset !== "homebrew" ? (
                <select
                  value={draft.className}
                  disabled={activeRulesetLoading || !!activeRulesetError || !activeRulesetData}
                  onChange={(event) => setDraft((current) => ({ ...current, className: event.target.value, classLevels: [{ className: event.target.value, level: current.level }], subclass: "", featIds: [], fightingStyleIds: [], masteredWeaponIds: [], metamagicIds: [], invocationIds: [], wildShapeFormIds: [], maneuverIds: [], companionId: undefined, arcanumSpellIds: [], knownSpellIds: [], preparedSpellIds: [], spellSlots: [], skillProficiencies: [], expertiseSkills: [] }))}
                >
                  <option value="">
                    {activeRulesetLoading
                      ? "Class data yükleniyor..."
                      : "Class seç"}
                  </option>

                  {activeRulesetData?.classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.name}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={draft.className}
                  onChange={(event) =>
                    updateDraft("className", event.target.value)
                  }
                  placeholder="Custom class..."
                />
              )}
            </label>

            <label>Subclass{draft.ruleset !== "homebrew" ? <select value={draft.subclass} disabled={!selectedClass || draft.level < selectedClass.subclassLevel} onChange={(event) => updateDraft("subclass", event.target.value)}><option value="">{selectedClass && draft.level < selectedClass.subclassLevel ? `Level ${selectedClass.subclassLevel}'da açılır` : "Subclass seç"}</option>{activeRulesetData?.subclasses.filter((item) => item.className === draft.className).map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select> : <input value={draft.subclass} onChange={(event) => updateDraft("subclass", event.target.value)} placeholder="Custom subclass..." />}</label>

            <label>Background{draft.ruleset !== "homebrew" ? <select value={draft.background} disabled={!activeRulesetData} onChange={(event) => setDraft((current) => ({ ...current, background: event.target.value, originAbilityPrimary: undefined, originAbilitySecondary: undefined, skillProficiencies: normalizeClassSkillChoices(current.skillProficiencies, selectedClass, activeRulesetData?.backgrounds.find((item) => item.name === event.target.value) ?? null) }))}><option value="">Background seç</option>{activeRulesetData?.backgrounds.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select> : <input value={draft.background} onChange={(event) => updateDraft("background", event.target.value)} placeholder="Custom background..." />}</label>
            {draft.ruleset === "dnd_2024" && selectedBackground ? <><label>Background +2<select value={draft.originAbilityPrimary ?? ""} onChange={(event) => updateDraft("originAbilityPrimary", event.target.value as CharacterDraft["originAbilityPrimary"])}><option value="">Ability seç</option>{(selectedBackground.abilityOptions ?? []).map((ability) => <option key={ability} value={ability} disabled={ability === draft.originAbilitySecondary}>{ability.toUpperCase()}</option>)}</select></label><label>Background +1<select value={draft.originAbilitySecondary ?? ""} onChange={(event) => updateDraft("originAbilitySecondary", event.target.value as CharacterDraft["originAbilitySecondary"])}><option value="">Ability seç</option>{(selectedBackground.abilityOptions ?? []).map((ability) => <option key={ability} value={ability} disabled={ability === draft.originAbilityPrimary}>{ability.toUpperCase()}</option>)}</select></label></> : null}
          </div>

          {activeRulesetError ? (
            <div className="empty-panel">
              <h2>Ruleset data yüklenemedi</h2>
              <p>{activeRulesetError}</p>
            </div>
          ) : null}

          {selectedRace || selectedClass ? (
            <div className="preview-stats">
              {selectedRace ? (
                <>
                  <span>Race: {selectedRace.name}</span>
                  <span>Speed {selectedRace.speed} ft</span>
                  <span>Size {selectedRace.size}</span>
                  <span>
                    Bonus{" "}
                    {Object.entries(selectedRace.abilityBonuses)
                      .map(
                        ([ability, bonus]) =>
                          `${ability.toUpperCase()} +${bonus}`,
                      )
                      .join(", ")}
                  </span>
                </>
              ) : null}

              {selectedClass ? (
                <>
                  <span>Class: {selectedClass.name}</span>
                  <span>Hit Die d{selectedClass.hitDie}</span>
                  <span>
                    Saves{" "}
                    {selectedClass.savingThrows
                      .map((save) => save.toUpperCase())
                      .join(", ")}
                  </span>
                  <span>
                    Spell{" "}
                    {selectedClass.spellcastingAbility
                      ? selectedClass.spellcastingAbility.toUpperCase()
                      : "None"}
                  </span>
                </>
              ) : null}
            </div>
          ) : null}
        </section>

        {selectedClass && selectedBackground ? <section className="form-panel character-edit-skills"><h2>Skill Proficiency</h2><p>Background tarafından verilenler otomatik; class için tam {selectedClass.skillChoices.choose} ayrı seçim yap.</p><div className="granted-skill-list"><strong>Background:</strong> {getGrantedSkills(selectedBackground).join(", ") || "Yok"}</div><div className="skill-choice-grid">{getAvailableClassSkills(selectedClass, selectedBackground).map((skill) => { const checked = classSkillChoices.includes(skill); const full = classSkillChoices.length >= selectedClass.skillChoices.choose; return <label key={skill}><input type="checkbox" checked={checked} disabled={!checked && full} onChange={() => setDraft((current) => ({ ...current, skillProficiencies: checked ? classSkillChoices.filter((item) => item !== skill) : [...classSkillChoices, skill] }))} />{skill}</label>; })}</div>{expertiseLimit > 0 ? <><h3>Expertise <small>{draft.expertiseSkills.length}/{expertiseLimit}</small></h3><div className="skill-choice-grid">{finalSkills.map((skill) => { const checked = draft.expertiseSkills.includes(skill); return <label key={skill}><input type="checkbox" checked={checked} disabled={!checked && draft.expertiseSkills.length >= expertiseLimit} onChange={() => updateDraft("expertiseSkills", normalizeExpertise(checked ? draft.expertiseSkills.filter((item) => item !== skill) : [...draft.expertiseSkills, skill], finalSkills, expertiseLimit))} />{skill}</label>; })}</div></> : null}</section> : null}

        <section className="form-panel">
          <h2>Ability Scores</h2>

          <div className="ability-editor">
            {Object.entries(draft.abilities).map(([ability, score]) => (
              <label className="ability-input" key={ability}>
                <span>{ability.toUpperCase()}</span>

                <input
                  type="number"
                  min={1}
                  max={20}
                  value={score}
                  onChange={(event) =>
                    updateAbility(
                      ability as keyof CharacterDraft["abilities"],
                      Number(event.target.value),
                    )
                  }
                />

                <strong>{formatModifier(getAbilityModifier(score))}</strong>
              </label>
            ))}
          </div>
        </section>

        <section className="form-panel">
          <h2>Combat</h2>

          <div className="form-grid">
            <label>
              Max HP
              <input
                type="number"
                min={1}
                value={draft.maxHp}
                onChange={(event) =>
                  updateDraft("maxHp", Number(event.target.value))
                }
              />
            </label>

            <label>
              Armor Class
              <input
                type="number"
                min={1}
                value={draft.armorClass}
                onChange={(event) =>
                  updateDraft("armorClass", Number(event.target.value))
                }
              />
            </label>
          </div>

          <label>
            Notlar
            <textarea
              value={draft.notes}
              onChange={(event) => updateDraft("notes", event.target.value)}
              placeholder="Lore, özel homebrew kurallar, DM notları..."
              rows={4}
            />
          </label>
        </section>

        <CharacterSpellSelector
          title="Karakter Spellbook"
          description="Bu karakterin spell listesini güncelle. Oyuncular zaten her seviye atlayınca kimlik krizi geçiriyor."
          rulesetData={activeRulesetData}
          isRulesetLoading={activeRulesetLoading}
          rulesetError={activeRulesetError}
          className={draft.className}
          subclassName={draft.subclass}
          characterLevel={draft.level}
          abilities={draft.abilities}
          knownSpellIds={draft.knownSpellIds}
          preparedSpellIds={draft.preparedSpellIds}
          alwaysPreparedSpellIds={alwaysPreparedSpells.map((spell) => spell.id)}
          onChange={(next) =>
            setDraft((current) => ({
              ...current,
              knownSpellIds: next.knownSpellIds,
              preparedSpellIds: next.preparedSpellIds,
            }))
          }
        />

        <CharacterInventoryManager
          title="Inventory & Equipment"
          description="Karakterin itemlarını ve kuşandığı ekipmanı güncelle. Çanta yönetimi, kahramanlığın en az havalı ama en gerekli tarafı."
          rulesetData={activeRulesetData}
          isRulesetLoading={activeRulesetLoading}
          rulesetError={activeRulesetError}
          inventory={draft.inventory}
          equippedArmorId={draft.equippedArmorId}
          equippedShieldId={draft.equippedShieldId}
          equippedWeaponIds={draft.equippedWeaponIds}
          gold={draft.gold}
          abilities={draft.abilities}
          armorClass={draft.armorClass}
          armorClassMode={draft.armorClassMode}
          onChange={(next) =>
            setDraft((current) => ({
              ...current,
              inventory: next.inventory,
              equippedArmorId: next.equippedArmorId,
              equippedShieldId: next.equippedShieldId,
              equippedWeaponIds: next.equippedWeaponIds,
              gold: next.gold,
              armorClass: next.armorClass,
              armorClassMode: next.armorClassMode,
            }))
          }
        />

        <section className="form-panel preview-panel">
          <h2>Önizleme</h2>

          <div className="preview-stats">
            <span>PB +{getProficiencyBonus(previewCharacter.level)}</span>
            <span>AC {calculateEffectiveArmorClass(draft, activeRulesetData?.items)}</span>
            <span>HP {previewCharacter.maxHp}</span>
            <span>Init {formatModifier(getInitiative(previewCharacter))}</span>
            <span>PP {getPassivePerception(previewCharacter)}</span>
            <span>DC {getSpellSaveDc(previewCharacter)}</span>
            <span>
              Spell Attack{" "}
              {formatModifier(getSpellAttackBonus(previewCharacter))}
            </span>
          </div>

          <div id="character-edit-validation" className={`character-edit-validation ${hasValidationErrors(validationIssues) ? "has-errors" : "ready"}`} aria-live="polite"><h3>{hasValidationErrors(validationIssues) ? "Kaydetmeden önce düzelt" : "Karakter verisi kayda hazır"}</h3>{validationIssues.length ? <ul>{validationIssues.map((issue) => <li key={issue.id} className={issue.severity}><strong>{issue.step}</strong> · {issue.message}</li>)}</ul> : <p>Zorunlu seçim veya veri hatası bulunmadı.</p>}</div>

          <div className="character-actions">
            <button className="primary-action" type="submit" disabled={hasValidationErrors(validationIssues)}>
              Değişiklikleri Kaydet
            </button>

            <button
              type="button"
              onClick={() => navigate(`/characters/${character.id}`)}
            >
              Vazgeç
            </button>
          </div>
        </section>
      </form>
    </PageShell>
  );
}
