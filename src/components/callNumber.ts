/**
 * Call numbers: the short spine-label codes that tag questions and sessions,
 * derived from topic names. "Cellular respiration" in box 2 is "CEL·2".
 */

const NO_CODE = '—';

/** The first three letters or digits of a topic, uppercased, without diacritics. */
export function topicCode(topic: string): string {
  const plain = topic.normalize('NFD').replace(/\p{M}/gu, '');
  const characters = plain.match(/[\p{L}\p{N}]/gu);
  if (!characters) return NO_CODE;
  return characters.slice(0, 3).join('').toUpperCase();
}

/** A question's call number: its topic code, with the Leitner box when it has one. */
export function callNumber(topic: string, box?: number): string {
  const code = topicCode(topic);
  return box === undefined ? code : `${code}·${box}`;
}

/** A session's call number: the codes of its first two topics, and how many more it has. */
export function sessionCallNumber(topics: string[]): string {
  if (topics.length === 0) return NO_CODE;
  const codes = topics.slice(0, 2).map(topicCode).join('/');
  return topics.length > 2 ? `${codes}+${topics.length - 2}` : codes;
}
