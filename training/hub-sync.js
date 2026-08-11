(function () {
  'use strict';
  var SETTINGS_KEY = 'train.settings';
  var LOG_KEY = 'train.log';
  var controller = null;
  var previous = {};
  var applyingRemote = false;

  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { return fallback; } }
  function items() {
    var settings = read(SETTINGS_KEY, {}), log = read(LOG_KEY, {});
    return [{ item_key: 'settings', payload: settings }].concat(Object.keys(log).map(function (day) { return { item_key: 'day:' + day, payload: log[day] }; }));
  }
  function encodedItems() { return items().reduce(function (map, item) { map[item.item_key] = JSON.stringify(item.payload); return map; }, {}); }
  function resetLocal() {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(LOG_KEY);
    previous = {};
    if (window.location && typeof window.location.reload === 'function') window.setTimeout(function () { window.location.reload(); }, 0);
  }
  function applyRemote(rows) {
    var settings = read(SETTINGS_KEY, {}), log = read(LOG_KEY, {}), changed = false;
    rows.forEach(function (row) {
      if (row.item_key === 'settings' && !row.deleted_at && JSON.stringify(settings) !== JSON.stringify(row.payload)) { settings = row.payload; changed = true; }
      if (row.item_key.indexOf('day:') === 0) {
        var day = row.item_key.slice(4);
        if (row.deleted_at && Object.prototype.hasOwnProperty.call(log, day)) { delete log[day]; changed = true; }
        else if (!row.deleted_at && JSON.stringify(log[day]) !== JSON.stringify(row.payload)) { log[day] = row.payload; changed = true; }
      }
    });
    if (!changed) return;
    applyingRemote = true;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
    previous = encodedItems();
    applyingRemote = false;
    window.setTimeout(function () { window.location.reload(); }, 50);
  }
  function scan() {
    if (!controller || applyingRemote) return;
    var current = encodedItems();
    items().forEach(function (item) { if (previous[item.item_key] !== current[item.item_key]) controller.put(item.item_key, item.payload); });
    Object.keys(previous).forEach(function (key) { if (!Object.prototype.hasOwnProperty.call(current, key)) controller.remove(key); });
    previous = current;
  }
  function start() {
    if (!window.HubSync) return;
    previous = encodedItems();
    controller = window.HubSync.register('training', { getItems: items, applyRemote: applyRemote, resetLocal: resetLocal });
    window.setInterval(scan, 800);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
