/**
 * localStorage service with error handling and type safety
 */

/** Every Studorama key starts with this prefix (see STORAGE_KEYS). */
export const APP_KEY_PREFIX = 'studorama-';

/**
 * Check if a value is corrupted (like "[object Object]")
 */
function isCorruptedValue(item: string): boolean {
  return item === '[object Object]' || 
         item === '[object Array]' || 
         item === 'undefined' || 
         item === 'null' ||
         (item.startsWith('[object ') && item.endsWith(']'));
}

/**
 * Get an item from localStorage with type safety. Reads localStorage on every call,
 * so writes from other tabs are visible immediately.
 */
export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = window.localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }

    // Check for corrupted data
    if (isCorruptedValue(item)) {
      console.warn(`Corrupted data detected for localStorage key "${key}": ${item}. Using default value.`);
      // Remove corrupted data
      window.localStorage.removeItem(key);
      return defaultValue;
    }

    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    
    // If parsing failed, try to clean up corrupted data
    try {
      const item = window.localStorage.getItem(key);
      if (item && isCorruptedValue(item)) {
        console.warn(`Removing corrupted localStorage key "${key}"`);
        window.localStorage.removeItem(key);
      }
    } catch (cleanupError) {
      console.error(`Error cleaning up corrupted localStorage key "${key}":`, cleanupError);
    }
    
    return defaultValue;
  }
}

/**
 * Set an item in localStorage. Returns false when the value was not persisted
 * (for example when the storage quota is exceeded).
 */
export function setItem<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value);
    
    // Validate that serialization worked correctly
    if (isCorruptedValue(serialized)) {
      console.error(`Attempted to store corrupted value for key "${key}": ${serialized}`);
      return false;
    }
    
    window.localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Remove an item from localStorage
 */
export function removeItem(key: string): boolean {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Remove every Studorama key (prefix `studorama-`) from localStorage.
 * Keys of other apps on the same origin are left alone.
 */
export function clearAllAppData(): void {
  for (const key of getAllKeys()) {
    if (key.startsWith(APP_KEY_PREFIX)) {
      removeItem(key);
    }
  }
}

/**
 * Get all keys in localStorage
 */
export function getAllKeys(): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    return keys;
  } catch (error) {
    console.error('Error getting localStorage keys:', error);
    return [];
  }
}

/**
 * Clean up corrupted localStorage entries
 */
export function cleanupCorruptedEntries(): number {
  let cleanedCount = 0;
  
  try {
    const keys = getAllKeys();
    
    for (const key of keys) {
      try {
        const item = window.localStorage.getItem(key);
        if (item && isCorruptedValue(item)) {
          console.warn(`Cleaning up corrupted localStorage entry: ${key}`);
          window.localStorage.removeItem(key);
          cleanedCount++;
        }
      } catch (error) {
        console.error(`Error checking localStorage key "${key}" for corruption:`, error);
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} corrupted localStorage entries`);
    }
  } catch (error) {
    console.error('Error during localStorage cleanup:', error);
  }
  
  return cleanedCount;
}