'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '../../site/training/model.js'), 'utf8');

function model() {
  const context = vm.createContext({ window: {}, Date, Object, Array, Number, JSON, isNaN });
  vm.runInContext(source, context, { filename: 'training/model.js' });
  return context.window.TrainingModel;
}

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    values
  };
}

function planEntry(plan, extra = {}) {
  return { date: '2026-08-15', plan, cardio: 'run', completedAt: null, endedEarly: false, ...extra };
}

test('TrainingModel 保留原存储键并规范化设置与日志', () => {
  const subject = model();
  assert.deepEqual(JSON.parse(JSON.stringify(subject.KEYS)), {
    settings: 'train.settings', log: 'train.log', session: 'train.session'
  });
  const local = storage({
    'train.settings': JSON.stringify({ targets: { pushup: 25 }, autoAlt: true, restSeconds: 90 }),
    'train.log': JSON.stringify({ '2026-08-15': { date: '2026-08-15' } })
  });
  const loaded = subject.load(local);
  assert.equal(loaded.settings.targets.pushup, 25);
  assert.equal(loaded.settings.targets.pullup, 8);
  assert.equal(loaded.settings.autoAlt, true);
  assert.equal(loaded.settings.restSeconds, 90);
  assert.ok(loaded.log['2026-08-15']);

  const broken = subject.load(storage({ 'train.settings': '{broken', 'train.log': JSON.stringify({ unsafe: true }) }));
  assert.equal(broken.settings.targets.pushup, 20);
  assert.deepEqual(JSON.parse(JSON.stringify(broken.log)), {});
});

test('TrainingModel 按目标生成四个力量动作与一个有氧动作', () => {
  const subject = model();
  const settings = subject.defaultSettings();
  settings.targets.pullup = 12;
  const plan = subject.buildPlan(settings, 'ride');
  assert.equal(plan.length, 5);
  assert.equal(plan[3].sets.length, 4);
  assert.equal(plan[3].sets[0].count, 12);
  assert.equal(plan[4].id, 'ride');
  assert.equal(plan[4].name, '骑行');
  assert.equal(plan[4].cardio, true);
});

test('TrainingModel 验证断点会话并回退到下一个未完成组', () => {
  const subject = model();
  const plan = subject.buildPlan(subject.defaultSettings(), 'run');
  plan[0].sets[0].done = true;
  plan[0].sets[1].sec = 17;
  const log = { '2026-08-15': planEntry(plan) };
  const restored = subject.restoreSession({
    date: '2026-08-15', exIdx: 0, setIdx: 0, setAccum: 99, cardioMin: 35, paused: true
  }, log, '2026-08-15');
  assert.equal(restored.shouldClear, false);
  assert.equal(restored.value.exIdx, 0);
  assert.equal(restored.value.setIdx, 1);
  assert.equal(restored.value.setAccum, 17);
  assert.equal(restored.value.paused, true);
  assert.equal(restored.value.cardioMin, 35);

  assert.equal(subject.restoreSession({ date: '2026-08-14' }, log, '2026-08-15').shouldClear, true);
  assert.equal(subject.restoreSession({ date: '2026-08-15' }, {}, '2026-08-15').shouldClear, true);
});

test('TrainingModel 恢复休息状态时前进到下一未完成组并校验休息秒数', () => {
  const subject = model();
  const plan = subject.buildPlan(subject.defaultSettings(), 'run');
  plan[0].sets[0].done = true;
  const log = { '2026-08-15': planEntry(plan) };
  const restored = subject.restoreSession({
    date: '2026-08-15', exIdx: 0, setIdx: 0, resting: true, restAccum: 42.5
  }, log, '2026-08-15');

  assert.equal(restored.value.exIdx, 0);
  assert.equal(restored.value.setIdx, 1);
  assert.equal(restored.value.resting, true);
  assert.equal(restored.value.restAccum, 42.5);

  const invalid = subject.restoreSession({
    date: '2026-08-15', exIdx: 0, setIdx: 0, resting: true, restAccum: -1
  }, log, '2026-08-15');
  assert.equal(invalid.value.restAccum, 0);
});

test('TrainingModel 汇总总时长、近七天、训练日和有氧次数', () => {
  const subject = model();
  const recentPlan = subject.buildPlan(subject.defaultSettings(), 'run');
  recentPlan[0].sets[0] = { done: true, count: 20, sec: 45 };
  recentPlan[4].sets[0] = { done: true, count: 0, sec: 1800 };
  const oldPlan = subject.buildPlan(subject.defaultSettings(), 'ride');
  oldPlan[0].sets[0] = { done: true, count: 20, sec: 60 };
  const now = new Date('2026-08-15T12:00:00').getTime();
  const summary = subject.summarize({
    '2026-08-15': planEntry(recentPlan),
    '2026-06-01': planEntry(oldPlan)
  }, now);
  assert.equal(summary.totalSeconds, 1905);
  assert.equal(summary.weekSeconds, 1845);
  assert.equal(summary.monthDays, 1);
  assert.equal(summary.cardioCount, 1);
  assert.deepEqual(Array.from(summary.contentKeys).sort(), ['2026-06-01', '2026-08-15']);
});
