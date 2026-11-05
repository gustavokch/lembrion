import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../../config/constants';
import { applyLanguageFromUrl, getCurrentLanguage } from './languageDetector';

describe('applyLanguageFromUrl', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('?lang=pt-BR becomes the persisted language and other params stay', () => {
    window.localStorage.setItem(STORAGE_KEYS.LANGUAGE, JSON.stringify({ language: 'en-US' }));
    window.history.replaceState(null, '', '/?lang=pt-BR&ref=x');

    applyLanguageFromUrl();

    expect(getCurrentLanguage()).toBe('pt-BR');
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.LANGUAGE)!)).toEqual({ language: 'pt-BR' });
    expect(window.location.search).toBe('?ref=x');
  });

  it('ignores an unsupported ?lang value', () => {
    window.localStorage.setItem(STORAGE_KEYS.LANGUAGE, JSON.stringify({ language: 'en-US' }));
    window.history.replaceState(null, '', '/?lang=xx');

    applyLanguageFromUrl();

    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.LANGUAGE)!)).toEqual({ language: 'en-US' });
  });
});
