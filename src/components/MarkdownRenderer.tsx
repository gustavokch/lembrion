import { Check, Copy } from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import ReactMarkdown, { type Components, type ExtraProps } from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import kotlin from 'react-syntax-highlighter/dist/esm/languages/prism/kotlin';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import php from 'react-syntax-highlighter/dist/esm/languages/prism/php';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import ruby from 'react-syntax-highlighter/dist/esm/languages/prism/ruby';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import swift from 'react-syntax-highlighter/dist/esm/languages/prism/swift';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import { useLanguage } from '../hooks/useLanguage';
import { convertMathDelimiters, DISPLAY_MATH_LANGUAGE, latexToText } from './markdownMath';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

const REGISTERED_LANGUAGES = {
  bash,
  c,
  cpp,
  csharp,
  css,
  go,
  java,
  javascript,
  json,
  jsx,
  kotlin,
  markup,
  php,
  python,
  ruby,
  rust,
  sql,
  swift,
  tsx,
  typescript,
  yaml,
};

type RegisteredLanguage = keyof typeof REGISTERED_LANGUAGES;

(Object.keys(REGISTERED_LANGUAGES) as RegisteredLanguage[]).forEach((name) => {
  SyntaxHighlighter.registerLanguage(name, REGISTERED_LANGUAGES[name]);
});

const LANGUAGE_ALIASES: Record<string, RegisteredLanguage> = {
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  html: 'markup',
  xml: 'markup',
  svg: 'markup',
  'c#': 'csharp',
  cs: 'csharp',
  'c++': 'cpp',
  yml: 'yaml',
  kt: 'kotlin',
  rb: 'ruby',
  golang: 'go',
};

/**
 * Map a fenced-code language tag to a registered Prism language, or 'text'
 * so unregistered languages render as a plain block.
 */
function resolveLanguage(tag: string): RegisteredLanguage | 'text' {
  const normalized = tag.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(REGISTERED_LANGUAGES, normalized)) {
    return normalized as RegisteredLanguage;
  }
  return Object.prototype.hasOwnProperty.call(LANGUAGE_ALIASES, normalized)
    ? LANGUAGE_ALIASES[normalized]
    : 'text';
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

type HastElement = NonNullable<ExtraProps['node']>;
type HastChild = HastElement['children'][number];

function hastText(node: HastChild): string {
  if (node.type === 'text') return node.value;
  if (node.type === 'element') return node.children.map(hastText).join('');
  return '';
}

const INK = 'var(--color-ink)';
const tokenColor = (color: string): CSSProperties => ({ color });

/*
 * Prism theme built from the colour tokens, so code follows the light, dark
 * and high-contrast themes without a second stylesheet.
 */
const CODE_STYLE: Record<string, CSSProperties> = {
  'code[class*="language-"]': {
    color: INK,
    background: 'none',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    whiteSpace: 'pre',
    tabSize: 2,
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: INK,
    background: 'var(--color-sunken)',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    margin: 0,
    overflow: 'auto',
  },
  comment: { color: 'var(--color-inkMuted)', fontStyle: 'italic' },
  prolog: tokenColor('var(--color-inkMuted)'),
  doctype: tokenColor('var(--color-inkMuted)'),
  cdata: tokenColor('var(--color-inkMuted)'),
  punctuation: tokenColor('var(--color-inkSoft)'),
  operator: tokenColor('var(--color-inkSoft)'),
  keyword: tokenColor('var(--color-accentInk)'),
  atrule: tokenColor('var(--color-accentInk)'),
  builtin: tokenColor('var(--color-accentInk)'),
  important: tokenColor('var(--color-accentInk)'),
  selector: tokenColor('var(--color-accentInk)'),
  tag: tokenColor('var(--color-accentInk)'),
  string: tokenColor('var(--color-successInk)'),
  char: tokenColor('var(--color-successInk)'),
  'attr-value': tokenColor('var(--color-successInk)'),
  regex: tokenColor('var(--color-successInk)'),
  inserted: tokenColor('var(--color-successInk)'),
  url: tokenColor('var(--color-successInk)'),
  number: tokenColor('var(--color-warningInk)'),
  boolean: tokenColor('var(--color-warningInk)'),
  constant: tokenColor('var(--color-warningInk)'),
  symbol: tokenColor('var(--color-warningInk)'),
  deleted: tokenColor('var(--color-errorInk)'),
  function: { color: INK, fontWeight: 500 },
  'class-name': { color: INK, fontWeight: 500 },
  bold: { fontWeight: 600 },
  italic: { fontStyle: 'italic' },
};

const LINE_NUMBER_STYLE: CSSProperties = {
  color: 'var(--color-inkMuted)',
  minWidth: '2.25em',
  paddingRight: '1em',
};

const COPIED_RESET_MS = 1500;

function CodeBlock({ code, tag }: { code: string; tag: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), COPIED_RESET_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyLabel = copied ? t.markdownCodeCopied : t.markdownCopyCode;

  return (
    <figure className="my-3 overflow-hidden rounded-sm bg-sunken first:mt-0 last:mb-0">
      <figcaption className="flex items-center justify-between gap-2 border-b border-line pl-4 text-xs text-ink-muted">
        <span className="font-mono">{tag}</span>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={() => {
            void navigator.clipboard.writeText(code).then(() => setCopied(true));
          }}
          aria-label={copyLabel}
          title={copyLabel}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        </button>
        <span role="status" className="sr-only">
          {copied ? t.markdownCodeCopied : ''}
        </span>
      </figcaption>
      <SyntaxHighlighter
        language={resolveLanguage(tag)}
        style={CODE_STYLE}
        showLineNumbers
        lineNumberStyle={LINE_NUMBER_STYLE}
        PreTag="div"
        className="font-mono text-sm"
        customStyle={{ margin: 0, padding: '0.75rem 1rem', background: 'transparent', lineHeight: 1.6 }}
      >
        {code}
      </SyntaxHighlighter>
    </figure>
  );
}

const COMPONENTS: Components = {
  // Fenced blocks arrive as <pre><code class="language-x">; inline code is a bare <code>.
  pre({ node, children }) {
    const codeNode = node?.children[0];
    if (!codeNode || codeNode.type !== 'element' || codeNode.tagName !== 'code') {
      return (
        <pre className="my-3 overflow-x-auto rounded-sm bg-sunken px-4 py-3 font-mono text-sm first:mt-0 last:mb-0">
          {children}
        </pre>
      );
    }

    const classNames = codeNode.properties.className;
    const languageClass = Array.isArray(classNames)
      ? classNames.map(String).find((name) => name.startsWith('language-'))
      : undefined;
    const tag = languageClass ? languageClass.slice('language-'.length) : '';
    const code = hastText(codeNode).replace(/\n$/, '');

    if (tag === DISPLAY_MATH_LANGUAGE) {
      return (
        <div role="math" data-math="display" className="my-3 overflow-x-auto text-center first:mt-0 last:mb-0">
          {latexToText(code)}
        </div>
      );
    }

    return <CodeBlock code={code} tag={tag} />;
  },

  code({ children }) {
    return (
      <code className="break-words rounded-sm bg-sunken px-1 py-0.5 font-mono text-[0.9em]">{children}</code>
    );
  },

  p({ children }) {
    return <p className="my-3 first:mt-0 last:mb-0">{children}</p>;
  },

  a({ href, children }) {
    return (
      <a href={href} className="text-ink underline hover:text-ink-soft" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },

  ul({ children }) {
    return <ul className="my-3 list-disc space-y-1 pl-6 marker:text-ink-muted first:mt-0 last:mb-0">{children}</ul>;
  },

  ol({ children }) {
    return <ol className="my-3 list-decimal space-y-1 pl-6 marker:text-ink-muted first:mt-0 last:mb-0">{children}</ol>;
  },

  blockquote({ children }) {
    return (
      <blockquote className="my-3 border-l border-line-strong pl-4 text-ink-soft first:mt-0 last:mb-0">
        {children}
      </blockquote>
    );
  },

  h1({ children }) {
    return <h1 className="mb-2 mt-5 text-xl font-medium first:mt-0">{children}</h1>;
  },

  h2({ children }) {
    return <h2 className="mb-2 mt-5 text-lg font-medium first:mt-0">{children}</h2>;
  },

  h3({ children }) {
    return <h3 className="mb-1.5 mt-4 text-base font-semibold first:mt-0">{children}</h3>;
  },

  h4({ children }) {
    return <h4 className="mb-1 mt-4 text-base font-medium first:mt-0">{children}</h4>;
  },

  table({ children }) {
    return (
      <div className="my-3 overflow-x-auto first:mt-0 last:mb-0">
        <table className="data-table">{children}</table>
      </div>
    );
  },

  hr() {
    return <hr className="my-4 border-line" />;
  },
};

/**
 * Markdown from the model: GFM, hard line breaks, highlighted code, and
 * LaTeX inside explicit math delimiters reduced to readable text.
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const processedContent = useMemo(() => (content ? convertMathDelimiters(content.trim()) : ''), [content]);

  if (!content) return null;

  return (
    <div className={`break-words ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={COMPONENTS}>
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
