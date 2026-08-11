#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

['index.html', 'README.md'].forEach((file) => fs.copyFileSync(path.join(root, file), path.join(output, file)));
['shared', 'words', 'training', 'exam-schedule', 'changelog'].forEach((directory) => {
  fs.cpSync(path.join(root, directory), path.join(output, directory), { recursive: true });
});

console.log('Built static site in _site/.');
