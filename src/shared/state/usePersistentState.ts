import { useEffect, useState } from "react";
import { readJsonSafely, writeJsonSafely } from "../../core/storage/safeStorage";

export function usePersistentState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() =>
    readJsonSafely<T>(key, defaultValue),
  );

  useEffect(() => {
    writeJsonSafely(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}
