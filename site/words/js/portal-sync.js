/* WordTales integration with the portal-wide auth and per-item sync runtime. */
WordTales.PortalSync = (function () {
  'use strict';

  var timer = null;
  var initialized = false;
  var started = false;
  var status = 'local';
  var authMount = null;
  var WORD_PREFIX = 'word:';
  var COLUMN_PREFIX = 'column:';

  function session() {
    return window.HubAuth && window.HubAuth.getSession ? window.HubAuth.getSession() : null;
  }

  function user() {
    var current = session();
    return current && current.user ? current.user : null;
  }

  function configured() {
    return !!(window.HubAuth && window.HubAuth.isConfigured && window.HubAuth.isConfigured());
  }

  function emailLabel(email) {
    return email ? email.replace(/^(.{2}).*(@.*)$/, '$1…$2') : '';
  }

  function renderStatus(message, error) {
    authMount = authMount || document.getElementById('authMount');
    if (!authMount) return;
    var element = authMount.querySelector('.auth-status');
    if (!element) {
      authMount.innerHTML = '';
      element = document.createElement('p');
      element.className = 'auth-status';
      element.setAttribute('role', 'status');
      authMount.appendChild(element);
    }
    if (message) element.textContent = message;
    else if (user()) element.textContent = '门户账号已同步：' + emailLabel(user().email);
    else element.textContent = configured() ? '请使用页面顶部邮箱登录以同步进度' : '本地进度模式';
    element.classList.toggle('error', !!error);
  }

  function updateStatus(next, message, error) {
    status = next;
    renderStatus(message, error);
  }

  function progress() { return WordTales.LearningProgress; }
  function ready() { return progress() && progress().isReady(); }

  function itemsFor(profile) {
    var items = [];
    Object.keys(profile.words || {}).forEach(function (id) {
      if (profile.words[id] && profile.words[id].isStarred) {
        items.push({ item_key: WORD_PREFIX + id, payload: profile.words[id] });
      }
    });
    Object.keys(profile.columnCompletions || {}).forEach(function (date) {
      Object.keys(profile.columnCompletions[date] || {}).forEach(function (column) {
        if (profile.columnCompletions[date][column] === true) {
          items.push({ item_key: COLUMN_PREFIX + date + ':' + column, payload: { completed: true } });
        }
      });
    });
    return items;
  }

  function applyRemote(rows) {
    if (!ready()) return Promise.resolve(false);
    var profile = JSON.parse(JSON.stringify(progress().getData()));
    rows.forEach(function (row) {
      var key = row.item_key;
      var value = row.payload || {};
      if (key.indexOf(WORD_PREFIX) === 0) {
        var id = key.slice(WORD_PREFIX.length);
        if (row.deleted_at) delete profile.words[id];
        else profile.words[id] = value;
      } else if (key.indexOf(COLUMN_PREFIX) === 0) {
        var parts = key.slice(COLUMN_PREFIX.length).split(':');
        var date = parts[0];
        var column = parts.slice(1).join(':');
        if (!profile.columnCompletions[date]) profile.columnCompletions[date] = {};
        if (row.deleted_at) delete profile.columnCompletions[date][column];
        else profile.columnCompletions[date][column] = true;
      }
    });
    profile.updatedAt = new Date().toISOString();
    return progress().replaceData(profile).then(function () {
      if (WordTales.Progress && WordTales.Progress.refresh) WordTales.Progress.refresh();
      return true;
    });
  }

  function resetLocal() {
    if (!ready()) return Promise.resolve(false);
    return progress().replaceData(null).then(function () {
      if (WordTales.Progress && WordTales.Progress.refresh) WordTales.Progress.refresh();
      return true;
    });
  }

  var adapter = {
    app: 'words',
    items: function () { return itemsFor(progress().getData()); },
    applyRemote: applyRemote,
    resetLocal: resetLocal
  };

  function start() {
    if (started) return true;
    if (!window.HubAppSync || !ready()) return false;
    updateStatus('syncing', '正在同步进度…');
    started = window.HubAppSync.start(adapter);
    if (started) updateStatus('synced', '进度已同步');
    return started;
  }

  function queue() {
    if (!started && !start()) return false;
    window.HubAppSync.queue(adapter);
    return true;
  }

  function schedule() {
    if (!initialized || !user() || !ready()) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      timer = null;
      queue();
    }, 1400);
  }

  function handleSession(nextSession) {
    if (!nextSession || !nextSession.user) {
      updateStatus('local', '本地进度模式');
      return;
    }
    renderStatus();
    if (ready()) queue();
  }

  function init() {
    if (initialized) return Promise.resolve(api);
    initialized = true;
    renderStatus();
    if (!window.HubAuth) return Promise.resolve(api);
    window.HubAuth.onChange(handleSession);
    window.addEventListener('hub:sync-status', function (event) {
      var detail = event.detail || {};
      if (detail.app !== 'words') return;
      updateStatus(detail.state || status, detail.message || '', detail.state === 'error');
    });
    return window.HubAuth.init().then(function () {
      handleSession(session());
      return api;
    }).catch(function () {
      updateStatus('local', '本地进度模式');
      return api;
    });
  }

  var api = {
    init: init,
    start: start,
    queue: queue,
    schedule: schedule,
    getStatus: function () { return status; }
  };
  return api;
})();
