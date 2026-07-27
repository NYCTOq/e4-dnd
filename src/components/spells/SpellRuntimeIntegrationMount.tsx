import { useEffect, useMemo, useState } from "react";
import SpellCastingRuntimePanel from "./SpellCastingRuntimePanel";
import {
  discoverCombatStorageKey,
  discoverSpellStorageKey,
  mutateTargetInCollection,
  parseCombatTargetCollection,
  parseSpellCharacterCollection,
  serializeSpellCollection,
  type CombatTargetCollection,
  type SpellCharacterCollection,
} from "../../core/rulesets/spellCastingPersistenceBridge";
import type { SpellCompatibleCharacter } from "../../core/rulesets/spellCharacterCombatAdapter";

function casterList(
  collection: SpellCharacterCollection,
): SpellCompatibleCharacter[] {
  return Array.isArray(collection)
    ? collection
    : collection.characters;
}

function replaceCaster(
  collection: SpellCharacterCollection,
  character: SpellCompatibleCharacter,
): SpellCharacterCollection {
  const characters = casterList(collection).map((entry) =>
    String(entry.id ?? "") === String(character.id ?? "")
      ? character
      : entry,
  );

  return Array.isArray(collection)
    ? characters
    : { ...collection, characters };
}

function targetList(
  collection: CombatTargetCollection,
): SpellCompatibleCharacter[] {
  return Array.isArray(collection)
    ? collection
    : collection.combatants;
}

function routeAllowsSpellRuntime(pathname: string): boolean {
  const value = pathname.toLowerCase();

  return (
    value.includes("spell") ||
    value.includes("buyu") ||
    value.includes("büyü") ||
    value.includes("play") ||
    value.includes("oyna") ||
    value.includes("combat") ||
    value.includes("savas") ||
    value.includes("savaş")
  );
}

function routeEntityId(pathname: string): string | null {
  const ignored = new Set([
    "spellbook",
    "spells",
    "buyuler",
    "büyüler",
    "play",
    "play-mode",
    "playmode",
    "oyna",
    "combat",
    "combat-tracker",
    "combattracker",
    "savas",
    "savaş",
  ]);

  const parts = pathname
    .split("/")
    .map((part) => decodeURIComponent(part.trim()))
    .filter(Boolean);

  for (let index = parts.length - 1; index >= 0; index -= 1) {
    if (!ignored.has(parts[index].toLowerCase())) {
      return parts[index];
    }
  }

  return null;
}

export function SpellRuntimeIntegrationMount() {
  const [casterStorageKey, setCasterStorageKey] =
    useState<string | null>(null);
  const [combatStorageKey, setCombatStorageKey] =
    useState<string | null>(null);
  const [casters, setCasters] =
    useState<SpellCharacterCollection | null>(null);
  const [targets, setTargets] =
    useState<CombatTargetCollection | null>(null);
  const [selectedTargetId, setSelectedTargetId] =
    useState("");
  const [amount, setAmount] = useState(1);

  const visible =
    typeof window !== "undefined" &&
    routeAllowsSpellRuntime(window.location.pathname);

  useEffect(() => {
    if (!visible) return;

    const casterKey = discoverSpellStorageKey(
      window.localStorage,
    );

    if (casterKey) {
      const parsed = parseSpellCharacterCollection(
        window.localStorage.getItem(casterKey),
      );

      if (parsed) {
        setCasterStorageKey(casterKey);
        setCasters(parsed);
      }
    }

    const targetKey = discoverCombatStorageKey(
      window.localStorage,
    );

    if (targetKey) {
      const parsed = parseCombatTargetCollection(
        window.localStorage.getItem(targetKey),
      );

      if (parsed) {
        setCombatStorageKey(targetKey);
        setTargets(parsed);

        const firstTarget = targetList(parsed)[0];
        if (firstTarget) {
          setSelectedTargetId(
            String(firstTarget.id ?? ""),
          );
        }
      }
    }
  }, [visible]);

  const selectedCaster = useMemo(() => {
    if (!casters) return null;

    const list = casterList(casters);
    const routeId =
      typeof window !== "undefined"
        ? routeEntityId(window.location.pathname)
        : null;

    return (
      list.find(
        (character) =>
          routeId &&
          String(character.id ?? "") === routeId,
      ) ??
      list[0] ??
      null
    );
  }, [casters]);

  if (
    !visible ||
    !casterStorageKey ||
    !casters ||
    !selectedCaster
  ) {
    return null;
  }

  const availableTargets = targets
    ? targetList(targets)
    : [];

  const mutateTarget = (
    type: "damage" | "healing",
  ) => {
    if (
      !targets ||
      !combatStorageKey ||
      !selectedTargetId
    ) {
      return;
    }

    const next = mutateTargetInCollection(
      targets,
      selectedTargetId,
      {
        type,
        amount,
      },
    );

    window.localStorage.setItem(
      combatStorageKey,
      serializeSpellCollection(next),
    );
    setTargets(next);
  };

  return (
    <aside
      className="spell-runtime-integration-mount"
      data-testid="spell-runtime-integration"
    >
      <SpellCastingRuntimePanel
        character={selectedCaster}
        compact
        onCharacterChange={(character) => {
          const next = replaceCaster(
            casters,
            character,
          );

          window.localStorage.setItem(
            casterStorageKey,
            serializeSpellCollection(next),
          );
          setCasters(next);
        }}
      />

      {availableTargets.length > 0 && (
        <section
          className="spell-runtime-target-controls"
          data-testid="spell-runtime-target-controls"
        >
          <h3>Combat Hedefi</h3>

          <label>
            Hedef
            <select
              value={selectedTargetId}
              onChange={(event) =>
                setSelectedTargetId(event.target.value)
              }
              data-testid="spell-runtime-target-select"
            >
              {availableTargets.map((target) => (
                <option
                  key={String(target.id ?? "")}
                  value={String(target.id ?? "")}
                >
                  {String(
                    target.name ??
                    target.id ??
                    "Hedef",
                  )}
                  {" "}
                  ({String(target.currentHp ?? 0)}/
                  {String(target.maxHp ?? 0)})
                </option>
              ))}
            </select>
          </label>

          <label>
            Miktar
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(event) =>
                setAmount(
                  Math.max(
                    0,
                    Number(event.target.value) || 0,
                  ),
                )
              }
              data-testid="spell-runtime-target-amount"
            />
          </label>

          <button
            type="button"
            onClick={() => mutateTarget("damage")}
            data-testid="spell-runtime-apply-damage"
          >
            Hasar Uygula
          </button>

          <button
            type="button"
            onClick={() => mutateTarget("healing")}
            data-testid="spell-runtime-apply-healing"
          >
            İyileştir
          </button>
        </section>
      )}
    </aside>
  );
}

export default SpellRuntimeIntegrationMount;
