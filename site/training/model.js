/* Training data, persistence and session model. DOM and timers stay in app.js. */
(function () {
  'use strict';

  var KEYS = Object.freeze({
    settings: 'train.settings',
    log: 'train.log',
    session: 'train.session'
  });
  var BASE_EXERCISES = Object.freeze([
    Object.freeze({ id: 'pushup', name: '俯卧撑', unit: '个', target: 20 }),
    Object.freeze({ id: 'abwheel', name: '健腹轮', unit: '个', target: 10 }),
    Object.freeze({ id: 'hanglegg', name: '悬挂举腿', unit: '个', target: 10 }),
    Object.freeze({ id: 'pullup', name: '引体向上', unit: '个', target: 8 })
  ]);
  var CARDIO_LIST = Object.freeze([
    Object.freeze({ id: 'run', name: '跑步', emoji: '🏃' }),
    Object.freeze({ id: 'ride', name: '骑行', emoji: '🚴' })
  ]);
  var WEEKDAYS = Object.freeze(['日', '一', '二', '三', '四', '五', '六']);

  function defaultSettings() {
    return {
      targets: { pushup: 20, abwheel: 10, hanglegg: 10, pullup: 8 },
      autoAlt: false,
      restSeconds: 60
    };
  }

  function load(storage) {
    var settings = defaultSettings();
    var log = {};
    try {
      var storedSettings = JSON.parse(storage.getItem(KEYS.settings));
      if (storedSettings) {
        settings.targets = Object.assign(settings.targets, storedSettings.targets || {});
        if (typeof storedSettings.autoAlt === 'boolean') settings.autoAlt = storedSettings.autoAlt;
        if (Number.isInteger(storedSettings.restSeconds) && storedSettings.restSeconds >= 1 && storedSettings.restSeconds <= 600) {
          settings.restSeconds = storedSettings.restSeconds;
        }
      }
      var storedLog = JSON.parse(storage.getItem(KEYS.log));
      if (storedLog && typeof storedLog === 'object' && !Array.isArray(storedLog)) log = storedLog;
    } catch (_) { /* Preserve the legacy all-or-nothing fallback for damaged data. */ }
    return { settings: settings, log: log };
  }

  function write(storage, key, value) {
    storage.setItem(key, JSON.stringify(value));
  }

  function readSession(storage) {
    try { return JSON.parse(storage.getItem(KEYS.session)); } catch (_) { return null; }
  }

  function clearSession(storage) {
    try { storage.removeItem(KEYS.session); } catch (_) { /* Ignore unavailable storage. */ }
  }

  function cardioOf(id) {
    for (var index = 0; index < CARDIO_LIST.length; index += 1) {
      if (CARDIO_LIST[index].id === id) return CARDIO_LIST[index];
    }
    return CARDIO_LIST[0];
  }

  function normCardio(value) {
    if (value === 0) return 'run';
    if (value === 1) return 'ride';
    if (value === 'run' || value === 'ride') return value;
    return 'run';
  }

  function pickCardio(log) {
    var keys = Object.keys(log).sort();
    for (var index = keys.length - 1; index >= 0; index -= 1) {
      var entry = log[keys[index]];
      if (entry && entry.cardio != null && entry.plan && entry.plan.some(function (activity) { return activity.cardio; })) {
        return normCardio(entry.cardio) === 'run' ? 'ride' : 'run';
      }
    }
    return 'run';
  }

  function buildPlan(settings, cardioId) {
    var activities = BASE_EXERCISES.map(function (exercise) {
      var target = settings.targets[exercise.id] || exercise.target;
      return {
        id: exercise.id,
        name: exercise.name,
        unit: exercise.unit,
        target: target,
        sets: [0, 1, 2, 3].map(function () { return { done: false, count: target, sec: 0 }; })
      };
    });
    activities.push({
      id: cardioId,
      name: cardioOf(cardioId).name,
      unit: '',
      target: 0,
      sets: [{ done: false, count: 0, sec: 0 }],
      cardio: true
    });
    return activities;
  }

  function dayKey(date) {
    var value = date || new Date();
    return value.getFullYear() + '-' + String(value.getMonth() + 1).padStart(2, '0') + '-' + String(value.getDate()).padStart(2, '0');
  }

  function weekdayName(key) {
    var date = new Date(key + 'T00:00:00');
    return isNaN(date) ? '' : '周' + WEEKDAYS[date.getDay()];
  }

  function fmtHM(seconds) {
    seconds = Math.max(0, Math.floor(seconds));
    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  }

  function fmtDuration(seconds) {
    seconds = Math.round(seconds);
    if (seconds < 60) return seconds + ' 秒';
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + ' 分钟';
    return Math.floor(minutes / 60) + ' 小时 ' + (minutes % 60) + ' 分';
  }

  function fmtShort(seconds) {
    seconds = Math.round(seconds);
    if (seconds <= 0) return '—';
    if (seconds < 60) return seconds + '秒';
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + '分';
    return Math.floor(minutes / 60) + '时' + (minutes % 60) + '分';
  }

  function findNextUndone(plan) {
    for (var activityIndex = 0; activityIndex < plan.length; activityIndex += 1) {
      for (var setIndex = 0; setIndex < plan[activityIndex].sets.length; setIndex += 1) {
        if (!plan[activityIndex].sets[setIndex].done) return [activityIndex, setIndex];
      }
    }
    return null;
  }

  function allDone(plan) {
    return plan.every(function (activity) {
      return activity.sets.every(function (set) { return set.done; });
    });
  }

  function restoreSession(raw, log, today) {
    if (!raw || typeof raw !== 'object') return { value: null, shouldClear: false };
    if (raw.finished || raw.date !== today) return { value: null, shouldClear: true };
    var entry = log[raw.date];
    if (!entry || !entry.plan || entry.completedAt) return { value: null, shouldClear: true };
    var plan = entry.plan;
    var position = null;
    var setAccum = 0;
    var resting = raw.resting === true;
    if (resting) {
      position = findNextUndone(plan);
      if (!position) return { value: null, shouldClear: false };
      setAccum = plan[position[0]].sets[position[1]].sec;
    } else if (raw.exIdx >= 0 && raw.exIdx < plan.length) {
      var activity = plan[raw.exIdx];
      if (activity && !activity.cardio && raw.setIdx >= 0 && raw.setIdx < activity.sets.length && !activity.sets[raw.setIdx].done) {
        position = [raw.exIdx, raw.setIdx];
        setAccum = Math.max(activity.sets[raw.setIdx].sec, raw.setAccum || 0);
      }
    }
    if (!position) {
      position = findNextUndone(plan);
      if (!position) return { value: null, shouldClear: false };
      setAccum = plan[position[0]].sets[position[1]].sec;
    }
    return {
      shouldClear: false,
      value: {
        plan: plan,
        cardioId: normCardio(entry.cardio),
        exIdx: position[0],
        setIdx: position[1],
        setAccum: setAccum,
        resting: resting,
        restAccum: typeof raw.restAccum === 'number' && isFinite(raw.restAccum) && raw.restAccum >= 0 ? raw.restAccum : 0,
        paused: raw.paused === true,
        cardioMin: typeof raw.cardioMin === 'number' && raw.cardioMin >= 1 ? raw.cardioMin : 30
      }
    };
  }

  function entrySec(entry) {
    if (!entry || !entry.plan) return 0;
    return entry.plan.reduce(function (sum, activity) {
      return sum + activity.sets.reduce(function (setSum, set) { return setSum + set.sec; }, 0);
    }, 0);
  }

  function entryHasContent(entry) {
    return !!(entry && entry.plan && entry.plan.some(function (activity) {
      return activity.sets.some(function (set) { return set.done; });
    }));
  }

  function summarize(log, now) {
    var timestamp = typeof now === 'number' ? now : Date.now();
    var keys = Object.keys(log);
    return {
      contentKeys: keys.filter(function (key) { return entryHasContent(log[key]); }),
      totalSeconds: keys.reduce(function (sum, key) { return sum + entrySec(log[key]); }, 0),
      weekSeconds: keys.reduce(function (sum, key) {
        return sum + (timestamp - new Date(key + 'T00:00:00') < 7 * 86400000 ? entrySec(log[key]) : 0);
      }, 0),
      monthDays: keys.filter(function (key) { return timestamp - new Date(key + 'T00:00:00') < 30 * 86400000; }).length,
      cardioCount: keys.filter(function (key) {
        var entry = log[key];
        return entry && entry.plan && entry.plan.some(function (activity) { return activity.cardio && activity.sets[0].done; });
      }).length
    };
  }

  window.TrainingModel = {
    KEYS: KEYS,
    BASE_EXERCISES: BASE_EXERCISES,
    CARDIO_LIST: CARDIO_LIST,
    defaultSettings: defaultSettings,
    load: load,
    writeSettings: function (storage, settings) { write(storage, KEYS.settings, settings); },
    writeLog: function (storage, log) { write(storage, KEYS.log, log); },
    writeSession: function (storage, session) { write(storage, KEYS.session, session); },
    readSession: readSession,
    clearSession: clearSession,
    cardioOf: cardioOf,
    normCardio: normCardio,
    pickCardio: pickCardio,
    buildPlan: buildPlan,
    dayKey: dayKey,
    weekdayName: weekdayName,
    fmtHM: fmtHM,
    fmtDuration: fmtDuration,
    fmtShort: fmtShort,
    findNextUndone: findNextUndone,
    allDone: allDone,
    restoreSession: restoreSession,
    entrySec: entrySec,
    entryHasContent: entryHasContent,
    summarize: summarize
  };
})();
