const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    values
  };
}

function wait(milliseconds = 40) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function syncHarness({ session = null, remote = [], initialStorage = {} } = {}) {
  const state = { session };
  const localStorage = storage(initialStorage);
  const writes = [];
  const authListeners = [];
  const client = {
    from() {
      return {
        select() { return this; },
        eq() {
          const rows = typeof remote === 'function' ? remote(state.session) : remote;
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
  const context = vm.createContext({
    console,
    localStorage,
    setTimeout,
    clearTimeout,
    confirm: () => false,
    CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init && init.detail; },
    dispatchEvent() {}
  });
  context.window = context;
  context.HubAuth = {
    init: () => Promise.resolve(state.session),
    getSession: () => state.session,
    getClient: () => client,
    onChange(listener) { authListeners.push(listener); }
  };
  vm.runInContext(fs.readFileSync(path.join(root, 'shared/sync-store.js'), 'utf8'), context);
  return { context, state, localStorage, writes, authListeners };
}

test('主页把三个应用标记为登录后访问且不暴露公开注册入口', () => {
  ['index.html', 'words/index.html', 'training/index.html', 'exam-schedule/index.html'].forEach((file) => {
    assert.equal(fs.existsSync(path.join(root, file)), true, file);
  });
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(home, /href="words\/" data-protected-app="words"/);
  assert.match(home, /href="training\/" data-protected-app="training"/);
  assert.match(home, /href="exam-schedule\/" data-protected-app="exam-schedule"/);
  assert.match(home, /data-login-open/);
  assert.match(home, /role="dialog"/);
  assert.match(home, /autocomplete="current-password"/);
  assert.doesNotMatch(home, /data-auth-mode="register"|register-password-confirm/);
  assert.match(home, /Content-Security-Policy/);
  const schedule = fs.readFileSync(path.join(root, 'exam-schedule/index.html'), 'utf8');
  assert.doesNotMatch(schedule, /srcdoc=|<iframe\b/i);
});

test('邮箱密码登录由 Supabase Auth 建立会话，退出后立即清除本地会话', async () => {
  const calls = [];
  let clientOptions;
  const session = { user: { id: 'user-a', email: 'dudu@example.com' } };
  let authListener;
  const client = {
    auth: {
      onAuthStateChange(listener) { authListener = listener; },
      getSession() { return Promise.resolve({ data: { session: null }, error: null }); },
      signInWithPassword(payload) { calls.push(['login', payload]); return Promise.resolve({ data: { session }, error: null }); },
      signOut() { calls.push(['signout']); return Promise.resolve({ error: null }); }
    }
  };
  const context = vm.createContext({
    console,
    CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init && init.detail; },
    dispatchEvent() {},
    HubConfig: { supabaseUrl: 'https://example.supabase.co', publishableKey: 'sb_publishable_test' },
    supabase: { createClient(_url, _key, options) { clientOptions = options; return client; } }
  });
  context.window = context;
  vm.runInContext(fs.readFileSync(path.join(root, 'shared/hub-auth.js'), 'utf8'), context);
  await context.HubAuth.init();
  await context.HubAuth.signInWithPassword('dudu@example.com', 'password123');
  assert.equal(context.HubAuth.getSession().user.email, 'dudu@example.com');
  await context.HubAuth.signOut();
  assert.equal(context.HubAuth.getSession(), null);
  assert.equal(JSON.stringify(calls[0]), JSON.stringify(['login', { email: 'dudu@example.com', password: 'password123' }]));
  assert.equal(typeof context.HubAuth.signUpWithPassword, 'undefined');
  assert.equal(typeof authListener, 'function');
  assert.equal(clientOptions.auth.lockAcquireTimeout, 2500);
});

test('每个应用仅在账户验证前锁定，云端同步在后台进行', () => {
  const gate = fs.readFileSync(path.join(root, 'shared/auth-gate.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'shared/hub.css'), 'utf8');
  assert.match(gate, /next=' \+ encodeURIComponent\(app\)/);
  assert.match(gate, /hub:sync-status/);
  assert.match(gate, /data-auth-ready/);
  assert.match(gate, /setAttribute\('data-auth-ready', ''\)/);
  assert.doesNotMatch(gate, /detail\.state === 'error'[\s\S]{0,180}removeAttribute\('data-auth-ready'\)/);
  assert.match(css, /data-app.*not\(\[data-auth-ready\]\).*visibility: hidden/);
  assert.match(css, /正在验证账户…/);
  assert.doesNotMatch(css, /正在验证账户并同步数据|应用暂时保持锁定/);
  ['words', 'training', 'exam-schedule'].forEach((app) => {
    const html = fs.readFileSync(path.join(root, app, 'index.html'), 'utf8');
    const auth = html.indexOf('../shared/hub-auth.js');
    const gateIndex = html.indexOf('../shared/auth-gate.js');
    const sync = html.indexOf('../shared/sync-store.js');
    assert.ok(auth >= 0 && auth < gateIndex && gateIndex < sync, app);
    assert.match(html, /Content-Security-Policy/);
  });
});

test('词汇学习先恢复本地档案，远端更新不再触发整页刷新', () => {
  const features = fs.readFileSync(path.join(root, 'words/js/features.js'), 'utf8');
  const wordSync = fs.readFileSync(path.join(root, 'words/js/hub-sync.js'), 'utf8');
  assert.ok(features.indexOf('WordTales.LearningProgress.init()') < features.indexOf('WordTales.Auth.init()'));
  assert.match(wordSync, /applyChain/);
  assert.doesNotMatch(wordSync, /location\.reload/);
});

test('应用页只注入低调的返回主页入口，不渲染门户导航栏', () => {
  const shell = fs.readFileSync(path.join(root, 'shared/hub-shell.js'), 'utf8');
  assert.match(shell, /class="hub-home-link"/);
  assert.match(shell, /href="\.\.\/"/);
  assert.doesNotMatch(shell, /hub-header|hub-brand|hub-nav|hub-login/);
  ['words', 'training', 'exam-schedule'].forEach((app) => {
    const html = fs.readFileSync(path.join(root, app, 'index.html'), 'utf8');
    assert.match(html, /<div id="hub-shell"><\/div>/);
  });
});

test('上游同步验证、提交并在同一工作流中部署同步后的默认分支', () => {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/sync-upstreams.yml'), 'utf8');
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /repository: qixiboss\/WordTales/);
  assert.match(workflow, /repository: qixiboss\/Train_record/);
  assert.match(workflow, /repository: qixiboss\/-Graduate-Entrance-Exam-Schedule/);
  assert.ok(workflow.indexOf('npm run verify') < workflow.indexOf('git commit'));
  assert.match(workflow, /changed=true/);
  assert.match(workflow, /needs\.sync\.outputs\.changed == 'true'/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.repository\.default_branch \}\}/);
  assert.match(workflow, /actions\/deploy-pages@v5/);

  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'upstreams.json'), 'utf8'));
  assert.equal(Object.keys(manifest.sources).length, 3);
  Object.values(manifest.sources).forEach((source) => assert.match(source.commit, /^[0-9a-f]{40}$/));
});

test('GitHub Pages 工作流验证、构建并发布静态站点产物', () => {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
  assert.ok(workflow.indexOf('npm run verify') < workflow.indexOf('npm run build'));
  assert.match(workflow, /actions\/configure-pages@v6/);
  assert.match(workflow, /actions\/upload-pages-artifact@v5/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
});

test('同步迁移启用 RLS、限制 payload、容忍缺失的历史函数并修复未来时间戳', () => {
  const createSql = fs.readFileSync(path.join(root, 'supabase/migrations/20260811032047_create_sync_items.sql'), 'utf8');
  const helperSql = fs.readFileSync(path.join(root, 'supabase/migrations/20260811032215_harden_rls_auto_enable.sql'), 'utf8');
  const hardenSql = fs.readFileSync(path.join(root, 'supabase/migrations/20260811074104_harden_sync_items.sql'), 'utf8');
  const validateSql = fs.readFileSync(path.join(root, 'supabase/migrations/20260811074327_validate_sync_items_payload_size.sql'), 'utf8');
  const insertGuardSql = fs.readFileSync(path.join(root, 'supabase/migrations/20260811074622_protect_sync_item_inserts.sql'), 'utf8');
  assert.match(createSql, /enable row level security/i);
  assert.match(createSql, /\(select auth\.uid\(\)\) = user_id/i);
  assert.match(createSql, /alter publication supabase_realtime add table public\.sync_items/i);
  assert.match(helperSql, /to_regprocedure\('public\.rls_auto_enable\(\)'\)/i);
  assert.match(hardenSql, /octet_length\(payload::text\) <= 262144/i);
  assert.match(hardenSql, /old\.updated_at > now\(\) \+ interval '5 minutes'/i);
  assert.match(validateSql, /validate constraint sync_items_payload_size_check/i);
  assert.match(insertGuardSql, /before insert or update on public\.sync_items/i);
});

test('SyncStore 登录后写入独立条目并在成功后清空持久化 outbox', async () => {
  const session = { user: { id: 'user-a' } };
  const harness = syncHarness({ session });
  const sync = harness.context.HubSync.register('training', { getItems: () => [{ item_key: 'settings', payload: { restSeconds: 60 } }] });
  await wait();
  assert.equal(harness.writes[0].item_key, 'settings');
  sync.put('day:2026-08-11', { completedAt: true });
  await sync.flush();
  assert.equal(harness.writes.some((row) => row.item_key === 'day:2026-08-11'), true);
  assert.deepEqual(JSON.parse(harness.localStorage.getItem('hub.sync.outbox.v2')), {});
});

test('会话暂时失效时保留 outbox，重新登录后继续上传', async () => {
  const session = { user: { id: 'user-a' } };
  const harness = syncHarness({ session });
  const sync = harness.context.HubSync.register('training', { getItems: () => [] });
  await wait();
  sync.put('day:2026-08-11', { completed: true });
  harness.state.session = null;
  assert.equal(await sync.flush(), false);
  const queued = JSON.parse(harness.localStorage.getItem('hub.sync.outbox.v2'));
  assert.equal(queued.training['user-a:day:2026-08-11'].payload.completed, true);

  harness.state.session = session;
  harness.authListeners[0](session);
  await wait();
  assert.equal(harness.writes.some((row) => row.item_key === 'day:2026-08-11'), true);
  assert.deepEqual(JSON.parse(harness.localStorage.getItem('hub.sync.outbox.v2')), {});
});

test('切换账号时先清空旧账号缓存，再应用新账号云端数据', async () => {
  const session = { user: { id: 'user-b' } };
  let local = [{ item_key: 'settings', payload: { owner: 'user-a', privateValue: 'A data' } }];
  let resetCount = 0;
  const harness = syncHarness({
    session,
    remote: [{ item_key: 'settings', payload: { owner: 'user-b', privateValue: 'B data' }, updated_at: '2026-08-11T00:00:00.000Z', deleted_at: null }],
    initialStorage: {
      'hub.sync.owner.training': JSON.stringify('user-a'),
      'hub.sync.versions.v2': JSON.stringify({ 'user-a:training:settings': { updated_at: '2099-01-01T00:00:00.000Z', deleted_at: null } })
    }
  });
  harness.context.HubSync.register('training', {
    getItems: () => local,
    resetLocal() { resetCount += 1; local = []; },
    applyRemote(rows) { local = rows.map((row) => ({ item_key: row.item_key, payload: row.payload })); }
  });
  await wait();
  assert.equal(resetCount, 1);
  assert.equal(local[0].payload.owner, 'user-b');
  assert.equal(JSON.parse(harness.localStorage.getItem('hub.sync.owner.training')), 'user-b');
});

test('同一账号的本地较新版本不会被旧云端行覆盖，并会重新上传', async () => {
  const session = { user: { id: 'user-b' } };
  let local = [{ item_key: 'settings', payload: { value: 'local-new' } }];
  const harness = syncHarness({
    session,
    remote: [{ item_key: 'settings', payload: { value: 'cloud-old' }, updated_at: '2026-08-11T00:00:00.000Z', deleted_at: null }],
    initialStorage: {
      'hub.sync.owner.training': JSON.stringify('user-b'),
      'hub.sync.versions.v2': JSON.stringify({ 'user-b:training:settings': { updated_at: '2026-08-11T01:00:00.000Z', deleted_at: null } })
    }
  });
  harness.context.HubSync.register('training', {
    getItems: () => local,
    applyRemote(rows) { local = rows.map((row) => ({ item_key: row.item_key, payload: row.payload })); }
  });
  await wait();
  assert.equal(local[0].payload.value, 'local-new');
  assert.equal(harness.writes.some((row) => row.payload.value === 'local-new'), true);
});
