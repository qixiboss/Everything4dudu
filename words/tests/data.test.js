const test = require('node:test');
const assert = require('node:assert/strict');

const { createBrowserContext, loadScript } = require('./helpers/browser-env');
const {
  CORPUS_SET_COUNT,
  CORPUS_COLUMN_COUNT,
  CORPUS_OCCURRENCE_COUNT,
  CORPUS_ENTRY_COUNT,
  RADIATE_PRIMARY_ID,
  RADIATE_ALIAS_ID
} = require('./helpers/constants');

function loadData() {
  const context = createBrowserContext();
  loadScript(context, 'vocab-essays/js/namespace.js');
  loadScript(context, 'vocab-essays/js/data.js');
  return context.WordTales.Data;
}

test('语料索引暴露完整的词集、栏目、出现项和规范词条', () => {
  const data = loadData();
  const columns = data.sets.flatMap((set) => set.columns);
  const occurrences = columns.flatMap((column) => column.words);
  const entries = data.getAllEntries();

  assert.equal(data.sets.length, CORPUS_SET_COUNT);
  assert.equal(columns.length, CORPUS_COLUMN_COUNT);
  assert.equal(occurrences.length, CORPUS_OCCURRENCE_COUNT);
  assert.equal(entries.length, CORPUS_ENTRY_COUNT);
  assert.ok(entries.every((entry) => entry.contexts.length > 0));
  assert.ok(entries.every((entry) => entry.contexts.some((context) => context.sentence)));
});

test('人工确认的同义出现项共享规范词条和全部语境', () => {
  const data = loadData();

  assert.equal(data.resolveEntryId(RADIATE_ALIAS_ID), RADIATE_PRIMARY_ID);
  assert.equal(data.getEntry(RADIATE_ALIAS_ID), data.getEntry(RADIATE_PRIMARY_ID));
  assert.equal(data.getEntry(RADIATE_PRIMARY_ID).occurrences.length, 2);
  assert.deepEqual(
    Array.from(data.getContexts(RADIATE_PRIMARY_ID), (context) => context.occurrenceId),
    [RADIATE_PRIMARY_ID, RADIATE_ALIAS_ID]
  );
});

test('同形异义词不会仅按拼写被错误合并', () => {
  const data = loadData();
  const briskEntries = data.getAllEntries().filter((entry) => entry.word === 'brisk');

  assert.equal(briskEntries.length, 2);
  assert.notEqual(briskEntries[0].id, briskEntries[1].id);
  assert.notEqual(briskEntries[0].meaning, briskEntries[1].meaning);
});

test('查询方法对未知 ID 返回安全结果，并保护语境数组', () => {
  const data = loadData();
  const entry = data.getAllEntries()[0];
  const contexts = data.getContexts(entry.id);
  contexts.length = 0;

  assert.ok(data.getContexts(entry.id).length > 0);
  assert.equal(data.getEntry('missing-entry'), null);
  assert.equal(data.getOccurrence('missing-occurrence'), null);
  assert.deepEqual(Array.from(data.getContexts('missing-entry')), []);
});
