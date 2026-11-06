import { PRESERVED_STORAGE_KEYS, APP_VERSION, STORAGE_KEYS } from '../../config/constants';
import { runWhenIdle } from '../../utils/idle';
import { formatMessage } from '../i18n/formatMessage';
import { getCurrentLanguage } from '../i18n/languageDetector';
import { getTranslations } from '../i18n/translations';
import { showNotification } from '../notification/notificationService';
import * as localStorage from '../storage/localStorage';

/**
 * Get the stored application version
 */
export function getStoredVersion(): string | null {
  return localStorage.getItem<string | null>(STORAGE_KEYS.VERSION, null);
}

/**
 * Set the current application version in storage
 */
export function setStoredVersion(version: string): void {
  localStorage.setItem(STORAGE_KEYS.VERSION, version);
}

/**
 * Check if the current version differs from the stored version
 */
export function isVersionChanged(): boolean {
  const storedVersion = getStoredVersion();
  return storedVersion !== null && storedVersion !== APP_VERSION;
}

/**
 * Check if this is a fresh installation (no stored version)
 */
export function isFreshInstallation(): boolean {
  return getStoredVersion() === null;
}

/**
 * Remove every app key (prefix `studorama-`) that is not in PRESERVED_STORAGE_KEYS. Runs
 * synchronously so it cannot delete keys written after the migration started.
 */
export function clearStorageExceptPreserved(): void {
  const removable = localStorage
    .getAllKeys()
    .filter(key => key.startsWith(localStorage.APP_KEY_PREFIX) && !PRESERVED_STORAGE_KEYS.includes(key));

  removable.forEach(key => localStorage.removeItem(key));

  console.log(`Cleared ${removable.length} localStorage items due to version change`);
}

/**
 * Handle version migration.
 * Returns true if migration was performed, false otherwise
 */
export function handleVersionMigration(): boolean {
  const storedVersion = getStoredVersion();
  
  // Fresh installation - just set the current version
  if (isFreshInstallation()) {
    setStoredVersion(APP_VERSION);
    console.log(`Fresh installation detected. Set version to ${APP_VERSION}`);
    return false;
  }
  
  // Version changed - perform migration
  if (isVersionChanged()) {
    console.log(`Version change detected: ${storedVersion} → ${APP_VERSION}`);
    clearStorageExceptPreserved();
    setStoredVersion(APP_VERSION);

    runWhenIdle(() => {
      showMigrationNotification(storedVersion!, APP_VERSION);
    });
    
    return true;
  }
  
  // No version change
  return false;
}

/**
 * Tell the user the app was updated and cached data was refreshed.
 */
function showMigrationNotification(oldVersion: string, newVersion: string): void {
  const t = getTranslations(getCurrentLanguage());
  showNotification({
    type: 'info',
    title: t.appUpdated,
    message: `${formatMessage(t.versionUpdated, { oldVersion, newVersion })} ${t.dataRefreshed}`,
    duration: 8000,
  });
}

/**
 * Get version information for debugging
 */
export function getVersionInfo() {
  return {
    currentVersion: APP_VERSION,
    storedVersion: getStoredVersion(),
    isVersionChanged: isVersionChanged(),
    isFreshInstallation: isFreshInstallation(),
    preservedKeys: PRESERVED_STORAGE_KEYS,
  };
}