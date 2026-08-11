(function () {
  'use strict';

  var client = null;
  var session = null;
  var ready = null;
  var listeners = [];

  function config() { return window.HubConfig || {}; }
  function isConfigured() { return !!(config().supabaseUrl && config().publishableKey && window.supabase); }
  function notify() {
    listeners.slice().forEach(function (listener) { listener(session); });
    window.dispatchEvent(new CustomEvent('hub:auth-change', { detail: session }));
  }
  function setSession(next) { session = next || null; notify(); }
  function init() {
    if (ready) return ready;
    if (!isConfigured()) return ready = Promise.resolve(null);
    client = window.supabase.createClient(config().supabaseUrl, config().publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    client.auth.onAuthStateChange(function (_event, next) { setSession(next); });
    ready = client.auth.getSession().then(function (result) {
      if (result.error) throw result.error;
      setSession(result.data.session);
      return session;
    }).catch(function (error) {
      console.warn('Hub auth unavailable:', error.message);
      return null;
    });
    return ready;
  }
  function normalizeEmail(email) {
    email = String(email || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('请输入有效的邮箱地址。');
    return email;
  }
  function normalizePassword(password, isRegistration) {
    password = String(password || '');
    if (!password) throw new Error('请输入密码。');
    if (isRegistration && password.length < 8) throw new Error('密码至少需要 8 位。');
    return password;
  }
  function signInWithPassword(email, password) {
    try { email = normalizeEmail(email); }
    catch (error) { return Promise.reject(error); }
    try { password = normalizePassword(password, false); }
    catch (error) { return Promise.reject(error); }
    if (!client) return Promise.reject(new Error('登录服务尚未配置。'));
    return client.auth.signInWithPassword({ email: email, password: password })
      .then(function (result) {
        if (result.error) throw result.error;
        if (!result.data || !result.data.session) throw new Error('登录失败，请重试。');
        setSession(result.data.session);
        return result.data.session;
      });
  }
  function signUpWithPassword(email, password) {
    try { email = normalizeEmail(email); }
    catch (error) { return Promise.reject(error); }
    try { password = normalizePassword(password, true); }
    catch (error) { return Promise.reject(error); }
    if (!client) return Promise.reject(new Error('登录服务尚未配置。'));
    return client.auth.signUp({ email: email, password: password })
      .then(function (result) {
        if (result.error) throw result.error;
        if (result.data && result.data.session) setSession(result.data.session);
        return {
          session: result.data && result.data.session ? result.data.session : null,
          requiresEmailConfirmation: !(result.data && result.data.session)
        };
      });
  }
  function signOut() {
    if (!client) return Promise.resolve();
    return client.auth.signOut().then(function (result) { if (result.error) throw result.error; });
  }
  window.HubAuth = {
    init: init,
    isConfigured: isConfigured,
    getClient: function () { return client; },
    getSession: function () { return session; },
    onChange: function (listener) {
      listeners.push(listener);
      return function () { listeners = listeners.filter(function (value) { return value !== listener; }); };
    },
    signInWithPassword: signInWithPassword,
    signUpWithPassword: signUpWithPassword,
    signOut: signOut
  };
})();
