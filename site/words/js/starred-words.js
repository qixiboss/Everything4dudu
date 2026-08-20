/* ============================================================
 * Module: StarredWords
 * 汇总展示所有星标词条，并支持按所选栏目导出 PDF 文件。
 * 星标事实来源仍是 LearningProgress，本模块只读不写。
 * PDF 字体子集约 900KB，首屏不加载；首次点击导出时由 ExportPdf
 * 注入 <script> 拉取 js/export-font.js，之后复用同一 Promise。
 * ============================================================ */
WordTales.StarredWords = (function() {
  var overlay = null;
  var panel = null;
  var exportMenu = null;
  var exportButton = null;
  var exportStatus = null;
  var setOptionList = null;
  var columnOptionList = null;
  var previousFocus = null;
  var previousBodyOverflow = '';
  var initialized = false;

  /*
   * 可导出列：id 用于行数据取值，width / min 用于 PDF 排版。
   * 默认勾选前 5 列基础信息；语境句子与标记时间可按需追加。
   */
  var EXPORT_COLUMNS = [
    { id: 'word', label: '单词', width: 70, min: 52 },
    { id: 'phonetic', label: '音标', width: 100, min: 72 },
    { id: 'pos', label: '词性', width: 32, min: 28 },
    { id: 'meaning', label: '释义', width: 160, min: 96 },
    { id: 'source', label: '词集·栏目', width: 100, min: 60 },
    { id: 'sentence', label: '语境句子', width: 220, min: 110, flex: true },
    { id: 'starredAt', label: '标记时间', width: 68, min: 52 }
  ];
  var DEFAULT_COLUMN_IDS = ['word', 'phonetic', 'pos', 'meaning', 'source'];

  function pad(value) { return ('0' + value).slice(-2); }
  function dayKey(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }
  function formatStarredAt(value) {
    var date = value ? new Date(value) : null;
    if (!date || isNaN(date.getTime())) return '';
    return dayKey(date) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }
  function appendElement(parent, tagName, className, text) {
    var element = document.createElement(tagName);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    parent.appendChild(element);
    return element;
  }
  function createButton(className, text, label) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = text;
    if (label) button.setAttribute('aria-label', label);
    return button;
  }
  function setBackgroundInert(inert) {
    document.querySelectorAll('.library-view').forEach(function(element) { element.inert = inert; });
  }

  /* 汇总全部星标词条，按正文首次出现顺序排列。 */
  function collectRows() {
    if (!WordTales.LearningProgress || !WordTales.LearningProgress.isReady()) return [];
    return WordTales.LearningProgress.getStarredEntryIds().map(function(entryId) {
      var entry = WordTales.Data.getEntry(entryId);
      if (!entry) return null;
      var state = WordTales.LearningProgress.getEntryState(entryId) || {};
      var occurrence = WordTales.Data.getOccurrence(entry.primaryOccurrenceId);
      var context = null;
      (entry.contexts || []).forEach(function(candidate) {
        if (!context && candidate.occurrenceId === entry.primaryOccurrenceId) context = candidate;
      });
      if (!context && entry.contexts && entry.contexts.length) context = entry.contexts[0];
      /* 词集筛选按词条在所有专栏中的出现范围判断，不只看主出处。 */
      var setIds = [];
      (entry.contexts || []).forEach(function(candidate) {
        if (candidate.setId && setIds.indexOf(candidate.setId) < 0) setIds.push(candidate.setId);
      });
      return {
        entryId: entry.id,
        word: entry.word,
        phonetic: occurrence && occurrence.word && occurrence.word.phonetic ? occurrence.word.phonetic : '',
        pos: entry.pos || '',
        meaning: entry.meaning || '',
        source: context ? context.setLabel + ' · ' + context.columnTitle : '',
        sentence: context ? context.sentence : '',
        starredAt: state.starredAt || '',
        sourceOrder: entry.sourceOrder,
        setIds: setIds
      };
    }).filter(Boolean).sort(function(a, b) { return a.sourceOrder - b.sourceOrder; });
  }

  function focusableElements() {
    if (!overlay) return [];
    return Array.prototype.filter.call(
      overlay.querySelectorAll('button, input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
      function(element) { return !element.disabled && element.getClientRects().length > 0; }
    );
  }
  function handleKeydown(event) {
    if (!overlay || !overlay.classList.contains('active')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (exportMenu && !exportMenu.hidden) closeExportMenu();
      else close();
      return;
    }
    if (event.key !== 'Tab') return;
    var focusables = focusableElements();
    if (!focusables.length) { event.preventDefault(); overlay.focus(); return; }
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function closeExportMenu() {
    if (!exportMenu || exportMenu.hidden) return;
    exportMenu.hidden = true;
    if (exportButton) exportButton.setAttribute('aria-expanded', 'false');
  }
  /* 遍历选项容器内的复选框，避开 querySelector 属性选择器以兼容测试桩。 */
  function checkedValues(optionList) {
    if (!optionList) return [];
    var values = [];
    Array.prototype.forEach.call(optionList.children, function(option) {
      var box = option.firstChild;
      if (box && box.checked) values.push(box.value);
    });
    return values;
  }
  function allOptionsChecked(optionList) {
    if (!optionList || !optionList.children.length) return false;
    return Array.prototype.every.call(optionList.children, function(option) {
      var box = option.firstChild;
      return box && box.checked;
    });
  }
  function setAllOptions(optionList, checked) {
    if (!optionList) return;
    Array.prototype.forEach.call(optionList.children, function(option) {
      var box = option.firstChild;
      if (box) box.checked = checked;
    });
  }
  function selectedColumnIds() { return checkedValues(columnOptionList); }
  function selectedSetIds() { return checkedValues(setOptionList); }
  /* 只保留出现在所选词集中的词条；未选任何词集时结果为空。 */
  function filterRowsBySets(rows, setIds) {
    if (!setIds || !setIds.length) return [];
    return rows.filter(function(row) {
      return (row.setIds || []).some(function(id) { return setIds.indexOf(id) >= 0; });
    });
  }
  function getSetFilters() {
    if (!WordTales.Data || !WordTales.Data.sets) return [];
    return WordTales.Data.sets.map(function(set) { return { id: set.id, label: set.label }; });
  }

  /*
   * 把选中列与行数据打包成 ExportPdf 可用的输入：保留 width/min/flex
   * 排版参数，并把 starredAt 格式化为本地时间。供运行期与测试共用
   * 一份逻辑，避免行为漂移。
   */
  function buildExportDocument(rows, columnIds, options) {
    options = options || {};
    var columns = EXPORT_COLUMNS.filter(function(column) {
      return columnIds.indexOf(column.id) >= 0;
    });
    if (!columns.length || !rows.length) {
      return { bytes: new Uint8Array(0), pageCount: 0, filename: '' };
    }
    var tableRows = rows.map(function(row) {
      var object = {};
      columns.forEach(function(column) {
        var value = column.id === 'starredAt' ? formatStarredAt(row.starredAt) : row[column.id];
        object[column.id] = value == null ? '' : String(value);
      });
      return object;
    });
    var today = options.date instanceof Date ? options.date : new Date();
    var labelDate = dayKey(today);
    var document = WordTales.ExportPdf.buildDocument({
      title: '星标单词',
      subtitle: '导出日期 ' + labelDate + ' · 共 ' + rows.length + ' 词',
      columns: columns.map(function(column) {
        return {
          id: column.id,
          label: column.label,
          width: column.width,
          min: column.min,
          flex: !!column.flex
        };
      }),
      rows: tableRows
    });
    return {
      bytes: document.bytes,
      pageCount: document.pageCount,
      filename: '星标单词-' + labelDate + '.pdf'
    };
  }

  function setExporting(pending) {
    if (!exportMenu) return;
    var confirm = exportMenu.querySelector('.starred-export-confirm');
    if (!confirm) return;
    confirm.disabled = !!pending;
    if (pending) {
      confirm.dataset.previousText = confirm.textContent;
      confirm.textContent = '生成中…';
    } else if (confirm.dataset.previousText) {
      confirm.textContent = confirm.dataset.previousText;
      delete confirm.dataset.previousText;
    }
  }

  function announce(message, error) {
    if (!exportStatus) return;
    exportStatus.textContent = message || '';
    exportStatus.classList.toggle('is-error', !!error);
  }

  function runExport() {
    var columnIds = selectedColumnIds();
    var setIds = selectedSetIds();
    if (!columnIds.length) {
      announce('请至少选择一列再导出', true);
      return;
    }
    var rows = filterRowsBySets(collectRows(), setIds);
    if (!rows.length) {
      announce('所选词集下暂无星标单词', true);
      return;
    }
    setExporting(true);
    announce('正在生成 PDF…');
    WordTales.ExportPdf.loadFonts().then(function() {
      var document = buildExportDocument(rows, columnIds);
      if (!document.bytes.length) throw new Error('PDF 生成失败');
      WordTales.ExportPdf.download(document.bytes, document.filename);
      announce('已导出 ' + document.filename);
      closeExportMenu();
    }).catch(function(err) {
      var message = err && err.message ? err.message : 'PDF 生成失败';
      announce(message, true);
    }).then(function() {
      setExporting(false);
    });
  }
  function buildCheckboxOption(list, value, label, checked) {
    var option = appendElement(list, 'label', 'starred-export-option');
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = value;
    checkbox.checked = checked;
    option.appendChild(checkbox);
    appendElement(option, 'span', '', label);
    return checkbox;
  }
  function buildExportMenu() {
    exportMenu = appendElement(panel, 'div', 'starred-export-menu');
    exportMenu.hidden = true;
    exportMenu.setAttribute('role', 'group');
    exportMenu.setAttribute('aria-label', '导出星标单词');

    var body = appendElement(exportMenu, 'div', 'starred-export-body');

    appendElement(body, 'p', 'starred-export-title', '筛选词集');
    setOptionList = appendElement(body, 'div', 'starred-export-options starred-set-options');
    getSetFilters().forEach(function(set) {
      buildCheckboxOption(setOptionList, set.id, set.label, true);
    });

    appendElement(body, 'p', 'starred-export-title starred-export-title-sub', '选择导出列');
    columnOptionList = appendElement(body, 'div', 'starred-export-options starred-column-options');
    EXPORT_COLUMNS.forEach(function(column) {
      buildCheckboxOption(columnOptionList, column.id, column.label, DEFAULT_COLUMN_IDS.indexOf(column.id) >= 0);
    });

    exportStatus = appendElement(body, 'p', 'starred-export-status', '');
    exportStatus.setAttribute('role', 'status');
    exportStatus.setAttribute('aria-live', 'polite');

    var actions = appendElement(exportMenu, 'div', 'starred-export-actions');
    var setToggle = createButton('starred-export-toggle', '清空', '全选或清空词集');
    setToggle.addEventListener('click', function() {
      var turnOn = !allOptionsChecked(setOptionList);
      setAllOptions(setOptionList, turnOn);
      setToggle.textContent = turnOn ? '清空' : '全选';
    });
    var columnToggle = createButton('starred-export-toggle', '全选', '全选或清空导出列');
    columnToggle.addEventListener('click', function() {
      var turnOn = !allOptionsChecked(columnOptionList);
      setAllOptions(columnOptionList, turnOn);
      columnToggle.textContent = turnOn ? '清空' : '全选';
    });
    var confirm = createButton('starred-export-confirm', '导出 PDF', '按所选词集与列生成 PDF 文件');
    confirm.addEventListener('click', runExport);
    actions.appendChild(setToggle);
    actions.appendChild(columnToggle);
    actions.appendChild(confirm);
  }
  function toggleExportMenu() {
    if (!exportMenu) return;
    if (exportMenu.hidden) {
      var rows = collectRows();
      if (!rows.length) return;
      exportMenu.hidden = false;
      exportButton.setAttribute('aria-expanded', 'true');
      var first = exportMenu.querySelector('input[type="checkbox"]');
      if (first) first.focus();
    } else {
      closeExportMenu();
    }
  }

  function renderList() {
    var rows = collectRows();
    panel.innerHTML = '';
    exportMenu = null;
    exportStatus = null;

    var header = appendElement(panel, 'div', 'record-panel-head');
    var heading = appendElement(header, 'div', 'record-heading');
    appendElement(heading, 'p', 'record-eyebrow', 'Starred words');
    var title = appendElement(heading, 'h2', '', '星标单词');
    title.id = 'starredWordsTitle';
    appendElement(heading, 'p', 'record-intro',
      rows.length ? '共 ' + rows.length + ' 个星标单词，按正文出现顺序排列。' : '还没有星标单词，在词卡或游戏中点五角星即可标记。');
    var actions = appendElement(header, 'div', 'starred-head-actions');
    exportButton = createButton('starred-export-button', '导出', '选择列并导出星标单词为 PDF');
    exportButton.disabled = !rows.length;
    exportButton.setAttribute('aria-haspopup', 'true');
    exportButton.setAttribute('aria-expanded', 'false');
    exportButton.addEventListener('click', toggleExportMenu);
    actions.appendChild(exportButton);
    var closeButton = createButton('record-close', '×', '关闭星标单词');
    closeButton.addEventListener('click', close);
    actions.appendChild(closeButton);

    buildExportMenu();
    if (!rows.length) {
      var empty = appendElement(panel, 'div', 'starred-empty');
      appendElement(empty, 'span', 'starred-empty-star', '☆');
      appendElement(empty, 'p', '', '星标单词会显示在这里，之后可以按列导出为 PDF 文件。');
      return;
    }

    var scroller = appendElement(panel, 'div', 'record-table-scroll starred-scroll');
    scroller.setAttribute('tabindex', '0');
    scroller.setAttribute('aria-label', '星标单词列表');
    var table = appendElement(scroller, 'table', 'starred-table');
    var caption = appendElement(table, 'caption', 'visually-hidden', '全部星标单词，共 ' + rows.length + ' 个');
    var thead = appendElement(table, 'thead');
    var headingRow = appendElement(thead, 'tr');
    ['单词', '音标', '词性', '释义', '词集·栏目', '标记时间'].forEach(function(label, index) {
      var th = appendElement(headingRow, 'th', index === 0 ? 'starred-col-word' : '', label);
      th.scope = 'col';
    });
    var tbody = appendElement(table, 'tbody');
    rows.forEach(function(row) {
      var tr = appendElement(tbody, 'tr');
      var wordCell = appendElement(tr, 'th', 'starred-col-word');
      wordCell.scope = 'row';
      appendElement(wordCell, 'span', 'starred-star', '★');
      appendElement(wordCell, 'span', 'starred-word-text', row.word);
      appendElement(tr, 'td', 'starred-col-phonetic', row.phonetic);
      appendElement(tr, 'td', 'starred-col-pos', row.pos);
      appendElement(tr, 'td', 'starred-col-meaning', row.meaning);
      appendElement(tr, 'td', 'starred-col-source', row.source);
      appendElement(tr, 'td', 'starred-col-time', formatStarredAt(row.starredAt));
    });
  }

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'record-overlay starred-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'starredWordsTitle');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('tabindex', '-1');
    panel = document.createElement('div');
    panel.className = 'record-panel starred-panel';
    overlay.appendChild(panel);
    overlay.addEventListener('click', function(event) {
      if (event.target === overlay) { close(); return; }
      /* 点击菜单以外的区域时收起导出菜单。 */
      if (exportMenu && !exportMenu.hidden &&
          !exportMenu.contains(event.target) && event.target !== exportButton) closeExportMenu();
    });
    overlay.addEventListener('keydown', handleKeydown);
    document.body.appendChild(overlay);
  }
  function open() {
    if (!WordTales.LearningProgress || !WordTales.LearningProgress.isReady()) return;
    if (overlay && overlay.classList.contains('active')) return;
    if (!overlay) build();
    previousFocus = document.activeElement;
    previousBodyOverflow = document.body.style.overflow;
    renderList();
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    setBackgroundInert(true);
    document.body.style.overflow = 'hidden';
    setTimeout(function() {
      if (!overlay || !overlay.classList.contains('active')) return;
      var closeButton = overlay.querySelector('.record-close');
      (closeButton || overlay).focus();
    }, 0);
  }
  function close() {
    if (!overlay || !overlay.classList.contains('active')) return;
    closeExportMenu();
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    setBackgroundInert(false);
    document.body.style.overflow = previousBodyOverflow;
    var target = previousFocus;
    previousFocus = null;
    if (target && target.isConnected && typeof target.focus === 'function') target.focus();
  }
  function init() {
    if (initialized) return;
    var entry = document.getElementById('starredEntry');
    if (!entry || !WordTales.LearningProgress || !WordTales.LearningProgress.isReady()) return;
    initialized = true;
    entry.addEventListener('click', open);
    entry.disabled = false;
    entry.removeAttribute('aria-busy');
  }

  return {
    init: init,
    open: open,
    close: close,
    collectRows: collectRows,
    buildExportDocument: buildExportDocument,
    filterRowsBySets: filterRowsBySets,
    getSetFilters: getSetFilters,
    getExportColumns: function() {
      return EXPORT_COLUMNS.map(function(column) {
        return { id: column.id, label: column.label };
      });
    },
    getDefaultColumnIds: function() { return DEFAULT_COLUMN_IDS.slice(); }
  };
})();
