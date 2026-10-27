import { InjectionToken } from '@angular/core';

/** The subset of Web Storage the app uses. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** In-memory storage: used in tests and when the browser blocks localStorage. */
export function memoryStorage(): KeyValueStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  };
}

/**
 * localStorage that never throws: private mode, a full quota or a blocked
 * storage must not break ordering. The cart just stops surviving reloads.
 */
function safeLocalStorage(): KeyValueStorage {
  try {
    const storage = globalThis.localStorage;
    storage.getItem('buffetya.probe');
    return {
      getItem: (key) => {
        try {
          return storage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          storage.setItem(key, value);
        } catch {
          // Quota or privacy mode: keep working in memory only.
        }
      },
      removeItem: (key) => {
        try {
          storage.removeItem(key);
        } catch {
          // Same as above.
        }
      },
    };
  } catch {
    return memoryStorage();
  }
}

export const APP_STORAGE = new InjectionToken<KeyValueStorage>('AppStorage', {
  providedIn: 'root',
  factory: safeLocalStorage,
});

/** Reads and validates a JSON value; anything unexpected reads as undefined. */
export function readJson<T>(
  storage: KeyValueStorage,
  key: string,
  isValid: (value: unknown) => value is T,
): T | undefined {
  const raw = storage.getItem(key);
  if (raw === null) return undefined;
  try {
    const value: unknown = JSON.parse(raw);
    return isValid(value) ? value : undefined;
  } catch {
    return undefined;
  }
}
