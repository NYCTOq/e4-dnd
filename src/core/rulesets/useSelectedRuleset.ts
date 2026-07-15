import { useEffect, useState } from "react";
import type { RulesetId } from "../character/character.types";
import type { RulesetData } from "./ruleset.types";
import { loadRuleset } from "./rulesetLoader";

export function useSelectedRuleset(id: RulesetId, fallback: RulesetData | null) {
  const [data, setData] = useState<RulesetData | null>(() => fallback?.id === id ? fallback : null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fallback?.id === id) {
      setData(fallback); setLoading(false); setError(null); return;
    }
    let active = true;
    setLoading(true); setError(null);
    loadRuleset(id).then((value) => { if (active) setData(value); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Ruleset data yüklenemedi."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fallback, id]);

  return { data, loading, error };
}
