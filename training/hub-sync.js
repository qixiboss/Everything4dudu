/* Training adapter: portal sync for train.settings and train.log.
 * Settings merges run against the app's live in-memory settings object
 * (exposed as window.TrainingSettings by app.js), so a stale cloud settings
 * row can never wipe targets the user is editing locally, and a remote row
 * landing mid-edit merges instead of overwriting. */
(function () {
  'use strict';
  var SETTINGS_KEY = 'train.settings';
  var LOG_KEY = 'train.log';

  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { return fallback; } }
  function liveSettings() { return window.TrainingSettings || read(SETTINGS_KEY, {}); }
  function items() {
    var settings = liveSettings(), log = read(LOG_KEY, {});
    return [{ item_key: 'settings', payload: settings }].concat(Object.keys(log).map(function (day) { return { item_key: 'day:' + day, payload: log[day] }; }));
  }
  function resetLocal() {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(LOG_KEY);
    /* Fully clear the live settings object so cloud data for the new account
     * starts from an empty merge target. app.js keeps its default targets
     * via settings.targets = Object.assign(settings.targets, ...), so this
     * still ends up with the app defaults after reload. */
    if (window.TrainingSettings) {
      Object.keys(window.TrainingSettings).forEach(function (key) { delete window.TrainingSettings[key]; });
    }
    if (window.location && typeof window.location.reload === 'function') window.setTimeout(function () { window.location.reload(); }, 0);
  }
  function mergeSettings(local, remote) {
    /* Apply remote keys only where the local copy has no value for them yet. */
    var changed = false;
    if (remote && typeof remote === 'object') {
      Object.keys(remote).forEach(function (key) {
        if (local[key] === undefined || local[key] === null) { local[key] = remote[key]; changed = true; }
      });
    }
    return changed;
  }
  function applyRemote(rows) {
    var settings = liveSettings(), log = read(LOG_KEY, {}), changed = false;
    rows.forEach(function (row) {
      if (row.item_key === 'settings' && !row.deleted_at) changed = mergeSettings(settings, row.payload) || changed;
      if (row.item_key.indexOf('day:') === 0) {
        var day = row.item_key.slice(4);
        if (row.deleted_at && Object.prototype.hasOwnProperty.call(log, day)) { delete log[day]; changed = true; }
        else if (!row.deleted_at && JSON.stringify(log[day]) !== JSON.stringify(row.payload)) { log[day] = row.payload; changed = true; }
      }
    });
    if (!changed) return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
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
