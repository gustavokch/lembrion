import { useCallback, useMemo } from 'react';
import { STORAGE_KEYS } from '../core/config/constants';
import {
  DEFAULT_MULTI_PROVIDER_SETTINGS,
  normalizeMultiProviderSettings,
} from '../core/config/providerSettings';
import { MultiProviderSettings } from '../core/types/ai.types';
import { useLocalStorage } from './useLocalStorage';

type SettingsUpdate = MultiProviderSettings | ((prev: MultiProviderSettings) => MultiProviderSettings);

/**
 * Read and write the persisted multi-provider settings, always in normalized shape.
 */
export function useMultiProviderSettings() {
  const [stored, setStored] = useLocalStorage<MultiProviderSettings>(
    STORAGE_KEYS.MULTI_PROVIDER_SETTINGS,
    DEFAULT_MULTI_PROVIDER_SETTINGS
  );

  const settings = useMemo(() => normalizeMultiProviderSettings(stored), [stored]);

  const setSettings = useCallback(
    (update: SettingsUpdate) => {
      setStored(prev => {
        const base = normalizeMultiProviderSettings(prev);
        return typeof update === 'function' ? update(base) : update;
      });
    },
    [setStored]
  );

  return [settings, setSettings] as const;
}
