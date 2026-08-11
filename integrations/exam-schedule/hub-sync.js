(function () {
  'use strict';
  var STORAGE_KEY = 'kaoyan-first-round-state-v4';
  var controller = null;
  var previous = {};
  var applyingRemote = false;

  function state() { try { var value = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; return { completed: value.completed || {}, rested: value.rested || {} }; } catch (_) { return { completed: {}, rested: {} }; } }
  function items() {
    var value = state();
    return Object.keys(value.completed).map(function (id) { return { item_key: 'task:' + id, payload: { completedAt: Number(value.completed[id]) || Date.now() } }; })
      .concat(Object.keys(value.rested).filter(function (day) { return value.rested[day]; }).map(function (day) { return { item_key: 'rest:' + day, payload: { rested: true } }; }));
  }
  function encodedItems() { return items().reduce(function (map, item) { map[item.item_key] = JSON.stringify(item.payload); return map; }, {}); }
  function resetLocal() {
    localStorage.removeItem(STORAGE_KEY);
    previous = {};
    if (window.location && typeof window.location.reload === 'function') window.setTimeout(function () { window.location.reload(); }, 0);
  }
  function applyRemote(rows) {
    var value = state(), changed = false;
    rows.forEach(function (row) {
      if (row.item_key.indexOf('task:') === 0) {
        var id = row.item_key.slice(5), at = Number(row.payload && row.payload.completedAt) || Date.now();
        if (row.deleted_at && Object.prototype.hasOwnProperty.call(value.completed, id)) { delete value.completed[id]; changed = true; }
        else if (!row.deleted_at && value.completed[id] !== at) { value.completed[id] = at; changed = true; }
      }
      if (row.item_key.indexOf('rest:') === 0) {
        var day = row.item_key.slice(5);
        if (row.deleted_at && Object.prototype.hasOwnProperty.call(value.rested, day)) { delete value.rested[day]; changed = true; }
        else if (!row.deleted_at && value.rested[day] !== true) { value.rested[day] = true; changed = true; }
      }
    });
    if (!changed) return;
    applyingRemote = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
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
    controller = window.HubSync.register('exam-schedule', { getItems: items, applyRemote: applyRemote, resetLocal: resetLocal });
    window.setInterval(scan, 800);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
