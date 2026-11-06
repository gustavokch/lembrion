import { ExternalLink, Github } from 'lucide-react';
import { GITHUB_URL, PATREON_URL } from '../../core/config/constants';
import { useLanguage } from '../../hooks/useLanguage';

export default function PricingPage() {
  const { t } = useLanguage();

  return (
    <div className="page">
      <header className="page-header">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3.5 gap-y-1">
          <h1 className="page-title">{t.supportLembrion}</h1>
          <p className="page-lede">{t.supportLembrionDesc}</p>
        </div>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:items-start">
        <section aria-labelledby="support-costs-heading" className="panel min-w-0">
          <div className="panel-head">
            <h2 id="support-costs-heading" className="panel-title">{t.supportCostsTitle}</h2>
          </div>
          <div className="panel-body">
            <p className="max-w-measure">{t.freeForeverDesc}</p>
            <p className="mt-3 max-w-measure text-ink-soft">
              {t.dataStaysInBrowser}. {t.noTrackingOrAnalytics}.
            </p>
          </div>
        </section>

        <section aria-labelledby="support-source-heading" className="panel min-w-0">
          <div className="panel-head">
            <h2 id="support-source-heading" className="panel-title">{t.supportSourceTitle}</h2>
          </div>
          <div className="panel-body">
            <p className="max-w-measure">{t.openSourceOnGitHubDesc}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                <Github aria-hidden="true" />
                {t.viewOnGitHub}
                <ExternalLink aria-hidden="true" />
              </a>
              <span className="break-all text-sm text-ink-muted">{GITHUB_URL.replace(/^https:\/\//, '')}</span>
            </div>
          </div>
        </section>

        {/* Patreon section: hidden until PATREON_URL is set */}
        {PATREON_URL ? (
          <section aria-labelledby="support-patreon-heading" className="panel min-w-0">
            <div className="panel-head">
              <h2 id="support-patreon-heading" className="panel-title">{t.supportOnPatreon}</h2>
            </div>
            <div className="panel-body">
              <p className="max-w-measure">{t.supportOnPatreonDesc}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <a href={PATREON_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  {t.supportOnPatreonButton}
                  <ExternalLink aria-hidden="true" />
                </a>
                <span className="break-all text-sm text-ink-muted">{PATREON_URL.replace(/^https?:\/\//, '')}</span>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
