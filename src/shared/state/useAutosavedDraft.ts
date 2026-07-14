import { useEffect, useRef, useState } from "react";
import { readJsonSafely, writeJsonSafely } from "../../core/storage/safeStorage";

type AutosavedEnvelope<T> = {
  version: 1;
  updatedAt: string;
  value: T;
};

type AutosavedDraftOptions<T> = {
  isMeaningful?: (value: T) => boolean;
  delay?: number;
};

export function useAutosavedDraft<T>(
  storageKey: string,
  initialValue: T | (() => T),
  options: AutosavedDraftOptions<T> = {},
) {
  const initialRef = useRef<T | null>(null);
  if (initialRef.current === null) {
    initialRef.current =
      typeof initialValue === "function"
        ? (initialValue as () => T)()
        : initialValue;
  }

  const fallbackEnvelope: AutosavedEnvelope<T> = {
    version: 1,
    updatedAt: "",
    value: initialRef.current,
  };
  const storedEnvelope = readJsonSafely<AutosavedEnvelope<T>>(
    storageKey,
    fallbackEnvelope,
  );
  const restoredAtRef = useRef(storedEnvelope.updatedAt);
  const [value, setValue] = useState<T>(storedEnvelope.value);
  const [lastSavedAt, setLastSavedAt] = useState(storedEnvelope.updatedAt);
  const isMeaningfulRef = useRef(options.isMeaningful);
  isMeaningfulRef.current = options.isMeaningful;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const isMeaningful = isMeaningfulRef.current?.(value) ?? true;

      if (!isMeaningful) {
        try {
          localStorage.removeItem(storageKey);
        } catch {
          // Storage unavailable. The form remains usable in memory.
        }
        setLastSavedAt("");
        return;
      }

      const updatedAt = new Date().toISOString();
      const saved = writeJsonSafely<AutosavedEnvelope<T>>(storageKey, {
        version: 1,
        updatedAt,
        value,
      });
      if (saved) setLastSavedAt(updatedAt);
    }, options.delay ?? 600);

    return () => window.clearTimeout(timer);
  }, [storageKey, value, options.delay]);

  function clearDraft(nextValue?: T) {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore unavailable storage.
    }
    restoredAtRef.current = "";
    setLastSavedAt("");
    setValue(nextValue ?? initialRef.current!);
  }

  return {
    value,
    setValue,
    clearDraft,
    lastSavedAt,
    restoredAt: restoredAtRef.current,
    hasRestoredDraft: Boolean(restoredAtRef.current),
  };
}
