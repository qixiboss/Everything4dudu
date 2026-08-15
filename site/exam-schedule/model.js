(function () {
  'use strict';

  var STORAGE_KEY = 'kaoyan-first-round-state-v4';
  var DAY_MS = 86400000;

  function parseMinutes(value) {
    var parts = value.split(':').map(Number);
    return parts.length === 3 ? parts[0] * 60 + parts[1] + parts[2] / 60 : parts[0] + parts[1] / 60;
  }

  function buildSchedule(data) {
    var queues = Object.fromEntries(Object.entries(data.courseRaw).map(function (entry) {
      return [entry[0], entry[1].map(function (video) {
        var minutes = parseMinutes(video[1]);
        return { title: video[0], left: minutes, total: minutes };
      })];
    }));
    function take(subject, budget) {
      var out = [];
      while (budget > 0 && queues[subject].length) {
        var item = queues[subject][0];
        var used = Math.min(budget, item.left);
        var from = item.total - item.left;
        var continued = from > 0.01;
        out.push({
          subject: subject,
          title: (continued ? '续 · ' : '') + item.title,
          duration: used,
          from: from,
          to: from + used,
          spansDays: continued || used < item.total - 0.01
        });
        item.left -= used;
        budget -= used;
        if (item.left < 0.5) queues[subject].shift();
      }
      return out;
    }

    var start = new Date(data.start[0], data.start[1], data.start[2]);
    var days = [];
    for (var index = 0; index < data.dayCount; index += 1) {
      var date = new Date(start);
      date.setDate(start.getDate() + index);
      var rest = date.getDay() === 0;
      var day = {
        i: index + 1,
        date: date,
        rest: rest,
        phase: index < 9 ? 1 : index < 18 ? 2 : index < 27 ? 3 : 4,
        tasks: []
      };
      if (!rest) {
        day.tasks.push.apply(day.tasks, take('math', 65));
        var focus = queues.co.length ? 'co' : queues.os.length ? 'os' : 'net';
        day.focus = focus;
        day.tasks.push.apply(day.tasks, take(focus, 170));
      }
      days.push(day);
    }

    ['math', 'co', 'os', 'net'].forEach(function (subject) {
      while (queues[subject].length) {
        var target = days.slice().reverse().find(function (day) {
          return !day.rest && (subject === 'math' || day.focus === subject);
        });
        if (!target) break;
        target.tasks.splice.apply(target.tasks, [target.tasks.length - 1, 0].concat(take(subject, 9999)));
      }
    });
    days.forEach(function (day) {
      day.tasks.forEach(function (task, index) { task.id = 'day-' + day.i + '-task-' + index; });
    });
    return days;
  }

  function emptyState() { return { completed: {}, rested: {} }; }

  function normalizeState(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyState();
    return {
      completed: value.completed && typeof value.completed === 'object' && !Array.isArray(value.completed) ? value.completed : {},
      rested: value.rested && typeof value.rested === 'object' && !Array.isArray(value.rested) ? value.rested : {}
    };
  }

  function readState(storage, logger) {
    try {
      return normalizeState(JSON.parse(storage.getItem(STORAGE_KEY) || '{}'));
    } catch (error) {
      if (logger && logger.warn) logger.warn('State load failed:', error);
      return emptyState();
    }
  }

  function writeState(storage, state, logger) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
      return true;
    } catch (error) {
      if (logger && logger.warn) logger.warn('State save failed:', error);
      return false;
    }
  }

  function dateOnly(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }

  function todayIndex(days, now) {
    var first = dateOnly(days[0].date);
    return Math.max(0, Math.min(days.length - 1, Math.round((dateOnly(now || new Date()) - first) / DAY_MS)));
  }

  function dayLabel(day) { return 'Day ' + day.i + ' · ' + (day.date.getMonth() + 1) + '月' + day.date.getDate() + '日'; }

  function allTasks(days) {
    return days.flatMap(function (day) {
      return day.tasks.map(function (task) { return { d: day, t: task }; });
    });
  }

  function tasksBySubject(tasks) {
    return tasks.reduce(function (groups, item) {
      (groups[item.t.subject] || (groups[item.t.subject] = [])).push(item);
      return groups;
    }, {});
  }

  function nextPending(tasks, state) {
    return tasks.find(function (item) { return !state.completed[item.t.id]; });
  }

  function tasksForDay(tasks, state, day) {
    return tasks.filter(function (item) {
      return item.d.i === day.i || (item.d.i < day.i && !state.completed[item.t.id]);
    }).sort(function (left, right) {
      var leftDone = !!state.completed[left.t.id];
      var rightDone = !!state.completed[right.t.id];
      if (leftDone !== rightDone) return leftDone ? 1 : -1;
      if (leftDone && rightDone) {
        var leftTime = Number(state.completed[left.t.id]);
        var rightTime = Number(state.completed[right.t.id]);
        if (leftTime !== rightTime) return leftTime - rightTime;
      }
      return 0;
    });
  }

  function timelineDays(days, selected, filters) {
    var from = Math.min(Math.max(0, selected - 3), days.length - 7);
    var visible = filters.scope === 'all' ? days : days.slice(from, from + 7);
    return visible.reduce(function (result, day) {
      if (filters.phase !== 'all' && String(day.phase) !== filters.phase) return result;
      if (day.rest && filters.hideRest) return result;
      var tasks = day.tasks.filter(function (task) {
        return filters.subject === 'all' || task.subject === filters.subject || task.subject === 'review';
      });
      if (!day.rest && !tasks.length) return result;
      result.push({ day: day, tasks: tasks });
      return result;
    }, []);
  }

  window.ExamScheduleModel = {
    STORAGE_KEY: STORAGE_KEY,
    parseMinutes: parseMinutes,
    buildSchedule: buildSchedule,
    normalizeState: normalizeState,
    readState: readState,
    writeState: writeState,
    dateOnly: dateOnly,
    todayIndex: todayIndex,
    dayLabel: dayLabel,
    allTasks: allTasks,
    tasksBySubject: tasksBySubject,
    nextPending: nextPending,
    tasksForDay: tasksForDay,
    timelineDays: timelineDays
  };
})();

