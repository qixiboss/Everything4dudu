(function () {
  'use strict';
  var labels = { words: '词汇学习', training: '训练记录', 'exam-schedule': '考研日程' };
  function relative(path) {
    return document.documentElement.dataset.app ? '../' + path : path;
  }
  function emailLabel(email) { return email ? email.replace(/^(.{2}).*(@.*)$/, '$1…$2') : ''; }
  function render() {
    var mount = document.getElementById('hub-shell');
    if (!mount) return;
    var session = window.HubAuth.getSession();
    var app = document.documentElement.dataset.app || '';
    var account = session && session.user ?
      '<span class="hub-account">已登录 ' + emailLabel(session.user.email) + '</span><button class="hub-button" data-hub-signout>退出</button>' :
      '<form class="hub-login" data-hub-login><input type="email" required placeholder="邮箱，用于跨设备同步" aria-label="邮箱"><button class="hub-button" type="submit">发送登录链接</button></form>';
    mount.innerHTML = '<header class="hub-header"><a class="hub-brand" href="' + relative('index.html') + '">Everything 4 Dudu</a>' +
      '<nav class="hub-nav" aria-label="应用导航">' + Object.keys(labels).map(function (key) {
        return '<a ' + (key === app ? 'aria-current="page"' : '') + ' href="' + relative(key === 'words' ? 'words/' : key + '/') + '">' + labels[key] + '</a>';
      }).join('') + '</nav><div class="hub-auth">' + account + '<span class="hub-sync-state" aria-live="polite"></span></div></header>';
    var login = mount.querySelector('[data-hub-login]');
    if (login) login.addEventListener('submit', function (event) {
      event.preventDefault();
      var button = login.querySelector('button'); button.disabled = true; button.textContent = '正在发送…';
      window.HubAuth.signInWithMagicLink(login.querySelector('input').value).then(function () { button.textContent = '请检查邮箱'; })
        .catch(function (error) { button.disabled = false; button.textContent = error.message; });
    });
    var signOut = mount.querySelector('[data-hub-signout]');
    if (signOut) signOut.addEventListener('click', function () { window.HubAuth.signOut(); });
  }
  function setStatus(event) {
    var value = event.detail;
    var state = document.querySelector('.hub-sync-state');
    if (state) { state.textContent = value.message || ''; state.dataset.state = value.state; }
  }
  document.addEventListener('DOMContentLoaded', function () {
    window.HubAuth.init().then(render);
    window.addEventListener('hub:auth-change', render);
    window.addEventListener('hub:sync-status', setStatus);
  });
})();
