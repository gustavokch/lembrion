/**
 * LaTeX in model output, reduced to readable Unicode text.
 *
 * Only explicit math delimiters are converted: `$…$` and `\(…\)` inline,
 * `$$…$$` and `\[…\]` as display math. Plain prose (Greek letters, hyphens,
 * brackets) is never touched, and neither is code.
 */

/** Fence language that marks a display-math block for the renderer. */
export const DISPLAY_MATH_LANGUAGE = 'math';

const SYMBOLS: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ',
  eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν',
  xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', upsilon: 'υ', phi: 'φ', varphi: 'φ',
  chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ',
  Psi: 'Ψ', Omega: 'Ω',
  to: '→', rightarrow: '→', Rightarrow: '⇒', leftarrow: '←', Leftarrow: '⇐',
  leftrightarrow: '↔', Leftrightarrow: '⇔', implies: '⇒', iff: '⇔', mapsto: '↦',
  infty: '∞', pm: '±', mp: '∓', times: '×', div: '÷', cdot: '·', bullet: '•', circ: '∘',
  leq: '≤', le: '≤', geq: '≥', ge: '≥', neq: '≠', ne: '≠', approx: '≈', equiv: '≡',
  sim: '∼', propto: '∝', partial: '∂', nabla: '∇', int: '∫', oint: '∮', sum: '∑', prod: '∏',
  cap: '∩', cup: '∪', subset: '⊂', supset: '⊃', subseteq: '⊆', supseteq: '⊇', in: '∈',
  notin: '∉', forall: '∀', exists: '∃', emptyset: '∅', varnothing: '∅', neg: '¬', land: '∧',
  lor: '∨', oplus: '⊕', otimes: '⊗', perp: '⊥', parallel: '∥', angle: '∠', degree: '°',
  ldots: '…', cdots: '⋯', dots: '…', prime: '′', sqrt: '√',
};

const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸',
  '9': '⁹', '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', n: 'ⁿ', i: 'ⁱ', '∘': '°',
};

const SUBSCRIPTS: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈',
  '9': '₉', '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎', a: 'ₐ', e: 'ₑ', o: 'ₒ', x: 'ₓ',
  h: 'ₕ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ', p: 'ₚ', s: 'ₛ', t: 'ₜ', i: 'ᵢ', j: 'ⱼ', r: 'ᵣ',
  u: 'ᵤ', v: 'ᵥ',
};

/** Map every character through `table`, or return null if one has no form there. */
function mapScript(text: string, table: Record<string, string>): string | null {
  let out = '';
  for (const char of text) {
    const mapped = table[char];
    if (mapped === undefined) return null;
    out += mapped;
  }
  return out;
}

const SIMPLE_TERM = /^[\w.′αβγδεζηθικλμνξπρστυφχψω]+$/;

function group(text: string): string {
  const trimmed = text.trim();
  return SIMPLE_TERM.test(trimmed) ? trimmed : `(${trimmed})`;
}

/** Convert one LaTeX expression (without delimiters) to readable text. */
export function latexToText(latex: string): string {
  let text = latex
    .replace(/\\\{/g, '\uE000')
    .replace(/\\\}/g, '\uE001')
    .replace(/\\([%$&#_])/g, '$1')
    .replace(/\\(?:left|right|big|Big|bigg|Bigg)(?![a-zA-Z])/g, '')
    .replace(/\\(?:[,;:! ]|q?quad(?![a-zA-Z]))/g, ' ')
    .replace(/\\\\/g, ' ');

  // Wrappers whose argument is plain text.
  text = text.replace(
    /\\(?:text|textrm|textbf|textit|mathrm|mathbf|mathit|mathsf|mathbb|mathcal|operatorname|boldsymbol)\{([^{}]*)\}/g,
    '$1',
  );

  // Fractions and roots, innermost first, so nested ones resolve.
  let previous: string;
  do {
    previous = text;
    text = text
      .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_m, num: string, den: string) => `${group(num)}/${group(den)}`)
      .replace(/\\sqrt\[([^\]]+)\]\{([^{}]*)\}/g, (_m, index: string, body: string) =>
        `${mapScript(index.trim(), SUPERSCRIPTS) ?? index.trim()}√${group(body)}`)
      .replace(/\\sqrt\{([^{}]*)\}/g, (_m, body: string) => `√${group(body)}`);
  } while (text !== previous);

  text = text
    .replace(/\\lim_\{([^{}]*)\}/g, (_m, sub: string) => `lim(${sub.trim()}) `)
    .replace(/\\int_\{([^{}]*)\}\^\{([^{}]*)\}/g, (_m, lower: string, upper: string) => `∫[${lower.trim()}, ${upper.trim()}] `)
    .replace(/\\sum_\{([^{}]*)\}\^\{([^{}]*)\}/g, (_m, lower: string, upper: string) => `∑[${lower.trim()}, ${upper.trim()}] `);

  text = text.replace(/\\([a-zA-Z]+)/g, (_m, name: string) => SYMBOLS[name] ?? name);

  const script = (marker: string, table: Record<string, string>) =>
    (_m: string, braced: string | undefined, single: string | undefined) => {
      const body = (braced ?? single ?? '').trim();
      return mapScript(body, table) ?? `${marker}${group(body)}`;
    };
  text = text
    .replace(/\^(?:\{([^{}]*)\}|([^\s{}]))/g, script('^', SUPERSCRIPTS))
    .replace(/_(?:\{([^{}]*)\}|([^\s{}]))/g, script('_', SUBSCRIPTS));

  text = text
    .replace(/[{}]/g, '')
    .replace(/\uE000/g, '{')
    .replace(/\uE001/g, '}');

  // Space relations always; space + and - only between two operands.
  text = text
    .replace(/\s*([=<>≤≥≠≈≡∼∝→⇒⇔↔←⇐↦])\s*/g, ' $1 ')
    .replace(/([\w)\]′¹²³⁰⁴-⁹₀-₉α-ωΑ-Ω])\s*([+\-±∓×÷])\s*(?=[\w(√∞α-ωΑ-Ω])/g, '$1 $2 ');

  return text.replace(/\s+/g, ' ').trim();
}

/*
 * Code fences and inline code come first in the alternation so math
 * delimiters inside code stay untouched. Inline `$…$` follows the usual
 * pandoc rule: no space after the opening `$`, none before the closing one,
 * and no digit right after it, so "$5 and $10" stays prose.
 */
const MATH_OR_CODE =
  /(```|~~~)[\s\S]*?(?:\1|$)|`[^`\n]*`|\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|(?<![\\$])\$(?=[^\s$])([^$\n]*?[^\s$\\])\$(?!\d)/g;

/**
 * Replace delimited math in a markdown string: inline math becomes escaped
 * Unicode text in place, display math becomes a ```math fence that the
 * renderer draws as a centred line. Everything else is returned unchanged.
 */
export function convertMathDelimiters(markdown: string): string {
  return markdown.replace(
    MATH_OR_CODE,
    (match, _fence, displayDollar?: string, displayBracket?: string, inlineParen?: string, inlineDollar?: string) => {
      const display = displayDollar ?? displayBracket;
      if (display !== undefined) {
        return `\n\n\`\`\`${DISPLAY_MATH_LANGUAGE}\n${display.trim()}\n\`\`\`\n\n`;
      }
      const inline = inlineParen ?? inlineDollar;
      if (inline !== undefined) {
        // Escape ASCII punctuation so the converted text stays literal in markdown.
        return latexToText(inline).replace(/[!-/:-@[-`{-~]/g, '\\$&');
      }
      return match;
    },
  );
}
