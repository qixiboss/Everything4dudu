#!/usr/bin/env node
/* CostTrace 移动端布局回归检查:用真实 Chrome 在多个视口宽度下渲染
 * CostTrace(认证与云端同步用桩替换),检测以下违规:
 *   DOC        页面横向溢出(document.scrollWidth > clientWidth)
 *   VIEWPORT   元素越出视口左右边界
 *   CONTAINER  元素越出关键布局容器(且容器未声明 overflow 裁剪)
 *   OVERLAP    两个可见可交互元素(button/input/select/a)视觉重叠
 *   TABBAR     滚动到底部时固定底部导航遮挡交互元素
 * 零依赖,需要本机装有 Chrome/Edge(或 CHROME_BIN 指向)。CI 无浏览器,
 * 本工具为本地/手动回归用;`npm run verify` 不包含它。 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { execFileSync, execFile } = require('node:child_process');

const root = path.resolve(__dirname, '..');

const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 640 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 430, height: 932 },
  { width: 460, height: 800 },
  { width: 461, height: 800 },
  { width: 600, height: 900 },
  { width: 760, height: 900 },
  { width: 761, height: 900 },
  { width: 1081, height: 900 }
];

/* 注入到测试页的认证/同步桩:离线即可通过路由守卫,且让 sync-store
 * 走完一次“无云端数据”的激活流程。 */
const STUB = `(function () {
  'use strict';
  var session = { user: { id: 'layout-test-user' } };
  var noop = function () {};
  window.HubAuth = {
    init: function () { return Promise.resolve(session); },
    getSession: function () { return session; },
    getClient: function () {
      return {
        from: function () {
          return {
            select: function () { return Promise.resolve({ data: [], error: null }); },
            upsert: function () { return { select: function () { return Promise.resolve({ data: [], error: null }); } }; }
          };
        },
        channel: function () { return { on: function () { return this; }, subscribe: function () { return this; } }; },
        removeChannel: noop
      };
    },
    signInWithPassword: function () { return Promise.reject(new Error('stub')); },
    signOut: function () { return Promise.resolve(); },
    onChange: noop
  };
  /* 压力数据:260 条(13 页分页)、超大金额、超长明细、全部类别。 */
  try {
    var cats = ['衣', '食', '住', '行', '玩', '其他'];
    var records = [];
    for (var i = 0; i < 260; i += 1) {
      records.push({
        id: 'stress-' + i,
        date: '2026-08-' + String((i % 28) + 1).padStart(2, '0'),
        type: i % 5 === 0 ? 'income' : 'expense',
        category: i % 5 === 0 ? '一次性收入' : cats[i % cats.length],
        amountCents: i === 0 ? 12345678901 : (i + 1) * 13717,
        detail: i === 0 ? '超级无敌长的明细文字用来测试金额与长文本在卡片中的排布情况是否溢出'.repeat(4) : '记录明细 ' + i + ' 一段足够长的说明文字测试换行'
      });
    }
    localStorage.setItem('costtrace.transactions.v1', JSON.stringify(records));
  } catch (error) {}
})();`;

/* 诊断脚本:在虚拟时间轴上依次切换视图并做五类检查,最后把结果写进
 * <title>(headless --dump-dom 可以原样取回)。 */
const DIAG = `(function () {
  'use strict';
  var report = { failures: 0, checks: [] };
  function vw() { return window.innerWidth; }
  function isVisible(el) {
    if (!el || !el.getClientRects().length) return false;
    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    var rect = el.getBoundingClientRect();
    return rect.width >= 1 && rect.height >= 1;
  }
  function desc(el) {
    var cls = el.getAttribute('class') || '';
    var text = (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 16);
    return el.tagName.toLowerCase() + (cls ? '.' + cls.trim().split(/\\s+/).join('.') : '') + (text ? ' \\u201c' + text + '\\u201d' : '');
  }
  function add(view, type, message) {
    report.failures += 1;
    report.checks.push({ view: view, type: type, message: message, width: vw() });
  }
  function collect(name) {
    var de = document.documentElement;
    if (de.scrollWidth > de.clientWidth + 1) add(name, 'DOC', 'scrollWidth ' + de.scrollWidth + ' > ' + de.clientWidth);
    var nodes = document.querySelectorAll('body *');
    Array.prototype.forEach.call(nodes, function (el) {
      if (!isVisible(el) || el.closest('svg')) return;
      var rect = el.getBoundingClientRect();
      if (rect.right > vw() + 0.5 || rect.left < -0.5) {
        add(name, 'VIEWPORT', desc(el) + ' @ ' + Math.round(rect.left) + '..' + Math.round(rect.right));
      }
    });
    var containers = '.metric,.panel,.record-card,.filters,.table-card,tbody tr,.legend-row,.rank-row,.section-heading,.topbar,.month-nav,.details-heading,.pagination,.composition,.chart-wrap,.view-tabs';
    document.querySelectorAll(containers).forEach(function (box) {
      if (!isVisible(box)) return;
      var pr = box.getBoundingClientRect();
      var boxStyle = window.getComputedStyle(box);
      var clips = boxStyle.overflowX === 'hidden' || boxStyle.overflowX === 'auto' || boxStyle.overflowX === 'scroll';
      box.querySelectorAll('*').forEach(function (child) {
        if (!isVisible(child) || child.closest('svg')) return;
        var cr = child.getBoundingClientRect();
        if (cr.right > pr.right + 1.5 || cr.left < pr.left - 1.5) {
          if (!clips) add(name, 'CONTAINER', desc(child) + ' escapes ' + desc(box));
        }
      });
    });
    var acts = [];
    document.querySelectorAll('button, input, select, a').forEach(function (el) {
      if (isVisible(el) && !el.closest('svg')) acts.push(el);
    });
    for (var a = 0; a < acts.length; a += 1) {
      for (var b = a + 1; b < acts.length; b += 1) {
        var ea = acts[a], eb = acts[b];
        if (ea.contains(eb) || eb.contains(ea)) continue;
        var ra = ea.getBoundingClientRect(), rb = eb.getBoundingClientRect();
        var ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
        var oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        if (ox > 2 && oy > 2) add(name, 'OVERLAP', desc(ea) + ' ∩ ' + desc(eb) + ' (' + Math.round(ox) + 'x' + Math.round(oy) + ')');
      }
    }
  }
  function bottomCheck(name) {
    var bar = document.querySelector('.view-tabs');
    var fixed = bar && window.getComputedStyle(bar).position === 'fixed' && isVisible(bar);
    if (!fixed) return;
    window.scrollTo(0, document.documentElement.scrollHeight);
    var br = bar.getBoundingClientRect();
    document.querySelectorAll('button, input, select, a').forEach(function (el) {
      if (!isVisible(el) || el.closest('.view-tabs') || el.closest('svg')) return;
      var rect = el.getBoundingClientRect();
      var ox = Math.min(rect.right, br.right) - Math.max(rect.left, br.left);
      var oy = Math.min(rect.bottom, br.bottom) - Math.max(rect.top, br.top);
      if (ox > 2 && oy > 2) add(name, 'TABBAR', desc(el) + ' covered by bottom tabs');
    });
    window.scrollTo(0, 0);
  }
  function click(selector) { var el = document.querySelector(selector); if (el) el.click(); }
  function activate(name) {
    click('[data-view-target="' + name + '"]');
    if (name === 'details') {
      var panel = document.querySelector('[data-filters]');
      if (panel && !panel.classList.contains('is-expanded')) click('[data-filter-toggle]');
    }
  }
  function finalize() {
    document.title = 'DIAG_RESULT:' + JSON.stringify(report);
  }
  var shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    window.setTimeout(function () { activate(shot); }, 1200);
    window.setTimeout(finalize, 3200);
    return;
  }
  var views = ['dashboard', 'record', 'details'];
  window.setTimeout(function () { collect('dashboard'); }, 2400);
  window.setTimeout(function () { activate('record'); }, 2500);
  window.setTimeout(function () { collect('record'); }, 4000);
  window.setTimeout(function () { activate('details'); }, 4100);
  window.setTimeout(function () { collect('details'); }, 5600);
  window.setTimeout(function () { click('[data-filter-toggle]'); }, 5700);
  window.setTimeout(function () { collect('details-filters'); }, 7100);
  window.setTimeout(function () { bottomCheck('details-filters'); }, 7200);
  window.setTimeout(function () { activate('dashboard'); }, 7300);
  window.setTimeout(function () { bottomCheck('dashboard'); }, 8400);
  window.setTimeout(finalize, 8600);
})();`;

function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean);
  for (const candidate of candidates) {
    try { fs.accessSync(candidate, fs.constants.X_OK); return candidate; } catch (_) { /* try next */ }
  }
  return null;
}

function buildHarness(dest) {
  fs.cpSync(path.join(root, 'site', 'CostTrace'), path.join(dest, 'CostTrace'), { recursive: true });
  fs.cpSync(path.join(root, 'site', 'shared'), path.join(dest, 'shared'), { recursive: true });
  const htmlPath = path.join(dest, 'CostTrace', 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/^\s*<meta http-equiv="Content-Security-Policy"[^>]*>\s*$/m, '');
  /* 真实的 hub-auth.js 会覆盖 head 里的 HubAuth 桩并走网络;测试页不加载它,
   * 其余共享脚本(含 auth-gate/sync-store)都只依赖桩提供的 API。 */
  html = html.replace(/^\s*<script defer src="\.\.\/shared\/hub-auth\.js"><\/script>\s*$/m, '');
  html = html.replace('<head>', '<head>\n  <script>\n' + STUB + '\n  </script>');
  html = html.replace('</body>', '  <script>\n' + DIAG + '\n  </script>\n</body>');
  fs.writeFileSync(htmlPath, html);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    let urlPath = decodeURIComponent(new URL(request.url, 'http://x').pathname);
    if (urlPath === '/') urlPath = '/index.html';
    const file = path.normalize(path.join(rootDir, urlPath));
    if (!file.startsWith(rootDir + path.sep) && file !== rootDir) {
      response.writeHead(403); response.end('forbidden'); return;
    }
    fs.readFile(file, (error, data) => {
      if (error) { response.writeHead(404); response.end('not found'); return; }
      response.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      response.end(data);
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function runChrome(chrome, url, width, height, extraArgs, timeoutMs) {
  return new Promise((resolve) => {
    const profile = path.join(os.tmpdir(), 'costtrace-layout-' + width + '-' + Date.now());
    const args = [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--disable-extensions', '--disable-background-networking', '--disable-component-update',
      '--disable-sync', '--disable-default-apps', '--disable-crash-reporter', '--mute-audio', '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--user-data-dir=' + profile,
      '--window-size=' + width + ',' + height,
      '--virtual-time-budget=' + timeoutMs
    ].concat(extraArgs, [url]);
    /* headless=new 在 macOS 上完成 dump 后可能不主动退出,靠超时收割 stdout;
     * 只要有 DIAG_RESULT 或截图产出即视为成功。 */
    execFile(chrome, args, { maxBuffer: 64 * 1024 * 1024, timeout: timeoutMs + 25000 }, (error, stdout) => {
      fs.rmSync(profile, { recursive: true, force: true });
      resolve({ error, stdout: String(stdout) });
    });
  });
}

function parseReport(stdout) {
  const marker = stdout.match(/DIAG_RESULT:([^<]*)/);
  if (!marker) return { failures: -1, checks: [{ type: 'HARNESS', view: '-', message: 'no DIAG_RESULT in page (auth gate or script failure?)', width: 0 }] };
  try { return JSON.parse(marker[1]); } catch (_) { return { failures: -1, checks: [{ type: 'HARNESS', view: '-', message: 'unparseable DIAG_RESULT', width: 0 }] }; }
}

async function main() {
  const mode = process.argv.includes('--screenshot') ? 'screenshot' : 'check';
  const keep = process.argv.includes('--keep');
  const chrome = findChrome();
  if (!chrome) { console.error('未找到 Chrome/Edge:请安装 Chrome 或用 CHROME_BIN 指定路径。'); process.exit(2); }
  const harness = fs.mkdtempSync(path.join(os.tmpdir(), 'costtrace-layout-'));
  buildHarness(harness);
  if (keep) console.log('harness: ' + harness);
  const server = await serve(harness);
  const base = 'http://127.0.0.1:' + server.address().port + '/CostTrace/';
  let failed = false;
  try {
    for (const viewport of VIEWPORTS) {
      const { width, height } = viewport;
      if (mode === 'screenshot') {
        const views = process.argv.slice(process.argv.indexOf('--screenshot') + 1).filter((v) => !v.startsWith('--'));
        for (const view of (views.length ? views : ['dashboard', 'record', 'details'])) {
          const out = path.join(harness, 'shot-' + width + '-' + view + '.png');
          const result = await runChrome(chrome, base + '?shot=' + view, width, height, ['--screenshot=' + out], 6000);
          console.log('已保存 ' + out);
          if (result.error) console.warn('screenshot run reported:', result.error && result.error.message);
        }
      } else {
        const result = await runChrome(chrome, base, width, height, ['--dump-dom'], 12000);
        const report = parseReport(result.stdout);
        if (report.failures === -1) {
          failed = true;
          console.error('✗ ' + width + 'px: ' + report.checks[0].message + (result.error ? ' (chrome: ' + result.error.message + ')' : ''));
          continue;
        }
        if (report.failures > 0) {
          failed = true;
          console.log('✗ ' + width + 'px: ' + report.failures + ' 处违规');
          report.checks.forEach((item) => console.log('    [' + item.type + '] ' + item.view + ': ' + item.message));
        } else {
          console.log('✓ ' + width + 'px: 无违规');
        }
      }
    }
  } finally {
    server.close();
  }
  if (keep) { console.log('harness 已保留: ' + harness); } else { fs.rmSync(harness, { recursive: true, force: true }); }
  if (mode === 'check') {
    if (failed) { console.error('\n移动端布局检查未通过。'); process.exit(1); }
    console.log('\n全部视口宽度均无元素重叠/溢出。');
  }
}

main().catch((error) => { console.error(error); process.exit(2); });
