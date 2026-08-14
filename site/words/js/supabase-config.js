/* WordTales compatibility alias for the portal's public browser configuration. */
window.WordTalesSupabaseConfig = window.WordTalesSupabaseConfig || {
  url: window.HubConfig && window.HubConfig.supabaseUrl,
  publishableKey: window.HubConfig && window.HubConfig.publishableKey
};
