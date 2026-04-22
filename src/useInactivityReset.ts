import { useCallback, useEffect, useRef } from 'react';

/**
 * Automatically calls onReset after the configured inactivity duration.
 * Only active while focusTime is set. Restarts the countdown on every
 * focusTime change (each drag frame, wheel tick, date navigation).
 *
 * Returns reportActivity for interactions that don't change focusTime
 * (adding/removing timezones).
 *
 * autoReset is in seconds; 0 = never.
 * autoReset in the focusTime effect deps is intentional: changing the setting
 * while the timer is running cancels it and restarts with the new duration.
 */
export function useInactivityReset(
  focusTime: number | null,
  autoReset: number,
  onReset: () => void,
): () => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onResetRef = useRef(onReset);
  const autoResetRef = useRef(autoReset);
  const isDirtyRef = useRef(focusTime != null);

  useEffect(() => { onResetRef.current = onReset; }, [onReset]);
  useEffect(() => { autoResetRef.current = autoReset; }, [autoReset]);

  const reportActivity = useCallback(() => {
    if (!isDirtyRef.current) return;
    if (timerRef.current != null) clearTimeout(timerRef.current);
    if (autoResetRef.current === 0) return;
    timerRef.current = setTimeout(() => {
      onResetRef.current();
    }, autoResetRef.current * 1000);
  }, []);

  useEffect(() => {
    isDirtyRef.current = focusTime != null;

    if (focusTime == null) {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    reportActivity();

    return () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [focusTime, autoReset, reportActivity]);

  return reportActivity;
}
