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

const SHARED_SCRIPT_TAGS = Object.freeze([
  '<script defer src="../shared/vendor/supabase.js"></script>',
  '<script defer src="../shared/config.js"></script>',
  '<script defer src="../shared/hub-auth.js"></script>',
  '<script defer src="../shared/auth-gate.js"></script>',
  '<script defer src="../shared/sync-store.js"></script>',
  '<script defer src="../shared/hub-sync.js"></script>',
  '<script defer src="../shared/hub-shell.js"></script>'
]);

function sharedScriptTags() {
  return [...SHARED_SCRIPT_TAGS];
}

module.exports = { APP_ROUTES, sharedScriptTags };
