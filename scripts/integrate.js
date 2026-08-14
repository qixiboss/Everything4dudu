#!/usr/bin/env node
/* 门户整合:把三个应用仓库(本地克隆)的原始代码复制到目标目录,注入
 * 门户共享脚本、CSP、登录门与同步适配器。由 build-site.js 在构建 _site/
 * 时调用;应用代码只存在于各自的仓库,本文件不提交任何应用内容。 */

const fs = require('node:fs');
const path = require('node:path');

const portalRoot = path.resolve(__dirname, '..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function replaceOnce(source, search, replacement, label) {
  const occurrences = typeof search === 'string'
    ? source.split(search).length - 1
    : [...source.matchAll(new RegExp(search.source, search.flags.includes('g') ? search.flags : `${search.flags}g`))].length;
  assert(occurrences === 1, `${label}: expected one integration anchor, found ${occurrences}.`);
  return source.replace(search, replacement);
}

/* 门户注入给每个应用的共享脚本清单:这里是唯一权威来源,
 * tests/portal.test.js 与 scripts/check-integrity.js 在运行时直接引用,
 * 新增或删除共享脚本只需改这一处。 */
function sharedScriptTags() {
  return [
    '<script defer src="../shared/vendor/supabase.js"></script>',
    '<script defer src="../shared/config.js"></script>',
    '<script defer src="../shared/hub-auth.js"></script>',
    '<script defer src="../shared/auth-gate.js"></script>',
    '<script defer src="../shared/sync-store.js"></script>',
    '<script defer src="../shared/hub-sync.js"></script>',
    '<script defer src="../shared/hub-shell.js"></script>'
  ];
}

function sharedScripts() {
  return sharedScriptTags().join('\n');
}

function copyDir(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
}

/* 读取门户自有文件(integrations/ 适配器等)。 */
function read(relativePath) {
  return fs.readFileSync(path.join(portalRoot, relativePath), 'utf8');
}

function write(destRoot, relativePath, contents) {
  const destination = path.join(destRoot, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, contents);
}

function buildWords(appRoot, destRoot) {
  const source = path.join(appRoot, 'words', 'vocab-essays');
  assert(fs.existsSync(path.join(source, 'vocab-essays.html')), 'WordTales entry page is missing.');
  copyDir(source, path.join(destRoot, 'words'));
  /* 上游残留的旧 Supabase 浏览器包已无引用（由 shared/vendor/supabase.js
   * 取代），复制后显式移除，保持与已提交目录一致。 */
  fs.rmSync(path.join(destRoot, 'words', 'vendor', 'supabase-js'), { recursive: true, force: true });

  let html = fs.readFileSync(path.join(source, 'vocab-essays.html'), 'utf8');
  html = replaceOnce(html, '<html lang="zh-CN">', '<html lang="zh-CN" data-app="words">', 'WordTales html element');
  html = replaceOnce(
    html,
    '<meta name="description" content="通过主题短文、双面词卡、语音朗读、练习和学习记录表，在真实语境中学习和记忆英语词汇。">',
    '<meta name="description" content="通过主题短文、双面词卡、语音朗读、练习和学习记录表，在真实语境中学习和记忆英语词汇。">\n<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; connect-src https://nhqncjwfspaxlggmsoxg.supabase.co wss://nhqncjwfspaxlggmsoxg.supabase.co; img-src \'self\' data:; media-src \'self\' blob:; object-src \'none\'; base-uri \'self\'; form-action \'none\'; frame-src \'none\'">',
    'WordTales content security policy'
  );
  html = replaceOnce(
    html,
    '<link rel="stylesheet" href="css/styles.css?v=3.0.6">',
    '<link rel="stylesheet" href="css/styles.css?v=3.0.6">\n<link rel="stylesheet" href="../shared/hub.css">',
    'WordTales stylesheet'
  );
  html = replaceOnce(html, '<body>', '<body>\n<div id="hub-shell"></div>', 'WordTales body');
  html = replaceOnce(
    html,
    '<script defer src="vendor/supabase-js/supabase.js?v=2.112.2"></script>',
    sharedScripts(),
    'WordTales Supabase client'
  );
  html = replaceOnce(
    html,
    '<script defer src="js/cloud-sync.js?v=1.0.0"></script>',
    '<script defer src="js/cloud-sync.js?v=2.0.0"></script>\n\n<script defer src="js/hub-sync.js?v=1.2.0"></script>',
    'WordTales cloud adapter'
  );

  write(destRoot, 'words/index.html', html);
  fs.rmSync(path.join(destRoot, 'words', 'vocab-essays.html'));
  write(destRoot, 'words/js/auth.js', read('integrations/words/auth.js'));
  write(destRoot, 'words/js/supabase-config.js', read('integrations/words/supabase-config.js'));
  write(destRoot, 'words/js/hub-sync.js', read('integrations/words/hub-sync.js'));
  /* cloud-sync.js 是门户自有桩文件：保留登录生命周期与
   * HubProfileSync.queue() 钩子，停用旧的 learning_profiles 全量上传。 */
  write(destRoot, 'words/js/cloud-sync.js', read('integrations/words/cloud-sync.js'));
}

function buildTraining(appRoot, destRoot) {
  const source = path.join(appRoot, 'training');
  /* 只复制应用文件,不携带克隆仓库自身的 .git 等元数据。 */
  fs.mkdirSync(path.join(destRoot, 'training'), { recursive: true });
  ['index.html', 'styles.css', 'app.js'].forEach((file) => {
    assert(fs.existsSync(path.join(source, file)), `Training source is missing ${file}.`);
    fs.copyFileSync(path.join(source, file), path.join(destRoot, 'training', file));
  });

  let html = fs.readFileSync(path.join(source, 'index.html'), 'utf8');
  html = replaceOnce(html, '<html lang="zh-CN">', '<html lang="zh-CN" data-app="training">', 'Training html element');
  html = replaceOnce(
    html,
    '<meta name="theme-color" content="#F5F4F0">',
    '<meta name="theme-color" content="#F5F4F0">\n<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; connect-src https://nhqncjwfspaxlggmsoxg.supabase.co wss://nhqncjwfspaxlggmsoxg.supabase.co; img-src \'self\' data:; media-src \'self\' blob:; object-src \'none\'; base-uri \'self\'; form-action \'none\'; frame-src \'none\'">',
    'Training content security policy'
  );
  html = replaceOnce(
    html,
    '<link rel="stylesheet" href="styles.css">',
    '<link rel="stylesheet" href="styles.css">\n<link rel="stylesheet" href="../shared/hub.css">',
    'Training stylesheet'
  );
  html = replaceOnce(html, '<body>', '<body>\n<div id="hub-shell"></div>', 'Training body');
  html = replaceOnce(
    html,
    '<script src="app.js"></script>',
    `${sharedScripts()}\n<script defer src="hub-sync.js"></script>\n<script defer src="app.js"></script>`,
    'Training application script'
  );
  write(destRoot, 'training/index.html', html);
  write(destRoot, 'training/hub-sync.js', read('integrations/training/hub-sync.js'));
}

function decodeHtmlAttribute(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function buildExamSchedule(appRoot, destRoot) {
  const sourcePath = path.join(appRoot, 'exam-schedule', 'index.html');
  assert(fs.existsSync(sourcePath), 'Exam schedule entry page is missing.');
  const wrapper = fs.readFileSync(sourcePath, 'utf8');
  const srcdoc = wrapper.match(/srcdoc="([\s\S]*?)">\s*<\/iframe>/i);
  assert(srcdoc, 'Exam schedule iframe srcdoc could not be extracted.');
  let html = decodeHtmlAttribute(srcdoc[1]);
  assert(/<!doctype html>/i.test(html), 'Extracted exam schedule is not a complete HTML document.');
  assert(html.includes('kaoyan-first-round-state-v4'), 'Exam schedule storage contract has changed.');

  html = replaceOnce(html, '<html lang="zh-CN">', '<html lang="zh-CN" data-app="exam-schedule">', 'Exam schedule html element');
  const currentCsp = "default-src 'none'; script-src 'unsafe-inline' https://unpkg.com; style-src 'unsafe-inline'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
  const portalCsp = "default-src 'none'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline'; connect-src https://nhqncjwfspaxlggmsoxg.supabase.co wss://nhqncjwfspaxlggmsoxg.supabase.co; img-src 'self' data:; media-src 'self' blob:; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
  html = replaceOnce(html, currentCsp, portalCsp, 'Exam schedule content security policy');
  html = replaceOnce(
    html,
    '<title>考研一轮学习日程</title>',
    '<title>考研一轮学习日程</title>\n<link rel="stylesheet" href="../shared/hub.css">',
    'Exam schedule title'
  );
  html = replaceOnce(
    html,
    '<body>',
    `<body>\n<div id="hub-shell"></div>\n${sharedScripts()}\n<script defer src="hub-sync.js"></script>`,
    'Exam schedule body'
  );
  write(destRoot, 'exam-schedule/index.html', html);
  write(destRoot, 'exam-schedule/hub-sync.js', read('integrations/exam-schedule/hub-sync.js'));
}

function integrateApps(appRoot, destRoot) {
  buildWords(appRoot, destRoot);
  buildTraining(appRoot, destRoot);
  buildExamSchedule(appRoot, destRoot);
}

module.exports = { integrateApps, sharedScriptTags, sharedScripts };
