import { describe, expect, it } from 'vitest';
import { AIError } from '../../types/ai.types';
import { parseEvaluationResponse } from './questionParser';

function verdict(json: string): string {
  return '```json\n' + json + '\n```';
}

function parseError(content: string): AIError {
  try {
    parseEvaluationResponse(content, 'openai');
  } catch (error) {
    return error as AIError;
  }
  throw new Error('Expected parseEvaluationResponse to throw');
}

describe('parseEvaluationResponse', () => {
  it('extracts the score and strips the verdict block from the feedback', () => {
    const content = '**Good work.** You named the key idea.\n\n' + verdict('{"score": 82}');
    expect(parseEvaluationResponse(content, 'openai')).toEqual({
      feedback: '**Good work.** You named the key idea.',
      score: 82,
    });
  });

  it('uses the last json block and keeps earlier code blocks in the feedback', () => {
    const content = [
      'Your snippet:',
      verdict('{"score": 10}'),
      'Overall solid.',
      verdict('{"score": 75}'),
    ].join('\n');
    const result = parseEvaluationResponse(content, 'openai');
    expect(result.score).toBe(75);
    expect(result.feedback).toBe('Your snippet:\n' + verdict('{"score": 10}') + '\nOverall solid.');
  });

  it('rounds the score and clamps it to 0-100', () => {
    expect(parseEvaluationResponse(verdict('{"score": 69.6}'), 'openai').score).toBe(70);
    expect(parseEvaluationResponse(verdict('{"score": 150}'), 'openai').score).toBe(100);
    expect(parseEvaluationResponse(verdict('{"score": -5}'), 'openai').score).toBe(0);
  });

  it.each([
    ['a missing block', 'Great answer, well done.'],
    ['a non-numeric score', verdict('{"score": "high"}')],
    ['a missing score', verdict('{"grade": 90}')],
    ['invalid JSON', verdict('{score: 90')],
  ])('throws a retryable INVALID_RESPONSE for %s', (_label, content) => {
    const error = parseError(content);
    expect(error.name).toBe('AIError');
    expect(error.code).toBe('INVALID_RESPONSE');
    expect(error.retryable).toBe(true);
  });

  it('gives the same result when called twice on the same input', () => {
    const content = 'Fine.\n' + verdict('{"score": 90}');
    expect(parseEvaluationResponse(content, 'openai')).toEqual(parseEvaluationResponse(content, 'openai'));
  });
});
