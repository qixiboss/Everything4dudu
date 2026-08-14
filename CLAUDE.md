# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Everything 4 Dudu is a mobile-style home-page portal (GitHub Pages site) that unifies three independently-developed apps — WordTales (vocabulary learning), Train_record (training log), and the Graduate Entrance Exam Schedule — plus portal-owned CostTrace and changelog apps. All apps share a single Supabase email/password login (pre-created accounts only, no public signup) and sync data across devices through the same account.

The three apps are developed **in their own repositories** (`qixiboss/WordTales`, `qixiboss/Train_record`, `qixiboss/-Graduate-Entrance-Exam-Schedule`), each with its own GitHub Pages. `words/`, `training/`, `exam-schedule/` are **git submodules** of those repos (registered in `.gitmodules`): each folder is a full git repo with its own remote, and the portal records the exact commit (pointer) it deploys. The portal integration (shared login/sync scripts, CSP, adapters) is applied **at build time** by `scripts/integrate.js` when generating `_site/`. The hand-maintained portal apps are `CostTrace/` and `changelog/`; the home page (`index.html` + `shared/home.js` + `shared/home.css`) is also hand-maintained.

## Commands

```sh
npm test                 # node --test over tests/*.test.js and tests/**/*.test.js (auto-builds _site/ first when missing)
npm run check            # scripts/check-integrity.js: static integrity checks on _site/words (auto-builds _site/ first when missing)
npm run build            # scripts/build-site.js: integrate apps from clones + copy portal files into _site/
npm run verify           # build + test + check; runs in CI before every deploy
```

Prerequisites: Node >= 22, and the three app submodules initialized (`git submodule update --init` after a fresh clone; clone once with `git clone --recurse-submodules` to get everything). Local preview: `npm run build` then `python3 -m http.server 8000` from `_site/` (or serve the repo root — portal files are at root, but app pages only exist in `_site/`).

## Architecture

### Build-time integration (the load-bearing part)

`scripts/integrate.js` exports `integrateApps(appRoot, destRoot)`: it reads each app from its clone directory and writes the integrated version into the destination (called by `scripts/build-site.js` with `_site/`). Integration is string replacement against exact anchors (each replaced once; missing/duplicate anchors fail the build). Per app it:

- injects the `data-app` attribute on `<html>`, a CSP meta tag, `shared/hub.css`, `<div id="hub-shell"></div>`, and the shared script block (`shared/vendor/supabase.js`, `config.js`, `hub-auth.js`, `auth-gate.js`, `sync-store.js`, `hub-sync.js`, `hub-shell.js` — kept in `sharedScripts()` and used verbatim by every app)
- writes the per-app adapter from `integrations/<app>/hub-sync.js`
- for words: copies from the clone's `vocab-essays/` subdir, removes the old upstream supabase vendor script, adds `hub-sync.js` after `cloud-sync.js`, and writes `integrations/words/{auth.js,supabase-config.js,cloud-sync.js}` — the portal-owned `cloud-sync.js` stub keeps the login lifecycle and the `HubProfileSync.queue()` hook; the legacy whole-profile `learning_profiles` upload/restore path is disabled
- for training: copies only `index.html`, `styles.css`, `app.js`
- for exam-schedule: extracts the app from an iframe `srcdoc` and replaces its stricter CSP

The committed app content is reproducible from the submodules via `npm run build`; the portal repo only records submodule pointers (`.gitmodules` + gitlinks), never app content.

### Shared runtime

Scripts in `shared/` run in every app and on the home page (the browser context, not Node):

- `config.js` — `window.HubConfig` with the publishable Supabase URL/key (safe to commit; never add service-role keys)
- `hub-auth.js` — wraps Supabase Auth: `window.HubAuth` with `init()`, `getSession()`, `getClient()`, `signInWithPassword()`, `signOut()`, `onChange()`; no signup API
- `auth-gate.js` — per-app route guard: reads `document.documentElement.dataset.app`, sets `data-auth-ready` when authenticated, redirects to `../?login=1&next=<app>` otherwise. Supabase RLS is the authoritative data boundary; the gate is UI only
- `sync-store.js` — `window.HubSync`: per-item, local-first sync engine. Each app syncs into its own Supabase table (`words_sync_items` / `training_sync_items` / `exam_sync_items`), items keyed `user_id + ':' + item_key`, RLS-scoped to `auth.uid()`. Holds a per-item `updated_at` version map (`hub.sync.versions.v2`) and a persistent outbox (`hub.sync.outbox.v2`) so writes survive offline; `put()`/`remove()`/`flush()`/`register()`; on account switch, backs up (`hub.sync.backup.*`) and resets local data before applying the new account's remote rows. On failure it deliberately does NOT reschedule (no retry loop)
- `hub-sync.js` — `window.HubAppSync.start(adapter)`: poll-driven adapter that diffs the app's local state against a baseline and calls `sync.put`/`sync.remove` only for changed items. Adapter contract: `items()` → `[{item_key, payload}]`, `applyRemote(rows)`, `resetLocal()`. An `applyingRemote` gate prevents re-uploading rows mid-merge
- `hub-shell.js` — injects a minimal "back to home" link into per-app placement selectors (`.cover-inner`, `.topbar-inner`, `#kaoyan-plan .brand`, `.app-header`), falling back to `hub-home-fallback` class

### Portal-owned code

- `index.html` + `shared/home.js` + `shared/home.css` — the home page: app icons marked `data-protected-app` (redirect to login when signed out), login dialog (`data-login-open`, no register mode), account panel. Apps use a two-column, three-row grid with six apps per page; additional apps are split into swipeable/keyboard-accessible pages with arrow and dot controls
- `changelog/` — changelog app: read-only release timeline. `changelog.js` holds the `SEED` entries (new versions are added to SEED with each release commit); no manual entry editing and no per-account sync
- `CostTrace/` — bookkeeping app: local-first transactions, dashboard charts, filtered detail table, offline XLSX export, and per-record sync through `costtrace_sync_items`
- `integrations/` — per-app sync adapters: `words/hub-sync.js` (WordTales profile → starred-word `word:<id>` + daily punch-in `column:<日期>:<列>` items; public `WordTales.HubProfileSync` is called by the portal's `cloud-sync.js` stub), `training/hub-sync.js` (`day:<日期>` only; settings stay device-local), `exam-schedule/hub-sync.js` (`task:<id>` only; rest markers stay device-local)

### Tests and integrity checks

- `tests/portal.test.js` — runs shared scripts in a `vm` sandbox with a fake Supabase client, plus regex assertions on the built HTML (`_site/`), workflows, and migrations. `setInterval` is stubbed to `() => 0` so the poll loop can't keep the process alive; scans are driven manually via `HubAppSync.queue()`
- `tests/wordtales/` — browser-env helper (`tests/wordtales/helpers/browser-env.js`) loads the built app scripts from `_site/words/` into `vm` with a fake DOM/localStorage; covers cloud-sync, data, learning-progress, study-record
- `scripts/check-integrity.js` — zero-dependency static checks on `_site/words/`: exact script tag order (ignoring `?v=` version strings), no inline scripts, `recordEntry` button presence, removed-shell absence, V8-compiles every external script, validates the `sets` corpus JSON (global unique IDs, audio cues count/order matching article tokens, canonical entry count 892 / contexts 897, the 5 canonical synonym aliases, FSRS-6.0 bundled behavior)

### CI / deployment

- `.github/workflows/pages.yml` — on push to master/main: checks out the portal with `submodules: recursive` (materializes the pinned app commits), runs `npm run verify` (build → test → check), and deploys `_site/` to Pages
- The app repos deploy their own Pages independently (their own workflows); pushing them does not touch this portal. The portal deploys the exact app versions recorded in the portal commit — to include new app changes, `git add <app>` in the portal commit (updates the pointer), then push the portal
- `_site/` is the build output (gitignored); `words/`, `training/`, `exam-schedule/` are submodules

## Supabase

Migrations live in `supabase/migrations/` and must be applied to the WordTales Supabase project. The four per-app tables (`words_sync_items`, `training_sync_items`, `exam_sync_items`, `costtrace_sync_items`) must be exposed via the Data API with RLS enabled and `supabase_realtime` publication for live sync. The retired `learning_profiles` whole-profile table is no longer written or read by any build. Site URL and the six exact redirect URLs must be configured in Auth settings. Accounts are pre-created in the dashboard; signups are disabled (portal has no public registration). The browser only ever uses the publishable key from `shared/config.js`.

### Development test account

Local development credentials, when available, are stored in the gitignored
`.dev-test-account.local.md` file at the repository root. Never commit that file
or copy its credentials into tracked documentation. The test account must retain
only the standard `authenticated` role and per-user RLS access; never grant it
service-role, dashboard, schema, administrative, or cross-user access.

## Notes

- All user-facing text is Simplified Chinese; code comments mix Chinese and English
- Browser scripts are ES5-style IIFEs (no modules, no build step) — keep that style when touching `shared/`, `changelog/`, or `integrations/`
- App changes happen inside the submodules: commit and push from `words/`, `training/`, or `exam-schedule/` (each goes to its own remote); the portal commit then records the new pointer via `git add <app>` — never commit app files directly into the portal tree
- The portal deploys the app versions pinned in the portal commit; there is no "always latest" behavior
- Any change to the shared script block or its order must keep `tests/portal.test.js` and `check-integrity.js` expectations in sync
