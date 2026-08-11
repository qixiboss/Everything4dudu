/* WordTales adapter over the portal-wide Supabase session. */
WordTales.Auth = (function () {
  var session = null;
  var listeners = [];
  var mount = null;
  var initialized = false;

  function configured() { return !!(window.HubAuth && window.HubAuth.isConfigured()); }
  function notify() { listeners.slice().forEach(function (listener) { listener(session); }); }
  function emailLabel(email) { return email ? email.replace(/^(.{2}).*(@.*)$/, '$1…$2') : ''; }
  function setStatus(message, error) {
    var element = mount && mount.querySelector('.auth-status');
    if (element) { element.textContent = message || ''; element.classList.toggle('error', !!error); }
  }
  function render() {
    mount = document.getElementById('authMount');
    if (!mount) return;
    mount.innerHTML = '';
    var status = document.createElement('p');
    status.className = 'auth-status';
    status.setAttribute('role', 'status');
    if (session && session.user) status.textContent = '门户账号已同步：' + emailLabel(session.user.email);
    else status.textContent = configured() ? '请使用页面顶部邮箱登录以同步进度' : '本地进度模式';
    mount.appendChild(status);
  }
  function setSession(next) { session = next || null; render(); notify(); }
  function init() {
    if (initialized) return Promise.resolve(api);
    initialized = true;
    render();
    if (!configured()) return Promise.resolve(api);
    window.HubAuth.onChange(setSession);
    return window.HubAuth.init().then(function () { setSession(window.HubAuth.getSession()); return api; });
  }
  var api = {
    init: init,
    isConfigured: configured,
    getClient: function () { return window.HubAuth && window.HubAuth.getClient(); },
    getSession: function () { return session; },
    onChange: function (listener) { listeners.push(listener); return function () { listeners = listeners.filter(function (value) { return value !== listener; }); }; },
    setStatus: setStatus
  };
  return api;
})();
