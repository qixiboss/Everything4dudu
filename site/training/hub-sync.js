/* Training adapter: portal sync for train.log. Only day rows sync — the
 * heatmap is computed from the log at render time, so no extra items are
 * needed. Settings (targets, rest seconds, cardio auto-alt) are device-local
 * preferences and never leave the browser. */
(function () {
  'use strict';
  var DAY_PREFIX = 'day:';
  var LOG_KEY = null;

  function readLog() {
    try {
      var value = JSON.parse(localStorage.getItem(LOG_KEY));
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (_) { return {}; }
  }
  function notifyChange(reset) {
    window.dispatchEvent(new CustomEvent('training:data-change', { detail: { reset: reset === true } }));
  }
  function items() {
    var log = readLog();
    return Object.keys(log).map(function (day) { return { item_key: DAY_PREFIX + day, payload: log[day] }; });
  }
  function resetLocal() {
    localStorage.removeItem(LOG_KEY);
    localStorage.removeItem(window.TrainingModel.KEYS.session);
    notifyChange(true);
  }
  function applyRemote(rows) {
    var log = readLog(), changed = false;
    rows.forEach(function (row) {
      if (row.item_key.indexOf(DAY_PREFIX) === 0) {
        var day = row.item_key.slice(DAY_PREFIX.length);
        if (row.deleted_at && Object.prototype.hasOwnProperty.call(log, day)) { delete log[day]; changed = true; }
        else if (!row.deleted_at && JSON.stringify(log[day]) !== JSON.stringify(row.payload)) { log[day] = row.payload; changed = true; }
      }
    });
    if (!changed) return;
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
    notifyChange(false);
  }
  function start() {
    if (!window.HubAppSync || !window.TrainingModel) return;
    LOG_KEY = window.TrainingModel.KEYS.log;
    window.HubAppSync.start({
      app: 'training',
      items: items,
      applyRemote: applyRemote,
      resetLocal: resetLocal
    });
  }
  if (document.readyState === 'complete') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
