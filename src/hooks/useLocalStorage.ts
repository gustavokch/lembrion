import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getCurrentLanguage, getTranslations, localStorage, showNotification } from "../core/services";

// Minimum gap between two "could not save" notifications, so a full storage
// does not raise one toast per keystroke.
const WRITE_FAILURE_NOTICE_INTERVAL_MS = 10000;
let lastWriteFailureNoticeAt = -Infinity;

/**
 * Tell the user that a value could not be persisted (e.g. storage quota exceeded).
 * Uses the stored language directly: this hook cannot import useLanguage, which depends on it.
 */
function notifyWriteFailure(): void {
  const now = Date.now();
  if (now - lastWriteFailureNoticeAt < WRITE_FAILURE_NOTICE_INTERVAL_MS) return;
  lastWriteFailureNoticeAt = now;

  const t = getTranslations(getCurrentLanguage());
  showNotification({
    type: "error",
    title: t.storageWriteFailed,
    message: t.storageWriteFailedDesc,
    duration: 8000,
  });
}

/**
 * Custom hook for using localStorage with React state.
 * setValue persists synchronously, so code that navigates or reloads right after
 * a set (and components that mount afterwards) see the new value.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Use ref to track if we're initializing to prevent unnecessary re-renders
  const isInitializing = useRef(true);
  const lastValueRef = useRef<T>(initialValue);

  // Get stored value or initialize with provided default
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem<T>(key, initialValue);
      lastValueRef.current = item;
      return item;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    } finally {
      isInitializing.current = false;
    }
  });

  // Function to update both state and localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function for previous state pattern
        const valueToStore = value instanceof Function ? value(lastValueRef.current) : value;

        // Only update if value actually changed (deep comparison for objects)
        if (JSON.stringify(lastValueRef.current) === JSON.stringify(valueToStore)) {
          return;
        }

        lastValueRef.current = valueToStore;
        setStoredValue(valueToStore);

        if (!localStorage.setItem(key, valueToStore)) {
          notifyWriteFailure();
        }
      } catch (error) {
        console.error(`Error processing localStorage update for key "${key}":`, error);
      }
    },
    [key]
  );

  // Sync with localStorage changes from other tabs/windows
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          // Only update if different from current value
          if (JSON.stringify(lastValueRef.current) !== JSON.stringify(newValue)) {
            lastValueRef.current = newValue;
            setStoredValue(newValue);
          }
        } catch (error) {
          console.error(`Error parsing localStorage change for key "${key}":`, error);
        }
      }
    }

    // Only add listener after initial load to avoid unnecessary work
    if (!isInitializing.current) {
      window.addEventListener("storage", handleStorageChange);
      return () => {
        window.removeEventListener("storage", handleStorageChange);
      };
    }
  }, [key]);

  return useMemo(() => [storedValue, setValue] as const, [storedValue, setValue]);
}
