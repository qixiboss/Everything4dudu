/* Training adapter: portal sync for train.log. Only day rows sync — the
 * heatmap is computed from the log at render time, so no extra items are
 * needed. Settings (targets, rest seconds, cardio auto-alt) are device-local
 * preferences and never leave the browser. */
(function () {
  'use strict';
  var LOG_KEY = 'train.log';

  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { return fallback; } }
  function items() {
    var log = read(LOG_KEY, {});
    return Object.keys(log).map(function (day) { return { item_key: 'day:' + day, payload: log[day] }; });
  }
  function resetLocal() {
    localStorage.removeItem(LOG_KEY);
    if (window.location && typeof window.location.reload === 'function') window.setTimeout(function () { window.location.reload(); }, 0);
  }
  function applyRemote(rows) {
    var log = read(LOG_KEY, {}), changed = false;
    rows.forEach(function (row) {
      if (row.item_key.indexOf('day:') === 0) {
        var day = row.item_key.slice(4);
        if (row.deleted_at && Object.prototype.hasOwnProperty.call(log, day)) { delete log[day]; changed = true; }
        else if (!row.deleted_at && JSON.stringify(log[day]) !== JSON.stringify(row.payload)) { log[day] = row.payload; changed = true; }
      }
    });
    if (!changed) return;
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
    if (window.location && typeof window.location.reload === 'function') window.setTimeout(function () { window.location.reload(); }, 50);
  }
  function start() {
    window.HubAppSync.start({
      app: 'training',
      items: items,
      applyRemote: applyRemote,
      resetLocal: resetLocal
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
