import { afterEach, describe, expect, it, vi } from 'vitest';
import { AIProvider, AIRequest } from '../../../types/ai.types';
import { AnthropicProvider } from './anthropic';
import { DeepSeekProvider } from './deepseek';
import { GeminiProvider } from './gemini';
import { OllamaProvider } from './ollama';
import { OpenAIProvider } from './openai';

const providers: Record<AIProvider, { generateCompletion(request: AIRequest): Promise<unknown> }> = {
  openai: new OpenAIProvider(),
  deepseek: new DeepSeekProvider(),
  ollama: new OllamaProvider(),
  anthropic: new AnthropicProvider(),
  gemini: new GeminiProvider(),
};

const responseBodies: Record<AIProvider, unknown> = {
  openai: { choices: [{ message: { content: 'ok' } }] },
  deepseek: { choices: [{ message: { content: 'ok' } }] },
  ollama: { choices: [{ message: { content: 'ok' } }] },
  anthropic: { content: [{ type: 'text', text: 'ok' }] },
  gemini: { candidates: [{ content: { parts: [{ text: 'ok' }] } }] },
};

async function send(provider: AIProvider, overrides: Partial<AIRequest>) {
  const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => responseBodies[provider],
  }));
  vi.stubGlobal('fetch', fetchMock);
  await providers[provider].generateCompletion({
    provider,
    model: 'any-model',
    messages: [{ role: 'system', content: 'Be brief.' }, { role: 'user', content: 'Hi' }],
    apiKey: 'test-key',
    ...overrides,
  });
  const [url, init] = fetchMock.mock.calls[0];
  return { url, headers: init.headers as Record<string, string>, body: JSON.parse(init.body as string) };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('provider request parameters', () => {
  it.each(['openai', 'deepseek', 'ollama', 'anthropic'] as const)('%s sends temperature 0 as 0', async provider => {
    const { body } = await send(provider, { temperature: 0 });
    expect(body.temperature).toBe(0);
  });

  it('gemini sends temperature 0 as 0', async () => {
    const { body } = await send('gemini', { temperature: 0 });
    expect(body.generationConfig.temperature).toBe(0);
  });

  it('gemini sends the API key in the x-goog-api-key header, not the URL', async () => {
    const { url, headers } = await send('gemini', { apiKey: 'secret-key' });
    expect(url).not.toContain('key=');
    expect(url).not.toContain('secret-key');
    expect(headers['x-goog-api-key']).toBe('secret-key');
  });

  it('openai uses the per-request baseUrl', async () => {
    const { url } = await send('openai', { baseUrl: 'https://proxy.example.com/v1' });
    expect(url).toBe('https://proxy.example.com/v1/chat/completions');
  });

  it('anthropic turns a system-only request into a user message', async () => {
    const { body } = await send('anthropic', { messages: [{ role: 'system', content: 'Grade this answer.' }] });
    expect(body.messages).toEqual([{ role: 'user', content: 'Grade this answer.' }]);
  });

  it('gemini keeps system text for a system-only request', async () => {
    const { body } = await send('gemini', { messages: [{ role: 'system', content: 'Grade this answer.' }] });
    expect(body.contents).toEqual([{ role: 'user', parts: [{ text: 'Grade this answer.' }] }]);
  });

  it('gemini prepends system text to the first user message', async () => {
    const { body } = await send('gemini', {});
    expect(body.contents).toHaveLength(1);
    expect(body.contents[0].role).toBe('user');
    expect(body.contents[0].parts[0].text).toContain('Be brief.');
    expect(body.contents[0].parts[0].text).toContain('Hi');
  });
});
