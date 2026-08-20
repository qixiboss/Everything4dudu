/* Pomodoro Focus — view controller, timer state machine and chart rendering.
 * Data shape and aggregation live in model.js; cloud sync in hub-sync.js. */
(function () {
  'use strict';

  var M = window.PomodoroModel;
  var MODES = M.MODES;
  var state = { data: M.load(localStorage) };
  var timer = {
    mode: MODES.FOCUS, running: false, paused: false,
    endAt: 0, remaining: 0, totalSec: 0, startedAt: 0,
    tickHandle: 0, currentId: ''
  };
  var calendarCursor = new Date();
  var currentView = 'timer';
  var SETTINGS_DRAFT = null;
  var modalCb = null;
  var modalPrevFocus = null;
  var lastTitle = '';
  var audioCtx = null;
  var resizeHandle = 0;

  function $(selector, root) { return (root || document).querySelector(selector); }
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (key) {
      if (key === 'class') node.className = attrs[key];
      else if (key === 'text') node.textContent = attrs[key];
      else if (key.slice(0, 2) === 'on' && typeof attrs[key] === 'function') node.addEventListener(key.slice(2), attrs[key]);
      else if (attrs[key] != null) node.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) {
      if (child == null) return;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  function durationFor(mode, settings) {
    if (mode === MODES.SHORT) return settings.shortBreakSec;
    if (mode === MODES.LONG) return settings.longBreakSec;
    return settings.focusSec;
  }

  function persistLog() {
    M.writeLog(localStorage, state.data.log);
    if (window.HubAppSync) window.HubAppSync.queue({
      app: 'pomodoro',
      items: function () {
        var log = state.data.log;
        return Object.keys(log).map(function (day) { return { item_key: 'day:' + day, payload: log[day] }; });
      }
    });
  }

  function persistSettings() {
    M.writeSettings(localStorage, state.data.settings);
  }

  function persistSession() {
    if (timer.running || timer.paused) {
      M.writeSession(localStorage, {
        mode: timer.mode,
        running: timer.running,
        paused: timer.paused,
        endAt: timer.endAt,
        remaining: timer.remaining,
        currentId: timer.currentId,
        totalSec: timer.totalSec,
        startedAt: timer.startedAt,
        savedAt: Date.now()
      });
    } else {
      M.clearSession(localStorage);
    }
  }

  function toast(message) {
    var node = $('#toast');
    if (!node) return;
    node.textContent = message;
    node.classList.add('show');
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(function () { node.classList.remove('show'); }, 2200);
  }

  function vibrate() {
    try { if (navigator.vibrate) navigator.vibrate([80, 60, 120]); } catch (_) {}
  }

  function beep() {
    if (!state.data.settings.sound) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === 'suspended' && audioCtx.resume) audioCtx.resume();
      function tone(freq, delay, duration, volume) {
        var oscillator = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        var startAt = audioCtx.currentTime + delay;
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, startAt);
        gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
        oscillator.connect(gain);
        gain.connect(audioCtx.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + duration + 0.05);
      }
      tone(880, 0, 0.35, 0.22);
      tone(1174.66, 0.18, 0.4, 0.18);
    } catch (_) {}
  }

  function modeMeta(mode) {
    if (mode === MODES.SHORT) return { label: '短休息', hint: '站起来走走，喝口水', accent: 'mint' };
    if (mode === MODES.LONG) return { label: '长休息', hint: '好好放松一下', accent: 'mint' };
    return { label: '专注', hint: '保持节奏，进入心流', accent: 'tomato' };
  }

  function phaseLabel() {
    if (!timer.running && !timer.paused) return '准备开始';
    if (timer.paused) return '已暂停';
    return modeMeta(timer.mode).label + '进行中';
  }

  function remainingNow() {
    if (timer.paused) return timer.remaining;
    if (!timer.running) return durationFor(timer.mode, state.data.settings);
    return Math.max(0, Math.round((timer.endAt - Date.now()) / 1000));
  }

  /* 阶段一旦开始就冻结总时长，避免运行中修改设置导致圆环比例错乱。 */
  function totalForCurrent() {
    return timer.totalSec > 0 ? timer.totalSec : durationFor(timer.mode, state.data.settings);
  }

  function cyclePosition() {
    var settings = state.data.settings;
    var day = state.data.log[M.todayKey()];
    var focusDone = day ? day.focusCount : 0;
    var position = focusDone % settings.longBreakInterval;
    return position === 0 ? settings.longBreakInterval : position;
  }

  function syncModeChips() {
    var map = { focus: MODES.FOCUS, short: MODES.SHORT, long: MODES.LONG };
    Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (chip) {
      var active = map[chip.dataset.mode] === timer.mode;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function renderTimerRing() {
    var total = totalForCurrent();
    var remaining = remainingNow();
    var progress = total > 0 ? (total - remaining) / total : 0;
    var circumference = 2 * Math.PI * 130;
    var ring = $('#timer-progress');
    var label = $('#timer-time');
    var meta = modeMeta(timer.mode);
    var circle = $('#timer-circle');
    if (ring) ring.style.strokeDashoffset = String(circumference * (1 - progress));
    if (label) label.textContent = M.fmtMMSS(remaining);
    if (circle) circle.dataset.accent = meta.accent;
    var phase = $('#timer-phase');
    if (phase) phase.textContent = phaseLabel();
    var modeTag = $('#timer-mode');
    if (modeTag) {
      modeTag.textContent = meta.label;
      modeTag.dataset.accent = meta.accent;
    }
    var hint = $('#timer-hint');
    if (hint) hint.textContent = meta.hint;
    var startBtn = $('#btn-start');
    if (startBtn) {
      if (timer.running) startBtn.textContent = '暂停';
      else if (timer.paused) startBtn.textContent = '继续';
      else startBtn.textContent = '开始';
    }
    var activeState = timer.running || timer.paused;
    var endBtn = $('#btn-end');
    if (endBtn) endBtn.hidden = !activeState;
    var resetBtn = $('#btn-reset');
    if (resetBtn) resetBtn.hidden = !activeState;
    var dot = $('#timer-dot');
    if (dot) dot.classList.toggle('blink', timer.running);
    syncModeChips();
    var nextNode = $('#timer-next');
    if (nextNode) {
      var position = cyclePosition();
      var nextMode = advanceMode();
      var prefix = timer.mode === MODES.FOCUS ? '本组第 ' + position + ' 个番茄' : '已完成第 ' + position + ' 个番茄';
      nextNode.textContent = prefix + ' · 下一个：' + modeMeta(nextMode).label;
    }
    var newTitle = '番茄专注';
    if (activeState && label) newTitle = meta.label + ' ' + label.textContent + ' · 番茄专注';
    if (newTitle !== lastTitle) { document.title = newTitle; lastTitle = newTitle; }
  }

  function commitPomodoro(completed) {
    var now = Date.now();
    var total = totalForCurrent();
    var remaining = timer.paused ? timer.remaining : remainingNow();
    var elapsedSec = Math.max(0, total - remaining);
    var entry = M.ensureDay(state.data.log, M.todayKey());
    entry.pomodoros.push({
      id: timer.currentId,
      mode: timer.mode,
      startedAt: timer.startedAt || (now - elapsedSec * 1000),
      endedAt: now,
      durationSec: Math.max(completed ? total : elapsedSec, 1),
      completed: completed === true
    });
    entry.focusCount = entry.pomodoros.filter(function (p) { return p.mode === MODES.FOCUS && p.completed; }).length;
    entry.totalFocusSec = entry.pomodoros.filter(function (p) { return p.mode === MODES.FOCUS; }).reduce(function (s, p) { return s + p.durationSec; }, 0);
    entry.totalBreakSec = entry.pomodoros.filter(function (p) { return p.mode !== MODES.FOCUS; }).reduce(function (s, p) { return s + p.durationSec; }, 0);
    entry.cycleCount = entry.focusCount;
    persistLog();
    renderTimerStats();
    if (currentView === 'insight') renderInsight();
  }

  function stopTimer() {
    window.clearTimeout(timer.tickHandle);
    timer.running = false;
    timer.paused = false;
  }

  function resetPhaseMeta() {
    timer.totalSec = 0;
    timer.startedAt = 0;
    timer.remaining = 0;
  }

  function advanceMode() {
    var settings = state.data.settings;
    if (timer.mode === MODES.FOCUS) {
      var day = state.data.log[M.todayKey()];
      var focusDone = day ? day.focusCount : 0;
      return (focusDone > 0 && focusDone % settings.longBreakInterval === 0) ? MODES.LONG : MODES.SHORT;
    }
    return MODES.FOCUS;
  }

  function startTimer() {
    var settings = state.data.settings;
    if (timer.running) {
      var remaining = remainingNow();
      stopTimer();
      timer.paused = true;
      timer.remaining = remaining;
      renderTimerRing();
      persistSession();
      return;
    }
    if (timer.paused) {
      timer.paused = false;
      timer.running = true;
      if (!(timer.totalSec > 0)) timer.totalSec = durationFor(timer.mode, settings);
      timer.endAt = Date.now() + timer.remaining * 1000;
      loopTick();
      persistSession();
      renderTimerRing();
      return;
    }
    timer.mode = timer.mode || MODES.FOCUS;
    timer.running = true;
    timer.paused = false;
    timer.currentId = M.makeId('pomo');
    timer.totalSec = durationFor(timer.mode, settings);
    timer.startedAt = Date.now();
    timer.endAt = Date.now() + timer.totalSec * 1000;
    loopTick();
    persistSession();
    renderTimerRing();
  }

  function loopTick() {
    timer.tickHandle = window.setTimeout(function () {
      var remaining = remainingNow();
      renderTimerRing();
      if (remaining <= 0) {
        finishPhase();
        return;
      }
      loopTick();
    }, 250);
  }

  function finishPhase() {
    var finishedMode = timer.mode;
    commitPomodoro(true);
    beep();
    vibrate();
    stopTimer();
    resetPhaseMeta();
    var nextMode = advanceMode();
    timer.mode = nextMode;
    timer.currentId = M.makeId('pomo');
    renderTimerRing();
    if (nextMode === MODES.LONG) {
      toast('本组完成，来个长休息吧');
    } else if (nextMode === MODES.FOCUS) {
      toast(finishedMode === MODES.FOCUS ? '专注完成，去休息一下吧' : '休息结束，开始下一个番茄');
    }
    if (state.data.settings.autoStart) {
      window.setTimeout(function () {
        timer.running = true;
        timer.paused = false;
        timer.totalSec = durationFor(timer.mode, state.data.settings);
        timer.startedAt = Date.now();
        timer.endAt = Date.now() + timer.totalSec * 1000;
        loopTick();
        persistSession();
        renderTimerRing();
      }, 800);
    } else {
      persistSession();
    }
  }

  function endPhaseEarly() {
    commitPomodoro(false);
    beep();
    vibrate();
    stopTimer();
    resetPhaseMeta();
    timer.mode = advanceMode();
    timer.currentId = M.makeId('pomo');
    renderTimerRing();
    persistSession();
    toast('已记录本次进度');
  }

  function resetPhase() {
    if (!timer.running && !timer.paused) return;
    var total = totalForCurrent();
    var remaining = timer.paused ? timer.remaining : remainingNow();
    var elapsed = Math.max(0, total - remaining);
    function doReset() {
      stopTimer();
      resetPhaseMeta();
      timer.currentId = M.makeId('pomo');
      persistSession();
      renderTimerRing();
      toast('已重置当前阶段');
    }
    if (elapsed >= 5) {
      openConfirm({
        title: '重置当前阶段',
        body: '重置会丢弃已计时的 ' + M.fmtDuration(elapsed) + '，且不会记录本次进度。确定重置吗？',
        okText: '重置',
        cancelText: '继续计时'
      }, function (ok) { if (ok) doReset(); });
    } else {
      doReset();
    }
  }

  function switchMode(mode) {
    var target = mode === 'focus' ? MODES.FOCUS : (mode === 'short' ? MODES.SHORT : MODES.LONG);
    if (target === timer.mode) return;
    function doSwitch() {
      if (timer.running || timer.paused) {
        commitPomodoro(false);
        stopTimer();
        resetPhaseMeta();
      }
      timer.mode = target;
      timer.currentId = M.makeId('pomo');
      persistSession();
      renderTimerRing();
      toast('已切换到' + modeMeta(target).label);
    }
    if (timer.running || timer.paused) {
      openConfirm({
        title: '切换阶段',
        body: '当前' + modeMeta(timer.mode).label + '尚未结束，切换会记录已用时并停止计时。确定要切换吗？',
        okText: '切换并记录',
        cancelText: '继续当前'
      }, function (ok) { if (ok) doSwitch(); });
    } else {
      doSwitch();
    }
  }

  function renderTimerStats() {
    var today = M.todaySummary(state.data.log);
    var month = M.monthSummary(state.data.log, new Date());
    setStat('stat-today-focus', today.focusCount);
    setStat('stat-today-sec', today.totalFocusSec === 0 ? '0 分钟' : M.fmtDuration(today.totalFocusSec));
    setStat('stat-month-days', month.activeDayCount);
    setStat('stat-cycle', cyclePosition() + ' / ' + state.data.settings.longBreakInterval);
  }

  function setStat(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function renderTimer() {
    renderTimerStats();
    renderTimerRing();
  }

  function renderInsight() {
    renderCalendar();
    renderInsightOverview();
    renderTrend();
    renderAllStats();
  }

  function renderCalendar() {
    var year = calendarCursor.getFullYear();
    var month = calendarCursor.getMonth();
    var title = $('#cal-title');
    if (title) title.textContent = year + ' 年 ' + (month + 1) + ' 月';
    var monthData = M.monthSummary(state.data.log, calendarCursor);
    var grid = $('#cal-grid');
    if (!grid) return;
    grid.innerHTML = '';
    var cells = M.buildCalendarGrid(year, month);
    var todayKeyVal = M.todayKey();
    cells.forEach(function (cell) {
      var focusCount = cell.key ? (monthData.days[cell.key] ? monthData.days[cell.key].focusCount : 0) : 0;
      var heat = focusCount === 0 ? 0 : Math.min(4, Math.ceil(focusCount / 2));
      var node = el('div', {
        class: 'cal-cell' + (cell.inMonth ? '' : ' out') + (cell.key === todayKeyVal ? ' today' : '') + (heat ? ' h' + heat : ''),
        'data-key': cell.key,
        title: cell.key ? cell.key + (focusCount ? '：' + focusCount + ' 个番茄' : '：未打卡') : ''
      }, [
        el('span', { class: 'cal-day', text: String(cell.day) }),
        cell.key ? el('span', { class: 'cal-dot', text: focusCount ? String(focusCount) : '' }) : null
      ]);
      grid.appendChild(node);
    });
  }

  function renderInsightOverview() {
    var today = M.todaySummary(state.data.log);
    setStat('ov-focus-sec', today.totalFocusSec === 0 ? '0 分钟' : M.fmtDuration(today.totalFocusSec));
    setStat('ov-focus-count', today.focusCount);
    setStat('ov-cycle', today.completedCycles);
    var records = state.data.log[today.dayKey] ? state.data.log[today.dayKey].pomodoros.length : 0;
    setStat('ov-records', records);
  }

  function renderTrend() {
    var ranges = [7, 15, 30];
    var rangeInput = $('#trend-range');
    var active = rangeInput ? Number(rangeInput.value) : 7;
    if (ranges.indexOf(active) === -1) active = 7;
    var series = M.trendSeries(state.data.log, active, new Date());
    var maxSec = Math.max.apply(null, series.map(function (s) { return s.focusSec; }).concat([1]));
    var totalSec = series.reduce(function (sum, s) { return sum + s.focusSec; }, 0);
    var totalCount = series.reduce(function (sum, s) { return sum + s.focusCount; }, 0);
    var area = $('#trend-area');
    var sumNode = $('#trend-sum');
    if (sumNode) sumNode.textContent = '近 ' + active + ' 天 · 累计专注 ' + M.fmtDuration(totalSec) + ' · ' + totalCount + ' 个番茄';
    if (!area) return;
    area.innerHTML = '';
    if (totalCount === 0) {
      area.appendChild(el('div', { class: 'trend-empty', text: '还没有专注记录，完成第一个番茄后这里会出现趋势' }));
      return;
    }
    /* viewBox 的宽高比必须跟随容器实际尺寸，否则 preserveAspectRatio="none" 会把圆点拉成横向扁椭圆。
     * 这里直接以容器像素宽度作为 viewBox 宽度，让横纵缩放系数一致，圆点保持圆形。 */
    var areaRect = area.getBoundingClientRect ? area.getBoundingClientRect() : null;
    var height = 120;
    var width = areaRect && areaRect.width ? Math.max(80, Math.round(areaRect.width)) : 320;
    var padX = 12;
    var innerWidth = width - padX * 2;
    var step = series.length > 1 ? innerWidth / (series.length - 1) : innerWidth;
    var points = series.map(function (s, index) {
      var x = series.length > 1 ? padX + index * step : width / 2;
      var y = height - 8 - (s.focusSec / maxSec) * (height - 20);
      return { x: x, y: y, sec: s.focusSec, count: s.focusCount, key: s.key };
    });
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('class', 'trend-svg');
    var path = '';
    points.forEach(function (p, index) { path += (index === 0 ? 'M' : 'L') + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ' '; });
    var areaPath = path + 'L' + width + ' ' + height + ' L0 ' + height + ' Z';
    var areaEl = document.createElementNS(ns, 'path');
    areaEl.setAttribute('d', areaPath);
    areaEl.setAttribute('class', 'trend-area-fill');
    svg.appendChild(areaEl);
    var line = document.createElementNS(ns, 'path');
    line.setAttribute('d', path);
    line.setAttribute('class', 'trend-line');
    svg.appendChild(line);
    points.forEach(function (p) {
      var circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('cx', p.x.toFixed(2));
      circle.setAttribute('cy', p.y.toFixed(2));
      circle.setAttribute('r', p.sec > 0 ? 2.4 : 1.4);
      circle.setAttribute('class', 'trend-dot' + (p.sec > 0 ? ' on' : ''));
      var titleEl = document.createElementNS(ns, 'title');
      titleEl.textContent = p.key + '：专注 ' + M.fmtDuration(p.sec) + (p.count ? '（' + p.count + ' 个番茄）' : '');
      circle.appendChild(titleEl);
      svg.appendChild(circle);
    });
    area.appendChild(svg);
  }

  function renderAllStats() {
    var all = M.allSummary(state.data.log);
    setStat('all-records', all.totalFocusCount);
    setStat('all-duration', all.totalFocusSec === 0 ? '0 分钟' : M.fmtDuration(all.totalFocusSec));
    setStat('all-streak', all.streakDays + ' 天');
    setStat('all-checkins', all.activeDays);
    var last = state.data.log[all.lastDay];
    setStat('all-last', last ? (all.lastDay + ' ' + M.fmtClock(new Date(last.pomodoros[last.pomodoros.length - 1].endedAt))) : '—');
    setStat('all-best', all.bestDay ? (all.bestDay + ' · ' + (state.data.log[all.bestDay] ? state.data.log[all.bestDay].focusCount : 0) + ' 个') : '—');
  }

  function loadSettingsForm() {
    SETTINGS_DRAFT = Object.assign({}, state.data.settings);
    var map = [
      ['set-focus', 'focusSec', 60],
      ['set-short', 'shortBreakSec', 60],
      ['set-long', 'longBreakSec', 60],
      ['set-interval', 'longBreakInterval', 1]
    ];
    map.forEach(function (pair) {
      var input = document.getElementById(pair[0]);
      if (input) input.value = Math.round(SETTINGS_DRAFT[pair[1]] / pair[2]);
    });
    syncSwitch('#set-autostart', SETTINGS_DRAFT.autoStart);
    syncSwitch('#set-sound', SETTINGS_DRAFT.sound);
  }

  function openSettings() {
    loadSettingsForm();
    switchView('settings');
  }

  function syncSwitch(selector, value) {
    var node = $(selector);
    if (node) node.checked = value;
  }

  function bindSettings() {
    var mins = [
      [document.getElementById('set-focus'), 'focusSec', 60],
      [document.getElementById('set-short'), 'shortBreakSec', 60],
      [document.getElementById('set-long'), 'longBreakSec', 60],
      [document.getElementById('set-interval'), 'longBreakInterval', 1]
    ];
    var auto = $('#set-autostart');
    var sound = $('#set-sound');
    function apply() {
      mins.forEach(function (pair) {
        var input = pair[0];
        var minutes = Number(input.value);
        if (!Number.isFinite(minutes) || input.value === '') return;
        SETTINGS_DRAFT[pair[1]] = Math.round(minutes * pair[2]);
      });
      if (auto) SETTINGS_DRAFT.autoStart = auto.checked;
      if (sound) SETTINGS_DRAFT.sound = sound.checked;
    }
    mins.forEach(function (pair) {
      if (!pair[0]) return;
      pair[0].addEventListener('input', apply);
      pair[0].addEventListener('blur', function () {
        pair[0].value = Math.round(SETTINGS_DRAFT[pair[1]] / pair[2]);
      });
    });
    if (auto) auto.addEventListener('change', apply);
    if (sound) sound.addEventListener('change', apply);
    var save = $('#set-save');
    if (save) save.addEventListener('click', function () {
      var clamped = false;
      mins.forEach(function (pair) {
        var input = pair[0];
        var minutes = Number(input.value);
        if (!Number.isFinite(minutes) || input.value === '') return;
        var min = Number(input.min);
        var max = Number(input.max);
        if (Number.isFinite(min) && minutes < min) { minutes = min; clamped = true; }
        if (Number.isFinite(max) && minutes > max) { minutes = max; clamped = true; }
        input.value = String(minutes);
        SETTINGS_DRAFT[pair[1]] = Math.round(minutes * pair[2]);
      });
      apply();
      state.data.settings = Object.assign({}, SETTINGS_DRAFT);
      persistSettings();
      renderTimerRing();
      renderTimerStats();
      toast(clamped ? '已保存，部分数值已调整到合法范围' : '设置已保存');
    });
    var clear = $('#set-clear');
    if (clear) clear.addEventListener('click', function () {
      openConfirm({
        title: '清空全部记录',
        body: '确定清空全部专注记录吗？此操作不可撤销。',
        okText: '清空',
        cancelText: '取消',
        danger: true
      }, function (ok) {
        if (!ok) return;
        state.data.log = {};
        M.clearSession(localStorage);
        persistLog();
        calendarCursor = new Date();
        renderInsight();
        renderTimer();
        toast('已清空专注记录');
      });
    });
  }

  function switchView(view) {
    currentView = view;
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (tab) {
      tab.classList.toggle('active', tab.dataset.view === view);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.view'), function (section) {
      section.hidden = section.id !== 'view-' + view;
    });
    window.scrollTo(0, 0);
    if (view === 'timer') renderTimer();
    else if (view === 'insight') { renderInsight(); renderTimerStats(); }
    else if (view === 'settings') { loadSettingsForm(); renderTimerStats(); }
  }

  function restoreSession() {
    var raw = M.readSession(localStorage);
    if (!raw || typeof raw !== 'object') return;
    if (!raw.mode || (raw.mode !== MODES.FOCUS && raw.mode !== MODES.SHORT && raw.mode !== MODES.LONG)) return;
    var settings = state.data.settings;
    var finished = Date.now() > (raw.endAt || 0) + 60000;
    if (raw.running && !finished) {
      timer.mode = raw.mode;
      timer.running = true;
      timer.paused = false;
      timer.currentId = raw.currentId || M.makeId('pomo');
      timer.totalSec = Number.isFinite(raw.totalSec) && raw.totalSec > 0 ? raw.totalSec : durationFor(raw.mode, settings);
      timer.startedAt = Number.isFinite(raw.startedAt) ? raw.startedAt : (raw.endAt || Date.now()) - timer.totalSec * 1000;
      timer.endAt = raw.endAt;
      loopTick();
    } else if (raw.paused) {
      timer.mode = raw.mode;
      timer.running = false;
      timer.paused = true;
      timer.currentId = raw.currentId || M.makeId('pomo');
      timer.totalSec = Number.isFinite(raw.totalSec) && raw.totalSec > 0 ? raw.totalSec : durationFor(raw.mode, settings);
      timer.startedAt = Number.isFinite(raw.startedAt) ? raw.startedAt : 0;
      timer.remaining = Number.isFinite(raw.remaining) ? raw.remaining : durationFor(raw.mode, settings);
    } else if (raw.running && finished) {
      timer.mode = raw.mode;
      timer.currentId = raw.currentId || M.makeId('pomo');
      timer.running = false;
      timer.paused = false;
      timer.totalSec = Number.isFinite(raw.totalSec) && raw.totalSec > 0 ? raw.totalSec : durationFor(raw.mode, settings);
      timer.startedAt = Number.isFinite(raw.startedAt) ? raw.startedAt : (raw.endAt || Date.now()) - timer.totalSec * 1000;
      commitPomodoro(true);
      timer.mode = advanceMode();
      timer.currentId = M.makeId('pomo');
      resetPhaseMeta();
      M.clearSession(localStorage);
      toast('上次的专注已完成并记录');
    }
  }

  function bindTabs() {
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (tab) {
      tab.addEventListener('click', function () { switchView(tab.dataset.view); });
    });
  }

  function openConfirm(options, onConfirm) {
    var modal = $('#modal');
    if (!modal) {
      var fallback = window.confirm(options.body || options.title || '确定吗？');
      if (onConfirm) onConfirm(fallback);
      return;
    }
    modalCb = onConfirm;
    modalPrevFocus = document.activeElement;
    $('#modal-title').textContent = options.title || '确认';
    $('#modal-body').textContent = options.body || '';
    var ok = $('#modal-ok');
    ok.textContent = options.okText || '确定';
    ok.className = 'btn ' + (options.danger ? 'danger' : 'primary');
    $('#modal-cancel').textContent = options.cancelText || '取消';
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    ok.focus();
  }

  function closeModal(result) {
    var modal = $('#modal');
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    if (modalPrevFocus && modalPrevFocus.focus) modalPrevFocus.focus();
    var cb = modalCb;
    modalCb = null;
    if (cb) cb(result === true);
  }

  function bindModal() {
    var modal = $('#modal');
    if (!modal) return;
    var ok = $('#modal-ok');
    var cancel = $('#modal-cancel');
    if (ok) ok.addEventListener('click', function () { closeModal(true); });
    if (cancel) cancel.addEventListener('click', function () { closeModal(false); });
    var backdrop = modal.querySelector('[data-modal-close]');
    if (backdrop) backdrop.addEventListener('click', function () { closeModal(false); });
    document.addEventListener('keydown', function (event) {
      if (modal.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal(false);
      }
    });
  }

  function handleKeydown(event) {
    if (event.defaultPrevented || event.repeat) return;
    var target = event.target;
    var tag = target && target.tagName ? target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'select' || tag === 'textarea' || (target && target.isContentEditable)) return;
    if (tag === 'button' || tag === 'a') return;
    var modal = $('#modal');
    if (modal && !modal.hidden) return;
    if (event.code === 'Space' || event.key === ' ') {
      event.preventDefault();
      startTimer();
    } else if (event.key === 'r' || event.key === 'R') {
      if (timer.running || timer.paused) resetPhase();
    }
  }

  function bindControls() {
    var start = $('#btn-start');
    if (start) start.addEventListener('click', startTimer);
    var end = $('#btn-end');
    if (end) end.addEventListener('click', endPhaseEarly);
    var reset = $('#btn-reset');
    if (reset) reset.addEventListener('click', resetPhase);
    var settings = $('#btn-settings');
    if (settings) settings.addEventListener('click', openSettings);
    var prev = $('#cal-prev');
    if (prev) prev.addEventListener('click', function () {
      calendarCursor.setMonth(calendarCursor.getMonth() - 1);
      renderCalendar();
    });
    var next = $('#cal-next');
    if (next) next.addEventListener('click', function () {
      calendarCursor.setMonth(calendarCursor.getMonth() + 1);
      renderCalendar();
    });
    var range = $('#trend-range');
    if (range) range.addEventListener('change', renderTrend);
    var modeRow = $('#mode-row');
    if (modeRow) modeRow.addEventListener('click', function (event) {
      var chip = event.target.closest('.chip');
      if (chip) switchMode(chip.dataset.mode);
    });
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (timer.running || timer.paused) persistSession();
        return;
      }
      if (!timer.running && !timer.paused) return;
      renderTimerRing();
      if (timer.running && remainingNow() <= 0) finishPhase();
    });
    window.addEventListener('resize', function () {
      if (currentView !== 'insight') return;
      window.clearTimeout(resizeHandle);
      resizeHandle = window.setTimeout(renderTrend, 150);
    });
  }

  function init() {
    bindTabs();
    bindControls();
    bindSettings();
    bindModal();
    restoreSession();
    switchView('timer');
    window.addEventListener('pomodoro:data-change', function () {
      renderTimerStats();
      if (currentView === 'insight') renderInsight();
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
