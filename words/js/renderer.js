/* ============================================================
 * Module: Renderer
 * 将 Data 模块转换成页面 DOM；功能模块不再负责拼装内容数据。
 * Renderer 只负责“数据 → 初始 DOM”，翻卡、朗读等增强行为统一在渲染后初始化。
 * ============================================================ */
WordTales.Renderer = (function() {
  // 内容数据也按不可信输入转义；仅 Analysis 模块另有一条极小的标签白名单。
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderSegments(segments) {
    return segments.map(function(segment) {
      if (typeof segment === 'string') return escapeHtml(segment);
      // data-vocab-id 比按文本查词可靠，同一个英文词可以在不同专栏拥有不同释义。
      return '<strong class="word" data-vocab-id="' + escapeHtml(segment.vocabId) + '">' + escapeHtml(segment.text) + '</strong>';
    }).join('');
  }

  function renderColumn(column) {
    var words = column.words.map(function(word) {
      return '<div class="vocab-card" data-vocab-id="' + escapeHtml(word.id) + '">' +
        '<span class="vw">' + escapeHtml(word.word) + '</span>' +
        '<span class="vp">' + escapeHtml(word.pos) + '</span>' +
        '<span class="vm">' + escapeHtml(word.meaning) + '</span>' +
        '<button type="button" class="vocab-card-star" aria-pressed="false" aria-label="标记为不太认识" title="标记为不太认识">★</button>' +
        '</div>';
    }).join('');
    var paragraphs = column.paragraphs.map(function(paragraph) {
      return '<p data-paragraph-id="' + escapeHtml(paragraph.id) + '">' + renderSegments(paragraph.segments) + '</p>';
    }).join('');
    return '<section id="' + escapeHtml(column.id) + '" class="column-section">' +
      '<div class="section-head">' +
      '<span class="col-num">' + ('0' + String(column.number)).slice(-2) + '</span>' +
      '<h2>' + escapeHtml(column.title) + '</h2>' +
      '<p class="theme">' + escapeHtml(column.theme.zh) + ' · ' + escapeHtml(column.theme.en) + '</p>' +
      '<span class="word-count">' + column.words.length + ' 词</span>' +
      '</div><div class="vocab-grid">' + words + '</div>' +
      '<div class="essay-block"><h3>短文阅读 · Essay</h3>' + paragraphs + '</div>' +
      '</section>';
  }

  function render() {
    var switcher = document.getElementById('setSwitcher');
    var main = document.getElementById('appContent');
    switcher.innerHTML = WordTales.Data.sets.map(function(set, index) {
      return '<button type="button" class="set-btn' + (index === 0 ? ' active' : '') + '" data-set="' + escapeHtml(set.id) + '" aria-pressed="' + (index === 0 ? 'true' : 'false') + '" aria-controls="' + escapeHtml(set.id) + '">' +
        escapeHtml(set.label) + ' · ' + set.columns.length + '列' + WordTales.Data.countWords(set) + '词</button>';
    }).join('') +
      '<button type="button" class="set-btn" data-set="changelog" aria-pressed="false" aria-controls="changelog">第八份 · 更新日志</button>';
    main.innerHTML = WordTales.Data.sets.map(function(set, index) {
      return '<div id="' + escapeHtml(set.id) + '" class="set-content' + (index === 0 ? ' active' : '') + '">' +
        set.columns.map(renderColumn).join('') + '</div>';
    }).join('');
    /*
     * 更新日志保存在 template 中，避免首屏直接展示；渲染时克隆为普通 set-content，
     * 这样 Navigation 可以把它当作第八个页签统一管理。
     */
    var tpl = document.getElementById('changelog-tpl');
    if (tpl && tpl.content) {
      var clone = document.importNode(tpl.content, true);
      var wrapper = document.createElement('div');
      wrapper.id = 'changelog';
      wrapper.className = 'set-content';
      wrapper.setAttribute('aria-hidden', 'true');
      wrapper.inert = true;
      wrapper.appendChild(clone);
      main.appendChild(wrapper);
    }
  }

  return { render: render };
})();
