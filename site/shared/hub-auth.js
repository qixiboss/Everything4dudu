(function () {
  'use strict';

  var client = null;
  var session = null;
  var ready = null;
  var listeners = [];
  var sessionFingerprint = '';

  function config() { return window.HubConfig || {}; }
  function isConfigured() { return !!(config().supabaseUrl && config().publishableKey && window.supabase); }
  function notify() {
    listeners.slice().forEach(function (listener) { listener(session); });
    window.dispatchEvent(new CustomEvent('hub:auth-change', { detail: session }));
  }
  function fingerprint(value) {
    if (!value || !value.user) return '';
    return [value.user.id || '', value.access_token || '', value.expires_at || ''].join('|');
  }
  function setSession(next) {
    var normalized = next || null;
    var nextFingerprint = fingerprint(normalized);
    if (nextFingerprint === sessionFingerprint && (!!normalized === !!session)) return false;
    session = normalized;
    sessionFingerprint = nextFingerprint;
    notify();
    return true;
  }
  function init() {
    if (ready) return ready;
    if (!isConfigured()) return ready = Promise.resolve(null);
    client = window.supabase.createClient(config().supabaseUrl, config().publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        /* Do not leave route entry hanging forever on a stale cross-tab Web Lock. */
        lockAcquireTimeout: 2500
      }
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
  function normalizePassword(password) {
    password = String(password || '');
    if (!password) throw new Error('请输入密码。');
    return password;
  }
  function signInWithPassword(email, password) {
    try { email = normalizeEmail(email); }
    catch (error) { return Promise.reject(error); }
    try { password = normalizePassword(password); }
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
  function signOut() {
    if (!client) return Promise.resolve();
    return client.auth.signOut().then(function (result) {
      if (result.error) throw result.error;
      setSession(null);
    });
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
    signOut: signOut
  };
})();
