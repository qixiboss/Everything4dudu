const test = require('node:test');
const assert = require('node:assert/strict');

const { loadLearningApp, loadScript } = require('./helpers/browser-env');

async function readyStarredWords() {
  const context = loadLearningApp();
  /* VM context 是独立 realm：把 atob/btoa 显式注入，使 ExportPdf 能
   * 解码字体 base64。Node 22 全局有同名函数，把它们桥接过来。 */
  context.atob = function (input) { return Buffer.from(String(input), 'base64').toString('binary'); };
  context.btoa = function (input) { return Buffer.from(String(input), 'binary').toString('base64'); };
  await context.WordTales.LearningProgress.init();
  /* ExportPdf 依赖 export-font.js 提供的 EmbedFont 数据；测试环境不挂
   * 真实 <script>，所以预先把两份生成文件加载到同一 context。 */
  loadScript(context, 'site/words/js/export-font.js');
  loadScript(context, 'site/words/js/export-pdf.js');
  loadScript(context, 'site/words/js/starred-words.js');
  return {
    data: context.WordTales.Data,
    progress: context.WordTales.LearningProgress,
    starred: context.WordTales.StarredWords,
    exportPdf: context.WordTales.ExportPdf,
    context
  };
}

test('星标列表汇总全部标记词条并按正文顺序排列', async () => {
  const { data, progress, starred } = await readyStarredWords();

  assert.equal(starred.collectRows().length, 0);

  progress.setStarred('s6col2-radiate', true, 'game');
  progress.setStarred('s1col1-barren', true, 'manual');

  const rows = starred.collectRows();
  assert.equal(rows.length, 2);
  /* radiate 的规范词条来自第一份第一列，barren 紧随其后。 */
  /* vm 上下文产生的数组跨 realm，先用 Array.from 转回测试侧再比较。 */
  assert.deepEqual(Array.from(rows, (row) => row.entryId), ['s1col1-radiate', 's1col1-barren']);
  assert.deepEqual(Array.from(rows, (row) => row.word), ['radiate', 'barren']);
  rows.forEach((row) => {
    assert.ok(row.phonetic.startsWith('/'));
    assert.ok(row.pos.length > 0);
    assert.ok(row.meaning.length > 0);
    assert.match(row.source, /第一份 · 第一列/);
    assert.ok(row.sentence.length > 0);
    assert.ok(row.starredAt.length > 0);
  });

  const entry = data.getEntry('s1col1-radiate');
  const occurrence = data.getOccurrence(entry.primaryOccurrenceId);
  assert.equal(rows[0].phonetic, occurrence.word.phonetic);

  progress.setStarred('s1col1-barren', false);
  assert.deepEqual(Array.from(starred.collectRows(), (row) => row.word), ['radiate']);
});

test('导出列清单包含排版参数并按模块定义顺序排列', async () => {
  const { starred } = await readyStarredWords();
  /* 跨 realm 的 Array 不能用 deepStrictEqual；逐个比较 id 即可。 */
  const columns = starred.getExportColumns();
  assert.equal(columns.length, 7);
  assert.equal(columns[0].id, 'word');
  assert.equal(columns[1].id, 'phonetic');
  assert.equal(columns[2].id, 'pos');
  assert.equal(columns[3].id, 'meaning');
  assert.equal(columns[4].id, 'source');
  assert.equal(columns[5].id, 'sentence');
  assert.equal(columns[6].id, 'starredAt');
  /* 默认勾选 5 列基础信息，语境句子与标记时间默认不勾选。 */
  const defaultIds = starred.getDefaultColumnIds();
  assert.equal(defaultIds.length, 5);
  assert.equal(defaultIds.join(','), 'word,phonetic,pos,meaning,source');
});

test('PDF 文档结构完整且嵌入两份字体', async () => {
  const { progress, starred } = await readyStarredWords();
  progress.setStarred('s1col1-proximity', true, 'manual');
  progress.setStarred('s1col1-barren', true, 'manual');

  const rows = starred.collectRows();
  const document = starred.buildExportDocument(rows, ['word', 'phonetic', 'pos', 'meaning', 'source']);
  const { bytes } = document;
  assert.ok(bytes.length > 0, 'PDF bytes should not be empty');
  const decoder = new TextDecoder('latin1');
  const head = decoder.decode(bytes.slice(0, 8));
  assert.equal(head, '%PDF-1.5', 'PDF must start with the standard header');
  const tail = decoder.decode(bytes.slice(-32));
  assert.ok(tail.includes('%%EOF'), 'PDF must end with %%EOF');
  /* 完整结构需要 xref、Catalog、两个 Type0 字体各加一份 FontFile2。 */
  const raw = decoder.decode(bytes);
  assert.match(raw, /\/Type0/);
  assert.match(raw, /\/FontFile2/);
  assert.match(raw, /\/Type[\s]*\/Catalog/);
  assert.equal(document.pageCount >= 1, true);
  /* 文件名遵循“星标单词-YYYY-MM-DD.pdf”约定。 */
  assert.match(document.filename, /^星标单词-\d{4}-\d{2}-\d{2}\.pdf$/);
});

test('列数越多 PDF 页数越能装下相同行数', async () => {
  const { progress, starred } = await readyStarredWords();
  /* 用足够多的真实条目观察分页，避免空表读不出差异。 */
  const ids = [
    's1col1-proximity', 's1col1-barren', 's1col1-radiate', 's1col1-craftsmanship',
    's1col1-testify', 's1col1-sentiment', 's1col1-intimidate', 's1col1-supposedly',
    's1col1-managerial', 's1col1-retailer', 's1col1-elite', 's1col1-deficit'
  ];
  ids.forEach((id) => progress.setStarred(id, true, 'manual'));
  const rows = starred.collectRows();

  const compact = starred.buildExportDocument(rows, ['word', 'meaning']);
  const expanded = starred.buildExportDocument(rows, ['word', 'phonetic', 'pos', 'meaning', 'source']);
  /* expanded 多列通常需要更多页；至少要不少于 compact。 */
  assert.ok(expanded.pageCount >= compact.pageCount,
    `expanded=${expanded.pageCount} pages, compact=${compact.pageCount} pages`);
});

test('空行或未选列时返回零字节', async () => {
  const { starred } = await readyStarredWords();
  const empty = starred.buildExportDocument([], ['word', 'meaning']);
  assert.equal(empty.bytes.length, 0);
  assert.equal(empty.pageCount, 0);
  const noColumn = starred.buildExportDocument([{ word: 'x' }], []);
  assert.equal(noColumn.bytes.length, 0);
});

test('按词集筛选导出范围，跨词集同词条仍可命中', async () => {
  const { progress, starred } = await readyStarredWords();
  /* craftsmanship 仅出现在第一份；radiate 在第一份与第六份均有出现。 */
  progress.setStarred('s1col1-craftsmanship', true, 'manual');
  progress.setStarred('s6col2-radiate', true, 'game');

  const rows = starred.collectRows();
  const craftsmanship = rows.find((row) => row.word === 'craftsmanship');
  const radiate = rows.find((row) => row.word === 'radiate');
  assert.deepEqual(Array.from(craftsmanship.setIds), ['set1']);
  assert.deepEqual(Array.from(radiate.setIds), ['set1', 'set6']);

  const setFilters = Array.from(starred.getSetFilters());
  assert.equal(setFilters.length, 7);
  assert.equal(setFilters[0].id, 'set1');

  const set6 = starred.filterRowsBySets(rows, ['set6']);
  assert.equal(set6.length, 1);
  assert.equal(set6[0].word, 'radiate');

  const set1 = starred.filterRowsBySets(rows, ['set1']);
  assert.equal(set1.length, 2);

  assert.equal(starred.filterRowsBySets(rows, ['set2']).length, 0);
  assert.equal(starred.filterRowsBySets(rows, []).length, 0);
});
