/*
 * Public Supabase browser configuration.
 *
 * Fill these values after creating or selecting the WordTales Supabase project.
 * A publishable key is intended to be exposed in a browser. Never put a
 * service_role or secret key in this file.
 */
window.WordTalesSupabaseConfig = window.WordTalesSupabaseConfig || {
  url: window.HubConfig && window.HubConfig.supabaseUrl,
  publishableKey: window.HubConfig && window.HubConfig.publishableKey
};
