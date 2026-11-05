# Learning techniques, difficulty, and dissertative grading

Date: 2026-11-05. Status: approved and implemented 2026-11-05.

## Problem

- Only `elaborativeInterrogation` changes behavior. The other 6 `LearningSettings` toggles do nothing.
- `StudyPage` checks the setup-form toggles, not `currentSession.learningSettings`. A resumed or edited session ignores its own settings.
- Every request uses `difficulty: "medium"`.
- Dissertative answers get `isCorrect` and `score` from English keyword counts on the model's markdown (`determineCorrectness`, `calculateScore` in `aiService.ts`). pt-BR feedback is graded on English words.
- The elaborative answer textarea is never saved.

## Decisions (user, 2026-11-05)

| Toggle | Outcome |
|---|---|
| interleaving | real behavior |
| spacedRepetition | real behavior, within a session only |
| desirableDifficulties | drives adaptive difficulty |
| selfExplanation | real behavior |
| elaborativeInterrogation | unchanged, plus its answer is saved |
| retrievalPractice | removed (every session is retrieval practice) |
| generationEffect | removed |

Difficulty: a setup selector plus adaptive steps when `desirableDifficulties` is on.
Grading: markdown feedback plus a trailing JSON verdict block.

## Data model (`src/types/index.ts`)

```ts
type Difficulty = 'easy' | 'medium' | 'hard';

interface LearningSettings {
  spacedRepetition: boolean;
  interleaving: boolean;
  elaborativeInterrogation: boolean;
  selfExplanation: boolean;
  desirableDifficulties: boolean;
}

interface StudySession {
  // ...existing
  difficulty?: Difficulty;      // current level; missing = 'medium'
}

interface Question {
  // ...existing
  difficulty?: Difficulty;      // the level requested, not the model's echo
  context?: string;             // interleaving focus context
  reviewOf?: string;            // id of the missed question this repeats
  reviewCount?: number;         // 1 for the first review copy, 2 for the second
  evaluationCriteria?: string[];
  score?: number;               // 0-100, dissertative only
  elaborativeQuestion?: string;
  elaborativeAnswer?: string;
  selfExplanation?: string;
}
```

Removed as dead: `retrievalPractice`, `generationEffect`, `SpacedRepetitionData`, `StudySession.spacedRepetition`, `StudySession.preloadedQuestions`, `Question.lastReviewed`, `nextReview`, `retrievalStrength`, `isPreloaded`. No code writes them (checked with `rg`).

Stored sessions need no version migration. `normalizeLearningSettings(raw)` reads the 5 known keys, defaults missing ones to `true`, and drops unknown keys. It runs wherever a session's settings are read (StudyPage, SessionEditModal).

## Pure logic: `src/components/pages/StudyPage/learningTechniques.ts`

Next to `sessionEdits.ts` in style. No React, no storage, randomness injected.

- `normalizeLearningSettings(raw?: Partial<LearningSettings>): LearningSettings`
- `nextDifficulty(questions, current): Difficulty`. Considers answered questions at the `current` level only. The last 3 are correct: step up (capped at `hard`). The last 2 are wrong: step down (capped at `easy`). Otherwise the level stays. After a step, the streak restarts by itself, because older questions have another level.
- `nextFocusContext(questions, contexts): string | undefined`. Returns `undefined` for fewer than 2 contexts. Otherwise it returns the context after the `context` of the last non-review question, wrapping around. It starts at `contexts[0]` and also when the last context was removed in an edit.
- `findDueReview(questions, gap = 3, maxReviews = 2): Question | undefined`. A question is due when:
  - it is an original (`reviewOf` unset);
  - its latest attempt (the original or its last review copy) is answered wrong;
  - at least `gap` questions come after that attempt;
  - fewer than `maxReviews` copies exist.
  It returns the oldest due question.
- `createReviewCopy(original, priorCopies, createId, random): Question`. Gives a new id, sets `reviewOf` and `reviewCount`, clears the answer fields, and copies the evaluation criteria. For multiple choice it shuffles the options and remaps `correctAnswer`, so the user cannot answer from the position.

## Study flow (`StudyPage.tsx`)

The session settings (normalized) replace the setup-form state after the session starts. This fixes the resume and edit bug.

`generateNextQuestion(session)`:
1. If `spacedRepetition` is on and `findDueReview` returns a question, append a review copy. This makes no API call.
2. Else call `aiService.generateQuestion` with:
   - `difficulty: session.difficulty ?? 'medium'`;
   - `focusContext: interleaving ? nextFocusContext(...) : undefined`.
   Store `question.context`, the requested `difficulty`, and `evaluationCriteria`.

`submitAnswer`:
1. Grade as today. Dissertative answers also store `score`.
2. If `desirableDifficulties` is on, set `session.difficulty = nextDifficulty(...)`.
3. Follow-up prompt (only one is shown):
   - wrong answer with `elaborativeInterrogation` on: the existing elaborative question;
   - wrong answer with `elaborativeInterrogation` off, or any correct answer, with `selfExplanation` on: an "Explain in your own words why the correct answer is right" textarea. It makes no API call.
4. `nextQuestion` saves the elaborative question, its answer, and `selfExplanation` on the current question before it advances.

The session score stays "% of questions with `isCorrect`". Review copies count as questions.

Setup UI changes:
- A segmented Easy/Medium/Hard selector below the question type.
- The 5 toggles. The `*Desc` texts are rewritten to state the real behavior (for example, "Missed questions come back after 3 new ones, up to 2 times").

## AI layer

- `QuestionGenerationRequest.focusContext?: string`. When set, `getEnhancedUserPrompt` appends one sentence (en-US and pt-BR): "Focus this question on: <context>. The other contexts only define scope." The system template is unchanged.
- `AnswerEvaluationRequest.evaluationCriteria?: string[]`. The evaluation prompt (both languages) gets:
  - a `{criteria}` variable;
  - a closing rule: end with exactly one fenced block ```` ```json {"score": <integer 0-100>} ``` ````, based on correctness against the sample answer and criteria.
- `parseEvaluationResponse(content, provider): { feedback, score }` in `questionParser.ts`. It takes the last fenced `json` block, requires a finite `score` (rounded and clamped to 0-100), and removes the block from `feedback`. A missing or invalid block throws a retryable `INVALID_RESPONSE`.
- `evaluateAnswer` uses the same `INVALID_RESPONSE` retry helper as `generateQuestion` (added in the error-localization fix). `isCorrect = score >= PASS_SCORE` (`PASS_SCORE = 70`, exported from `aiService.ts`). Delete `determineCorrectness` and `calculateScore`.

## Edit modal and details

- `SessionEditModal`: the 5 toggles, a difficulty selector, and `difficulty` added to `SessionEditUpdates` (`sessionEdits.ts`).
- `SessionDetails`, per question:
  - a difficulty chip;
  - a "Review" chip on review copies;
  - `score/100` on dissertative questions;
  - the elaborative question and answer, and the self-explanation, when present.

## i18n

New keys go to `Translations` plus both locales: the difficulty labels, the self-explanation prompt and placeholder, the review chip, and the score label. Delete the `retrievalPractice*` and `generationEffect*` keys.

## Tests

- `learningTechniques.test.ts`:
  - difficulty step up at 3 and down at 2, clamped at both ends, and a mixed-level history;
  - rotation wrap, fewer than 2 contexts, removed context, review copies skipped;
  - review due exactly at the gap and not before, the cap, correct reviews ending the cycle, and the oldest due question first;
  - the shuffle keeps `options[correctAnswer]` the same.
- `questionParser.test.ts` or `aiService.test.ts`:
  - verdict extraction and stripping;
  - a missing block, a non-numeric score and an out-of-range score;
  - a pt-BR feedback with a score of 85 gives `isCorrect` true (the old keyword heuristic would fail on this);
  - one retry on a missing block.
- `sessionEdits.test.ts`: update the fixture to the new `LearningSettings`.

## Out of scope

- Review scheduling across sessions (SM-2, dashboard queue).
- AI grading of the self-explanation text.
- Changes to multiple-choice grading.

## Verification

1. `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
2. A browser run against a local mock `POST /v1/chat/completions` (configured as the Ollama base URL) with scripted replies. It covers:
   - interleaved focus contexts in the request bodies;
   - a review copy after 3 questions with the options shuffled;
   - a difficulty step after 3 correct answers;
   - a dissertative score from the verdict block, and a retry when the block is missing;
   - the self-explanation saved and shown in `/session/:id`.
