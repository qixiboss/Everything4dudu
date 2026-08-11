/* Per-item, local-first Supabase synchronisation for the three static apps. */
(function () {
  'use strict';
  var TABLE = 'sync_items';
  var registrations = {};
  var versions = readJson('hub.sync.versions.v1', {});
  var queues = {};

  function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { return fallback; } }
  function writeJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function versionKey(app, key) { return app + ':' + key; }
  function saveVersions() { writeJson('hub.sync.versions.v1', versions); }
  function timestamp(value) { var n = new Date(value || 0).getTime(); return isFinite(n) ? n : 0; }
  function emit(app, state, message) {
    window.dispatchEvent(new CustomEvent('hub:sync-status', { detail: { app: app, state: state, message: message || '' } }));
  }
  function ownerKey(app) { return 'hub.sync.owner.' + app; }
  function now() { return new Date().toISOString(); }
  function localItems(registration) {
    var values = registration.getItems ? registration.getItems() : [];
    return Array.isArray(values) ? values : [];
  }
  function applyRows(registration, rows) {
    var accepted = rows.filter(function (row) {
      var key = versionKey(registration.app, row.item_key);
      var current = versions[key];
      if (current && timestamp(current.updated_at) > timestamp(row.updated_at)) return false;
      versions[key] = { updated_at: row.updated_at, deleted_at: row.deleted_at || null };
      return true;
    });
    if (!accepted.length) return;
    saveVersions();
    if (registration.applyRemote) registration.applyRemote(accepted);
  }
  function queueRow(app, row) {
    queues[app] = queues[app] || {};
    queues[app][row.item_key] = row;
    window.clearTimeout(registrations[app].timer);
    registrations[app].timer = window.setTimeout(function () { flush(app); }, 700);
  }
  function put(app, itemKey, payload) {
    var registration = registrations[app];
    if (!registration) return;
    var updatedAt = now();
    var row = { item_key: itemKey, payload: payload || {}, updated_at: updatedAt, deleted_at: null };
    versions[versionKey(app, itemKey)] = { updated_at: updatedAt, deleted_at: null };
    saveVersions();
    queueRow(app, row);
  }
  function remove(app, itemKey) {
    var registration = registrations[app];
    if (!registration) return;
    var updatedAt = now();
    var row = { item_key: itemKey, payload: {}, updated_at: updatedAt, deleted_at: updatedAt };
    versions[versionKey(app, itemKey)] = { updated_at: updatedAt, deleted_at: updatedAt };
    saveVersions();
    queueRow(app, row);
  }
  function flush(app) {
    var registration = registrations[app];
    var session = window.HubAuth && window.HubAuth.getSession();
    var rows = queues[app] ? Object.keys(queues[app]).map(function (key) { return queues[app][key]; }) : [];
    queues[app] = {};
    if (!rows.length || !registration || !session || !window.HubAuth.getClient()) return;
    emit(app, 'syncing', '正在同步');
    var payload = rows.map(function (row) { return Object.assign({ user_id: session.user.id, app_id: app }, row); });
    window.HubAuth.getClient().from(TABLE).upsert(payload, { onConflict: 'user_id,app_id,item_key' }).then(function (result) {
      if (result.error) throw result.error;
      writeJson(ownerKey(app), session.user.id);
      emit(app, 'synced', '已同步');
    }).catch(function (error) {
      rows.forEach(function (row) { queueRow(app, row); });
      emit(app, 'error', '同步失败，本地数据已保留');
      console.warn('Hub sync failed:', error.message);
    });
  }
  function enqueueInitial(registration, items) {
    items.forEach(function (item) { put(registration.app, item.item_key, item.payload); });
  }
  function subscribe(registration, userId) {
    if (registration.channel) window.HubAuth.getClient().removeChannel(registration.channel);
    registration.channel = window.HubAuth.getClient().channel('hub-sync-' + registration.app + '-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE, filter: 'user_id=eq.' + userId }, function (event) {
        var row = event.new;
        if (row && row.app_id === registration.app) applyRows(registration, [row]);
      }).subscribe();
  }
  function activate(registration) {
    var session = window.HubAuth && window.HubAuth.getSession();
    if (!session || !window.HubAuth.getClient()) return;
    var userId = session.user.id;
    emit(registration.app, 'syncing', '正在读取云端数据');
    window.HubAuth.getClient().from(TABLE).select('item_key,payload,updated_at,deleted_at').eq('app_id', registration.app).then(function (result) {
      if (result.error) throw result.error;
      var remote = result.data || [];
      var local = localItems(registration);
      var owner = readJson(ownerKey(registration.app), '');
      if (owner && owner !== userId) {
        if (remote.length) applyRows(registration, remote);
        else if (registration.resetLocal) registration.resetLocal();
      } else if (!owner && remote.length && local.length) {
        writeJson('hub.sync.backup.' + registration.app + '.' + Date.now(), local);
        var useLocal = window.confirm('检测到此设备的旧数据和云端数据。点击“确定”导入本机数据并合并；点击“取消”使用云端数据。');
        if (useLocal) { applyRows(registration, remote); enqueueInitial(registration, local); }
        else applyRows(registration, remote);
      } else if (remote.length) {
        applyRows(registration, remote);
        var missing = local.filter(function (item) { return !remote.some(function (row) { return row.item_key === item.item_key; }); });
        enqueueInitial(registration, missing);
      } else {
        enqueueInitial(registration, local);
      }
      writeJson(ownerKey(registration.app), userId);
      subscribe(registration, userId);
      emit(registration.app, 'synced', '已同步');
    }).catch(function (error) {
      emit(registration.app, 'error', '无法连接云端，本地数据已保留');
      console.warn('Hub sync initialisation failed:', error.message);
    });
  }
  function register(app, options) {
    if (registrations[app]) return registrations[app].api;
    var registration = Object.assign({ app: app, timer: null, channel: null }, options || {});
    registration.api = { put: function (key, payload) { put(app, key, payload); }, remove: function (key) { remove(app, key); }, flush: function () { flush(app); } };
    registrations[app] = registration;
    window.HubAuth.init().then(function () { activate(registration); });
    window.HubAuth.onChange(function (session) { if (session) activate(registration); });
    return registration.api;
  }
  window.HubSync = { register: register, flush: flush };
})();
