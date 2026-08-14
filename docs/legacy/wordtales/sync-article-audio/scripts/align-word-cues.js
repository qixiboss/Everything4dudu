#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error(
    'Usage: node align-word-cues.js --tokens TOKENS.json ' +
    '--transcript WHISPER.json [--output RESULT.json] [--strict]'
  );
  process.exit(message ? 1 : 0);
}

function parseArgs(argv) {
  const args = { strict: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--strict') {
      args.strict = true;
    } else if (arg === '--help' || arg === '-h') {
      usage();
    } else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) usage(`Missing value for ${arg}`);
      args[key] = value;
      index += 1;
    } else {
      usage(`Unexpected argument: ${arg}`);
    }
  }
  if (!args.tokens) usage('--tokens is required');
  if (!args.transcript) usage('--transcript is required');
  return args;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
}

function lexemes(value) {
  return String(value)
    .toLowerCase()
    .replace(/’/g, "'")
    .match(/[a-z0-9]+(?:'[a-z0-9]+)*/g) || [];
}

function editDistance(left, right) {
  const row = Array.from({ length: left.length + 1 }, (_, index) => index);
  for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
    let diagonal = row[0];
    row[0] = rightIndex;
    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
      const previous = row[leftIndex];
      row[leftIndex] = Math.min(
        row[leftIndex] + 1,
        row[leftIndex - 1] + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      );
      diagonal = previous;
    }
  }
  return row[left.length];
}

function mergeCompatible(parts, target) {
  const combined = parts.join('');
  if (combined === target) return true;
  return editDistance(combined, target) <= 1 && !parts.includes(target);
}

function buildPageLexemes(tokens) {
  const result = [];
  tokens.forEach((token, tokenIndex) => {
    lexemes(token).forEach((text) => result.push({ text, tokenIndex }));
  });
  return result;
}

function buildHeardLexemes(transcript) {
  const result = [];
  (transcript.segments || []).flatMap((segment) => segment.words || []).forEach((word) => {
    lexemes(word.word).forEach((text) => result.push({
      text,
      raw: String(word.word).trim(),
      start: Number(word.start),
      end: Number(word.end)
    }));
  });
  return result;
}

function align(page, heard) {
  const infinity = 30000;
  const rows = page.length + 1;
  const columns = heard.length + 1;
  const costs = Array.from({ length: rows }, () => {
    const row = new Uint16Array(columns);
    row.fill(infinity);
    return row;
  });
  const operations = Array.from({ length: rows }, () => Array(columns));
  costs[0][0] = 0;

  function update(pageIndex, heardIndex, cost, operation) {
    if (cost < costs[pageIndex][heardIndex]) {
      costs[pageIndex][heardIndex] = cost;
      operations[pageIndex][heardIndex] = operation;
    }
  }

  for (let pageIndex = 0; pageIndex <= page.length; pageIndex += 1) {
    for (let heardIndex = 0; heardIndex <= heard.length; heardIndex += 1) {
      const cost = costs[pageIndex][heardIndex];
      if (cost >= infinity) continue;
      if (pageIndex < page.length) {
        update(pageIndex + 1, heardIndex, cost + 1, 'delete');
      }
      if (heardIndex < heard.length) {
        update(pageIndex, heardIndex + 1, cost + 1, 'insert');
      }
      if (pageIndex < page.length && heardIndex < heard.length) {
        update(
          pageIndex + 1,
          heardIndex + 1,
          cost + (page[pageIndex].text === heard[heardIndex].text ? 0 : 1),
          'one-one'
        );
      }
      if (
        pageIndex + 1 < page.length &&
        heardIndex < heard.length &&
        mergeCompatible(
          [page[pageIndex].text, page[pageIndex + 1].text],
          heard[heardIndex].text
        )
      ) {
        update(pageIndex + 2, heardIndex + 1, cost, 'two-one');
      }
      if (
        pageIndex < page.length &&
        heardIndex + 1 < heard.length &&
        mergeCompatible(
          [heard[heardIndex].text, heard[heardIndex + 1].text],
          page[pageIndex].text
        )
      ) {
        update(pageIndex + 1, heardIndex + 2, cost, 'one-two');
      }
    }
  }

  const steps = [];
  let pageIndex = page.length;
  let heardIndex = heard.length;
  while (pageIndex || heardIndex) {
    const operation = operations[pageIndex][heardIndex];
    if (operation === 'one-one') {
      steps.push({ operation, pageIndex: pageIndex - 1, heardIndex: heardIndex - 1 });
      pageIndex -= 1;
      heardIndex -= 1;
    } else if (operation === 'two-one') {
      steps.push({ operation, pageIndex: pageIndex - 2, heardIndex: heardIndex - 1 });
      pageIndex -= 2;
      heardIndex -= 1;
    } else if (operation === 'one-two') {
      steps.push({ operation, pageIndex: pageIndex - 1, heardIndex: heardIndex - 2 });
      pageIndex -= 1;
      heardIndex -= 2;
    } else if (operation === 'delete') {
      steps.push({ operation, pageIndex: pageIndex - 1, heardIndex: null });
      pageIndex -= 1;
    } else if (operation === 'insert') {
      steps.push({ operation, pageIndex: null, heardIndex: heardIndex - 1 });
      heardIndex -= 1;
    } else {
      throw new Error(`Unable to backtrack alignment at ${pageIndex},${heardIndex}`);
    }
  }

  return {
    cost: costs[page.length][heard.length],
    steps: steps.reverse()
  };
}

function buildCues(tokens, page, heard, alignment) {
  const cues = tokens.map(() => null);
  const report = {
    substitutions: [],
    mergedPageLexemes: [],
    splitHeardLexemes: [],
    insertedHeardLexemes: []
  };

  function put(pageIndex, start, end) {
    const tokenIndex = page[pageIndex].tokenIndex;
    if (!cues[tokenIndex]) {
      cues[tokenIndex] = [start, end];
    } else {
      cues[tokenIndex][0] = Math.min(cues[tokenIndex][0], start);
      cues[tokenIndex][1] = Math.max(cues[tokenIndex][1], end);
    }
  }

  alignment.steps.forEach((step) => {
    const pageIndex = step.pageIndex;
    const heardIndex = step.heardIndex;
    if (step.operation === 'one-one') {
      const pageWord = page[pageIndex];
      const heardWord = heard[heardIndex];
      put(pageIndex, heardWord.start, heardWord.end);
      if (pageWord.text !== heardWord.text) {
        report.substitutions.push({
          page: pageWord.text,
          heard: heardWord.raw,
          tokenIndex: pageWord.tokenIndex
        });
      }
    } else if (step.operation === 'two-one') {
      const first = page[pageIndex];
      const second = page[pageIndex + 1];
      const heardWord = heard[heardIndex];
      const ratio = first.text.length / (first.text.length + second.text.length);
      const midpoint = heardWord.start + (heardWord.end - heardWord.start) * ratio;
      put(pageIndex, heardWord.start, midpoint);
      put(pageIndex + 1, midpoint, heardWord.end);
      report.mergedPageLexemes.push({
        page: [first.text, second.text],
        heard: heardWord.raw
      });
    } else if (step.operation === 'one-two') {
      put(pageIndex, heard[heardIndex].start, heard[heardIndex + 1].end);
      report.splitHeardLexemes.push({
        page: page[pageIndex].text,
        heard: [heard[heardIndex].raw, heard[heardIndex + 1].raw]
      });
    } else if (step.operation === 'insert') {
      report.insertedHeardLexemes.push(heard[heardIndex].raw);
    }
  });

  let rounded = cues.map((cue) => cue && cue.map((value) => Math.round(value * 100) / 100));
  let previousEnd = -Infinity;
  rounded = rounded.map((cue) => {
    if (!cue) return null;
    const start = Math.max(cue[0], previousEnd);
    const end = cue[1] > start ? cue[1] : Math.round((start + 0.01) * 100) / 100;
    const fixed = [Math.round(start * 100) / 100, Math.round(end * 100) / 100];
    previousEnd = fixed[1];
    return fixed;
  });

  report.unmappedLexicalTokens = rounded
    .map((cue, tokenIndex) => {
      if (cue || lexemes(tokens[tokenIndex]).length === 0) return null;
      return { tokenIndex, token: tokens[tokenIndex] };
    })
    .filter(Boolean);
  report.punctuationOnlyNulls = rounded
    .map((cue, tokenIndex) => {
      if (cue || lexemes(tokens[tokenIndex]).length > 0) return null;
      return { tokenIndex, token: tokens[tokenIndex] };
    })
    .filter(Boolean);

  return { cues: rounded, report };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const tokenInput = readJson(args.tokens);
  const tokens = Array.isArray(tokenInput) ? tokenInput : tokenInput.tokens;
  if (!Array.isArray(tokens) || tokens.some((token) => typeof token !== 'string')) {
    usage('Token input must be an array of strings or an object with a tokens array');
  }
  const transcript = readJson(args.transcript);
  const page = buildPageLexemes(tokens);
  const heard = buildHeardLexemes(transcript);
  if (!heard.length) usage('Transcript contains no word timestamps');

  const alignment = align(page, heard);
  const result = buildCues(tokens, page, heard, alignment);
  const output = {
    tokens,
    cues: result.cues,
    stats: {
      tokenCount: tokens.length,
      pageLexemeCount: page.length,
      heardLexemeCount: heard.length,
      editCost: alignment.cost,
      editRate: alignment.cost / Math.max(page.length, heard.length)
    },
    report: result.report
  };
  const serialized = `${JSON.stringify(output, null, 2)}\n`;
  if (args.output) {
    fs.writeFileSync(path.resolve(args.output), serialized);
    console.log(`Wrote ${args.output}`);
  } else {
    process.stdout.write(serialized);
  }
  console.error(
    `tokens=${tokens.length} editCost=${alignment.cost} ` +
    `unmapped=${result.report.unmappedLexicalTokens.length}`
  );
  if (args.strict && result.report.unmappedLexicalTokens.length) process.exitCode = 2;
}

main();
