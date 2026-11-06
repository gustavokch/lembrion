import { StudySession } from '../../types';
import { isAnswered } from '../pages/StudyPage/learningTechniques';

interface ExtentBarProps {
  session: StudySession;
  /** Answered count that draws a full-length bar; the same for every list. */
  scale: number;
  className?: string;
}

/** Answered questions per topic, in the session's topic order; questions without a known topic come last. */
function topicCounts(session: StudySession): number[] {
  const counts = new Map<string, number>(session.contexts.map((context) => [context, 0]));
  for (const question of session.questions) {
    if (!isAnswered(question)) continue;
    const key = question.context && counts.has(question.context) ? question.context : '';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.values()].filter((count) => count > 0);
}

/** A hairline bar: the session's answered questions against `scale`, split into one segment per topic. */
export default function ExtentBar({ session, scale, className }: ExtentBarProps) {
  return (
    <span aria-hidden="true" className={className ? `extent ${className}` : 'extent'}>
      {scale > 0 &&
        topicCounts(session).map((count, index) => (
          <span key={index} style={{ width: `${(count / scale) * 100}%` }} />
        ))}
    </span>
  );
}
