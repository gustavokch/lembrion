import { describe, expect, it } from 'vitest';
import { stripExplanationLabel } from './explanationText';

describe('stripExplanationLabel', () => {
  it('removes a leading label in either language, bold or plain', () => {
    expect(stripExplanationLabel('**Explanation:** The answer is C.')).toBe('The answer is C.');
    expect(stripExplanationLabel('**Explicação:** A resposta é C.')).toBe('A resposta é C.');
    expect(stripExplanationLabel('Explanation: plain text')).toBe('plain text');
    expect(stripExplanationLabel('**Explanation**: label with the colon outside')).toBe('label with the colon outside');
  });

  it('keeps text that only mentions the word later or has no label', () => {
    expect(stripExplanationLabel('The explanation: three NADH.')).toBe('The explanation: three NADH.');
    expect(stripExplanationLabel('Explanations differ: see below.')).toBe('Explanations differ: see below.');
  });
});
