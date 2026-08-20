const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const siteRoot = path.join(root, 'site');
const modelPath = path.join(siteRoot, 'pomodoro/model.js');
const adapterPath = path.join(siteRoot, 'pomodoro/hub-sync.js');

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    values
  };
}

function loadModel(storageObj = {}) {
  const context = vm.createContext({ console, localStorage: storage(storageObj) });
  context.window = context;
  vm.runInContext(fs.readFileSync(modelPath, 'utf8'), context);
  return context.window.PomodoroModel;
}

function loadAdapter(initialStorage) {
  let adapter;
  const events = [];
  const domReady = [];
  const context = vm.createContext({
    console,
    localStorage: storage(initialStorage),
    document: {
      readyState: 'interactive',
      addEventListener(type, listener) { if (type === 'DOMContentLoaded') domReady.push(listener); }
    },
    dispatchEvent(event) { events.push(event.type); },
    CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init && init.detail; },
    HubAppSync: { start(value) { adapter = value; return true; } }
  });
  context.window = context;
  /* 顺序与页面一致：适配器先执行，model 后执行，最后触发 DOMContentLoaded。 */
  vm.runInContext(fs.readFileSync(adapterPath, 'utf8'), context);
  vm.runInContext(fs.readFileSync(modelPath, 'utf8'), context);
  domReady.forEach((listener) => listener());
  return { adapter, context, events };
}

function sampleLog() {
  return {
    '2026-08-19': {
      date: '2026-08-19',
      pomodoros: [
        { id: 'a', mode: 'focus', startedAt: 1, endedAt: 2, durationSec: 1500, completed: true },
        { id: 'b', mode: 'focus', startedAt: 3, endedAt: 4, durationSec: 1500, completed: true },
        { id: 'c', mode: 'short-break', startedAt: 5, endedAt: 6, durationSec: 300, completed: true }
      ],
      focusCount: 2,
      totalFocusSec: 3000,
      totalBreakSec: 300,
      cycleCount: 2
    },
    '2026-08-20': {
      date: '2026-08-20',
      pomodoros: [
        { id: 'd', mode: 'focus', startedAt: 7, endedAt: 8, durationSec: 1500, completed: true }
      ],
      focusCount: 1,
      totalFocusSec: 1500,
      totalBreakSec: 0,
      cycleCount: 1
    }
  };
}

test('normalizeDay 重算专注计数与累计专注时长', () => {
  const M = loadModel();
  const day = M.normalizeDay({
    date: '2026-08-19',
    pomodoros: [
      { id: 'a', mode: 'focus', startedAt: 1, endedAt: 2, durationSec: 1500, completed: true },
      { id: 'b', mode: 'focus', startedAt: 3, endedAt: 4, durationSec: 1500, completed: false },
      { id: 'c', mode: 'short-break', startedAt: 5, endedAt: 6, durationSec: 300, completed: true },
      { id: 'bad', mode: 'nonsense' }
    ]
  });
  assert.equal(day.focusCount, 1);
  assert.equal(day.totalFocusSec, 3000);
  assert.equal(day.totalBreakSec, 300);
  assert.equal(day.pomodoros.length, 3);
});

test('summaryFor / monthSummary / allSummary 聚合正确', () => {
  const M = loadModel({ 'pomodoro.log': JSON.stringify(sampleLog()) });
  const log = sampleLog();
  const todaySummary = M.summaryFor(log, '2026-08-20');
  const month = M.monthSummary(log, new Date('2026-08-15T00:00:00'));
  const all = M.allSummary(log);
  assert.equal(todaySummary.focusCount, 1);
  assert.equal(todaySummary.totalFocusSec, 1500);
  assert.equal(month.activeDayCount, 2);
  assert.equal(month.totalFocusSec, 4500);
  assert.equal(all.totalFocusCount, 3);
  assert.equal(all.totalFocusSec, 4500);
  assert.equal(all.activeDays, 2);
  assert.equal(all.bestDay, '2026-08-19');
});

test('trendSeries 返回请求长度并保留日期顺序', () => {
  const M = loadModel();
  const series = M.trendSeries(sampleLog(), 7, new Date('2026-08-20T12:00:00'));
  assert.equal(series.length, 7);
  assert.equal(series[6].key, '2026-08-20');
  assert.equal(series[6].focusSec, 1500);
  assert.equal(series[0].focusSec, 0);
});

test('buildCalendarGrid 以周一为起始并补齐 6 行共 42 格', () => {
  const M = loadModel();
  const cells = M.buildCalendarGrid(2026, 7); // 2026-08
  assert.equal(cells.length, 42);
  const firstInMonth = cells.find((c) => c.inMonth);
  assert.equal(firstInMonth.day, 1);
  // 2026-08-01 是星期六，周一为第一列 → 前导 5 个非本月格
  assert.equal(cells.slice(0, 7).filter((c) => !c.inMonth).length, 5);
});

test('fmtMMSS / fmtDuration 格式化时间', () => {
  const M = loadModel();
  assert.equal(M.fmtMMSS(1500), '25:00');
  assert.equal(M.fmtMMSS(65), '01:05');
  assert.equal(M.fmtDuration(1500), '25 分钟');
  assert.equal(M.fmtDuration(90), '1 分钟');
});

test('同步适配器按 day: 键导出日志并合并远端新增条目', () => {
  const { adapter, context, events } = loadAdapter({ 'pomodoro.log': JSON.stringify(sampleLog()) });
  assert.ok(adapter, 'adapter 已注册');
  const items = adapter.items();
  assert.equal(items[0].item_key, 'day:2026-08-19');
  assert.equal(items.length, 2);

  adapter.applyRemote([
    { item_key: 'day:2026-08-21', payload: { date: '2026-08-21', pomodoros: [{ id: 'e', mode: 'focus', startedAt: 9, endedAt: 10, durationSec: 1500, completed: true }], focusCount: 1, totalFocusSec: 1500, totalBreakSec: 0, cycleCount: 1 }, deleted_at: null }
  ]);
  assert.equal(events.at(-1), 'pomodoro:data-change');
  const stored = JSON.parse(context.localStorage.getItem('pomodoro.log'));
  assert.equal(Object.keys(stored).length, 3);
  assert.equal(stored['2026-08-21'].focusCount, 1);
});

test('同步适配器删除标记与本地重置均派发变更事件', () => {
  const { adapter, context, events } = loadAdapter({ 'pomodoro.log': JSON.stringify(sampleLog()), 'pomodoro.session': JSON.stringify({ mode: 'focus' }) });
  adapter.applyRemote([{ item_key: 'day:2026-08-19', payload: {}, deleted_at: '2026-08-20T00:00:00.000Z' }]);
  assert.equal(JSON.parse(context.localStorage.getItem('pomodoro.log'))['2026-08-19'], undefined);

  events.length = 0;
  adapter.resetLocal();
  assert.equal(events.at(-1), 'pomodoro:data-change');
  assert.equal(context.localStorage.getItem('pomodoro.log'), null);
  assert.equal(context.localStorage.getItem('pomodoro.session'), null);
});

test('损坏的本地存储回退默认设置而不抛出', () => {
  const M = loadModel();
  const store = storage({ 'pomodoro.settings': '{broken', 'pomodoro.log': 'not-json' });
  const loaded = M.load(store);
  assert.equal(loaded.settings.focusSec, 25 * 60);
  assert.equal(Object.keys(loaded.log).length, 0);
});
