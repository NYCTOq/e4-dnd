import type { CharacterDraft } from "../../core/character/character.types";
import type { DndFeatData, DndRaceData, DndSpellData } from "../../core/rulesets/ruleset.types";
import { ALL_SKILLS } from "../../core/rulesets/proficiencyRules";
import { getAncestryBuilderContract } from "../../core/rulesets/ancestryChoiceRules";

type Props = {
  draft: CharacterDraft;
  race: DndRaceData | null;
  feats: DndFeatData[];
  spells: DndSpellData[];
  onChange: (updater: (current: CharacterDraft) => CharacterDraft) => void;
};

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

export function AncestryChoicePanel({ draft, race, feats, spells, onChange }: Props) {
  const contract = getAncestryBuilderContract(draft.ruleset, race, draft.subrace, draft.level);
  const hasContent =
    contract.choiceRequired ||
    contract.options.length ||
    contract.skillChoiceCount ||
    contract.fixedSkills.length ||
    contract.originFeatChoiceCount ||
    contract.languageChoiceCount ||
    contract.sizeChoice ||
    contract.spellChoice ||
    contract.notices.length;

  if (!race || !hasContent) return null;

  const selectedSkills = draft.ancestrySkillProficiencies ?? [];
  const originFeats = feats.filter((feat) => feat.category === "origin");
  const wizardCantrips = spells.filter(
    (spell) => spell.level === 0 && spell.classes.some((name) => name.toLowerCase() === "wizard"),
  );

  const toggleSkill = (skill: string) => {
    onChange((current) => {
      const values = current.ancestrySkillProficiencies ?? [];
      const next = values.includes(skill)
        ? values.filter((item) => item !== skill)
        : values.length < contract.skillChoiceCount
          ? [...values, skill]
          : values;
      return { ...current, ancestrySkillProficiencies: next };
    });
  };

  return (
    <section className="ruleset-foundation-card ancestry-choice-panel" data-testid="ancestry-choice-panel">
      <div className="panel-heading-row">
        <div>
          <span className="mini-label">{draft.ruleset === "dnd_2024" ? "Species Choices" : "Race Choices"}</span>
          <strong>{race.name} seçimleri</strong>
        </div>
      </div>

      {contract.sizeChoice ? (
        <label>
          Size
          <select
            value={draft.ancestrySize ?? ""}
            onChange={(event) => onChange((current) => ({ ...current, ancestrySize: event.target.value as "Small" | "Medium" }))}
          >
            <option value="">Boyut seç</option>
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
          </select>
        </label>
      ) : null}

      {contract.options.length ? (
        <div>
          <h3>{contract.choiceLabel}</h3>
          <div className="builder-choice-grid">
            {contract.options.map((option) => {
              const selected = draft.ancestryChoiceId === option.id;
              return (
                <article className={`builder-choice-card ${selected ? "selected" : ""}`} key={option.id}>
                  <div className="panel-heading-row">
                    <h3>{option.name}</h3>
                    <button
                      type="button"
                      onClick={() => onChange((current) => ({
                        ...current,
                        ancestryChoiceId: selected ? undefined : option.id,
                      }))}
                    >
                      {selected ? "Kaldır" : "Seç"}
                    </button>
                  </div>
                  <p>{option.summary}</p>
                  {option.resistance ? <span className="mini-label">Resistance: {option.resistance}</span> : null}
                  {option.spells?.length ? <span className="mini-label">Spells: {option.spells.join(", ")}</span> : null}
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {contract.fixedSkills.length ? (
        <article className="builder-choice-card selected">
          <span className="mini-label">Otomatik skill</span>
          <h3>{contract.fixedSkills.join(", ")}</h3>
        </article>
      ) : null}

      {contract.skillChoiceCount ? (
        <div>
          <div className="panel-heading-row">
            <h3>Ancestry Skill</h3>
            <span>{selectedSkills.length} / {contract.skillChoiceCount}</span>
          </div>
          <div className="builder-choice-grid">
            {ALL_SKILLS.map((skill) => {
              const selected = selectedSkills.includes(skill);
              const full = !selected && selectedSkills.length >= contract.skillChoiceCount;
              return (
                <article className={`builder-choice-card ${selected ? "selected" : ""}`} key={skill}>
                  <div className="panel-heading-row">
                    <h3>{skill}</h3>
                    <button type="button" disabled={full} onClick={() => toggleSkill(skill)}>
                      {selected ? "Kaldır" : "Seç"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {contract.originFeatChoiceCount ? (
        <label>
          Species Origin Feat
          <select
            value={draft.ancestryOriginFeatId ?? ""}
            onChange={(event) => onChange((current) => ({ ...current, ancestryOriginFeatId: event.target.value || undefined }))}
          >
            <option value="">Origin Feat seç</option>
            {originFeats.map((feat) => <option key={feat.id} value={feat.id}>{feat.name}</option>)}
          </select>
        </label>
      ) : null}

      {contract.languageChoiceCount ? (
        <label>
          Ancestry Language
          <input
            value={(draft.ancestryLanguageChoices ?? []).join(", ")}
            onChange={(event) => onChange((current) => ({
              ...current,
              ancestryLanguageChoices: unique(event.target.value.split(",").map((value) => value.trim())).slice(0, contract.languageChoiceCount),
            }))}
            placeholder={`${contract.languageChoiceCount} language`}
          />
        </label>
      ) : null}

      {contract.spellChoice ? (
        <label>
          {contract.spellChoice.label}
          <select
            value={draft.ancestrySpellIds?.[0] ?? ""}
            onChange={(event) => onChange((current) => ({
              ...current,
              ancestrySpellIds: event.target.value ? [event.target.value] : [],
            }))}
          >
            <option value="">Cantrip seç</option>
            {wizardCantrips.map((spell) => <option key={spell.id} value={spell.id}>{spell.name}</option>)}
          </select>
        </label>
      ) : null}

      {contract.notices.length ? <ul>{contract.notices.map((notice) => <li key={notice}>{notice}</li>)}</ul> : null}
    </section>
  );
}
