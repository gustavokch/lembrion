# Review queue across sessions, and AI feedback on self-explanations

Date: 2026-11-05. Status: approved and implemented 2026-11-05.

## Problem

- Spaced repetition works inside one session only. A question missed today never comes back in a later session.
- The self-explanation text is saved, but nobody tells the learner whether the explanation is right.

## A. Review queue across sessions

### Source of truth

The schedule is stored on the original question, in its own session (`STORAGE_KEYS.SESSIONS`). There is no new storage key. As a result:

- Deleting a session removes its review items too.
- The version migration keeps the schedule (sessions are preserved).
- `clearAllAppData` removes it.

New `Question` fields:

```ts
reviewBox?: number;        // 1-5 while scheduled; 6 = retired
nextReview?: string;       // ISO time the question is due; unset when retired or never scheduled
```

Review-session copies also carry `sourceSessionId?: string`, next to the existing `reviewOf` (the original question id).

### Entry

An original question (not a copy) enters the queue when both are true:
- it is answered wrong, or correct with confidence <= 2 (the existing low-confidence threshold);
- its session has `spacedRepetition` on.

It enters at box 1, due in 1 day. A question already in the queue keeps its schedule. In-session reviews do not change the schedule.

### Schedule (Leitner boxes)

| Box | Interval |
|---|---|
| 1 | 1 day |
| 2 | 3 days |
| 3 | 7 days |
| 4 | 14 days |
| 5 | 30 days |

How a review answer moves the question:
- **Correct, confidence >= 3:** up one box; due after that box's interval. Passing box 5 retires the question (box 6, `nextReview` unset).
- **Correct, confidence <= 2:** same box; due after that box's interval.
- **Wrong:** back to box 1; due in 1 day.

### Review session

- The Dashboard shows a "Review" card with the number of due questions and a "Start review" button. With 0 due, the button is disabled and the card shows the next due date. With nothing scheduled, the card is hidden.
- "Start review" creates a `StudySession` with:
  - `kind: 'review'`;
  - `reviewQueue: { sessionId, questionId }[]`: up to 20 due questions, oldest due first;
  - `contexts`: the unique contexts of the source sessions;
  - learning settings: elaborative interrogation and self-explanation as in the defaults; spaced repetition, interleaving and desirable difficulties off. The queue is the spacing.
- `generateNextQuestion` in a review session takes the next ref and appends a copy: options shuffled, `reviewOf`, `sourceSessionId`. It makes no API call. A ref whose source session or question no longer exists is skipped.
- `submitAnswer` grades as usual (dissertative answers still call `evaluateAnswer`). It then updates the original question's `reviewBox` and `nextReview` in its source session with one functional `setSessions` update.
- When the queue is empty, the page shows a "Review complete" panel with the score and "End Session". A review session never generates new questions.
- History and Dashboard show review sessions with a "Review" label. The score uses the same `sessionScore` helper.

### Pure logic (`StudyPage/reviewSchedule.ts`)

- `enterQueue(question, now)`
- `applyReviewResult(question, isCorrect, confidence, now)`
- `dueReviews(sessions, now, limit = 20)`
- `nextDueDate(sessions)`

`now` is passed in, so tests control time.

## B. AI feedback on self-explanations

- The self-explanation panel gets a "Get feedback" button, enabled when the text is not empty. Clicking it calls `aiService.evaluateExplanation({ question, correctAnswer, explanation, language })`:
  - for multiple choice, `correctAnswer` is `options[correctAnswer]`;
  - for dissertative questions, it is the sample answer.
- New prompt template `explanationFeedback` (en-US and pt-BR) in `promptRegistry.ts`. It asks for markdown under 120 words: what is right, what is missing or wrong, and no score. The request uses the same single-`user`-message shape and the same retry rule as evaluation.
- The feedback shows below the textarea. Both texts are saved on the question at once (`selfExplanation`, `selfExplanationFeedback`), so leaving the page keeps them. `SessionDetails` shows the feedback under the self-explanation.
- Feedback does not change `isCorrect`, the score, or the review schedule.
- "Next Question" without a click saves the text and makes no API call.
- Errors show inline in the panel through `getAIErrorMessage`.

## i18n

New keys in `Translations` and both locales:
- the Review card title, due count, next-due text and "Start review";
- the "Review complete" panel text;
- the "Review" session label;
- "Get feedback", and the feedback heading.

## Tests

- `reviewSchedule.test.ts`:
  - entry rules (wrong, low-confidence correct, high-confidence correct, spaced repetition off, already queued);
  - box moves for each outcome;
  - retiring after box 5;
  - interval arithmetic;
  - `dueReviews` order and limit;
  - missing sources skipped;
  - `nextDueDate`.
- `aiService.test.ts`: `evaluateExplanation` builds the prompt in both languages and returns the markdown.

## Out of scope

- Ease factors per question (SM-2) and notifications.
- Feedback on elaborative answers.
- Sync across devices.

## Verification

Run the gates. Then, in the browser with the mock server:
- miss a question;
- move the clock 1 day ahead by changing `nextReview` in storage;
- see the Dashboard card;
- run the review: answer right with confidence 4 and check box 2 is due in 3 days;
- check the "Review complete" panel;
- get feedback on a self-explanation and see it in session details.
