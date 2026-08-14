const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

/* 共享脚本清单以 integrate.js 为唯一来源,测试在运行时生成期望列表,
 * 新增或删除共享脚本不必同步改这里。 */
const { sharedScriptTags } = require(path.join(root, 'scripts/integrate.js'));

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
        /* 引擎按 app 选表后不再链 .eq('app_id', ...)，select 直接返回结果。 */
        select() {
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

test('主页把应用标记为登录后访问且不暴露公开注册入口', () => {
  ['index.html', '_site/words/index.html', '_site/training/index.html', '_site/exam-schedule/index.html', '_site/CostTrace/index.html', 'changelog/index.html'].forEach((file) => {
    assert.equal(fs.existsSync(path.join(root, file)), true, file);
  });
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(home, /href="words\/" data-protected-app="words"/);
  assert.match(home, /href="training\/" data-protected-app="training"/);
  assert.match(home, /href="exam-schedule\/" data-protected-app="exam-schedule"/);
  assert.match(home, /href="changelog\/" data-protected-app="changelog"/);
  assert.match(home, /href="CostTrace\/" data-protected-app="cost-trace"/);
  assert.match(home, /hero-clock/);
  assert.match(home, /data-login-open/);
  assert.match(home, /data-app-pager/);
  assert.match(home, /data-app-pagination/);
  assert.match(home, /role="dialog"/);
  assert.match(home, /autocomplete="current-password"/);
  assert.doesNotMatch(home, /data-auth-mode="register"|register-password-confirm/);
  assert.match(home, /Content-Security-Policy/);
  const homeJs = fs.readFileSync(path.join(root, 'shared/home.js'), 'utf8');
  const homeCss = fs.readFileSync(path.join(root, 'shared/home.css'), 'utf8');
  assert.match(homeJs, /APP_PAGE_SIZE = 6/);
  assert.match(homeJs, /Math\.ceil\(apps\.length \/ APP_PAGE_SIZE\)/);
  assert.match(homeCss, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(homeCss, /grid-template-rows: repeat\(3, minmax\(0, auto\)\)/);
  const schedule = fs.readFileSync(path.join(root, '_site/exam-schedule/index.html'), 'utf8');
  assert.doesNotMatch(schedule, /srcdoc=|<iframe\b/i);

  /* 更新记录是纯手维护的静态页面:共享脚本块之后只有 changelog.js,没有应用级适配器。 */
  const changelog = fs.readFileSync(path.join(root, 'changelog/index.html'), 'utf8');
  const changelogScripts = changelog.split('\n').filter((line) => line.includes('<script defer')).map((line) => line.trim());
  assert.deepEqual(changelogScripts, [
    ...sharedScriptTags(),
    '<script defer src="changelog.js"></script>'
  ]);
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
  ['words', 'training', 'exam-schedule', 'changelog', 'CostTrace'].forEach((app) => {
    const html = fs.readFileSync(path.join(root, '_site', app, 'index.html'), 'utf8');
    /* 共享脚本必须按 integrate.js 定义的顺序完整出现（登录先于锁定与同步）。 */
    let previous = -1;
    sharedScriptTags().forEach((tag) => {
      const position = html.indexOf(tag);
      assert.ok(position > previous, `${app} is missing or misordering ${tag}`);
      previous = position;
    });
    assert.match(html, /Content-Security-Policy/);
  });
});

test('词汇学习先建立登录会话与云端同步，再恢复本地档案', () => {
  const features = fs.readFileSync(path.join(root, '_site/words/js/features.js'), 'utf8');
  const wordSync = fs.readFileSync(path.join(root, '_site/words/js/hub-sync.js'), 'utf8');
  assert.ok(features.indexOf('WordTales.Auth.init()') < features.indexOf('WordTales.LearningProgress.init()'));
  assert.ok(features.indexOf('WordTales.LearningProgress.init()') < features.indexOf('WordTales.CloudSync.connectProfile()'));
  assert.match(wordSync, /HubAppSync\.start/);
  assert.doesNotMatch(wordSync, /location\.reload/);
});

test('应用页只注入低调的返回主页入口，不渲染门户导航栏', () => {
  const shell = fs.readFileSync(path.join(root, 'shared/hub-shell.js'), 'utf8');
  assert.match(shell, /class="hub-home-link"/);
  assert.match(shell, /href="\.\.\/"/);
  assert.doesNotMatch(shell, /hub-header|hub-brand|hub-nav|hub-login/);
  ['words', 'training', 'exam-schedule', 'changelog', 'CostTrace'].forEach((app) => {
    const html = fs.readFileSync(path.join(root, '_site', app, 'index.html'), 'utf8');
    assert.match(html, /<div id="hub-shell"><\/div>/);
  });
});

test('所有应用由门户源码统一维护,不再依赖子模块或独立 CI', () => {
  assert.equal(fs.existsSync(path.join(root, '.gitmodules')), false);
  ['words', 'training', 'exam-schedule'].forEach((app) => {
    assert.equal(fs.existsSync(path.join(root, app, '.git')), false, `${app} still has nested git metadata`);
    assert.equal(fs.existsSync(path.join(root, app, '.github', 'workflows')), false, `${app} still has an app CI workflow`);
  });

  const workflow = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
  assert.doesNotMatch(workflow, /repository_dispatch/);
  assert.doesNotMatch(workflow, /submodules|gitmodules|checkout.*remote/i);
  assert.match(workflow, /npm run verify/);
  assert.match(workflow, /group: pages/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
});

test('GitHub Pages 工作流验证、构建并发布静态站点产物', () => {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
  /* verify 内部先 build 再 test/check,产物是构建后的 _site/。 */
  assert.match(workflow, /npm run verify/);
  assert.doesNotMatch(workflow, /npm run build/);
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
  const splitSql = fs.readFileSync(path.join(root, 'supabase/migrations/20260812120000_split_sync_items_per_app.sql'), 'utf8');
  assert.match(splitSql, /create table if not exists public\.words_sync_items/i);
  assert.match(splitSql, /create table if not exists public\.training_sync_items/i);
  assert.match(splitSql, /create table if not exists public\.exam_sync_items/i);
  assert.match(splitSql, /enable row level security/i);
  assert.match(splitSql, /octet_length\(payload::text\) <= 262144/i);
  assert.match(splitSql, /alter publication supabase_realtime add table public\.words_sync_items/i);
  assert.match(splitSql, /insert into public\.words_sync_items/i);
  assert.match(splitSql, /drop table public\.sync_items/i);
  const costTraceSql = fs.readFileSync(path.join(root, 'supabase/migrations/20260813000000_create_costtrace_sync_items.sql'), 'utf8');
  assert.match(costTraceSql, /create table if not exists public\.costtrace_sync_items/i);
  assert.match(costTraceSql, /enable row level security/i);
  assert.match(costTraceSql, /to authenticated using \(\(select auth\.uid\(\)\) = user_id\)/i);
  assert.match(costTraceSql, /with check \(\(select auth\.uid\(\)\) = user_id\)/i);
  assert.match(costTraceSql, /revoke all on public\.costtrace_sync_items from anon/i);
  assert.match(costTraceSql, /revoke delete, truncate, references, trigger on public\.costtrace_sync_items from authenticated/i);
  assert.match(costTraceSql, /alter publication supabase_realtime add table public\.costtrace_sync_items/i);
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

test('远端记录落盘失败时不提交版本，并可在重新激活后重试', async () => {
  const session = { user: { id: 'user-a' } };
  const remote = [{ item_key: 'transaction:1', payload: { detail: '午餐' }, updated_at: '2026-08-13T00:00:00.000Z', deleted_at: null }];
  const harness = syncHarness({ session, remote });
  let attempts = 0;
  let local = [];
  harness.context.HubSync.register('cost-trace', {
    getItems: () => local,
    applyRemote(rows) {
      attempts += 1;
      if (attempts === 1) throw new Error('quota exceeded');
      local = rows.map((row) => ({ item_key: row.item_key, payload: row.payload }));
    }
  });

  await wait();
  assert.equal(attempts, 1);
  assert.equal(harness.localStorage.getItem('hub.sync.versions.v2'), null);

  harness.authListeners[0](session);
  await wait();
  assert.equal(attempts, 2);
  assert.equal(local[0].payload.detail, '午餐');
  assert.equal(JSON.parse(harness.localStorage.getItem('hub.sync.versions.v2'))['user-a:cost-trace:transaction:1'].updated_at, remote[0].updated_at);
});

test('HubAppSync 只在条目变化时上传，并对比远端行避免重复上传', async () => {
  const session = { user: { id: 'user-a' } };
  let state = { targets: { pushup: 20, restSeconds: 60 } };
  const writes = [];
  const client = {
    from() {
      return {
        select() {
          return Promise.resolve({ data: [
            { item_key: 'settings', payload: { targets: { pushup: 30 }, restSeconds: 90 }, updated_at: '2026-08-11T00:00:00.000Z', deleted_at: null }
          ], error: null });
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
    localStorage: storage(),
    setTimeout,
    clearTimeout,
    confirm: () => false,
    CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init && init.detail; },
    dispatchEvent() {},
    /* Real timers would keep the node test process alive; scans are driven
     * manually via HubAppSync.queue(). */
    setInterval: () => 0,
    clearInterval: () => {},
    /* First activation sees both local and remote data: "确定" keeps the
     * local data and merges remote (the path the real adapter exercises). */
    confirm: () => true
  });
  context.window = context;
  context.HubAuth = {
    init: () => Promise.resolve(session),
    getSession: () => session,
    getClient: () => client,
    onChange() {}
  };
  vm.runInContext(fs.readFileSync(path.join(root, 'shared/sync-store.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'shared/hub-sync.js'), 'utf8'), context);

  const adapter = {
    app: 'training',
    items: () => [{ item_key: 'settings', payload: state }],
    applyRemote(rows) {
      /* 引擎级测试夹具：'settings' 只是样本键，真实 training 适配器
       * 现在只同步 day: 行，settings 是设备本地偏好、不再合并。 */
      const remote = rows.find((row) => row.item_key === 'settings');
      if (remote && remote.payload) {
        Object.keys(remote.payload).forEach((key) => {
          if (state[key] === undefined || state[key] === null) state[key] = remote.payload[key];
        });
      }
    },
    resetLocal() {}
  };
  context.HubAppSync.start(adapter);
  await wait(100);
  // First activation applied the remote row: merged into local state
  // (targets untouched, restSeconds added).
  assert.equal(state.targets.pushup, 20);
  assert.equal(state.restSeconds, 90);
  // The post-activation scan queued the merged settings; flush sends it.
  await context.HubSync.flush('training');
  assert.equal(writes.some((row) => row.item_key === 'settings'), true);
  writes.length = 0;
  // Unchanged state does not re-upload on a subsequent scan.
  context.HubAppSync.queue(adapter);
  assert.equal(writes.length, 0);
});

test('HubAppSync 的 applyingRemote 闸门防止远端合并期间的本地写入被重复上传', async () => {
  const session = { user: { id: 'user-a' } };
  let state = { restSeconds: 60 };
  const writes = [];
  const client = {
    from() {
      return {
        select() { return Promise.resolve({ data: [], error: null }); },
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
    localStorage: storage(),
    setTimeout,
    clearTimeout,
    confirm: () => false,
    CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init && init.detail; },
    dispatchEvent() {},
    /* Real timers would keep the node test process alive; scans are driven
     * manually via HubAppSync.queue(). */
    setInterval: () => 0,
    clearInterval: () => {}
  });
  context.window = context;
  context.HubAuth = {
    init: () => Promise.resolve(session),
    getSession: () => session,
    getClient: () => client,
    onChange() {}
  };
  vm.runInContext(fs.readFileSync(path.join(root, 'shared/sync-store.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'shared/hub-sync.js'), 'utf8'), context);

  const adapter = {
    app: 'training',
    items: () => [{ item_key: 'settings', payload: state }],
    applyRemote(rows) {
      /* 引擎级测试夹具：'settings' 只是样本键，真实 training 适配器
       * 现在只同步 day: 行，settings 是设备本地偏好、不再合并。 */
      rows.forEach((row) => {
        if (row.item_key === 'settings' && row.payload) {
          Object.keys(row.payload).forEach((key) => {
            if (state[key] === undefined || state[key] === null) state[key] = row.payload[key];
          });
        }
      });
    },
    resetLocal() {}
  };
  context.HubAppSync.start(adapter);
  await wait(50);
  // A local write lands while the merge is in flight: the applyingRemote
  // gate means the next scan sees the merged baseline and does not upload
  // it again as a "local" change.
  writes.length = 0;
  context.HubAppSync.queue(adapter);
  assert.equal(writes.length, 0);
});

test('HubAppSync 等待异步远端落盘失败并把错误传回 SyncStore', async () => {
  const session = { user: { id: 'user-a' } };
  const harness = syncHarness({
    session,
    remote: [{ item_key: 'settings', payload: { value: 'cloud' }, updated_at: '2026-08-13T00:00:00.000Z', deleted_at: null }]
  });
  harness.context.setInterval = () => 0;
  harness.context.clearInterval = () => {};
  vm.runInContext(fs.readFileSync(path.join(root, 'shared/hub-sync.js'), 'utf8'), harness.context);

  harness.context.HubAppSync.start({
    app: 'training',
    items: () => [],
    applyRemote: () => Promise.reject(new Error('async storage failure')),
    resetLocal() {}
  });
  await wait();

  assert.equal(harness.localStorage.getItem('hub.sync.versions.v2'), null);
});
