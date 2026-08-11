(function () {
  'use strict';

  var layer;
  var lastFocus;
  var pendingHref = '';
  var pageIndex = 0;
  var pages;
  var dots;
  var dragStartX = null;
  var dragStartY = null;
  var dragStartT = 0;
  var dragActive = false;
  var dragOffset = 0;
  /* 最近一次移动的坐标与时间，用于松手时的速度估算。 */
  var dragLastX = 0;
  var dragLastT = 0;
  /* 上一次移动（再往前一格），速度取最后两格位移/时间差，
   * 避免手指释放瞬间位移为零导致快速滑动判不出来。 */
  var dragPrevX = 0;
  var dragPrevT = 0;
  /* 拖动翻页后置位：吞掉紧跟着的 click，避免误触应用图标。 */
  var suppressClick = false;

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
    var routes = { words: 'words/', training: 'training/', 'exam-schedule': 'exam-schedule/', changelog: 'changelog/' };
    return { href: routes[params.get('next')] || '', login: params.get('login') === '1' };
  }

  function renderDots() {
    if (!dots) return;
    dots.innerHTML = '';
    var count = pages ? pages.children.length : 0;
    for (var index = 0; index < count; index += 1) {
      var dot = document.createElement('span');
      if (index === pageIndex) dot.classList.add('is-active');
      dots.appendChild(dot);
    }
  }

  function setPageFocusable(page, focusable) {
    if (!pages) return;
    var grid = pages.children[page];
    if (!grid) return;
    Array.prototype.forEach.call(grid.querySelectorAll('a,button'), function (node) {
      node.setAttribute('tabindex', focusable ? '0' : '-1');
    });
  }

  function goToPage(index) {
    if (!pages) return;
    var count = pages.children.length;
    pageIndex = Math.max(0, Math.min(index, count - 1));
    pages.style.transform = 'translateX(' + (-pageIndex * 100) + '%)';
    for (var page = 0; page < count; page += 1) setPageFocusable(page, page === pageIndex);
    renderDots();
  }

  /* 拖动中页面向手指移动的方向跟手位移。首末页继续拖动时产生
   * 回弹阻力（位移缩小到 1/3），松手后自然回弹。 */
  function applyDrag(dx) {
    if (!pages) return;
    var count = pages.children.length;
    var limit = 0;
    if (pageIndex === 0 && dx > 0) limit = dx / 3;
    else if (pageIndex === count - 1 && dx < 0) limit = dx / 3;
    else limit = dx;
    dragOffset = limit;
    pages.style.transform = 'translateX(' + (-pageIndex * 100 + limit) + '%)';
    pages.style.transition = 'none';
  }

  function settleDrag() {
    if (!pages) return;
    pages.style.transition = '';
    pages.style.transform = 'translateX(' + (-pageIndex * 100) + '%)';
    dragOffset = 0;
  }

  function startDrag(x, y) {
    if (!pages || dragStartX !== null) return;
    dragStartX = x;
    dragStartY = y;
    dragStartT = Date.now();
    dragActive = false;
  }

  function moveDrag(x, y) {
    if (dragStartX === null) return;
    var dx = x - dragStartX;
    var dy = y - dragStartY;
    if (!dragActive) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      dragActive = true;
    }
    dragPrevX = dragLastX;
    dragPrevT = dragLastT;
    dragLastX = x;
    dragLastT = Date.now();
    applyDrag(dx);
  }

  function endDrag(x, y) {
    if (dragStartX === null) return;
    var dx = x - dragStartX;
    dragStartX = null;
    dragStartY = null;
    if (!dragActive) return;
    dragActive = false;
    var width = pages.clientWidth || 1;
    var count = pages.children.length;
    /* 速度优先取最后两格位移/时间差；单次移动（如轻扫）退化为
     * 总位移/总时长，否则快速轻扫永远只有一格样本。 */
    var elapsed = Math.max(1, dragLastT - dragPrevT);
    var velocity = Math.abs(dragLastX - dragPrevX) / elapsed;
    if (!velocity) {
      var totalElapsed = Math.max(1, dragLastT - dragStartT);
      velocity = Math.abs(dragLastX - dragStartX) / totalElapsed;
    }
    var threshold = width * .18;
    var next = pageIndex;
    if (dx < -threshold || (dx < 0 && velocity > .6)) next = pageIndex + 1;
    else if (dx > threshold || (dx > 0 && velocity > .6)) next = pageIndex - 1;
    next = Math.max(0, Math.min(next, count - 1));
    if (next !== pageIndex) {
      suppressClick = true;
      window.setTimeout(function () { suppressClick = false; }, 350);
    }
    goToPage(next);
  }

  function goToPage(index) {
    if (!pages) return;
    var count = pages.children.length;
    pageIndex = Math.max(0, Math.min(index, count - 1));
    pages.style.transition = '';
    pages.style.transform = 'translateX(' + (-pageIndex * 100) + '%)';
    dragOffset = 0;
    for (var page = 0; page < count; page += 1) setPageFocusable(page, page === pageIndex);
    renderDots();
  }

  function bindPages() {
    pages = document.querySelector('[data-pages]');
    dots = document.querySelector('[data-page-dots]');
    if (!pages) return;

    /* 拖动监听挂在 phone-home（pages 的父容器）上：第二页内容少，
     * 手指常落在图标下方的空白区域，事件目标是 phone-home 而非 pages。 */
    var host = document.querySelector('.phone-home') || document;

    host.addEventListener('touchstart', function (event) {
      startDrag(event.touches[0].clientX, event.touches[0].clientY);
    }, { passive: true });

    host.addEventListener('touchmove', function (event) {
      if (dragStartX === null || !event.touches.length) return;
      /* 激活后拦截横滑，避免页面纵向滚动；未激活时放行（纵向手势）。 */
      if (dragActive) event.preventDefault();
      moveDrag(event.touches[0].clientX, event.touches[0].clientY);
    }, { passive: false });

    host.addEventListener('touchend', function (event) {
      var touch = event.changedTouches[0];
      if (touch) endDrag(touch.clientX, touch.clientY);
    });

    host.addEventListener('touchcancel', function () {
      dragStartX = null;
      dragStartY = null;
      dragActive = false;
      if (dragOffset) settleDrag();
    });

    /* Pointer 事件覆盖触摸与鼠标（触屏浏览器不触发 touch 事件时）。 */
    host.addEventListener('pointerdown', function (event) {
      if (event.pointerType !== 'touch') return;
      if ('ontouchstart' in window) return;
      startDrag(event.clientX, event.clientY);
    });
    host.addEventListener('pointermove', function (event) {
      if (event.pointerType !== 'touch' || dragStartX === null) return;
      if (dragActive) event.preventDefault();
      moveDrag(event.clientX, event.clientY);
    });
    host.addEventListener('pointerup', function (event) {
      if (event.pointerType !== 'touch') return;
      endDrag(event.clientX, event.clientY);
    });
    host.addEventListener('pointercancel', function () {
      dragStartX = null;
      dragStartY = null;
      dragActive = false;
      if (dragOffset) settleDrag();
    });

    /* 鼠标拖动同样可用（桌面预览翻页）。 */
    host.addEventListener('mousedown', function (event) {
      if (event.button !== 0) return;
      /* 按住图标/链接时是正常点击，只有实际横向拖动后才拦截。 */
      startDrag(event.clientX, event.clientY);
    });
    document.addEventListener('mousemove', function (event) {
      if (dragStartX === null) return;
      moveDrag(event.clientX, event.clientY);
    });
    document.addEventListener('mouseup', function (event) {
      if (dragStartX === null) return;
      endDrag(event.clientX, event.clientY);
    });
    document.addEventListener('click', function (event) {
      /* 翻页后吞掉同一个手势触发的 click，避免误触应用。 */
      if (suppressClick) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);

    if (window.matchMedia && matchMedia('(max-width: 519px)').addEventListener) {
      matchMedia('(max-width: 519px)').addEventListener('change', function (media) {
        if (!media.matches) goToPage(0);
      });
    }

    if (pages.setAttribute) {
      pages.setAttribute('tabindex', '0');
      pages.setAttribute('aria-label', '应用页面，可左右滑动切换');
      pages.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowRight' && pageIndex < pages.children.length - 1) { event.preventDefault(); goToPage(pageIndex + 1); }
        else if (event.key === 'ArrowLeft' && pageIndex > 0) { event.preventDefault(); goToPage(pageIndex - 1); }
      });
    }

    renderDots();
  }

  document.addEventListener('DOMContentLoaded', function () {
    layer = document.querySelector('[data-login-layer]');
    updateClock();
    window.setInterval(updateClock, 30000);
    document.querySelector('[data-login-open]').addEventListener('click', openLogin);
    Array.prototype.forEach.call(document.querySelectorAll('[data-login-close]'), function (button) { button.addEventListener('click', closeLogin); });
    document.addEventListener('keydown', handleKeydown);
    bindPages();
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
