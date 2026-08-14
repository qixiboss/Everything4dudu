const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const siteRoot = path.join(root, 'site');
const Model = require('../site/CostTrace/model.js');

function record(id, date, type, category, amountCents, detail = '测试记录') {
  return { id, date, type, category, amountCents, detail };
}

function xlsxFiles(bytes) {
  const files = {};
  let offset = 0;
  while (bytes.readUInt32LE(offset) === 0x04034b50) {
    const size = bytes.readUInt32LE(offset + 18);
    const nameLength = bytes.readUInt16LE(offset + 26);
    const extraLength = bytes.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const name = bytes.subarray(nameStart, nameStart + nameLength).toString('utf8');
    const dataStart = nameStart + nameLength + extraLength;
    files[name] = bytes.subarray(dataStart, dataStart + size).toString('utf8');
    offset = dataStart + size;
  }
  return files;
}

test('金额以分精确解析并拒绝无效精度和零金额', () => {
  assert.equal(Model.parseAmountToCents('12.34'), 1234);
  assert.equal(Model.parseAmountToCents('0.01'), 1);
  assert.equal(Model.parseAmountToCents('12.3'), 1230);
  assert.equal(Model.parseAmountToCents('0'), null);
  assert.equal(Model.parseAmountToCents('1.234'), null);
  assert.equal(Model.parseAmountToCents('-2'), null);
});

test('本地账本解析区分空数据与损坏或无效数据', () => {
  assert.deepEqual(Model.parseStoredRecords(null), []);
  assert.deepEqual(Model.parseStoredRecords(JSON.stringify([
    record('1', '2026-08-13', 'expense', '食', 1250, '午餐')
  ])).map((item) => item.id), ['1']);
  assert.throws(() => Model.parseStoredRecords('{broken'), SyntaxError);
  assert.throws(() => Model.parseStoredRecords('{}'), TypeError);
  assert.throws(() => Model.parseStoredRecords(JSON.stringify([{ id: 'bad' }])), TypeError);
});

test('表单校验限制未来日期、明细、类别联动和收入支出类型', () => {
  const valid = Model.validate({ id: 'a', date: '2026-08-13', type: 'expense', detail: ' 午餐 ', category: '食', amount: '18.50' }, '2026-08-13');
  assert.equal(valid.valid, true);
  assert.equal(valid.value.detail, '午餐');
  assert.equal(valid.value.amountCents, 1850);
  assert.deepEqual(Model.categoriesFor('expense'), ['衣', '食', '住', '行', '玩', '其他']);
  assert.deepEqual(Model.categoriesFor('income'), ['工资', '奖金', '一次性收入', '其他']);
  assert.equal(Model.validate({ date: '2026-08-14', type: 'expense', detail: '午餐', category: '食', amount: '1' }, '2026-08-13').field, 'date');
  assert.equal(Model.validate({ date: '2026-08-13', type: 'income', detail: '工资', category: '食', amount: '1' }, '2026-08-13').field, 'category');
});

test('月度指标、占比和同额类别排行相互对账', () => {
  const rows = [
    record('1', '2026-08-01', 'expense', '食', 2500),
    record('2', '2026-08-02', 'expense', '衣', 2500),
    record('3', '2026-08-03', 'income', '工资', 10000),
    record('4', '2026-07-30', 'expense', '住', 9999)
  ];
  assert.deepEqual(Model.monthSummary(rows, '2026-08'), { expense: 5000, income: 10000, balance: 5000, count: 3 });
  assert.equal(Model.expenseComposition(rows, '2026-08').reduce((sum, item) => sum + item.percent, 0), 1);
  assert.deepEqual(Model.expenseRanking(rows, '2026-08').map((item) => item.category), ['衣', '食']);
});

test('每日支出补齐零值并正确处理闰年、当前月和历史月', () => {
  const rows = [record('1', '2024-02-29', 'expense', '食', 880)];
  const history = Model.dailyExpenses(rows, '2024-02', '2024-03-01');
  assert.equal(history.length, 29);
  assert.equal(history[0].amountCents, 0);
  assert.equal(history[28].amountCents, 880);
  assert.equal(Model.dailyExpenses([], '2026-08', '2026-08-13').length, 13);
});

test('自然年序列按月计算收入、支出与可为负的结余', () => {
  const rows = [
    record('1', '2026-01-02', 'income', '工资', 10000),
    record('2', '2026-01-03', 'expense', '住', 12000),
    record('3', '2026-02-01', 'income', '奖金', 3000)
  ];
  const series = Model.yearlySeries(rows, 2026);
  assert.equal(series.length, 12);
  assert.deepEqual(series[0], { month: 1, income: 10000, expense: 12000, balance: -2000 });
  assert.deepEqual(series[1], { month: 2, income: 3000, expense: 0, balance: 3000 });
});

test('明细筛选组合生效且始终按日期倒序', () => {
  const rows = [
    record('1', '2026-08-01', 'expense', '食', 100, '午餐'),
    record('2', '2026-08-03', 'expense', '行', 200, '地铁'),
    record('3', '2026-08-02', 'income', '工资', 300, '八月工资')
  ];
  assert.deepEqual(Model.applyFilters(rows, { month: '2026-08', type: 'expense' }).map((item) => item.id), ['2', '1']);
  assert.deepEqual(Model.applyFilters(rows, { startDate: '2026-08-02', endDate: '2026-08-03', query: '工资' }).map((item) => item.id), ['3']);
});

test('XLSX 导出包含工作表、类型化日期金额、冻结首行与自动筛选', () => {
  const context = vm.createContext({ TextEncoder, Blob, console });
  context.window = context;
  context.globalThis = context;
  vm.runInContext(fs.readFileSync(path.join(siteRoot, 'CostTrace/vendor/xlsx-lite.js'), 'utf8'), context);
  const output = Buffer.from(context.CostTraceXlsx.build([record('1', '2026-08-13', 'expense', '食', 1250, '午餐')]));
  const files = xlsxFiles(output);
  assert.match(files['xl/workbook.xml'], /name="收支明细"/);
  assert.match(files['xl/worksheets/sheet1.xml'], /<pane ySplit="1"[^>]+state="frozen"/);
  assert.match(files['xl/worksheets/sheet1.xml'], /<autoFilter ref="A1:E2"/);
  assert.match(files['xl/worksheets/sheet1.xml'], /<c r="A2" s="1"><v>\d+<\/v><\/c>/);
  assert.match(files['xl/worksheets/sheet1.xml'], /<c r="E2" s="2"><v>12\.5<\/v><\/c>/);
  assert.match(files['xl/styles.xml'], /formatCode="yyyy-mm-dd"/);
  assert.match(files['xl/styles.xml'], /¥#,##0\.00/);
});

test('CostTrace 同步适配器使用 transaction 键并处理远端墓碑', () => {
  const source = fs.readFileSync(path.join(siteRoot, 'CostTrace/sync.js'), 'utf8');
  assert.match(source, /item_key: 'transaction:' \+ record\.id/);
  assert.match(source, /if \(row\.deleted_at\) delete map\[id\]/);
  assert.match(source, /app: 'cost-trace'/);
  assert.match(source, /costtrace\.transactions\.v1/);
});

test('CostTrace 远端合并落盘失败时抛错并保留原账本', async () => {
  const initial = JSON.stringify([record('1', '2026-08-13', 'expense', '食', 1250, '午餐')]);
  let stored = initial;
  let adapter;
  const context = vm.createContext({
    console,
    localStorage: {
      getItem: () => stored,
      setItem() { throw new Error('quota exceeded'); },
      removeItem() { stored = null; }
    },
    document: { readyState: 'complete' },
    CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init && init.detail; },
    dispatchEvent() {},
    HubAppSync: { start(value) { adapter = value; } }
  });
  context.window = context;
  context.globalThis = context;
  vm.runInContext(fs.readFileSync(path.join(siteRoot, 'CostTrace/model.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(siteRoot, 'CostTrace/sync.js'), 'utf8'), context);

  assert.equal(typeof adapter.applyRemote, 'function');
  await assert.rejects(adapter.applyRemote([{
    item_key: 'transaction:2',
    payload: record('2', '2026-08-12', 'income', '工资', 500000, '工资'),
    updated_at: '2026-08-13T00:00:00.000Z',
    deleted_at: null
  }]), /quota exceeded/);
  assert.equal(stored, initial);
});

test('CostTrace 同步在损坏账本上暂停且不注册适配器', () => {
  let starts = 0;
  const statuses = [];
  const context = vm.createContext({
    console,
    localStorage: { getItem: () => '{broken' },
    document: { readyState: 'complete' },
    CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init && init.detail; },
    dispatchEvent(event) { statuses.push(event); },
    HubAppSync: {
      start(adapter) {
        adapter.items();
        starts += 1;
      }
    }
  });
  context.window = context;
  context.globalThis = context;
  vm.runInContext(fs.readFileSync(path.join(siteRoot, 'CostTrace/model.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(siteRoot, 'CostTrace/sync.js'), 'utf8'), context);

  assert.equal(starts, 0);
  assert.equal(statuses.at(-1).detail.state, 'error');
});

test('CostTrace 移动端提供底部导航、折叠筛选与卡片式明细', () => {
  const html = fs.readFileSync(path.join(siteRoot, 'CostTrace/index.html'), 'utf8');
  const css = fs.readFileSync(path.join(siteRoot, 'CostTrace/styles.css'), 'utf8');
  const app = fs.readFileSync(path.join(siteRoot, 'CostTrace/app.js'), 'utf8');

  assert.match(html, /data-filter-toggle[^>]+aria-label="展开筛选"[^>]+aria-controls="detail-filters"/);
  assert.match(html, /id="detail-filters" data-filters/);
  assert.match(html, /class="month-step month-step-prev"[^>]+data-month-prev/);
  assert.match(html, /data-month-prev-label/);
  assert.match(html, /data-month-next-label/);
  assert.match(html, /id="dashboard-month" type="month" data-dashboard-month aria-label="选择仪表盘月份"/);
  assert.match(html, /data-month-label aria-live="polite"/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]+\.view-tabs \{ position: fixed/);
  assert.match(css, /\.month-nav \{ width: 100%; grid-template-columns: 44px minmax\(0, 1fr\) 44px; gap: 4px; \}/);
  assert.match(css, /\.filters > label \{ width: 100%; min-width: 0; max-width: 100%; \}/);
  assert.match(css, /\.filters input, \.filters select \{ display: block; width: 100%; min-width: 0; max-width: 100%; \}/);
  assert.match(css, /\.details-actions \.secondary \{ flex: 0 0 48px; width: 48px; height: 48px;/);
  assert.match(css, /tbody tr \{ display: grid/);
  assert.match(css, /\.metric\.balance \{ grid-column: 1 \/ -1/);
  assert.match(app, /function toggleFilters\(force\)/);
  assert.match(app, /moveDashboardMonth\(delta\)/);
  assert.match(app, /\[data-filter-toggle\].+toggleFilters/);
});
