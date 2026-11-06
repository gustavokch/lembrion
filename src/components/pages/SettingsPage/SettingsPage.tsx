import { AlertCircle, AlertTriangle, Check, ExternalLink, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useRef, useState, type KeyboardEvent } from 'react';
import { clearAllAppData } from '../../../core/services/storage/localStorage';
import { formatMessage } from '../../../core/services/i18n';
import {
  getAllProviders,
  getLocalizedApiKeyLabel,
  getLocalizedCostTier,
  getLocalizedModelDescription,
  getLocalizedModelName,
  getLocalizedProviderDescription,
  getLocalizedProviderName,
  getLocalizedSetupInstructions,
  getModel,
  getProviderConfig,
  validateProviderConfig
} from '../../../core/services/ai/providers/registry';
import { Language } from '../../../core/types';
import { AIProvider, ProviderSettings } from '../../../core/types/ai.types';
import { useLanguage, useMultiProviderSettings } from '../../../hooks';

const TABS = ['providers', 'language', 'data'] as const;
type SettingsTab = (typeof TABS)[number];

/** Where each provider hands out keys (or, for Ollama, the installer). */
const PROVIDER_SETUP_URLS: Record<AIProvider, string> = {
  openai: 'https://platform.openai.com/api-keys',
  gemini: 'https://aistudio.google.com/apikey',
  anthropic: 'https://console.anthropic.com/settings/keys',
  deepseek: 'https://platform.deepseek.com/api_keys',
  ollama: 'https://ollama.com/download',
};

/** Language names are shown in their own language. */
const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en-US', label: 'English' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
];

export default function SettingsPage() {
  const { t, language, changeLanguage } = useLanguage();
  const [multiProviderSettings, setMultiProviderSettings] = useMultiProviderSettings();

  const [activeTab, setActiveTab] = useState<SettingsTab>('providers');
  const [showApiKey, setShowApiKey] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const tabRefs = useRef<Partial<Record<SettingsTab, HTMLButtonElement | null>>>({});
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  const availableProviders = getAllProviders();
  const currentProvider = multiProviderSettings.currentProvider;
  const currentProviderConfig = getProviderConfig(currentProvider);
  const currentProviderSettings = multiProviderSettings.providers[currentProvider];
  const currentProviderName = getLocalizedProviderName(currentProvider, language);
  const selectedModel = getModel(currentProvider, currentProviderSettings.model);
  const setupUrl = PROVIDER_SETUP_URLS[currentProvider];

  const validation = validateProviderConfig(currentProvider, currentProviderSettings, language);

  const tabLabels: Record<SettingsTab, string> = {
    providers: t.aiProvider,
    language: t.language,
    data: t.data,
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.indexOf(activeTab);
    const lastIndex = TABS.length - 1;
    const targets: Record<string, number> = {
      ArrowRight: index === lastIndex ? 0 : index + 1,
      ArrowLeft: index === 0 ? lastIndex : index - 1,
      Home: 0,
      End: lastIndex,
    };
    const nextIndex = targets[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    const nextTab = TABS[nextIndex];
    setActiveTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  const handleProviderChange = (providerId: AIProvider) => {
    setMultiProviderSettings(prev => ({
      ...prev,
      currentProvider: providerId
    }));
  };

  const handleProviderSettingChange = (
    providerId: AIProvider,
    key: keyof ProviderSettings,
    value: string
  ) => {
    setMultiProviderSettings(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [providerId]: {
          ...prev.providers[providerId],
          [key]: value
        }
      }
    }));
  };

  const handleDeleteAllData = () => {
    clearAllAppData();
    // Reload the page to reset the app
    window.location.reload();
  };

  const cancelDelete = () => {
    setConfirmingDelete(false);
    deleteButtonRef.current?.focus();
  };

  return (
    <div className="page [&>*]:max-w-4xl">
      <h1 className="page-title">{t.settingsTitle}</h1>
      <p className="page-lede">{t.configurePreferences}</p>

      <div role="tablist" aria-label={t.settingsTitle} className="tabs mt-6" onKeyDown={handleTabKeyDown}>
        {TABS.map((id) => (
          <button
            key={id}
            ref={(element) => {
              tabRefs.current[id] = element;
            }}
            type="button"
            role="tab"
            id={`settings-tab-${id}`}
            aria-selected={activeTab === id}
            aria-controls={activeTab === id ? `settings-panel-${id}` : undefined}
            tabIndex={activeTab === id ? 0 : -1}
            onClick={() => setActiveTab(id)}
            className="tab min-h-10"
          >
            {tabLabels[id]}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`settings-panel-${activeTab}`}
        aria-labelledby={`settings-tab-${activeTab}`}
        className="mt-8"
      >
        {activeTab === 'providers' && (
          <>
            <section aria-labelledby="settings-provider-heading">
              <h2 id="settings-provider-heading" className="section-title">
                {t.settingsProviderTitle}
              </h2>
              <div role="radiogroup" aria-labelledby="settings-provider-heading" className="choice-group mt-4">
                {availableProviders.map((provider) => {
                  const settings = multiProviderSettings.providers[provider.id];
                  const configured = validateProviderConfig(provider.id, settings, language).valid;
                  const needsKey = provider.requiresApiKey && !settings.apiKey;
                  return (
                    <label key={provider.id} className="choice">
                      <input
                        type="radio"
                        name="settings-provider"
                        value={provider.id}
                        checked={currentProvider === provider.id}
                        onChange={() => handleProviderChange(provider.id)}
                        className="mt-1 h-4 w-4 shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-ink">
                          {getLocalizedProviderName(provider.id, language)}
                        </span>
                        <span className="block text-sm text-ink-soft">
                          {getLocalizedProviderDescription(provider.id, language)}
                        </span>
                      </span>
                      {configured ? (
                        <span className="tag mt-1 shrink-0 text-ink">
                          <Check aria-hidden="true" className="h-3 w-3" />
                          {t.settingsProviderConfigured}
                        </span>
                      ) : needsKey ? (
                        <span className="tag mt-1 shrink-0">{t.settingsProviderNeedsKey}</span>
                      ) : (
                        <span className="tag tag-error mt-1 shrink-0">{t.settingsProviderIncomplete}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </section>

            <section aria-labelledby="settings-provider-form-heading" className="mt-10">
              <h2 id="settings-provider-form-heading" className="section-title">
                {formatMessage(t.settingsProviderSettingsTitle, { provider: currentProviderName })}
              </h2>
              <p className="hint">{t.settingsAutoSave}</p>

              <div className="mt-6 max-w-xl space-y-8">
                {currentProviderConfig.requiresApiKey && (
                  <div>
                    <label htmlFor="provider-api-key" className="label">
                      {getLocalizedApiKeyLabel(currentProvider, language)}
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="provider-api-key"
                        type={showApiKey ? 'text' : 'password'}
                        value={currentProviderSettings.apiKey}
                        onChange={(e) => handleProviderSettingChange(
                          currentProvider,
                          'apiKey',
                          e.target.value
                        )}
                        placeholder={currentProviderConfig.apiKeyPlaceholder}
                        autoComplete="off"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        aria-describedby="provider-api-key-hint"
                        className="field min-w-0 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(prev => !prev)}
                        aria-label={t.settingsShowApiKey}
                        aria-pressed={showApiKey}
                        className="btn btn-ghost btn-icon shrink-0"
                      >
                        {showApiKey ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                      </button>
                    </div>
                    <p id="provider-api-key-hint" className="hint">
                      {t.apiKeyStored}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    {currentProviderConfig.requiresApiKey ? t.howToGetKey : t.settingsOllamaSetupTitle}
                  </h3>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-soft marker:text-ink-muted">
                    {getLocalizedSetupInstructions(currentProvider, language).map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                  <a
                    href={setupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-sm text-ink underline hover:text-ink-soft"
                  >
                    {formatMessage(t.settingsOpenSite, { site: new URL(setupUrl).host })}
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>

                <div>
                  <label htmlFor="provider-model-input" className="label">
                    {t.model}
                  </label>
                  <input
                    id="provider-model-input"
                    type="text"
                    list="provider-model-suggestions"
                    value={currentProviderSettings.model}
                    onChange={(e) => handleProviderSettingChange(
                      currentProvider,
                      'model',
                      e.target.value.trim()
                    )}
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-describedby="provider-model-help"
                    className="field font-mono"
                  />
                  <datalist id="provider-model-suggestions">
                    {currentProviderConfig.models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {getLocalizedModelName(currentProvider, model.id, language)}
                      </option>
                    ))}
                  </datalist>
                  <p id="provider-model-help" className="hint">
                    {t.modelInputHelp}
                  </p>

                  {/* Registry models as tappable suggestions (datalist support on mobile is unreliable) */}
                  {currentProviderConfig.models.length > 0 && (
                    <div className="mt-4">
                      <p id="provider-model-suggestions-label" className="text-sm font-medium text-ink">
                        {t.suggestedModels}
                      </p>
                      <div
                        role="group"
                        aria-labelledby="provider-model-suggestions-label"
                        className="mt-2 flex flex-wrap gap-2"
                      >
                        {currentProviderConfig.models.map((model) => {
                          const isSelected = model.id === currentProviderSettings.model;
                          return (
                            <button
                              key={model.id}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => handleProviderSettingChange(
                                currentProvider,
                                'model',
                                model.id
                              )}
                              className="btn btn-secondary btn-sm min-h-10 aria-pressed:border-ink aria-pressed:bg-sunken sm:min-h-8"
                            >
                              {isSelected && <Check aria-hidden="true" />}
                              {getLocalizedModelName(currentProvider, model.id, language)}
                              {model.recommended ? ` (${t.recommended})` : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedModel && (
                    <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                      <span>{getLocalizedModelDescription(currentProvider, selectedModel.id, language)}</span>
                      <span className="tag">{getLocalizedCostTier(selectedModel.costTier, language)}</span>
                    </p>
                  )}
                </div>

                {currentProvider === 'ollama' && (
                  <div>
                    <label htmlFor="provider-base-url" className="label">
                      {t.baseUrl}
                    </label>
                    <input
                      id="provider-base-url"
                      type="url"
                      value={currentProviderSettings.baseUrl || ''}
                      onChange={(e) => handleProviderSettingChange(
                        currentProvider,
                        'baseUrl',
                        e.target.value
                      )}
                      placeholder={t.baseUrlPlaceholder}
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      aria-invalid={validation.errors.includes(t.invalidBaseUrlFormat)}
                      className="field font-mono"
                    />
                  </div>
                )}

                {!validation.valid && (
                  <div className="notice notice-error">
                    <AlertCircle aria-hidden="true" />
                    <div>
                      <p className="font-medium">{t.invalidConfiguration}</p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-5">
                        {validation.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === 'language' && (
          <section aria-labelledby="settings-language-heading">
            <h2 id="settings-language-heading" className="section-title">
              {t.language}
            </h2>
            <div role="radiogroup" aria-labelledby="settings-language-heading" className="choice-group mt-4 max-w-md">
              {LANGUAGES.map((lang) => (
                <label key={lang.value} className="choice items-center">
                  <input
                    type="radio"
                    name="settings-language"
                    value={lang.value}
                    checked={language === lang.value}
                    onChange={() => changeLanguage(lang.value)}
                    className="h-4 w-4 shrink-0"
                  />
                  <span lang={lang.value} className="font-medium text-ink">
                    {lang.label}
                  </span>
                </label>
              ))}
            </div>
            <p className="hint max-w-md">{t.languageTipDesc}</p>
          </section>
        )}

        {activeTab === 'data' && (
          <section aria-labelledby="settings-data-heading">
            <h2 id="settings-data-heading" className="section-title">
              {t.settingsStoredDataTitle}
            </h2>
            <p className="mt-4 max-w-measure text-ink-soft">{t.manageYourData}</p>

            <div className="mt-10 border-t border-line pt-6">
              <h3 className="text-base font-semibold text-ink">{t.deleteAllData}</h3>
              <p className="mt-1 max-w-measure text-sm text-ink-soft">{t.deleteAllDataDesc}</p>
              <button
                ref={deleteButtonRef}
                type="button"
                onClick={() => setConfirmingDelete(true)}
                aria-expanded={confirmingDelete}
                aria-controls="settings-delete-confirm"
                className="btn btn-danger mt-4"
              >
                <Trash2 aria-hidden="true" />
                {t.deleteAllData}
              </button>

              {confirmingDelete && (
                <div
                  id="settings-delete-confirm"
                  role="alertdialog"
                  aria-labelledby="settings-delete-confirm-text"
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') cancelDelete();
                  }}
                  className="notice notice-error mt-4 max-w-measure"
                >
                  <AlertTriangle aria-hidden="true" />
                  <div>
                    <p id="settings-delete-confirm-text">{t.deleteAllDataConfirm}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={handleDeleteAllData} className="btn btn-danger">
                        {t.settingsDeleteConfirmButton}
                      </button>
                      <button type="button" onClick={cancelDelete} autoFocus className="btn btn-secondary">
                        {t.cancel}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
