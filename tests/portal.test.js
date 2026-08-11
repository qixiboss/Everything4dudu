const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)) };
}

test('手机主页包含三个应用入口和独立用户登录入口，考研页不使用 iframe', () => {
  ['index.html', 'words/index.html', 'training/index.html', 'exam-schedule/index.html'].forEach((file) => {
    assert.equal(fs.existsSync(path.join(root, file)), true, file);
  });
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(home, /href="words\/"/);
  assert.match(home, /href="training\/"/);
  assert.match(home, /href="exam-schedule\/"/);
  assert.match(home, /data-login-open/);
  assert.match(home, /role="dialog"/);
  assert.match(home, /shared\/home\.js/);
  const schedule = fs.readFileSync(path.join(root, 'exam-schedule/index.html'), 'utf8');
  assert.doesNotMatch(schedule, /srcdoc=|<iframe\b/i);
});

test('上游同步工作流定时拉取三个仓库并只提交验证后的生成目录', () => {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/sync-upstreams.yml'), 'utf8');
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /repository: qixiboss\/WordTales/);
  assert.match(workflow, /repository: qixiboss\/Train_record/);
  assert.match(workflow, /repository: qixiboss\/-Graduate-Entrance-Exam-Schedule/);
  assert.ok(workflow.indexOf('npm run verify') < workflow.indexOf('git commit'));

  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'upstreams.json'), 'utf8'));
  assert.equal(Object.keys(manifest.sources).length, 3);
  Object.values(manifest.sources).forEach((source) => assert.match(source.commit, /^[0-9a-f]{40}$/));
  ['words', 'training', 'exam-schedule'].forEach((app) => {
    const html = fs.readFileSync(path.join(root, app, 'index.html'), 'utf8');
    assert.match(html, /\.\.\/shared\/hub-auth\.js/);
    assert.match(html, /hub-sync\.js/);
  });
});

test('GitHub Pages 工作流验证、构建并发布静态站点产物', () => {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
  assert.ok(workflow.indexOf('npm run verify') < workflow.indexOf('npm run build'));
  assert.match(workflow, /actions\/configure-pages@v6/);
  assert.match(workflow, /enablement: true/);
  assert.match(workflow, /actions\/upload-pages-artifact@v5/);
  assert.match(workflow, /path: _site/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
});

test('同步迁移启用 RLS、按用户隔离并发布 Realtime', () => {
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20260811032047_create_sync_items.sql'), 'utf8');
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /\(select auth\.uid\(\)\) = user_id/i);
  assert.match(sql, /alter publication supabase_realtime add table public\.sync_items/i);
  assert.match(sql, /old\.updated_at > new\.updated_at/i);
});

test('SyncStore writes independent item rows after login', async () => {
  const writes = [];
  const context = vm.createContext({
    console,
    localStorage: storage(),
    setTimeout,
    clearTimeout,
    CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init && init.detail; },
    dispatchEvent() {},
  });
  context.window = context;
  const session = { user: { id: 'user-a' } };
  const client = {
    from() {
      return {
        select() { return this; },
        eq() { return Promise.resolve({ data: [], error: null }); },
        upsert(rows) { writes.push(...rows); return Promise.resolve({ error: null }); }
      };
    },
    channel() { return { on() { return this; }, subscribe() { return this; } }; },
    removeChannel() {}
  };
  context.HubAuth = { init: () => Promise.resolve(session), getSession: () => session, getClient: () => client, onChange() {} };
  vm.runInContext(fs.readFileSync(path.join(root, 'shared/sync-store.js'), 'utf8'), context);
  const sync = context.HubSync.register('training', { getItems: () => [{ item_key: 'settings', payload: { restSeconds: 60 } }] });
  await new Promise((resolve) => setTimeout(resolve, 850));
  assert.equal(writes[0].item_key, 'settings');
  sync.put('day:2026-08-11', { completedAt: true });
  await new Promise((resolve) => setTimeout(resolve, 850));
  assert.equal(writes.some((row) => row.item_key === 'day:2026-08-11'), true);
});
