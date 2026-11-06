---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/components/layout/Layout.tsx","src/components/pages/Dashboard.tsx","src/components/pages/StudyPage/StudyPage.tsx","src/components/pages/SessionHistory.tsx","src/components/SessionDetails.tsx","src/components/pages/SettingsPage/SettingsPage.tsx","src/components/pricing/PricingPage.tsx"]
---

# lembrion app shell and pages

Scope: every route (Dashboard, Study setup and question loop, History, Session details, Settings, Support). Mode: Operate.

Audience and task: university students and self-directed adults; desk sessions of 20-60 minutes and short phone sessions. Fast path to the next question; progress overview first on the Dashboard; the question loop keeps the options, the user's pick, the correct answer and the explanation visible after grading.

Constraints: no skeuomorphism (user-stated). No gradients, glow, icon tiles, marketing tone, or rounded bubbly cards (user-named "toyish" traits); panels at most 6px radius. The one tile is the brand mark before the lowercase wordmark, which the user asked for (2026-11-06). Must not resemble Metropolis (teal bar, orange) or the user's Signal Box proxy (ink plate bar, enamel grey, amber). Dark is the default theme, with a neutral untinted grey ground; Light, System and High contrast stay selectable. en-US and pt-BR. Sessions are open-ended; review sessions know their queue.

## Direction contract

THESIS: Every question is on loan to your memory and comes back stamped with its due date. A calm, conventional study-app shell carries one library ritual, the date-due slip; it refuses both the gamified edtech dashboard and the dark-bar control panel.

OWN-WORLD: Circulation desk fused with the category standard. Standard left sidebar and bordered panels (1px, 6px radius) on a neutral ground (dark #121212 / panels #181818; light #f7f7f8 / white). Libre Franklin for UI; Archivo Narrow caps for date stamps, call numbers and figures. Stamp violet only on what is due or actionable (active nav as a filled spine label, primary button, stamps, loan bars, links). Printed slip red only on the due slip's header print and on overdue.

STORY: The learner sees progress first, then the slip of questions due for return (oldest and overdue first), returns them in one action, and after each answer sees exactly what was right and when that question comes back.

FIRST VIEWPORT: Dashboard. Sidebar (wordmark, Dashboard, Study, History, Settings; Support and theme at the foot). Header: title, date, New session. Row 1: Progress table (last 7 days / all time; sessions, answered, accuracy in Archivo Narrow figures) and the unfinished session with Resume. Row 2, the centre: the "Due for return" slip: call number, question, topic, box, boxed date stamp (violet due, red overdue), then not-yet-due rows muted, and "Start review · N due". Row 3: recent sessions with call numbers, and loan periods drawn to exact length.

FORM: Circulation Desk (library date-due slips and rubber date stamps), assigned candidate 3 of 7, blended by the user with the category standard, dark by default; seed:35601669c20b5f2b. Raises: hierarchy by type scale and weight alone; every question carries a call number and one mark state (due, returned, overdue); violet only where something is due or actionable; loan periods drawn to exact length; topic extent shown proportionally. Signature interaction: after grading, the question's return stamp lands ("Back 07 NOV · Box 1").

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md and design.json, and every shipping raster carrying its provenance.

Unresolved: none.
