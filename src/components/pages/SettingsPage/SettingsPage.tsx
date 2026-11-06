import { AlertCircle, AlertTriangle, Check, ChevronDown, ExternalLink, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useRef, useState, type KeyboardEvent } from 'react';
import { GITHUB_URL } from '../../../core/config/constants';
import { clearAllAppData } from '../../../core/services/storage/localStorage';
import { formatMessage } from '../../../core/services/i18n';
import {
  getAllProviders,
  getLocalizedApiKeyLabel,
  getLocalizedCostTier,
  getLocalizedEffortName,
  getLocalizedModelDescription,
  getLocalizedModelName,
  getLocalizedProviderDescription,
  getLocalizedProviderName,
  getLocalizedSetupInstructions,
  getModel,
  getProviderConfig,
  resolveEffort,
  validateProviderConfig
} from '../../../core/services/ai/providers/registry';
import { Language } from '../../../core/types';
import { AIProvider, ProviderSettings } from '../../../core/types/ai.types';
import { useLanguage, useMultiProviderSettings } from '../../../hooks';

const TABS = ['providers', 'language', 'data'] as const;
type SettingsTab = (typeof TABS)[number];

/** Where each hosted provider hands out keys, and the README guide for user-run servers */
const PROVIDER_SETUP_URLS: Record<AIProvider, string> = {
  openai: 'https://platform.openai.com/api-keys',
  gemini: 'https://aistudio.google.com/apikey',
  anthropic: 'https://platform.claude.com/settings/keys',
  deepseek: 'https://platform.deepseek.com/api_keys',
  'custom-messages': `${GITHUB_URL}#custom-endpoints`,
  'custom-responses': `${GITHUB_URL}#custom-endpoints`,
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
  const currentEffort = resolveEffort(currentProvider, currentProviderSettings.effort);

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
    <div className="page">
      <header className="page-header">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3.5 gap-y-1">
          <h1 className="page-title">{t.settingsTitle}</h1>
          <p className="page-lede">{t.configurePreferences}</p>
        </div>
      </header>

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
        className="mt-6"
      >
        {activeTab === 'providers' && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            {/* Provider list stays in view while the taller settings column scrolls */}
            <section
              aria-labelledby="settings-provider-heading"
              className="panel min-w-0 overflow-hidden lg:sticky lg:top-6 lg:self-start"
            >
              <div className="panel-head">
                <h2 id="settings-provider-heading" className="panel-title">
                  {t.settingsProviderTitle}
                </h2>
              </div>
              <div role="radiogroup" aria-labelledby="settings-provider-heading" className="choice-group rounded-none border-0">
                {availableProviders.map((provider) => {
                  const settings = multiProviderSettings.providers[provider.id];
                  const configured = validateProviderConfig(provider.id, settings, language).valid;
                  const needsKey = provider.requiresApiKey && !settings.apiKey;
                  return (
                    <label key={provider.id} className="choice sm:px-5">
                      <input
                        type="radio"
                        name="settings-provider"
                        value={provider.id}
                        checked={currentProvider === provider.id}
                        onChange={() => handleProviderChange(provider.id)}
                        className="mt-1 h-4 w-4 shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ink">
                          {getLocalizedProviderName(provider.id, language)}
                        </span>
                        <span className="mt-0.5 block text-sm text-ink-muted">
                          {getLocalizedProviderDescription(provider.id, language)}
                        </span>
                      </span>
                      {configured ? (
                        <span className="tag mt-1 shrink-0 text-ink">
                          <Check aria-hidden="true" className="h-3 w-3" />
                          {t.settingsProviderConfigured}
                        </span>
                      ) : needsKey ? (
                        <span className="tag mt-1 shrink-0 text-ink-muted">{t.settingsProviderNeedsKey}</span>
                      ) : (
                        <span className="tag tag-error mt-1 shrink-0">{t.settingsProviderIncomplete}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </section>

            <section aria-labelledby="settings-provider-form-heading" className="panel min-w-0">
              <div className="panel-head">
                <h2 id="settings-provider-form-heading" className="panel-title">
                  {formatMessage(t.settingsProviderSettingsTitle, { provider: currentProviderName })}
                </h2>
                <p className="panel-meta">{t.settingsAutoSave}</p>
              </div>

              <div className="panel-body space-y-7">
                {currentProviderConfig.endpointPath && (
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
                        e.target.value.trim()
                      )}
                      placeholder={t.baseUrlPlaceholder}
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      aria-required="true"
                      aria-describedby="provider-base-url-hint"
                      aria-invalid={validation.errors.some(error => error === t.baseUrlRequired || error === t.invalidBaseUrlFormat)}
                      className="field font-mono"
                    />
                    <p id="provider-base-url-hint" className="hint">
                      {formatMessage(t.baseUrlHint, { path: currentProviderConfig.endpointPath })}
                    </p>
                  </div>
                )}

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
                      className="btn btn-secondary btn-icon shrink-0"
                    >
                      {showApiKey ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </button>
                  </div>
                  <p id="provider-api-key-hint" className="hint">
                    {t.apiKeyStored}
                  </p>
                </div>

                {/* Setup steps: an inset beside the fields they explain */}
                <div className="rounded border border-line bg-sunken px-4 pb-2 pt-3">
                  <h3 className="caps-label">
                    {currentProviderConfig.endpointPath ? t.settingsEndpointSetupTitle : t.howToGetKey}
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
                    className="mt-1 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-accent-ink underline hover:decoration-2"
                  >
                    {currentProviderConfig.endpointPath
                      ? t.settingsEndpointGuide
                      : formatMessage(t.settingsOpenSite, { site: new URL(setupUrl).host })}
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
                    {currentProviderConfig.models.length > 0 ? t.modelInputHelp : t.modelInputHelpServer}
                  </p>

                  {/* Registry models as tappable suggestions (datalist support on mobile is unreliable) */}
                  {currentProviderConfig.models.length > 0 && (
                    <div className="mt-4">
                      <p id="provider-model-suggestions-label" className="caps-label">
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
                              className="btn btn-secondary btn-sm min-h-10 aria-pressed:border-accent aria-pressed:bg-[color-mix(in_srgb,var(--color-primary)_11%,var(--color-surface))] aria-pressed:text-accent-ink sm:min-h-8"
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

                <div>
                  <label htmlFor="provider-effort" className="label">
                    {t.effort}
                  </label>
                  <div className="relative">
                    <select
                      id="provider-effort"
                      value={currentEffort}
                      onChange={(e) => handleProviderSettingChange(currentProvider, 'effort', e.target.value)}
                      aria-describedby="provider-effort-hint"
                      className="field appearance-none pr-10"
                    >
                      {currentProviderConfig.efforts.map((level) => (
                        <option key={level} value={level}>
                          {level === currentProviderConfig.defaultEffort
                            ? `${getLocalizedEffortName(level, language)} (${t.recommended})`
                            : getLocalizedEffortName(level, language)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                    />
                  </div>
                  <p id="provider-effort-hint" className="hint">
                    {currentProviderConfig.endpointPath ? t.effortHintServer : t.effortHint}
                  </p>
                </div>

                {!validation.valid && (
                  <div className="notice notice-error">
                    <AlertCircle aria-hidden="true" />
                    <div>
                      <p className="font-semibold">{t.invalidConfiguration}</p>
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
          </div>
        )}

        {activeTab === 'language' && (
          <section aria-labelledby="settings-language-heading" className="panel max-w-3xl overflow-hidden">
            <div className="panel-head">
              <h2 id="settings-language-heading" className="panel-title">
                {t.language}
              </h2>
            </div>
            <div role="radiogroup" aria-labelledby="settings-language-heading" className="choice-group rounded-none border-0">
              {LANGUAGES.map((lang) => (
                <label key={lang.value} className="choice items-center sm:px-5">
                  <input
                    type="radio"
                    name="settings-language"
                    value={lang.value}
                    checked={language === lang.value}
                    onChange={() => changeLanguage(lang.value)}
                    className="h-4 w-4 shrink-0"
                  />
                  <span lang={lang.value} className="font-semibold text-ink">
                    {lang.label}
                  </span>
                </label>
              ))}
            </div>
            <p className="panel-body border-t border-line py-3 text-sm text-ink-muted">{t.languageTipDesc}</p>
          </section>
        )}

        {activeTab === 'data' && (
          <section aria-labelledby="settings-data-heading" className="panel max-w-3xl">
            <div className="panel-head">
              <h2 id="settings-data-heading" className="panel-title">
                {t.settingsStoredDataTitle}
              </h2>
            </div>
            <div className="panel-body">
              <p className="max-w-measure text-ink-soft">{t.manageYourData}</p>
            </div>

            <div className="panel-body border-t border-line">
              <h3 className="font-semibold text-ink">{t.deleteAllData}</h3>
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
