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

test('Again、Hard 和 Good 分别更新复习状态与生词状态', async () => {
  const { data, progress } = await readyProgress();
  const [againEntry, hardEntry, goodEntry] = data.getAllEntries();

  const again = await progress.rateWord(againEntry.id, 'Again', {}, 'again-1');
  const hard = await progress.rateWord(hardEntry.id, 'Hard', {}, 'hard-1');
  const good = await progress.rateWord(goodEntry.id, 'Good', {}, 'good-1');

  assert.equal(again.lastResult, 'Again');
  assert.equal(again.reviewCount, 1);
  assert.equal(again.lapseCount, 1);
  assert.equal(again.successStreak, 0);
  assert.equal(again.isStarred, true);
  assert.equal(hard.lastResult, 'Hard');
  assert.equal(hard.successStreak, 1);
  assert.equal(hard.isStarred, false);
  assert.equal(good.lastResult, 'Good');
  assert.equal(good.successStreak, 1);
  assert.equal(good.isStarred, false);

  const day = progress.getData().days[progress.getDayKey()];
  assert.equal(day.again, 1);
  assert.equal(day.hard, 1);
  assert.equal(day.good, 1);
  assert.equal(day.unfamiliar, 1);
  assert.equal(day.known, 2);
});

test('重复 submission ID 不会造成二次调度或重复事件', async () => {
  const { data, progress } = await readyProgress();
  const entry = data.getAllEntries()[0];

  await progress.rateWord(entry.id, 'Good', {}, 'same-submission');
  const before = progress.getEntryState(entry.id);
  const eventCount = progress.getData().events.length;
  const duplicate = await progress.rateWord(entry.id, 'Again', {}, 'same-submission');

  assert.equal(duplicate.reviewCount, before.reviewCount);
  assert.equal(duplicate.lastResult, 'Good');
  assert.equal(duplicate.nextReviewAt, before.nextReviewAt);
  assert.equal(progress.getData().events.length, eventCount);
  assert.equal(progress.getData().days[progress.getDayKey()].again, 0);
});

test('出现项 ID 统一写入规范词条，别名不会产生第二份档案', async () => {
  const { progress } = await readyProgress();
  const primaryId = 's1col1-radiate';
  const aliasId = 's6col2-radiate';

  await progress.rateWord(aliasId, 'Hard', { occurrenceId: aliasId }, 'alias-rating');

  assert.equal(progress.getEntryState(primaryId).reviewCount, 1);
  assert.equal(progress.getEntryState(aliasId).entryId, primaryId);
  assert.deepEqual(Object.keys(progress.getData().words), [primaryId]);
  assert.equal(progress.getData().words[primaryId].sourceOccurrenceId, aliasId);
});

test('评分接口拒绝无效评分，并安全忽略未知词条', async () => {
  const { progress } = await readyProgress();

  await assert.rejects(progress.rateWord('s1col1-radiate', 'Easy'), /Unsupported learning rating/);
  assert.equal(await progress.rateWord('missing-entry', 'Good', {}, 'missing'), null);
  assert.equal(progress.getData().events.length, 0);
});

test('到期队列排除未来词条并优先返回逾期更久的词条', async () => {
  const { data, progress } = await readyProgress();
  const [olderEntry, newerEntry, futureEntry] = data.getAllEntries();
  await progress.rateWord(olderEntry.id, 'Good', {}, 'due-old');
  await progress.rateWord(newerEntry.id, 'Good', {}, 'due-new');
  await progress.rateWord(futureEntry.id, 'Good', {}, 'due-future');

  const now = new Date();
  progress.getData().words[olderEntry.id].nextReviewAt = new Date(now.getTime() - 3 * 86400000).toISOString();
  progress.getData().words[newerEntry.id].nextReviewAt = new Date(now.getTime() - 86400000).toISOString();
  progress.getData().words[futureEntry.id].nextReviewAt = new Date(now.getTime() + 86400000).toISOString();

  const dueIds = Array.from(progress.getDueEntries(now), (item) => item.entry.id);
  assert.deepEqual(dueIds, [olderEntry.id, newerEntry.id]);
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

test('无效完成记录安全失败，并且不会改动 FSRS 与当日统计', async () => {
  const { data, progress } = await readyProgress();
  const entry = data.getAllEntries()[0];
  await progress.rateWord(entry.id, 'Good', {}, 'record-independence');
  const wordsBefore = JSON.stringify(progress.getData().words);
  const daysBefore = JSON.stringify(progress.getData().days);
  const eventsBefore = JSON.stringify(progress.getData().events);

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
  assert.equal(JSON.stringify(progress.getData().events), eventsBefore);

  await progress.rateWord(data.getAllEntries()[1].id, 'Hard', {}, 'rating-after-record');
  progress.setStarred(data.getAllEntries()[2].id, true, 'test');
  assert.equal(progress.isColumnCompleted('s1col1', '2026-08-09'), true);
});

test('日期键使用本地日历日，不会被 UTC 日期偏移', async () => {
  const { progress } = await readyProgress();
  assert.equal(progress.getDayKey(new Date(2026, 7, 9, 23, 59, 59)), '2026-08-09');
});

test('v1 档案迁移会幂等合并别名记录并保留关键统计', async () => {
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
    }
  };
  const { progress } = await readyProgress({
    'wordtales.learning.v1': JSON.stringify(legacyProfile),
    'wordtales.learning.v2-migrated': '1'
  });
  const record = progress.getEntryState(primaryId);

  assert.deepEqual(Object.keys(progress.getData().words), [primaryId]);
  assert.equal(record.firstSeenAt, '2025-01-05T00:00:00.000Z');
  assert.equal(record.lastSeenAt, '2025-01-25T00:00:00.000Z');
  assert.equal(record.reviewCount, 5);
  assert.equal(record.lapseCount, 3);
  assert.equal(record.successStreak, 1);
  assert.equal(record.isStarred, true);
  assert.deepEqual(JSON.parse(JSON.stringify(progress.getData().columnCompletions)), {});
});
