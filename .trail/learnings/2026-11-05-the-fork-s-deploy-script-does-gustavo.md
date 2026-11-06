---
title: "The fork's deploy script does not reach studorama.vercel.app"
author: Gustavo
date: 2026-11-05
branch: main
id: l-6efffc50
scope: repo
status: active
src: agent
touches:
  - AGENTS.md
  - README.md
  - index.html
  - package.json
  - src/App.tsx
  - src/components/LoadingScreen.tsx
  - src/components/MarkdownRenderer.tsx
  - src/components/SessionDetails.tsx
  - src/components/SessionEditModal.tsx
  - src/components/layout/Layout.tsx
---

## Decided
- `studorama.vercel.app` is the upstream owner's Vercel project. It deploys from `oluiscabral/studorama` (GitHub deployments for that repo list it; the fork `gustavokch/studorama` has none). The fork has no push access upstream.
- The fork will get its own Vercel project. When its domain exists, every absolute `studorama.vercel.app` URL moves to it; repository links stay on `gustavokch/studorama`.
- Resuming a session must show an already-answered current question in its feedback state. Before this, the resume path reset the UI, so the same question could be answered again; in a review session that moved the Leitner box twice.

## Tried and ruled out
- Treating `npm run deploy` as a production release: it pushed `v2.7.0` to the fork, and the live site still served 2.6.3 (static assets added in that release returned the SPA HTML).

## In the code:
- scripts/deploy.js (pushes to `origin`, the fork)
- index.html, public/sitemap.xml, public/robots.txt, README.md (absolute URLs)
- src/components/pages/StudyPage/StudyPage.tsx (resume effect, `submitAnswer` guard)
- src/components/pages/StudyPage/reviewSchedule.ts (`takeNextReview`, `findOpenReviewSession`)
