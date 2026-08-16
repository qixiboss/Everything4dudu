'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function loadModel() {
  const context = vm.createContext({ window: {}, console, Date, Object, Array });
  ['data.js', 'model.js'].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(root, 'site/exam-schedule', file), 'utf8'), context, { filename: file });
  });
  return {
    data: context.window.ExamScheduleData,
    model: context.window.ExamScheduleModel
  };
}

function storage(initial) {
  const values = new Map(Object.entries(initial || {}));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    values
  };
}

test('考研日程稳定生成 7 月 29 日至 8 月 31 日的 34 天计划', () => {
  const { data, model } = loadModel();
  const days = model.buildSchedule(data);
  const tasks = model.allTasks(days);

  assert.equal(days.length, 34);
  assert.equal(days[0].date.getFullYear(), 2026);
  assert.equal(days[0].date.getMonth(), 6);
  assert.equal(days[0].date.getDate(), 29);
  assert.equal(days.at(-1).date.getMonth(), 7);
  assert.equal(days.at(-1).date.getDate(), 31);
  assert.equal(days.filter((day) => day.rest).length, 5);
  assert.equal(tasks.length, 273);
  assert.deepEqual(
    Object.fromEntries(Object.entries(model.tasksBySubject(tasks)).map(([subject, items]) => [subject, items.length])),
    { math: 49, co: 27, os: 93, net: 104 }
  );
  assert.equal(new Set(tasks.map((item) => item.t.id)).size, tasks.length);
});

test('未完成旧任务顺延，完成后从后续日期队列移除', () => {
  const { data, model } = loadModel();
  const days = model.buildSchedule(data);
  const tasks = model.allTasks(days);
  const state = { completed: {}, rested: {} };
  const dayTwo = days[1];
  const firstTask = days[0].tasks[0];

  assert.equal(model.tasksForDay(tasks, state, dayTwo).some((item) => item.t.id === firstTask.id), true);
  state.completed[firstTask.id] = 1234;
  assert.equal(model.tasksForDay(tasks, state, dayTwo).some((item) => item.t.id === firstTask.id), false);
});

test('休息标记和完成记录按原存储键读取、保存并容忍损坏 JSON', () => {
  const { model } = loadModel();
  const local = storage({
    [model.STORAGE_KEY]: JSON.stringify({ completed: { task: 10 }, rested: { 4: true } })
  });
  const state = model.readState(local, console);
  assert.equal(state.completed.task, 10);
  assert.equal(state.rested[4], true);

  state.completed.next = 20;
  assert.equal(model.writeState(local, state, console), true);
  assert.equal(JSON.parse(local.values.get(model.STORAGE_KEY)).completed.next, 20);

  const warnings = [];
  const broken = storage({ [model.STORAGE_KEY]: '{broken' });
  assert.deepEqual(JSON.parse(JSON.stringify(model.readState(broken, { warn: (...args) => warnings.push(args) }))), { completed: {}, rested: {} });
  assert.equal(warnings.length, 1);
});

test('时间线过滤保持科目、阶段、七天范围与隐藏休息日语义', () => {
  const { data, model } = loadModel();
  const days = model.buildSchedule(data);
  const week = model.timelineDays(days, 8, { subject: 'all', phase: 'all', scope: 'week', hideRest: false });
  assert.equal(week.length, 7);

  const phaseTwoMath = model.timelineDays(days, 12, { subject: 'math', phase: '2', scope: 'all', hideRest: true });
  assert.ok(phaseTwoMath.length > 0);
  phaseTwoMath.forEach(({ day, tasks }) => {
    assert.equal(day.phase, 2);
    assert.equal(day.rest, false);
    tasks.forEach((task) => assert.ok(task.subject === 'math' || task.subject === 'review'));
  });
});

test('考研页面只引用外部应用资源且不再加载未使用的 Floating UI', () => {
  const html = fs.readFileSync(path.join(root, 'site/exam-schedule/index.html'), 'utf8');
  assert.match(html, /href="styles\.css"/);
  assert.match(html, /src="data\.js"/);
  assert.match(html, /src="model\.js"/);
  assert.match(html, /src="app\.js"/);
  assert.doesNotMatch(html, /FloatingUIDOM|@floating-ui|data-tooltip/);
  assert.doesNotMatch(html, /<style>/);
});

test('考研页面复用模型时间线过滤并响应同步数据变更事件', () => {
  const app = fs.readFileSync(path.join(root, 'site/exam-schedule/app.js'), 'utf8');
  assert.match(app, /Model\.timelineDays\(days,selected,/);
  assert.match(app, /addEventListener\('exam-schedule:data-change'/);
  assert.match(app, /state=Model\.readState\(localStorage,console\);renderAll\(\);renderTimeline\(\)/);
  assert.doesNotMatch(app, /days\.slice\(from,from\+7\)/);
});
