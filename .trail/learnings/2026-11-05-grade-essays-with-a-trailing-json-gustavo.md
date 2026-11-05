---
title: Grade essays with a trailing JSON score block and keep color-mix
author: Gustavo
date: 2026-11-05
branch: main
id: l-98ed38bd
scope: repo
status: active
src: agent
touches:
  - README.md
  - eslint.config.js
  - index.html
  - package.json
  - public/manifest.json
  - public/robots.txt
  - public/sitemap.xml
  - public/sw.js
  - public/version.json
  - scripts/deploy.js
---

## Decided
- Dissertative answers are graded from a fenced JSON block `{"score": 0-100}` at the end of the model's markdown feedback; `isCorrect` is `score >= 70`. The old English keyword heuristic misgraded pt-BR feedback.
- Gemini gets its key in the `x-goog-api-key` header. A CORS preflight from https://studorama.vercel.app returned 200 with that header allowed, so the URL query key is not needed.
- Production host is `studorama.vercel.app`. `www.studorama.vercel.app` fails TLS because the *.vercel.app certificate covers one label only.
- Keep `color-mix()` tints. Only decorative tints drop in browsers older than 2023.
- Spaced repetition stays inside one session (review 3 questions after a miss, at most 2 reviews). Review scheduling across sessions was left out on purpose.

## Tried and ruled out
- Whole-response JSON for evaluation (feedback inside a JSON string): small models break the escaping of markdown and code.
- A `SCORE: 85` text line read by regex: least strict, easy for models to drift from.
- RGB-triplet CSS variables instead of color-mix: a second copy of every theme color for a small gain.
- Retrieval-practice and generation-effect toggles: removed rather than implemented (every session is already retrieval practice; generation effect needed a large StudyPage UI change).

## In the code:
- src/core/services/ai/questionParser.ts (`parseEvaluationResponse`), src/core/services/ai/aiService.ts (`PASS_SCORE`, `withInvalidResponseRetry`)
- src/core/services/ai/providers/gemini.ts
- src/components/pages/StudyPage/learningTechniques.ts
- docs/superpowers/specs/2026-11-05-learning-techniques-design.md
