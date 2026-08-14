/* Per-item, authenticated, local-first Supabase synchronisation. Each app
 * syncs into its own table (words_sync_items / training_sync_items /
 * exam_sync_items / costtrace_sync_items), so rows are scoped per app. */
(function () {
  'use strict';
  var TABLES = {
    words: 'words_sync_items',
    training: 'training_sync_items',
    'exam-schedule': 'exam_sync_items',
    'cost-trace': 'costtrace_sync_items'
  };
  function tableFor(app) { return TABLES[app] || 'sync_items'; }
  var VERSIONS_KEY = 'hub.sync.versions.v2';
  var OUTBOX_KEY = 'hub.sync.outbox.v2';
  var registrations = {};
  var versions = readJson(VERSIONS_KEY, {});
  var queues = readJson(OUTBOX_KEY, {});

  function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { return fallback; } }
  function writeJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function saveVersions() { writeJson(VERSIONS_KEY, versions); }
  function saveQueues() { writeJson(OUTBOX_KEY, queues); }
  function versionKey(userId, app, key) { return userId + ':' + app + ':' + key; }
  function timestamp(value) { var n = new Date(value || 0).getTime(); return isFinite(n) ? n : 0; }
  function now() { return new Date().toISOString(); }
  function ownerKey(app) { return 'hub.sync.owner.' + app; }
  function sessionUserId() {
    var session = window.HubAuth && window.HubAuth.getSession();
    return session && session.user ? session.user.id : '';
  }
  function emit(app, state, message) {
    window.dispatchEvent(new CustomEvent('hub:sync-status', { detail: { app: app, state: state, message: message || '' } }));
  }
  function localItems(registration) {
    var values = registration.getItems ? registration.getItems() : [];
    return Array.isArray(values) ? values : [];
  }
  function currentVersion(userId, app, itemKey) {
    return versions[versionKey(userId, app, itemKey)] || null;
  }
  function applyRows(registration, rows, userId) {
    var previous = registration.applyChain || Promise.resolve();
    var operation = previous.catch(function () {}).then(function () {
      var accepted = rows.filter(function (row) {
        var key = versionKey(userId, registration.app, row.item_key);
        var current = versions[key];
        return !current || timestamp(current.updated_at) < timestamp(row.updated_at);
      });
      if (!accepted.length) return false;
      return Promise.resolve().then(function () {
        return registration.applyRemote ? registration.applyRemote(accepted) : undefined;
      }).then(function () {
        accepted.forEach(function (row) {
          versions[versionKey(userId, registration.app, row.item_key)] = { updated_at: row.updated_at, deleted_at: row.deleted_at || null };
        });
        saveVersions();
        return true;
      });
    });
    registration.applyChain = operation;
    return operation;
  }
  function scheduleFlush(registration, delay) {
    window.clearTimeout(registration.timer);
    registration.timer = window.setTimeout(function () { flush(registration.app); }, delay || 700);
  }
  function queueRow(app, row) {
    var registration = registrations[app];
    if (!registration) return;
    queues[app] = queues[app] || {};
    queues[app][row.user_id + ':' + row.item_key] = row;
    saveQueues();
    scheduleFlush(registration, 700);
  }
  function queueLocal(app, itemKey, payload, deleted) {
    var registration = registrations[app];
    if (!registration) return false;
    var userId = sessionUserId() || registration.activeUserId;
    if (!userId) {
      emit(app, 'waiting', '请登录后同步');
      return false;
    }
    var updatedAt = now();
    var row = {
      user_id: userId,
      item_key: itemKey,
      payload: deleted ? {} : (payload || {}),
      updated_at: updatedAt,
      deleted_at: deleted ? updatedAt : null
    };
    versions[versionKey(userId, app, itemKey)] = { updated_at: updatedAt, deleted_at: row.deleted_at };
    saveVersions();
    queueRow(app, row);
    return true;
  }
  function removeDelivered(app, delivered) {
    var appQueue = queues[app] || {};
    delivered.forEach(function (row) {
      var key = row.user_id + ':' + row.item_key;
      var current = appQueue[key];
      if (current && current.updated_at === row.updated_at) delete appQueue[key];
    });
    if (!Object.keys(appQueue).length) delete queues[app];
    saveQueues();
  }
  function flush(app) {
    var registration = registrations[app];
    var userId = sessionUserId();
    var client = window.HubAuth && window.HubAuth.getClient();
    if (!registration || !userId || !client) {
      if (registration && queues[app] && Object.keys(queues[app]).length) emit(app, 'waiting', '等待登录后同步');
      return Promise.resolve(false);
    }
    var rows = Object.keys(queues[app] || {}).map(function (key) { return queues[app][key]; })
      .filter(function (row) { return row.user_id === userId; });
    if (!rows.length) return Promise.resolve(true);
    emit(app, 'syncing', '正在同步');
    var payload = rows.map(function (row) {
      return {
        user_id: row.user_id,
        item_key: row.item_key,
        payload: row.payload,
        updated_at: row.updated_at,
        deleted_at: row.deleted_at
      };
    });
    var request = client.from(tableFor(registration.app)).upsert(payload, { onConflict: 'user_id,item_key' });
    if (request && typeof request.select === 'function') request = request.select('item_key,payload,updated_at,deleted_at');
    return Promise.resolve(request).then(function (result) {
      if (result && result.error) throw result.error;
      removeDelivered(app, rows);
      if (result && Array.isArray(result.data)) applyRows(registration, result.data, userId);
      writeJson(ownerKey(app), userId);
      emit(app, 'synced', '已同步');
      return true;
    }).catch(function (error) {
      emit(app, 'error', '同步失败，本地数据已保留');
      console.warn('Hub sync failed:', error.message);
      /* 失败后不重新调度：下一次扫描（各适配器的轮询）自然会再次触发
       * put/flush，避免网络断开时 catch → scheduleFlush → 再失败 → 再调度的
       * 无限循环。 */
      return false;
    });
  }
  function enqueueInitial(registration, items, userId) {
    registration.activeUserId = userId;
    items.forEach(function (item) { queueLocal(registration.app, item.item_key, item.payload, false); });
  }
  function backupLocal(registration, owner) {
    var items = localItems(registration);
    if (items.length) writeJson('hub.sync.backup.' + registration.app + '.' + (owner || 'unowned') + '.' + Date.now(), items);
  }
  function resetLocal(registration) {
    if (registration.resetLocal) return registration.resetLocal();
    return undefined;
  }
  function subscribe(registration, userId) {
    var client = window.HubAuth.getClient();
    if (registration.channel) client.removeChannel(registration.channel);
    registration.channel = client.channel('hub-sync-' + registration.app + '-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableFor(registration.app), filter: 'user_id=eq.' + userId }, function (event) {
        if (event.new) applyRows(registration, [event.new], userId);
      }).subscribe();
  }
  function deactivate(registration) {
    var client = window.HubAuth && window.HubAuth.getClient();
    registration.activationId += 1;
    registration.activeUserId = '';
    if (registration.channel && client) client.removeChannel(registration.channel);
    registration.channel = null;
    emit(registration.app, 'locked', '登录后才能同步');
  }
  function activate(registration) {
    var session = window.HubAuth && window.HubAuth.getSession();
    var client = window.HubAuth && window.HubAuth.getClient();
    if (!session || !session.user || !client) { deactivate(registration); return Promise.resolve(false); }
    var userId = session.user.id;
    if (registration.activationPromise && registration.activeUserId === userId) return registration.activationPromise;
    var activationId = ++registration.activationId;
    registration.activeUserId = userId;
    emit(registration.app, 'syncing', '正在读取云端数据');
    registration.activationPromise = client.from(tableFor(registration.app)).select('item_key,payload,updated_at,deleted_at').then(function (result) {
      if (result.error) throw result.error;
      if (activationId !== registration.activationId || sessionUserId() !== userId) return false;
      var remote = result.data || [];
      var local = localItems(registration);
      var owner = readJson(ownerKey(registration.app), '');

      var applied = Promise.resolve();
      if (owner && owner !== userId) {
        backupLocal(registration, owner);
        applied = Promise.resolve(resetLocal(registration));
        local = [];
        if (remote.length) applied = applied.then(function () { return applyRows(registration, remote, userId); });
      } else if (!owner && remote.length && local.length) {
        backupLocal(registration, 'unowned');
        var useLocal = window.confirm('检测到此设备的旧数据和云端数据。点击“确定”导入本机数据并合并；点击“取消”使用云端数据。');
        if (useLocal) {
          applied = applyRows(registration, remote, userId).then(function () { enqueueInitial(registration, local, userId); });
        } else {
          applied = Promise.resolve(resetLocal(registration)).then(function () { return applyRows(registration, remote, userId); });
        }
      } else if (remote.length) {
        applied = applyRows(registration, remote, userId).then(function () {
          local.forEach(function (item) {
            var remoteRow = remote.find(function (row) { return row.item_key === item.item_key; });
            var localVersion = currentVersion(userId, registration.app, item.item_key);
            if (!remoteRow || (localVersion && timestamp(localVersion.updated_at) > timestamp(remoteRow.updated_at))) {
              queueLocal(registration.app, item.item_key, item.payload, false);
            }
          });
        });
      } else {
        enqueueInitial(registration, local, userId);
      }
      return applied.then(function () {
        if (activationId !== registration.activationId || sessionUserId() !== userId) return false;
        writeJson(ownerKey(registration.app), userId);
        subscribe(registration, userId);
        emit(registration.app, 'synced', '已同步');
        return flush(registration.app).then(function () { return true; });
      });
    }).catch(function (error) {
      if (activationId === registration.activationId) {
        emit(registration.app, 'error', '无法连接云端，本地数据已保留');
        console.warn('Hub sync initialisation failed:', error.message);
      }
      return false;
    }).finally(function () {
      if (activationId === registration.activationId) registration.activationPromise = null;
    });
    return registration.activationPromise;
  }
  function register(app, options) {
    if (registrations[app]) return registrations[app].api;
    var registration = Object.assign({ app: app, timer: null, channel: null, activeUserId: '', activationId: 0, activationPromise: null, applyChain: Promise.resolve() }, options || {});
    registration.api = {
      put: function (key, payload) { return queueLocal(app, key, payload, false); },
      remove: function (key) { return queueLocal(app, key, {}, true); },
      flush: function () { return flush(app); },
      /* Resolves once initial activation (fetch remote, reconcile local)
       * settles, so callers can run their first scan after remote state
       * has been applied. */
      ready: function () {
        return Promise.resolve(registration.initPromise).then(function () {
          return registration.activationPromise || true;
        });
      }
    };
    registrations[app] = registration;
    registration.initPromise = window.HubAuth.init().then(function (session) {
      if (!session) deactivate(registration);
      else if (registration.activeUserId !== session.user.id) activate(registration);
    });
    window.HubAuth.onChange(function (session) {
      if (!session) deactivate(registration);
      else if (registration.activeUserId === session.user.id && registration.channel) flush(app);
      else activate(registration);
    });
    return registration.api;
  }
  window.HubSync = { register: register, flush: flush };
})();
