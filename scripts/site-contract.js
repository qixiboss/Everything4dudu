'use strict';

/*
 * 单一静态站点的可验证契约。
 * 运行时 HTML 直接维护这些标签；测试和完整性检查从这里读取顺序，避免把
 * 发布结构再次藏进构建脚本。
 */
const APP_ROUTES = Object.freeze({
  words: 'words/',
  training: 'training/',
  'exam-schedule': 'exam-schedule/',
  changelog: 'changelog/',
  'cost-trace': 'CostTrace/'
});

const AUTH_SCRIPT_TAGS = Object.freeze([
  '<script defer src="../shared/vendor/supabase.js"></script>',
  '<script defer src="../shared/config.js"></script>',
  '<script defer src="../shared/hub-auth.js"></script>',
  '<script defer src="../shared/auth-gate.js"></script>',
  '<script defer src="../shared/hub-shell.js"></script>'
]);

const SYNC_SCRIPT_TAGS = Object.freeze([
  ...AUTH_SCRIPT_TAGS.slice(0, -1),
  '<script defer src="../shared/sync-store.js"></script>',
  '<script defer src="../shared/hub-sync.js"></script>',
  '<script defer src="../shared/hub-shell.js"></script>'
]);

function authScriptTags() { return [...AUTH_SCRIPT_TAGS]; }
function syncScriptTags() { return [...SYNC_SCRIPT_TAGS]; }
/* Backward-compatible name used by the WordTales integrity checker. */
function sharedScriptTags() { return syncScriptTags(); }

module.exports = { APP_ROUTES, authScriptTags, syncScriptTags, sharedScriptTags };
