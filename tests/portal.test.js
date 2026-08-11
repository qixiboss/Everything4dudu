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

test('门户包含三个独立入口，考研页不再使用 iframe srcdoc', () => {
  ['index.html', 'words/index.html', 'training/index.html', 'exam-schedule/index.html'].forEach((file) => {
    assert.equal(fs.existsSync(path.join(root, file)), true, file);
  });
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(home, /href="words\/"/);
  assert.match(home, /href="training\/"/);
  assert.match(home, /href="exam-schedule\/"/);
  const schedule = fs.readFileSync(path.join(root, 'exam-schedule/index.html'), 'utf8');
  assert.doesNotMatch(schedule, /srcdoc=|<iframe\b/i);
});

test('同步迁移启用 RLS、按用户隔离并发布 Realtime', () => {
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20260811030901_create_sync_items.sql'), 'utf8');
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
