# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

WordTales is a static, framework-free English vocabulary learning app inside the Everything 4 Dudu portal. The default route is the article library; `#library`, set and column hashes expose the same reading experience. The corpus holds 897 source occurrences mapped to 892 canonical learning entries across 7 sets and 28 columns.

There is no build step and no runtime CDN dependency — the official `ts-fsrs` UMD bundle is checked into `vocab-essays/vendor/ts-fsrs/`, so the app must stay offline- and `file://`-compatible. All application APIs live under the `WordTales` namespace.

Entry point: `vocab-essays/vocab-essays.html`.

## Commands

```bash
python3 -m http.server 8000        # serve http://localhost:8000/vocab-essays/vocab-essays.html
node scripts/check-integrity.js    # integrity gate: script order, assets, 897→892 mapping, audio cues, syntax
node --test tests/*.test.js        # core tests: data, ratings and migration
node --check <edited .js file>     # syntax-check a script
```

There is no package manager. The test suite uses Node's built-in test runner, supplemented by `check-integrity.js` and the browser smoke list under Verification.

## Architecture

Scripts use `defer` and must remain in this dependency order (`check-integrity.js` enforces it):

```text
vendor/ts-fsrs/index.umd.js → js/namespace.js → js/data.js → js/renderer.js
→ js/learning-progress-v2.js → js/study-record.js → js/features.js
```

| Layer | File | Role |
| --- | --- | --- |
| Data | `js/data.js` | Immutable content (`var sets = [...]`), occurrence→entry mapping, context/source-order APIs. |
| Renderer | `js/renderer.js` | Escapes content; renders the article/library DOM. |
| LearningProgress | `js/learning-progress-v2.js` | FSRS-6 scheduling, IndexedDB/localStorage persistence, v1 migration, idempotent events, canonical star state and column-completion records. |
| StudyRecord | `js/study-record.js` | Monthly date-by-column completion table, dialog behavior and accessible checkboxes. |
| Features/App | `js/features.js` | Hash routing plus article reading, audio, cards, games and copy practice. |

## Context loading rules

- Article cards, scheduling, persistence, star state and manual column completions → `js/features.js`, `js/learning-progress-v2.js`, `js/study-record.js`, plus README's 使用路径 / 数据保存与迁移 sections (the user-facing behavior contract).
- Article read-aloud, word highlighting, audio cues → `.codex/skills/sync-article-audio/SKILL.md` and `references/wordtales-workflow.md` (tokenization contract, cue generation, acceptance checklist).
- Corpus content (sets, columns, words, paragraphs) → `js/data.js`; the integrity rules live in `scripts/check-integrity.js`, not here.
- New essay content from word-list photos → `.trae/skills/vocab-essay/SKILL.md`.
- Frontend code review → `.trae/skills/frontend-code-reviewer/SKILL.md`.
- Deployment → the portal root `.github/workflows/pages.yml` and `scripts/build-site.js` (update the portal flow when adding a required static directory).
- User-facing changelog → `<template id="changelog-tpl">` in `vocab-essays.html`.

## Hard rules

Routing and learning state:

- Empty hash and `#library` activate the article library; legacy `#study` is normalized to `#library`; set, column and changelog hashes remain supported.
- Canonical state is keyed by entry ID, never by English text or occurrence ID; `Data.resolveEntryId(occurrenceId)` is the only occurrence→entry path.
- Ratings are `Good`, `Hard` and `Again` — never merge Good and Hard.
- Every rating is committed immediately with an idempotent submission ID.
- Article auto-highlighting and automatic exposure must not create learning records.
- `isStarred` in the v2 profile is authoritative; `localStorage.starredWords` is a compatibility mirror only.
- Manual completion checks are keyed by local-calendar `YYYY-MM-DD` and stable column ID; never derive record dates by slicing a UTC ISO string.
- Completion UI must await `setColumnCompleted()` and surface `saved: false`; never announce a check as saved before persistence succeeds.

Speech:

- Speech failures must never block article interaction or navigation.
- Speech keeps honoring the legacy persisted US/UK accent (`wordtales.accent`, default `us`) even though the page no longer exposes an accent toggle; voice selection prefers that accent pool and degrades to any English voice when it is empty.

Data and deployment:

- The 897→892 mapping, the five aliases and the two distinct `brisk` entries are enforced by `scripts/check-integrity.js` — change the corpus only by deliberately updating those assertions.
- Migration must remain repeatable and non-destructive; never clear existing profiles as part of a schema change.
- Preserve offline/`file://` compatibility: no app-level build step, no CDN runtime dependencies, and every new required static directory must be copied by the portal build.
- Add a changelog entry for meaningful feature or architecture changes.

## Work principles

- Read the target module and adjacent implementations before modifying; match existing naming, comment density and idioms.
- README describes user-facing behavior; if code and README disagree, trust the code and fix the README.
- Fix root causes; do not expand scope, add workarounds, or paper over failing checks.
- When a fact is uncertain, verify it in code, scripts or docs rather than assuming.

## Verification

For any change:

1. `node scripts/check-integrity.js` — must pass; do not report completion while it fails.
2. `node --test tests/*.test.js` — must pass for changes to data or learning progress.
3. `node --check` every edited script; run `git diff --check`.
4. Browser smoke tests must cover: empty hash, `#library`, legacy `#study`, set and column deep links; first-click column positioning; record-table month navigation, check/uncheck and reload persistence; article read-aloud reset; unified stars in game and copy practice; desktop and 390 px viewport; local server and `file://` startup.
5. State plainly what was changed and what could not be verified.
