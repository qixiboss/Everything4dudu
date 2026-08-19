const test = require('node:test');
const assert = require('node:assert/strict');

const { loadLearningApp, loadScript } = require('./helpers/browser-env');

async function readyStarredWords() {
  const context = loadLearningApp();
  await context.WordTales.LearningProgress.init();
  loadScript(context, 'site/words/js/starred-words.js');
  return {
    data: context.WordTales.Data,
    progress: context.WordTales.LearningProgress,
    starred: context.WordTales.StarredWords
  };
}

test('星标列表汇总全部标记词条并按正文顺序排列', async () => {
  const { data, progress, starred } = await readyStarredWords();

  assert.equal(starred.collectRows().length, 0);

  progress.setStarred('s6col2-radiate', true, 'game');
  progress.setStarred('s1col1-barren', true, 'manual');

  const rows = starred.collectRows();
  assert.equal(rows.length, 2);
  /* radiate 的规范词条来自第一份第一列，barren 紧随其后。 */
  /* vm 上下文产生的数组跨 realm，先用 Array.from 转回测试侧再比较。 */
  assert.deepEqual(Array.from(rows, (row) => row.entryId), ['s1col1-radiate', 's1col1-barren']);
  assert.deepEqual(Array.from(rows, (row) => row.word), ['radiate', 'barren']);
  rows.forEach((row) => {
    assert.ok(row.phonetic.startsWith('/'));
    assert.ok(row.pos.length > 0);
    assert.ok(row.meaning.length > 0);
    assert.match(row.source, /第一份 · 第一列/);
    assert.ok(row.sentence.length > 0);
    assert.ok(row.starredAt.length > 0);
  });

  const entry = data.getEntry('s1col1-radiate');
  const occurrence = data.getOccurrence(entry.primaryOccurrenceId);
  assert.equal(rows[0].phonetic, occurrence.word.phonetic);

  progress.setStarred('s1col1-barren', false);
  assert.deepEqual(Array.from(starred.collectRows(), (row) => row.word), ['radiate']);
});

test('CSV 按所选列导出并正确转义与格式化', async () => {
  const { progress, starred } = await readyStarredWords();
  progress.setStarred('s1col1-proximity', true, 'manual');

  const rows = starred.collectRows();
  const allIds = Array.from(starred.getExportColumns(), (column) => column.id);
  assert.deepEqual(allIds, ['word', 'phonetic', 'pos', 'meaning', 'source', 'sentence', 'starredAt']);

  const full = starred.buildCsv(rows, allIds);
  const lines = full.replace(/^﻿/, '').split('\r\n');
  assert.equal(lines.length, 2);
  assert.equal(lines[0], '单词,音标,词性,释义,词集·栏目,语境句子,标记时间');
  const cells = lines[1].split(',');
  assert.equal(cells[0], 'proximity');
  assert.equal(cells[2], 'n.');
  /* 标记时间被格式化为本地“日期 时:分”。 */
  assert.match(lines[1], /\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);

  /* 列顺序以模块定义的固定顺序为准，与勾选顺序无关。 */
  const partial = starred.buildCsv(rows, ['meaning', 'word']);
  const partialLines = partial.replace(/^﻿/, '').split('\r\n');
  assert.equal(partialLines[0], '单词,释义');
  assert.equal(partialLines[1], 'proximity,接近；邻近');

  /* 带 BOM，Excel 打开中文不乱码。 */
  assert.ok(full.charCodeAt(0) === 0xfeff);
});

test('CSV 对包含逗号、引号和换行的内容进行转义', async () => {
  const { starred } = await readyStarredWords();
  const rows = [{ word: 'a,b', phonetic: '', pos: '', meaning: '含"引号"', source: 'x', sentence: '换\n行', starredAt: '' }];

  const csv = starred.buildCsv(rows, ['word', 'meaning', 'sentence']);
  const lines = csv.replace(/^﻿/, '').split('\r\n');
  assert.equal(lines[0], '单词,释义,语境句子');
  assert.equal(lines[1], '"a,b","含""引号""","换\n行"');
});

test('按词集筛选导出范围，跨词集同词条仍可命中', async () => {
  const { progress, starred } = await readyStarredWords();
  /* craftsmanship 仅出现在第一份；radiate 在第一份与第六份均有出现。 */
  progress.setStarred('s1col1-craftsmanship', true, 'manual');
  progress.setStarred('s6col2-radiate', true, 'game');

  const rows = starred.collectRows();
  const craftsmanship = rows.find((row) => row.word === 'craftsmanship');
  const radiate = rows.find((row) => row.word === 'radiate');
  assert.deepEqual(Array.from(craftsmanship.setIds), ['set1']);
  assert.deepEqual(Array.from(radiate.setIds), ['set1', 'set6']);

  const setFilters = Array.from(starred.getSetFilters());
  assert.equal(setFilters.length, 7);
  assert.equal(setFilters[0].id, 'set1');

  const set6 = starred.filterRowsBySets(rows, ['set6']);
  assert.equal(set6.length, 1);
  assert.equal(set6[0].word, 'radiate');

  const set1 = starred.filterRowsBySets(rows, ['set1']);
  assert.equal(set1.length, 2);

  assert.equal(starred.filterRowsBySets(rows, ['set2']).length, 0);
  assert.equal(starred.filterRowsBySets(rows, []).length, 0);
});
