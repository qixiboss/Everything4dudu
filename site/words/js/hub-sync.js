/* Words adapter: converts the WordTales learning profile into mergeable
 * portal sync items. Runs on the shared HubAppSync poll loop; the public
 * HubProfileSync API is called by the portal's cloud-sync.js stub. Only
 * words marked "不太认识" (isStarred) and daily column punch-ins sync —
 * articles/analyses/days/events stay device-local. */
WordTales.HubProfileSync = (function () {
  var started = false;

  function itemsFor(profile) {
    var items = [];
    Object.keys(profile.words || {}).forEach(function (id) {
      if (profile.words[id] && profile.words[id].isStarred) {
        items.push({ item_key: 'word:' + id, payload: profile.words[id] });
      }
    });
    Object.keys(profile.columnCompletions || {}).forEach(function (date) { Object.keys(profile.columnCompletions[date] || {}).forEach(function (column) {
      if (profile.columnCompletions[date][column] === true) items.push({ item_key: 'column:' + date + ':' + column, payload: { completed: true } });
    }); });
    return items;
  }
  function progress() { return WordTales.LearningProgress; }
  function ready() { return progress() && progress().isReady(); }
  function applyRemote(rows) {
    if (!ready()) return;
    var profile = JSON.parse(JSON.stringify(progress().getData()));
    rows.forEach(function (row) {
      var key = row.item_key, value = row.payload || {};
      if (key.indexOf('word:') === 0) {
        var id = key.slice(5);
        if (row.deleted_at) delete profile.words[id]; else profile.words[id] = value;
      } else if (key.indexOf('column:') === 0) {
        var parts = key.split(':'); var date = parts[1], column = parts.slice(2).join(':');
        if (!profile.columnCompletions[date]) profile.columnCompletions[date] = {};
        if (row.deleted_at) delete profile.columnCompletions[date][column]; else profile.columnCompletions[date][column] = true;
      }
      /* 其他前缀（article:/analysis:/day:/event:/meta 及未知键）一律忽略。 */
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
