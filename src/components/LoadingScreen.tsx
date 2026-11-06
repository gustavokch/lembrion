import { useLanguage } from '../hooks';

interface LoadingScreenProps {
  /** Draw the wordmark bar too; off inside `Layout`, which already shows the wordmark. */
  bar?: boolean;
}

/**
 * Version-gate and route fallback: a travelling violet rule. With `bar`, it
 * repeats the boot markup in index.html (the wordmark on the ground over a
 * hairline), so the hand-off from first paint to React does not jump.
 */
export default function LoadingScreen({ bar = true }: LoadingScreenProps) {
  const { t } = useLanguage();

  if (!bar) return <div className="loading-rule" role="progressbar" aria-label={t.loadingExperience} />;

  return (
    <div className="min-h-screen bg-ground">
      <div className="wordmark flex h-14 items-center border-b border-line px-6 text-xl text-ink">Lembrion</div>
      <div className="loading-rule bg-transparent" role="progressbar" aria-label={t.loadingExperience} />
    </div>
  );
}
