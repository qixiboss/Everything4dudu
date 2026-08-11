/* 更新记录：本地优先的版本时间线。数据经 HubAppSync（shared/hub-sync.js）
 * 按账户同步；远端合并可能在任何一次页面加载时发生（实时订阅或激活拉取），
 * 因此应用在每次 DOM 就绪时都重新读取本地存储并重渲染。 */
(function () {
  'use strict';

  var STORAGE_KEY = 'dudu.changelog.v1';
  var lastFocus = null;
  var currentEdit = '';

  /* 门户自身的发布历史。条目会在每次页面加载时与云端合并（云端较新则覆盖），
   * 修改种子项后部署，已同步过新版本的账户不会被旧种子覆盖。 */
  var SEED = [
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

  function read() {
    try {
      var value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function write(value) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }

  /* 先种子后本地：本地条目（含已保存的编辑）与种子项同版本时以本地为准；
   * 种子之外的条目（用户自行添加的版本）也要保留。 */
  function loadEntries() {
    var local = read();
    var seedVersions = {};
    SEED.forEach(function (entry) { seedVersions[entry.version] = true; });
    var map = {};
    local.forEach(function (entry) { map[entry.version] = entry; });
    return SEED.map(function (entry) { return map[entry.version] || entry; })
      .concat(local.filter(function (entry) { return !seedVersions[entry.version]; }));
  }

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
    var empty = document.querySelector('[data-empty]');
    if (!container) return;
    var entries = loadEntries().slice().sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return a.version < b.version ? 1 : -1;
    });
    if (entries.length) {
      container.innerHTML = entries.map(function (entry) {
        return '<article class="entry-card">' +
          '<header class="entry-head"><span class="entry-version">' + escapeHtml(entry.version) + '</span>' +
          '<time class="entry-date" datetime="' + escapeHtml(entry.date) + '">' + escapeHtml(entry.date) + '</time></header>' +
          (entry.title ? '<p class="entry-title">' + escapeHtml(entry.title) + '</p>' : '') +
          '<div class="entry-desc">' + renderDescription(entry.description) + '</div>' +
          '</article>';
      }).join('');
      container.hidden = false;
    } else {
      container.innerHTML = '';
      container.hidden = true;
    }
    if (empty) empty.hidden = entries.length !== 0;
  }

  function setStatus(message, state) {
    var status = document.querySelector('[data-entry-status]');
    if (!status) return;
    status.textContent = message || '';
    status.dataset.state = state || '';
  }

  function today() {
    var parts = new Date();
    return parts.getFullYear() + '-' + String(parts.getMonth() + 1).padStart(2, '0') + '-' + String(parts.getDate()).padStart(2, '0');
  }

  function parse(description) {
    var groups = [];
    var current = null;
    String(description || '').split(/\r?\n/).forEach(function (line) {
      var text = line.trim();
      if (!text) return;
      var match = text.match(/^#{1,6}\s+(.+)$/);
      if (match) {
        current = { heading: match[1].trim(), items: [] };
        groups.push(current);
      } else if (current) {
        current.items.push(/^[-*]\s+/.test(text) ? text.slice(2).trim() : text);
      } else {
        current = { heading: '', items: [/^[-*]\s+/.test(text) ? text.slice(2).trim() : text] };
        groups.push(current);
      }
    });
    return groups.map(function (group) {
      return (group.heading ? '## ' + group.heading + '\n' : '') +
        group.items.map(function (item) { return '- ' + item; }).join('\n');
    }).join('\n');
  }

  function openSheet() {
    var layer = document.querySelector('[data-sheet]');
    if (!layer || !layer.hidden) return;
    lastFocus = document.activeElement;
    var version = document.querySelector('[data-entry-version]');
    var date = document.querySelector('[data-entry-date]');
    var title = document.querySelector('[data-entry-title]');
    var description = document.querySelector('[data-entry-desc]');
    var existing = loadEntries().find(function (entry) { return entry.version === currentEdit; });
    version.value = existing ? existing.version : '';
    date.value = existing ? existing.date : today();
    title.value = existing ? (existing.title || '') : '';
    description.value = existing ? (existing.description || '') : '';
    document.querySelector('[data-sheet-title]').textContent = existing ? '编辑 ' + existing.version : '添加更新记录';
    document.querySelector('[data-sheet-kicker]').textContent = existing ? 'EDIT ENTRY' : 'NEW ENTRY';
    setStatus('', '');
    layer.hidden = false;
    document.body.style.overflow = 'hidden';
    window.setTimeout(function () {
      var target = version.value ? description : version;
      target.focus();
    }, 0);
  }

  function closeSheet() {
    var layer = document.querySelector('[data-sheet]');
    if (!layer) return;
    currentEdit = '';
    layer.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') closeSheet();
    if (event.key !== 'Tab') return;
    var layer = document.querySelector('[data-sheet]');
    if (!layer || layer.hidden) return;
    var focusable = Array.prototype.slice.call(layer.querySelectorAll('button:not([disabled]):not([hidden]), input:not([disabled]):not([hidden]), textarea:not([disabled]):not([hidden])'))
      .filter(function (node) { return node.offsetParent !== null; });
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function saveEntry(event) {
    if (event) event.preventDefault();
    var version = document.querySelector('[data-entry-version]').value.trim();
    var date = document.querySelector('[data-entry-date]').value.trim();
    var title = document.querySelector('[data-entry-title]').value.trim();
    var description = document.querySelector('[data-entry-desc]').value.trim();
    var status = document.querySelector('[data-entry-status]');
    if (!version) { setStatus('请填写版本号。', 'error'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { setStatus('请选择日期。', 'error'); return; }
    if (!/^[\w\-.]*$/.test(version)) { setStatus('版本号格式不正确。', 'error'); return; }

    var entries = loadEntries();
    var index = entries.findIndex(function (entry) { return entry.version === version; });
    var entry = { version: version, date: date, title: title, description: parse(description) };
    if (index >= 0) entries[index] = entry;
    else entries.push(entry);
    write(entries);

    var button = document.querySelector('[data-entry-submit]');
    if (button) button.disabled = true;
    setStatus('已保存，正在同步…', 'success');
    var sync = window.HubSync && window.HubSync.flush ? window.HubSync.flush('changelog') : Promise.resolve();
    sync.then(function () {
      if (status) status.textContent = '';
      if (button) button.disabled = false;
      closeSheet();
      renderTimeline();
    });
  }

  function insertGroup(heading) {
    var textarea = document.querySelector('[data-entry-desc]');
    if (!textarea) return;
    var start = textarea.selectionStart;
    var end = textarea.selectionEnd;
    var value = textarea.value;
    var block = '\n## ' + heading + '\n- ';
    if (start > 0 && value.charAt(start - 1) !== '\n') block = '\n' + block;
    var next = value.slice(0, start) + block + value.slice(end);
    textarea.value = next;
    textarea.focus();
    var cursor = start + block.length;
    textarea.setSelectionRange(cursor, cursor);
    setStatus('', '');
  }

  function bind() {
    document.querySelector('[data-entry-open]').addEventListener('click', openSheet);
    Array.prototype.forEach.call(document.querySelectorAll('[data-sheet-close]'), function (button) {
      button.addEventListener('click', closeSheet);
    });
    document.querySelector('[data-entry-form]').addEventListener('submit', saveEntry);
    document.querySelector('[data-entry-version]').addEventListener('input', function (event) {
      currentEdit = event.target.value.trim();
    });
    document.querySelector('[data-entry-desc]').addEventListener('input', function () { setStatus('', ''); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-quick]'), function (button) {
      button.addEventListener('click', function () { insertGroup(button.dataset.quick || ''); });
    });
    document.addEventListener('keydown', handleKeydown);
  }

  function items() {
    return loadEntries().map(function (entry) {
      return { item_key: 'entry:' + entry.version, payload: entry };
    });
  }

  /* 远端合并：按版本号合并。同版本以 updated_at 较新的一方为准由 sync-store
   * 保证；这里只做本地缓存落盘。远端数据到达后重新渲染。 */
  function applyRemote(rows) {
    var changed = false;
    var map = {};
    read().forEach(function (entry) { map[entry.version] = entry; });
    rows.forEach(function (row) {
      if (row.item_key.indexOf('entry:') !== 0) return;
      var version = row.item_key.slice(6);
      if (row.deleted_at) {
        if (map[version]) { delete map[version]; changed = true; }
      } else if (row.payload && typeof row.payload === 'object') {
        map[version] = row.payload;
        changed = true;
      }
    });
    if (!changed) return;
    write(Object.keys(map).map(function (version) { return map[version]; }));
    renderTimeline();
  }

  function resetLocal() {
    localStorage.removeItem(STORAGE_KEY);
    if (window.location && typeof window.location.reload === 'function') {
      window.setTimeout(function () { window.location.reload(); }, 0);
    }
  }

  function startSync() {
    /* 同步适配器（hub-sync.js）未加载时，应用仍应正常渲染本地数据。 */
    if (!window.HubAppSync) return;
    window.HubAppSync.start({
      app: 'changelog',
      items: items,
      applyRemote: applyRemote,
      resetLocal: resetLocal
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      renderTimeline();
      bind();
      startSync();
    });
  } else {
    renderTimeline();
    bind();
    startSync();
  }

  /* 同步适配器（hub-sync.js）在远端数据合并后调用，重渲染时间线。 */
  window.Changelog = { render: renderTimeline };
})();
