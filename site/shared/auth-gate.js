/* Client-side route guard. Supabase RLS remains the authoritative data boundary. */
(function () {
  'use strict';

  var app = document.documentElement.dataset.app || '';
  if (!app) return;

  /* vendor/supabase.js persists the full session JSON under this key. */
  function cachedSession() {
    try {
      var raw = localStorage.getItem('supabase.auth.token');
      if (!raw) return null;
      var session = JSON.parse(raw);
      return session && session.user ? session : null;
    } catch (_) { return null; }
  }

  function authenticate(session) {
    if (!session || !session.user) return false;
    document.documentElement.setAttribute('data-authenticated', '');
    /* Authentication protects the route; cloud sync is local-first background work. */
    document.documentElement.setAttribute('data-auth-ready', '');
    return true;
  }

  /* The SDK could not verify (offline) but this device holds a stored session:
   * keep the app usable on local data instead of bouncing to the portal. Cloud
   * sync degrades to its usual retry. */
  function enterLocalMode() {
    document.documentElement.setAttribute('data-auth-ready', '');
  }

  function requireLogin() {
    document.documentElement.removeAttribute('data-auth-ready');
    document.documentElement.removeAttribute('data-authenticated');
    var target = '../?login=1&next=' + encodeURIComponent(app);
    if (window.location && typeof window.location.replace === 'function') window.location.replace(target);
  }

  window.HubAuth.onChange(function (session) {
    if (!authenticate(session)) requireLogin();
  });
  window.HubAuth.init().then(function (session) {
    if (authenticate(session)) return;
    if (cachedSession()) enterLocalMode();
    else requireLogin();
  }).catch(function () {
    if (cachedSession()) enterLocalMode();
    else requireLogin();
  });

  window.addEventListener('hub:sync-status', function (event) {
    var detail = event.detail || {};
    if (detail.app !== app) return;
    if (detail.state === 'synced') {
      document.documentElement.removeAttribute('data-auth-error');
    } else if (detail.state === 'error') {
      document.documentElement.setAttribute('data-auth-error', '');
    }
  });
})();
