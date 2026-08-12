const test = require('node:test');
const assert = require('node:assert/strict');

const { createStorage, loadLearningApp, loadScript } = require('./helpers/browser-env');

const USER_ID = '8f45f983-fdd6-49f6-9d8e-7d6eb1e59892';

function wait(milliseconds = 50) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function createClient(remote, writes) {
  return {
    from() {
      return {
        /* 引擎按 app 选表后不再链 .eq('app_id', ...)，select 直接返回结果。 */
        select() {
          const rows = typeof remote === 'function' ? remote() : remote;
          return Promise.resolve({ data: rows, error: null });
        },
        upsert(rows) {
          writes.push(...rows);
          return Promise.resolve({ data: rows.map(({ item_key, payload, updated_at, deleted_at }) => ({ item_key, payload, updated_at, deleted_at })), error: null });
        }
      };
    },
    channel() { return { on() { return this; }, subscribe() { return this; } }; },
    removeChannel() {}
  };
}

/* 加载构建后的 app 脚本 + 共享引擎 + words 适配器。默认预置 owner 标记，
 * 让激活走纯 applyRows 路径，不弹 confirm 合并对话框。 */
async function readyAdapter({ remote = [], owner = true } = {}) {
  const localStorage = createStorage();
  /* owner 标记由引擎用 JSON.stringify 写入，播种必须同格式。 */
  if (owner) localStorage.setItem('hub.sync.owner.words', JSON.stringify(USER_ID));
  const context = loadLearningApp({ localStorage });
  context.CustomEvent = function CustomEvent(type, init) { this.type = type; this.detail = init && init.detail; };
  context.dispatchEvent = () => {};
  context.setInterval = () => 0;
  context.clearInterval = () => {};
  context.confirm = () => true;
  const writes = [];
  const session = { user: { id: USER_ID } };
  context.HubAuth = {
    init: () => Promise.resolve(session),
    getSession: () => session,
    getClient: () => createClient(remote, writes),
    onChange() {}
  };
  loadScript(context, 'shared/sync-store.js');
  loadScript(context, 'shared/hub-sync.js');
  loadScript(context, 'integrations/words/hub-sync.js');
  await context.WordTales.LearningProgress.init();
  return { context, writes, progress: context.WordTales.LearningProgress };
}

test('只同步星标词与打卡列：未标记词和 meta 等前缀不上传', async () => {
  const { context, writes, progress } = await readyAdapter();
  const entries = context.WordTales.Data.getAllEntries();
  const starred = entries[0].id;
  const plain = entries[1].id;

  context.WordTales.HubProfileSync.start();
  await wait();
  await progress.setStarred(starred, true, 'manual');
  await progress.rateWord(plain, 'Good', {}, 'adapter-good');
  await progress.setColumnCompleted('s1col1', '2026-08-09', true);

  context.WordTales.HubProfileSync.queue();
  await context.HubSync.flush('words');

  const keys = writes.map((row) => row.item_key);
  assert.equal(keys.includes('word:' + starred), true);
  assert.equal(keys.includes('word:' + plain), false);
  assert.equal(keys.includes('column:2026-08-09:s1col1'), true);
  assert.equal(keys.some((key) => key === 'meta' || key.indexOf('article:') === 0
    || key.indexOf('analysis:') === 0 || key.indexOf('day:') === 0 || key.indexOf('event:') === 0), false);
});

test('取消星标会软删除云端行', async () => {
  const { context, writes, progress } = await readyAdapter();
  const entry = context.WordTales.Data.getAllEntries()[0].id;

  context.WordTales.HubProfileSync.start();
  await wait();
  await progress.setStarred(entry, true, 'manual');
  context.WordTales.HubProfileSync.queue();
  await context.HubSync.flush('words');

  const uploaded = writes.find((row) => row.item_key === 'word:' + entry);
  assert.equal(!!uploaded, true);
  assert.equal(uploaded.deleted_at, null);

  writes.length = 0;
  await progress.setStarred(entry, false, '');
  context.WordTales.HubProfileSync.queue();
  await context.HubSync.flush('words');

  const deleted = writes.find((row) => row.item_key === 'word:' + entry);
  assert.equal(!!deleted, true);
  assert.notEqual(deleted.deleted_at, null);
});

test('远端 deleted 行删除本地词条记录，article/meta 等前缀被忽略', async () => {
  const rows = [];
  const { context, writes, progress } = await readyAdapter({ remote: () => rows });
  const entry = context.WordTales.Data.getAllEntries()[0].id;
  rows.push(
    { item_key: 'word:' + entry, payload: {}, updated_at: '2026-08-11T00:00:00.000Z', deleted_at: '2026-08-11T01:00:00.000Z' },
    { item_key: 'article:s1col1', payload: { viewCount: 3 }, updated_at: '2026-08-11T00:00:00.000Z', deleted_at: null },
    { item_key: 'meta', payload: { version: 2 }, updated_at: '2026-08-11T00:00:00.000Z', deleted_at: null }
  );

  await progress.setStarred(entry, true, 'manual');
  context.WordTales.HubProfileSync.start();
  await wait();

  assert.equal(progress.getData().words[entry], undefined);
  assert.equal(Object.keys(progress.getData().articles || {}).length, 0);
  assert.equal(writes.length, 0);
});
