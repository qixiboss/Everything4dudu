/* CostTrace sync adapter: one local transaction maps to transaction:<id>. */
(function () {
  'use strict';
  var STORAGE_KEY = 'costtrace.transactions.v1';

  function readRecords() {
    return window.CostTraceModel.parseStoredRecords(localStorage.getItem(STORAGE_KEY));
  }
  function writeRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.CostTraceModel.sortRecords(records)));
    window.dispatchEvent(new CustomEvent('costtrace:data-change'));
  }
  function items() {
    return readRecords().map(function (record) { return { item_key: 'transaction:' + record.id, payload: record }; });
  }
  function withStorageLock(callback) {
    if (window.navigator && window.navigator.locks && typeof window.navigator.locks.request === 'function') {
      return window.navigator.locks.request('costtrace-transactions', { mode: 'exclusive' }, callback);
    }
    return Promise.resolve().then(callback);
  }
  function applyRemote(rows) {
    return withStorageLock(function () {
      var map = {};
      readRecords().forEach(function (record) { map[record.id] = record; });
      rows.forEach(function (row) {
        if (row.item_key.indexOf('transaction:') !== 0) return;
        var id = row.item_key.slice('transaction:'.length);
        if (row.deleted_at) delete map[id];
        else {
          var record = window.CostTraceModel.normalizeRecord(Object.assign({}, row.payload, { id: id }));
          if (record) map[id] = record;
        }
      });
      writeRecords(Object.keys(map).map(function (id) { return map[id]; }));
    });
  }
  function resetLocal() {
    return withStorageLock(function () {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('costtrace:data-change'));
    });
  }
  function start() {
    if (!window.HubAppSync || !window.CostTraceModel) return;
    try {
      window.HubAppSync.start({ app: 'cost-trace', items: items, applyRemote: applyRemote, resetLocal: resetLocal });
    } catch (error) {
      console.warn('CostTrace sync paused because local data could not be read:', error.message);
      window.dispatchEvent(new CustomEvent('hub:sync-status', { detail: { app: 'cost-trace', state: 'error', message: '本地账本异常，同步已暂停' } }));
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
