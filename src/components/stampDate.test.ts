import { describe, expect, it } from 'vitest';
import { stampDate, stampDateTime } from './stampDate';

describe('stampDate', () => {
  it('prints day, uppercase short month and year in the UI language', () => {
    expect(stampDate(new Date(2026, 10, 6), 'en-US')).toBe('06 NOV 2026');
    expect(stampDate(new Date(2027, 1, 3), 'pt-BR')).toBe('03 FEV 2027');
  });

  it('drops the year on request and returns an empty string for an invalid date', () => {
    expect(stampDate(new Date(2026, 4, 9), 'en-US', false)).toBe('09 MAY');
    expect(stampDate('not a date', 'en-US')).toBe('');
  });
});

describe('stampDateTime', () => {
  it('adds the time in the UI language clock so two stamps of one day differ', () => {
    expect(stampDateTime(new Date(2026, 10, 6, 18, 40), 'pt-BR')).toBe('06 NOV · 18:40');
    expect(stampDateTime(new Date(2026, 10, 6, 18, 40), 'en-US')).toBe('06 NOV · 06:40 PM');
  });
});
