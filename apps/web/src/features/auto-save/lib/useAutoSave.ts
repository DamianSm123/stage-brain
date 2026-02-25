import { useCallback, useEffect, useRef } from "react";

interface UseAutoSaveOptions {
  isDirty: boolean;
  save: () => Promise<void>;
  debounceMs?: number;
}

export function useAutoSave({ isDirty, save, debounceMs = 2000 }: UseAutoSaveOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  const isDirtyRef = useRef(isDirty);

  saveRef.current = save;
  isDirtyRef.current = isDirty;

  const cancelPending = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const triggerSave = useCallback(async () => {
    cancelPending();
    if (isDirtyRef.current) {
      await saveRef.current();
    }
  }, [cancelPending]);

  // Debounced auto-save: restart timer on every dirty change
  useEffect(() => {
    if (!isDirty) {
      cancelPending();
      return;
    }

    timerRef.current = setTimeout(() => {
      saveRef.current();
    }, debounceMs);

    return () => {
      cancelPending();
    };
  }, [isDirty, debounceMs, cancelPending]);

  // Save on unmount (leaving editor)
  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        saveRef.current();
      }
    };
  }, []);

  return { triggerSave };
}
