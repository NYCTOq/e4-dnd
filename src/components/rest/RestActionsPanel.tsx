import { useMemo, useState } from "react";
import {
  performCharacterLongRest,
  performCharacterShortRest,
  type RestCompatibleCharacter,
} from "../../core/rulesets/restRecoveryCharacterAdapter";

export type RestActionsPanelProps<T extends RestCompatibleCharacter> = {
  character: T;
  onCharacterChange: (character: T) => void;
  compact?: boolean;
  disabled?: boolean;
};

function summaryText(
  summary: ReturnType<typeof performCharacterShortRest>["summary"],
): string {
  const parts: string[] = [];

  if (summary.hpRecovered > 0) {
    parts.push(`${summary.hpRecovered} HP`);
  }
  if (summary.hitDiceRecovered > 0) {
    parts.push(`${summary.hitDiceRecovered} Hit Die`);
  }
  if (summary.spellSlotsRecovered > 0) {
    parts.push(`${summary.spellSlotsRecovered} spell slot`);
  }
  if (summary.exhaustionRemoved > 0) {
    parts.push(`${summary.exhaustionRemoved} exhaustion`);
  }
  if (summary.effectsRemoved.length > 0) {
    parts.push(`${summary.effectsRemoved.length} effect`);
  }

  return parts.length > 0
    ? parts.join(", ")
    : "Yenilenecek bir kaynak bulunamadı.";
}

export function RestActionsPanel<T extends RestCompatibleCharacter>({
  character,
  onCharacterChange,
  compact = false,
  disabled = false,
}: RestActionsPanelProps<T>) {
  const [message, setMessage] = useState("");

  const label = useMemo(
    () => String(character.name ?? "Karakter"),
    [character.name],
  );

  const rest = (kind: "short" | "long") => {
    const result =
      kind === "short"
        ? performCharacterShortRest(character)
        : performCharacterLongRest(character);

    onCharacterChange(result.character as T);
    setMessage(
      `${kind === "short" ? "Kısa" : "Uzun"} dinlenme: ${summaryText(
        result.summary,
      )}`,
    );
  };

  return (
    <section
      className={`rest-actions-panel${compact ? " is-compact" : ""}`}
      data-testid="rest-actions-panel"
      aria-label={`${label} dinlenme işlemleri`}
    >
      <div className="rest-actions-panel__header">
        <h2>Dinlenme</h2>
        <p>Can, zarlar, büyü yuvaları ve sınıf kaynaklarını yenile.</p>
      </div>

      <div className="rest-actions-panel__buttons">
        <button
          type="button"
          onClick={() => rest("short")}
          disabled={disabled}
          data-testid="rest-short-button"
        >
          Kısa Dinlenme
        </button>

        <button
          type="button"
          onClick={() => rest("long")}
          disabled={disabled}
          data-testid="rest-long-button"
        >
          Uzun Dinlenme
        </button>
      </div>

      <output
        className="rest-actions-panel__result"
        data-testid="rest-result"
        aria-live="polite"
      >
        {message}
      </output>
    </section>
  );
}

export default RestActionsPanel;
