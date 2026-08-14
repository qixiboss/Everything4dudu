/* ============================================================
   训练记录 — 应用逻辑（移动端优先）
   - 每日计划：前四项 × 4 组 + 跑步/骑行（手动设定时长后记录）
   - 每组正向计时 → 点「开始休息」记录本组 → 休息正向计时
     → 点「完成休息，开始下一组」→ 自动开始下一组
   - 数据保存在 localStorage
   ============================================================ */
(function () {
  'use strict';

  var SETTINGS_KEY = 'train.settings';
  var LOG_KEY = 'train.log';

  /* ---------- 动作定义 ---------- */
  var BASE_EXERCISES = [
    { id: 'pushup',  name: '俯卧撑',   unit: '个', target: 20 },
    { id: 'abwheel', name: '健腹轮',   unit: '个', target: 10 },
    { id: 'hanglegg',name: '悬挂举腿', unit: '个', target: 10 },
    { id: 'pullup',  name: '引体向上', unit: '个', target: 8 },
  ];
  var CARDIO_LIST = [
    { id: 'run',  name: '跑步', emoji: '🏃' },
    { id: 'ride', name: '骑行', emoji: '🚴' },
  ];
  function cardioOf(id) {
    for (var i = 0; i < CARDIO_LIST.length; i++) {
      if (CARDIO_LIST[i].id === id) return CARDIO_LIST[i];
    }
    return CARDIO_LIST[0];
  }

  /* ---------- 存储 ---------- */
  var settings = {
    targets: { pushup: 20, abwheel: 10, hanglegg: 10, pullup: 8 },
    autoAlt: false,      // 有氧自动轮换（默认建议上次的反向）
    restSeconds: 60,     // 组间建议休息时长
  };
  var log = {};          // { '2026-08-10': {...} }

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
      if (s) {
        settings.targets = Object.assign(settings.targets, s.targets || {});
        if (typeof s.autoAlt === 'boolean') settings.autoAlt = s.autoAlt;
        if (Number.isInteger(s.restSeconds) && s.restSeconds >= 1 && s.restSeconds <= 600) {
          settings.restSeconds = s.restSeconds;
        }
      }
      var l = JSON.parse(localStorage.getItem(LOG_KEY));
      if (l && typeof l === 'object') log = l;
    } catch (e) { /* 忽略损坏数据 */ }
  }
  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
  function saveLog() {
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  }

  /* ---------- 日期工具 ---------- */
  function dayKey(d) {
    var x = d || new Date();
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  }
  function todayKey() { return dayKey(); }
  function isToday(k) { return k === todayKey(); }
  function fmtHM(sec) {
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + String(s).padStart(2, '0');
  }
  function fmtDuration(sec) {
    sec = Math.round(sec);
    if (sec < 60) return sec + ' 秒';
    var m = Math.floor(sec / 60);
    if (m < 60) return m + ' 分钟';
    return Math.floor(m / 60) + ' 小时 ' + (m % 60) + ' 分';
  }
  function fmtShort(sec) {
    sec = Math.round(sec);
    if (sec <= 0) return '—';
    if (sec < 60) return sec + '秒';
    var m = Math.floor(sec / 60);
    if (m < 60) return m + '分';
    return Math.floor(m / 60) + '时' + (m % 60) + '分';
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
  function weekdayName(k) {
    var d = new Date(k + 'T00:00:00');
    return isNaN(d) ? '' : '周' + WEEKDAYS[d.getDay()];
  }

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
    var acts = BASE_EXERCISES.map(function (e) {
      return {
        id: e.id, name: e.name, unit: e.unit,
        target: settings.targets[e.id] || e.target,
        sets: [
          { done: false, count: settings.targets[e.id] || e.target, sec: 0 },
          { done: false, count: settings.targets[e.id] || e.target, sec: 0 },
          { done: false, count: settings.targets[e.id] || e.target, sec: 0 },
          { done: false, count: settings.targets[e.id] || e.target, sec: 0 },
        ],
      };
    });
    acts.push({
      id: S.cardioId, name: cardioOf(S.cardioId).name, unit: '', target: 0,
      sets: [{ done: false, count: 0, sec: 0 }],
      cardio: true,
    });
    return acts;
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
  function normCardio(v) {
    if (v === 0) return 'run';
    if (v === 1) return 'ride';
    if (v === 'run' || v === 'ride') return v;
    return 'run';
  }

  function pickCardio() {
    // 最近一次有记录的训练里选了哪种有氧，就轮换成另一个
    var keys = Object.keys(log).sort();
    for (var i = keys.length - 1; i >= 0; i--) {
      var e = log[keys[i]];
      if (e && e.cardio != null && e.plan && e.plan.some(function (a) { return a.cardio; })) {
        var last = normCardio(e.cardio);
        return last === 'run' ? 'ride' : 'run';
      }
    }
    return 'run';
  }

  function initToday() {
    var k = todayKey();
    S.date = k;
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
    for (var i = 0; i < S.plan.length; i++) {
      var a = S.plan[i];
      for (var j = 0; j < a.sets.length; j++) {
        if (!a.sets[j].done) return [i, j];
      }
    }
    return null;
  }
  function allDone() {
    return S.plan.every(function (a) {
      return a.sets.every(function (st) { return st.done; });
    });
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
      var doneN = 0;
      a.sets.forEach(function (st) { if (st.done) doneN++; });
      var isDone = doneN === a.sets.length;
      var isCur = i === S.exIdx;
      var sub;
      if (a.cardio) {
        sub = isDone ? '✓ 已记录' : '选择跑步或骑行';
      } else {
        sub = doneN + ' / ' + a.sets.length + ' 组';
      }
      var dots = '';
      if (!a.cardio) {
        dots = a.sets.map(function (st, j) {
          return '<span class="dot ' + (st.done ? 'done' : '') + (isCur && j === S.setIdx && !st.done ? ' ring' : '') + '"></span>';
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
      '<button type="button" class="timer' + (S.running ? ' live' : '') + (S.resting ? ' rest' : '') + '" id="timer-box"' +
      (S.resting ? ' disabled' : '') + ' aria-label="' + (S.resting ? '组间休息计时' : (S.running ? '暂停本组计时' : '开始本组计时')) + '">' +
      (S.running ? '<span class="live-dot blink"></span>' : '') +
      (S.resting ? '<span class="rest-dot"></span>' : '') +
      '<span id="timer">' + fmtHM(timerSec) + '</span></button>' +
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
    var sd = $('step-down');
    if (sd) sd.addEventListener('click', function () { stepCount(-1); });
    var su = $('step-up');
    if (su) su.addEventListener('click', function () { stepCount(1); });
  }

  function freezeTimers() {
    if (S.running && S.setStart) {
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
    if (S.resting && S.restStart) {
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
        sum = a.sets.map(function (st) { return st.count; }).join(' · ') +
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
    tickInterval = setInterval(function () {
      if (S.finished || S.paused) return;
      if (S.running && S.setStart) {
        S.setElapsed = S.setAccum + (Date.now() - S.setStart) / 1000;
      }
      if (S.resting && S.restStart) {
        S.restElapsed = S.restAccum + (Date.now() - S.restStart) / 1000;
      }
      updateTimers();
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
    var e = log[k];
    if (!e || !e.plan) return 0;
    return e.plan.reduce(function (s, a) {
      return s + a.sets.reduce(function (x, st) { return x + st.sec; }, 0);
    }, 0);
  }
  /* 这一天是否有真实训练内容（任一组完成或做过有氧） */
  function entryHasContent(k) {
    var e = log[k];
    if (!e || !e.plan) return false;
    return e.plan.some(function (a) {
      return a.sets.some(function (st) { return st.done; });
    });
  }
  function contentKeys() {
    return Object.keys(log).filter(entryHasContent);
  }
  function totalAllSec() {
    return Object.keys(log).reduce(function (s, k) { return s + entrySec(k); }, 0);
  }
  function weekSec() {
    var now = Date.now();
    return Object.keys(log).reduce(function (s, k) {
      var d = new Date(k + 'T00:00:00');
      return s + (now - d < 7 * 86400000 ? entrySec(k) : 0);
    }, 0);
  }
  function monthDays() {
    var now = Date.now();
    return Object.keys(log).filter(function (k) {
      return now - new Date(k + 'T00:00:00') < 30 * 86400000;
    }).length;
  }
  function cardioCount() {
    var n = 0;
    Object.keys(log).forEach(function (k) {
      var e = log[k];
      if (e && e.plan && e.plan.some(function (a) { return a.cardio && a.sets[0].done; })) n++;
    });
    return n;
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
        if (a.cardio) return esc(a.name) + (a.sets[0].done && a.sets[0].sec ? ' ✓ ' + fmtHM(a.sets[0].sec) : ' ✓');
        return esc(a.name) + ' ' + dn + ' 组';
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
        if (a.cardio) return esc(a.name) + (a.sets[0].done ? ' ✓' : ' 未做');
        return esc(a.name) + ' ' + dn + '/' + a.sets.length + ' 组';
      }).join('，') : '';
      var dist = e.distKm != null ? ' · ' + e.distKm + 'km' : '';
      var detail = e.plan ? e.plan.map(function (a) {
        if (a.cardio) {
          return '<div class="dex"><span class="nm">' + esc(a.name) + '</span>' +
            '<span class="st">' + (a.sets[0].done ? '✓ 完成 · ' + fmtHM(a.sets[0].sec) : '未做') + '</span></div>';
        }
        return a.sets.map(function (st, j) {
          return '<div class="dex"><span class="nm">' + esc(a.name) + ' 第 ' + (j + 1) + ' 组</span>' +
            '<span class="st">' + st.count + ' ' + a.unit + (st.done ? ' · ' + fmtHM(st.sec) : ' · 未做') + '</span></div>';
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
  function wireGlobal() {
    document.querySelectorAll('.tab').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.dataset.view;
        document.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('active', x === b); });
        ['today', 'heat', 'history'].forEach(function (id) {
          $('view-' + id).hidden = id !== v;
        });
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
  }

  /* ---------- 启动 ---------- */
  function boot() {
    load();
    initToday();
    wireGlobal();
    renderToday();
    startTicker();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
