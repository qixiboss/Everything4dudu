/* Converts the existing WordTales profile into mergeable portal sync items. */
WordTales.HubProfileSync = (function () {
  var controller = null;
  var previous = null;

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
  function applyRemote(rows) {
    var progress = WordTales.LearningProgress;
    if (!progress || !progress.isReady()) return;
    var profile = progress.getData();
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
    progress.replaceData(profile);
  }
  function start() {
    if (controller || !window.HubSync || !WordTales.LearningProgress || !WordTales.LearningProgress.isReady()) return;
    controller = window.HubSync.register('words', { getItems: function () { return itemsFor(WordTales.LearningProgress.getData()); }, applyRemote: applyRemote });
    previous = itemsFor(WordTales.LearningProgress.getData()).reduce(function (map, item) { map[item.item_key] = JSON.stringify(item.payload); return map; }, {});
  }
  function queue() {
    start();
    if (!controller) return;
    var next = {};
    itemsFor(WordTales.LearningProgress.getData()).forEach(function (item) {
      var encoded = JSON.stringify(item.payload); next[item.item_key] = encoded;
      if (!previous || previous[item.item_key] !== encoded) controller.put(item.item_key, item.payload);
    });
    if (previous) Object.keys(previous).forEach(function (key) { if (!Object.prototype.hasOwnProperty.call(next, key)) controller.remove(key); });
    previous = next;
  }
  return { start: start, queue: queue };
})();
