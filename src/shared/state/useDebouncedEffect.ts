import { useEffect, useRef } from "react";

export function useDebouncedEffect<T>(
  value: T,
  effect: (value: T) => void,
  delay = 350,
  options: { skipInitial?: boolean } = {},
) {
  const effectRef = useRef(effect);
  const latestValueRef = useRef(value);
  const timerRef = useRef<number | null>(null);
  const pendingRef = useRef(false);
  const initialRef = useRef(true);

  effectRef.current = effect;
  latestValueRef.current = value;

  useEffect(() => {
    if (initialRef.current) {
      initialRef.current = false;
      if (options.skipInitial) return;
    }

    pendingRef.current = true;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(() => {
      pendingRef.current = false;
      timerRef.current = null;
      effectRef.current(latestValueRef.current);
    }, delay);

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [delay, options.skipInitial, value]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      if (pendingRef.current) effectRef.current(latestValueRef.current);
    };
  }, []);
}
