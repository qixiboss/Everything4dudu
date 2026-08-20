(function () {
  'use strict';

  var placements = {
    words: '.cover-inner',
    training: '.topbar-inner',
    'exam-schedule': '#kaoyan-plan .brand',
    changelog: '.app-header',
    'cost-trace': '.brand-row',
    pomodoro: '.topbar-inner'
  };

  function render() {
    var mount = document.getElementById('hub-shell');
    if (!mount) return;

    var app = document.documentElement.dataset.app || '';
    var target = document.querySelector(placements[app]);
    mount.innerHTML = '<a class="hub-home-link" href="../" aria-label="返回 Everything 4 Dudu 主页">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5.5-6 6.5 6 6.5"/></svg></a>';

    if (target) target.insertBefore(mount, target.firstChild);
    else mount.className = 'hub-home-fallback';
  }

  document.addEventListener('DOMContentLoaded', render);
})();
