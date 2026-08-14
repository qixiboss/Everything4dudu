(function () {
  'use strict';

  var layer;
  var lastFocus;
  var pendingHref = '';
  var APP_PAGE_SIZE = 6;

  function text(selector, value) {
    var node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function greeting(hour) {
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }

  function subtitleFor(hour) {
    if (hour < 6) return '夜深了，早点休息，明天再战。';
    if (hour < 12) return '今天也向目标靠近一点。';
    if (hour < 14) return '好好吃饭，下午继续。';
    if (hour < 18) return '下午也元气满满。';
    return '整理今天的收获，再看看明天的安排。';
  }

  function updateClock() {
    var now = new Date();
    var time = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
    var monthDay = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(now);
    var weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'long' }).format(now);
    Array.prototype.forEach.call(document.querySelectorAll('[data-home-time]'), function (node) { node.textContent = time; });
    text('[data-home-date]', monthDay + ' ' + weekday);
    text('[data-home-greeting]', greeting(now.getHours()) + '，Dudu');
    text('[data-home-subtitle]', subtitleFor(now.getHours()));
  }

  /* 对齐到整分钟再进入每分钟一次的刷新，避免时钟滞后。 */
  function startClock() {
    updateClock();
    window.setTimeout(function () {
      updateClock();
      window.setInterval(updateClock, 60000);
    }, 60000 - (Date.now() % 60000) + 50);
  }

  function initAppPager() {
    var pager = document.querySelector('[data-app-pager]');
    var pages = document.querySelector('[data-app-pages]');
    var firstPage = document.querySelector('[data-app-page]');
    var pagination = document.querySelector('[data-app-pagination]');
    if (!pager || !pages || !firstPage || !pagination) return;

    var apps = Array.prototype.slice.call(firstPage.querySelectorAll(':scope > .app'));
    var pageCount = Math.ceil(apps.length / APP_PAGE_SIZE);
    var currentPage = 0;
    var startX = 0;
    var startY = 0;
    var trackingPointer = false;
    var ignoreClickUntil = 0;

    for (var pageIndex = 1; pageIndex < pageCount; pageIndex += 1) {
      var page = document.createElement('div');
      page.className = 'app-grid';
      page.setAttribute('data-app-page', '');
      page.setAttribute('aria-label', '应用，第 ' + (pageIndex + 1) + ' 页');
      apps.slice(pageIndex * APP_PAGE_SIZE, (pageIndex + 1) * APP_PAGE_SIZE).forEach(function (app) {
        page.appendChild(app);
      });
      pages.appendChild(page);
    }

    var pageNodes = Array.prototype.slice.call(pages.querySelectorAll('[data-app-page]'));
    var dots = document.querySelector('[data-page-dots]');
    var previous = document.querySelector('[data-page-prev]');
    var next = document.querySelector('[data-page-next]');
    if (pageCount <= 1 || !dots || !previous || !next) return;

    pagination.hidden = false;
    pager.setAttribute('tabindex', '0');
    pager.setAttribute('aria-roledescription', '轮播');

    pageNodes.forEach(function (_page, index) {
      var dot = document.createElement('button');
      dot.className = 'app-page-dot';
      dot.type = 'button';
      dot.setAttribute('aria-label', '前往第 ' + (index + 1) + ' 页');
      dot.addEventListener('click', function () { showPage(index); });
      dots.appendChild(dot);
    });

    function showPage(index) {
      currentPage = Math.max(0, Math.min(index, pageCount - 1));
      pages.style.transform = 'translateX(-' + (currentPage * 100) + '%)';
      pageNodes.forEach(function (page, pageIndex) {
        var active = pageIndex === currentPage;
        page.setAttribute('aria-hidden', active ? 'false' : 'true');
        Array.prototype.forEach.call(page.querySelectorAll('.app'), function (app) {
          if (active) app.removeAttribute('tabindex');
          else app.setAttribute('tabindex', '-1');
        });
      });
      Array.prototype.forEach.call(dots.querySelectorAll('.app-page-dot'), function (dot, dotIndex) {
        var active = dotIndex === currentPage;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', active ? 'page' : 'false');
      });
      previous.disabled = currentPage === 0;
      next.disabled = currentPage === pageCount - 1;
    }

    previous.addEventListener('click', function () { showPage(currentPage - 1); });
    next.addEventListener('click', function () { showPage(currentPage + 1); });
    pager.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      showPage(currentPage + (event.key === 'ArrowRight' ? 1 : -1));
    });
    pages.addEventListener('pointerdown', function (event) {
      startX = event.clientX;
      startY = event.clientY;
      trackingPointer = true;
    });
    pages.addEventListener('pointerup', function (event) {
      if (!trackingPointer) return;
      trackingPointer = false;
      var deltaX = event.clientX - startX;
      var deltaY = event.clientY - startY;
      if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
      event.preventDefault();
      ignoreClickUntil = Date.now() + 400;
      showPage(currentPage + (deltaX < 0 ? 1 : -1));
    });
    pages.addEventListener('pointercancel', function () { trackingPointer = false; });
    pages.addEventListener('click', function (event) {
      if (Date.now() >= ignoreClickUntil) return;
      event.preventDefault();
      event.stopPropagation();
    }, true);
    showPage(0);
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
    text('[data-login-label]', email ? shortEmail(email) : '用户登录');
    var dot = document.querySelector('[data-login-dot]');
    if (dot) dot.classList.toggle('is-online', !!email);
    var pill = document.querySelector('[data-login-open]');
    if (pill) pill.title = email ? '当前账户：' + email : '';
    var submit = document.querySelector('[data-auth-submit]');
    if (submit && !email) submit.disabled = false;
    var signOut = document.querySelector('[data-home-signout]');
    if (signOut) signOut.disabled = false;
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
    if (/invalid login credentials|invalid.*password/i.test(message)) return '邮箱或密码错误。';
    if (/email not confirmed/i.test(message)) return '邮箱尚未确认，请检查确认邮件。';
    if (/weak password|password.*weak/i.test(message)) return '密码强度不足，请增加长度并混合使用字母和数字。';
    if (/rate limit|security purposes|too many/i.test(message)) return '发送过于频繁，请稍后再试。';
    return message;
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
      button.disabled = true;
      setStatus('正在登录…', 'loading');
      window.HubAuth.signInWithPassword(email, password).then(function () {
        button.disabled = false;
        setStatus('登录成功。', 'success');
        if (pendingHref) window.location.assign(pendingHref);
        else window.setTimeout(closeLogin, 450);
      }).catch(function (error) {
        setStatus(friendlyAuthError(error), 'error');
        button.disabled = false;
      });
    });

    var signOut = document.querySelector('[data-home-signout]');
    if (signOut) signOut.addEventListener('click', function () {
      signOut.disabled = true;
      window.HubAuth.signOut().then(function () { pendingHref = ''; closeLogin(); })
        .catch(function () { signOut.disabled = false; });
    });
  }

  function bindProtectedApps() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-protected-app]'), function (link) {
      link.addEventListener('click', function (event) {
        if (window.HubAuth.getSession()) return;
        event.preventDefault();
        pendingHref = link.getAttribute('href') || '';
        setStatus('请先登录，再进入应用。', '');
        openLogin();
      });
    });
  }

  function requestedApp() {
    var params = new URLSearchParams(window.location.search || '');
    var routes = { words: 'words/', training: 'training/', 'exam-schedule': 'exam-schedule/', changelog: 'changelog/', 'cost-trace': 'CostTrace/' };
    return { href: routes[params.get('next')] || '', login: params.get('login') === '1' };
  }

  document.addEventListener('DOMContentLoaded', function () {
    layer = document.querySelector('[data-login-layer]');
    startClock();
    initAppPager();
    document.querySelector('[data-login-open]').addEventListener('click', openLogin);
    Array.prototype.forEach.call(document.querySelectorAll('[data-login-close]'), function (button) { button.addEventListener('click', closeLogin); });
    document.addEventListener('keydown', handleKeydown);
    bindLogin();
    bindProtectedApps();
    var requested = requestedApp();
    pendingHref = requested.href;
    window.HubAuth.init().then(function (session) {
      renderAccount();
      if (session && pendingHref) window.location.assign(pendingHref);
      else if (!session && (requested.login || pendingHref)) {
        setStatus('请先登录，再进入应用。', '');
        openLogin();
      }
    });
    window.addEventListener('hub:auth-change', renderAccount);
  });
})();
