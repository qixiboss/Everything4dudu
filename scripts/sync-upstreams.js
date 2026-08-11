#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const upstreamRoot = path.resolve(process.env.UPSTREAM_ROOT || path.join(root, '_upstreams'));
const stagingRoot = fs.mkdtempSync(path.join(root, '.upstream-sync-'));

const sources = {
  words: {
    directory: 'WordTales',
    repository: 'https://github.com/qixiboss/WordTales.git'
  },
  training: {
    directory: 'Train_record',
    repository: 'https://github.com/qixiboss/Train_record.git'
  },
  examSchedule: {
    directory: 'GraduateSchedule',
    repository: 'https://github.com/qixiboss/-Graduate-Entrance-Exam-Schedule.git'
  }
};

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

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function write(relativePath, contents) {
  const destination = path.join(stagingRoot, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, contents);
}

function copy(source, relativeDestination) {
  const destination = path.join(stagingRoot, relativeDestination);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
}

function commitFor(directory) {
  return execFileSync('git', ['-C', path.join(upstreamRoot, directory), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

function sharedScripts() {
  return [
    '<script defer src="../shared/vendor/supabase.js"></script>',
    '<script defer src="../shared/config.js"></script>',
    '<script defer src="../shared/hub-auth.js"></script>',
    '<script defer src="../shared/auth-gate.js"></script>',
    '<script defer src="../shared/sync-store.js"></script>',
    '<script defer src="../shared/hub-sync.js"></script>',
    '<script defer src="../shared/hub-shell.js"></script>'
  ].join('\n');
}

function buildWords() {
  const source = path.join(upstreamRoot, sources.words.directory, 'vocab-essays');
  assert(fs.existsSync(path.join(source, 'vocab-essays.html')), 'WordTales entry page is missing.');
  copy(source, 'words');

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
    '<script defer src="js/cloud-sync.js?v=1.0.0"></script>\n\n<script defer src="js/hub-sync.js?v=1.1.0"></script>',
    'WordTales cloud adapter'
  );

  write('words/index.html', html);
  fs.rmSync(path.join(stagingRoot, 'words/vocab-essays.html'));
  write('words/js/auth.js', read('integrations/words/auth.js'));
  write('words/js/supabase-config.js', read('integrations/words/supabase-config.js'));
  write('words/js/hub-sync.js', read('integrations/words/hub-sync.js'));

  let cloudSync = fs.readFileSync(path.join(source, 'js/cloud-sync.js'), 'utf8');
  cloudSync = replaceOnce(
    cloudSync,
    'timer = setTimeout(function() { timer = null; upload(); }, 1400);',
    'timer = setTimeout(function() {\n      timer = null;\n      upload().then(function() { if (WordTales.HubProfileSync) WordTales.HubProfileSync.queue(); });\n    }, 1400);',
    'WordTales upload schedule'
  );
  cloudSync = replaceOnce(
    cloudSync,
    '}).finally(function() { syncing = false; });\n  }\n  function init()',
    '}).finally(function() {\n      syncing = false;\n      /* Migrate the resolved legacy profile, not the pre-login browser cache. */\n      if (WordTales.HubProfileSync) { WordTales.HubProfileSync.start(); WordTales.HubProfileSync.queue(); }\n    });\n  }\n  function init()',
    'WordTales legacy profile migration'
  );
  write('words/js/cloud-sync.js', cloudSync);
}

function buildTraining() {
  const source = path.join(upstreamRoot, sources.training.directory);
  ['index.html', 'styles.css', 'app.js'].forEach((file) => {
    assert(fs.existsSync(path.join(source, file)), `Training source is missing ${file}.`);
    copy(path.join(source, file), `training/${file}`);
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
  write('training/index.html', html);
  write('training/hub-sync.js', read('integrations/training/hub-sync.js'));
}

function decodeHtmlAttribute(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function buildExamSchedule() {
  const sourcePath = path.join(upstreamRoot, sources.examSchedule.directory, 'index.html');
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
  write('exam-schedule/index.html', html);
  write('exam-schedule/hub-sync.js', read('integrations/exam-schedule/hub-sync.js'));
}

function installGeneratedDirectory(name) {
  const source = path.join(stagingRoot, name);
  const destination = path.join(root, name);
  assert(fs.existsSync(source), `Generated ${name} directory is missing.`);
  fs.rmSync(destination, { recursive: true, force: true });
  fs.renameSync(source, destination);
}

try {
  Object.values(sources).forEach(({ directory }) => {
    assert(fs.existsSync(path.join(upstreamRoot, directory, '.git')), `Missing checked-out upstream: ${directory}.`);
  });
  buildWords();
  buildTraining();
  buildExamSchedule();
  ['words', 'training', 'exam-schedule'].forEach(installGeneratedDirectory);

  const manifest = {
    schemaVersion: 1,
    sources: Object.fromEntries(Object.entries(sources).map(([name, source]) => [name, {
      repository: source.repository,
      commit: commitFor(source.directory)
    }]))
  };
  fs.writeFileSync(path.join(root, 'upstreams.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log('Synced WordTales, Train_record and Graduate Entrance Exam Schedule.');
} finally {
  fs.rmSync(stagingRoot, { recursive: true, force: true });
}
