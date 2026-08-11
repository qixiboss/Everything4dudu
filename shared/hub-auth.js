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
  function signInWithMagicLink(email) {
    email = String(email || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return Promise.reject(new Error('请输入有效的邮箱地址。'));
    if (!client) return Promise.reject(new Error('登录服务尚未配置。'));
    return client.auth.signInWithOtp({ email: email, options: { emailRedirectTo: window.location.href.split('#')[0] } })
      .then(function (result) { if (result.error) throw result.error; return true; });
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
    signInWithMagicLink: signInWithMagicLink,
    signOut: signOut
  };
})();
