/* Pomodoro data, persistence and session model. The DOM, timer and chart stay
 * in app.js; this module exposes the storage layout, the daily log shape, and
 * the aggregation math the rest of the app renders. */
(function () {
  'use strict';

  var KEYS = Object.freeze({
    settings: 'pomodoro.settings',
    log: 'pomodoro.log',
    session: 'pomodoro.session'
  });

  var MODES = Object.freeze({ FOCUS: 'focus', SHORT: 'short-break', LONG: 'long-break' });
  var TREE_TIERS = Object.freeze({ COMMON: 'common', BLOSSOM: 'blossom', SPECIAL: 'special' });
  var TREE_SPECIES = Object.freeze({
    OAK: 'oak',
    PINE: 'pine',
    MAPLE: 'maple',
    BLOSSOM: 'blossom',
    CAMELLIA: 'camellia',
    CHERRY: 'cherry',
    FRUIT: 'fruit'
  });
  var WEEKDAYS = Object.freeze(['一', '二', '三', '四', '五', '六', '日']);
  var MONTH_NAMES = Object.freeze(['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']);

  function defaultSettings() {
    return {
      focusSec: 25 * 60,
      shortBreakSec: 5 * 60,
      longBreakSec: 15 * 60,
      longBreakInterval: 4,
      autoStart: false,
      sound: true
    };
  }

  function load(storage) {
    var settings = defaultSettings();
    var log = {};
    try {
      var storedSettings = JSON.parse(storage.getItem(KEYS.settings));
      if (storedSettings && typeof storedSettings === 'object') {
        if (Number.isInteger(storedSettings.focusSec) && storedSettings.focusSec >= 60 && storedSettings.focusSec <= 90 * 60) settings.focusSec = storedSettings.focusSec;
        if (Number.isInteger(storedSettings.shortBreakSec) && storedSettings.shortBreakSec >= 60 && storedSettings.shortBreakSec <= 30 * 60) settings.shortBreakSec = storedSettings.shortBreakSec;
        if (Number.isInteger(storedSettings.longBreakSec) && storedSettings.longBreakSec >= 60 && storedSettings.longBreakSec <= 60 * 60) settings.longBreakSec = storedSettings.longBreakSec;
        if (Number.isInteger(storedSettings.longBreakInterval) && storedSettings.longBreakInterval >= 2 && storedSettings.longBreakInterval <= 12) settings.longBreakInterval = storedSettings.longBreakInterval;
        if (typeof storedSettings.autoStart === 'boolean') settings.autoStart = storedSettings.autoStart;
        if (typeof storedSettings.sound === 'boolean') settings.sound = storedSettings.sound;
      }
      var storedLog = JSON.parse(storage.getItem(KEYS.log));
      if (storedLog && typeof storedLog === 'object' && !Array.isArray(storedLog)) {
        Object.keys(storedLog).forEach(function (key) {
          var entry = storedLog[key];
          if (entry && typeof entry === 'object' && key === entry.date) log[key] = normalizeDay(entry);
        });
      }
    } catch (_) { /* damaged storage falls back to defaults */ }
    return { settings: settings, log: log };
  }

  function normalizeDay(entry) {
    var pomodoros = Array.isArray(entry.pomodoros) ? entry.pomodoros.filter(function (item) {
      return item && typeof item === 'object' && item.id && (item.mode === MODES.FOCUS || item.mode === MODES.SHORT || item.mode === MODES.LONG);
    }).map(function (item) {
      return {
        id: String(item.id),
        mode: item.mode,
        startedAt: Number.isFinite(item.startedAt) ? item.startedAt : 0,
        endedAt: Number.isFinite(item.endedAt) ? item.endedAt : 0,
        durationSec: Number.isInteger(item.durationSec) && item.durationSec >= 0 ? item.durationSec : 0,
        completed: item.completed === true
      };
    }) : [];
    var focusCount = pomodoros.filter(function (item) { return item.mode === MODES.FOCUS && item.completed; }).length;
    var totalFocusSec = pomodoros.filter(function (item) { return item.mode === MODES.FOCUS; }).reduce(function (sum, item) { return sum + item.durationSec; }, 0);
    var totalBreakSec = pomodoros.filter(function (item) { return item.mode === MODES.SHORT || item.mode === MODES.LONG; }).reduce(function (sum, item) { return sum + item.durationSec; }, 0);
    return {
      date: entry.date,
      pomodoros: pomodoros,
      focusCount: focusCount,
      totalFocusSec: totalFocusSec,
      totalBreakSec: totalBreakSec,
      cycleCount: focusCount
    };
  }

  function write(storage, key, value) {
    storage.setItem(key, JSON.stringify(value));
  }

  function dayKey(date) {
    var value = date || new Date();
    return value.getFullYear() + '-' + String(value.getMonth() + 1).padStart(2, '0') + '-' + String(value.getDate()).padStart(2, '0');
  }

  function todayKey() { return dayKey(new Date()); }

  function ensureDay(log, key) {
    if (!log[key]) log[key] = { date: key, pomodoros: [], focusCount: 0, totalFocusSec: 0, totalBreakSec: 0, cycleCount: 0 };
    return log[key];
  }

  function readSession(storage) {
    try { return JSON.parse(storage.getItem(KEYS.session)); } catch (_) { return null; }
  }

  function clearSession(storage) {
    try { storage.removeItem(KEYS.session); } catch (_) {}
  }

  function fmtMMSS(total) {
    total = Math.max(0, Math.floor(total));
    var minutes = Math.floor(total / 60);
    var seconds = total % 60;
    return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
  }

  function fmtDuration(total) {
    total = Math.max(0, Math.floor(total));
    if (total < 60) return total + ' 秒';
    var minutes = Math.floor(total / 60);
    if (minutes < 60) return minutes + ' 分钟';
    var hours = Math.floor(minutes / 60);
    var rest = minutes % 60;
    return hours + ' 小时' + (rest > 0 ? ' ' + rest + ' 分钟' : '');
  }

  function fmtClock(date) {
    var value = date || new Date();
    return String(value.getHours()).padStart(2, '0') + ':' + String(value.getMinutes()).padStart(2, '0');
  }

  function pomodoroOf(mode) {
    if (mode === MODES.SHORT) return { label: '短休息', tint: 'mint' };
    if (mode === MODES.LONG) return { label: '长休息', tint: 'mint' };
    return { label: '专注', tint: 'tomato' };
  }

  function summaryFor(log, key) {
    var entry = log[key];
    if (!entry) return { focusCount: 0, totalFocusSec: 0, totalBreakSec: 0, completedCycles: 0, dayKey: key };
    return {
      focusCount: entry.focusCount,
      totalFocusSec: entry.totalFocusSec,
      totalBreakSec: entry.totalBreakSec,
      completedCycles: entry.cycleCount,
      dayKey: key
    };
  }

  function todaySummary(log) { return summaryFor(log, todayKey()); }

  function monthSummary(log, referenceDate) {
    var value = referenceDate || new Date();
    var month = value.getMonth();
    var year = value.getFullYear();
    var days = {};
    Object.keys(log).forEach(function (key) {
      var parts = key.split('-').map(Number);
      if (parts[0] === year && (parts[1] - 1) === month) {
        days[key] = summaryFor(log, key);
      }
    });
    var activeDays = Object.keys(days).filter(function (key) { return days[key].focusCount > 0; });
    return {
      year: year,
      month: month,
      monthLabel: value.getFullYear() + ' 年 ' + (month + 1) + ' 月',
      days: days,
      activeDayCount: activeDays.length,
      totalFocusSec: activeDays.reduce(function (sum, key) { return sum + days[key].totalFocusSec; }, 0),
      totalFocusCount: activeDays.reduce(function (sum, key) { return sum + days[key].focusCount; }, 0)
    };
  }

  function allSummary(log) {
    var keys = Object.keys(log).sort();
    var totalFocusSec = 0;
    var totalFocusCount = 0;
    var totalBreakSec = 0;
    var days = {};
    keys.forEach(function (key) {
      var summary = summaryFor(log, key);
      days[key] = summary;
      totalFocusSec += summary.totalFocusSec;
      totalFocusCount += summary.focusCount;
      totalBreakSec += summary.totalBreakSec;
    });
    var bestDay = null;
    keys.forEach(function (key) {
      if (!bestDay || days[key].focusCount > days[bestDay].focusCount) bestDay = key;
    });
    var streak = 0;
    var cursor = new Date();
    var today = dayKey(cursor);
    if (!days[today] || days[today].focusCount === 0) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (true) {
      var key = dayKey(cursor);
      if (!days[key] || days[key].focusCount === 0) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return {
      totalFocusSec: totalFocusSec,
      totalFocusCount: totalFocusCount,
      totalBreakSec: totalBreakSec,
      totalDays: keys.length,
      activeDays: keys.filter(function (key) { return days[key].focusCount > 0; }).length,
      bestDay: bestDay,
      streakDays: streak,
      firstDay: keys[0] || '',
      lastDay: keys[keys.length - 1] || ''
    };
  }

  function trendSeries(log, days, referenceDate) {
    var series = [];
    var cursor = new Date(referenceDate || new Date());
    cursor.setHours(0, 0, 0, 0);
    for (var index = days - 1; index >= 0; index -= 1) {
      var day = new Date(cursor);
      day.setDate(day.getDate() - index);
      var key = dayKey(day);
      var summary = summaryFor(log, key);
      series.push({
        key: key,
        date: new Date(day),
        focusSec: summary.totalFocusSec,
        focusCount: summary.focusCount
      });
    }
    return series;
  }

  function buildCalendarGrid(year, month) {
    var first = new Date(year, month, 1);
    var last = new Date(year, month + 1, 0);
    /* 0 = Sunday; shift so Monday is the first column to match the screenshot. */
    var firstWeekday = (first.getDay() + 6) % 7;
    var cells = [];
    var previousMonthLast = new Date(year, month, 0).getDate();
    for (var leading = firstWeekday - 1; leading >= 0; leading -= 1) {
      cells.push({
        inMonth: false,
        day: previousMonthLast - leading,
        date: new Date(year, month - 1, previousMonthLast - leading),
        key: ''
      });
    }
    for (var day = 1; day <= last.getDate(); day += 1) {
      var date = new Date(year, month, day);
      cells.push({ inMonth: true, day: day, date: date, key: dayKey(date) });
    }
    while (cells.length < 42) {
      var trailingDay = cells.length - firstWeekday - last.getDate() + 1;
      cells.push({
        inMonth: false,
        day: trailingDay,
        date: new Date(year, month + 1, trailingDay),
        key: ''
      });
    }
    return cells;
  }

  function seedOf(value) {
    var text = String(value == null ? '' : value);
    var hash = 5381;
    for (var index = 0; index < text.length; index += 1) {
      hash = ((hash << 5) + hash + text.charCodeAt(index)) | 0;
    }
    return hash >>> 0;
  }

  function treeTierFor(durationSec) {
    var sec = Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 0;
    if (sec >= 3600) return TREE_TIERS.SPECIAL;
    if (sec >= 1800) return TREE_TIERS.BLOSSOM;
    return TREE_TIERS.COMMON;
  }

  function treeVariantFor(tier, seed) {
    var value = seed >>> 0;
    if (tier === TREE_TIERS.BLOSSOM) return (value % 3) + 1;
    if (tier === TREE_TIERS.SPECIAL) return (value % 2) + 1;
    return (value % 3) + 1;
  }

  function treeSpeciesFor(tier, seed) {
    var value = seed >>> 0;
    if (tier === TREE_TIERS.BLOSSOM) {
      return (value % 2 === 0) ? TREE_SPECIES.BLOSSOM : TREE_SPECIES.CAMELLIA;
    }
    if (tier === TREE_TIERS.SPECIAL) {
      return (value % 2 === 0) ? TREE_SPECIES.CHERRY : TREE_SPECIES.FRUIT;
    }
    var commons = [TREE_SPECIES.OAK, TREE_SPECIES.PINE, TREE_SPECIES.MAPLE];
    return commons[value % commons.length];
  }

  function periodForest(log, days, now, cap) {
    var source = log && typeof log === 'object' ? log : {};
    var limit = Number.isInteger(cap) && cap > 0 ? cap : 120;
    var reference = now || new Date();
    var range = Number(days) || 0;
    var included = null;
    if (range > 0) {
      included = {};
      for (var offset = 0; offset < range; offset += 1) {
        var cursor = new Date(reference);
        cursor.setHours(0, 0, 0, 0);
        cursor.setDate(cursor.getDate() - offset);
        included[dayKey(cursor)] = true;
      }
    }
    var trees = [];
    var totalFocusSec = 0;
    Object.keys(source).sort().forEach(function (key) {
      if (included && !included[key]) return;
      var entry = source[key];
      if (!entry || !Array.isArray(entry.pomodoros)) return;
      entry.pomodoros.forEach(function (item) {
        if (!item || item.mode !== MODES.FOCUS || item.completed !== true) return;
        var id = String(item.id || key + ':' + item.startedAt);
        var seed = seedOf(id + ':' + key + ':' + (item.durationSec || 0));
        var tier = treeTierFor(item.durationSec);
        trees.push({
          id: id,
          dateKey: key,
          startedAt: Number.isFinite(item.startedAt) ? item.startedAt : 0,
          durationSec: Number.isInteger(item.durationSec) && item.durationSec >= 0 ? item.durationSec : 0,
          tier: tier,
          species: treeSpeciesFor(tier, seed),
          variant: treeVariantFor(tier, seed),
          seed: seed
        });
        totalFocusSec += item.durationSec || 0;
      });
    });
    trees.sort(function (a, b) { return a.startedAt - b.startedAt; });
    var totalTrees = trees.length;
    var selected = trees.length > limit ? trees.slice(trees.length - limit) : trees.slice();
    return {
      trees: selected,
      treeCount: selected.length,
      totalTrees: totalTrees,
      totalFocusSec: totalFocusSec,
      capped: totalTrees > selected.length,
      grassCount: totalFocusSec > 0 ? Math.min(18, 2 + Math.floor(totalFocusSec / 1200)) : 0,
      flowerCount: totalFocusSec > 0 ? Math.min(12, Math.max(1, Math.floor(totalFocusSec / 1800))) : 0
    };
  }

  function makeId(prefix) {
    return (prefix || 'p') + '-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36);
  }

  window.PomodoroModel = {
    KEYS: KEYS,
    MODES: MODES,
    TREE_TIERS: TREE_TIERS,
    TREE_SPECIES: TREE_SPECIES,
    WEEKDAYS: WEEKDAYS,
    MONTH_NAMES: MONTH_NAMES,
    defaultSettings: defaultSettings,
    load: load,
    writeSettings: function (storage, settings) { write(storage, KEYS.settings, settings); },
    writeLog: function (storage, log) { write(storage, KEYS.log, log); },
    writeSession: function (storage, session) { write(storage, KEYS.session, session); },
    readSession: readSession,
    clearSession: clearSession,
    dayKey: dayKey,
    todayKey: todayKey,
    ensureDay: ensureDay,
    normalizeDay: normalizeDay,
    fmtMMSS: fmtMMSS,
    fmtDuration: fmtDuration,
    fmtClock: fmtClock,
    pomodoroOf: pomodoroOf,
    summaryFor: summaryFor,
    todaySummary: todaySummary,
    monthSummary: monthSummary,
    allSummary: allSummary,
    trendSeries: trendSeries,
    buildCalendarGrid: buildCalendarGrid,
    seedOf: seedOf,
    treeTierFor: treeTierFor,
    treeVariantFor: treeVariantFor,
    treeSpeciesFor: treeSpeciesFor,
    periodForest: periodForest,
    makeId: makeId
  };
})();
