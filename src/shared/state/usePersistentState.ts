import { useState } from "react";
import { readJsonSafely, writeJsonSafely } from "../../core/storage/safeStorage";
import { useDebouncedEffect } from "./useDebouncedEffect";

export function usePersistentState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() =>
    readJsonSafely<T>(key, defaultValue),
  );

  useDebouncedEffect(
    value,
    (nextValue) => writeJsonSafely(key, nextValue),
    300,
    { skipInitial: true },
  );

  return [value, setValue] as const;
}

