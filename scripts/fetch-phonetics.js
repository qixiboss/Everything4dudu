#!/usr/bin/env node

/*
 * 美式音标生成器（一次性/可重复运行）
 *
 * 为 data.js 中每个单词抓取美式 IPA 音标并写入该词的 "phonetic" 字段。
 * 数据源是免费的 dictionaryapi.dev（无 key，不需要注册）：
 * 优先取 phonetics[] 中音频 URL 带 us.mp3 的美音条目，回退取第一个
 * 以 "/" 开头的音标文本；API 查不到的单词不写字段，页面自动不显示。
 *
 * 结果缓存到 scripts/phonetic-cache.json，重复运行不重复请求网络；
 * 已带 "phonetic" 字段的词会跳过，脚本可安全地多次执行。
 *
 * 用法：node scripts/fetch-phonetics.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DATA_PATH = path.resolve(__dirname, '../site/words/js/data.js');
const CACHE_PATH = path.resolve(__dirname, 'phonetic-cache.json');
const CONCURRENCY = 5;
const RETRIES = 4;

function loadWords() {
  const sandbox = { WordTales: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(DATA_PATH, 'utf8'), sandbox);
  const ids = [];
  const seen = new Set();
  sandbox.WordTales.Data.sets.forEach((set) => {
    set.columns.forEach((column) => {
      column.words.forEach((word) => {
        ids.push({ id: word.id, word: word.word });
        seen.add(word.word);
      });
    });
  });
  return { entries: ids, uniqueWords: [...seen] };
}

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  } catch (e) {
    return {};
  }
}

async function fetchWithRetry(word) {
  const url = 'https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word);
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'wordtales-phonetics/1.0' } });
      if (res.status === 404) return null;
      if (res.status === 429) {
        // 限流：等待时间逐次加长后重试，全部耗尽则返回 undefined（不落缓存，下次补跑）。
        await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return pickUsPhonetic(await res.json());
    } catch (e) {
      if (attempt === RETRIES) {
        console.error(`[fail] ${word}: ${e.message}`);
        return undefined; // 网络失败，与"查无此词"区分，便于人工补跑
      }
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  console.error(`[miss] ${word}: rate limited`);
  return undefined;
}

/* 从词典条目里挑美式音标：先按音频文件名判定，再按常见形态回退。 */
function pickUsPhonetic(entries) {
  const texts = [];
  entries.forEach((entry) => {
    (entry.phonetics || []).forEach((p) => {
      if (!p || typeof p.text !== 'string') return;
      const audio = p.audio || '';
      texts.push({ text: p.text, us: /us\.mp3/i.test(audio) || /-us\b/i.test(audio) });
    });
  });
  let pick = texts.find((t) => t.us && /^\/.*\/$/.test(t.text));
  if (!pick) pick = texts.find((t) => /^\/.*\/$/.test(t.text));
  if (!pick) pick = texts.find((t) => /[^\x00-\x7F]/.test(t.text));
  if (!pick) return null;
  let ipa = pick.text.trim();
  if (!ipa.startsWith('/')) ipa = '/' + ipa;
  if (!ipa.endsWith('/')) ipa = ipa + '/';
  return ipa;
}

/* 兜底来源：有道词典免费接口，simple.word[0].usphone 直接给美式 IPA。 */
async function fetchYoudaoUs(word) {
  try {
    const res = await fetch('https://dict.youdao.com/jsonapi?q=' + encodeURIComponent(word) + '&le=eng&client=web', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const usphone = data.simple && data.simple.word && data.simple.word[0] && data.simple.word[0].usphone;
    if (typeof usphone !== 'string' || !usphone.trim()) return null;
    return '/' + usphone.trim() + '/';
  } catch (e) {
    return null;
  }
}

async function pool(words, worker) {
  const results = new Map();
  let cursor = 0;
  async function run() {
    while (cursor < words.length) {
      const word = words[cursor++];
      results.set(word, await worker(word));
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, run));
  return results;
}

/* 把 "phonetic" 行插到每个词对象的 "word" 行之后，其余行原样保留；
 * 已带 phonetic 字段的词跳过，保证重复运行不会重复插入。 */
function writeDataFile(byId) {
  const lines = fs.readFileSync(DATA_PATH, 'utf8').split('\n');
  const out = [];
  let pendingId = null;
  let hasPhonetic = false;
  let inserted = 0;
  let skipped = 0;
  for (const line of lines) {
    const idMatch = line.match(/"id": "([^"]+)"/);
    if (idMatch) {
      pendingId = idMatch[1];
      hasPhonetic = false;
    }
    if (/^\s*"phonetic":/.test(line)) hasPhonetic = true;
    const wordMatch = line.match(/^\s*"word":/);
    if (wordMatch && pendingId) {
      if (hasPhonetic) {
        skipped++;
      } else if (byId[pendingId] && !byId[pendingId].done) {
        const indent = line.match(/^\s*/)[0];
        const escaped = byId[pendingId].ipa.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        out.push(indent + '"phonetic": "' + escaped + '",');
        byId[pendingId].done = true;
        inserted++;
      }
    }
    out.push(line);
  }
  fs.writeFileSync(DATA_PATH, out.join('\n'), 'utf8');
  return { inserted, skipped };
}

async function main() {
  const { entries, uniqueWords } = loadWords();
  console.log(`words: ${entries.length} entries, ${uniqueWords.length} unique`);

  const cache = loadCache();
  const fresh = [];
  uniqueWords.forEach((word) => {
    if (!(word in cache)) fresh.push(word);
  });
  console.log(`cache: ${uniqueWords.length - fresh.length} hit, ${fresh.length} to fetch`);

  await pool(fresh, async (word) => {
    let ipa = await fetchWithRetry(word);
    if (ipa === null) {
      // dictionaryapi.dev 没有音标时换有道兜底。
      ipa = await fetchYoudaoUs(word);
    }
    // 网络失败（undefined）不落缓存，下次运行会重试；两源都查不到记 null 避免反复请求。
    if (ipa !== undefined) cache[word] = ipa;
  });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n', 'utf8');

  const byId = {};
  entries.forEach(({ id, word }) => {
    const ipa = cache[word];
    if (ipa && ipa !== 'SKIP' && ipa !== null) byId[id] = { ipa, done: false };
  });

  const { inserted, skipped } = writeDataFile(byId);
  const missing = uniqueWords.filter((w) => !cache[w] || cache[w] === 'SKIP' || cache[w] === null);
  console.log(`data.js: ${inserted} phonetic inserted, ${skipped} already present`);
  console.log(`missing: ${missing.length} (${missing.slice(0, 20).join(', ')}${missing.length > 20 ? ', …' : ''})`);
  if (missing.length) console.log('查不到的单词已在页面中自动隐藏音标，可稍后重跑本脚本补齐。');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
