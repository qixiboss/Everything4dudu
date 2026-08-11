(function () {
  'use strict';

  var layer;
  var lastFocus;
  var authMode = 'login';

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
      var account = layer.querySelector('[data-login-account]');
      var target = account && !account.hidden
        ? layer.querySelector('[data-home-signout]')
        : layer.querySelector('#login-email');
      if (!target) target = layer.querySelector('[data-login-close]');
      if (target) target.focus();
    }, 0);
  }

  function closeLogin() {
    if (!layer) return;
    layer.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function setStatus(message, state) {
    var status = document.querySelector('[data-login-status]');
    if (!status) return;
    status.textContent = message || '';
    status.dataset.state = state || '';
  }

  function friendlyAuthError(error) {
    var message = error && error.message ? error.message : '操作失败，请稍后重试。';
    if (/invalid login credentials|invalid.*password/i.test(message)) return '邮箱或密码错误。未注册时可切换到“注册”。';
    if (/user already registered|already.*registered/i.test(message)) return '该邮箱已注册，请切换到“登录”。';
    if (/email not confirmed/i.test(message)) return '邮箱尚未确认，请检查确认邮件。';
    if (/weak password|password.*weak/i.test(message)) return '密码强度不足，请增加长度并混合使用字母和数字。';
    if (/rate limit|security purposes|too many/i.test(message)) return '发送过于频繁，请稍后再试。';
    return message;
  }

  function setAuthMode(mode) {
    authMode = mode === 'register' ? 'register' : 'login';
    var registering = authMode === 'register';
    Array.prototype.forEach.call(document.querySelectorAll('[data-auth-mode]'), function (button) {
      var active = button.dataset.authMode === authMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    var fields = document.querySelector('[data-register-fields]');
    if (fields) fields.hidden = !registering;
    var sheet = document.querySelector('.login-sheet');
    if (sheet) sheet.classList.toggle('is-registering', registering);
    var confirm = document.querySelector('#register-password-confirm');
    if (confirm) confirm.required = registering;
    var password = document.querySelector('#login-password');
    if (password) {
      password.autocomplete = registering ? 'new-password' : 'current-password';
      password.value = '';
    }
    if (confirm) confirm.value = '';
    text('[data-auth-title]', registering ? '创建你的账户' : '登录你的空间');
    text('[data-auth-copy]', registering ? '注册后即可使用同一个账户跨设备同步学习数据。' : '使用邮箱和密码登录，继续同步你的学习数据。');
    var submit = document.querySelector('[data-auth-submit]');
    if (submit) submit.innerHTML = (registering ? '注册并登录' : '登录') + ' <span aria-hidden="true">→</span>';
    setStatus('', '');
    window.setTimeout(function () {
      var target = document.querySelector('#login-email');
      if (target) target.focus();
    }, 0);
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
      var button = form.querySelector('[data-auth-submit]');
      var email = form.querySelector('#login-email').value;
      var password = form.querySelector('#login-password').value;
      if (authMode === 'register' && password !== form.querySelector('#register-password-confirm').value) {
        setStatus('两次输入的密码不一致。', 'error');
        return;
      }
      button.disabled = true;
      setStatus(authMode === 'register' ? '正在创建账户…' : '正在登录…', 'loading');
      var request = authMode === 'register'
        ? window.HubAuth.signUpWithPassword(email, password)
        : window.HubAuth.signInWithPassword(email, password);
      request.then(function (result) {
        if (authMode === 'register' && result.requiresEmailConfirmation) {
          setStatus('注册成功，请先前往邮箱确认账户。', 'success');
          button.disabled = false;
          return;
        }
        setStatus(authMode === 'register' ? '注册成功，已登录。' : '登录成功。', 'success');
        window.setTimeout(closeLogin, 450);
      }).catch(function (error) {
        setStatus(friendlyAuthError(error), 'error');
        button.disabled = false;
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-auth-mode]'), function (button) {
      button.addEventListener('click', function () { setAuthMode(button.dataset.authMode); });
    });

    var signOut = document.querySelector('[data-home-signout]');
    if (signOut) signOut.addEventListener('click', function () {
      signOut.disabled = true;
      window.HubAuth.signOut().then(function () { setAuthMode('login'); closeLogin(); })
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
