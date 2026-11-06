import { ExternalLink, Github } from 'lucide-react';
import { PATREON_URL } from '../../core/config/constants';
import { useLanguage } from '../../hooks/useLanguage';

const GITHUB_URL = 'https://github.com/gustavokch/lembrion';

export default function PricingPage() {
  const { t } = useLanguage();

  return (
    <div className="page [&>*]:max-w-3xl">
      <h1 className="page-title">{t.supportLembrion}</h1>
      <p className="page-lede max-w-measure">{t.supportLembrionDesc}</p>

      <section aria-labelledby="support-costs-heading" className="mt-10">
        <h2 id="support-costs-heading" className="section-title">{t.supportCostsTitle}</h2>
        <p className="mt-4 max-w-measure">{t.freeForeverDesc}</p>
        <p className="mt-3 max-w-measure text-ink-soft">
          {t.dataStaysInBrowser}. {t.noTrackingOrAnalytics}.
        </p>
      </section>

      <section aria-labelledby="support-source-heading" className="mt-10">
        <h2 id="support-source-heading" className="section-title">{t.supportSourceTitle}</h2>
        <p className="mt-4 max-w-measure">{t.openSourceOnGitHubDesc}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            <Github aria-hidden="true" />
            {t.viewOnGitHub}
            <ExternalLink aria-hidden="true" />
          </a>
          <span className="text-sm text-ink-muted">{GITHUB_URL.replace(/^https:\/\//, '')}</span>
        </div>
      </section>

      {/* Patreon section: hidden until PATREON_URL is set */}
      {PATREON_URL ? (
        <section aria-labelledby="support-patreon-heading" className="mt-10">
          <h2 id="support-patreon-heading" className="section-title">{t.supportOnPatreon}</h2>
          <p className="mt-4 max-w-measure">{t.supportOnPatreonDesc}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <a href={PATREON_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              {t.supportOnPatreonButton}
              <ExternalLink aria-hidden="true" />
            </a>
            <span className="text-sm text-ink-muted">{PATREON_URL.replace(/^https?:\/\//, '')}</span>
          </div>
        </section>
      ) : null}
    </div>
  );
}
