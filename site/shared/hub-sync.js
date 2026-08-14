/* Shared poll-driven adapter: converts an app's local storage into mergeable
 * portal sync items. Registration wraps `window.HubSync` (sync-store.js) with
 * a scan loop that uploads only changed items. The adapter contract mirrors
 * what sync-store.js calls back into:
 *
 *   items(): [{ item_key, payload }]       current full local state
 *   applyRemote(rows): void | Promise      merge remote rows into local state
 *   resetLocal(): void                     clear local state (account switch)
 *
 * Polling replaces event-based hooks, so the same file works for apps with
 * and without their own change notifications. Every remote application
 * (words, training, exam-schedule) receives a generated copy of this file;
 * the shared script lives here so the portal's integrity checks can read it. */
(function () {
  'use strict';
  var POLL_MS = 800;
  /* Per-app scan state, so callers may pass a fresh adapter object for a
   * manual queue() without losing the change baseline. */
  var state = {};
  var applyingRemote = 0;

  function keys(value) { return Object.keys(value || {}); }
  function items(adapter) {
    var value = adapter.items();
    return Array.isArray(value) ? value : [];
  }
  function encodedItems(adapter, values) {
    var map = {};
    (values || items(adapter)).forEach(function (item) { map[item.item_key] = JSON.stringify(item.payload); });
    return map;
  }
  function scan(adapter) {
    var entry = state[adapter.app];
    if (!entry || !entry.controller || applyingRemote) return;
    var values, current;
    try {
      values = items(adapter);
      current = encodedItems(adapter, values);
    } catch (error) {
      window.dispatchEvent(new CustomEvent('hub:sync-status', { detail: { app: adapter.app, state: 'error', message: '本地数据异常，同步已暂停' } }));
      console.warn('Hub sync scan skipped:', error.message);
      return;
    }
    values.forEach(function (item) {
      if (!entry.previous || entry.previous[item.item_key] !== current[item.item_key]) entry.controller.put(item.item_key, item.payload);
    });
    if (entry.previous) keys(entry.previous).forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(current, key)) entry.controller.remove(key);
    });
    entry.previous = current;
  }
  function applyRemote(adapter, rows) {
    if (!rows || !rows.length) return Promise.resolve(false);
    applyingRemote += 1;
    return Promise.resolve().then(function () { return adapter.applyRemote(rows); }).then(function () {
      /* Record the post-merge state only after the adapter has persisted it. */
      state[adapter.app].previous = encodedItems(adapter);
      return true;
    }).finally(function () { applyingRemote -= 1; });
  }
  function resetLocal(adapter) {
    if (!adapter.resetLocal) return Promise.resolve(false);
    applyingRemote += 1;
    return Promise.resolve().then(function () { return adapter.resetLocal(); }).then(function () {
      state[adapter.app].previous = {};
      return true;
    }).finally(function () { applyingRemote -= 1; });
  }
  function start(adapter) {
    if (!window.HubSync) return false;
    if (!state[adapter.app]) {
      /* Validate the local snapshot before registering. A broken adapter must
       * not leave a half-registered sync controller behind. */
      var initial = encodedItems(adapter);
      state[adapter.app] = {
        controller: window.HubSync.register(adapter.app, {
          getItems: adapter.items,
          applyRemote: function (rows) { return applyRemote(adapter, rows); },
          resetLocal: function () { return resetLocal(adapter); }
        }),
        previous: initial
      };
      window.setInterval(function () { scan(adapter); }, POLL_MS);
      /* The first scan must wait for registration to settle: activation
       * fetches remote state and reconciles local, so scanning earlier
       * would upload a pre-merge snapshot. Later scans run on the poll timer. */
      Promise.resolve(state[adapter.app].controller.ready()).then(function () { scan(adapter); });
    }
    return true;
  }
  /* Run one scan immediately; used by legacy CloudSync upload cycles and tests. */
  function queue(adapter) { scan(adapter); }
  window.HubAppSync = {
    start: start,
    queue: queue
  };
})();
