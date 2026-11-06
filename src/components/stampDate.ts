import { Language } from '../core/types';

/**
 * A date as a rubber date stamp prints it: "06 NOV 2026", or "06 NOV" without the
 * year. Month names follow the UI language ("06 NOV 2026" in pt-BR too, "06 FEV 2027").
 */
export function stampDate(date: Date | string, language: Language, withYear = true): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return '';
  const parts = new Intl.DateTimeFormat(language, { day: '2-digit', month: 'short', year: 'numeric' }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? '';
  const month = part('month').replace(/\./g, '').toUpperCase();
  return withYear ? `${part('day')} ${month} ${part('year')}` : `${part('day')} ${month}`;
}

/**
 * A stamp for a time later today: "06 NOV · 18:40" (time in the UI language's
 * clock). Used where a not-yet-due item shares its day with items already due.
 */
export function stampDateTime(date: Date | string, language: Language): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return '';
  const time = new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit' }).format(value).toUpperCase();
  return `${stampDate(value, language, false)} · ${time}`;
}