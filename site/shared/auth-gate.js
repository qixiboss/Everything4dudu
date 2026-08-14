/* Client-side route guard. Supabase RLS remains the authoritative data boundary. */
(function () {
  'use strict';

  var app = document.documentElement.dataset.app || '';
  if (!app) return;

  function authenticate(session) {
    if (!session || !session.user) return false;
    document.documentElement.setAttribute('data-authenticated', '');
    /* Authentication protects the route; cloud sync is local-first background work. */
    document.documentElement.setAttribute('data-auth-ready', '');
    return true;
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
    if (!authenticate(session)) requireLogin();
  }).catch(requireLogin);

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
