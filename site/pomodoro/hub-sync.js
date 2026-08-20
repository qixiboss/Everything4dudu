/* Pomodoro adapter: portal sync for pomodoro.log. Only day rows sync — the
 * daily entries merge by completed pomodoros, so the local model keeps the
 * richest version on a merge. Settings (focus/break durations, auto-start,
 * sound) and the running session are device-local and never leave the
 * browser. */
(function () {
  'use strict';
  var DAY_PREFIX = 'day:';
  var LOG_KEY = null;
  var LAST_DAY_KEY = null;

  function readLog() {
    try {
      var value = JSON.parse(localStorage.getItem(LOG_KEY));
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (_) { return {}; }
  }

  function notifyChange(reset) {
    window.dispatchEvent(new CustomEvent('pomodoro:data-change', { detail: { reset: reset === true } }));
  }

  /* 本机优先：同 id 条目保留本机版本，仅补入远端新增条目。跨设备同时编辑时
   * 不做字段级合并，避免把已确认的本机记录改坏。 */
  function mergeDay(localDay, remoteDay) {
    if (!localDay) return remoteDay;
    if (!remoteDay) return localDay;
    var merged = {
      date: localDay.date,
      pomodoros: localDay.pomodoros.slice(),
      focusCount: 0,
      totalFocusSec: 0,
      totalBreakSec: 0,
      cycleCount: 0
    };
    var seen = {};
    localDay.pomodoros.forEach(function (item) { seen[item.id] = 'local'; });
    remoteDay.pomodoros.forEach(function (item) {
      if (!seen[item.id]) {
        merged.pomodoros.push(item);
        seen[item.id] = 'remote';
      }
    });
    merged.pomodoros.sort(function (a, b) { return a.startedAt - b.startedAt; });
    merged.pomodoros.forEach(function (item) {
      if (item.mode === 'focus' && item.completed) merged.focusCount += 1;
      if (item.mode === 'focus') merged.totalFocusSec += item.durationSec;
      else merged.totalBreakSec += item.durationSec;
    });
    merged.cycleCount = merged.focusCount;
    return merged;
  }

  function items() {
    var log = readLog();
    return Object.keys(log).map(function (day) { return { item_key: DAY_PREFIX + day, payload: log[day] }; });
  }

  function resetLocal() {
    if (LAST_DAY_KEY) localStorage.removeItem(LAST_DAY_KEY);
    localStorage.removeItem(LOG_KEY);
    notifyChange(true);
  }

  function applyRemote(rows) {
    var log = readLog();
    var changed = false;
    rows.forEach(function (row) {
      if (row.item_key.indexOf(DAY_PREFIX) === 0) {
        var day = row.item_key.slice(DAY_PREFIX.length);
        if (row.deleted_at && Object.prototype.hasOwnProperty.call(log, day)) { delete log[day]; changed = true; }
        else if (!row.deleted_at) {
          var normalized = window.PomodoroModel.normalizeDay(row.payload);
          normalized.date = day;
          var merged = mergeDay(log[day], normalized);
          if (JSON.stringify(log[day]) !== JSON.stringify(merged)) {
            log[day] = merged;
            changed = true;
          }
        }
      }
    });
    if (!changed) return;
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
    notifyChange(false);
  }

  function start() {
    if (!window.HubAppSync || !window.PomodoroModel) return;
    LOG_KEY = window.PomodoroModel.KEYS.log;
    LAST_DAY_KEY = window.PomodoroModel.KEYS.session;
    window.HubAppSync.start({
      app: 'pomodoro',
      items: items,
      applyRemote: applyRemote,
      resetLocal: resetLocal
    });
  }
  if (document.readyState === 'complete') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
