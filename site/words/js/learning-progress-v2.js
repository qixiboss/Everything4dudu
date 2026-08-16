/* ============================================================
 * Module: LearningProgress v2
 * 规范词条、统一星标、栏目完成记录与旧档案迁移。
 * ============================================================ */
WordTales.LearningProgress = (function() {
  var STORAGE_KEY = 'wordtales.learning.v1';
  var MIGRATION_KEY = 'wordtales.learning.v2-migrated';
  var DB_NAME = 'wordtales-learning';
  var DB_VERSION = 2;
  var data = null;
  var database = null;
  var persistenceMode = 'localStorage';
  var ready = false;
  var pending = [];
  var saveTimer = null;
  var articleObserver = null;
  var columnIndex = Object.create(null);
  var paragraphIndex = Object.create(null);

  function nowIso() { return new Date().toISOString(); }
  function dayKey(date) {
    var d = date || new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function validDate(value) {
    var date = value ? new Date(value) : null;
    return date && !isNaN(date.getTime()) ? date : null;
  }
  function freshData() {
    return {
      version: 3,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      words: {},
      articles: {},
      analyses: {},
      days: {},
      columnCompletions: {}
    };
  }
  function createRecord(entryId, at) {
    var entry = WordTales.Data.getEntry(entryId);
    var timestamp = (at || new Date()).toISOString();
    return {
      entryId: entryId,
      firstSeenAt: timestamp,
      lastSeenAt: timestamp,
      clickCount: 0,
      cardFlipCount: 0,
      isStarred: false,
      starredAt: '',
      starReason: '',
      sourceOccurrenceId: entry ? entry.primaryOccurrenceId : entryId
    };
  }
  function normalizeRecord(entryId, record) {
    var source = record || {};
    var result = createRecord(entryId, validDate(source.firstSeenAt || source.firstSeen) || new Date());
    result.firstSeenAt = source.firstSeenAt || source.firstSeen || result.firstSeenAt;
    result.lastSeenAt = source.lastSeenAt || source.lastSeen || result.firstSeenAt;
    result.clickCount = Number(source.clickCount) || 0;
    result.cardFlipCount = Number(source.cardFlipCount) || 0;
    result.isStarred = !!source.isStarred;
    result.starredAt = result.isStarred ? (source.starredAt || source.lastSeenAt || source.lastSeen || result.lastSeenAt) : '';
    result.starReason = result.isStarred ? (source.starReason || 'legacy') : '';
    result.sourceOccurrenceId = WordTales.Data.getOccurrence(source.sourceOccurrenceId)
      ? source.sourceOccurrenceId
      : result.sourceOccurrenceId;
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
    target.clickCount += incoming.clickCount;
    target.cardFlipCount += incoming.cardFlipCount;
    target.isStarred = target.isStarred || incoming.isStarred;
    if (incoming.isStarred) {
      target.starredAt = chooseLater(target.starredAt, incoming.starredAt || incoming.lastSeenAt);
      target.starReason = incoming.starReason || 'legacy';
    }
    if (validDate(incoming.lastSeenAt) >= validDate(target.lastSeenAt)) {
      target.sourceOccurrenceId = incoming.sourceOccurrenceId || target.sourceOccurrenceId;
    }
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
  function normalizeDays(candidate) {
    var normalized = {};
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return normalized;
    Object.keys(candidate).forEach(function(dateKey) {
      if (completionDayKey(dateKey) !== dateKey) return;
      var source = candidate[dateKey];
      if (!source || typeof source !== 'object' || Array.isArray(source)) return;
      var day = {
        wordClicks: Number(source.wordClicks) || 0,
        cardFlips: Number(source.cardFlips) || 0,
        articles: Number(source.articles) || 0,
        analyses: Number(source.analyses) || 0
      };
      if (day.wordClicks || day.cardFlips || day.articles || day.analyses) normalized[dateKey] = day;
    });
    return normalized;
  }
  function migrateCandidate(candidate) {
    if (!candidate || [1, 2, 3].indexOf(candidate.version) < 0) return freshData();
    var store = freshData();
    store.createdAt = candidate.createdAt || store.createdAt;
    /* 旧档案没有更新时间时保持“未知”，避免每次迁移都伪造一个最新时间并覆盖 IndexedDB。 */
    store.updatedAt = candidate.updatedAt || candidate.createdAt || '';
    store.articles = candidate.articles || {};
    store.analyses = candidate.analyses || {};
    store.days = normalizeDays(candidate.days);
    store.columnCompletions = normalizeColumnCompletions(candidate.columnCompletions);
    store.starMigrationV2 = !!candidate.starMigrationV2;
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
  function schedulePortalSync() {
    if (WordTales.PortalSync && WordTales.PortalSync.schedule) WordTales.PortalSync.schedule();
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
        if (db.objectStoreNames.contains('events')) db.deleteObjectStore('events');
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
    if (persistenceMode !== 'indexedDB' || !database) { saveFallback(); schedulePortalSync(); return; }
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function() {
      saveTimer = null;
      writeProfileNow().then(schedulePortalSync).catch(function() { persistenceMode = 'localStorage'; saveFallback(); schedulePortalSync(); });
    }, 180);
  }
  function saveProfileNow() {
    load().updatedAt = nowIso();
    mirrorLegacyStars();
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    if (!database || persistenceMode !== 'indexedDB') {
      var fallbackSaved = saveFallback();
      if (fallbackSaved) schedulePortalSync();
      return Promise.resolve(fallbackSaved);
    }
    try {
      return writeProfileNow().then(function() { schedulePortalSync(); return true; }).catch(function() {
        persistenceMode = 'localStorage';
        var saved = saveFallback();
        if (saved) schedulePortalSync();
        return saved;
      });
    } catch (e) {
      persistenceMode = 'localStorage';
      var fallbackSaved = saveFallback();
      if (fallbackSaved) schedulePortalSync();
      return Promise.resolve(fallbackSaved);
    }
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
    if (!days[key]) days[key] = { wordClicks: 0, cardFlips: 0, articles: 0, analyses: 0 };
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
  function exposeWord(id, action, meta) {
    var entryId = WordTales.Data.resolveEntryId(id);
    var record = ensureRecord(entryId, new Date());
    if (!record) return null;
    var now = new Date();
    record.lastSeenAt = now.toISOString();
    if (action === 'click') { record.clickCount++; ensureDay().wordClicks++; }
    if (action === 'card') { record.cardFlipCount++; ensureDay().cardFlips++; }
    if (meta && meta.occurrenceId) record.sourceOccurrenceId = meta.occurrenceId;
    saveSoon();
    return record;
  }
  function trackWord(id, action, meta) {
    if (!ready) { pending.push(function() { trackWord(id, action, meta); }); return; }
    return exposeWord(id, action, meta);
  }
  function setStarred(id, starred, reason) {
    var entryId = WordTales.Data.resolveEntryId(id);
    if (!WordTales.Data.getEntry(entryId)) return;
    var record = load().words[entryId];
    if (!record && !starred) return;
    if (!record) record = ensureRecord(entryId, new Date());
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
    return record ? Object.assign({}, record) : null;
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
      migrateLegacyStars();
      /* 用瘦身后的 v3 档案覆盖 localStorage，彻底移除旧 FSRS 字段与复习历史。 */
      saveFallback();
      ready = true;
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
    getEntryState: getEntryState,
    getStarredEntryIds: getStarredEntryIds,
    setStarred: setStarred,
    getCompletedColumnIds: getCompletedColumnIds,
    isColumnCompleted: isColumnCompleted,
    setColumnCompleted: setColumnCompleted,
    getData: function() { return load(); },
    getDayKey: dayKey,
    isReady: function() { return ready; },
    replaceData: replaceData
  };
  return api;
})();
