#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { integrateApps } = require('./integrate');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

['index.html', 'README.md'].forEach((file) => fs.copyFileSync(path.join(root, file), path.join(output, file)));
['shared', 'changelog'].forEach((directory) => {
  fs.cpSync(path.join(root, directory), path.join(output, directory), { recursive: true });
});

/* 三个应用目录是各自仓库的本地克隆;复制原始应用并注入门户整合后输出到 _site/。 */
integrateApps(root, output);

console.log('Built integrated static site in _site/.');
