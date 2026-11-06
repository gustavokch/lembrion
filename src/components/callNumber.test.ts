import { describe, expect, it } from 'vitest';
import { callNumber, sessionCallNumber, topicCode } from './callNumber';

describe('topicCode', () => {
  it('takes the first three letters, uppercased and without diacritics', () => {
    expect(topicCode('Cellular respiration')).toBe('CEL');
    expect(topicCode('Física quântica')).toBe('FIS');
    expect(topicCode('Era Vargas (1930–1945)')).toBe('ERA');
  });

  it('skips punctuation and spaces and keeps digits and non-Latin letters', () => {
    expect(topicCode('C++ basics')).toBe('CBA');
    expect(topicCode('  3D graphics')).toBe('3DG');
    expect(topicCode('細胞呼吸')).toBe('細胞呼');
  });

  it('returns a dash when the topic has no letters or digits', () => {
    expect(topicCode('')).toBe('—');
    expect(topicCode('?!')).toBe('—');
  });
});

describe('callNumber', () => {
  it('appends the box when there is one', () => {
    expect(callNumber('Linear algebra: eigenvalues', 2)).toBe('LIN·2');
    expect(callNumber('Linear algebra: eigenvalues')).toBe('LIN');
  });
});

describe('sessionCallNumber', () => {
  it('joins the first two topic codes and counts the rest', () => {
    expect(sessionCallNumber(['Statistics'])).toBe('STA');
    expect(sessionCallNumber(['Cellular respiration', 'Learning science'])).toBe('CEL/LEA');
    expect(sessionCallNumber(['Operating systems', 'Concurrency', 'Networks', 'Security'])).toBe('OPE/CON+2');
    expect(sessionCallNumber([])).toBe('—');
  });
});
