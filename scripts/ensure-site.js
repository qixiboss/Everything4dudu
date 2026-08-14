#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

/*
 * npm test 与 npm run check 都读取 _site/ 构建产物。产物缺失时直接报错会淹没在
 * 一堆文件未找到里，这里改为自动补跑一次构建；产物已存在则立即放行，verify 链路
 * 因此不会重复构建。
 */
const root = path.resolve(__dirname, '..');
const marker = path.join(root, '_site', 'words', 'index.html');

if (fs.existsSync(marker)) process.exit(0);

console.log('_site/ 构建产物缺失（未找到 _site/words/index.html），先执行 npm run build ...');
const result = spawnSync(process.execPath, [path.join(__dirname, 'build-site.js')], {
  cwd: root,
  stdio: 'inherit'
});
if (result.status !== 0) {
  console.error('构建失败，测试与完整性校验依赖 _site/ 产物，请先修复上面的构建错误。');
  process.exit(result.status || 1);
}
