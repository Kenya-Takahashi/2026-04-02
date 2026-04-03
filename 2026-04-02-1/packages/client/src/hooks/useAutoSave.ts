import { useRef, useEffect, useCallback, useState } from "react";

export function useAutoSave<T>(
  saveFn: (value: T) => Promise<unknown>,
  delay = 800
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = useCallback(
    (value: T) => {
      setSaved(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          await saveFn(value);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } finally {
          setSaving(false);
        }
      }, delay);
    },
    [saveFn, delay]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { save, saving, saved };
}
