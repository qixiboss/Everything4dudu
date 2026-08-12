const test = require('node:test');
const assert = require('node:assert/strict');

const { createStorage, loadLearningApp, loadScript } = require('./helpers/browser-env');

function createClient(remote, writes) {
  return {
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        maybeSingle() { return Promise.resolve({ data: remote.value, error: null }); },
        upsert(row) { writes.push(row); remote.value = { profile: row.profile, updated_at: new Date().toISOString() }; return Promise.resolve({ error: null }); }
      };
    }
  };
}

async function readyCloud(remoteProfile, owner) {
  const localStorage = createStorage();
  if (owner) localStorage.setItem('wordtales.cloud-sync.owner.v1', owner);
  const context = loadLearningApp({ localStorage });
  const remote = { value: remoteProfile || null };
  const writes = [];
  const session = { user: { id: '8f45f983-fdd6-49f6-9d8e-7d6eb1e59892', email: 'reader@example.com' } };
  context.WordTales.Auth = {
    getSession: () => session,
    getClient: () => createClient(remote, writes),
    onChange: () => () => {}
  };
  loadScript(context, '_site/words/js/cloud-sync.js');
  await context.WordTales.LearningProgress.init();
  await context.WordTales.CloudSync.init();
  return { context, remote, writes, progress: context.WordTales.LearningProgress };
}

test('首次登录只走分条同步：不再上传整档到 learning_profiles', async () => {
  const { progress, writes, context } = await readyCloud();
  const entry = context.WordTales.Data.getAllEntries()[0];
  await progress.rateWord(entry.id, 'Good', {}, 'cloud-first-login');

  await context.WordTales.CloudSync.connectProfile();

  // 旧通道已停用：connectProfile 不写 learning_profiles，本地档案不受影响，
  // 同步全部由 HubProfileSync（hub-sync.js）分条完成。
  assert.equal(progress.getData().words[entry.id].reviewCount, 1);
  assert.equal(writes.length, 0);
  assert.equal(context.WordTales.CloudSync.getStatus(), 'synced');
});

test('远端存在陈旧 learning_profiles 行时也不改动本地数据', async () => {
  const remoteProfile = {
    version: 2,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-10T00:00:00.000Z',
    words: {}, articles: {}, analyses: {}, days: {}, columnCompletions: { '2026-08-09': { s1col1: true } },
    reminders: { lastShown: '', notifications: false }, processedSubmissions: [], events: []
  };
  const { progress, writes, context } = await readyCloud({ profile: remoteProfile, updated_at: '2099-01-01T00:00:00.000Z' }, '8f45f983-fdd6-49f6-9d8e-7d6eb1e59892');

  await context.WordTales.CloudSync.connectProfile();

  // 永不从远端档案恢复：即使旧表还有数据，本地进度也原样保留、零写入。
  assert.equal(progress.isColumnCompleted('s1col1', '2026-08-09'), false);
  assert.equal(writes.length, 0);
  assert.equal(context.WordTales.CloudSync.getStatus(), 'synced');
});
