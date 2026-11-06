---
title: Renamed the app to Lembrion but kept the studorama storage keys
author: Gustavo
date: 2026-11-06
branch: main
id: l-07eb3a5c
scope: repo
status: active
src: agent
touches:
  - AGENTS.md
  - LICENSE
  - README.md
  - index.html
  - package.json
  - public/android-chrome-192x192.png
  - public/android-chrome-512x512.png
  - public/apple-touch-icon-114x114.png
  - public/apple-touch-icon-120x120.png
  - public/apple-touch-icon-144x144.png
---

## Decided
- The fork's user-visible name is Lembrion (repo gustavokch/lembrion, URL lembrion.vercel.app). Chosen for being readable in English and Portuguese (root "lembrar", remember) and free as .vercel.app, .com, .app and .com.br on 2026-11-06.
- localStorage keys keep the `studorama-` prefix. Changing STORAGE_KEYS values would make existing sessions and API keys unreadable, and the version migration deletes unknown `studorama-*` keys. An upgrade from 2.6.3 was tested in the browser: all sessions and the API key survived.
- The service-worker cache prefix did change to `lembrion-v`: the activate handler deletes every other cache, so nothing is lost.
- Studorama stays credited: LICENSE keeps the 2025 oluiscabral line, README and JSON-LD `isBasedOn` name it.

## Tried and ruled out
- Short real words (Fixa, Lembra, Memora, Revisa, Engram, Studia): every .com taken.
- Memora, Mnemora, Engramo: existing study or memory apps. Stickwise: a UK hockey coaching brand. Lembrix: a registered Belgian company.

## In the code:
- src/core/config/constants.ts (STORAGE_KEYS, PRESERVED_STORAGE_KEYS)
- public/sw.js (CACHE_NAME), scripts/version-manager.js (CACHE_NAME_RE)
- index.html (isBasedOn), LICENSE, README.md
