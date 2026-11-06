import { PRESERVED_STORAGE_KEYS, APP_VERSION, STORAGE_KEYS } from '../../config/constants';
import { runWhenIdle } from '../../utils/idle';
import { formatMessage } from '../i18n/formatMessage';
import { getCurrentLanguage } from '../i18n/languageDetector';
import { getTranslations } from '../i18n/translations';
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
 * Remove every Studorama key that is not in PRESERVED_STORAGE_KEYS. Runs
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
 * Show a notification about version migration (optimized)
 */
function showMigrationNotification(oldVersion: string, newVersion: string): void {
  try {
    const t = getTranslations(getCurrentLanguage());
    const title = t.appUpdated;
    const versionText = formatMessage(t.versionUpdated, { oldVersion, newVersion });
    const dataText = t.dataRefreshed;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      padding: 20px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      max-width: 400px;
      animation: slideInFromRight 0.4s ease-out;
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    // Add animation styles if not already present
    if (!document.querySelector('#migration-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'migration-notification-styles';
      style.textContent = `
        @keyframes slideInFromRight {
          from { 
            transform: translateX(100%); 
            opacity: 0; 
          }
          to { 
            transform: translateX(0); 
            opacity: 1; 
          }
        }
        @keyframes slideOutToRight {
          from { 
            transform: translateX(0); 
            opacity: 1; 
          }
          to { 
            transform: translateX(100%); 
            opacity: 0; 
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `;
      document.head.appendChild(style);
    }
    
    notification.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="
          width: 24px; 
          height: 24px; 
          background: rgba(255,255,255,0.2); 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          flex-shrink: 0;
          animation: pulse 2s infinite;
        ">
          🚀
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px; font-size: 15px;">
            ${title}
          </div>
          <div style="opacity: 0.95; font-size: 13px; line-height: 1.4; margin-bottom: 8px;">
            ${versionText}
          </div>
          <div style="opacity: 0.9; font-size: 12px; line-height: 1.3;">
            ${dataText}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove notification after 8 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutToRight 0.4s ease-in forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 400);
    }, 8000);
    
    // Allow manual dismissal by clicking
    notification.addEventListener('click', () => {
      notification.style.animation = 'slideOutToRight 0.4s ease-in forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 400);
    });
    
  } catch (error) {
    console.error('Error showing migration notification:', error);
  }
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