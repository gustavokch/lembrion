import { useLanguage } from '../hooks';

interface LoadingScreenProps {
  /** Draw the title bar too; off inside `Layout`, which already has one. */
  bar?: boolean;
}

/** Version-gate and route fallback: a travelling progress rule under the title bar. */
export default function LoadingScreen({ bar = true }: LoadingScreenProps) {
  const { t } = useLanguage();
  const rule = <div className="loading-rule" role="progressbar" aria-label={t.loadingExperience} />;

  if (!bar) return rule;

  return (
    <div className="min-h-screen bg-ground">
      <div className="flex h-14 items-center bg-shell px-6 text-lg font-medium text-shell-ink">Lembrion</div>
      {rule}
    </div>
  );
}
