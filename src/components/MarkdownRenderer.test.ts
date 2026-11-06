import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import MarkdownRenderer from './MarkdownRenderer';
import { convertMathDelimiters } from './markdownMath';

const render = (content: string) => renderToStaticMarkup(createElement(MarkdownRenderer, { content }));

describe('MarkdownRenderer math', () => {
  it('renders plain text with a Greek letter and a hyphen as an ordinary paragraph', () => {
    const text = 'Oxidation of isocitrate to α-ketoglutarate';

    expect(convertMathDelimiters(text)).toBe(text);
    const html = render(text);
    expect(html).toMatch(/<p[^>]*>Oxidation of isocitrate to α-ketoglutarate<\/p>/);
    expect(html).not.toContain('data-math');
  });

  it('converts inline $…$ math in place, inside the paragraph', () => {
    const html = render('Oxidation of isocitrate to $\\alpha$-ketoglutarate');

    expect(html).toMatch(/<p[^>]*>Oxidation of isocitrate to α-ketoglutarate<\/p>/);
    expect(html).not.toContain('data-math');
  });

  it('renders $$…$$ as one display-math line', () => {
    const html = render('Energy:\n\n$$E = mc^2$$');

    expect(html).toMatch(/<div[^>]*data-math="display"[^>]*>E = mc²<\/div>/);
  });

  it('leaves currency amounts as prose', () => {
    const text = 'The book costs $5 and the course $10.';

    expect(convertMathDelimiters(text)).toBe(text);
  });

  it('leaves math delimiters inside inline code untouched', () => {
    const html = render('Write `$x^2$` for a square.');

    expect(html).toContain('$x^2$</code>');
    expect(html).not.toContain('data-math');
  });
});
