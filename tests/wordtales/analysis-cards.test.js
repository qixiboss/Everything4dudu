const test = require('node:test');
const assert = require('node:assert/strict');

const { loadLearningApp } = require('./helpers/browser-env');

/*
 * 段落解析按钮在之前调用了 Reader 闭包内未导出的 closeWordPopups，
 * 点击时抛 ReferenceError，解析面板永远不显示。该测试用最小化的
 * DOM 桩调用 showAnalysis 走完一次完整渲染，回归保护从此不再发生。
 */
test('解析面板能完成翻译与要点渲染，不抛 ReferenceError', async () => {
  function makeStubElement(tagName) {
    return {
      tagName: (tagName || 'div').toUpperCase(),
      className: '',
      children: [],
      classList: { add() {}, remove() {}, contains: () => false },
      dataset: {},
      attributes: {},
      textContent: '',
      innerHTML: '',
      style: {},
      appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
      },
      removeChild(child) {
        const index = this.children.indexOf(child);
        if (index >= 0) this.children.splice(index, 1);
        child.parentNode = null;
        return child;
      },
      get firstChild() { return this.children[0] || null; },
      get lastChild() { return this.children[this.children.length - 1] || null; }
    };
  }
  function makeStubDocument() {
    return {
      body: makeStubElement('body'),
      activeElement: null,
      createElement(tagName) { return makeStubElement(tagName); },
      createTextNode(text) {
        const node = makeStubElement('#text');
        node.textContent = String(text);
        return node;
      },
      getElementById: () => null,
      querySelectorAll: () => [],
      querySelector: () => null
    };
  }
  const context = loadLearningApp({ document: makeStubDocument() });
  const WordTales = context.WordTales;

  /* analysis-cards.js 在加载时会取 FeatureProgress/Progress/Game/CopyPractice/
   * WordPopup 引用，先塞齐占位避免初始化即崩。 */
  WordTales.FeatureProgress = {
    setCardStarState: function () {},
    setColumnCompletionButtonState: function () {}
  };
  WordTales.Progress = { has: function () { return false; } };
  WordTales.Game = { start: function () {} };
  WordTales.CopyPractice = { start: function () {} };
  /* close 必须存在，回归该路径才能真正生效。 */
  let closeCalled = 0;
  WordTales.WordPopup = { close: function () { closeCalled += 1; } };

  require('node:vm').runInContext(
    require('node:fs').readFileSync(
      require('node:path').resolve(__dirname, '../../site/words/js/analysis-cards.js'),
      'utf8'
    ),
    context,
    { filename: 'site/words/js/analysis-cards.js' }
  );

  const data = require('node:fs').readFileSync(
    require('node:path').resolve(__dirname, '../../site/words/js/data.js'),
    'utf8'
  );
  /* 重新跑 data.js 以确保 WordTales.Data 在同一 context 中可用。 */
  require('node:vm').runInContext(data, context, { filename: 'site/words/js/data.js' });

  const sample = WordTales.Data.getAllEntries()[0];
  const occurrence = WordTales.Data.getOccurrence(sample.primaryOccurrenceId);
  const paragraphId = occurrence.paragraphId;
  assert.ok(paragraphId, 'fixture entry should have a paragraph context');

  const paraEl = makeStubElement('p');
  paraEl.dataset.paragraphId = paragraphId;
  paraEl.textContent = sample.meaning || sample.word;

  const back = makeStubElement('div');
  /* back 自带一个“返回”按钮子节点，与真实界面保持一致。 */
  back.appendChild(makeStubElement('button'));

  const block = {
    querySelectorAll(selector) {
      if (selector === '.essay-face p') return [paraEl];
      return [];
    }
  };

  /* 之前在真实页面里 closeWordPopups 未定义时会立即抛错。
   * 现在这个分支必须顺利跑通，且 WordPopup.close 必须被调用。 */
  assert.doesNotThrow(function () {
    WordTales.Analysis.show(block, back, 0);
  });

  assert.equal(closeCalled, 1, '解析开始时应关闭词条弹层');
  assert.ok(back.children.length >= 2, '解析背面应至少追加原文与翻译/要点节点');
  /* 翻译文本必须出现在某个子节点的 textContent 中。 */
  const paragraph = WordTales.Data.getParagraph(paragraphId);
  assert.ok(paragraph && paragraph.analysis, 'fixture paragraph should have analysis data');
  /* 桩元素的 textContent 不会自动聚合子节点，递归扫描所有子节点。 */
  function collectText(node) {
    if (!node) return '';
    if (node.nodeType === 3) return node.textContent || '';
    if (!node.children || !node.children.length) return node.textContent || '';
    return Array.from(node.children).map(collectText).join('');
  }
  const joined = collectText(back);
  assert.ok(joined.includes(paragraph.analysis.translation),
    'back side should render translation text');
});
