const test = require('node:test');
const assert = require('node:assert/strict');

const { loadLearningApp, loadScript } = require('./helpers/browser-env');

function loadStudyRecord() {
  const context = loadLearningApp();
  loadScript(context, 'vocab-essays/js/study-record.js');
  return context.WordTales.StudyRecord;
}

test('记录表按本地月份生成完整日期列', () => {
  const record = loadStudyRecord();
  const august = Array.from(record.getMonthDateKeys('2026-08-09'));

  assert.equal(record.getMonthStartKey('2026-08-09'), '2026-08-01');
  assert.equal(august.length, 31);
  assert.equal(august[0], '2026-08-01');
  assert.equal(august.at(-1), '2026-08-31');
});

test('记录表正确处理闰年与普通年二月', () => {
  const record = loadStudyRecord();

  assert.equal(Array.from(record.getMonthDateKeys('2028-02-10')).length, 29);
  assert.equal(Array.from(record.getMonthDateKeys('2027-02-10')).length, 28);
});
