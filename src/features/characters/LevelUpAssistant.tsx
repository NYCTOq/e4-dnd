import { useMemo, useState } from "react";
import type { Character, AbilityKey } from "../../core/character/character.types";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { getAbilityModifier, getProficiencyBonus } from "../../core/character/characterCalculator";
import { rollDice } from "../../core/dice/diceRoller";
import {
  buildLeveledCharacter,
  getAverageHpGain,
  isAsiMilestone,
  type LevelUpAsiMode,
} from "./levelUpCalculator";
import { getLatestLevelUp, removeLevelUpHistoryEntry, saveLevelUpSnapshot } from "./levelUpHistory";
import { isFeatEligible } from "../../core/rulesets/featRules";
import { getCharacterChoiceDebt } from "../../core/rulesets/choiceDebt";
import { getClassLevel, getMulticlassConflictSummary, getMulticlassProficiencyGains, getMulticlassTransitionEligibility, normalizeClassLevels } from "../../core/rulesets/multiclassRules";
import { getFeatChoiceState } from "../../core/rulesets/levelUpChoiceCompletion";
import { getFightingStyleChoiceCount } from "../../core/rulesets/fightingStyleRules";
import { getLevelUpAdvancementReadiness } from "../../core/rulesets/levelUpAdvancementReadiness";

const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

type HpMode = "average" | "roll" | "manual";
type AsiMode = LevelUpAsiMode;

export function LevelUpAssistant({
  character,
  rulesetData,
  onUpdateCharacter,
}: {
  character: Character;
  rulesetData: RulesetData | null;
  onUpdateCharacter: (character: Character) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hpMode, setHpMode] = useState<HpMode>("average");
  const [manualHp, setManualHp] = useState(1);
  const [rolledHp, setRolledHp] = useState<number | null>(null);
  const [asiMode, setAsiMode] = useState<AsiMode>("none");
  const [primaryAbility, setPrimaryAbility] = useState<AbilityKey>("str");
  const [secondaryAbility, setSecondaryAbility] = useState<AbilityKey>("dex");
  const [selectedFeatId,setSelectedFeatId]=useState("");
  const [selectedFeatChoice,setSelectedFeatChoice]=useState("");
  const [targetClassName,setTargetClassName]=useState(character.className);
  const [selectedSubclassName,setSelectedSubclassName]=useState("");
  const [latestHistory, setLatestHistory] = useState(() => getLatestLevelUp(character.id));

  const nextLevel = Math.min(20, character.level + 1);
  const classLevels=normalizeClassLevels(character.classLevels,character.className,character.level);
  const selectedClass = rulesetData?.classes.find((classItem) => classItem.name === targetClassName);
  const nextClassLevel=getClassLevel(classLevels,targetClassName)+1;
  const multiclassEligibility=getMulticlassTransitionEligibility(classLevels,targetClassName,character.abilities);
  const multiclassProficiencies=getClassLevel(classLevels,targetClassName)===0?getMulticlassProficiencyGains(targetClassName,character.ruleset):[];
  const multiclassWarnings=getMulticlassConflictSummary(getClassLevel(classLevels,targetClassName)>0?classLevels:[...classLevels,{className:targetClassName,level:1}]);
  const hitDie = selectedClass?.hitDie ?? 8;
  const conModifier = getAbilityModifier(character.abilities.con);
  const averageHpGain = getAverageHpGain(hitDie, character.abilities.con);
  const currentProficiency = getProficiencyBonus(character.level);
  const nextProficiency = getProficiencyBonus(nextLevel);
  const asiAvailable = isAsiMilestone(nextClassLevel, targetClassName);
  const newClassFeatures = selectedClass?.levels.find((row) => row.level === nextClassLevel)?.features ?? [];
  const existingTargetSubclass = targetClassName===character.className?character.subclass:classLevels.find(level=>level.className===targetClassName)?.subclass;
  const availableSubclasses=(rulesetData?.subclasses??[]).filter(item=>item.className===targetClassName);
  const selectedSubclass = rulesetData?.subclasses.find((item) => item.className === targetClassName && item.name === (selectedSubclassName||existingTargetSubclass));
  const newSubclassFeatures = selectedSubclass?.features.filter((feature) => feature.level === nextClassLevel) ?? [];
  const grantedOriginFeat=rulesetData?.backgrounds.find(item=>item.name===character.background)?.originFeat;
  const eligibleFeats=(rulesetData?.feats??[]).filter(feat=>feat.id!=="ability-score-improvement"&&feat.category!=="fighting-style"&&feat.name!==grantedOriginFeat&&!character.featIds.includes(feat.id)&&isFeatEligible(feat,{level:nextLevel,className:targetClassName,abilities:character.abilities,canCastSpells:Boolean(selectedClass?.spellcastingAbility),armorTraining:selectedClass?.armorProficiencies,hasFightingStyleFeature:getFightingStyleChoiceCount(targetClassName,nextLevel,character.subclass)>0}).eligible);
  const nextChoiceDebt=getCharacterChoiceDebt({...character,level:nextLevel},rulesetData);
  const selectedFeat=eligibleFeats.find((feat)=>feat.id===selectedFeatId);
  const selectedFeatChoiceState=getFeatChoiceState(selectedFeat,selectedFeatChoice?[selectedFeatChoice]:[]);
  const milestoneChoiceMissing=asiAvailable&&asiMode==="none"&&(!selectedFeatId||Boolean(selectedFeatChoiceState&&!selectedFeatChoiceState.complete));
  const advancementReadiness=getLevelUpAdvancementReadiness({character,rulesetData,targetClassName,selectedSubclassName:selectedSubclassName||existingTargetSubclass,milestoneChoiceComplete:!milestoneChoiceMissing});

  const hpGain = useMemo(() => {
    if (hpMode === "manual") {
      return Math.max(1, Math.floor(manualHp || 1));
    }

    if (hpMode === "roll") {
      return rolledHp ?? Math.max(1, 1 + conModifier);
    }

    return averageHpGain;
  }, [averageHpGain, conModifier, hpMode, manualHp, rolledHp]);

  function rollLevelHp() {
    const result = rollDice({ count: 1, sides: hitDie, modifier: conModifier });
    setRolledHp(Math.max(1, result.total));
  }

  function confirmLevelUp() {
    if (character.level >= 20) {
      return;
    }

    const snapshot=saveLevelUpSnapshot(character);
    const nextCharacter = buildLeveledCharacter(character, {
      hpGain,
      hitDie,
      asiMode,
      primaryAbility,
      secondaryAbility,
      classData:selectedClass,
      targetClassData:selectedClass,
      allClasses:rulesetData?.classes,
      featId:asiMode==="none"?selectedFeatId:undefined,
      featData:asiMode==="none"?selectedFeat:null,
      featChoice:asiMode==="none"?selectedFeatChoice:undefined,
      targetSubclassName:selectedSubclassName||existingTargetSubclass||undefined,
    });

    onUpdateCharacter(nextCharacter);
    setLatestHistory(snapshot);
    setIsOpen(false);
    setRolledHp(null);
    setAsiMode("none");
    setSelectedFeatId("");
    setSelectedFeatChoice("");
    setSelectedSubclassName("");
  }

  function undoLatestLevelUp(){if(!latestHistory)return; onUpdateCharacter(latestHistory.before); removeLevelUpHistoryEntry(latestHistory.id); setLatestHistory(getLatestLevelUp(character.id));}

  if (character.level >= 20) {
    return (
      <div className="level-up-launch-card level-cap-card">
        <div>
          <span className="mini-label">Level Up Assistant</span>
          <strong>Level 20</strong>
          <p>Karakter seviye sınırında. Bundan sonrası destan, homebrew veya DM’in sabrına bağlı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="level-up-launch-card">
      <div>
        <span className="mini-label">Level Up Assistant</span>
        <strong>Level {character.level} → {nextLevel}</strong>
        <p>HP, proficiency, hit dice ve spell slot güncellemelerini kontrollü biçimde uygula.</p>
      </div>

      <button type="button" onClick={() => setIsOpen((current) => !current)}>
        {isOpen ? "Kapat" : "Level Up"}
      </button>
      {latestHistory ? <button type="button" onClick={undoLatestLevelUp}>Son Level Up'ı Geri Al</button> : null}

      {isOpen ? (
        <div className="level-up-panel">
          <div className="level-up-summary-grid">
            <div>
              <span>Yeni Seviye</span>
              <strong>{nextLevel}</strong>
            </div>
            <div>
              <span>Proficiency</span>
              <strong>+{currentProficiency} → +{nextProficiency}</strong>
            </div>
            <div>
              <span>Hit Die</span>
              <strong>d{hitDie}</strong>
            </div>
            <div>
              <span>HP Artışı</span>
              <strong>+{hpGain}</strong>
            </div>
          </div>

          <section className="level-up-section"><div className="panel-heading-row"><div><span className="mini-label">Class Level</span><h3>Bu seviyeyi hangi class alacak?</h3><p>Toplam level {nextLevel}; seçilen class level {nextClassLevel} olur.</p></div></div><label className="level-up-manual-field">Class<select value={targetClassName} onChange={event=>{setTargetClassName(event.target.value);setAsiMode("none");setSelectedFeatId("");setSelectedFeatChoice("");setSelectedSubclassName("")}}>{rulesetData?.classes.map(item=><option key={item.id} value={item.name}>{item.name} · şu an {getClassLevel(classLevels,item.name)}</option>)}</select></label>{!multiclassEligibility.eligible&&getClassLevel(classLevels,targetClassName)===0?<p className="validation-message error">Multiclass prerequisite eksik: {multiclassEligibility.missing.join(", ")}</p>:null}<div className="condition-rule-summary">{classLevels.map(item=><small key={item.className}>{item.className} {item.level}</small>)}</div>{multiclassProficiencies.length?<p className="validation-message">Yeni class proficiency kazanımları: {multiclassProficiencies.join(", ")}</p>:null}{multiclassWarnings.map(warning=><p className="validation-message" key={warning}>{warning}</p>)}</section>

          {advancementReadiness.subclassRequired ? (
            <section className="level-up-section">
              <div className="panel-heading-row"><div><span className="mini-label">Subclass</span><h3>{targetClassName} uzmanlığını seç</h3><p>Class level {nextClassLevel} için zorunlu seçim.</p></div></div>
              <label className="level-up-manual-field">Subclass
                <select value={selectedSubclassName} onChange={event=>setSelectedSubclassName(event.target.value)}>
                  <option value="">Seçim yap...</option>
                  {availableSubclasses.map(item=><option key={item.id} value={item.name}>{item.name}</option>)}
                </select>
              </label>
            </section>
          ) : null}

          <section className="level-up-section">
            <div className="panel-heading-row">
              <div>
                <span className="mini-label">Hit Points</span>
                <h3>HP artışını seç</h3>
              </div>
            </div>

            <div className="level-up-choice-grid">
              <button
                type="button"
                className={hpMode === "average" ? "active" : ""}
                onClick={() => setHpMode("average")}
              >
                Ortalama +{averageHpGain}
              </button>
              <button
                type="button"
                className={hpMode === "roll" ? "active" : ""}
                onClick={() => setHpMode("roll")}
              >
                Zar At d{hitDie}
              </button>
              <button
                type="button"
                className={hpMode === "manual" ? "active" : ""}
                onClick={() => setHpMode("manual")}
              >
                Manuel
              </button>
            </div>

            {hpMode === "roll" ? (
              <div className="level-up-inline-control">
                <button type="button" onClick={rollLevelHp}>HP Zarı At</button>
                <strong>{rolledHp === null ? "Henüz atılmadı" : `Sonuç: +${rolledHp} HP`}</strong>
              </div>
            ) : null}

            {hpMode === "manual" ? (
              <label className="level-up-manual-field">
                HP artışı
                <input
                  type="number"
                  min={1}
                  value={manualHp}
                  onChange={(event) => setManualHp(Number(event.target.value))}
                />
              </label>
            ) : null}
          </section>

          {asiAvailable ? (
            <section className="level-up-section">
              <div className="panel-heading-row">
                <div>
                  <span className="mini-label">Ability Score Improvement</span>
                  <h3>ASI veya feat tercihi</h3>
                  <p>Bu seviyede ASI veya uygun bir feat seçmeden level-up tamamlanmaz.</p>
                </div>
              </div>

              <div className="level-up-choice-grid">
                <button type="button" className={asiMode === "none" ? "active" : ""} onClick={() => setAsiMode("none")}>Feat / Sonra</button>
                <button type="button" className={asiMode === "plus-two" ? "active" : ""} onClick={() => setAsiMode("plus-two")}>Bir Yeteneğe +2</button>
                <button type="button" className={asiMode === "split" ? "active" : ""} onClick={() => setAsiMode("split")}>İki Yeteneğe +1</button>
              </div>

              {asiMode==="none"?<label className="level-up-manual-field">Feat seçimi<select value={selectedFeatId} onChange={event=>{setSelectedFeatId(event.target.value);setSelectedFeatChoice("")}}><option value="">Feat seç...</option>{eligibleFeats.map(feat=><option key={feat.id} value={feat.id}>{feat.name}</option>)}</select></label>:null}

              {asiMode==="none"&&selectedFeatChoiceState?.options.length?<label className="level-up-manual-field">Feat alt seçimi<select value={selectedFeatChoice} onChange={event=>setSelectedFeatChoice(event.target.value)}><option value="">Seçim yap...</option>{selectedFeatChoiceState.options.map(option=><option key={option} value={option}>{ABILITY_LABELS[option as AbilityKey]??option}</option>)}</select></label>:null}

              {asiMode !== "none" ? (
                <div className="level-up-ability-selects">
                  <label>
                    Birinci yetenek
                    <select value={primaryAbility} onChange={(event) => setPrimaryAbility(event.target.value as AbilityKey)}>
                      {(Object.keys(ABILITY_LABELS) as AbilityKey[]).map((ability) => (
                        <option key={ability} value={ability}>{ABILITY_LABELS[ability]} ({character.abilities[ability]})</option>
                      ))}
                    </select>
                  </label>

                  {asiMode === "split" ? (
                    <label>
                      İkinci yetenek
                      <select value={secondaryAbility} onChange={(event) => setSecondaryAbility(event.target.value as AbilityKey)}>
                        {(Object.keys(ABILITY_LABELS) as AbilityKey[]).map((ability) => (
                          <option key={ability} value={ability}>{ABILITY_LABELS[ability]} ({character.abilities[ability]})</option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="level-up-section level-up-checklist">
            <span className="mini-label">Advancement Readiness</span>
            <h3>{advancementReadiness.ready ? "Level-up hazır" : "Level-up eksikleri var"}</h3>
            <p>{advancementReadiness.completedChecks}/{advancementReadiness.totalChecks} kontrol tamamlandı.</p>
            {advancementReadiness.blockers.map(item=><p className="validation-message error" key={item}>{item}</p>)}
            {advancementReadiness.notices.map(item=><p className="validation-message" key={item}>{item}</p>)}
          </section>

          <section className="level-up-section level-up-checklist">
            <span className="mini-label">Kontrol Listesi</span>
            <ul>
              {newClassFeatures.length ? newClassFeatures.map((feature)=><li key={feature}>Yeni class feature: <strong>{feature}</strong></li>) : <li>Bu seviyede yeni class feature görünmüyor.</li>}
              {newSubclassFeatures.map((feature)=><li key={feature.name}>Yeni subclass feature: <strong>{feature.name}</strong> — {feature.summary}</li>)}
              <li>Yeni spell, cantrip veya prepared spell hakkını kontrol et.</li>
              <li>{nextProficiency > currentProficiency ? "Proficiency bonus bu seviyede otomatik artacak." : "Proficiency bonus bu seviyede değişmiyor."}</li>
              <li>Hit dice havuzu ve bilinen spell slot tablosu otomatik güncellenecek.</li>
              {nextLevel === 3 ? <li>Subclass seçimi çoğu class için bu seviyede gündeme gelir.</li> : null}
              {asiAvailable ? <li>Bu seviye genel ASI kilometre taşıdır; bazı class’lar farklı ilerleyebilir.</li> : null}
              {nextChoiceDebt.map(debt=><li key={debt.id}><strong>Seçim borcu:</strong> {debt.message} Level-up sonrasında tamamlanmalı.</li>)}
            </ul>
          </section>

          <div className="level-up-confirm-bar">
            <div>
              <strong>Level {nextLevel}</strong>
              <span>Maksimum HP +{hpGain}</span>
            </div>
            <button type="button" className="primary-action" disabled={!advancementReadiness.ready} onClick={confirmLevelUp}>{advancementReadiness.ready?"Level Up Uygula":"Eksikleri Tamamla"}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
