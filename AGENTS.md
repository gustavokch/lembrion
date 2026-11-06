# Repository Guidelines

## Project Overview

Lembrion is a client-only React SPA for AI-generated study sessions: multiple-choice and dissertative questions, answer evaluation, and session history, based on "Make It Stick" learning techniques. There is no backend. The browser calls AI providers directly with user-supplied API keys stored in `localStorage`. The UI supports `en-US` and `pt-BR`. This repo (`gustavokch/lembrion`, renamed from `gustavokch/studorama`; GitHub redirects the old URL) is a fork of Studorama (`oluiscabral/studorama`, MIT). `LICENSE` keeps oluiscabral's copyright line, and `README.md` and the JSON-LD `isBasedOn` credit Studorama. Lembrion's URL is `https://lembrion.vercel.app`; it needs a Vercel project named `lembrion` that imports this repo, and that project's deploy is push-triggered. `studorama.vercel.app` is the upstream's project; this fork cannot deploy there. The user-visible name changed in 2.7.x, but the `localStorage` keys keep the `studorama-` prefix: renaming them would orphan every existing user's sessions and API keys.

## Architecture & Data Flow

**Boot sequence**
1. `index.html` loads `/src/main.tsx`, then `src/App.tsx`. `main.tsx` calls `setupServiceWorker` (`src/core/utils/serviceWorker.ts`): it registers `/sw.js` only in a production build on a host other than `localhost`/`127.0.0.1`. Everywhere else it unregisters leftover workers.
2. At module scope, `App.tsx` runs `cleanupCorruptedEntries()`, `applyLanguageFromUrl()` (`?lang=pt-BR` becomes the stored language), and `processApiKeyFromUrl()` before the first render.
3. `useVersionControl()` shows `<LoadingScreen/>` until the version migration completes.
4. `BrowserRouter` renders `components/layout/Layout.tsx` and then the routes below. Every page is loaded with `React.lazy` inside one `Suspense` (fallback `LoadingScreen`).

|Route|Component|
|---|---|
|`/` and `*`|`components/pages/Dashboard.tsx` (unknown paths render it; the URL is not changed)|
|`/study`|`components/pages/StudyPage/StudyPage.tsx` (~1.54k lines)|
|`/history`|`components/pages/SessionHistory.tsx`|
|`/session/:id`|`components/SessionDetails.tsx`|
|`/settings`|`components/pages/SettingsPage/SettingsPage.tsx` (tabs: providers, language, data)|
|`/pricing`|`components/pricing/PricingPage.tsx` (GitHub link, and a Patreon section shown only when `PATREON_URL` in `constants.ts` is set; it is an empty placeholder now, and the Dashboard Patreon button follows the same rule; no Stripe)|

**State.** The app has no React context and no store library. Each component reads and writes `localStorage` through `useLocalStorage(key, default)` (`src/hooks/useLocalStorage.ts`). `setValue` updates React state and persists in the same call. A failed write (for example, quota) shows a localized toast. The hook syncs other tabs through the `storage` event. It does not sync two components on the same page. A language change does a hard redirect to `/`; a theme change applies at once (`applyTheme`), with no reload. Provider settings are read through `useMultiProviderSettings()`, which always returns normalized settings.

**AI layer** (`src/core/services/ai/`)
- `aiService.ts` exports the singleton `aiService` with `generateQuestion`, `evaluateAnswer`, `generateElaborativeQuestion`, and `evaluateExplanation` (feedback on a self-explanation, markdown, no score). Providers are held in a `Record<AIProvider, …>`, so `tsc` reports a missing one.
- Each method follows the same pipeline: `validateProviderConfig` → `getProviderConfig` (`providers/registry.ts`) → prompt from `prompts/promptRegistry.ts` (`getPromptTemplate` + `replacePromptVariables`, per-language content, en-US fallback) → provider `generateCompletion(AIRequest): Promise<AIResponse>`. Question generation sends the template as a `system` message plus a `user` prompt; evaluation, elaborative, and explanation-feedback requests send one `user` message. Anthropic and Gemini map `system` text to their own fields.
- Providers in `providers/*.ts` use plain `fetch`. The code uses no SDKs and no streaming. Anthropic requests send `anthropic-dangerous-direct-browser-access: true`.
- `questionParser.ts` (`parseQuestionResponse`) extracts the fenced ` ```json ` block (or a brace-matched object) and validates it: multiple choice needs exactly 4 non-empty options and an integer `correctAnswer` in range (a digit string is converted). Invalid output throws an `AIError` with code `INVALID_RESPONSE`, `retryable: true`.
- Evaluation output is markdown feedback that ends with a ` ```json {"score": 0-100} ``` ` block. `parseEvaluationResponse` (`questionParser.ts`) reads the last such block, clamps the score, and removes the block from the feedback. `isCorrect` is `score >= PASS_SCORE` (70, `aiService.ts`). The evaluation prompt also gets the question's `evaluationCriteria`.
- `withSingleRetry` retries a provider call once on `INVALID_RESPONSE` or on an `API_ERROR` with HTTP status >= 500. It never retries 429, other 4xx, network errors, or timeouts. All four methods use it.
- `errors.ts`: `createAIError`, `createHTTPError` (code `API_ERROR`, the HTTP status, and the provider's error text in `detail`), `toAIError`, and `getAIErrorMessage(error, t)`, which returns localized text by code and status. `debug.ts`: `debugLog` prints only when `import.meta.env.DEV`; do not log prompts, model output, or keys with `console.*`.

**Study session flow**
1. The settings come from `STORAGE_KEYS.MULTI_PROVIDER_SETTINGS` (`studorama-multi-provider-settings`), type `MultiProviderSettings` (`src/core/types/ai.types.ts`): `{ currentProvider, providers: Record<AIProvider, { apiKey, model, baseUrl?, customHeaders? }> }`. The one default object is `DEFAULT_MULTI_PROVIDER_SETTINGS` and `normalizeMultiProviderSettings` drops unknown providers and fills missing ones (`src/core/config/providerSettings.ts`). `SettingsPage` writes them, or URL params do (`?provider=&apikey=&model=&baseUrl=`, via `useApiKeyFromUrl.ts`, removed from the URL with `history.replaceState`).
2. `StudyPage.startNewSession` creates a `StudySession` (id = `createId()`, a UUID) in `STORAGE_KEYS.SESSIONS`.
3. `generateNextQuestion` first checks `findDueReview`. With `spacedRepetition` on, a missed question, or a correct one with confidence <= `LOW_CONFIDENCE_MAX` (2), comes back as a review copy (options shuffled, no API call). Otherwise it calls `aiService.generateQuestion` with `session.difficulty` and, with `interleaving` on and 2+ contexts, a `focusContext`. In `mixed` mode, the question type is random for each question. If the first question fails, the page shows the localized error with "Try Again" and "End Session".
4. `submitAnswer` grades multiple-choice answers locally and ignores a question that already has an answer. Dissertative answers go to `aiService.evaluateAnswer` and store `score`. With `desirableDifficulties` on, `nextDifficulty` updates `session.difficulty`. A wrong answer with `elaborativeInterrogation` on triggers `generateElaborativeQuestion`. With `selfExplanation` on, other answers show an "explain why" textarea with a "Get feedback" button (`evaluateExplanation`). `nextQuestion` saves the elaborative question and answer and the self-explanation on the question. The flow reads the normalized `currentSession.learningSettings`, not the setup-form state. The rules are pure functions in `StudyPage/learningTechniques.ts`; the design is in `docs/superpowers/specs/2026-11-05-learning-techniques-design.md`.
5. Resuming a session (`location.state.sessionId`) shows an already-answered current question in its feedback state, so it cannot be graded twice.
6. `endSession` sets `status: 'completed'` and calls `navigate('/history')`. Dashboard, SessionHistory, and SessionDetails read the same key. Every displayed or stored session percentage comes from `sessionScore(questions)`: correct answers / answered questions (review copies count; unanswered questions do not).

**Review queue across sessions** (`StudyPage/reviewSchedule.ts`; design in `docs/superpowers/specs/2026-11-05-review-queue-explanation-feedback-design.md`). The schedule is stored on the original question in its own session (`reviewBox` 1-5, `nextReview`), so there is no extra storage key. A miss or a low-confidence correct answer in a session with `spacedRepetition` on enters box 1 (due in 1 day). Leitner intervals are 1, 3, 7, 14 and 30 days. On a review: correct with confidence >= 3 moves up one box (past box 5 the question retires, box 6), correct with low confidence keeps the box, and wrong goes back to box 1. The Dashboard "Review" card starts a `kind: 'review'` session with up to 20 due refs (oldest first), or resumes an open one (`findOpenReviewSession`). A review session never generates questions: `takeNextReview` takes the next ref that still exists and is still due, and the page shows "Review complete" when none is left.

**Version migration.** `APP_VERSION` (`src/core/config/constants.ts`) is `__APP_VERSION__`, which `vite.config.ts` `define`s from `package.json`. When it differs from the stored version, `handleVersionMigration` (`src/core/services/version/versionControl.ts`) synchronously deletes every `studorama-*` key that is not in `PRESERVED_STORAGE_KEYS`, then writes the new version. Keys of other apps on the same origin are not touched. Preserved: API settings, multi-provider settings, language, sessions, theme, the version marker, and the two URL-key notice flags. If you add a persisted key, add it to `STORAGE_KEYS`. If it must survive releases, also add it to `PRESERVED_STORAGE_KEYS`.

## Key Directories

|Path|Purpose|
|---|---|
|`src/core/services/ai/`|`AIService`, provider classes, provider/model registry, prompt templates, question parser, error helpers|
|`src/core/services/storage/`|`localStorage` wrapper (no cache: every `getItem` reads the browser, corruption cleanup, `clearAllAppData`). Exported as namespace `localStorage`, which shadows the DOM global in files that import it|
|`src/core/services/{i18n,theme,version,notification}/`|Translations and language detection, theme registry (light, dark, contrast; `resolveTheme` maps retired ids), version migration, toast notifications|
|`src/core/config/`|`constants.ts` (`APP_VERSION`, `STORAGE_KEYS`, `DEFAULTS`, `PRESERVED_STORAGE_KEYS`), `providerSettings.ts`|
|`src/core/utils/`|`runWhenIdle` (`idle.ts`), `createId` (`id.ts`), `setupServiceWorker` (`serviceWorker.ts`)|
|`src/core/types/`|Service-side types: `ai.types.ts` (import directly; not in the barrel), `language.types.ts` (`Language`, `Translations`), theme, api|
|`src/types/index.ts`|Component-side types: `StudySession` (`kind?: 'review'`, `reviewQueue`), `Question` (review schedule and self-explanation fields), `LearningSettings`|
|`src/hooks/`|`useLocalStorage`, `useMultiProviderSettings`, `useLanguage`, `useTheme`, `useVersionControl`, `useApiKeyFromUrl`|
|`src/components/{layout,ui}/`|`Layout` (teal title bar, nav, mobile menu), `ThemeSelector` (title-bar menu)|
|`scripts/`|`version-manager.js`, `deploy.js` (ESM Node scripts) and their tests|
|`public/`|`sw.js`, `manifest.json`, PWA icons (`android-chrome-192x192.png`, `android-chrome-512x512.png`, `maskable-icon-512x512.png`), `logo.png` (JSON-LD), manifest screenshots, SEO files, SPA redirect files|
|`graft/`|Code map generated by trail. Gitignored. Do not edit; `trail build` regenerates it|

## Development Commands

```bash
npm install            # no lockfile is committed (package-lock.json is gitignored)
npm run dev            # Vite dev server, default port 5173
npm run typecheck      # tsc -b; the type gate
npm test               # vitest run (jsdom); tests are colocated *.test.ts / scripts/*.test.js
npm run lint           # eslint . (TS/TSX, scripts/**/*.js, public/sw.js)
npm run build          # tsc -b && vite build -> dist/
npm run preview        # serve dist/ on port 4173
npm run version:info   # read-only
```

A bare `npx tsc --noEmit` checks nothing (`tsconfig.json` has `"files": []`). Use `npm run typecheck`.

**Mutating commands. Run them only when the user asks.**
- `npm run version:{patch,minor,major,bump}` (`bump` = patch) rewrites `package.json`, `public/sw.js` (`CACHE_NAME`), and `index.html` (every `"softwareVersion"`). It computes all three files first and writes nothing if any expected string is missing or malformed; it then exits 1. Only `major`, `minor`, and `patch` are accepted. It makes no git commit.
- `npm run deploy[:patch|:minor|:major]` and `node scripts/deploy.js deploy [type]` run only on `main`. They stop on a dirty tree unless a terminal user confirms, run `npm run lint`, `typecheck`, and `build` before the bump, commit only the three version files, create an annotated `v<version>` tag, and run `git push --atomic origin main refs/tags/v<version>`. Any failure exits non-zero; a failed commit restores the three files. A bare `node scripts/deploy.js` prints usage. Test changes to these scripts in a throwaway clone whose `origin` is a local bare repo.

## Code Conventions & Common Patterns

- **TypeScript**: `strict`, `noUnusedLocals`, and `noUnusedParameters` (`tsconfig.app.json`). `lib` is ES2020, so ES2021+ APIs (`replaceAll`, `.at()`, `Object.hasOwn`) fail `tsc`.
- **Imports**: relative and extensionless. The repo has no path alias (no `@/`). Barrels: `src/hooks/index.ts`, `src/core/services/index.ts` (excludes `ai`), `src/core/services/ai/index.ts`, `src/core/types/index.ts` (excludes `ai.types`).
- **Naming**: components are PascalCase `.tsx` with a default export and `interface XProps`. Hooks are `useX.ts` with named exports. Services are `src/core/services/<domain>/<camelCase>.ts` with an `index.ts` barrel. Types are `*.types.ts`. Constants are `UPPER_SNAKE`. Storage keys are `studorama-*` (the former app name; keep the prefix for new keys too, because `clearAllAppData` and the version migration select keys by it).
- **Formatting**: the repo has no Prettier or EditorConfig, and quote style is mixed (`StudyPage.tsx` uses double quotes, most files use single). Use the style of the file you edit.
- **Registry pattern (no DI container)**: a typed `Record<Union, Config>` plus `getX` and `getLocalizedX(id, language)` getters. Examples: `AI_PROVIDERS` (`providers/registry.ts`), `themes` (`theme/themeRegistry.ts`), `PROMPT_TEMPLATES` (`prompts/promptRegistry.ts`), `translationsMap` (`i18n/translations/index.ts`). Ids are string-literal unions: `AIProvider` (derived from `AI_PROVIDER_IDS`), `Theme`, `Language`.
- **Errors**: providers throw `AIError` (`core/types/ai.types.ts`) through `createAIError` / `createHTTPError` / `toAIError` (`ai/errors.ts`). Pages show `getAIErrorMessage(error, t)` through `setError`, never the raw English `error.message`. Storage helpers catch, log with `console.error`, and return a default value or `false`.
- **Async**: `async/await` inside `try/catch`. Deferred work uses `runWhenIdle` (never bare `requestIdleCallback`; Safari lacks it). Redirects use `setTimeout`.
- **State updates**: use functional updates (`setSessions(prev => …)`) and never mutate the previous state (see `components/pages/sessionEdits.ts`). Use `STORAGE_KEYS`, not string literals.
- **IDs**: use `createId()` (`src/core/utils/id.ts`). `crypto.randomUUID` alone throws on insecure origins (http on a LAN IP).
- **Env**: `import.meta.env.DEV` / `PROD` only. The app reads no other env vars.
- **Tests**: Vitest + jsdom, colocated `*.test.ts`; `scripts/*.test.js` start with `// @vitest-environment node`. Test behavior, not wiring.
- **i18n**: to add a string, add the key to `Translations` (`src/core/types/language.types.ts`), add the value to `translations/en-US.ts` and `translations/pt-BR.ts`, and read it with `const { t } = useLanguage(); t.key`. Outside React (hooks that `useLanguage` depends on, services, registries), use `getTranslations(language)`. Interpolate with `formatMessage(template, vars)` (`{name}` placeholders); plurals are separate `…One` / `…Other` keys. Do not write `language === 'pt-BR' ? … : …` in components or services; the only per-language text outside `Translations` is model input, which lives in `promptRegistry.ts` (`PROMPT_TEMPLATES`, `PROMPT_FRAGMENTS`). Model descriptions are `(t) => string` on each model, so `tsc` reports a missing one. Only `tsc` enforces that the two locales match. UI labels use sentence case in both locales; aria-labels are translated too.
- **Design system**: flat "Metropolis" grammar (direction contract in `.impeccable/surfaces/src-app-tsx.md`; tokens and rules in `DESIGN.md`). Type is Fira Sans / Fira Mono, self-hosted via `@fontsource` imports in `main.tsx`. Style with Tailwind semantic colour classes (`bg-shell`, `bg-ground`, `bg-surface`, `bg-sunken`, `text-ink`, `text-ink-soft`, `text-ink-muted`, `border-line`, `border-line-strong`, `bg-primary`, `text-accent-ink`, `text-success-ink`, `text-error-ink`, …) and the component classes in `src/index.css` (`.page`, `.page-title`, `.section-title`, `.btn-*`, `.field`, `.choice`, `.segmented`, `.tabs`, `.block`, `.notice`, `.data-table`, `.facts`, `.tag`, `.option`, `.progress-rule`, `.loading-rule`, `.menu`). Do not use `themeConfig` or hex values in components, Tailwind palette colours (`gray-*`, `orange-*`), gradients, or shadows on content (only menus and dialogs use `.overlay-shadow`). Orange (`accent`) is reserved for progress and the current item; the primary button is teal (`primary`).
- **Theming**: `useTheme()` (mounted by `Layout`) calls `applyTheme(id)`, which writes `themeConfig.colors` to `--color-*` on `<html>`, sets `data-theme` and `color-scheme`, and updates `<meta name="theme-color">`. `tailwind.config.js` maps the semantic classes to those variables, so they take no `/opacity` modifier; tints use `color-mix(in srgb, var(--color-success) 12%, var(--color-surface))` in CSS. `src/index.css` repeats the light tokens in `:root` for the first paint, and the inline boot script in `index.html` marks stored dark themes (`data-boot`) to avoid a light flash. Color tokens are 6-digit hex. `themeRegistry.test.ts` enforces WCAG AA contrast for every theme: run it after changing a colour.
- **Adding an AI provider**:
  1. Add the id to `AI_PROVIDER_IDS` in `ai.types.ts` and a default entry to `DEFAULT_MULTI_PROVIDER_SETTINGS`.
  2. Create a `providers/<id>.ts` class with `generateCompletion` that throws through `createAIError` / `toAIError`.
  3. Register the class in the `AIService` constructor `Record`.
  4. Add a `<ID>_MODELS` array (suggestions only) and an `AI_PROVIDERS` entry in `registry.ts`. Because the type is `Record<AIProvider, …>`, `tsc` reports a missing entry.
  5. Add the provider's text keys to `Translations` and the `getLocalized*` switch cases that read them.
  6. Add key detection in `detectProviderFromApiKey` (`useApiKeyFromUrl.ts`) if the key prefix is unique.

  The Settings UI shows the new provider through `getAllProviders()`. Model ids are free-form: `validateProviderConfig` accepts any non-empty id, and the registry models are suggestions in a `<datalist>`.

**Traps**
- URL key detection: `sk-ant-` → Anthropic, `sk-` → OpenAI, `AIza` → Gemini. DeepSeek keys also start with `sk-`, so they need an explicit `provider=deepseek`. An unknown `provider=` value stores nothing and shows an error notice.
- The Gemini provider sends the API key in the `x-goog-api-key` header. Google's CORS preflight allows that header from browser origins.
- Learning techniques: `LearningSettings` has 5 toggles. The thresholds are in `learningTechniques.ts`: a review comes 3 questions after a miss or a low-confidence correct answer, at most 2 reviews per question in a session; the level goes up after 3 correct answers in a row at that level and down after 2 misses. Review copies keep their original difficulty, so they do not count toward a streak at another level. Old stored sessions can hold extra toggle keys; `normalizeLearningSettings` drops them.
- A model that returns other than 4 options, an evaluation without the score block, or an empty explanation feedback is rejected (`INVALID_RESPONSE`). The service retries once, then the page shows a localized error.
- Code blocks use `PrismLight` with a fixed language list in `MarkdownRenderer.tsx` (aliases such as `js`, `py`, `sh`, `c#`, `c++` map to it). A language that is not registered renders as plain text; register it there to highlight it. Code colours come from CSS variables, so they follow the theme.
- Math: `src/components/markdownMath.ts` converts only real delimiters (`$…$`, `$$…$$`, `\(…\)`, `\[…\]`, and ```` ```math ```` fences) to Unicode text in the body font, and skips code. Plain text with Greek letters or hyphens is left alone (`MarkdownRenderer.test.ts`).
- Multiple-choice questions store the model's `explanation` (`Question.explanation`); review copies carry it. Sessions created before 2026-11-06 have none, and the UI omits the Explanation block for them.
- Version strings: do not edit them by hand. `version-manager.js` needs exact shapes (`const CACHE_NAME = 'lembrion-v…';` once in `public/sw.js`, `"softwareVersion": "…"` in `index.html`) and fails loudly when they change.
- Unread `Translations` keys were deleted on 2026-11-06 (after the redesign). No code reads a key by computed name (`t[...]`); keep it that way, so `tsc` catches a key deleted by mistake.
- SPA fallback rules are in four files: `vercel.json`, `netlify.toml`, `public/_redirects`, and `public/.htaccess`. URLs are root-absolute, so the app must be deployed at `/`.
- `color-mix()` needs Chrome 111+, Safari 16.2+, or Firefox 113+; older browsers drop those tint rules.

## Important Files

- `index.html`: the entry, the static English loader (with the inline `.loading-spinner` style), SEO/JSON-LD blocks, and the link-preview tags (`og:image` and `twitter:image` point to `public/og-image.png`, 1200×630). Keep JSON-LD claims true to the code (no ratings, no unsupported features).
- `src/App.tsx`: the module-load side effects, the version gate, and the routes.
- `src/core/config/constants.ts`: `APP_VERSION`, `STORAGE_KEYS`, `DEFAULTS`, `PRESERVED_STORAGE_KEYS`.
- `src/core/services/ai/aiService.ts`, `questionParser.ts`, `errors.ts`, `providers/registry.ts`, `prompts/promptRegistry.ts`: the AI pipeline, validation, error mapping, providers and models, and prompts.
- `src/components/pages/StudyPage/StudyPage.tsx`: the session lifecycle. `learningTechniques.ts` next to it: the in-session review, interleaving, difficulty, and score rules. `reviewSchedule.ts`: the review queue across sessions.
- `public/sw.js`: network-first. It caches only `/`, `/index.html`, and `/manifest.json`. `CACHE_NAME` is a literal that the version manager updates.
- `vite.config.ts`: `define: { __APP_VERSION__ }`, `manualChunks` (vendor, router, icons), esbuild minify, no sourcemaps, preview port 4173, and the Vitest `test` block.
- `eslint.config.js`: TS/TSX (browser globals), `scripts/**/*.js` and `*.config.js` (Node globals), `public/sw.js` (service-worker globals).

## Runtime/Tooling Preferences

- Use Node with npm. The repo does not pin a version (no `engines`, no `.nvmrc`). Vite 5, ESLint 9, Vitest 3, and jsdom 26 need Node 18.18 or later. These checks ran on Node 22.23 with npm 10.9.
- Everything is ESM (`"type": "module"`). Node scripts must use `import`, not `require`.
- Code navigation: trail tools (`trail_find_code`, `trail_trace_calls`) read `graft/`. trail misses JSX element uses, constants, and type-only imports, so grep `src/` before you delete a symbol. `.ignore` lets ripgrep search `graft/` cards, so scope greps to `src/`, `scripts/`, or `public/`.

## Testing & QA

- Vitest + jsdom regression tests cover the storage migration, `clearAllAppData`, `useLocalStorage` writes, URL key detection, `?lang`, question and evaluation parsing, the retry rule, AI error messages, explanation feedback, provider requests, the registry validation, theme contrast and retired theme ids, markdown math conversion, service-worker gating, session edits, `formatMessage`, the learning-technique and score rules, the review schedule, and the version manager. There is no CI (`.github/` holds only `FUNDING.yml`) and no coverage target.
- Baseline checks (2026-11-06, after the redesign):

|Check|Result|
|---|---|
|`npm run lint`|0 problems|
|`npm run typecheck`|0 errors|
|`npm test`|18 files, 188 tests pass|
|`npm run build`|Passes with no chunk warning. The largest chunk is `MarkdownRenderer` (~275 kB); Fira font files ship as separate assets|

- Verification loop: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, then `npm run dev` or `npm run preview`, and test the changed routes in a browser.
- Browser smoke notes:
  - The dev server and local previews unregister leftover service workers on load.
  - `/study` needs a configured provider. Ollama (`http://localhost:11434/v1`) needs no key, but browser origins need `OLLAMA_ORIGINS`. Any OpenAI-compatible server with CORS works as the Ollama base URL, so a small local mock of `POST /v1/chat/completions` can drive the full study flow. A mock can tell the calls apart: question generation sends a `system` message; evaluation is a single `user` message that contains `"score"`; explanation feedback is a single `user` message from the `explanationFeedback` template ("supportive tutor"); anything else is the elaborative question. Return HTTP 500 once to test the retry. To seed a key, open `/?provider=openai&apikey=sk-…&model=gpt-4o-mini`.
  - To test the review queue without waiting, set `nextReview` of scheduled questions in `studorama-sessions` to a past time and reload the Dashboard.
  - The language setting is stored as an object, not a string. Use `?lang=pt-BR` to switch language in a test.
  - `/session/:id` needs a session in `studorama-sessions`.
  - Version values in `localStorage` are JSON strings: set `studorama-app-version` to `"\"2.6.2\""` to simulate an upgrade.
