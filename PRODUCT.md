# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- University students working through course material (chapters, lecture topics) across a semester.
- Self-directed adults (professionals, hobbyists) learning a field on their own schedule.
- The maintainer and the people he shares it with: Lembrion is a personal tool first, and public users are secondary.

The job: turn a list of topics into active practice (retrieval, review, explanation) instead of rereading notes.

## Product Purpose

Lembrion turns study topics into AI-generated question sessions (multiple choice, open-ended, or mixed), grades answers, and keeps a history and a cross-session review queue. The techniques come from *Make It Stick*: retrieval practice, spaced repetition, interleaving, elaborative interrogation, self-explanation, and desirable difficulties. Success: the user returns, clears due reviews, and remembers more; the app gets out of the way of the questions.

## Positioning

- No backend and no account. The browser calls the AI provider directly with the user's own key (OpenAI, Gemini, Anthropic, DeepSeek, or a local Ollama server).
- The learning techniques change the session itself (review copies, Leitner review queue, difficulty steps, "why" follow-ups, explanation feedback); they are not labels.

## Operating Context

- Two usage scenes: a laptop or desktop at a desk for longer sessions (20-60 minutes, keyboard, essay answers), and a phone for short sessions (commute, breaks, mostly multiple choice).
- Routes: Dashboard, Study (setup, then question/answer/feedback loop), History, Session details, Settings (provider, language, data), Support.
- Model output is Markdown with code blocks and math converted to text.

## Capabilities and Constraints

- React 18 SPA with Vite, Tailwind 3, and theme CSS variables written by `useTheme()`; all state in `localStorage`.
- UI languages: en-US and pt-BR. Every string goes through `Translations`.
- A user-selectable theme picker stays. The theme set may be redesigned and reduced from the current 10; stored theme ids that disappear must map to a valid theme.
- `localStorage` keys keep the `studorama-` prefix.

## Brand Commitments

- Name: Lembrion. Based on Studorama (oluiscabral, MIT); the credit stays in README, LICENSE, and JSON-LD.
- The orange "L" logo tile and the current palettes are not binding.
- No skeuomorphism (user-stated, binding).

## Evidence on Hand

- No testimonials, user counts, ratings, or benchmarks exist. Do not invent them.
- `public/og-image.png`, `public/screenshot-desktop.png`, and `public/screenshot-mobile.png` show the old look.

## Product Principles

- The question is the product: every screen exists to start, answer, or review questions.
- Show the learner where they stand (due reviews, progress, score) without gamification.
- Honest about cost and data: the user's key, the user's provider, nothing stored on a server.
- Fast in, fast out: one step from opening the app to the next question.
