/* ============================================================
 * Module: LearningProgress v2
 * 规范词条、FSRS-6 三档评分、统一星标、栏目完成记录与旧档案迁移。
 * ============================================================ */
WordTales.LearningProgress = (function() {
  var STORAGE_KEY = 'wordtales.learning.v1';
  var MIGRATION_KEY = 'wordtales.learning.v2-migrated';
  var DB_NAME = 'wordtales-learning';
  var DB_VERSION = 1;
  var MAX_SUBMISSIONS = 400;
  var data = null;
  var database = null;
  var persistenceMode = 'localStorage';
  var ready = false;
  var pending = [];
  var saveTimer = null;
  var articleObserver = null;
  var columnIndex = Object.create(null);
  var paragraphIndex = Object.create(null);

  var scheduler = window.FSRS && window.FSRS.fsrs ? window.FSRS.fsrs({
    request_retention: 0.9,
    maximum_interval: 36500,
    enable_fuzz: false,
    enable_short_term: false,
    learning_steps: [],
    relearning_steps: []
  }) : null;

  function nowIso() { return new Date().toISOString(); }
  function dayKey(date) {
    var d = date || new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function addDays(date, days) { return new Date(date.getTime() + days * 86400000); }
  function validDate(value) {
    var date = value ? new Date(value) : null;
    return date && !isNaN(date.getTime()) ? date : null;
  }
  function freshData() {
    return {
      version: 2,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      words: {},
      articles: {},
      analyses: {},
      days: {},
      columnCompletions: {},
      reminders: { lastShown: '', notifications: false },
      processedSubmissions: [],
      events: []
    };
  }
  function emptyFsrsCard(at) {
    var now = at || new Date();
    if (window.FSRS && window.FSRS.createEmptyCard) return serializeCard(window.FSRS.createEmptyCard(now));
    return {
      due: now.toISOString(), stability: 0, difficulty: 0, elapsed_days: 0,
      scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null
    };
  }
  function serializeCard(card) {
    return {
      due: validDate(card.due) ? new Date(card.due).toISOString() : nowIso(),
      stability: Number(card.stability) || 0,
      difficulty: Number(card.difficulty) || 0,
      elapsed_days: Number(card.elapsed_days) || 0,
      scheduled_days: Number(card.scheduled_days) || 0,
      reps: Number(card.reps) || 0,
      lapses: Number(card.lapses) || 0,
      learning_steps: Number(card.learning_steps) || 0,
      state: Number(card.state) || 0,
      last_review: validDate(card.last_review) ? new Date(card.last_review).toISOString() : null
    };
  }
  function reviveCard(card) {
    var value = card || emptyFsrsCard(new Date());
    return {
      due: validDate(value.due) || new Date(),
      stability: Number(value.stability) || 0,
      difficulty: Number(value.difficulty) || 0,
      elapsed_days: Number(value.elapsed_days) || 0,
      scheduled_days: Number(value.scheduled_days) || 0,
      reps: Number(value.reps) || 0,
      lapses: Number(value.lapses) || 0,
      learning_steps: Number(value.learning_steps) || 0,
      state: Number(value.state) || 0,
      last_review: validDate(value.last_review)
    };
  }
  function createRecord(entryId, at) {
    var entry = WordTales.Data.getEntry(entryId);
    var timestamp = (at || new Date()).toISOString();
    return {
      entryId: entryId,
      firstSeenAt: timestamp,
      lastSeenAt: timestamp,
      lastReviewedAt: '',
      nextReviewAt: '',
      lastResult: '',
      reviewCount: 0,
      lapseCount: 0,
      successStreak: 0,
      clickCount: 0,
      cardFlipCount: 0,
      isStarred: false,
      starredAt: '',
      starReason: '',
      sourceOccurrenceId: entry ? entry.primaryOccurrenceId : entryId,
      fsrsCard: emptyFsrsCard(at || new Date())
    };
  }
  function normalizeRecord(entryId, record) {
    var result = Object.assign(createRecord(entryId, validDate(record.firstSeenAt || record.firstSeen) || new Date()), record || {});
    result.entryId = entryId;
    result.firstSeenAt = result.firstSeenAt || result.firstSeen || nowIso();
    result.lastSeenAt = result.lastSeenAt || result.lastSeen || result.firstSeenAt;
    result.lastReviewedAt = result.lastReviewedAt || result.lastReview || '';
    result.nextReviewAt = result.nextReviewAt || result.nextReview || '';
    result.reviewCount = Number(result.reviewCount) || 0;
    result.lapseCount = Number(result.lapseCount != null ? result.lapseCount : result.lapses) || 0;
    result.successStreak = Number(result.successStreak) || 0;
    result.clickCount = Number(result.clickCount) || 0;
    result.cardFlipCount = Number(result.cardFlipCount) || 0;
    result.isStarred = !!result.isStarred;
    result.fsrsCard = serializeCard(result.fsrsCard || {
      due: result.nextReviewAt || nowIso(),
      stability: result.stabilityDays || result.intervalDays || 1,
      difficulty: result.difficulty || 5,
      elapsed_days: result.intervalDays || 0,
      scheduled_days: result.intervalDays || 1,
      reps: result.reviewCount || 0,
      lapses: result.lapseCount || 0,
      learning_steps: 0,
      state: result.reviewCount || result.nextReviewAt ? (window.FSRS ? window.FSRS.State.Review : 2) : (window.FSRS ? window.FSRS.State.Learning : 1),
      last_review: result.lastReviewedAt || null
    });
    if (!result.nextReviewAt && result.fsrsCard.reps > 0) result.nextReviewAt = result.fsrsCard.due;
    return result;
  }
  function chooseEarlier(a, b) {
    var ad = validDate(a); var bd = validDate(b);
    if (!ad) return b || '';
    if (!bd) return a || '';
    return ad <= bd ? a : b;
  }
  function chooseLater(a, b) {
    var ad = validDate(a); var bd = validDate(b);
    if (!ad) return b || '';
    if (!bd) return a || '';
    return ad >= bd ? a : b;
  }
  function mergeLegacyRecord(target, incoming) {
    target.firstSeenAt = chooseEarlier(target.firstSeenAt, incoming.firstSeenAt);
    target.lastSeenAt = chooseLater(target.lastSeenAt, incoming.lastSeenAt);
    target.lastReviewedAt = chooseLater(target.lastReviewedAt, incoming.lastReviewedAt);
    target.nextReviewAt = chooseEarlier(target.nextReviewAt, incoming.nextReviewAt);
    target.reviewCount += incoming.reviewCount;
    target.lapseCount += incoming.lapseCount;
    target.clickCount += incoming.clickCount;
    target.cardFlipCount += incoming.cardFlipCount;
    target.successStreak = Math.min(target.successStreak || Infinity, incoming.successStreak || 0);
    if (!isFinite(target.successStreak)) target.successStreak = 0;
    target.isStarred = target.isStarred || incoming.isStarred;
    if (incoming.isStarred) {
      target.starredAt = chooseLater(target.starredAt, incoming.starredAt || incoming.lastSeenAt);
      target.starReason = incoming.starReason || 'legacy';
    }
    var targetLatest = validDate(target.lastReviewedAt || target.lastSeenAt);
    var incomingLatest = validDate(incoming.lastReviewedAt || incoming.lastSeenAt);
    if (incomingLatest && (!targetLatest || incomingLatest >= targetLatest)) target.lastResult = incoming.lastResult || incoming.lastAction || target.lastResult;
    target.fsrsCard.stability = Math.min(target.fsrsCard.stability || Infinity, incoming.fsrsCard.stability || Infinity);
    if (!isFinite(target.fsrsCard.stability)) target.fsrsCard.stability = 1;
    target.fsrsCard.difficulty = Math.max(target.fsrsCard.difficulty || 0, incoming.fsrsCard.difficulty || 0);
    target.fsrsCard.reps = target.reviewCount;
    target.fsrsCard.lapses = target.lapseCount;
    target.fsrsCard.due = target.nextReviewAt || target.fsrsCard.due;
    target.fsrsCard.last_review = target.lastReviewedAt || target.fsrsCard.last_review;
    target.fsrsCard.state = target.reviewCount ? (window.FSRS ? window.FSRS.State.Review : 2) : (window.FSRS ? window.FSRS.State.Learning : 1);
  }
  function completionDayKey(value) {
    if (value == null) return dayKey();
    if (Object.prototype.toString.call(value) === '[object Date]') {
      return isNaN(value.getTime()) ? '' : dayKey(value);
    }
    var match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return '';
    var date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return '';
    return dayKey(date);
  }
  function normalizeColumnCompletions(candidate) {
    var normalized = {};
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return normalized;
    Object.keys(candidate).forEach(function(dateKey) {
      var normalizedDate = completionDayKey(dateKey);
      var cells = candidate[dateKey];
      if (!normalizedDate || normalizedDate !== dateKey || !cells || typeof cells !== 'object' || Array.isArray(cells)) return;
      Object.keys(cells).forEach(function(columnId) {
        if (cells[columnId] !== true || !WordTales.Data.getColumn(columnId)) return;
        if (!normalized[normalizedDate]) normalized[normalizedDate] = {};
        normalized[normalizedDate][columnId] = true;
      });
    });
    return normalized;
  }
  function migrateCandidate(candidate) {
    if (!candidate || (candidate.version !== 1 && candidate.version !== 2)) return freshData();
    var store = freshData();
    store.createdAt = candidate.createdAt || store.createdAt;
    /* 旧档案没有更新时间时保持“未知”，避免每次迁移都伪造一个最新时间并覆盖 IndexedDB。 */
    store.updatedAt = candidate.updatedAt || candidate.createdAt || '';
    store.articles = candidate.articles || {};
    store.analyses = candidate.analyses || {};
    store.days = candidate.days || {};
    store.columnCompletions = normalizeColumnCompletions(candidate.columnCompletions);
    store.reminders = candidate.reminders || store.reminders;
    store.starMigrationV2 = !!candidate.starMigrationV2;
    store.processedSubmissions = Array.isArray(candidate.processedSubmissions) ? candidate.processedSubmissions.slice(-MAX_SUBMISSIONS) : [];
    store.events = Array.isArray(candidate.events) ? candidate.events.slice() : [];
    Object.keys(candidate.words || {}).forEach(function(oldId) {
      var entryId = WordTales.Data.resolveEntryId(oldId);
      if (!WordTales.Data.getEntry(entryId)) return;
      var incoming = normalizeRecord(entryId, candidate.words[oldId]);
      if (!store.words[entryId]) store.words[entryId] = incoming;
      else mergeLegacyRecord(store.words[entryId], incoming);
    });
    return store;
  }
  function loadFallback() {
    var parsed = null;
    try { parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) {}
    if (!parsed) {
      var empty = freshData();
      /* 缺少 localStorage 档案不等于“刚刚产生了一份更新档案”。 */
      empty.updatedAt = '';
      return empty;
    }
    return migrateCandidate(parsed);
  }
  function snapshot() {
    return JSON.parse(JSON.stringify(load()));
  }
  function scheduleCloudSync() {
    if (WordTales.CloudSync && WordTales.CloudSync.schedule) WordTales.CloudSync.schedule();
  }
  function load() {
    if (!data) data = loadFallback();
    return data;
  }
  function requestToPromise(request) {
    return new Promise(function(resolve, reject) {
      request.onsuccess = function() { resolve(request.result); };
      request.onerror = function() { reject(request.error || new Error('IndexedDB request failed')); };
    });
  }
  function openDatabase() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB unavailable'));
    return new Promise(function(resolve, reject) {
      var request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function() {
        var db = request.result;
        if (!db.objectStoreNames.contains('profiles')) db.createObjectStore('profiles', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('events')) {
          var events = db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
          events.createIndex('day', 'day', { unique: false });
          events.createIndex('type', 'type', { unique: false });
          events.createIndex('at', 'at', { unique: false });
        }
      };
      request.onsuccess = function() { database = request.result; resolve(database); };
      request.onerror = function() { reject(request.error || new Error('Unable to open IndexedDB')); };
      request.onblocked = function() { reject(new Error('IndexedDB upgrade blocked')); };
    });
  }
  function writeProfileNow() {
    if (!database || persistenceMode !== 'indexedDB') return Promise.resolve();
    return new Promise(function(resolve, reject) {
      var tx;
      try { tx = database.transaction('profiles', 'readwrite'); } catch (e) { reject(e); return; }
      tx.objectStore('profiles').put({ id: 'current', updatedAt: load().updatedAt, data: snapshot() });
      tx.oncomplete = function() { resolve(true); };
      tx.onerror = function() { reject(tx.error || new Error('Profile save failed')); };
      tx.onabort = function() { reject(tx.error || new Error('Profile save aborted')); };
    });
  }
  function saveFallback() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(load())); return true; } catch (e) { return false; }
  }
  function saveSoon() {
    load().updatedAt = nowIso();
    mirrorLegacyStars();
    if (persistenceMode !== 'indexedDB' || !database) { saveFallback(); scheduleCloudSync(); return; }
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function() {
      saveTimer = null;
      writeProfileNow().then(scheduleCloudSync).catch(function() { persistenceMode = 'localStorage'; saveFallback(); scheduleCloudSync(); });
    }, 180);
  }
  function saveProfileNow() {
    load().updatedAt = nowIso();
    mirrorLegacyStars();
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    if (!database || persistenceMode !== 'indexedDB') {
      var fallbackSaved = saveFallback();
      if (fallbackSaved) scheduleCloudSync();
      return Promise.resolve(fallbackSaved);
    }
    try {
      return writeProfileNow().then(function() { scheduleCloudSync(); return true; }).catch(function() {
        persistenceMode = 'localStorage';
        var saved = saveFallback();
        if (saved) scheduleCloudSync();
        return saved;
      });
    } catch (e) {
      persistenceMode = 'localStorage';
      var fallbackSaved = saveFallback();
      if (fallbackSaved) scheduleCloudSync();
      return Promise.resolve(fallbackSaved);
    }
  }
  function commitReview(event) {
    load().updatedAt = nowIso();
    mirrorLegacyStars();
    if (!database || persistenceMode !== 'indexedDB') {
      var fallbackSaved = saveFallback();
      if (fallbackSaved) scheduleCloudSync();
      return Promise.resolve(fallbackSaved);
    }
    return new Promise(function(resolve, reject) {
      var tx;
      try { tx = database.transaction(['profiles', 'events'], 'readwrite'); } catch (e) { reject(e); return; }
      tx.objectStore('profiles').put({ id: 'current', updatedAt: load().updatedAt, data: snapshot() });
      tx.objectStore('events').add(event);
      tx.oncomplete = function() { scheduleCloudSync(); resolve(true); };
      tx.onerror = function() { reject(tx.error || new Error('Review commit failed')); };
      tx.onabort = function() { reject(tx.error || new Error('Review commit aborted')); };
    }).catch(function() {
      persistenceMode = 'localStorage';
      return saveFallback();
    });
  }
  function hydrate() {
    var fallback = loadFallback();
    return openDatabase().then(function(db) {
      return requestToPromise(db.transaction('profiles', 'readonly').objectStore('profiles').get('current')).then(function(saved) {
        var savedAt = saved ? new Date(saved.updatedAt || 0).getTime() : 0;
        var fallbackAt = fallback.updatedAt ? new Date(fallback.updatedAt).getTime() : 0;
        if (!isFinite(savedAt)) savedAt = 0;
        if (!isFinite(fallbackAt)) fallbackAt = 0;
        data = saved && savedAt >= fallbackAt ? migrateCandidate(saved.data) : fallback;
        persistenceMode = 'indexedDB';
        return writeProfileNow();
      });
    }).catch(function() { data = fallback; persistenceMode = 'localStorage'; });
  }
  function replaceData(candidate) {
    data = candidate ? migrateCandidate(candidate) : freshData();
    data.updatedAt = candidate && candidate.updatedAt ? candidate.updatedAt : nowIso();
    mirrorLegacyStars();
    if (!database || persistenceMode !== 'indexedDB') return Promise.resolve(saveFallback());
    return writeProfileNow().then(function() { return true; }).catch(function() {
      persistenceMode = 'localStorage';
      return saveFallback();
    });
  }
  function ensureDay() {
    var key = dayKey();
    var days = load().days;
    if (!days[key]) days[key] = { wordClicks: 0, cardFlips: 0, good: 0, hard: 0, again: 0, known: 0, unfamiliar: 0, articles: 0, analyses: 0 };
    days[key].good = Number(days[key].good) || 0;
    days[key].hard = Number(days[key].hard) || 0;
    days[key].again = Number(days[key].again) || 0;
    return days[key];
  }
  function buildIndexes() {
    columnIndex = Object.create(null);
    paragraphIndex = Object.create(null);
    WordTales.Data.sets.forEach(function(set) {
      set.columns.forEach(function(column) {
        columnIndex[column.id] = { set: set, column: column };
        column.paragraphs.forEach(function(paragraph) { paragraphIndex[paragraph.id] = { set: set, column: column, paragraph: paragraph }; });
      });
    });
  }
  function ensureRecord(id, at) {
    var entryId = WordTales.Data.resolveEntryId(id);
    if (!WordTales.Data.getEntry(entryId)) return null;
    if (!load().words[entryId]) load().words[entryId] = createRecord(entryId, at || new Date());
    return load().words[entryId];
  }
  function migrateLegacyStars() {
    var store = load();
    var migrationMarked = false;
    try { migrationMarked = localStorage.getItem(MIGRATION_KEY) === '1'; } catch (e) {}
    if (store.starMigrationV2 || migrationMarked) { store.starMigrationV2 = true; return; }
    var values = [];
    try { values = JSON.parse(localStorage.getItem('starredWords') || '[]'); } catch (e) {}
    var lookup = Object.create(null);
    values.forEach(function(value) { lookup[String(value).toLowerCase()] = true; });
    WordTales.Data.getAllEntries().forEach(function(entry) {
      if (!lookup[entry.word.toLowerCase()]) return;
      var record = ensureRecord(entry.id, new Date());
      record.isStarred = true;
      record.starredAt = record.starredAt || nowIso();
      record.starReason = record.starReason || 'legacy';
      if (!record.nextReviewAt) {
        record.nextReviewAt = nowIso();
        record.fsrsCard.due = record.nextReviewAt;
        record.fsrsCard.state = window.FSRS ? window.FSRS.State.Relearning : 3;
      }
    });
    store.starMigrationV2 = true;
    try { localStorage.setItem(MIGRATION_KEY, '1'); } catch (e) {}
    saveSoon();
  }
  function mirrorLegacyStars() {
    var seen = Object.create(null); var words = [];
    Object.keys(load().words).forEach(function(id) {
      var record = load().words[id]; var entry = WordTales.Data.getEntry(id);
      if (!record.isStarred || !entry || seen[entry.word.toLowerCase()]) return;
      seen[entry.word.toLowerCase()] = true; words.push(entry.word);
    });
    try { localStorage.setItem('starredWords', JSON.stringify(words)); } catch (e) {}
  }
  function ratingValue(rating) {
    if (!window.FSRS) return 0;
    if (rating === 'Good') return window.FSRS.Rating.Good;
    if (rating === 'Hard') return window.FSRS.Rating.Hard;
    return window.FSRS.Rating.Again;
  }
  function rateWord(id, rating, meta, submissionId) {
    if (['Good', 'Hard', 'Again'].indexOf(rating) < 0) return Promise.reject(new TypeError('Unsupported learning rating: ' + rating));
    if (!ready) return new Promise(function(resolve, reject) { pending.push(function() { rateWord(id, rating, meta, submissionId).then(resolve, reject); }); });
    var entryId = WordTales.Data.resolveEntryId(id);
    var entry = WordTales.Data.getEntry(entryId);
    if (!entry) return Promise.resolve(null);
    var store = load();
    if (submissionId && store.processedSubmissions.indexOf(submissionId) >= 0) return Promise.resolve(store.words[entryId] || null);
    var now = new Date();
    var record = ensureRecord(entryId, now);
    var currentCard = reviveCard(record.fsrsCard);
    var output;
    if (scheduler) output = scheduler.next(currentCard, now, ratingValue(rating));
    else {
      var interval = rating === 'Good' ? Math.max(3, (currentCard.scheduled_days || 1) * 2.2) : rating === 'Hard' ? Math.max(1, (currentCard.scheduled_days || 1) * 1.3) : 1;
      output = { card: Object.assign(currentCard, { due: addDays(now, interval), scheduled_days: interval, stability: interval, difficulty: rating === 'Again' ? 8 : rating === 'Hard' ? 6 : 4, reps: currentCard.reps + 1, lapses: currentCard.lapses + (rating === 'Again' ? 1 : 0), state: rating === 'Again' ? 3 : 2, last_review: now }) };
    }
    record.fsrsCard = serializeCard(output.card);
    record.lastSeenAt = now.toISOString();
    record.lastReviewedAt = now.toISOString();
    record.nextReviewAt = record.fsrsCard.due;
    record.lastResult = rating;
    record.reviewCount++;
    record.sourceOccurrenceId = meta && meta.occurrenceId ? meta.occurrenceId : record.sourceOccurrenceId;
    if (rating === 'Again') {
      record.lapseCount++;
      record.successStreak = 0;
      record.isStarred = true;
      record.starredAt = now.toISOString();
      record.starReason = 'again';
    } else {
      record.successStreak++;
      record.isStarred = false;
      record.starredAt = '';
      record.starReason = '';
    }
    var today = ensureDay();
    today[rating.toLowerCase()]++;
    if (rating === 'Again') today.unfamiliar = (today.unfamiliar || 0) + 1;
    else today.known = (today.known || 0) + 1;
    if (submissionId) {
      store.processedSubmissions.push(submissionId);
      if (store.processedSubmissions.length > MAX_SUBMISSIONS) store.processedSubmissions.splice(0, store.processedSubmissions.length - MAX_SUBMISSIONS);
    }
    var event = { at: now.toISOString(), day: dayKey(now), type: 'word_rating', targetId: entryId, meta: Object.assign({}, meta || {}, { rating: rating, submissionId: submissionId || '' }) };
    store.events.push(event);
    return commitReview(event).then(function(saved) {
      if (WordTales.Progress && WordTales.Progress.refresh) WordTales.Progress.refresh();
      var value = getEntryState(entryId);
      value.saved = saved !== false;
      return value;
    });
  }
  function exposeWord(id, action, meta) {
    var entryId = WordTales.Data.resolveEntryId(id);
    var record = ensureRecord(entryId, new Date());
    if (!record) return null;
    var now = new Date();
    record.lastSeenAt = now.toISOString();
    if (action === 'click') { record.clickCount++; ensureDay().wordClicks++; }
    if (action === 'card') { record.cardFlipCount++; ensureDay().cardFlips++; }
    if (!record.nextReviewAt) {
      record.nextReviewAt = addDays(now, 1).toISOString();
      record.fsrsCard.due = record.nextReviewAt;
      record.fsrsCard.stability = Math.max(1, record.fsrsCard.stability || 0);
      record.fsrsCard.difficulty = Math.max(5, record.fsrsCard.difficulty || 0);
      record.fsrsCard.state = window.FSRS ? window.FSRS.State.Learning : 1;
    }
    if (meta && meta.occurrenceId) record.sourceOccurrenceId = meta.occurrenceId;
    saveSoon();
    return record;
  }
  function trackWord(id, action, meta) {
    if (!ready) { pending.push(function() { trackWord(id, action, meta); }); return; }
    if (action === 'known' || action === 'review') return rateWord(id, 'Good', meta, 'legacy-' + Date.now() + '-' + Math.random());
    if (action === 'unknown') return rateWord(id, 'Again', meta, 'legacy-' + Date.now() + '-' + Math.random());
    return exposeWord(id, action, meta);
  }
  function setStarred(id, starred, reason) {
    var record = ensureRecord(id, new Date());
    if (!record) return;
    record.isStarred = !!starred;
    record.starredAt = starred ? nowIso() : '';
    record.starReason = starred ? (reason || 'manual') : '';
    saveSoon();
    if (WordTales.Progress && WordTales.Progress.refresh) WordTales.Progress.refresh();
  }
  function getEntryState(id) {
    var entryId = WordTales.Data.resolveEntryId(id);
    var record = load().words[entryId];
    if (!record) return null;
    var value = Object.assign({}, record);
    value.fsrsCard = Object.assign({}, record.fsrsCard);
    value.learningState = getLearningState(record);
    value.retrievability = recallProbability(entryId);
    return value;
  }
  function getLearningState(record) {
    if (!record || !record.reviewCount) return record ? 'learning' : 'new';
    if (record.lastResult === 'Again' || record.fsrsCard.state === (window.FSRS ? window.FSRS.State.Relearning : 3)) return 'relearning';
    if (record.fsrsCard.state === (window.FSRS ? window.FSRS.State.Review : 2) && record.fsrsCard.stability >= 90) return 'mastered';
    return 'review';
  }
  function recallProbability(id, at) {
    var record = load().words[WordTales.Data.resolveEntryId(id)];
    if (!record || !record.lastSeenAt) return null;
    if (scheduler && record.fsrsCard && record.fsrsCard.stability > 0) {
      try { return Number(scheduler.get_retrievability(reviveCard(record.fsrsCard), at || new Date(), false)); } catch (e) {}
    }
    var anchor = validDate(record.lastReviewedAt || record.lastSeenAt);
    var elapsed = anchor ? Math.max(0, ((at || new Date()).getTime() - anchor.getTime()) / 86400000) : 0;
    return Math.max(0, Math.min(1, Math.exp(-elapsed / Math.max(.4, record.fsrsCard.stability || 1))));
  }
  function memoryState(id, at) {
    var record = load().words[WordTales.Data.resolveEntryId(id)];
    if (!record) return 'gray';
    var now = at || new Date();
    var due = validDate(record.nextReviewAt);
    var probability = recallProbability(id, now);
    if ((due && due <= now) || record.lastResult === 'Again') return 'red';
    if ((due && due.getTime() - now.getTime() <= 1.5 * 86400000) || probability < .72) return 'yellow';
    return 'green';
  }
  function occurrenceForRecord(entry, record) {
    return WordTales.Data.getOccurrence(record && record.sourceOccurrenceId) || WordTales.Data.getOccurrence(entry.primaryOccurrenceId) || entry.occurrences[0];
  }
  function getDueEntries(at) {
    var now = at || new Date();
    return WordTales.Data.getAllEntries().map(function(entry) {
      var record = load().words[entry.id];
      if (!record || !record.nextReviewAt || new Date(record.nextReviewAt) > now) return null;
      var occurrence = occurrenceForRecord(entry, record);
      return { entry: entry, record: record, occurrence: occurrence, word: occurrence.word, set: occurrence.set, column: occurrence.column };
    }).filter(Boolean).sort(function(a, b) {
      var overdueA = now.getTime() - new Date(a.record.nextReviewAt).getTime();
      var overdueB = now.getTime() - new Date(b.record.nextReviewAt).getTime();
      if (overdueA !== overdueB) return overdueB - overdueA;
      if (a.record.lapseCount !== b.record.lapseCount) return b.record.lapseCount - a.record.lapseCount;
      var recallA = recallProbability(a.entry.id, now); var recallB = recallProbability(b.entry.id, now);
      if (recallA !== recallB) return recallA - recallB;
      if (a.record.fsrsCard.difficulty !== b.record.fsrsCard.difficulty) return b.record.fsrsCard.difficulty - a.record.fsrsCard.difficulty;
      var lastA = validDate(a.record.lastReviewedAt || a.record.lastSeenAt); var lastB = validDate(b.record.lastReviewedAt || b.record.lastSeenAt);
      if (lastA && lastB && lastA.getTime() !== lastB.getTime()) return lastA - lastB;
      return a.entry.sourceOrder - b.entry.sourceOrder;
    });
  }
  function getStarredEntryIds() {
    return Object.keys(load().words).filter(function(id) { return !!load().words[id].isStarred && !!WordTales.Data.getEntry(id); });
  }
  function getCompletedColumnIds(date) {
    var dateKey = completionDayKey(date);
    var cells = dateKey && load().columnCompletions[dateKey];
    var ids = [];
    if (!cells) return ids;
    WordTales.Data.sets.forEach(function(set) {
      set.columns.forEach(function(column) {
        if (cells[column.id] === true) ids.push(column.id);
      });
    });
    return ids;
  }
  function isColumnCompleted(columnId, date) {
    var dateKey = completionDayKey(date);
    return !!(dateKey && WordTales.Data.getColumn(columnId) && load().columnCompletions[dateKey] && load().columnCompletions[dateKey][columnId] === true);
  }
  function setColumnCompleted(columnId, date, completed) {
    var dateKey = completionDayKey(date);
    if (!ready || !dateKey || !WordTales.Data.getColumn(columnId) || typeof completed !== 'boolean') {
      var existing = ready && dateKey && WordTales.Data.getColumn(columnId) ? isColumnCompleted(columnId, dateKey) : false;
      return Promise.resolve({ completed: existing, saved: false, invalid: true });
    }
    var target = completed;
    var completions = load().columnCompletions;
    var cells = completions[dateKey];
    var current = !!(cells && cells[columnId] === true);
    if (current === target) return Promise.resolve({ completed: target, saved: true, unchanged: true });
    if (target) {
      if (!cells) cells = completions[dateKey] = {};
      cells[columnId] = true;
    } else {
      delete cells[columnId];
      if (!Object.keys(cells).length) delete completions[dateKey];
    }
    return saveProfileNow().then(function(saved) {
      if (saved) return { completed: target, saved: true };
      if (current) {
        if (!completions[dateKey]) completions[dateKey] = {};
        completions[dateKey][columnId] = true;
      } else if (completions[dateKey]) {
        delete completions[dateKey][columnId];
        if (!Object.keys(completions[dateKey]).length) delete completions[dateKey];
      }
      return { completed: current, saved: false };
    });
  }
  function trackArticle(columnId) {
    if (!ready) { pending.push(function() { trackArticle(columnId); }); return; }
    if (!columnIndex[columnId]) return;
    var record = load().articles[columnId] || { firstViewed: nowIso(), lastViewed: '', viewCount: 0, lastViewedDay: '' };
    record.lastViewed = nowIso();
    if (record.lastViewedDay !== dayKey()) { record.viewCount++; record.lastViewedDay = dayKey(); ensureDay().articles++; }
    load().articles[columnId] = record; saveSoon();
  }
  function trackAnalysis(paragraphId) {
    if (!ready) { pending.push(function() { trackAnalysis(paragraphId); }); return; }
    if (!paragraphIndex[paragraphId]) return;
    var record = load().analyses[paragraphId] || { firstOpened: nowIso(), lastOpened: '', openCount: 0 };
    record.lastOpened = nowIso(); record.openCount++; load().analyses[paragraphId] = record; ensureDay().analyses++; saveSoon();
  }
  function observeArticles() {
    if (!('IntersectionObserver' in window)) return;
    articleObserver = new IntersectionObserver(function(entries) { entries.forEach(function(entry) { if (entry.isIntersecting && entry.intersectionRatio >= .25) { var section = entry.target.closest('.column-section'); if (section) trackArticle(section.id); } }); }, { threshold: [.25] });
    document.querySelectorAll('.essay-block').forEach(function(block) { articleObserver.observe(block); });
  }
  function init() {
    buildIndexes(); load();
    return hydrate().then(function() {
      migrateLegacyStars(); ready = true;
      var queued = pending.slice(); pending = []; queued.forEach(function(operation) { operation(); }); observeArticles();
      window.addEventListener('pagehide', function() { if (saveTimer) clearTimeout(saveTimer); writeProfileNow().catch(function() {}); });
      return api;
    });
  }
  var api = {
    init: init,
    trackWord: trackWord,
    trackArticle: trackArticle,
    trackAnalysis: trackAnalysis,
    rateWord: rateWord,
    getDueEntries: getDueEntries,
    getEntryState: getEntryState,
    getStarredEntryIds: getStarredEntryIds,
    setStarred: setStarred,
    getCompletedColumnIds: getCompletedColumnIds,
    isColumnCompleted: isColumnCompleted,
    setColumnCompleted: setColumnCompleted,
    recallProbability: recallProbability,
    memoryState: memoryState,
    getData: function() { return load(); },
    getDayKey: dayKey,
    isReady: function() { return ready; },
    getPersistenceMode: function() { return persistenceMode; },
    replaceData: replaceData
  };
  return api;
})();
