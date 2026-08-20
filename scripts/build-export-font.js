#!/usr/bin/env node

/*
 * 生成 site/words/js/export-font.js：星标单词 PDF 导出用的嵌入字体数据。
 *
 * 背景：浏览器端生成含中文的 PDF 必须嵌入字体；Helvetica 等标准 14 字体
 * 不含 CJK。这里把 Noto Sans SC（中文）与 Noto Sans（拉丁 + IPA 音标）
 * 按站点实际出现的字符子集化，连同字形度量输出为一份纯静态 JS 数据文件。
 *
 * 复现条件：python3 + fonttools（pip install fonttools）。首次运行会从
 * jsdelivr 下载两份可变字体到 scripts/.font-cache/（已加入 .gitignore）。
 *
 * 何时重跑：data.js 新增词汇或导出界面文案变更后运行
 *   python3 -m pip install fonttools
 *   node scripts/build-export-font.js
 * 输出文件按字符→字形映射渲染，缺字会在导出时显示为替换符。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const cacheDir = path.join(__dirname, '.font-cache');
const outputPath = path.join(projectRoot, 'site/words/js/export-font.js');
const pythonBin = process.env.WT_FONT_PYTHON || 'python3';

const FONT_SOURCES = [
  {
    key: 'cjk',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf',
    file: 'NotoSansSC.ttf',
    axes: { wght: 400 },
    baseFont: 'WTDUDU+NotoSansSC-Regular'
  },
  {
    key: 'latin',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosans/NotoSans%5Bwdth,wght%5D.ttf',
    file: 'NotoSans.ttf',
    axes: { wght: 400, wdth: 100 },
    baseFont: 'WTDUDU+NotoSans-Regular'
  }
];

/* 导出 PDF 中可能出现的界面文案；data.js 之外的唯一字符来源。 */
const UI_STRINGS = [
  '星标单词 Starred Words 导出文件筛选词集选择导出列清空全部按所选与生成',
  '共 个按正文出现顺序排列还没有在词卡或游戏中点五角星即可标记会显示这里之后可以',
  '单词音标词性释义词集栏目语境句子标记时间导出日期第页未命名单词本表由应用自动',
  '第一二三四五六七八份列〇一二三四五六七八九十百千万亿加载字体失败请重试'
];

function ensureSourceFont(source) {
  fs.mkdirSync(cacheDir, { recursive: true });
  const target = path.join(cacheDir, source.file);
  if (fs.existsSync(target) && fs.statSync(target).size > 1000000) return target;
  console.log(`downloading ${source.file} ...`);
  execFileSync('curl', ['-sL', '--http1.1', '--max-time', '300', '-o', target, source.url], { stdio: 'inherit' });
  return target;
}

const pythonScript = String.raw`
import base64, json, re, sys
from fontTools import ttLib
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.subset import Subsetter, Options
from fontTools.pens.boundsPen import BoundsPen

payload = json.load(sys.stdin)

data_source = open(payload['dataPath'], encoding='utf8').read()
all_chars = set(data_source)
for text in payload['uiStrings']:
    all_chars |= set(text)

# CJK 集合：CJK 区块、全角形式、箭头（Noto Sans SC 有而 Noto Sans 没有）。
def is_cjk(ch):
    cp = ord(ch)
    return cp >= 0x2E80 or 0xFF00 <= cp <= 0xFFEF or 0x2190 <= cp <= 0x21FF

cjk_chars = {ch for ch in all_chars if is_cjk(ch)}

# 拉丁集合：ASCII、Latin-1、IPA 与组合附标区块、通用标点，再并入数据中的其它非 ASCII 字符。
latin_chars = set()
for lo, hi in [(0x20, 0x7E), (0xA0, 0xFF), (0x250, 0x36F), (0x2010, 0x2027), (0x2030, 0x205E)]:
    for cp in range(lo, hi + 1):
        latin_chars.add(chr(cp))
for ch in all_chars:
    if ord(ch) > 127 and not is_cjk(ch):
        latin_chars.add(ch)
latin_chars = {ch for ch in latin_chars if not is_cjk(ch)}
# 数据与界面实际出现的字符是“必需”；区块补齐字符只是锦上添花，缺了不算失败。
latin_required = {ch for ch in all_chars if ord(ch) > 127 and not is_cjk(ch)}

result = {}
missing_report = {}
for job in payload['fonts']:
    font = ttLib.TTFont(job['sourcePath'])
    instantiateVariableFont(font, job['axes'], inplace=True)
    cmap = font.getBestCmap()
    wanted = cjk_chars if job['key'] == 'cjk' else latin_chars
    # 替换符兜底：任一字体里找得到就带上，运行期缺字用它显示。
    if ord('\ufffd') in cmap:
        wanted = wanted | {'\ufffd'}
    have = sorted(ch for ch in wanted if ord(ch) in cmap)
    missing = sorted(ch for ch in wanted if ord(ch) not in cmap)
    # CJK 全部必需；拉丁只求数据字符必须覆盖，区块补齐字符可缺失。
    required = wanted if job['key'] == 'cjk' else (latin_required & wanted)
    missing_report[job['key']] = ''.join(sorted(ch for ch in required if ord(ch) not in cmap))

    options = Options()
    options.layout_features = []   # PDF 手工定位组合附标，无需 GSUB/GPOS。
    options.name_IDs = [1, 2, 3, 4, 6]
    options.notdef_outline = True
    subsetter = Subsetter(options=options)
    subsetter.populate(unicodes=[ord(ch) for ch in have])
    subsetter.subset(font)
    font.save(job['outPath'])

    # 子集化后重新读取：gid 重排，cmap 与度量以子集为准。
    subset = ttLib.TTFont(job['outPath'])
    subset_cmap = subset.getBestCmap()
    upem = subset['head'].unitsPerEm
    hhea = subset['hhea']
    os2 = subset['OS/2']
    glyph_order = subset.getGlyphOrder()
    hmtx = subset['hmtx']

    glyphs = {}
    widths = {}
    mark_widths = {}
    glyph_set = subset.getGlyphSet()
    for cp, glyph_name in subset_cmap.items():
        ch = chr(cp)
        gid = glyph_order.index(glyph_name)
        advance = hmtx[glyph_name][0]
        glyphs[ch] = gid
        widths[gid] = advance
        if advance == 0:
            pen = BoundsPen(glyph_set)
            glyph_set[glyph_name].draw(pen)
            if pen.bounds is not None:
                mark_widths[gid] = round(pen.bounds[2] - pen.bounds[0])

    # FontBBox 取子集内字形实际轮廓范围（坐标取整）。
    x_min, y_min, x_max, y_max = 0, 0, 0, 0
    for glyph_name in glyph_order:
        pen = BoundsPen(glyph_set)
        glyph_set[glyph_name].draw(pen)
        if pen.bounds is None:
            continue
        x_min = min(x_min, pen.bounds[0]); y_min = min(y_min, pen.bounds[1])
        x_max = max(x_max, pen.bounds[2]); y_max = max(y_max, pen.bounds[3])

    raw = open(job['outPath'], 'rb').read()
    result[job['key']] = {
        'baseFont': job['baseFont'],
        'unitsPerEm': upem,
        'ascent': hhea.ascent,
        'descent': hhea.descent,
        'capHeight': getattr(os2, 'sCapHeight', int(hhea.ascent * 0.72)),
        'stemV': 80,
        'bbox': [int(round(x_min)), int(round(y_min)), int(round(x_max)), int(round(y_max))],
        'base64': base64.b64encode(raw).decode('ascii'),
        'glyphs': glyphs,
        'widths': widths,
        'markWidths': mark_widths
    }

print(json.dumps({
    'fonts': result,
    'missing': missing_report,
    'counts': {key: len(value['glyphs']) for key, value in result.items()}
}))
`;

function build() {
  const jobs = FONT_SOURCES.map((source) => {
    const sourcePath = ensureSourceFont(source);
    return {
      key: source.key,
      axes: source.axes,
      baseFont: source.baseFont,
      sourcePath,
      outPath: path.join(cacheDir, `${source.key}-subset.ttf`)
    };
  });

  const payload = {
    dataPath: path.join(projectRoot, 'site/words/js/data.js'),
    uiStrings: UI_STRINGS,
    fonts: jobs
  };

  /* python3 - 会把 stdin 当作脚本本体，无法同时用 stdin 传数据；
   * 这里把脚本与 JSON 数据都落到缓存目录再执行。 */
  const scriptPath = path.join(cacheDir, 'build-export-font.py');
  const payloadPath = path.join(cacheDir, 'font-payload.json');
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(scriptPath, pythonScript.replace('json.load(sys.stdin)', "json.load(open(sys.argv[1], encoding='utf8'))"));
  fs.writeFileSync(payloadPath, JSON.stringify(payload));

  const stdout = execFileSync(pythonBin, [scriptPath, payloadPath], {
    maxBuffer: 128 * 1024 * 1024,
    env: process.env
  }).toString('utf8');

  const report = JSON.parse(stdout);
  const { fonts, missing, counts } = report;

  /* data.js 与界面文案必须被两份字体完全覆盖，否则导出会出现替换符。 */
  const holes = Object.entries(missing).filter(([, chars]) => chars.length);
  if (holes.length) {
    console.error('Font coverage gaps (add to charset or font):');
    holes.forEach(([key, chars]) => console.error(`  ${key}: ${chars}`));
    process.exitCode = 1;
    return;
  }

  const header = [
    '/* ============================================================',
    ' * Module: ExportFont（由 scripts/build-export-font.js 生成，勿手改）',
    ' * PDF 导出嵌入字体：Noto Sans SC（中文，SIL OFL 1.1）与',
    ' * Noto Sans（拉丁与 IPA 音标，SIL OFL 1.1）的字符子集。',
    ' * 字形映射 char→gid、宽度与组合附标墨宽均以子集字体为准。',
    ` * 生成时间：${new Date().toISOString()}`,
    ` * 字形数：中文 ${counts.cjk} / 拉丁 ${counts.latin}`,
    ' * ============================================================ */'
  ].join('\n');

  const body = `WordTales.ExportFont = ${JSON.stringify({
    cjk: fonts.cjk,
    latin: fonts.latin
  })};\n`;

  fs.writeFileSync(outputPath, header + '\n' + body);
  const sizeKb = Math.round(fs.statSync(outputPath).size / 1024);
  console.log(`wrote ${path.relative(projectRoot, outputPath)} (${sizeKb} KB, cjk ${counts.cjk} glyphs, latin ${counts.latin} glyphs)`);
}

build();
