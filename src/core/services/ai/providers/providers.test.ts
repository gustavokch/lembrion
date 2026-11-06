import { afterEach, describe, expect, it, vi } from 'vitest';
import { AIError, AIRequest, AIResponse } from '../../../types/ai.types';
import { DeepSeekClient } from './deepseek';
import { GeminiClient } from './gemini';
import { MessagesClient } from './messages';
import { ResponsesClient } from './responses';

interface Client {
  generateCompletion(request: AIRequest): Promise<AIResponse>;
}

const anthropic = new MessagesClient({
  provider: 'anthropic',
  name: 'Anthropic',
  hostedBaseUrl: 'https://api.anthropic.com/v1',
  keyHeader: 'x-api-key',
});
const messagesServer = new MessagesClient({ provider: 'custom-messages', name: 'Messages API server', keyHeader: 'bearer' });
const openai = new ResponsesClient({ provider: 'openai', name: 'OpenAI', hostedBaseUrl: 'https://api.openai.com/v1' });
const responsesServer = new ResponsesClient({ provider: 'custom-responses', name: 'Responses API server' });
const gemini = new GeminiClient();
const deepseek = new DeepSeekClient();

const SERVER_URL = 'http://localhost:11434/v1';

/** Send one request with fetch answering `reply`; returns what was sent and the client's result */
async function send(client: Client, reply: unknown, overrides: Partial<AIRequest> = {}) {
  const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => reply,
  }));
  vi.stubGlobal('fetch', fetchMock);
  const result = await client.generateCompletion({
    provider: 'openai',
    model: 'any-model',
    messages: [{ role: 'system', content: 'Be brief.' }, { role: 'user', content: 'Hi' }],
    maxTokens: 1000,
    effort: 'low',
    apiKey: 'test-key',
    ...overrides,
  });
  const [url, init] = fetchMock.mock.calls[0];
  return { url, headers: init.headers as Record<string, string>, body: JSON.parse(init.body as string), result };
}

async function failure(client: Client, reply: unknown, overrides: Partial<AIRequest> = {}): Promise<AIError> {
  try {
    await send(client, reply, overrides);
  } catch (error) {
    return error as AIError;
  }
  throw new Error('Expected the request to fail');
}

const messagesReply = (text: string) => ({ content: [{ type: 'text', text }], stop_reason: 'end_turn' });
const responsesReply = (text: string) => ({
  status: 'completed',
  output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text }] }],
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Messages API client', () => {
  it('reads the answer from text blocks after thinking blocks', async () => {
    const { result } = await send(anthropic, {
      content: [
        { type: 'thinking', thinking: '', signature: 'sig' },
        { type: 'text', text: 'First part. ' },
        { type: 'text', text: 'Second part.' },
      ],
      stop_reason: 'end_turn',
    });
    expect(result.content).toBe('First part. Second part.');
  });

  it('sends system text in the system field and a system-only request as a user turn', async () => {
    const { body } = await send(anthropic, messagesReply('ok'));
    expect(body.system).toBe('Be brief.');
    expect(body.messages).toEqual([{ role: 'user', content: 'Hi' }]);

    const systemOnly = await send(anthropic, messagesReply('ok'), { messages: [{ role: 'system', content: 'Grade this answer.' }] });
    expect(systemOnly.body.system).toBeUndefined();
    expect(systemOnly.body.messages).toEqual([{ role: 'user', content: 'Grade this answer.' }]);
  });

  it('turns a refusal into a REFUSED error', async () => {
    const error = await failure(anthropic, { content: [], stop_reason: 'refusal' });
    expect(error.code).toBe('REFUSED');
  });

  it('treats a reply cut off during thinking as a retryable INVALID_RESPONSE', async () => {
    const error = await failure(anthropic, { content: [{ type: 'thinking', thinking: '' }], stop_reason: 'max_tokens' });
    expect(error.code).toBe('INVALID_RESPONSE');
    expect(error.retryable).toBe(true);
  });

  it('sends a server key as a bearer token, with no header that fails Ollama or OpenRouter CORS', async () => {
    const { headers } = await send(messagesServer, messagesReply('ok'), { baseUrl: SERVER_URL, apiKey: 'server-key' });
    expect(headers.Authorization).toBe('Bearer server-key');
    expect(Object.keys(headers).map(name => name.toLowerCase())).toEqual(['content-type', 'authorization']);
  });

  it('sends no auth header to a server without a key', async () => {
    const { headers } = await send(messagesServer, messagesReply('ok'), { baseUrl: SERVER_URL, apiKey: '' });
    expect(Object.keys(headers)).toEqual(['Content-Type']);
  });

  it('removes inline thinking that a server returns before the answer', async () => {
    const tagged = await send(messagesServer, messagesReply('<think>Plan the quiz.</think>\n\nThe answer.'), { baseUrl: SERVER_URL });
    expect(tagged.result.content).toBe('The answer.');

    const openingTagInPrompt = await send(messagesServer, messagesReply('Plan the quiz.</think>The answer.'), { baseUrl: SERVER_URL });
    expect(openingTagInPrompt.result.content).toBe('The answer.');
  });

  it('turns thinking off for the none level and sends any other level as the effort', async () => {
    const off = await send(anthropic, messagesReply('ok'), { effort: 'none' });
    expect(off.body.thinking).toEqual({ type: 'disabled' });
    expect(off.body.output_config).toBeUndefined();

    const high = await send(anthropic, messagesReply('ok'), { effort: 'high' });
    expect(high.body.output_config).toEqual({ effort: 'high' });
    expect(high.body.thinking).toBeUndefined();
  });

  it('sends no reasoning setting to a server at its default level', async () => {
    const { body } = await send(messagesServer, messagesReply('ok'), { baseUrl: SERVER_URL, effort: 'default' });
    expect(body).not.toHaveProperty('thinking');
    expect(body).not.toHaveProperty('output_config');
  });
});

describe('Responses API client', () => {
  it('reads output_text from the message item after a reasoning item', async () => {
    const { result } = await send(openai, {
      status: 'completed',
      output: [
        { type: 'reasoning', summary: [{ type: 'summary_text', text: 'Thinking it over' }] },
        { type: 'message', content: [{ type: 'output_text', text: 'One. ' }, { type: 'output_text', text: 'Two.' }] },
      ],
      usage: { input_tokens: 5, output_tokens: 7, total_tokens: 12 },
    });
    expect(result.content).toBe('One. Two.');
    expect(result.usage).toEqual({ promptTokens: 5, completionTokens: 7, totalTokens: 12 });
  });

  it('sends system text as instructions and asks the server not to store the exchange', async () => {
    const { body } = await send(openai, responsesReply('ok'));
    expect(body.instructions).toBe('Be brief.');
    expect(body.input).toEqual([{ role: 'user', content: 'Hi' }]);
    expect(body.store).toBe(false);
  });

  it('sends the level as reasoning.effort, and nothing at a server default', async () => {
    const hosted = await send(openai, responsesReply('ok'), { effort: 'none' });
    expect(hosted.body.reasoning).toEqual({ effort: 'none' });

    const server = await send(responsesServer, responsesReply('ok'), { baseUrl: SERVER_URL, effort: 'default' });
    expect(server.body).not.toHaveProperty('reasoning');
  });

  it('turns a refusal part into a REFUSED error', async () => {
    const error = await failure(openai, {
      status: 'completed',
      output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'No.' }] }],
    });
    expect(error.code).toBe('REFUSED');
  });

  it('treats an incomplete reply without text as a retryable INVALID_RESPONSE', async () => {
    const error = await failure(openai, {
      status: 'incomplete',
      incomplete_details: { reason: 'max_output_tokens' },
      output: [{ type: 'reasoning', summary: [] }],
    });
    expect(error.code).toBe('INVALID_RESPONSE');
    expect(error.retryable).toBe(true);
  });

  it.each([
    [SERVER_URL, `${SERVER_URL}/responses`],
    [`${SERVER_URL}/`, `${SERVER_URL}/responses`],
    [`${SERVER_URL}/responses`, `${SERVER_URL}/responses`],
  ])('posts to the responses endpoint under base URL %s', async (baseUrl, expected) => {
    const { url } = await send(responsesServer, responsesReply('ok'), { baseUrl });
    expect(url).toBe(expected);
  });

  it('reports an unreachable server as CONNECTION_ERROR and an unreachable hosted API as NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    const request: AIRequest = { provider: 'openai', model: 'm', messages: [{ role: 'user', content: 'Hi' }], maxTokens: 100, effort: 'low', apiKey: 'k' };

    const server = await responsesServer.generateCompletion({ ...request, baseUrl: SERVER_URL }).catch((error: AIError) => error) as AIError;
    expect(server.code).toBe('CONNECTION_ERROR');

    const hosted = await openai.generateCompletion(request).catch((error: AIError) => error) as AIError;
    expect(hosted.code).toBe('NETWORK_ERROR');
  });
});

describe('Gemini client', () => {
  const geminiReply = (parts: unknown[]) => ({ candidates: [{ content: { parts }, finishReason: 'STOP' }] });

  it('sends the API key in the x-goog-api-key header, not the URL', async () => {
    const { url, headers } = await send(gemini, geminiReply([{ text: 'ok' }]), { apiKey: 'secret-key' });
    expect(url).not.toContain('key=');
    expect(url).not.toContain('secret-key');
    expect(headers['x-goog-api-key']).toBe('secret-key');
  });

  it('sends system text as systemInstruction and the user turn as contents', async () => {
    const { body } = await send(gemini, geminiReply([{ text: 'ok' }]));
    expect(body.systemInstruction).toEqual({ parts: [{ text: 'Be brief.' }] });
    expect(body.contents).toEqual([{ role: 'user', parts: [{ text: 'Hi' }] }]);
  });

  it('joins the answer parts and skips thought parts', async () => {
    const { result } = await send(gemini, geminiReply([{ text: 'Thinking', thought: true }, { text: 'One. ' }, { text: 'Two.' }]));
    expect(result.content).toBe('One. Two.');
  });

  it('sends the effort as an upper-case thinking level', async () => {
    const { body } = await send(gemini, geminiReply([{ text: 'ok' }]), { effort: 'minimal' });
    expect(body.generationConfig.thinkingConfig).toEqual({ thinkingLevel: 'MINIMAL' });
  });

  it('turns a blocked prompt into a REFUSED error', async () => {
    const error = await failure(gemini, { promptFeedback: { blockReason: 'SAFETY' } });
    expect(error.code).toBe('REFUSED');
  });
});

describe('DeepSeek client', () => {
  const deepseekReply = { choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }] };

  it('turns thinking off for the none level, since DeepSeek thinks when told nothing', async () => {
    const { body } = await send(deepseek, deepseekReply, { effort: 'none' });
    expect(body.thinking).toEqual({ type: 'disabled' });
    expect(body).not.toHaveProperty('reasoning_effort');
  });

  it('turns thinking on with the reasoning effort for any other level', async () => {
    const { body } = await send(deepseek, deepseekReply, { effort: 'max' });
    expect(body.thinking).toEqual({ type: 'enabled' });
    expect(body.reasoning_effort).toBe('max');
  });
});
