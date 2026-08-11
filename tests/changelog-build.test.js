#!/usr/bin/env node
/* 本地冒烟测试：模拟 sync-upstreams.js 中 buildChangelog 的流程，
 * 验证重复执行不会重复注入共享脚本（幂等），且生成结果与已提交的
 * changelog/index.html 完全一致。 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'scripts/sync-upstreams.js'), 'utf8');

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  assert(start !== -1, `function ${name} not found`);
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const c = source[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === '{') depth += 1;
    else if (c === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`unbalanced braces in ${name}`);
}

function runBuildChangelog() {
  const htmlIn = {};
  const copied = [];
  const sandbox = {
    path,
    root,
    assert: assert.ok ? (c, m) => assert.ok(c, m) : assert,
    read: (p) => htmlIn[p] !== undefined ? htmlIn[p] : fs.readFileSync(path.join(root, p), 'utf8'),
    write: (p, contents) => { htmlIn[p] = contents; },
    copy: (src, dest) => { copied.push(dest); }
  };
  sandbox.require = (mod) => {
    if (mod === 'node:fs') return { readFileSync: (p) => fs.readFileSync(p, 'utf8'), copyFileSync: () => {}, cpSync: () => {} };
    if (mod === 'node:child_process') return { execFileSync: () => '0'.repeat(40) };
    throw new Error(`unexpected require: ${mod}`);
  };
  const context = vm.createContext(sandbox);
  const buildChangelog = extractFunction('buildChangelog');
  const sharedScripts = extractFunction('sharedScripts');
  vm.runInContext(`${buildChangelog}\n${sharedScripts}\nbuildChangelog();`, context);
  return { html: htmlIn['changelog/index.html'], copied };
}

const committed = fs.readFileSync(path.join(root, 'changelog/index.html'), 'utf8');
const expectedScripts = [
  '<script defer src="../shared/vendor/supabase.js"></script>',
  '<script defer src="../shared/config.js"></script>',
  '<script defer src="../shared/hub-auth.js"></script>',
  '<script defer src="../shared/auth-gate.js"></script>',
  '<script defer src="../shared/sync-store.js"></script>',
  '<script defer src="../shared/hub-sync.js"></script>',
  '<script defer src="../shared/hub-shell.js"></script>',
  '<script defer src="changelog.js"></script>'
].join('\n');

// 已提交的模板没有挂载 app 自身的脚本（sharedScripts 之外只有 changelog.js；
// 更新记录是只读版本历史，不生成同步适配器）。
const committedScripts = committed.split('\n').filter((line) => line.includes('<script defer')).map((line) => line.trim());
assert.deepEqual(committedScripts, expectedScripts.split('\n'));

// 运行两次生成：结果应与已提交文件一致（幂等，不重复注入）。
for (let i = 0; i < 2; i += 1) {
  const result = runBuildChangelog();
  assert.equal(result.html, committed, `run ${i + 1} output differs from committed changelog/index.html`);
  assert.deepEqual(result.copied.sort(), ['changelog/changelog.css', 'changelog/changelog.js']);
}

console.log('changelog build smoke test passed (idempotent, matches committed template).');
