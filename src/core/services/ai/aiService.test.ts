import { afterEach, describe, expect, it, vi } from 'vitest';
import { AI_PROVIDER_IDS, AIError, AIProvider, AIProviderSettings, QuestionGenerationRequest } from '../../types/ai.types';
import { AIService, PASS_SCORE } from './aiService';

type FetchCall = { url: string; init: RequestInit };

const responsesBody = (text: string) => ({
  status: 'completed',
  output: [
    { type: 'reasoning', summary: [] },
    { type: 'message', role: 'assistant', content: [{ type: 'output_text', text }] },
  ],
  model: 'm',
});
const messagesBody = (text: string) => ({ content: [{ type: 'thinking', thinking: '' }, { type: 'text', text }], model: 'm', stop_reason: 'end_turn' });

const completionBodies: Record<AIProvider, (text: string) => unknown> = {
  openai: responsesBody,
  deepseek: text => ({ choices: [{ message: { content: text }, finish_reason: 'stop' }], model: 'm' }),
  anthropic: messagesBody,
  gemini: text => ({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] }),
  'custom-messages': messagesBody,
  'custom-responses': responsesBody,
};

/**
 * Stub fetch so the given provider answers the nth request with `texts[n]`, repeating the
 * last text after that; returns the recorded calls.
 */
function stubProvider(provider: AIProvider, ...texts: string[]): FetchCall[] {
  const calls: FetchCall[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const text = texts[Math.min(calls.length, texts.length) - 1];
    return { ok: true, status: 200, statusText: 'OK', json: async () => completionBodies[provider](text) };
  }));
  return calls;
}

function settingsFor(provider: AIProvider): AIProviderSettings {
  const baseUrl = provider.startsWith('custom-') ? 'http://localhost:11434/v1' : undefined;
  return { provider, apiKey: 'test-key', model: 'custom-model-id', baseUrl };
}

function body(call: FetchCall) {
  return JSON.parse(call.init.body as string);
}

function fenced(value: unknown): string {
  return 'Here you go:\n```json\n' + JSON.stringify(value, null, 2) + '\n```';
}

/** An evaluation reply: Markdown feedback followed by the score verdict block */
function graded(feedback: string, score: number): string {
  return feedback + '\n\n```json\n{"score": ' + score + '}\n```';
}

const validMultipleChoice = {
  question: 'What is 2 + 2?',
  options: ['3', '4', '5', '6'],
  correctAnswer: 1,
  explanation: 'Basic arithmetic.',
  difficulty: 'medium',
};

const service = new AIService();

function generateMultipleChoice(content: string) {
  stubProvider('openai', content);
  return service.generateQuestion(
    { contexts: ['Arithmetic'], type: 'multipleChoice', language: 'en-US' },
    settingsFor('openai')
  );
}

async function rejection(promise: Promise<unknown>): Promise<AIError> {
  try {
    await promise;
  } catch (error) {
    return error as AIError;
  }
  throw new Error('Expected the promise to reject');
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('generateQuestion response validation', () => {
  it('parses a valid fenced multiple-choice question', async () => {
    const question = await generateMultipleChoice(fenced(validMultipleChoice));
    expect(question).toMatchObject({
      question: 'What is 2 + 2?',
      type: 'multipleChoice',
      options: ['3', '4', '5', '6'],
      correctAnswer: 1,
      explanation: 'Basic arithmetic.',
      difficulty: 'medium',
    });
  });

  it('coerces a numeric-string correctAnswer to a number', async () => {
    const question = await generateMultipleChoice(fenced({ ...validMultipleChoice, correctAnswer: '2' }));
    expect(question.correctAnswer).toBe(2);
  });

  it.each([
    ['too few options', { options: ['3', '4'] }, /options/i],
    ['an empty option', { options: ['3', '', '5', '6'] }, /options/i],
    ['correctAnswer out of range', { correctAnswer: 4 }, /correctAnswer/],
    ['negative correctAnswer', { correctAnswer: -1 }, /correctAnswer/],
    ['a letter correctAnswer', { correctAnswer: 'B' }, /correctAnswer/],
    ['a float correctAnswer', { correctAnswer: 1.5 }, /correctAnswer/],
    ['a missing question', { question: '' }, /question/],
  ])('rejects %s with a retryable INVALID_RESPONSE error', async (_label, patch, message) => {
    const error = await rejection(generateMultipleChoice(fenced({ ...validMultipleChoice, ...patch })));
    expect(error.name).toBe('AIError');
    expect(error.code).toBe('INVALID_RESPONSE');
    expect(error.retryable).toBe(true);
    expect(error.message).toMatch(message);
  });

  it('rejects output without JSON as INVALID_RESPONSE', async () => {
    const error = await rejection(generateMultipleChoice('Sorry, I cannot help with that.'));
    expect(error.code).toBe('INVALID_RESPONSE');
    expect(error.retryable).toBe(true);
  });

  it('rejects a dissertative question with non-string evaluation criteria', async () => {
    stubProvider('openai', fenced({ question: 'Explain recursion.', sampleAnswer: 'A function calling itself.', evaluationCriteria: [1, 2] }));
    const error = await rejection(service.generateQuestion(
      { contexts: ['CS'], type: 'dissertative', language: 'en-US' },
      settingsFor('openai')
    ));
    expect(error.code).toBe('INVALID_RESPONSE');
  });

  it('parses a valid dissertative question', async () => {
    stubProvider('openai', fenced({ question: 'Explain recursion.', sampleAnswer: 'A function calling itself.', evaluationCriteria: ['Defines recursion'] }));
    const question = await service.generateQuestion(
      { contexts: ['CS'], type: 'dissertative', language: 'en-US' },
      settingsFor('openai')
    );
    expect(question).toMatchObject({
      question: 'Explain recursion.',
      type: 'dissertative',
      sampleAnswer: 'A function calling itself.',
      evaluationCriteria: ['Defines recursion'],
    });
  });
});

describe('effort level', () => {
  it('sends the chosen level, with more output room for more reasoning', async () => {
    const calls = stubProvider('openai', fenced(validMultipleChoice));
    const request: QuestionGenerationRequest = { contexts: ['Arithmetic'], type: 'multipleChoice', language: 'en-US' };
    await service.generateQuestion(request, { ...settingsFor('openai'), effort: 'low' });
    await service.generateQuestion(request, { ...settingsFor('openai'), effort: 'high' });

    expect(body(calls[0]).reasoning).toEqual({ effort: 'low' });
    expect(body(calls[1]).reasoning).toEqual({ effort: 'high' });
    expect(body(calls[1]).max_output_tokens).toBeGreaterThan(body(calls[0]).max_output_tokens);
  });
});

describe('prompts sent to the provider', () => {
  const unfilledPlaceholder = /\{[A-Za-z]+\}/;

  it.each(['en-US', 'pt-BR'])('fills every placeholder in the %s question prompts', async language => {
    for (const type of ['multipleChoice', 'dissertative'] as const) {
      const calls = stubProvider('deepseek', fenced(validMultipleChoice));
      await service.generateQuestion({ contexts: ['Biology'], type, language }, settingsFor('deepseek')).catch(() => undefined);
      const messages: { content: string }[] = body(calls[0]).messages;
      for (const message of messages) {
        expect(message.content).not.toMatch(unfilledPlaceholder);
      }
    }
  });

  it.each(['anthropic', 'gemini'] as const)('sends the evaluation prompt to %s as a non-empty user message', async provider => {
    const calls = stubProvider(provider, graded('Good answer.', 90));
    await service.evaluateAnswer(
      { question: 'Why is the sky blue?', userAnswer: 'Rayleigh scattering', type: 'dissertative', language: 'en-US' },
      settingsFor(provider)
    );
    const sent = body(calls[0]);
    const userText = provider === 'anthropic'
      ? sent.messages.filter((m: { role: string }) => m.role === 'user').map((m: { content: string }) => m.content).join('\n')
      : sent.contents.filter((c: { role: string }) => c.role === 'user').map((c: { parts: { text: string }[] }) => c.parts[0].text).join('\n');
    expect(userText).toContain('Why is the sky blue?');
    expect(userText).toContain('Rayleigh scattering');
  });

  it.each(['anthropic', 'gemini'] as const)('sends the elaborative prompt to %s as a non-empty user message', async provider => {
    const calls = stubProvider(provider, 'Why does that happen?');
    await service.generateElaborativeQuestion(['Optics'], 'Why is the sky blue?', 'en-US', settingsFor(provider));
    const sent = body(calls[0]);
    const firstUser = provider === 'anthropic' ? sent.messages[0] : sent.contents[0];
    expect(firstUser.role).toBe('user');
    expect(JSON.stringify(firstUser)).toContain('Why is the sky blue?');
  });

  it('sends the evaluation and elaborative prompts as user messages', async () => {
    const calls = stubProvider('deepseek', graded('Fine.', 80));
    await service.evaluateAnswer(
      { question: 'Why is the sky blue?', userAnswer: 'Scattering', type: 'dissertative', language: 'en-US' },
      settingsFor('deepseek')
    );
    await service.generateElaborativeQuestion(['Optics'], 'Why is the sky blue?', 'en-US', settingsFor('deepseek'));
    for (const call of calls) {
      const userMessages = body(call).messages.filter((m: { role: string }) => m.role === 'user');
      expect(userMessages.length).toBeGreaterThan(0);
      expect(userMessages[0].content).toContain('Why is the sky blue?');
    }
  });

  it('inserts the student answer verbatim into the evaluation prompt', async () => {
    const calls = stubProvider('deepseek', graded('Good answer.', 90));
    const userAnswer = 'Use s/(a)/$1$&/ and keep {type} as typed';
    await service.evaluateAnswer(
      { question: 'Explain sed.', userAnswer, type: 'dissertative', language: 'en-US' },
      settingsFor('deepseek')
    );
    const sentText = body(calls[0]).messages.map((m: { content: string }) => m.content).join('\n');
    expect(sentText).toContain(userAnswer);
  });

  it('sends the Anthropic browser-access and version headers', async () => {
    const calls = stubProvider('anthropic', graded('Good answer.', 90));
    await service.evaluateAnswer(
      { question: 'Q', userAnswer: 'A', type: 'dissertative', language: 'en-US' },
      settingsFor('anthropic')
    );
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers['anthropic-dangerous-direct-browser-access']).toBe('true');
    expect(headers['anthropic-version']).toBe('2026-10-21');
  });

  it('asks for the focus context in the user prompt in both languages', async () => {
    const english = stubProvider('deepseek', fenced(validMultipleChoice));
    await service.generateQuestion(
      { contexts: ['Algebra', 'Geometry'], type: 'multipleChoice', language: 'en-US', focusContext: 'Geometry' },
      settingsFor('deepseek')
    );
    expect(body(english[0]).messages[1].content).toContain('Focus this question on: Geometry. The other contexts only define scope.');

    const portuguese = stubProvider('deepseek', fenced(validMultipleChoice));
    await service.generateQuestion(
      { contexts: ['Álgebra', 'Geometria'], type: 'multipleChoice', language: 'pt-BR', focusContext: 'Geometria' },
      settingsFor('deepseek')
    );
    expect(body(portuguese[0]).messages[1].content).toContain('Foque esta questão em: Geometria.');
  });

  it('leaves the focus sentence out without a focus context', async () => {
    const calls = stubProvider('deepseek', fenced(validMultipleChoice));
    await service.generateQuestion({ contexts: ['Algebra', 'Geometry'], type: 'multipleChoice', language: 'en-US' }, settingsFor('deepseek'));
    expect(body(calls[0]).messages[1].content).not.toContain('Focus this question on');
  });

  it.each(['en-US', 'pt-BR'])('sends the evaluation criteria and the verdict rule in %s', async language => {
    const calls = stubProvider('deepseek', graded('Ok.', 70));
    await service.evaluateAnswer(
      { question: 'Explain recursion.', userAnswer: 'It calls itself', type: 'dissertative', language, evaluationCriteria: ['Defines a base case'] },
      settingsFor('deepseek')
    );
    const prompt: string = body(calls[0]).messages[0].content;
    expect(prompt).toContain('1. Defines a base case');
    expect(prompt).toContain('```json\n{"score":');
    expect(prompt).not.toMatch(/\{[A-Za-z]+\}/);
  });

  it.each(AI_PROVIDER_IDS)('grades a dissertative answer through %s', async provider => {
    stubProvider(provider, graded('Covers the mechanism.', 85));
    const evaluation = await service.evaluateAnswer(
      { question: 'Why is the sky blue?', userAnswer: 'Rayleigh scattering', type: 'dissertative', language: 'en-US' },
      settingsFor(provider)
    );
    expect(evaluation).toMatchObject({ score: 85, isCorrect: true, feedback: 'Covers the mechanism.' });
  });
});

describe('error retryability', () => {
  it('marks a fetch network failure as retryable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    const error = await rejection(service.evaluateAnswer(
      { question: 'Q', userAnswer: 'A', type: 'dissertative', language: 'en-US' },
      settingsFor('openai')
    ));
    expect(error.retryable).toBe(true);
  });

  it('does not mark a malformed response body as retryable network error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => { throw new SyntaxError('Unexpected token < in JSON'); },
    })));
    const error = await rejection(service.evaluateAnswer(
      { question: 'Q', userAnswer: 'A', type: 'dissertative', language: 'en-US' },
      settingsFor('openai')
    ));
    expect(error.retryable).toBe(false);
    expect(error.code).not.toBe('NETWORK_ERROR');
  });

  it('does not mark an invalid request as retryable', async () => {
    stubProvider('openai', 'unused');
    const error = await rejection(service.generateQuestion(
      { contexts: [], type: 'multipleChoice', language: 'en-US' },
      settingsFor('openai')
    ));
    expect(error.name).toBe('AIError');
    expect(error.retryable).toBe(false);
  });
});

describe('single retry', () => {
  const request: QuestionGenerationRequest = { contexts: ['Arithmetic'], type: 'multipleChoice', language: 'en-US' };

  it('returns the question when the second reply is valid', async () => {
    const calls = stubProvider('openai', 'not json at all', fenced(validMultipleChoice));
    const question = await service.generateQuestion(request, settingsFor('openai'));
    expect(question.question).toBe('What is 2 + 2?');
    expect(calls).toHaveLength(2);
  });

  it('throws INVALID_RESPONSE after exactly two invalid replies', async () => {
    const calls = stubProvider('openai', 'not json at all', fenced({ ...validMultipleChoice, correctAnswer: 9 }));
    const error = await rejection(service.generateQuestion(request, settingsFor('openai')));
    expect(error.code).toBe('INVALID_RESPONSE');
    expect(calls).toHaveLength(2);
  });

  /** Stub fetch to answer with the given HTTP statuses in order (repeating the last); 200 carries a valid question */
  function stubStatuses(...statuses: number[]) {
    let call = 0;
    const fetchMock = vi.fn(async () => {
      call += 1;
      const status = statuses[Math.min(call, statuses.length) - 1];
      return status === 200
        ? { ok: true, status, statusText: 'OK', json: async () => completionBodies.openai(fenced(validMultipleChoice)) }
        : { ok: false, status, statusText: 'Error', json: async () => ({ error: { message: 'boom' } }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('returns the question when a provider 500 is followed by success', async () => {
    const fetchMock = stubStatuses(500, 200);
    const question = await service.generateQuestion(request, settingsFor('openai'));
    expect(question.question).toBe('What is 2 + 2?');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws API_ERROR after exactly two provider 503s', async () => {
    const fetchMock = stubStatuses(503);
    const error = await rejection(service.generateQuestion(request, settingsFor('openai')));
    expect(error.code).toBe('API_ERROR');
    expect(error.statusCode).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries a provider 5xx when generating an elaborative question', async () => {
    const fetchMock = stubStatuses(502, 200);
    await service.generateElaborativeQuestion(['Arithmetic'], 'What is 2 + 2?', 'en-US', settingsFor('openai'));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([429, 400, 401])('does not retry a provider %i', async status => {
    const fetchMock = stubStatuses(status);
    const error = await rejection(service.generateQuestion(request, settingsFor('openai')));
    expect(error.statusCode).toBe(status);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not retry a network failure', async () => {
    const fetchMock = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
    vi.stubGlobal('fetch', fetchMock);
    const error = await rejection(service.generateQuestion(request, settingsFor('openai')));
    expect(error.code).toBe('NETWORK_ERROR');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('dissertative grading', () => {
  function evaluate(language = 'en-US') {
    return service.evaluateAnswer(
      { question: 'Explique a fotossíntese.', userAnswer: 'A planta converte luz em energia química.', type: 'dissertative', language },
      settingsFor('openai')
    );
  }

  it('grades pt-BR feedback from the verdict score, not from English keywords', async () => {
    // The removed keyword heuristic found "incorrect" and no positive English words here
    stubProvider('openai', graded('**Muito bem!** Sua resposta cobre o essencial; um ponto incorrect na terminologia.', 85));
    const evaluation = await evaluate('pt-BR');
    expect(evaluation.isCorrect).toBe(true);
    expect(evaluation.score).toBe(85);
    expect(evaluation.feedback).toBe('**Muito bem!** Sua resposta cobre o essencial; um ponto incorrect na terminologia.');
  });

  it('marks a score below the pass mark as incorrect even with praising words', async () => {
    stubProvider('openai', graded('Excellent effort, good start, but the core idea is missing.', PASS_SCORE - 1));
    const evaluation = await evaluate();
    expect(evaluation.isCorrect).toBe(false);
    expect(evaluation.score).toBe(PASS_SCORE - 1);
  });

  it('passes at exactly the pass mark', async () => {
    stubProvider('openai', graded('Adequate.', PASS_SCORE));
    expect((await evaluate()).isCorrect).toBe(true);
  });

  it('retries once when the verdict block is missing', async () => {
    const calls = stubProvider('openai', 'Great answer, well done.', graded('Great answer, well done.', 92));
    const evaluation = await evaluate();
    expect(calls).toHaveLength(2);
    expect(evaluation.score).toBe(92);
  });

  it('throws INVALID_RESPONSE after two replies without a verdict', async () => {
    const calls = stubProvider('openai', 'Great answer.', 'Still no verdict.');
    const error = await rejection(evaluate());
    expect(error.code).toBe('INVALID_RESPONSE');
    expect(calls).toHaveLength(2);
  });
});

describe('explanation feedback', () => {
  const markdown = '**What is right:** you named Rayleigh scattering.\n\n**What is missing:** why shorter wavelengths scatter more.';

  function explain(language: string) {
    return service.evaluateExplanation(
      { question: 'Why is the sky blue?', correctAnswer: 'Rayleigh scattering', explanation: 'Air scatters blue light {type} $& more', language },
      settingsFor('deepseek')
    );
  }

  it.each([
    ['en-US', 'Correct answer: Rayleigh scattering', 'under 120 words', 'Write in English'],
    ['pt-BR', 'Resposta correta: Rayleigh scattering', 'menos de 120 palavras', 'Escreva em português do Brasil'],
  ])('sends the %s feedback prompt as one user message and returns the Markdown', async (language, answerLine, lengthRule, languageRule) => {
    const calls = stubProvider('deepseek', `\n${markdown}\n`);
    const feedback = await explain(language);

    expect(feedback).toBe(markdown);
    expect(calls).toHaveLength(1);
    const messages: { role: string; content: string }[] = body(calls[0]).messages;
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toContain('Why is the sky blue?');
    expect(messages[0].content).toContain(answerLine);
    expect(messages[0].content).toContain('Air scatters blue light {type} $& more');
    expect(messages[0].content).toContain(lengthRule);
    expect(messages[0].content).toContain(languageRule);
  });

  it('retries once on an empty reply', async () => {
    const calls = stubProvider('deepseek', '   ', markdown);
    expect(await explain('en-US')).toBe(markdown);
    expect(calls).toHaveLength(2);
  });

  it('throws INVALID_RESPONSE after two empty replies', async () => {
    const calls = stubProvider('deepseek', '', '  ');
    const error = await rejection(explain('en-US'));
    expect(error.code).toBe('INVALID_RESPONSE');
    expect(calls).toHaveLength(2);
  });
});

describe('logging', () => {
  it('does not log prompts or model output outside development', async () => {
    vi.stubEnv('DEV', false);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    await generateMultipleChoice(fenced(validMultipleChoice));
    expect(log).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(debug).not.toHaveBeenCalled();
  });
});
