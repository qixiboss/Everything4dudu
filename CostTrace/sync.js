/* CostTrace sync adapter: one local transaction maps to transaction:<id>. */
(function () {
  'use strict';
  var STORAGE_KEY = 'costtrace.transactions.v1';

  function readRecords() {
    try {
      var value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(value) ? value.map(window.CostTraceModel.normalizeRecord).filter(Boolean) : [];
    } catch (_) { return []; }
  }
  function writeRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.CostTraceModel.sortRecords(records)));
    window.dispatchEvent(new CustomEvent('costtrace:data-change'));
  }
  function items() {
    return readRecords().map(function (record) { return { item_key: 'transaction:' + record.id, payload: record }; });
  }
  function applyRemote(rows) {
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
  }
  function resetLocal() { localStorage.removeItem(STORAGE_KEY); window.dispatchEvent(new CustomEvent('costtrace:data-change')); }
  function start() {
    if (!window.HubAppSync || !window.CostTraceModel) return;
    window.HubAppSync.start({ app: 'cost-trace', items: items, applyRemote: applyRemote, resetLocal: resetLocal });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
