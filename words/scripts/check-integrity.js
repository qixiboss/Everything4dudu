#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');

/*
 * 静态完整性检查器
 *
 * 设计意图：WordTales 没有构建系统，因此把最容易造成“页面能打开但部分功能失效”
 * 的约束集中到一个零依赖脚本里。脚本只读取文件，不修复数据，适合在提交前和
 * GitHub Pages 发布前重复执行。
 */
const htmlPath = path.resolve(__dirname, '../vocab-essays/vocab-essays.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const errors = [];

const expectedScripts = [
  'vendor/ts-fsrs/index.umd.js?v=5.4.1',
  'vendor/supabase-js/supabase.js?v=2.112.2',
  'js/namespace.js?v=3.0.0',
  'js/supabase-config.js?v=1.0.0',
  'js/auth.js?v=1.0.0',
  'js/data.js?v=3.0.0',
  'js/renderer.js?v=3.0.0',
  'js/learning-progress-v2.js?v=3.0.8',
  'js/cloud-sync.js?v=1.0.0',
  'js/study-record.js?v=1.0.0',
  'js/features.js?v=3.0.4'
];
const scriptTags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const scripts = scriptTags.map((match) => {
  const sourceMatch = match[1].match(/\bsrc=["']([^"']+)["']/i);
  return { source: sourceMatch ? sourceMatch[1] : '' };
});

if (scripts.some((script) => !script.source)) {
  errors.push('All application scripts must be external static files.');
}
if (scripts.map((script) => script.source).join('\n') !== expectedScripts.join('\n')) {
  errors.push(`Unexpected script order: ${scripts.map((script) => script.source || '[inline]').join(', ')}.`);
}

const recordButtons = [...html.matchAll(/<button\b[^>]*\bid=["']recordEntry["'][^>]*>[\s\S]*?<\/button>/gi)];
if (recordButtons.length !== 1 || !/\u8bb0\u5f55\u8868/.test(recordButtons[0][0])) {
  errors.push('The page must expose exactly one record table button labelled "\u8bb0\u5f55\u8868".');
}
['progressEntry', 'accentControl', 'dailyReminder'].forEach((id) => {
  if (new RegExp(`\\bid=["']${id}["']`, 'i').test(html)) {
    errors.push(`Removed interface shell is still present: #${id}.`);
  }
});

function localAssetPath(reference) {
  if (!reference || /^(?:[a-z]+:|\/\/|#)/i.test(reference)) return null;
  return path.resolve(path.dirname(htmlPath), reference.split(/[?#]/)[0]);
}

// 检查 HTML 引用的本地样式与脚本是否存在，并让 V8 编译每个外部脚本。
const assetReferences = [
  ...[...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]),
  ...scripts.map((script) => script.source)
];
assetReferences.forEach((reference) => {
  const assetPath = localAssetPath(reference);
  if (assetPath && (!fs.existsSync(assetPath) || !fs.statSync(assetPath).isFile())) {
    errors.push(`Referenced static asset is missing: ${reference}`);
  }
});

scripts.forEach((script, index) => {
  const scriptPath = localAssetPath(script.source);
  if (!scriptPath || !fs.existsSync(scriptPath)) return;
  try {
    new vm.Script(fs.readFileSync(scriptPath, 'utf8'), { filename: script.source });
  } catch (error) {
    errors.push(`${script.source || `script ${index + 1}`}: ${error.message}`);
  }
});

const dataPath = path.resolve(path.dirname(htmlPath), 'js/data.js');
const dataSource = fs.existsSync(dataPath) ? fs.readFileSync(dataPath, 'utf8') : '';
const marker = '  var sets = ';
const markerIndex = dataSource.indexOf(marker);
if (markerIndex === -1) {
  errors.push('Unable to locate the sets data.');
}

let sets = [];
if (markerIndex !== -1) {
  const dataStart = markerIndex + marker.length;
  let depth = 0;
  let inString = false;
  let escaped = false;
  let dataEnd = -1;

  /*
   * sets 是合法 JSON，但外围文件是 JavaScript，不能直接 require。这里用括号深度
   * 找数组末尾，并显式跳过字符串中的方括号和转义引号，避免被文章正文误导。
   */
  for (let index = dataStart; index < dataSource.length; index += 1) {
    const character = dataSource[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === '[') depth += 1;
    else if (character === ']' && --depth === 0) {
      dataEnd = index + 1;
      break;
    }
  }

  if (dataEnd === -1) {
    errors.push('Unable to find the end of the sets data.');
  } else {
    try {
      sets = JSON.parse(dataSource.slice(dataStart, dataEnd));
    } catch (error) {
      errors.push(`Invalid sets JSON: ${error.message}`);
    }
  }
}

const ids = new Map();
const totals = { sets: sets.length, columns: 0, words: 0, paragraphs: 0, audioColumns: 0 };
const allWordIds = new Set();
const referencedWordIds = new Set();

// 所有实体共用一个 ID 空间，因为渲染后的 DOM 和查询索引也依赖全局唯一性。
function registerId(id, type) {
  if (typeof id !== 'string' || !id.trim()) {
    errors.push(`${type} is missing a valid id.`);
  } else if (ids.has(id)) {
    errors.push(`Duplicate id "${id}" used by ${ids.get(id)} and ${type}.`);
  } else {
    ids.set(id, type);
  }
}

sets.forEach((set, setIndex) => {
  registerId(set.id, `set ${setIndex + 1}`);
  if (!Array.isArray(set.columns)) {
    errors.push(`Set "${set.id || setIndex + 1}" has no columns array.`);
    return;
  }
  set.columns.forEach((column, columnIndex) => {
    totals.columns += 1;
    registerId(column.id, `column ${columnIndex + 1} in ${set.id}`);
    const words = Array.isArray(column.words) ? column.words : [];
    const paragraphs = Array.isArray(column.paragraphs) ? column.paragraphs : [];
    const localWordIds = new Set();

    if (!Array.isArray(column.words)) errors.push(`Column "${column.id}" has no words array.`);
    if (!Array.isArray(column.paragraphs)) errors.push(`Column "${column.id}" has no paragraphs array.`);

    if (column.audio !== undefined) {
      totals.audioColumns += 1;
      if (!column.audio || typeof column.audio.src !== 'string' || !column.audio.src.trim()) {
        errors.push(`Column "${column.id}" has an invalid audio source.`);
      } else {
        const audioPath = path.resolve(path.dirname(htmlPath), column.audio.src);
        if (!fs.existsSync(audioPath) || !fs.statSync(audioPath).isFile()) {
          errors.push(`Column "${column.id}" audio file is missing: ${column.audio.src}`);
        }
      }

      /*
       * Reader 会按完全相同的空白规则把文章拆成 token。检查器复刻这条规则，
       * 确保第 n 个 cue 始终对应页面上第 n 个可高亮 token。
       */
      const articleTokens = paragraphs.flatMap((paragraph) => {
        if (!Array.isArray(paragraph.segments)) return [];
        return paragraph.segments.flatMap((segment) => {
          const text = typeof segment === 'string' ? segment : segment.text;
          return String(text || '').split(/\s+/).filter(Boolean);
        });
      });
      const cues = column.audio && column.audio.cues;
      if (!Array.isArray(cues)) {
        errors.push(`Column "${column.id}" has no audio cue array.`);
      } else if (cues.length !== articleTokens.length) {
        errors.push(
          `Column "${column.id}" has ${cues.length} audio cues for ${articleTokens.length} article tokens.`
        );
      } else {
        let previousEnd = -Infinity;
        cues.forEach((cue, cueIndex) => {
          // null 表示录音中没有读出的标点或词，仍占一个 token 位置以保持对齐。
          if (cue === null) return;
          const validCue = Array.isArray(cue) && cue.length === 2 &&
            cue.every(Number.isFinite) && cue[0] >= 0 && cue[1] > cue[0];
          if (!validCue) {
            errors.push(`Column "${column.id}" has an invalid audio cue at token ${cueIndex + 1}.`);
            return;
          }
          if (cue[0] < previousEnd) {
            errors.push(`Column "${column.id}" has overlapping audio cues at token ${cueIndex + 1}.`);
          }
          previousEnd = cue[1];
        });
      }
    }

    words.forEach((word, wordIndex) => {
      totals.words += 1;
      registerId(word.id, `word ${wordIndex + 1} in ${column.id}`);
      localWordIds.add(word.id);
      allWordIds.add(word.id);
      ['word', 'pos', 'meaning'].forEach((field) => {
        if (typeof word[field] !== 'string' || !word[field].trim()) {
          errors.push(`Word "${word.id}" is missing "${field}".`);
        }
      });
    });

    paragraphs.forEach((paragraph, paragraphIndex) => {
      totals.paragraphs += 1;
      registerId(paragraph.id, `paragraph ${paragraphIndex + 1} in ${column.id}`);
      if (!Array.isArray(paragraph.segments)) {
        errors.push(`Paragraph "${paragraph.id}" has no segments array.`);
      } else {
        // 段落只能高亮本专栏词汇，防止同名词跨专栏串到错误词卡。
        paragraph.segments.forEach((segment) => {
          if (segment && typeof segment === 'object' && !localWordIds.has(segment.vocabId)) {
            errors.push(`Paragraph "${paragraph.id}" references non-local word "${segment.vocabId}".`);
          }
          if (segment && typeof segment === 'object') referencedWordIds.add(segment.vocabId);
        });
      }
      if (!paragraph.analysis || typeof paragraph.analysis.translation !== 'string' ||
          !Array.isArray(paragraph.analysis.points)) {
        errors.push(`Paragraph "${paragraph.id}" has an invalid analysis object.`);
      }
    });
  });
});

allWordIds.forEach((id) => {
  if (!referencedWordIds.has(id)) errors.push(`Word "${id}" has no article context.`);
});

const canonicalAliases = {
  's6col2-radiate': 's1col1-radiate',
  's6col4-proximity': 's1col1-proximity',
  's6col3-barren': 's1col1-barren',
  's3col5-inferior': 's2col2-inferior',
  's6col4-discern': 's4col3-discern'
};
Object.entries(canonicalAliases).forEach(([occurrenceId, entryId]) => {
  if (!allWordIds.has(occurrenceId) || !allWordIds.has(entryId)) {
    errors.push(`Invalid canonical entry alias: ${occurrenceId} -> ${entryId}.`);
  }
});
const canonicalCount = totals.words - Object.keys(canonicalAliases).length;
if (canonicalCount !== 892) errors.push(`Expected 892 canonical entries, found ${canonicalCount}.`);

try {
  const dataSandbox = { WordTales: {} };
  vm.createContext(dataSandbox);
  new vm.Script(dataSource, { filename: 'js/data.js' }).runInContext(dataSandbox);
  const canonicalEntries = dataSandbox.WordTales.Data.getAllEntries();
  const contextCount = canonicalEntries.reduce((sum, entry) => sum + entry.contexts.length, 0);
  if (canonicalEntries.length !== 892) {
    errors.push(`Data API returned ${canonicalEntries.length} canonical entries instead of 892.`);
  }
  if (contextCount !== 897) errors.push(`Expected 897 canonical contexts, found ${contextCount}.`);
  canonicalEntries.forEach((entry, index) => {
    if (!entry.contexts.length || entry.contexts.some((context) => !context.sentence.trim())) {
      errors.push(`Canonical entry "${entry.id}" has no usable context sentence.`);
    }
    if (index > 0 && entry.sourceOrder <= canonicalEntries[index - 1].sourceOrder) {
      errors.push(`Canonical source order is not stable at "${entry.id}".`);
    }
  });
  Object.entries(canonicalAliases).forEach(([occurrenceId, entryId]) => {
    if (dataSandbox.WordTales.Data.resolveEntryId(occurrenceId) !== entryId) {
      errors.push(`Data API did not resolve ${occurrenceId} to ${entryId}.`);
    }
  });
  const briskEntries = canonicalEntries.filter((entry) => entry.word.toLowerCase() === 'brisk');
  if (briskEntries.length !== 2 || briskEntries[0].id === briskEntries[1].id) {
    errors.push('The two meanings of "brisk" must remain separate canonical entries.');
  }
} catch (error) {
  errors.push(`Unable to verify canonical Data APIs: ${error.message}`);
}

try {
  const fsrsSource = fs.readFileSync(path.resolve(path.dirname(htmlPath), 'vendor/ts-fsrs/index.umd.js'), 'utf8');
  const sandbox = {};
  vm.createContext(sandbox);
  new vm.Script(fsrsSource).runInContext(sandbox);
  if (!sandbox.FSRS || !/FSRS-6\.0/.test(String(sandbox.FSRS.FSRSVersion))) {
    errors.push('Bundled ts-fsrs does not report FSRS-6.0.');
  } else {
    const scheduler = sandbox.FSRS.fsrs({
      request_retention: 0.9,
      maximum_interval: 36500,
      enable_fuzz: false,
      enable_short_term: false,
      learning_steps: [],
      relearning_steps: []
    });
    const now = new Date('2026-08-05T12:00:00.000Z');
    const intervals = ['Again', 'Hard', 'Good'].map((rating) => {
      return scheduler.next(
        sandbox.FSRS.createEmptyCard(now),
        now,
        sandbox.FSRS.Rating[rating]
      ).card.scheduled_days;
    });
    if (!(intervals[0] >= 1 && intervals[0] < intervals[1] && intervals[1] < intervals[2])) {
      errors.push(`Expected distinct Again < Hard < Good intervals, found ${intervals.join(', ')}.`);
    }
  }
} catch (error) {
  errors.push(`Unable to verify bundled FSRS: ${error.message}`);
}

// 汇总全部错误后一次性退出，维护者不必反复修一个、跑一次。
if (errors.length) {
  console.error(`Integrity check failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(
    `Integrity check passed: ${scripts.length} scripts, ` +
    `${totals.sets} sets, ${totals.columns} columns, ` +
    `${totals.words} words, ${totals.paragraphs} paragraphs, ` +
    `${totals.audioColumns} recorded columns, ${canonicalCount} canonical entries.`
  );
}
