---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/components/layout/Layout.tsx","src/components/pages/Dashboard.tsx","src/components/pages/StudyPage/StudyPage.tsx","src/components/pages/SessionHistory.tsx","src/components/SessionDetails.tsx","src/components/pages/SettingsPage/SettingsPage.tsx","src/components/pricing/PricingPage.tsx"]
---

# Lembrion app shell and pages

Scope: every route (Dashboard, Study setup and question loop, History, Session details, Settings, Support). Mode: Operate.

Audience and task: university students and self-directed adults; desk sessions of 20-60 minutes and short phone sessions. Fast path to the next question; progress overview first on the Dashboard; the question loop must keep the options, the user's pick, the correct answer, and the explanation visible after grading.

Constraints: no skeuomorphism (user-stated). No gradients, glow, icon tiles, marketing tone, or stacked shadowed cards (user-named "toyish" traits). Theme picker stays with a reduced set. en-US and pt-BR. Sessions are open-ended (no planned question count); review sessions know their queue.

## Direction contract

THESIS: A study tool set like a well-made lecture deck: one title bar, one idea per frame, a progress line that records the session. It refuses the edtech dashboard of stat tiles, gradient CTAs, and icon cards.

OWN-WORLD: Metropolis Beamer grammar, flat. Dark teal #23373b title bar with white Fira Sans; light #fafafa ground; Metropolis orange #eb811b only for progress and the current item; titled blocks (teal title strip, pale teal-grey body) for explanation and feedback; green/red state only where an answer is graded; tabular figures right-aligned; hierarchy by size and weight, no shadows on content.

STORY: The learner sees where they stand (sessions, accuracy, reviews due, boxes), starts or resumes in one click, answers, and sees exactly what was right and why before moving on.

FIRST VIEWPORT: Dashboard. Teal title bar with wordmark, nav, theme control. Below, a two-column frame: left, a dense progress table and the five review boxes drawn at true interval scale; right, the actions (Review due, Resume, New session). Recent sessions table under it. Study screen: progress line under the bar, question at a 65ch measure, options as rows, session facts in a right column.

FORM: Metropolis Slides (Beamer theme), candidate 6 of 7 on re-roll 1; seed:ccc6de617daede6d. Raises: hierarchy by type not boxes; right-aligned tabular counts; controls show exact values; one shared scale for box strips; fixed topic roster with the same facts.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Unresolved: none.
