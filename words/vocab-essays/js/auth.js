/* ============================================================
 * Module: Auth
 * Supabase Magic Link 登录。未配置或离线时，学习功能仍完全可用。
 * ============================================================ */
WordTales.Auth = (function() {
  var client = null;
  var session = null;
  var initialized = false;
  var listeners = [];
  var mount = null;

  function config() { return window.WordTalesSupabaseConfig || {}; }
  function configured() {
    var value = config();
    return !!(value.url && value.publishableKey && window.supabase && window.supabase.createClient);
  }
  function notify() { listeners.slice().forEach(function(listener) { listener(session); }); }
  function emailLabel(email) { return email ? email.replace(/^(.{2}).*(@.*)$/, '$1…$2') : ''; }
  function redirectUrl() { return window.location.href.split('#')[0]; }
  function setStatus(message, error) {
    if (!mount) return;
    var status = mount.querySelector('.auth-status');
    if (!status) return;
    status.textContent = message || '';
    status.classList.toggle('error', !!error);
  }
  function render() {
    mount = document.getElementById('authMount');
    if (!mount) return;
    mount.innerHTML = '';
    if (!configured()) {
      var offline = document.createElement('p');
      offline.className = 'auth-status auth-status-muted';
      offline.textContent = '本地进度模式';
      mount.appendChild(offline);
      return;
    }
    if (session && session.user) {
      var signedIn = document.createElement('div');
      signedIn.className = 'auth-signed-in';
      var identity = document.createElement('span');
      identity.className = 'auth-identity';
      identity.textContent = '已同步：' + emailLabel(session.user.email);
      signedIn.appendChild(identity);
      var signOutButton = document.createElement('button');
      signOutButton.type = 'button';
      signOutButton.className = 'auth-button auth-signout';
      signOutButton.textContent = '退出';
      signOutButton.addEventListener('click', signOut);
      signedIn.appendChild(signOutButton);
      mount.appendChild(signedIn);
      var signedInStatus = document.createElement('p');
      signedInStatus.className = 'auth-status';
      signedInStatus.setAttribute('role', 'status');
      signedInStatus.setAttribute('aria-live', 'polite');
      mount.appendChild(signedInStatus);
      return;
    }
    var form = document.createElement('form');
    form.className = 'auth-form';
    form.noValidate = true;
    var input = document.createElement('input');
    input.type = 'email';
    input.className = 'auth-email';
    input.name = 'email';
    input.autocomplete = 'email';
    input.placeholder = '邮箱，用于同步进度';
    input.setAttribute('aria-label', '邮箱，用于同步学习进度');
    form.appendChild(input);
    var submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'auth-button';
    submit.textContent = '发送登录链接';
    form.appendChild(submit);
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      sendMagicLink(input.value, submit);
    });
    mount.appendChild(form);
    var status = document.createElement('p');
    status.className = 'auth-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    mount.appendChild(status);
  }
  function changeSession(nextSession) {
    session = nextSession || null;
    render();
    notify();
  }
  function init() {
    if (initialized) return Promise.resolve(api);
    initialized = true;
    render();
    if (!configured()) return Promise.resolve(api);
    client = window.supabase.createClient(config().url, config().publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    client.auth.onAuthStateChange(function(event, nextSession) {
      changeSession(nextSession);
    });
    return client.auth.getSession().then(function(result) {
      if (result.error) throw result.error;
      changeSession(result.data.session);
      return api;
    }).catch(function(error) {
      setStatus('无法连接登录服务：' + error.message, true);
      return api;
    });
  }
  function sendMagicLink(email, button) {
    email = String(email || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) { setStatus('请输入有效的邮箱地址。', true); return Promise.resolve(false); }
    if (!client) { setStatus('登录服务尚未配置。', true); return Promise.resolve(false); }
    if (button) { button.disabled = true; button.textContent = '正在发送…'; }
    setStatus('');
    return client.auth.signInWithOtp({ email: email, options: { emailRedirectTo: redirectUrl() } }).then(function(result) {
      if (result.error) throw result.error;
      setStatus('登录链接已发送，请在此设备上打开邮件中的链接。');
      return true;
    }).catch(function(error) {
      setStatus('发送失败：' + error.message, true);
      return false;
    }).finally(function() {
      if (button) { button.disabled = false; button.textContent = '发送登录链接'; }
    });
  }
  function signOut() {
    if (!client) return Promise.resolve();
    setStatus('正在退出…');
    return client.auth.signOut().then(function(result) {
      if (result.error) throw result.error;
    }).catch(function(error) { setStatus('退出失败：' + error.message, true); });
  }

  var api = {
    init: init,
    isConfigured: configured,
    getClient: function() { return client; },
    getSession: function() { return session; },
    onChange: function(listener) { listeners.push(listener); return function() { listeners = listeners.filter(function(value) { return value !== listener; }); }; },
    setStatus: setStatus
  };
  return api;
})();
