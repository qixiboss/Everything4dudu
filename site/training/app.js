/* ============================================================
   训练记录 — 应用逻辑（移动端优先）
   - 每日计划：前四项 × 4 组 + 跑步/骑行（手动设定时长后记录）
   - 每组正向计时 → 点「开始休息」记录本组 → 休息正向计时
     → 点「完成休息，开始下一组」→ 自动开始下一组
   - 做不动可「跳过剩余组」：剩余组计数置 0 并标记跳过，
     直接进入下一个动作的「开始」界面
   - 会话保存在 train.session：中途退出后回来可接着进度继续
     （仅当天恢复，恢复后暂停等待手动继续计时）
   - 数据保存在 localStorage
   ============================================================ */
(function () {
  'use strict';

  var Model = window.TrainingModel;
  var BASE_EXERCISES = Model.BASE_EXERCISES;
  var CARDIO_LIST = Model.CARDIO_LIST;
  var cardioOf = Model.cardioOf;

  /* ---------- 存储 ---------- */
  var settings = Model.defaultSettings();
  var log = {};
  var persistenceSuspended = false;
  var syncReloadPending = false;

  function load() {
    var stored = Model.load(localStorage);
    settings = stored.settings;
    log = stored.log;
  }
  function saveSettings() {
    Model.writeSettings(localStorage, settings);
  }
  function saveLog() {
    if (persistenceSuspended) return;
    Model.writeLog(localStorage, log);
  }

  /* ---------- 会话（断点续连） ---------- */
  /* 进行中/休息中计时先冻结进累计值，并同步把进行中组的秒数写回计划 */
  function saveSession() {
    if (persistenceSuspended) { clearSession(); return; }
    if (S.finished) { clearSession(); return; }
    var a = S.plan && S.exIdx >= 0 ? S.plan[S.exIdx] : null;
    var setSec = S.setAccum;
    var planDirty = false;
    if (S.running && S.setStart != null) setSec = S.setAccum + (Date.now() - S.setStart) / 1000;
    if (a && !a.cardio && S.setIdx >= 0 && !a.sets[S.setIdx].done) {
      if (setSec !== a.sets[S.setIdx].sec) {
        a.sets[S.setIdx].sec = setSec;
        planDirty = true;
      }
    }
    var restSec = S.restAccum;
    if (S.resting && S.restStart != null) restSec = S.restAccum + (Date.now() - S.restStart) / 1000;
    try {
      Model.writeSession(localStorage, {
        date: S.date,
        exIdx: S.exIdx,
        setIdx: S.setIdx,
        running: S.running,
        resting: S.resting,
        paused: S.paused,
        finished: S.finished,
        setAccum: setSec,
        restAccum: restSec,
        cardioMin: S.cardioMin,
      });
    } catch (e) { /* 忽略存储异常 */ }
    if (planDirty) saveLog();
  }
  function clearSession() {
    Model.clearSession(localStorage);
  }

  /* ---------- 日期工具 ---------- */
  var dayKey = Model.dayKey;
  function todayKey() { return dayKey(); }
  function isToday(key) { return key === todayKey(); }
  var fmtHM = Model.fmtHM;
  var fmtDuration = Model.fmtDuration;
  var fmtShort = Model.fmtShort;
  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }
  var weekdayName = Model.weekdayName;

  /* ---------- 会话状态 ---------- */
  var S = {
    date: null,          // 当前训练会话所属日期，跨午夜后保持不变
    plan: null,
    cardioId: 'run',     // 今日有氧类型
    cardioMin: 30,       // 有氧时长（分钟，默认 30）
    exIdx: -1,           // 当前动作索引
    setIdx: 0,           // 当前组索引
    running: false,      // 组计时中
    setStart: null,      // 组计时起点
    setAccum: 0,         // 组计时已累计（暂停冻结）
    setElapsed: 0,       // 组计时显示秒数
    resting: false,      // 休息计时中（正向）
    restStart: null,
    restAccum: 0,
    restElapsed: 0,
    paused: false,       // 全局暂停
    finished: false,
  };

  /* ---------- 计划 ---------- */
  function buildPlan() {
    return Model.buildPlan(settings, S.cardioId);
  }

  function ensureToday() {
    var k = S.date || todayKey();
    if (!log[k]) {
      log[k] = { date: k, plan: S.plan, cardio: S.cardioId, completedAt: null, endedEarly: false, distKm: null };
    }
  }
  function commitToday() {
    ensureToday();
    var e = log[S.date || todayKey()];
    e.plan = S.plan;
    e.cardio = S.cardioId;
    saveLog();
  }
  function todayEntry() { return log[S.date || todayKey()]; }

  /* 兼容旧数据：cardio 字段可能是 0/1 或 'run'/'ride' */
  var normCardio = Model.normCardio;
  function pickCardio() {
    return Model.pickCardio(log);
  }

  /* 断点续连：仅当会话属于今天、计划仍存在且未完成时恢复。
     恢复后计时器处于暂停（idle）状态，显示冻结秒数与「继续」按钮。 */
  function tryRestoreSession() {
    var restored = Model.restoreSession(Model.readSession(localStorage), log, todayKey());
    if (restored.shouldClear) clearSession();
    if (!restored.value) return false;
    S.plan = restored.value.plan;
    S.cardioId = restored.value.cardioId;
    S.finished = false;
    S.exIdx = restored.value.exIdx;
    S.setIdx = restored.value.setIdx;
    S.setAccum = restored.value.setAccum;
    S.setElapsed = S.setAccum;
    S.running = false;
    S.setStart = null;
    S.resting = restored.value.resting;
    S.restAccum = restored.value.restAccum;
    S.restElapsed = S.restAccum;
    S.restStart = null;
    S.paused = restored.value.paused;
    S.cardioMin = restored.value.cardioMin;
    return true;
  }

  function initToday() {
    var k = todayKey();
    S.date = k;
    if (tryRestoreSession()) return;
    if (log[k] && log[k].plan) {
      S.plan = log[k].plan;
      S.cardioId = normCardio(log[k].cardio);
      // 兼容旧版计划：有氧动作没有 cardio 标记时补上
      var cardioAct = null;
      for (var i = 0; i < S.plan.length; i++) {
        if (S.plan[i].cardio) cardioAct = S.plan[i];
      }
      if (cardioAct) {
        cardioAct.id = S.cardioId;
        cardioAct.name = cardioOf(S.cardioId).name;
      }
      S.finished = !!log[k].completedAt;
    } else {
      S.cardioId = settings.autoAlt ? pickCardio() : 'run';
      S.plan = buildPlan();
      ensureToday();
      saveLog();
    }
    S.exIdx = -1;
    S.setIdx = 0;
    S.running = false;
    S.resting = false;
    S.paused = false;
    S.setAccum = 0;
    S.setElapsed = 0;
    S.restAccum = 0;
  }

  function findNextUndone() {
    return Model.findNextUndone(S.plan);
  }
  function allDone() {
    return Model.allDone(S.plan);
  }
  function firstUndoneSet(i) {
    var sets = S.plan[i].sets;
    for (var j = 0; j < sets.length; j++) if (!sets[j].done) return j;
    return 0;
  }

  /* ---------- DOM ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var todayBody = $('today-body');

  /* ---------- 今日页渲染 ---------- */
  function renderToday() {
    $('today-date').textContent = S.date + ' · ' + weekdayName(S.date) +
      (S.paused && !S.finished ? ' · 已暂停' : '');
    renderHeadProgress();
    if (S.finished) { renderFinishCard(); return; }

    var html = '<div class="today-grid"><div class="console">' + consoleHtml() +
      '</div><div class="rail">' + railCards() + '</div></div>';
    todayBody.innerHTML = html;
    wireRail();
    wireConsole();
    $('finish-early').style.display = 'block';
  }

  function renderHeadProgress() {
    var total = 0, done = 0;
    S.plan.forEach(function (a) {
      a.sets.forEach(function (st) { total++; if (st.done) done++; });
    });
    $('head-progress').style.width = (total ? (done / total * 100) : 0) + '%';
  }

  function railCards() {
    var html = '', n = 1;
    for (var i = 0; i < S.plan.length; i++) {
      var a = S.plan[i];
      var doneN = 0, skipN = 0;
      a.sets.forEach(function (st) { if (st.done) doneN++; if (st.skipped) skipN++; });
      var isDone = doneN === a.sets.length;
      var isCur = i === S.exIdx;
      var sub;
      if (a.cardio) {
        sub = isDone ? '✓ 已记录' : '选择跑步或骑行';
      } else {
        sub = skipN > 0 ? (doneN - skipN) + ' 完成 · ' + skipN + ' 跳过' : doneN + ' / ' + a.sets.length + ' 组';
      }
      var dots = '';
      if (!a.cardio) {
        dots = a.sets.map(function (st, j) {
          var cls = st.skipped ? ' skip' : (st.done ? ' done' : '');
          var ring = isCur && j === S.setIdx && !st.done ? ' ring' : '';
          return '<span class="dot' + cls + ring + '"></span>';
        }).join('');
      } else if (isDone) {
        dots = '<span class="rail-check">✓</span>';
      } else {
        dots = '<span class="rail-ico">' + (a.id === 'run' ? '🏃' : '🚴') + '</span>';
      }
      html += '<button class="rail-card' + (isDone ? ' done' : '') + (isCur ? ' active' : '') +
        '" data-i="' + i + '"' + (isCur ? ' disabled' : '') + '>' +
        '<span class="num">' + String(n).padStart(2, '0') + '</span>' +
        '<span class="mid"><span class="name">' + esc(a.name) + '</span><span class="sub">' + sub + '</span></span>' +
        '<span class="right">' + dots + '</span>' +
        '</button>';
      n++;
    }
    return html;
  }

  function consoleHtml() {
    var a = S.plan[S.exIdx];
    var h;
    if (S.exIdx < 0) {
      var first = findNextUndone();
      var t = first ? S.plan[first[0]] : null;
      h = '<div class="console-head"><span class="ex-num">准备</span><div><h2>' +
        (t ? '下一步：' + esc(t.name) : '今日已完成') + '</h2>' +
        '<p class="tag">' + (t ? (t.cardio ? '选一个记录即可' : '共 ' + t.sets.length + ' 组') : '') + '</p></div></div>' +
        '<div class="console-body"><p class="status">' + (t ? '点下方按钮开始' : '全部完成 🎉') + '</p>' +
        '<div class="btn-row"><button class="btn primary" id="btn-start">开始训练</button></div>' +
        '<p class="hint">做完一组点「开始休息」，休息好了再点「完成休息，开始下一组」</p>' +
        '</div>';
      return h;
    }

    var num = S.exIdx + 1;
    var head = '<div class="console-head"><span class="ex-num">' + String(num).padStart(2, '0') + '</span>' +
      '<div><h2>' + esc(a.name) + '</h2><p class="tag" id="console-tag"></p></div></div>';

    if (a.cardio) {
      var st0 = a.sets[0];
      var lastCardio = null;
      var keys = Object.keys(log).sort();
      for (var i = keys.length - 1; i >= 0; i--) {
        var e = log[keys[i]];
        if (e && e.cardio != null && keys[i] !== S.date) { lastCardio = normCardio(e.cardio); break; }
      }
      var pickBtn = function (id) {
        var c = cardioOf(id);
        return '<button class="cardio-pick' + (st0.done && a.id === id ? ' picked' : '') + '" data-cardio="' + id + '">' +
          '<span class="cp-emoji">' + c.emoji + '</span><span class="cp-name">' + c.name + '</span>' +
          (st0.done && a.id === id ? '<span class="cp-check">✓</span>' : '') + '</button>';
      };
      h = '<div class="console-body">' +
        '<p class="status" id="status-line">' +
        (st0.done ? '<b>已记录：今天' + esc(a.name) + '</b>' : '今天是跑步还是骑行？') + '</p>' +
        (st0.done ? '' :
          '<div class="target-row">时长' +
          '<span class="stepper"><button type="button" id="dur-down">−</button>' +
          '<span class="val" id="dur-val">' + (S.cardioMin || 30) + ' 分钟</span>' +
          '<button type="button" id="dur-up">+</button></span></div>') +
        '<div class="cardio-picks">' + pickBtn('run') + pickBtn('ride') + '</div>' +
        (lastCardio && !st0.done ? '<p class="hint">上次：' + esc(cardioOf(lastCardio).name) + '</p>' : '') +
        (st0.done ? '<p class="hint">点另一个可以切换</p>' : '') +
        '</div>';
      return head + h;
    }

    // 力量动作
    var cur = a.sets[S.setIdx];
    var isIdle = !S.running && !S.resting;
    var timerLabel = S.resting ? '组间休息' : ('第 ' + (S.setIdx + 1) + ' / ' + a.sets.length + ' 组');
    var timerSec = S.resting ? S.restElapsed : S.setElapsed;
    // 剩余组数按未完成口径统计：休息中当前组已 done，不能计入（与 skipRemainingSets 一致）
    var remainingSets = 0;
    for (var rj = S.setIdx; rj < a.sets.length; rj++) if (!a.sets[rj].done) remainingSets++;
    var skipBtn = remainingSets > 0
      ? '<button class="btn ghost skip" id="btn-skip-remaining">跳过剩余 ' + remainingSets + ' 组</button>'
      : '';

    var actionHtml;
    if (S.resting) {
      actionHtml = '<div class="btn-row"><button class="btn record" id="btn-rest-done">完成休息，开始下一组</button></div>' +
        '<p class="hint">休息了 ' + fmtHM(S.restElapsed) + '，建议休息 ' + settings.restSeconds + ' 秒</p>';
    } else if (S.running) {
      actionHtml = '<div class="btn-row"><button class="btn primary" id="btn-to-rest">开始休息</button></div>' +
        '<p class="hint">点计时器可以暂停 / 继续</p>';
    } else {
      actionHtml = '<div class="btn-row"><button class="btn primary" id="btn-start-set">' +
        (cur.sec > 0 ? '继续' : '开始') + '</button></div>' +
        '<p class="hint">' + (cur.sec > 0 ? '上一轮进行到 ' + fmtHM(cur.sec) + '，点「继续」接着做' : '点「开始」后做组，做完点「开始休息」') + '</p>';
    }

    h = '<div class="console-body">' +
      '<p class="status" id="status-line">' + timerLabel + ' · 目标 <b>' + cur.count + '</b> ' + a.unit + '</p>' +
      '<div class="timer-skip-row">' +
      '<button type="button" class="timer' + (S.running ? ' live' : '') + (S.resting ? ' rest' : '') + '" id="timer-box"' +
      (S.resting ? ' disabled' : '') + ' aria-label="' + (S.resting ? '组间休息计时' : (S.running ? '暂停本组计时' : '开始本组计时')) + '">' +
      (S.running ? '<span class="live-dot blink"></span>' : '') +
      (S.resting ? '<span class="rest-dot"></span>' : '') +
      '<span id="timer">' + fmtHM(timerSec) + '</span></button>' +
      skipBtn +
      '</div>' +
      (!S.resting ? '<div class="target-row">目标 <span class="stepper">' +
        '<button type="button" id="step-down">−</button><span class="val" id="target-val">' + cur.count + '</span>' +
        '<button type="button" id="step-up">＋</button></span>' + a.unit + '</div>' : '') +
      actionHtml +
      '</div>';
    return head + h;
  }

  /* ---------- 事件绑定：今日 ---------- */
  function wireRail() {
    var cards = todayBody.querySelectorAll('.rail-card:not(:disabled)');
    cards.forEach(function (c) {
      c.addEventListener('click', function () {
        var i = parseInt(c.dataset.i, 10);
        if (S.plan[i] && S.plan[i].sets.every(function (st) { return st.done; })) return;
        freezeTimers();
        S.exIdx = i;
        S.setIdx = firstUndoneSet(i);
        var a = S.plan[i];
        S.setAccum = a.cardio ? 0 : a.sets[S.setIdx].sec;
        S.setElapsed = S.setAccum;
        S.running = false;
        S.setStart = null;
        S.resting = false;
        renderToday();
        saveSession();
      });
    });
  }

  function wireConsole() {
    var a = S.plan[S.exIdx];
    if (!a) {
      var bs = $('btn-start');
      if (bs) bs.addEventListener('click', function () {
        var f = findNextUndone();
        if (!f) return;
        startSet(f[0], f[1], true);
      });
      return;
    }
    if (a.cardio) {
      var picks = todayBody.querySelectorAll('.cardio-pick');
      picks.forEach(function (b) {
        b.addEventListener('click', function () {
          recordCardio(b.dataset.cardio);
        });
      });
      var durDown = $('dur-down'), durUp = $('dur-up');
      var setDur = function (n) {
        S.cardioMin = Math.max(1, Math.min(240, n));
        var v = $('dur-val');
        if (v) v.textContent = S.cardioMin + ' 分钟';
      };
      if (durDown) durDown.addEventListener('click', function () { setDur(S.cardioMin - 5); });
      if (durUp) durUp.addEventListener('click', function () { setDur(S.cardioMin + 5); });
      return;
    }
    var bStart = $('btn-start-set');
    if (bStart) bStart.addEventListener('click', function () {
      S.running = true;
      S.setStart = Date.now();
      S.resting = false;
      if (S.paused) { S.paused = false; syncPauseUI(false); }
      renderToday();
      updateTimers();
    });
    var bToRest = $('btn-to-rest');
    if (bToRest) bToRest.addEventListener('click', completeSet);
    var bRestDone = $('btn-rest-done');
    if (bRestDone) bRestDone.addEventListener('click', function () {
      if (S.paused) { S.paused = false; syncPauseUI(false); }
      restDone();
    });
    var tb = $('timer-box');
    if (tb) tb.addEventListener('click', function () {
      if (!S.running && S.resting) return; // 休息中不响应
      toggleSetTimer();
    });
    var bSkip = $('btn-skip-remaining');
    if (bSkip) bSkip.addEventListener('click', skipRemainingSets);
    var sd = $('step-down');
    if (sd) sd.addEventListener('click', function () { stepCount(-1); });
    var su = $('step-up');
    if (su) su.addEventListener('click', function () { stepCount(1); });
  }

  function freezeTimers() {
    if (S.running && S.setStart != null) {
      S.setAccum += (Date.now() - S.setStart) / 1000;
      S.setStart = null;
      S.setElapsed = S.setAccum;
      // 写回计划，防止中途切走动作丢失累计
      var a = S.plan[S.exIdx];
      if (a && !a.cardio && S.setIdx >= 0 && !a.sets[S.setIdx].done) {
        a.sets[S.setIdx].sec = S.setAccum;
        saveLog();
      }
    }
    if (S.resting && S.restStart != null) {
      S.restAccum += (Date.now() - S.restStart) / 1000;
      S.restStart = null;
      S.restElapsed = S.restAccum;
    }
  }

  function toggleSetTimer() {
    if (S.running) {
      freezeTimers();
      S.running = false;
    } else if (!S.resting) {
      S.running = true;
      S.setStart = Date.now();
    }
    renderToday();
    updateTimers();
    saveSession();
  }

  function stepCount(delta) {
    var a = S.plan[S.exIdx];
    if (!a || a.cardio) return;
    var st = a.sets[S.setIdx];
    if (st.done) return;
    st.count = Math.max(1, st.count + delta);
    $('target-val').textContent = st.count;
    saveLog();
  }

  function startSet(i, j, autoStart) {
    S.exIdx = i;
    S.setIdx = j;
    var a = S.plan[i];
    if (a.cardio) {
      // 进入有氧：不需要计时，直接显示选择
      S.running = false;
      S.resting = false;
      S.setAccum = 0;
      S.setElapsed = 0;
      renderToday();
      saveSession();
      return;
    }
    S.setAccum = a.sets[j].sec;
    S.setElapsed = S.setAccum;
    if (autoStart) {
      S.running = true;
      S.setStart = Date.now();
    } else {
      S.running = false;
      S.setStart = null;
    }
    S.resting = false;
    renderToday();
    updateTimers();
    saveSession();
  }

  /* 跳过当前动作剩余的所有组：剩余组计数置 0 并标记跳过，
     然后进入下一个动作的「开始」界面（不自动开始计时） */
  function skipRemainingSets() {
    var a = S.plan[S.exIdx];
    if (!a || a.cardio || S.finished) return;
    freezeTimers();
    var skipped = 0;
    for (var j = S.setIdx; j < a.sets.length; j++) {
      var st = a.sets[j];
      if (st.done) continue;
      st.done = true;
      st.count = 0;
      st.sec = 0;
      st.skipped = true;
      skipped++;
    }
    if (!skipped) return;
    commitToday();
    var next = findNextUndone();
    if (!next) { finishDay(); return; }
    startSet(next[0], next[1], false);
    toast('已跳过剩余 ' + skipped + ' 组');
  }

  /* 点「开始休息」：记录本组时间，进入正向休息计时 */
  function completeSet() {
    var a = S.plan[S.exIdx];
    var st = a.sets[S.setIdx];
    if (st.done) return;
    freezeTimers();
    S.running = false;
    st.sec = S.setAccum;
    st.done = true;
    commitToday();

    var next = findNextUndone();
    if (!next) { finishDay(); return; }
    if (S.plan[next[0]].cardio) {
      // 下一项是有氧：直接进入有氧选择（不需要休息）
      startSet(next[0], next[1], false);
      return;
    }
    // 进入休息（正向计时）
    S.resting = true;
    S.restStart = Date.now();
    S.restAccum = 0;
    S.restElapsed = 0;
    renderToday();
    updateTimers();
    saveSession();
  }

  /* 点「完成休息，开始下一组」 */
  function restDone() {
    freezeTimers();
    S.resting = false;
    var next = findNextUndone();
    if (!next) { finishDay(); return; }
    startSet(next[0], next[1], true); // 自动开始计时
  }

  /* ---------- 有氧记录 ---------- */
  function recordCardio(id) {
    var a = S.plan[S.exIdx];
    if (!a || !a.cardio) return;
    S.cardioId = id;
    a.id = id;
    a.name = cardioOf(id).name;
    a.sets[0].done = true;
    a.sets[0].sec = Math.max(1, Math.round(S.cardioMin || 30)) * 60;
    commitToday();
    if (allDone()) { finishDay(); return; }
    // 力量还没做完？记录完有氧直接回到下一个未完成动作
    var next = findNextUndone();
    if (next) {
      S.exIdx = next[0];
      S.setIdx = next[1];
      S.running = false;
      S.resting = false;
      S.setAccum = 0;
      S.setElapsed = 0;
      renderToday();
      saveSession();
      toast('已记录：今天' + cardioOf(id).name);
    }
  }

  function finishDay() {
    freezeTimers();
    commitToday();
    var e = todayEntry();
    e.completedAt = new Date().toISOString();
    e.endedEarly = !allDone();
    S.finished = true;
    S.running = false;
    S.resting = false;
    // 暂停中结束的话，顶栏按钮会卡在「继续计时」且再点无效
    S.paused = false;
    syncPauseUI(false);
    saveLog();
    clearSession();
    renderToday();
  }

  /* ---------- 完成卡 ---------- */
  function renderFinishCard() {
    todayBody.innerHTML = '';
    var doneList = S.plan.map(function (a, i) {
      var sum;
      if (a.cardio) {
        sum = a.sets[0].done ? '✓ ' + esc(a.name) + (a.sets[0].sec ? ' · ' + fmtHM(a.sets[0].sec) : '') : '未做';
      } else {
        var totalSec = a.sets.reduce(function (s, st) { return s + st.sec; }, 0);
        sum = a.sets.map(function (st) { return st.skipped ? '跳过' : st.count; }).join(' · ') +
          (totalSec > 0 ? '　' + fmtHM(totalSec) : '');
      }
      return '<div class="finish-item"><span><span class="n">' + String(i + 1).padStart(2, '0') + '</span>' +
        esc(a.name) + '</span><span class="mono">' + esc(sum) + '</span></div>';
    }).join('');
    var distHtml = '';
    var e = todayEntry();
    if (S.plan.some(function (a) { return a.cardio && a.sets[0].done; }) && !e.distKm) {
      var cardioName = S.cardioId === 'run' ? '跑步' : '骑行';
      distHtml = '<div class="dist-row"><label for="dist-input">' + cardioName + '里程（可选）</label>' +
        '<input type="number" id="dist-input" min="0" step="0.1" placeholder="0.0"><span>公里</span></div>';
    } else if (e.distKm) {
      distHtml = '<div class="dist-row"><label>今日里程</label><b>' + e.distKm + ' 公里</b></div>';
    }
    var dur = S.plan.reduce(function (s, a) { return s + a.sets.reduce(function (x, st) { return x + st.sec; }, 0); }, 0);
    var completedActs = S.plan.filter(function (a) {
      return a.sets.every(function (st) { return st.done; });
    }).length;
    var summary = e.endedEarly
      ? '提前结束：已完成 ' + completedActs + ' / ' + S.plan.length + ' 个动作，用时 ' + fmtDuration(dur)
      : '今天共完成 ' + fmtDuration(dur) + '，' + completedActs + ' 个动作';
    todayBody.innerHTML =
      '<div class="finish-card"><div class="finish-check">✓</div>' +
      '<h2>' + (e.endedEarly ? '训练已提前结束' : '训练完成！') + '</h2><p class="finish-sum">' + summary + '</p>' +
      '<div class="finish-list">' + doneList + '</div>' +
      distHtml +
      '<div class="finish-actions"><div class="btn-row">' +
      '<button class="btn ghost danger" id="btn-new-session">删除今日训练，重新开始记录</button></div></div></div>';
    $('btn-new-session').addEventListener('click', function () {
      if (!confirm('删除今日训练并重新开始记录？今天已有的记录会一并删除，此操作不可恢复。')) return;
      var k = S.date || todayKey();
      log[k].plan = S.plan.map(function (a) {
        return { id: a.id, name: a.name, unit: a.unit, target: a.target, cardio: !!a.cardio,
                 sets: a.sets.map(function (st) { return { done: false, count: st.count, sec: 0 }; }) };
      });
      log[k].completedAt = null;
      log[k].endedEarly = false;
      S.plan = log[k].plan;
      S.finished = false;
      S.exIdx = -1;
      S.setIdx = 0;
      saveLog();
      clearSession();
      renderToday();
    });
    $('finish-early').style.display = 'none';
    var d = $('dist-input');
    if (d) {
      d.addEventListener('change', function () {
        var v = parseFloat(d.value);
        if (!isNaN(v) && v >= 0) {
          e.distKm = v;
          saveLog();
          toast('里程已记录：' + v + ' 公里');
          renderToday();
        }
      });
    }
  }

  /* ---------- 计时循环 ---------- */
  var tickInterval = null;

  function updateTimers() {
    var a = S.plan && S.exIdx >= 0 ? S.plan[S.exIdx] : null;
    if (!a || a.cardio) return;
    var tEl = $('timer');
    if (tEl) tEl.textContent = fmtHM(S.resting ? S.restElapsed : S.setElapsed);
    var stl = $('status-line');
    var cur = a.sets[S.setIdx];
    if (stl) {
      if (S.resting) {
        stl.innerHTML = '组间休息 · 已休息 <b>' + fmtHM(S.restElapsed) + '</b> · 建议 ' + settings.restSeconds + ' 秒';
      } else if (S.running) {
        stl.innerHTML = '第 <b>' + (S.setIdx + 1) + '</b> / ' + a.sets.length + ' 组 · 目标 <b>' + cur.count + '</b> ' + a.unit;
      } else {
        stl.innerHTML = '第 <b>' + (S.setIdx + 1) + '</b> / ' + a.sets.length + ' 组 · 目标 <b>' + cur.count + '</b> ' + a.unit;
      }
    }
  }

  function startTicker() {
    if (tickInterval) return;
    var lastSessionSave = 0;
    tickInterval = setInterval(function () {
      if (syncReloadPending && !S.running && !S.resting) {
        applySyncedDataChange();
        return;
      }
      if (S.finished || S.paused) return;
      if (S.running && S.setStart != null) {
        S.setElapsed = S.setAccum + (Date.now() - S.setStart) / 1000;
      }
      if (S.resting && S.restStart != null) {
        S.restElapsed = S.restAccum + (Date.now() - S.restStart) / 1000;
      }
      updateTimers();
      // 计时运行中每约 2 秒把进行中进度落盘，防退出丢失
      if (S.running || S.resting) {
        var now = Date.now();
        if (now - lastSessionSave >= 2000) {
          lastSessionSave = now;
          saveSession();
        }
      }
    }, 250);
  }

  /* 暂停/继续按钮图标与文字同步 */
  function syncPauseUI(paused) {
    $('pause-label').textContent = paused ? '继续计时' : '暂停计时';
    $('btn-pause').setAttribute('aria-label', paused ? '继续计时' : '暂停计时');
    var pp = $('icon-pause'), pl = $('icon-play');
    if (pp && pl) {
      pp.style.display = paused ? 'none' : '';
      pl.style.display = paused ? '' : 'none';
    }
  }

  function togglePause() {
    if (S.finished) return;
    if (S.paused) {
      S.paused = false;
      if (S.running) S.setStart = Date.now();
      if (S.resting) S.restStart = Date.now();
    } else {
      freezeTimers();
      S.paused = true;
    }
    syncPauseUI(S.paused);
    renderToday();
    saveSession();
  }

  /* ---------- 热力图 ---------- */
  function renderHeat() {
    var keys = contentKeys();
    var sub = keys.length + ' 天训练 · 共 ' + fmtDuration(totalAllSec());
    $('heat-sub').textContent = sub;

    var statsHtml = statTile(fmtDuration(totalAllSec()), '累计训练时长') +
      statTile(fmtDuration(weekSec()), '近 7 天') + statTile(monthDays(), '最近 30 天训练天数') +
      statTile(cardioCount(), '跑步 / 骑行');
    $('heat-stats').innerHTML = statsHtml;

    var today = new Date();
    var start = new Date(today);
    start.setDate(start.getDate() - 34);
    start.setHours(0, 0, 0, 0);

    var cells = [];
    for (var d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      cells.push(dayKey(d));
    }
    // 平铺：从早到晚一行排开，每格下标注训练时长
    var grid = $('heat-grid');
    grid.innerHTML = '';
    var hover = window.matchMedia('(hover: hover)').matches;
    cells.forEach(function (k) {
      var sec = entrySec(k);
      var lvl = 0;
      if (sec > 0) {
        var mins = sec / 60;
        lvl = mins < 10 ? 1 : mins < 25 ? 2 : mins < 40 ? 3 : 4;
      }
      var cell = document.createElement('div');
      cell.className = 'flat-cell';
      var box = document.createElement('button');
      box.className = 'cell';
      if (lvl) box.classList.add('l' + lvl);
      if (isToday(k)) box.classList.add('today');
      box.dataset.k = k;
      if (hover) {
        // 鼠标设备：悬停显示
        box.addEventListener('mouseenter', function () { showTip(box, k); });
        box.addEventListener('mouseleave', hideTip);
      }
      // 点按或键盘激活：显示 / 再次激活关闭
      box.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleTip(box, k);
      });
      box.setAttribute('aria-label', k + '，' + (sec ? fmtDuration(sec) : '无训练'));
      var cap = document.createElement('span');
      cap.className = 'cell-cap';
      cap.textContent = fmtShort(sec);
      cell.appendChild(box);
      cell.appendChild(cap);
      grid.appendChild(cell);
    });
  }

  function entrySec(k) {
    return Model.entrySec(log[k]);
  }
  function entryHasContent(k) {
    return Model.entryHasContent(log[k]);
  }
  function contentKeys() {
    return Model.summarize(log, Date.now()).contentKeys;
  }
  function totalAllSec() {
    return Model.summarize(log, Date.now()).totalSeconds;
  }
  function weekSec() {
    return Model.summarize(log, Date.now()).weekSeconds;
  }
  function monthDays() {
    return Model.summarize(log, Date.now()).monthDays;
  }
  function cardioCount() {
    return Model.summarize(log, Date.now()).cardioCount;
  }
  function statTile(v, k) {
    return '<div class="stat"><div class="v">' + v + '</div><div class="k">' + k + '</div></div>';
  }
  var shownFor = null; // 触屏上当前点开的单元格
  function toggleTip(el, k) {
    if (shownFor === el) { hideTip(); return; }
    showTip(el, k);
  }
  function showTip(el, k) {
    var t = $('tooltip');
    var e = log[k];
    var sec = entrySec(k);
    var title = k + (isToday(k) ? ' · 今天' : ' · ' + weekdayName(k));
    var body;
    if (!e || !e.plan || (!sec && !(e.plan.some(function (a) { return a.cardio && a.sets[0].done; })))) {
      body = '<div class="tt-title">' + title + '</div><div>无训练</div>';
    } else {
      var acts = e.plan.map(function (a) {
        var dn = a.sets.filter(function (st) { return st.done; }).length;
        var sk = a.sets.filter(function (st) { return st.skipped; }).length;
        if (a.cardio) return esc(a.name) + (a.sets[0].done && a.sets[0].sec ? ' ✓ ' + fmtHM(a.sets[0].sec) : ' ✓');
        return esc(a.name) + ' ' + dn + ' 组' + (sk ? '（跳过' + sk + '）' : '');
      }).join(' · ');
      body = '<div class="tt-title">' + title + '</div><div>' + fmtDuration(sec) + (e.completedAt ? ' · 完成' : ' · 未完') + '</div>' +
        (acts ? '<div class="tt-sub">' + acts + '</div>' : '');
    }
    t.innerHTML = body;
    t.classList.add('show');
    var r = el.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var halfW = (t.offsetWidth || 160) / 2 + 4; // 按实际宽度居中并防止越界
    t.style.left = Math.min(Math.max(cx, halfW), window.innerWidth - halfW) + 'px';
    // 上方会被吸顶顶栏遮挡时，翻转到单元格下方显示
    var ttH = t.offsetHeight || 56;
    var bar = document.querySelector('.topbar');
    var barH = (bar ? bar.getBoundingClientRect().height : 0) + 6;
    if (r.top - 8 - ttH < barH && r.bottom + 8 + ttH <= window.innerHeight) {
      t.style.top = (r.bottom + 8) + 'px';
      t.style.transform = 'translate(-50%, 0)';
    } else {
      t.style.top = (r.top - 8) + 'px';
      t.style.transform = 'translate(-50%, -100%)';
    }
    shownFor = el;
  }
  function hideTip() {
    $('tooltip').classList.remove('show');
    shownFor = null;
  }

  /* ---------- 历史 ---------- */
  function renderHistory() {
    var keys = contentKeys().sort().reverse();
    var list = $('hist-list');
    $('hist-sub').textContent = keys.length + ' 条记录';
    if (!keys.length) {
      list.innerHTML = '<div class="empty-hint"><b>还没有训练记录</b><br>去「今日训练」完成第一组吧</div>';
      return;
    }
    list.innerHTML = keys.map(function (k) {
      var e = log[k];
      var sec = entrySec(k);
      var acts = e.plan ? e.plan.map(function (a) {
        var dn = a.sets.filter(function (st) { return st.done; }).length;
        var sk = a.sets.filter(function (st) { return st.skipped; }).length;
        if (a.cardio) return esc(a.name) + (a.sets[0].done ? ' ✓' : ' 未做');
        return esc(a.name) + ' ' + dn + '/' + a.sets.length + ' 组' + (sk ? '（跳过' + sk + '）' : '');
      }).join('，') : '';
      var dist = e.distKm != null ? ' · ' + e.distKm + 'km' : '';
      var detail = e.plan ? e.plan.map(function (a) {
        if (a.cardio) {
          return '<div class="dex"><span class="nm">' + esc(a.name) + '</span>' +
            '<span class="st">' + (a.sets[0].done ? '✓ 完成 · ' + fmtHM(a.sets[0].sec) : '未做') + '</span></div>';
        }
        return a.sets.map(function (st, j) {
          return '<div class="dex"><span class="nm">' + esc(a.name) + ' 第 ' + (j + 1) + ' 组</span>' +
            '<span class="st">' + (st.skipped ? '跳过' : st.count + ' ' + a.unit + (st.done ? ' · ' + fmtHM(st.sec) : ' · 未做')) + '</span></div>';
        }).join('');
      }).join('') : '';
      return '<div class="hist-item"><details><summary><div class="hist-main">' +
        '<span class="hist-date">' + k + '<small>' + (isToday(k) ? '今天' : weekdayName(k)) + '</small></span>' +
        '<span class="hist-ex">' + acts + '</span>' +
        '<span class="hist-time">' + fmtDuration(sec) + dist + '</span></div></summary>' +
        '<div class="hist-detail">' + detail +
        '<button class="btn ghost small hist-del" data-k="' + k + '">删除这一天</button>' +
        '</div></details></div>';
    }).join('');

    list.querySelectorAll('.hist-del').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.k;
        if (confirm('删除 ' + k + ' 的训练记录？此操作不可恢复。')) {
          delete log[k];
          saveLog();
          renderHistory();
          renderHeat();
          toast('已删除 ' + k);
        }
      });
    });
  }

  /* ---------- 设置 ---------- */
  function openSettings() {
    var box = $('set-defaults');
    box.innerHTML = '';
    BASE_EXERCISES.forEach(function (e) {
      var row = document.createElement('div');
      row.className = 'set-row';
      row.innerHTML = '<label>' + esc(e.name) + '</label>' +
        '<input type="number" min="1" max="999" data-id="' + e.id + '" value="' + settings.targets[e.id] + '">' +
        '<span class="unit">' + e.unit + '</span>';
      box.appendChild(row);
    });
    $('set-alt').checked = settings.autoAlt;
    $('set-rest').value = settings.restSeconds;
    $('set-hint').textContent = '目标为每组默认值，训练中也可以临时增减。组间休息会显示该建议时长；自动轮换开启后，每天会默认建议和上次不同的有氧项目。';
    $('dlg-settings').showModal();
  }

  function saveSettingsFromDialog() {
    var changed = false;
    document.querySelectorAll('#set-defaults input[type=number]').forEach(function (inp) {
      var v = parseInt(inp.value, 10);
      if (!isNaN(v) && v >= 1) {
        if (settings.targets[inp.dataset.id] !== v) changed = true;
        settings.targets[inp.dataset.id] = v;
      }
    });
    var alt = $('set-alt').checked;
    if (settings.autoAlt !== alt) changed = true;
    settings.autoAlt = alt;
    var restSeconds = parseInt($('set-rest').value, 10);
    if (!isNaN(restSeconds)) {
      restSeconds = Math.max(1, Math.min(600, restSeconds));
      if (settings.restSeconds !== restSeconds) changed = true;
      settings.restSeconds = restSeconds;
    }
    saveSettings();
    $('dlg-settings').close();
    toast(changed ? '设置已保存；今天的计划保持不变，明天生效' : '设置已保存');
  }

  /* ---------- 提示条 ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ---------- 全局事件 ---------- */
  var currentView = 'today';

  function renderCurrentView() {
    if (currentView === 'heat') renderHeat();
    else if (currentView === 'history') renderHistory();
    else renderToday();
  }

  function wireGlobal() {
    document.querySelectorAll('.tab').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.dataset.view;
        currentView = v;
        document.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('active', x === b); });
        ['today', 'heat', 'history'].forEach(function (id) {
          $('view-' + id).hidden = id !== v;
        });
        if (v === 'today') renderToday();
        if (v === 'heat') renderHeat();
        if (v === 'history') renderHistory();
      });
    });
    $('btn-pause').addEventListener('click', togglePause);
    $('btn-settings').addEventListener('click', openSettings);
    $('set-save').addEventListener('click', saveSettingsFromDialog);
    $('set-cancel').addEventListener('click', function () { $('dlg-settings').close(); });
    $('finish-early').addEventListener('click', function () {
      if (confirm('提前结束今天的训练？今天已完成的部分会被记录。')) {
        finishDay();
      }
    });
    // 点热力图以外的区域 / 滚动页面时收起浮层
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.flat-cell')) hideTip();
    });
    window.addEventListener('scroll', hideTip, { passive: true });
    document.addEventListener('keydown', function (e) {
      if (e.code !== 'Space') return;
      var tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'SELECT') return;
      e.preventDefault();
      togglePause();
    });
    // 退出页面/切后台时把进行中的计时与位置冻结保存，回来可继续
    window.addEventListener('pagehide', saveSession);
    window.addEventListener('beforeunload', saveSession);
    window.addEventListener('training:data-change', function (event) {
      if (S.running || S.resting) {
        if (event.detail && event.detail.reset) {
          persistenceSuspended = true;
          syncReloadPending = true;
          clearSession();
          return;
        }
        if (persistenceSuspended) return;
        var activeEntry = S.date ? log[S.date] : null;
        var stored = Model.load(localStorage);
        settings = stored.settings;
        log = stored.log;
        if (activeEntry) log[S.date] = activeEntry;
        return;
      }
      applySyncedDataChange();
    });
  }

  function applySyncedDataChange() {
    persistenceSuspended = false;
    syncReloadPending = false;
    load();
    initToday();
    renderToday();
    if (!S.finished && allDone()) finishDay();
    if (currentView !== 'today') renderCurrentView();
    if (S.paused && !S.finished) syncPauseUI(true);
  }

  /* ---------- 启动 ---------- */
  function boot() {
    load();
    initToday();
    wireGlobal();
    renderToday();
    if (!S.finished && allDone()) finishDay();
    if (S.paused && !S.finished) syncPauseUI(true);
    startTicker();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
