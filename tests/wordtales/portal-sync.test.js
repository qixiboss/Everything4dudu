'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createStorage, loadLearningApp, loadScript } = require('./helpers/browser-env');

const USER = { id: '8f45f983-fdd6-49f6-9d8e-7d6eb1e59892', email: 'reader@example.com' };

function statusMount(context) {
  let statusElement = null;
  const mount = {
    set innerHTML(_) { statusElement = null; },
    querySelector() { return statusElement; },
    appendChild(element) { statusElement = element; }
  };
  context.document.getElementById = (id) => id === 'authMount' ? mount : null;
  return { get element() { return statusElement; } };
}

async function readyPortal({ session = { user: USER }, timers = false } = {}) {
  const context = loadLearningApp({ localStorage: createStorage() });
  const authListeners = [];
  const sync = { adapter: null, starts: 0, queues: 0 };
  const status = statusMount(context);
  context.HubAuth = {
    init: () => Promise.resolve(session),
    getSession: () => session,
    isConfigured: () => true,
    onChange(listener) { authListeners.push(listener); }
  };
  context.HubAppSync = {
    start(adapter) { sync.adapter = adapter; sync.starts += 1; return true; },
    queue(adapter) { sync.adapter = adapter; sync.queues += 1; }
  };
  let scheduled = null;
  let cleared = 0;
  if (timers) {
    context.setTimeout = (callback) => { scheduled = callback; return 1; };
    context.clearTimeout = () => { cleared += 1; };
  }
  loadScript(context, 'site/words/js/portal-sync.js');
  await context.WordTales.PortalSync.init();
  await context.WordTales.LearningProgress.init();
  return { context, authListeners, sync, status, getScheduled: () => scheduled, getCleared: () => cleared };
}

test('PortalSync 建立门户会话后只注册分条同步并显示账号状态', async () => {
  const { context, sync, status } = await readyPortal();
  assert.equal(status.element.textContent.includes('re…@example.com'), true);
  assert.equal(context.WordTales.PortalSync.start(), true);
  assert.equal(sync.starts, 1);
  assert.equal(sync.adapter.app, 'words');

  const entry = context.WordTales.Data.getAllEntries()[0];
  context.WordTales.LearningProgress.trackWord(entry.id, 'card');
  assert.equal(sync.adapter.items().some((item) => item.item_key === 'word:' + entry.id), false);
  await context.WordTales.LearningProgress.setStarred(entry.id, true, 'manual');
  assert.equal(sync.adapter.items().some((item) => item.item_key === 'word:' + entry.id), true);
  assert.equal(context.WordTales.PortalSync.getStatus(), 'synced');
});

test('PortalSync 对连续保存只保留最后一次延迟扫描', async () => {
  const { context, sync, getScheduled, getCleared } = await readyPortal({ timers: true });
  context.WordTales.PortalSync.start();
  context.WordTales.PortalSync.schedule();
  context.WordTales.PortalSync.schedule();
  assert.equal(getCleared(), 1);
  assert.equal(typeof getScheduled(), 'function');
  getScheduled()();
  assert.equal(sync.queues, 1);
});

test('PortalSync 登录变化更新本地模式并在重新登录后扫描', async () => {
  const { context, authListeners, sync, status } = await readyPortal();
  context.WordTales.PortalSync.start();
  authListeners[0](null);
  assert.equal(context.WordTales.PortalSync.getStatus(), 'local');
  assert.equal(status.element.textContent, '本地进度模式');
  authListeners[0]({ user: USER });
  assert.equal(sync.queues, 1);
});

test('PortalSync 远端落盘失败向共享同步引擎返回拒绝', async () => {
  const { context, sync } = await readyPortal();
  context.WordTales.PortalSync.start();
  context.WordTales.LearningProgress.replaceData = () => Promise.reject(new Error('storage failed'));
  await assert.rejects(
    sync.adapter.applyRemote([{ item_key: 'word:example', payload: { isStarred: true }, deleted_at: null }]),
    /storage failed/
  );
});

test('PortalSync 不再包含整档 learning_profiles 读写通道', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../../site/words/js/portal-sync.js'), 'utf8');
  assert.doesNotMatch(source, /learning_profiles|\.from\(|maybeSingle/);
  assert.match(source, /HubAppSync\.start/);
});
