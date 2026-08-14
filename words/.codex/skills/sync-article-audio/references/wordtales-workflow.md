# WordTales audio synchronization

## Contents

- [Project contracts](#project-contracts)
- [Token contract](#token-contract)
- [Transcription strategy](#transcription-strategy)
- [Common mismatch classes](#common-mismatch-classes)
- [Integration behavior](#integration-behavior)
- [Automated checks](#automated-checks)
- [Browser acceptance checklist](#browser-acceptance-checklist)
- [Deployment check](#deployment-check)

## Project contracts

- Page shell: `vocab-essays/vocab-essays.html`
- Article data and cue timelines: `vocab-essays/js/data.js`
- Audio directory: `vocab-essays/audio/`
- Audio names: `list{setNumber}_col{columnNumber}.mp3`
- Deployment: `.github/workflows/jekyll-gh-pages.yml`
- Validation: `node scripts/check-integrity.js`
- Data marker: `  var sets = `
- Column lookup: `WordTales.Data.getColumn(columnId)`
- Optional column field:

```js
audio: {
  src: "audio/list1_col1.mp3",
  cues: [[0.12, 0.36], [0.36, 0.64], null]
}
```

## Token contract

The reader walks rendered text nodes and splits each text node independently with `/(\s+)/`. Mirror that behavior from source data by splitting every paragraph `segments` item independently:

```js
const tokens = column.paragraphs.flatMap((paragraph) =>
  paragraph.segments.flatMap((segment) => {
    const text = typeof segment === "string" ? segment : segment.text;
    return text.split(/\s+/).filter(Boolean);
  })
);
```

Do not join all segments before splitting. For example:

```js
["This is an ", { text: "example" }, "."]
```

becomes five runtime tokens: `This`, `is`, `an`, `example`, `.`. The punctuation cue is `null`.

## Transcription strategy

Use a temporary directory outside the repository:

```bash
out_dir=$(mktemp -d /tmp/wordtales-whisper.XXXXXX)
whisper vocab-essays/audio/*.mp3 \
  --model tiny.en \
  --language en \
  --word_timestamps True \
  --output_format json \
  --output_dir "$out_dir" \
  --verbose False \
  --fp16 False
```

Review alignment statistics. Rerun only suspicious files with `base.en`:

```bash
review_dir=$(mktemp -d /tmp/wordtales-review.XXXXXX)
whisper vocab-essays/audio/list2_col4.mp3 \
  --model base.en \
  --language en \
  --word_timestamps True \
  --output_format json \
  --output_dir "$review_dir" \
  --verbose False \
  --fp16 False
```

Prefer the higher-precision JSON for a reviewed column. A tiny-model deletion is not proof that the recording omitted the word.

## Common mismatch classes

| Page | ASR | Treatment |
| --- | --- | --- |
| `Elena` | `Alana` | One-to-one substitution; keep ASR time |
| `floes` | `flows` | One-to-one substitution; keep ASR time |
| `endow` + `ed` | `endowed` | Split one ASR interval across two DOM tokens |
| `a` + `rival` | `arrival` | Treat as a likely merged phrase; split after review |
| punctuation token | no word | Keep `null` |
| real unspoken word | no word | Keep `null` and document it |

## Integration behavior

- Build a compact list of non-null cues with original token indexes.
- On each animation frame, binary-search the last cue whose start is not after `currentTime`.
- Highlight only while `currentTime <= cue.end`; clear the highlight during silence and omitted tokens.
- Update the status when the active token or integer percentage changes, not every frame.
- Scroll only when the newly highlighted token is outside the comfortable viewport.
- Guard callbacks with a run identifier so events from stopped audio cannot update a newer session.
- On failure, remove recorded-audio UI, unwrap tokens, and start the existing speech reader.

## Automated checks

Extend `scripts/check-integrity.js` to validate:

1. `audio.src` is a non-empty relative path and resolves to a file.
2. `audio.cues` is an array.
3. Cue count equals the segment-by-segment runtime token count.
4. Each non-null cue is `[finiteStart, finiteEnd]`, with `0 <= start < end`.
5. Non-null cues are monotonic and non-overlapping.
6. The configured column count matches the expected narration coverage.

Separately compare the maximum cue end with `ffprobe` duration.

## Browser acceptance checklist

- Sample at least one column from the first, middle, and last sets.
- Include every column that required high-precision reprocessing.
- After playback begins, verify:
  - button text is `停止`;
  - status begins with `录音朗读中`;
  - token count matches cue count;
  - a lexical token becomes `.reading-highlight`;
  - progress advances.
- Stop and verify status, token wrappers, and highlight are removed.
- Start one recording, switch sets, and verify the old recording state is fully cleared.
- Confirm representative MP3 requests return HTTP 200.
- Confirm no browser console errors or warnings.

## Deployment check

Reproduce the GitHub Pages copy step in a temporary directory and confirm all MP3s are present:

```bash
build_dir=$(mktemp -d /tmp/wordtales-pages.XXXXXX)
mkdir -p "$build_dir/_site"
cp vocab-essays/vocab-essays.html "$build_dir/_site/index.html"
cp -R vocab-essays/css "$build_dir/_site/css"
cp -R vocab-essays/js "$build_dir/_site/js"
cp -R vocab-essays/audio "$build_dir/_site/audio"
cp README.md "$build_dir/_site/README.md"
find "$build_dir/_site/audio" -type f -name "*.mp3" | wc -l
```
