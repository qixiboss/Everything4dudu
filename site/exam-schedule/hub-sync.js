/* Exam schedule adapter: portal sync for the kaoyan first-round state store.
 * Only task completion rows sync; rest-day markers stay device-local (they
 * annotate the UI and have no scheduling effect). */
(function () {
  'use strict';
  var ITEM_PREFIX = 'task:';
  var Model = null;
  var STORAGE_KEY = null;

  function state() { return Model.readState(localStorage, console); }
  function notifyChange() {
    window.dispatchEvent(new CustomEvent('exam-schedule:data-change'));
  }
  function items() {
    var value = state();
    return Object.keys(value.completed).map(function (id) { return { item_key: ITEM_PREFIX + id, payload: { completedAt: Number(value.completed[id]) || Date.now() } }; });
  }
  function resetLocal() {
    localStorage.removeItem(STORAGE_KEY);
    notifyChange();
  }
  function applyRemote(rows) {
    var value = state(), changed = false;
    rows.forEach(function (row) {
      if (row.item_key.indexOf(ITEM_PREFIX) === 0) {
        var id = row.item_key.slice(ITEM_PREFIX.length), at = Number(row.payload && row.payload.completedAt) || Date.now();
        if (row.deleted_at && Object.prototype.hasOwnProperty.call(value.completed, id)) { delete value.completed[id]; changed = true; }
        else if (!row.deleted_at && value.completed[id] !== at) { value.completed[id] = at; changed = true; }
      }
    });
    if (!changed) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    notifyChange();
  }
  function start() {
    if (!window.HubAppSync || !window.ExamScheduleModel) return;
    Model = window.ExamScheduleModel;
    STORAGE_KEY = Model.STORAGE_KEY;
    window.HubAppSync.start({
      app: 'exam-schedule',
      items: items,
      applyRemote: applyRemote,
      resetLocal: resetLocal
    });
  }
  if (document.readyState === 'complete') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
