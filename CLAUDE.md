# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Everything 4 Dudu is a mobile-style home-page portal (GitHub Pages site) that unifies three independently-developed apps — WordTales (vocabulary learning), Train_record (training log), and the Graduate Entrance Exam Schedule — plus a portal-owned changelog app. All apps share a single Supabase email/password login (pre-created accounts only, no public signup) and sync learning data across devices through the same account.

`words/`, `training/`, `exam-schedule/` are **generated directories**: they are rebuilt from checked-out copies of the upstream repos and committed. Do not edit them directly — edits are overwritten on the next sync. The only hand-maintained app is `changelog/`. The home page (`index.html` + `shared/home.js` + `shared/home.css`) is also hand-maintained.

## Commands

```sh
npm test                 # node --test over tests/*.test.js and tests/**/*.test.js
npm run check            # scripts/check-integrity.js: static integrity checks on the generated words app
npm run verify           # test + check; runs in CI before every commit/deploy
npm run build            # scripts/build-site.js: copies site into _site/ (used by Pages deploy)
npm run sync:upstreams   # scripts/sync-upstreams.js: regenerate app dirs from _upstreams/ + changelog, writes upstreams.json
```

Prerequisites: Node >= 22. `_upstreams/` must contain git checkouts of the three source repos (names `WordTales`, `Train_record`, `GraduateSchedule`) for `sync:upstreams`; it is gitignored and populated by CI. Local preview: `python3 -m http.server 8000` then visit `/`, `/words/`, `/training/`, `/exam-schedule/`, `/changelog/`.

## Architecture

### Sync pipeline (the load-bearing part)

`scripts/sync-upstreams.js` rebuilds the three app dirs from `_upstreams/` checkouts by string replacement against exact anchors (each replaced once; missing/duplicate anchors fail the build). It:

- injects the `data-app` attribute on `<html>`, a CSP meta tag, `shared/hub.css`, `<div id="hub-shell"></div>`, and the shared script block (`shared/vendor/supabase.js`, `config.js`, `hub-auth.js`, `auth-gate.js`, `sync-store.js`, `hub-sync.js`, `hub-shell.js` — kept in `sharedScripts()` and used verbatim by every app, including changelog)
- writes the per-app adapter from `integrations/<app>/hub-sync.js`
- for words: injects a Content-Security-Policy, replaces the old upstream supabase vendor script, adds `hub-sync.js` after `cloud-sync.js`, rewrites `cloud-sync.js` to call `HubProfileSync.queue()` after uploads, and writes `integrations/words/{auth.js,supabase-config.js}`
- for exam-schedule: extracts the app from an iframe `srcdoc` and replaces its stricter CSP
- rebuilds `changelog/index.html` (idempotent — the committed file is the template) and records upstream commits in `upstreams.json`

Tests in `tests/changelog-build.test.js` simulate the `buildChangelog` function (extracted from the script source by brace-matching) and assert the generated output equals the committed template.

### Shared runtime

Scripts in `shared/` run in every app and on the home page (the browser context, not Node):

- `config.js` — `window.HubConfig` with the publishable Supabase URL/key (safe to commit; never add service-role keys)
- `hub-auth.js` — wraps Supabase Auth: `window.HubAuth` with `init()`, `getSession()`, `getClient()`, `signInWithPassword()`, `signOut()`, `onChange()`; no signup API
- `auth-gate.js` — per-app route guard: reads `document.documentElement.dataset.app`, sets `data-auth-ready` when authenticated, redirects to `../?login=1&next=<app>` otherwise. Supabase RLS is the authoritative data boundary; the gate is UI only
- `sync-store.js` — `window.HubSync`: per-item, local-first sync engine. Items are keyed `user_id + ':' + item_key` in `sync_items` (Supabase table, RLS-scoped to `auth.uid()`). Holds a per-item `updated_at` version map (`hub.sync.versions.v2`) and a persistent outbox (`hub.sync.outbox.v2`) so writes survive offline; `put()`/`remove()`/`flush()`/`register()`; on account switch, backs up (`hub.sync.backup.*`) and resets local data before applying the new account's remote rows. On failure it deliberately does NOT reschedule (no retry loop)
- `hub-sync.js` — `window.HubAppSync.start(adapter)`: poll-driven adapter that diffs the app's local state against a baseline and calls `sync.put`/`sync.remove` only for changed items. Adapter contract: `items()` → `[{item_key, payload}]`, `applyRemote(rows)`, `resetLocal()`. An `applyingRemote` gate prevents re-uploading rows mid-merge
- `hub-shell.js` — injects a minimal "back to home" link into per-app placement selectors (`.cover-inner`, `.topbar-inner`, `#kaoyan-plan .brand`, `.app-header`), falling back to `hub-home-fallback` class

### Portal-owned code

- `index.html` + `shared/home.js` + `shared/home.css` — the home page: app icons marked `data-protected-app` (redirect to login when signed out), login dialog (`data-login-open`, no register mode), account panel. All apps render on one page — no swipe/paging
- `changelog/` — changelog app: read-only release timeline. `changelog.js` holds the `SEED` entries (new versions are added to SEED with each release commit); no manual entry editing and no per-account sync
- `integrations/` — per-app sync adapters: `words/hub-sync.js` (WordTales profile → per-key items; keeps a public `WordTales.HubProfileSync` for legacy `cloud-sync.js`), `training/hub-sync.js`, `exam-schedule/hub-sync.js`

### Tests and integrity checks

- `tests/portal.test.js` — runs shared scripts in a `vm` sandbox with a fake Supabase client, plus regex assertions on generated HTML/workflows/migrations. `setInterval` is stubbed to `() => 0` so the poll loop can't keep the process alive; scans are driven manually via `HubAppSync.queue()`
- `tests/wordtales/` — browser-env helper (`tests/wordtales/helpers/browser-env.js`) loads real app scripts into `vm` with a fake DOM/localStorage; covers cloud-sync, data, learning-progress, study-record
- `scripts/check-integrity.js` — zero-dependency static checks on `words/`: exact script tag order (ignoring `?v=` version strings), no inline scripts, `recordEntry` button presence, removed-shell absence, V8-compiles every external script, validates the `sets` corpus JSON (global unique IDs, audio cues count/order matching article tokens, canonical entry count 892 / contexts 897, the 5 canonical synonym aliases, FSRS-6.0 bundled behavior)

### CI / deployment

- `.github/workflows/sync-upstreams.yml` — cron (off-minute schedule `7,22,37,52 * * * *`) + `workflow_dispatch` + `repository_dispatch` (`upstream-app-updated`): checks out the three upstreams, runs `sync:upstreams`, `npm run verify`, commits changes to `words/ training/ exam-schedule/ upstreams.json`; the `deploy` job (gated on `changed == 'true'`) verifies, builds `_site/`, and deploys Pages
- `.github/workflows/pages.yml` — on push to master/main: verify → build → deploy Pages
- `_site/` is the build output (gitignored); `_upstreams/` is gitignored; `upstreams.json` records the synced source commits

## Supabase

Migrations live in `supabase/migrations/` and must be applied to the WordTales Supabase project. `sync_items` must be exposed via the Data API with RLS enabled and `supabase_realtime` publication for live sync. Site URL and the five exact redirect URLs must be configured in Auth settings. Accounts are pre-created in the dashboard; signups are disabled (portal has no public registration). The browser only ever uses the publishable key from `shared/config.js`.

## Notes

- All user-facing text is Simplified Chinese; code comments mix Chinese and English
- Browser scripts are ES5-style IIFEs (no modules, no build step) — keep that style when touching `shared/`, `changelog/`, or `integrations/`
- Any change to the shared script block or its order must keep `tests/changelog-build.test.js`, `tests/portal.test.js`, and `check-integrity.js` expectations in sync
