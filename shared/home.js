(function () {
  'use strict';

  var layer;
  var lastFocus;

  function text(selector, value) {
    var node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function updateClock() {
    var now = new Date();
    text('[data-home-time]', new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now));
    text('[data-home-date]', new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(now));
  }

  function sessionEmail(session) {
    return session && session.user && session.user.email ? session.user.email : '';
  }

  function shortEmail(email) {
    if (!email) return '';
    var parts = email.split('@');
    var name = parts[0];
    return (name.length > 7 ? name.slice(0, 6) + '…' : name) + (parts[1] ? '@' + parts[1] : '');
  }

  function renderAccount() {
    var email = sessionEmail(window.HubAuth.getSession());
    var guest = document.querySelector('[data-login-guest]');
    var account = document.querySelector('[data-login-account]');
    if (guest) guest.hidden = !!email;
    if (account) account.hidden = !email;
    text('[data-account-email]', email);
    text('[data-login-label]', email ? '我的账户' : '用户登录');
    text('[data-login-caption]', email ? shortEmail(email) : '跨设备同步');
    var dot = document.querySelector('[data-login-dot]');
    if (dot) dot.classList.toggle('is-online', !!email);
  }

  function openLogin() {
    if (!layer) return;
    lastFocus = document.activeElement;
    layer.hidden = false;
    document.body.style.overflow = 'hidden';
    window.setTimeout(function () {
      var target = layer.querySelector('[data-home-login] input:not([hidden]), [data-home-signout]:not([hidden]), [data-login-close]');
      if (target) target.focus();
    }, 0);
  }

  function closeLogin() {
    if (!layer) return;
    layer.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && layer && !layer.hidden) closeLogin();
    if (event.key !== 'Tab' || !layer || layer.hidden) return;
    var focusable = Array.prototype.slice.call(layer.querySelectorAll('button:not([disabled]):not([hidden]), input:not([disabled]):not([hidden])'))
      .filter(function (node) { return node.offsetParent !== null; });
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function bindLogin() {
    var form = document.querySelector('[data-home-login]');
    if (form) form.addEventListener('submit', function (event) {
      event.preventDefault();
      var button = form.querySelector('button[type="submit"]');
      var input = form.querySelector('input');
      var status = document.querySelector('[data-login-status]');
      button.disabled = true;
      status.dataset.state = 'loading';
      status.textContent = '正在发送登录链接…';
      window.HubAuth.signInWithMagicLink(input.value).then(function () {
        status.dataset.state = 'success';
        status.textContent = '登录链接已发送，请前往邮箱查收。';
        button.textContent = '已发送，请检查邮箱';
      }).catch(function (error) {
        status.dataset.state = 'error';
        status.textContent = error.message;
        button.disabled = false;
        button.innerHTML = '重新发送 <span aria-hidden="true">→</span>';
      });
    });

    var signOut = document.querySelector('[data-home-signout]');
    if (signOut) signOut.addEventListener('click', function () {
      signOut.disabled = true;
      window.HubAuth.signOut().then(function () { closeLogin(); })
        .catch(function () { signOut.disabled = false; });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    layer = document.querySelector('[data-login-layer]');
    updateClock();
    window.setInterval(updateClock, 30000);
    document.querySelector('[data-login-open]').addEventListener('click', openLogin);
    Array.prototype.forEach.call(document.querySelectorAll('[data-login-close]'), function (button) { button.addEventListener('click', closeLogin); });
    document.addEventListener('keydown', handleKeydown);
    bindLogin();
    window.HubAuth.init().then(renderAccount);
    window.addEventListener('hub:auth-change', renderAccount);
  });
})();
