import { useMemo, useState } from "react";
import {
  applyCharacterLevelUp,
  type AbilityKey,
  type LevelUpCompatibleCharacter,
} from "../../core/rulesets/levelUpCharacterAdapter";
import {
  runtimeAsiLevel,
  runtimeBuildMilestone,
} from "../../core/rulesets/levelUpProgressionRules";

const abilities: AbilityKey[] = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

const abilityLabels: Record<AbilityKey, string> = {
  strength: "STR",
  dexterity: "DEX",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "WIS",
  charisma: "CHA",
};

export type LevelUpRuntimePanelProps<
  T extends LevelUpCompatibleCharacter,
> = {
  character: T;
  onCharacterChange: (character: T) => void;
  featOptions?: Array<{
    id: string;
    name?: string;
  }>;
};

export function LevelUpRuntimePanel<
  T extends LevelUpCompatibleCharacter,
>({
  character,
  onCharacterChange,
  featOptions = [],
}: LevelUpRuntimePanelProps<T>) {
  const classes = useMemo(
    () => (Array.isArray(character.classes) ? character.classes : []),
    [character.classes],
  );

  const [classId, setClassId] = useState(
    classes[0]?.classId ?? "",
  );
  const [mode, setMode] = useState<"asi" | "feat">("asi");
  const [firstAbility, setFirstAbility] =
    useState<AbilityKey>("strength");
  const [secondAbility, setSecondAbility] =
    useState<AbilityKey>("strength");
  const [featId, setFeatId] = useState(
    featOptions[0]?.id ?? "",
  );

  const selectedClass = useMemo(
    () =>
      classes.find(
        (entry) => entry.classId === classId,
      ) ?? null,
    [classes, classId],
  );

  const currentLevel = Number(
    character.level ?? 1,
  );

  const nextClassLevel =
    (selectedClass?.classLevel ?? 0) + 1;

  const milestone = selectedClass
    ? runtimeBuildMilestone(
        selectedClass.classId,
        character.ruleset === "dnd_2024"
          ? "dnd_2024"
          : "dnd_2014",
        selectedClass.classLevel,
        nextClassLevel,
      )
    : null;

  const grantsAsi =
    selectedClass &&
    runtimeAsiLevel(
      selectedClass.classId,
      nextClassLevel,
    );

  const canApply =
    Boolean(selectedClass) &&
    currentLevel < 20 &&
    (!grantsAsi ||
      mode === "asi" ||
      (mode === "feat" && featId.trim()));

  const handleLevelUp = () => {
    if (!selectedClass) return;

    const next = applyCharacterLevelUp(
      character,
      {
        classId: selectedClass.classId,
        selectedFeatId:
          grantsAsi && mode === "feat"
            ? featId.trim()
            : undefined,
        abilityIncreases:
          grantsAsi && mode === "asi"
            ? firstAbility === secondAbility
              ? { [firstAbility]: 2 }
              : {
                  [firstAbility]: 1,
                  [secondAbility]: 1,
                }
            : undefined,
      },
    );

    onCharacterChange(next as T);
  };

  return (
    <section
      className="level-up-runtime-panel"
      data-testid="level-up-runtime-panel"
    >
      <header>
        <h2>Seviye Atlama</h2>
        <p data-testid="level-up-current-level">
          Mevcut seviye: {currentLevel}
        </p>
      </header>

      <label>
        Sınıf
        <select
          value={classId}
          onChange={(event) =>
            setClassId(event.target.value)
          }
          data-testid="level-up-class-select"
        >
          {classes.map((entry) => (
            <option
              key={entry.classId}
              value={entry.classId}
            >
              {entry.classId} {entry.classLevel}
            </option>
          ))}
        </select>
      </label>

      {milestone && (
        <div
          className="level-up-runtime-panel__summary"
          data-testid="level-up-milestone-summary"
        >
          <span>Yeni seviye: {milestone.level}</span>
          <span>PB: +{milestone.proficiencyBonus}</span>
          <span>
            Cantrip tier: {milestone.cantripTier}
          </span>
          <span>
            Spell tier: {milestone.spellTier}
          </span>
          {milestone.grantsSubclass && (
            <strong>Subclass seçimi açılır</strong>
          )}
          {milestone.grantsAsi && (
            <strong>ASI veya feat seçimi açılır</strong>
          )}
        </div>
      )}

      {grantsAsi && (
        <section
          className="level-up-runtime-panel__choice"
          data-testid="level-up-asi-feat-choice"
        >
          <label>
            <input
              type="radio"
              checked={mode === "asi"}
              onChange={() => setMode("asi")}
            />
            Ability artışı
          </label>

          <label>
            <input
              type="radio"
              checked={mode === "feat"}
              onChange={() => setMode("feat")}
            />
            Feat
          </label>

          {mode === "asi" ? (
            <div>
              <select
                value={firstAbility}
                onChange={(event) =>
                  setFirstAbility(
                    event.target.value as AbilityKey,
                  )
                }
                data-testid="level-up-first-ability"
              >
                {abilities.map((ability) => (
                  <option
                    key={ability}
                    value={ability}
                  >
                    {abilityLabels[ability]}
                  </option>
                ))}
              </select>

              <select
                value={secondAbility}
                onChange={(event) =>
                  setSecondAbility(
                    event.target.value as AbilityKey,
                  )
                }
                data-testid="level-up-second-ability"
              >
                {abilities.map((ability) => (
                  <option
                    key={ability}
                    value={ability}
                  >
                    {abilityLabels[ability]}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <select
              value={featId}
              onChange={(event) =>
                setFeatId(event.target.value)
              }
              data-testid="level-up-feat-select"
            >
              <option value="">Feat seç</option>
              {featOptions.map((feat) => (
                <option
                  key={feat.id}
                  value={feat.id}
                >
                  {feat.name ?? feat.id}
                </option>
              ))}
            </select>
          )}
        </section>
      )}

      {character.pendingSubclassChoice && (
        <p
          className="level-up-runtime-panel__warning"
          data-testid="level-up-subclass-warning"
        >
          Subclass seçimi bekleniyor.
        </p>
      )}

      <button
        type="button"
        disabled={!canApply}
        onClick={handleLevelUp}
        data-testid="level-up-apply"
      >
        Seviye Atla
      </button>
    </section>
  );
}

export default LevelUpRuntimePanel;
