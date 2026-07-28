import { useMemo, useState } from "react";
import {
  applyClassFeatureRest,
  buildClassRuntimeSnapshot,
  type ClassCompatibleCharacter,
} from "../../core/rulesets/classSubclassCharacterAdapter";
import {
  mutateCharacterFeature,
} from "../../core/rulesets/classFeaturePersistenceBridge";
import type { RuntimeFeature } from "../../core/rulesets/classSubclassRuntimeRules";

export type ClassFeaturePanelProps<T extends ClassCompatibleCharacter> = {
  character: T;
  onCharacterChange: (character: T) => void;
  compact?: boolean;
};

const labels: Record<RuntimeFeature["activation"], string> = {
  action: "Aksiyon",
  "bonus-action": "Bonus Aksiyon",
  reaction: "Tepki",
  passive: "Pasif",
  special: "Özel",
};

export function ClassFeaturePanel<T extends ClassCompatibleCharacter>({
  character,
  onCharacterChange,
  compact = false,
}: ClassFeaturePanelProps<T>) {
  const [restFeedback, setRestFeedback] = useState("");

  const snapshot = useMemo(
    () => buildClassRuntimeSnapshot(character),
    [character],
  );

  const grouped = useMemo(() => {
    const result = new Map<string, RuntimeFeature[]>();

    for (const feature of snapshot.unlockedFeatures) {
      const key = labels[feature.activation];
      result.set(key, [...(result.get(key) ?? []), feature]);
    }

    return result;
  }, [snapshot.unlockedFeatures]);

  const mutate = (featureId: string, mode: "spend" | "restore") => {
    onCharacterChange(
      mutateCharacterFeature(character, featureId, mode) as T,
    );
    setRestFeedback(mode === "spend" ? "Sınıf özelliği kullanıldı." : "Sınıf özelliği yenilendi.");
  };

  const recoverByRest = (rest: "short" | "long") => {
    const before = snapshot.unlockedFeatures.reduce(
      (sum, feature) => sum + (feature.currentUses ?? 0),
      0,
    );
    const next = applyClassFeatureRest(character, rest) as T;
    const after = buildClassRuntimeSnapshot(next).unlockedFeatures.reduce(
      (sum, feature) => sum + (feature.currentUses ?? 0),
      0,
    );
    onCharacterChange(next);
    const restored = Math.max(0, after - before);
    const restLabel = rest === "short" ? "Kısa" : "Uzun";
    setRestFeedback(
      restored > 0
        ? restLabel + " dinlenme: " + restored + " kullanım yenilendi."
        : restLabel + " dinlenmede yenilenecek kullanım yok.",
    );
  };

  return (
    <section
      className={`class-feature-panel${compact ? " is-compact" : ""}`}
      data-testid="class-feature-panel"
    >
      <header className="class-feature-panel__header">
        <h2>Sınıf Özellikleri</h2>
        <p>
          Seviye {snapshot.characterLevel} · PB +{snapshot.proficiencyBonus}
        </p>
      </header>

      <div className="class-feature-panel__rest-controls" aria-label="Sınıf özelliği dinlenme yenilemeleri">
        <button
          type="button"
          onClick={() => recoverByRest("short")}
          data-testid="class-feature-short-rest"
        >
          Kısa Dinlenme
        </button>
        <button
          type="button"
          onClick={() => recoverByRest("long")}
          data-testid="class-feature-long-rest"
        >
          Uzun Dinlenme
        </button>
      </div>

      <p
        className="class-feature-panel__feedback"
        role="status"
        aria-live="polite"
        data-testid="class-feature-feedback"
      >
        {restFeedback}
      </p>

      {snapshot.unlockedFeatures.length === 0 ? (
        <p data-testid="class-feature-empty">
          Açılmış sınıf özelliği bulunamadı.
        </p>
      ) : (
        [...grouped.entries()].map(([group, features]) => (
          <section
            key={group}
            className="class-feature-panel__group"
            aria-label={group}
          >
            <h3>{group}</h3>

            <div className="class-feature-panel__list">
              {features.map((feature) => {
                const currentUses =
                  typeof feature.currentUses === "number"
                    ? feature.currentUses
                    : null;
                const maxUses =
                  typeof feature.maxUses === "number"
                    ? feature.maxUses
                    : null;
                const hasUses =
                  currentUses !== null && maxUses !== null;

                return (
                  <article
                    key={feature.id}
                    className="class-feature-card"
                    data-testid={`class-feature-${feature.id}`}
                  >
                    <div>
                      <strong>{feature.id}</strong>
                      <small>
                        {feature.classId}
                        {feature.subclassId
                          ? ` · ${feature.subclassId}`
                          : ""}
                        {" · "}Seviye {feature.level}
                      </small>
                    </div>

                    {hasUses && (
                      <div className="class-feature-card__uses">
                        <span
                          data-testid={`class-feature-uses-${feature.id}`}
                        >
                          {currentUses}/{maxUses}
                        </span>

                        <button
                          type="button"
                          onClick={() => mutate(feature.id, "spend")}
                          disabled={currentUses === null || currentUses <= 0}
                          data-testid={`class-feature-spend-${feature.id}`}
                        >
                          Harca
                        </button>

                        <button
                          type="button"
                          onClick={() => mutate(feature.id, "restore")}
                          disabled={
                            currentUses === null ||
                            maxUses === null ||
                            currentUses >= maxUses
                          }
                          data-testid={`class-feature-restore-${feature.id}`}
                        >
                          Yenile
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </section>
  );
}

export default ClassFeaturePanel;
