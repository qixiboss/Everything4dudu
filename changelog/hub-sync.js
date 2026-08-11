/* Changelog adapter: portal sync for the dudu.changelog.v1 store.
 * Rows are keyed by version (entry:<version>); remote rows are merged into
 * the local map and the timeline re-renders in place. */
(function () {
  'use strict';
  var STORAGE_KEY = 'dudu.changelog.v1';

  function read() {
    try {
      var value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }
  function items() {
    return read().map(function (entry) {
      return { item_key: 'entry:' + entry.version, payload: entry };
    });
  }
  function resetLocal() {
    localStorage.removeItem(STORAGE_KEY);
    if (window.location && typeof window.location.reload === 'function') {
      window.setTimeout(function () { window.location.reload(); }, 0);
    }
  }
  function applyRemote(rows) {
    var changed = false;
    var map = {};
    read().forEach(function (entry) { map[entry.version] = entry; });
    rows.forEach(function (row) {
      if (row.item_key.indexOf('entry:') !== 0) return;
      var version = row.item_key.slice(6);
      if (row.deleted_at) {
        if (map[version]) { delete map[version]; changed = true; }
      } else if (row.payload && typeof row.payload === 'object') {
        map[version] = row.payload;
        changed = true;
      }
    });
    if (!changed) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.keys(map).map(function (version) { return map[version]; })));
    if (window.Changelog && typeof window.Changelog.render === 'function') window.Changelog.render();
  }
  function start() {
    window.HubAppSync.start({
      app: 'changelog',
      items: items,
      applyRemote: applyRemote,
      resetLocal: resetLocal
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
