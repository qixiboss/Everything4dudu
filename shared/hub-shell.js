(function () {
  'use strict';

  var placements = {
    words: '.cover-inner',
    training: '.topbar-inner',
    'exam-schedule': '#kaoyan-plan .brand',
    changelog: '.app-header',
    'cost-trace': '.brand-row'
  };

  function render() {
    var mount = document.getElementById('hub-shell');
    if (!mount) return;

    var app = document.documentElement.dataset.app || '';
    var target = document.querySelector(placements[app]);
    mount.innerHTML = '<a class="hub-home-link" href="../" aria-label="返回 Everything 4 Dudu 主页">' +
      '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m11.5 5-5 5 5 5"/><path d="M7 10h7"/></svg>' +
      '<span>主页</span></a>';

    if (target) target.insertBefore(mount, target.firstChild);
    else mount.className = 'hub-home-fallback';
  }

  document.addEventListener('DOMContentLoaded', render);
})();
