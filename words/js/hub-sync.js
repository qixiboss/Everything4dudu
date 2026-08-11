/* Words adapter: converts the WordTales learning profile into mergeable
 * portal sync items. Runs on the shared HubAppSync poll loop; the public
 * HubProfileSync API is kept because legacy cloud-sync.js calls it. */
WordTales.HubProfileSync = (function () {
  var started = false;

  function eventKey(event, index) {
    var submission = event && event.meta && event.meta.submissionId;
    return submission || [event && event.at, event && event.type, event && event.targetId, index].join('|');
  }
  function itemsFor(profile) {
    var items = [];
    function add(prefix, source) { Object.keys(source || {}).forEach(function (key) { items.push({ item_key: prefix + key, payload: source[key] }); }); }
    add('word:', profile.words); add('article:', profile.articles); add('analysis:', profile.analyses); add('day:', profile.days);
    Object.keys(profile.columnCompletions || {}).forEach(function (date) { Object.keys(profile.columnCompletions[date] || {}).forEach(function (column) {
      if (profile.columnCompletions[date][column] === true) items.push({ item_key: 'column:' + date + ':' + column, payload: { completed: true } });
    }); });
    (profile.events || []).forEach(function (event, index) { items.push({ item_key: 'event:' + eventKey(event, index), payload: event }); });
    items.push({ item_key: 'meta', payload: { version: profile.version, createdAt: profile.createdAt, reminders: profile.reminders, starMigrationV2: profile.starMigrationV2, processedSubmissions: profile.processedSubmissions } });
    return items;
  }
  function progress() { return WordTales.LearningProgress; }
  function ready() { return progress() && progress().isReady(); }
  function applyRemote(rows) {
    if (!ready()) return;
    var profile = JSON.parse(JSON.stringify(progress().getData()));
    rows.forEach(function (row) {
      var key = row.item_key, value = row.payload || {};
      function assign(group, id) { if (row.deleted_at) delete profile[group][id]; else profile[group][id] = value; }
      if (key.indexOf('word:') === 0) assign('words', key.slice(5));
      else if (key.indexOf('article:') === 0) assign('articles', key.slice(8));
      else if (key.indexOf('analysis:') === 0) assign('analyses', key.slice(9));
      else if (key.indexOf('day:') === 0) assign('days', key.slice(4));
      else if (key.indexOf('column:') === 0) {
        var parts = key.split(':'); var date = parts[1], column = parts.slice(2).join(':');
        if (!profile.columnCompletions[date]) profile.columnCompletions[date] = {};
        if (row.deleted_at) delete profile.columnCompletions[date][column]; else profile.columnCompletions[date][column] = true;
      } else if (key.indexOf('event:') === 0 && !row.deleted_at) {
        var seen = (profile.events || []).some(function (event, index) { return eventKey(event, index) === key.slice(6); });
        if (!seen) profile.events.push(value);
      } else if (key === 'meta' && !row.deleted_at) {
        profile.reminders = value.reminders || profile.reminders;
        profile.starMigrationV2 = !!value.starMigrationV2;
      }
    });
    profile.updatedAt = new Date().toISOString();
    /* replaceData is async (IndexedDB); HubAppSync refreshes `previous` from
     * the merged snapshot, so a scan before the write lands does not
     * re-upload remote rows. */
    return progress().replaceData(profile).then(function () {
      if (WordTales.Progress && WordTales.Progress.refresh) WordTales.Progress.refresh();
      return true;
    });
  }
  function resetLocal() {
    if (!ready()) return;
    return progress().replaceData(null).then(function () {
      if (WordTales.Progress && WordTales.Progress.refresh) WordTales.Progress.refresh();
      return true;
    });
  }
  function start() {
    if (started) return true;
    if (!window.HubAppSync || !ready()) return false;
    started = window.HubAppSync.start({
      app: 'words',
      items: function () { return itemsFor(progress().getData()); },
      applyRemote: applyRemote,
      resetLocal: resetLocal
    });
    return started;
  }
  function queue() {
    if (!started && !start()) return;
    /* Keep legacy CloudSync upload cycles flowing through the shared poll
     * loop instead of running a second timer of our own. */
    window.HubAppSync.queue({
      app: 'words',
      items: function () { return itemsFor(progress().getData()); },
      applyRemote: applyRemote,
      resetLocal: resetLocal
    });
  }
  return { start: start, queue: queue };
})();
