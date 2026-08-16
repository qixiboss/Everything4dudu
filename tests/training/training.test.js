'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { createStorage, createDocument, loadTrainingApp } = require('./helpers/browser-env');

const DAY = (() => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
})();
function dayKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

/* ---------- 夹具 ---------- */
function strengthAct(id, name, unit, target, doneCount) {
  return {
    id, name, unit, target,
    sets: [0, 1, 2, 3].map((_, j) => ({
      done: j < doneCount, count: target, sec: j < doneCount ? 30 : 0
    }))
  };
}
function cardioAct(id, done) {
  return {
    id, name: id === 'run' ? '跑步' : '骑行', unit: '', target: 0, cardio: true,
    sets: [{ done, count: 0, sec: done ? 1800 : 0 }]
  };
}
function basePlan({ done0 = 0, cardioDone = false } = {}) {
  return [
    strengthAct('pushup', '俯卧撑', '个', 20, done0),
    strengthAct('abwheel', '健腹轮', '个', 10, 0),
    strengthAct('hanglegg', '悬挂举腿', '个', 10, 0),
    strengthAct('pullup', '引体向上', '个', 8, 0),
    cardioAct('run', cardioDone)
  ];
}
function makeLog(plan, extra = {}) {
  return { date: DAY, plan, cardio: 'run', completedAt: null, endedEarly: false, ...extra };
}
function makeSession(overrides = {}) {
  return {
    date: DAY, exIdx: 0, setIdx: 0, running: false, resting: false,
    paused: false, finished: false, setAccum: 0, restAccum: 0, cardioMin: 30,
    ...overrides
  };
}

/* ---------- 驱动与断言 ---------- */
function rendered(doc, id) {
  return doc.getElementById('today-body').innerHTML.includes('id="' + id + '"');
}
function click(doc, id) {
  const el = doc.getElementById(id);
  const list = el.listeners.click || [];
  assert.ok(list.length, 'expected click listeners on #' + id);
  list[list.length - 1].call(el);
}
function readLog(storage) {
  return JSON.parse(storage.getItem('train.log'));
}
function readSession(storage) {
  const raw = storage.getItem('train.session');
  return raw ? JSON.parse(raw) : null;
}
function bootApp({ storage, doc, clockStart } = {}) {
  const context = loadTrainingApp({ localStorage: storage, document: doc, clockStart });
  return context;
}

/* ---------- 测试 ---------- */
test('跳过剩余组：剩余组计数置 0、标记跳过，并进入下一动作的开始界面', (t) => {
  const storage = createStorage();
  const doc = createDocument();
  const context = bootApp({ storage, doc });
  t.after(() => context.clearTimers());
  doc.dispatchDOMContentLoaded();

  // 第一组：开始 → 开始休息
  click(doc, 'btn-start');
  click(doc, 'btn-to-rest');
  // 完成休息 → 自动开始第二组 → 开始休息
  click(doc, 'btn-rest-done');
  click(doc, 'btn-to-rest');
  // 休息中，跳过剩余两组
  assert.ok(rendered(doc, 'btn-skip-remaining'));
  click(doc, 'btn-skip-remaining');

  const log = readLog(storage);
  const pushup = log[DAY].plan[0];
  assert.equal(pushup.sets[0].done, true);
  assert.equal(pushup.sets[1].done, true);
  assert.equal(pushup.sets[2].done, true);
  assert.equal(pushup.sets[3].done, true);
  assert.equal(pushup.sets[2].skipped, true);
  assert.equal(pushup.sets[3].skipped, true);
  assert.equal(pushup.sets[2].count, 0);
  assert.equal(pushup.sets[3].count, 0);
  assert.equal(pushup.sets[2].sec, 0);
  assert.equal(pushup.sets[0].skipped, undefined);

  // 下一动作（健腹轮）处于待开始状态：显示「开始」，不自动计时
  assert.ok(rendered(doc, 'btn-start-set'));
  assert.ok(!rendered(doc, 'btn-to-rest'));
  assert.ok(!rendered(doc, 'btn-rest-done'));
  assert.ok(rendered(doc, 'btn-skip-remaining'));

  // 会话位置已前进
  const s = readSession(storage);
  assert.equal(s.exIdx, 1);
  assert.equal(s.setIdx, 0);
  assert.equal(s.running, false);
  assert.equal(s.resting, false);
});

test('休息中跳过文案只统计未完成组，当前动作最后一组完成后不显示死按钮', (t) => {
  const storage = createStorage();
  const doc = createDocument();
  const context = bootApp({ storage, doc });
  t.after(() => context.clearTimers());
  doc.dispatchDOMContentLoaded();

  click(doc, 'btn-start');
  click(doc, 'btn-to-rest');
  assert.ok(doc.getElementById('today-body').innerHTML.includes('跳过剩余 3 组'));

  for (let set = 1; set < 4; set += 1) {
    click(doc, 'btn-rest-done');
    click(doc, 'btn-to-rest');
  }
  assert.ok(rendered(doc, 'btn-rest-done'));
  assert.ok(!rendered(doc, 'btn-skip-remaining'));
});

test('跳过最后一个剩余组：当日结束并清除会话', (t) => {
  // 只剩引体向上第 4 组未完成
  const plan = [
    strengthAct('pushup', '俯卧撑', '个', 20, 4),
    strengthAct('abwheel', '健腹轮', '个', 10, 4),
    strengthAct('hanglegg', '悬挂举腿', '个', 10, 4),
    strengthAct('pullup', '引体向上', '个', 8, 3),
    cardioAct('run', true)
  ];
  const storage = createStorage({ 'train.log': JSON.stringify({ [DAY]: makeLog(plan) }) });
  storage.setItem('train.session', JSON.stringify(makeSession({ exIdx: 3, setIdx: 3 })));
  const doc = createDocument();
  const context = bootApp({ storage, doc });
  t.after(() => context.clearTimers());
  doc.dispatchDOMContentLoaded();

  // 恢复到最后剩余一组，idle 显示「开始」
  assert.ok(rendered(doc, 'btn-start-set'));
  assert.ok(rendered(doc, 'btn-skip-remaining'));
  click(doc, 'btn-skip-remaining');

  const log = readLog(storage);
  assert.equal(log[DAY].completedAt != null, true);
  assert.equal(log[DAY].endedEarly, false);
  assert.equal(log[DAY].plan[3].sets[3].skipped, true);
  assert.equal(log[DAY].plan[3].sets[3].count, 0);
  assert.equal(storage.getItem('train.session'), null);
  assert.ok(rendered(doc, 'btn-new-session')); // 完成卡
});

test('退出时进行中的计时会冻结：秒数写回计划并保存会话', (t) => {
  const storage = createStorage();
  const doc = createDocument();
  const context = bootApp({ storage, doc, clockStart: 0 });
  t.after(() => context.clearTimers());
  doc.dispatchDOMContentLoaded();

  click(doc, 'btn-start'); // 开始第 1 组
  context.clock.advance(65000);
  context.dispatchWindow('pagehide'); // 用户切走 / 退出

  const log = readLog(storage);
  const sec = log[DAY].plan[0].sets[0].sec;
  assert.ok(sec > 64 && sec < 66, '进行中秒数应约 65，实际 ' + sec);
  const s = readSession(storage);
  assert.ok(s.setAccum > 64 && s.setAccum < 66);
  assert.equal(s.running, true);
  assert.equal(s.exIdx, 0);
  assert.equal(s.setIdx, 0);
});

test('断点续连：重新打开后恢复为暂停的「继续」界面，不自动计时', (t) => {
  const storage = createStorage();
  const doc1 = createDocument();
  const ctx1 = bootApp({ storage, doc: doc1, clockStart: 0 });
  doc1.dispatchDOMContentLoaded();
  click(doc1, 'btn-start');
  ctx1.clock.advance(65000);
  ctx1.dispatchWindow('pagehide');
  ctx1.clearTimers();

  // 重新打开应用
  const doc = createDocument();
  const context = bootApp({ storage, doc });
  t.after(() => context.clearTimers());
  doc.dispatchDOMContentLoaded();

  // idle 状态：有「继续」按钮，无「开始休息」；冻结秒数保留
  assert.ok(rendered(doc, 'btn-start-set'));
  assert.ok(!rendered(doc, 'btn-to-rest'));
  assert.ok(rendered(doc, 'btn-skip-remaining'));
  const s = readSession(storage);
  assert.equal(s.exIdx, 0);
  assert.equal(s.setIdx, 0);
  assert.ok(s.setAccum > 64 && s.setAccum < 66);

  // 恢复后不自动计时：时钟前进不改变已冻结进度
  context.clock.advance(10000);
  const s2 = readSession(storage);
  assert.ok(s2.setAccum > 64 && s2.setAccum < 66);
  // 会话未被清除，计划里进行中的秒数也保留了
  const log = readLog(storage);
  assert.ok(log[DAY].plan[0].sets[0].sec > 64);
});

test('断点续连：休息中退出后恢复休息界面，秒数冻结且会话保留', (t) => {
  const storage = createStorage();
  const firstDoc = createDocument();
  const firstContext = bootApp({ storage, doc: firstDoc, clockStart: 0 });
  firstDoc.dispatchDOMContentLoaded();
  click(firstDoc, 'btn-start');
  firstContext.clock.advance(5000);
  click(firstDoc, 'btn-to-rest');
  firstContext.clock.advance(12000);
  firstContext.dispatchWindow('pagehide');
  firstContext.clearTimers();

  const doc = createDocument();
  const context = bootApp({ storage, doc, clockStart: 100000 });
  t.after(() => context.clearTimers());
  doc.dispatchDOMContentLoaded();

  assert.ok(rendered(doc, 'btn-rest-done'));
  assert.ok(doc.getElementById('today-body').innerHTML.includes('0:12'));
  assert.equal(readSession(storage).resting, true);
  assert.ok(readSession(storage).restAccum >= 12 && readSession(storage).restAccum < 13);
  context.clock.advance(10000);
  assert.ok(doc.getElementById('today-body').innerHTML.includes('0:12'));
  assert.notEqual(storage.getItem('train.session'), null);
});

test('断点续连：暂停中退出，恢复后保持暂停标记', (t) => {
  const plan = basePlan({ done0: 1 });
  const storage = createStorage({ 'train.log': JSON.stringify({ [DAY]: makeLog(plan) }) });
  storage.setItem('train.session', JSON.stringify(makeSession({ exIdx: 0, setIdx: 1, paused: true })));
  const doc = createDocument();
  const context = bootApp({ storage, doc });
  t.after(() => context.clearTimers());
  doc.dispatchDOMContentLoaded();

  assert.ok(doc.getElementById('today-date').textContent.includes('已暂停'));
  assert.equal(doc.getElementById('pause-label').textContent, '继续计时');
  assert.ok(rendered(doc, 'btn-start-set'));
  assert.equal(readSession(storage).paused, true);
});

test('断点续连：跨天的会话被丢弃，重新开始新的一天', (t) => {
  const yKey = yesterdayKey();
  const plan = basePlan({ done0: 1 });
  const storage = createStorage({ 'train.log': JSON.stringify({ [yKey]: makeLog(plan) }) });
  storage.setItem('train.session', JSON.stringify(makeSession({ date: yKey, exIdx: 0, setIdx: 1 })));
  const doc = createDocument();
  const context = bootApp({ storage, doc });
  t.after(() => context.clearTimers());
  doc.dispatchDOMContentLoaded();

  assert.equal(storage.getItem('train.session'), null);
  // 新的一天从第一个动作的「开始训练」开始
  assert.ok(rendered(doc, 'btn-start'));
  assert.ok(!rendered(doc, 'btn-skip-remaining'));
});

test('断点续连：会话对应的计划不存在时丢弃并新建', (t) => {
  const storage = createStorage(); // 今天没有任何记录
  storage.setItem('train.session', JSON.stringify(makeSession()));
  const doc = createDocument();
  const context = bootApp({ storage, doc });
  t.after(() => context.clearTimers());
  doc.dispatchDOMContentLoaded();

  assert.equal(storage.getItem('train.session'), null);
  assert.ok(rendered(doc, 'btn-start'));
});

test('当天已完成时忽略残留会话，直接显示完成卡', (t) => {
  const plan = basePlan({ done0: 4, cardioDone: true });
  const entry = makeLog(plan, { completedAt: new Date().toISOString() });
  const storage = createStorage({ 'train.log': JSON.stringify({ [DAY]: entry }) });
  storage.setItem('train.session', JSON.stringify(makeSession()));
  const doc = createDocument();
  const context = bootApp({ storage, doc });
  t.after(() => context.clearTimers());
  doc.dispatchDOMContentLoaded();

  assert.equal(storage.getItem('train.session'), null);
  assert.ok(rendered(doc, 'btn-new-session'));
});

test('提前结束训练（finishDay）后会话被清除', (t) => {
  const storage = createStorage();
  const doc = createDocument();
  const context = bootApp({ storage, doc });
  t.after(() => context.clearTimers());
  doc.dispatchDOMContentLoaded();

  // 完成两组后处于休息中
  click(doc, 'btn-start');
  click(doc, 'btn-to-rest');
  click(doc, 'btn-rest-done');
  click(doc, 'btn-to-rest');
  assert.ok(rendered(doc, 'btn-skip-remaining'));

  // 点「提前结束训练」
  const finishEarly = doc.getElementById('finish-early');
  assert.ok(finishEarly.listeners.click.length > 0);
  finishEarly.listeners.click.slice(-1)[0]();

  const log = readLog(storage);
  assert.equal(log[DAY].completedAt != null, true);
  assert.equal(log[DAY].endedEarly, true);
  assert.equal(storage.getItem('train.session'), null);
  assert.ok(rendered(doc, 'btn-new-session')); // 完成卡
});

test('热力图与设置对话框在浏览器 API stub 下可完成 smoke 渲染', (t) => {
  const doc = createDocument([
    '<button id="tab-today" class="tab active" data-view="today"></button>',
    '<button id="tab-heat" class="tab" data-view="heat"></button>',
    '<button id="tab-history" class="tab" data-view="history"></button>'
  ].join(''));
  const context = bootApp({ storage: createStorage(), doc });
  t.after(() => context.clearTimers());
  doc.dispatchDOMContentLoaded();

  click(doc, 'tab-heat');
  assert.equal(doc.getElementById('heat-grid').children.length, 35);

  click(doc, 'btn-settings');
  assert.equal(doc.getElementById('dlg-settings').open, true);
  click(doc, 'set-cancel');
  assert.equal(doc.getElementById('dlg-settings').open, false);
});

test('训练同步事件在闲置时重载计划，组计时进行中不打断', (t) => {
  const storage = createStorage();
  const doc = createDocument();
  const context = bootApp({ storage, doc });
  t.after(() => context.clearTimers());
  doc.dispatchDOMContentLoaded();

  const syncedPlan = basePlan({ done0: 1 });
  storage.setItem('train.log', JSON.stringify({ [DAY]: makeLog(syncedPlan) }));
  context.dispatchEvent(new context.CustomEvent('training:data-change'));
  click(doc, 'btn-start');
  assert.ok(doc.getElementById('today-body').innerHTML.includes('第 2 / 4 组'));
  assert.ok(rendered(doc, 'btn-to-rest'));

  const replacementPlan = basePlan({ done0: 4 });
  const remoteDay = '2026-01-02';
  storage.setItem('train.log', JSON.stringify({
    [DAY]: makeLog(replacementPlan),
    [remoteDay]: { date: remoteDay, plan: basePlan({ done0: 2 }), cardio: 'run', completedAt: null }
  }));
  context.dispatchEvent(new context.CustomEvent('training:data-change'));
  assert.ok(rendered(doc, 'btn-to-rest'));
  assert.ok(doc.getElementById('today-body').innerHTML.includes('第 2 / 4 组'));
  context.dispatchWindow('pagehide');
  assert.ok(readLog(storage)[remoteDay], '计时保存不应覆盖远端新增的历史日期');
});

test('训练进行中遇到同步重置时继续显示，但不把旧账号日志写回', (t) => {
  const storage = createStorage();
  const doc = createDocument();
  const context = bootApp({ storage, doc });
  t.after(() => context.clearTimers());
  doc.dispatchDOMContentLoaded();
  click(doc, 'btn-start');

  storage.removeItem('train.log');
  storage.removeItem('train.session');
  context.dispatchEvent(new context.CustomEvent('training:data-change', { detail: { reset: true } }));
  assert.ok(rendered(doc, 'btn-to-rest'));
  context.clock.advance(5000);
  context.dispatchWindow('pagehide');
  assert.equal(storage.getItem('train.log'), null);
  assert.equal(storage.getItem('train.session'), null);
});

test('非今日视图收到同步事件后，切回今日显示新计划', (t) => {
  const storage = createStorage();
  const doc = createDocument([
    '<button id="tab-today" class="tab active" data-view="today"></button>',
    '<button id="tab-heat" class="tab" data-view="heat"></button>',
    '<button id="tab-history" class="tab" data-view="history"></button>'
  ].join(''));
  const context = bootApp({ storage, doc });
  t.after(() => context.clearTimers());
  doc.dispatchDOMContentLoaded();
  click(doc, 'tab-heat');

  storage.setItem('train.log', JSON.stringify({ [DAY]: makeLog(basePlan({ done0: 1 })) }));
  context.dispatchEvent(new context.CustomEvent('training:data-change'));
  click(doc, 'tab-today');
  click(doc, 'btn-start');
  assert.ok(doc.getElementById('today-body').innerHTML.includes('第 2 / 4 组'));
});
