/* Exam schedule adapter: portal sync for the kaoyan first-round state store.
 * Only task completion rows sync; rest-day markers stay device-local (they
 * annotate the UI and have no scheduling effect). */
(function () {
  'use strict';
  var STORAGE_KEY = 'kaoyan-first-round-state-v4';

  function state() { try { var value = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; return { completed: value.completed || {}, rested: value.rested || {} }; } catch (_) { return { completed: {}, rested: {} }; } }
  function items() {
    var value = state();
    return Object.keys(value.completed).map(function (id) { return { item_key: 'task:' + id, payload: { completedAt: Number(value.completed[id]) || Date.now() } }; });
  }
  function resetLocal() {
    localStorage.removeItem(STORAGE_KEY);
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
    });
    if (!changed) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    if (window.location && typeof window.location.reload === 'function') window.setTimeout(function () { window.location.reload(); }, 50);
  }
  function start() {
    window.HubAppSync.start({
      app: 'exam-schedule',
      items: items,
      applyRemote: applyRemote,
      resetLocal: resetLocal
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
