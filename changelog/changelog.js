/* 更新记录：只读的版本时间线。条目由源码中的 SEED 维护，发布新版本时
 * 随提交更新并部署；页面不提供手动添加或编辑，也不按账户同步。 */
(function () {
  'use strict';

  /* 门户自身的发布历史，按新→旧排列。发布新版本时在顶部加一条。 */
  var SEED = [
    {
      version: 'v0.5.0',
      date: '2026-08-11',
      title: '主页与更新记录改版',
      description: [
        '## 新功能',
        '- 主页改为锁屏式布局，实时大时钟与问候语相伴',
        '- 登录入口移入底部，四个应用整齐排列',
        '## 改进',
        '- 更新记录改为只读版本历史，随发布自动更新'
      ].join('\n')
    },
    {
      version: 'v0.4.0',
      date: '2026-08-11',
      title: '更新记录应用上线',
      description: [
        '## 新功能',
        '- 新增更新记录应用，记录每一次版本变化',
        '- 更新记录随账户跨设备同步',
        '- 主页支持左右滑动查看更多应用'
      ].join('\n')
    },
    {
      version: 'v0.3.0',
      date: '2026-08-11',
      title: '考研日程上线',
      description: [
        '## 新功能',
        '- 新增考研日程应用，跟踪一轮复习进度'
      ].join('\n')
    },
    {
      version: 'v0.2.0',
      date: '2026-08-11',
      title: '训练记录与统一登录',
      description: [
        '## 新功能',
        '- 新增训练记录应用，记录每日训练',
        '- 门户接入统一账户，学习数据跨设备同步'
      ].join('\n')
    },
    {
      version: 'v0.1.0',
      date: '2026-08-11',
      title: 'Everything 4 Dudu 上线',
      description: [
        '## 新功能',
        '- 统一入口上线，收录词汇学习应用'
      ].join('\n')
    }
  ];

  function escapeHtml(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* 描述按「## 分组」拆块；没有分组的行归入默认块。 */
  function renderDescription(description) {
    var lines = String(description || '').split(/\r?\n/);
    var html = '';
    var group = '';
    var items = [];
    function flush() {
      if (!items.length) return;
      html += '<li>' + items.join('</li><li>') + '</li>';
      items = [];
    }
    lines.forEach(function (line) {
      var text = line.trim();
      if (!text) return;
      if (/^#{1,6}\s+/.test(text)) {
        flush();
        if (group) html += '</ul>';
        group = text.replace(/^#{1,6}\s+/, '');
        html += '<span class="group">' + escapeHtml(group) + '</span><ul>';
      } else {
        /* 去掉行首的「- 」标记，列表圆点由 <ul> 提供。 */
        items.push(escapeHtml(/^[-*]\s+/.test(text) ? text.slice(2).trim() : text));
      }
    });
    flush();
    if (group) html += '</ul>';
    return html;
  }

  function renderTimeline() {
    var container = document.querySelector('[data-timeline]');
    if (!container) return;
    var entries = SEED.slice().sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return a.version < b.version ? 1 : -1;
    });
    container.innerHTML = entries.map(function (entry, index) {
      return '<article class="entry-card">' +
        '<header class="entry-head"><span class="entry-version">' + escapeHtml(entry.version) +
        (index === 0 ? '<span class="latest-tag">最新</span>' : '') + '</span>' +
        '<time class="entry-date" datetime="' + escapeHtml(entry.date) + '">' + escapeHtml(entry.date) + '</time></header>' +
        (entry.title ? '<p class="entry-title">' + escapeHtml(entry.title) + '</p>' : '') +
        '<div class="entry-desc">' + renderDescription(entry.description) + '</div>' +
        '</article>';
    }).join('');
    container.hidden = entries.length === 0;
    var count = document.querySelector('[data-count]');
    if (count) count.textContent = '共 ' + entries.length + ' 个版本';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderTimeline);
  } else {
    renderTimeline();
  }
})();
