---
name: sync-article-audio
description: Batch-map article narration MP3 files to static reading-app columns, create verified word-level cue timelines from Whisper timestamps, integrate prerecorded HTML Audio playback with DOM word highlighting and speech-synthesis fallback, and validate local/offline/static-site deployment. Use when adding or replacing article read-aloud audio, preserving word-by-word highlighting, diagnosing transcript/text mismatches, or expanding WordTales narration coverage.
---

# Sync Article Audio

Turn article MP3 files into durable, browser-ready narration with word-level highlighting. Treat the page text and its real DOM tokenization as canonical; treat speech recognition only as alignment evidence.

## Workflow

1. **Inspect before changing files**
   - Count article columns and audio files.
   - Resolve the filename-to-column mapping explicitly.
   - Read the current reader, renderer, data schema, deployment workflow, and integrity checks.
   - Probe every audio duration with `ffprobe`.
   - Never overwrite an existing audio target until the mapping is verified.

2. **Normalize audio assets**
   - Put recordings beside the static page so the same relative URL works over HTTP and `file://`.
   - Prefer stable ASCII names such as `list{set}_col{column}.mp3`.
   - Preserve the original files until all targets have been resolved.

3. **Reproduce browser tokenization**
   - Derive tokens using the exact rule used by the reader after rendering.
   - Do not assume that joining source segments and splitting once is equivalent.
   - In WordTales, split every `segments` item independently on whitespace. A highlighted word and an adjacent punctuation-only segment become separate DOM tokens.
   - Keep punctuation tokens in the cue array as `null`.

4. **Generate word timestamps**
   - Run Whisper with `--word_timestamps True`, English fixed explicitly, and JSON output.
   - Start with `tiny.en` for a large batch.
   - Compute alignment diagnostics and rerun suspicious columns with `base.en` or better.
   - Rerun when there are lexical nulls, a consecutive null run, or a high edit rate. Do not rerun merely for spelling variants or proper-name substitutions when timestamps remain aligned.

5. **Align page tokens to recognized words**
   - Use `scripts/align-word-cues.js` for deterministic alignment.
   - Allow one-to-one substitutions because ASR spelling is not authoritative.
   - Allow two page lexemes to share one recognized word, such as `endow` + `ed` → `endowed`, and split that timestamp proportionally.
   - Allow one page lexeme to span two recognized words for the inverse case.
   - Inspect every remaining unmapped lexical token. Keep `null` only when the recording genuinely omits the word.

6. **Integrate static cues**
   - Store the MP3 path and cue array with the article/column data.
   - Commit cue data; never run Whisper in the user's browser.
   - Drive highlighting from `audio.currentTime` using `requestAnimationFrame` and binary search over non-null cues.
   - Compute progress from audio duration, not text length.
   - Stop audio, cancel animation frames, unwrap tokens, and reset controls when stopping, starting another article, or switching sets.
   - Fall back to the existing speech-synthesis reader on load, decode, or play failure.
   - Keep isolated word pronunciation separate unless the user explicitly requests audio slicing.

7. **Validate**
   - Check: audio exists, cue count equals runtime token count, cue pairs are finite, `start < end`, cues are monotonic and non-overlapping, and the final cue does not exceed audio duration.
   - Run syntax and repository integrity checks.
   - Build a temporary copy of the static deployment artifact and count its MP3 files.
   - Browser-test representative early, middle, late, and previously suspicious columns.
   - Verify start, stop, replay, progress, active-word highlighting, automatic scrolling, set switching, failure fallback, and console logs.

## Repository-specific guidance

For WordTales paths, schema, commands, quality thresholds, and the exact acceptance checklist, read [references/wordtales-workflow.md](references/wordtales-workflow.md).

## Alignment script

Prepare a JSON array containing runtime token strings and a Whisper JSON file, then run:

```bash
node .codex/skills/sync-article-audio/scripts/align-word-cues.js \
  --tokens /tmp/s1col1.tokens.json \
  --transcript /tmp/whisper/list1_col1.json \
  --output /tmp/s1col1.cues.json
```

Use `--strict` when the pipeline must fail if any lexical token remains unmapped. Read the emitted `report` before integrating the `cues`.

## Completion standard

Do not call the work complete because every file has a cue array. Completion requires structural validation plus real browser playback. Report confirmed omissions separately from punctuation-only nulls and ASR substitutions.
