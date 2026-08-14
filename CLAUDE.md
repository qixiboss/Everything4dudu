# CLAUDE.md

## Overview

Everything 4 Dudu is a static GitHub Pages portal. `site/` is the single source of truth and the exact directory deployed to Pages. It contains the portal home page plus WordTales, training, exam schedule, CostTrace, and changelog. Do not introduce a second generated site directory or a build-time HTML injection layer.

All applications share the same Supabase email/password session. Public signup is disabled; browser code only uses the publishable key in `site/shared/config.js`.

## Commands

```sh
npm test                 # Node tests over tests/*.test.js and tests/**/*.test.js
npm run check            # static integrity checks for site/words
npm run verify           # test + check; required before deployment
cd site && python3 -m http.server 8000
```

Node >= 22 is required. There is intentionally no `npm run build`: static files in `site/` are edited and deployed directly.

## Architecture

- `site/index.html` and `site/shared/home.*` provide the mobile-style portal and login dialog.
- `site/words/`, `site/training/`, `site/exam-schedule/`, `site/CostTrace/`, and `site/changelog/` are complete static applications with direct `index.html` entries.
- `site/shared/` provides the shared Supabase client, authentication, app route guard, local-first synchronization engine, and return-to-home shell.
- Each application keeps its synchronization adapter beside its own code: `site/words/js/hub-sync.js`, `site/training/hub-sync.js`, and `site/exam-schedule/hub-sync.js`.
- `scripts/site-contract.js` is the authoritative contract for portal routes and the shared-script sequence. Keep it aligned with application HTML when adding or reordering shared runtime scripts.

Browser scripts are ES5-style IIFEs without a bundler. Keep source files readable and split by responsibility; do not compress or combine them merely to reduce file count.

## Tests and deployment

`tests/portal.test.js` checks routes, authentication boundaries, shared runtime order, deployment configuration, and migrations. `tests/wordtales/` executes the integrated WordTales code from `site/` in a browser-like VM. `scripts/check-integrity.js` validates WordTales assets, corpus, audio cues, script order, and FSRS behavior.

The Pages workflow runs `npm run verify` and uploads `site/`. All routes must stay relative so deployment under `/Everything4dudu/` continues to work. Do not add an external app checkout, an app-specific CI workflow, or an alternate deployment directory.

## Supabase and local data

Migrations in `supabase/migrations/` are authoritative. The current runtime syncs only the four per-app item tables; legacy `learning_profiles` is not read or written. Preserve existing localStorage keys, per-account backup behavior, and RLS restrictions whenever changing synchronization.

Development credentials, when needed, belong only in the ignored `.dev-test-account.local.md` file. Never commit account credentials, service-role keys, or other secrets.

## Historical reference

`docs/legacy/` contains imported application notes, licences, and audio-maintenance material. It is reference-only: it is not deployed, tested, or authoritative for the current site architecture.
