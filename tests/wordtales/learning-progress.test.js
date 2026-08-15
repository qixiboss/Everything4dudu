const test = require('node:test');
const assert = require('node:assert/strict');

const { createStorage, loadLearningApp } = require('./helpers/browser-env');
const { RADIATE_PRIMARY_ID, RADIATE_ALIAS_ID } = require('./helpers/constants');

async function readyProgress(initialStorage = {}) {
  const localStorage = typeof initialStorage.getItem === 'function' ? initialStorage : createStorage(initialStorage);
  const context = loadLearningApp({ localStorage });
  await context.WordTales.LearningProgress.init();
  return { context, localStorage, data: context.WordTales.Data, progress: context.WordTales.LearningProgress };
}

test('星标支持添加与取消，出现项 ID 统一写入规范词条', async () => {
  const { progress } = await readyProgress();
  const primaryId = 's1col1-radiate';
  const aliasId = 's6col2-radiate';

  progress.setStarred(aliasId, true, 'game');

  assert.equal(progress.getEntryState(primaryId).isStarred, true);
  assert.equal(progress.getEntryState(aliasId).entryId, primaryId);
  assert.deepEqual(Object.keys(progress.getData().words), [primaryId]);
  progress.setStarred(primaryId, false);
  assert.equal(progress.getEntryState(aliasId).isStarred, false);
});

test('词卡浏览只保存交互计数，不再生成 FSRS 调度或复习历史', async () => {
  const { data, progress } = await readyProgress();
  const entry = data.getAllEntries()[0];

  progress.trackWord(entry.id, 'click', { occurrenceId: entry.primaryOccurrenceId });
  progress.trackWord(entry.id, 'card', { occurrenceId: entry.primaryOccurrenceId });

  const record = progress.getEntryState(entry.id);
  assert.equal(record.clickCount, 1);
  assert.equal(record.cardFlipCount, 1);
  ['fsrsCard', 'nextReviewAt', 'lastReviewedAt', 'lastResult', 'reviewCount', 'lapseCount']
    .forEach((field) => assert.equal(Object.hasOwn(record, field), false));
  assert.equal(Object.hasOwn(progress.getData(), 'events'), false);
  assert.equal(Object.hasOwn(progress.getData(), 'processedSubmissions'), false);
});

test('栏目完成记录按本地日期和栏目隔离，并可以取消', async () => {
  const { progress } = await readyProgress();
  const date = '2026-08-09';

  assert.equal(progress.isColumnCompleted('s1col1', date), false);
  const checked = await progress.setColumnCompleted('s1col1', date, true);
  assert.equal(checked.completed, true);
  assert.equal(checked.saved, true);
  assert.equal(progress.isColumnCompleted('s1col1', date), true);
  assert.equal(progress.isColumnCompleted('s1col2', date), false);
  assert.equal(progress.isColumnCompleted('s1col1', '2026-08-08'), false);
  assert.deepEqual(Array.from(progress.getCompletedColumnIds(date)), ['s1col1']);

  const unchecked = await progress.setColumnCompleted('s1col1', date, false);
  assert.equal(unchecked.completed, false);
  assert.equal(unchecked.saved, true);
  assert.equal(progress.isColumnCompleted('s1col1', date), false);
  assert.equal(Object.hasOwn(progress.getData().columnCompletions, date), false);
});

test('栏目完成记录会保存并在重新加载后恢复', async () => {
  const localStorage = createStorage({ 'wordtales.learning.v2-migrated': '1' });
  const first = await readyProgress(localStorage);
  await first.progress.setColumnCompleted('s3col5', '2026-08-09', true);

  const reloaded = await readyProgress(localStorage);
  assert.equal(reloaded.progress.isColumnCompleted('s3col5', '2026-08-09'), true);
  assert.deepEqual(Array.from(reloaded.progress.getCompletedColumnIds('2026-08-09')), ['s3col5']);
});

test('完成记录保存失败时会回滚内存状态并报告失败', async () => {
  const values = new Map([['wordtales.learning.v2-migrated', '1']]);
  const failingStorage = {
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    setItem() { throw new Error('quota exceeded'); },
    removeItem(key) { values.delete(String(key)); }
  };
  const { progress } = await readyProgress(failingStorage);

  const result = await progress.setColumnCompleted('s1col1', '2026-08-09', true);
  assert.equal(result.saved, false);
  assert.equal(result.completed, false);
  assert.equal(progress.isColumnCompleted('s1col1', '2026-08-09'), false);

  progress.getData().columnCompletions['2026-08-09'] = { s1col1: true };
  const uncheck = await progress.setColumnCompleted('s1col1', '2026-08-09', false);
  assert.equal(uncheck.saved, false);
  assert.equal(uncheck.completed, true);
  assert.equal(progress.isColumnCompleted('s1col1', '2026-08-09'), true);
});

test('完成记录迁移仅保留真实日期、已知栏目和布尔 true', async () => {
  const profile = {
    version: 2,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-09T00:00:00.000Z',
    words: {},
    columnCompletions: {
      '2026-08-09': { s1col1: true, s1col2: false, missingColumn: true },
      '2026-02-30': { s1col1: true },
      malformed: { s1col1: true }
    }
  };
  const { progress } = await readyProgress({
    'wordtales.learning.v1': JSON.stringify(profile),
    'wordtales.learning.v2-migrated': '1'
  });

  assert.deepEqual(
    JSON.parse(JSON.stringify(progress.getData().columnCompletions)),
    { '2026-08-09': { s1col1: true } }
  );
});

test('无效完成记录安全失败，并且不会改动星标与浏览统计', async () => {
  const { data, progress } = await readyProgress();
  const entry = data.getAllEntries()[0];
  progress.trackWord(entry.id, 'card', { occurrenceId: entry.primaryOccurrenceId });
  const wordsBefore = JSON.stringify(progress.getData().words);
  const daysBefore = JSON.stringify(progress.getData().days);

  assert.equal((await progress.setColumnCompleted('missing-column', '2026-08-09', true)).saved, false);
  assert.equal((await progress.setColumnCompleted('s1col1', '2026-02-30', true)).saved, false);
  const invalidValue = await progress.setColumnCompleted('s1col1', '2026-08-09', 'false');
  assert.equal(invalidValue.invalid, true);
  assert.equal(progress.isColumnCompleted('s1col1', '2026-08-09'), false);
  assert.equal((await progress.setColumnCompleted('s1col1', '2026-08-09', true)).saved, true);
  const duplicate = await progress.setColumnCompleted('s1col1', '2026-08-09', true);
  assert.equal(duplicate.completed, true);
  assert.equal(duplicate.unchanged, true);
  assert.equal(JSON.stringify(progress.getData().words), wordsBefore);
  assert.equal(JSON.stringify(progress.getData().days), daysBefore);

  progress.setStarred(data.getAllEntries()[2].id, true, 'test');
  assert.equal(progress.isColumnCompleted('s1col1', '2026-08-09'), true);
});

test('日期键使用本地日历日，不会被 UTC 日期偏移', async () => {
  const { progress } = await readyProgress();
  assert.equal(progress.getDayKey(new Date(2026, 7, 9, 23, 59, 59)), '2026-08-09');
});

test('旧档案迁移会合并别名并只保留仍使用的星标与浏览数据', async () => {
  const primaryId = 's1col1-radiate';
  const aliasId = 's6col2-radiate';
  const legacyProfile = {
    version: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-02-01T00:00:00.000Z',
    words: {
      [primaryId]: {
        firstSeenAt: '2025-01-10T00:00:00.000Z',
        lastSeenAt: '2025-01-20T00:00:00.000Z',
        reviewCount: 2,
        lapseCount: 1,
        successStreak: 1,
        isStarred: false
      },
      [aliasId]: {
        firstSeenAt: '2025-01-05T00:00:00.000Z',
        lastSeenAt: '2025-01-25T00:00:00.000Z',
        reviewCount: 3,
        lapseCount: 2,
        successStreak: 2,
        isStarred: true,
        starredAt: '2025-01-25T00:00:00.000Z'
      }
    },
    days: {
      '2025-01-25': { wordClicks: 4, cardFlips: 2, good: 3, hard: 1, again: 2, known: 4, unfamiliar: 2 }
    },
    processedSubmissions: ['legacy-rating'],
    events: [{ type: 'word_rating', targetId: primaryId }]
  };
  const { localStorage, progress } = await readyProgress({
    'wordtales.learning.v1': JSON.stringify(legacyProfile),
    'wordtales.learning.v2-migrated': '1'
  });
  const record = progress.getEntryState(primaryId);

  assert.deepEqual(Object.keys(progress.getData().words), [primaryId]);
  assert.equal(record.firstSeenAt, '2025-01-05T00:00:00.000Z');
  assert.equal(record.lastSeenAt, '2025-01-25T00:00:00.000Z');
  assert.equal(record.isStarred, true);
  assert.equal(Object.hasOwn(record, 'reviewCount'), false);
  assert.equal(Object.hasOwn(record, 'lapseCount'), false);
  assert.equal(Object.hasOwn(record, 'fsrsCard'), false);
  assert.deepEqual(JSON.parse(JSON.stringify(progress.getData().days)), {
    '2025-01-25': { wordClicks: 4, cardFlips: 2, articles: 0, analyses: 0 }
  });
  assert.equal(Object.hasOwn(progress.getData(), 'events'), false);
  assert.equal(Object.hasOwn(progress.getData(), 'processedSubmissions'), false);
  const persisted = JSON.parse(localStorage.getItem('wordtales.learning.v1'));
  assert.equal(persisted.version, 3);
  assert.equal(Object.hasOwn(persisted.words[primaryId], 'fsrsCard'), false);
  assert.equal(Object.hasOwn(persisted, 'events'), false);
  assert.deepEqual(JSON.parse(JSON.stringify(progress.getData().columnCompletions)), {});
});
