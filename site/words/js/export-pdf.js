/* ============================================================
 * Module: ExportPdf
 * 星标单词导出的 PDF 生成器：不依赖第三方库，在浏览器里直接产出
 * 带嵌入中文字体的 PDF 文件。
 *
 * 关键设计：
 * - 中文走 Noto Sans SC 子集、拉丁与 IPA 音标走 Noto Sans 子集，
 *   两份字体都按 CIDFontType2 + Identity-H 嵌入（字形数据来自
 *   js/export-font.js，由 scripts/build-export-font.js 生成）。
 * - 文本以字形 id 的十六进制串写入内容流；宽度按子集字体度量计算，
 *   换行在布局阶段完成，内容流只做绘制。
 * - IPA 组合附标（零步进字形）用 TJ 调整值手工居中到前一个字形上，
 *   因此子集刻意剥离了 GPOS，运行时也不依赖任何整形器。
 * - 字体数据约 900KB，首屏不需要：loadFonts() 首次导出时才注入
 *   <script> 拉取 js/export-font.js，之后复用同一个 Promise。
 * ============================================================ */
WordTales.ExportPdf = (function () {
  'use strict';

  var FONT_SCRIPT_SRC = 'js/export-font.js?v=1.0.0';
  var PAGE_WIDTH = 595.28;
  var PAGE_HEIGHT = 841.89;
  var MARGIN_X = 40;
  var MARGIN_TOP = 46;
  var MARGIN_BOTTOM = 42;
  var CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

  var CELL_PAD_X = 5;
  var CELL_PAD_Y = 3;
  var LINE_HEIGHT_FACTOR = 1.42;
  var COLOR_DARK = '0.12 0.13 0.15';
  var COLOR_MUTED = '0.45 0.47 0.5';
  var COLOR_LINE = '0.82 0.84 0.87';

  var fontPromise = null;
  var cjkView = null;
  var latinView = null;

  function fontLoadError(message) {
    var error = new Error(message);
    error.name = 'FontLoadError';
    return error;
  }

  /* 首次导出时注入字体数据脚本；已存在（测试或已缓存）时立即返回。 */
  function loadFonts() {
    if (WordTales.ExportFont) return Promise.resolve(WordTales.ExportFont);
    if (fontPromise) return fontPromise;
    fontPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      var done = false;
      function finish(ok, error) {
        if (done) return;
        done = true;
        if (ok && WordTales.ExportFont) resolve(WordTales.ExportFont);
        else reject(error || fontLoadError('字体数据加载失败'));
      }
      script.onload = function () { finish(true); };
      script.onerror = function () {
        fontPromise = null;
        finish(false, fontLoadError('字体数据加载失败，请检查网络后重试'));
      };
      script.src = FONT_SCRIPT_SRC;
      (document.head || document.body).appendChild(script);
    });
    return fontPromise;
  }

  /* ---------------- 字体视图与字形映射 ---------------- */

  function FontView(data) {
    this.data = data;
    this.resourceId = '';
    /* 字形空间单位 = 字体单位 * 1000 / unitsPerEm，与 PDF 度量一致。 */
    var scale = 1000 / data.unitsPerEm;
    var widths = {};
    var markWidths = {};
    var gid;
    for (gid in data.widths) {
      if (Object.prototype.hasOwnProperty.call(data.widths, gid)) {
        widths[gid] = data.widths[gid] * scale;
      }
    }
    for (gid in data.markWidths) {
      if (Object.prototype.hasOwnProperty.call(data.markWidths, gid)) {
        markWidths[gid] = data.markWidths[gid] * scale;
      }
    }
    this.glyphs = data.glyphs;
    this.widths = widths;
    this.markWidths = markWidths;
    this.fallbackAdvance = data.unitsPerEm / 2;
  }

  FontView.prototype.glyph = function (ch) {
    var gid = this.glyphs[ch];
    return gid === undefined ? null : gid;
  };
  FontView.prototype.advance = function (gid) {
    var width = this.widths[gid];
    return width === undefined ? this.fallbackAdvance : width;
  };

  function ensureViews() {
    var fonts = WordTales.ExportFont;
    if (!fonts || !fonts.cjk || !fonts.latin) {
      throw fontLoadError('字体数据未就绪');
    }
    if (!cjkView) {
      cjkView = new FontView(fonts.cjk);
      cjkView.resourceId = 'F1';
      latinView = new FontView(fonts.latin);
      latinView.resourceId = 'F2';
    }
  }

  /* 字形记录：view 为所在字体视图，gid 为字形编号；缺字回落替换符。 */
  function mapChar(ch) {
    var gid = cjkView.glyph(ch);
    if (gid !== null) return { view: cjkView, gid: gid, isCjk: true };
    gid = latinView.glyph(ch);
    if (gid !== null) return { view: latinView, gid: gid, isCjk: false };
    gid = latinView.glyph('\uFFFD');
    if (gid !== null) return { view: latinView, gid: gid, isCjk: false };
    return null;
  }

  function isBreakableChar(ch) {
    var cp = ch.charCodeAt(0);
    return cp >= 0x2E80 || (0xFF00 <= cp && cp <= 0xFFEF) ||
      '，。、；：！？）」』】〉》”’·'.indexOf(ch) >= 0;
  }

  /* ES5 环境按码点遍历，正确跳过代理对。 */
  function eachCodePoint(text, fn) {
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < text.length) {
        var next = text.charCodeAt(i + 1);
        if (next >= 0xDC00 && next <= 0xDFFF) {
          fn(String.fromCharCode(code, next));
          i++;
          continue;
        }
      }
      fn(text.charAt(i));
    }
  }

  /* ---------------- 文本测量与换行 ---------------- */

  function Glyph(glyphInfo, fontSize) {
    this.view = glyphInfo.view;
    this.gid = glyphInfo.gid;
    var advance = this.view.advance(glyphInfo.gid);
    this.advancePt = advance * fontSize / 1000;
    this.isMark = advance === 0;
    this.markWidthPt = this.isMark
      ? (this.view.markWidths[glyphInfo.gid] || 0) * fontSize / 1000
      : 0;
  }

  /*
   * 断行单位是“原子”：CJK 单字、空格或一串不可断的拉丁词。
   * 连字符、斜杠允许断在其后，避免长音标撑破单元格。
   */
  function buildAtoms(text, fontSize) {
    var atoms = [];
    var word = null;
    function flushWord() {
      if (word) {
        atoms.push(word);
        word = null;
      }
    }
    eachCodePoint(String(text == null ? '' : text), function (ch) {
      var glyphInfo = mapChar(ch);
      if (!glyphInfo) return;
      var glyph = new Glyph(glyphInfo, fontSize);
      if (ch === ' ' || ch === '\t') {
        flushWord();
        atoms.push({ glyphs: [glyph], width: glyph.advancePt, space: true });
        return;
      }
      if (glyph.isCjk || isBreakableChar(ch)) {
        flushWord();
        atoms.push({ glyphs: [glyph], width: glyph.advancePt });
        return;
      }
      if (!word) word = { glyphs: [], width: 0 };
      word.glyphs.push(glyph);
      word.width += glyph.advancePt;
      word.allowInnerSplit = true;
    });
    flushWord();
    return atoms;
  }

  /* 贪心断行：行首丢弃空格、行尾空格剔除，超宽且无断点的词按字形硬拆。 */
  function wrapText(text, fontSize, maxWidth) {
    var atoms = buildAtoms(text, fontSize);
    var lines = [];
    var current = { glyphs: [], width: 0 };
    lines.push(current);
    function newLine() {
      current = { glyphs: [], width: 0 };
      lines.push(current);
    }
    function trimTrailingSpaces() {
      while (current.glyphs.length && current.glyphs[current.glyphs.length - 1].space) {
        current.width -= current.glyphs.pop().space.advancePt;
      }
    }
    atoms.forEach(function (atom) {
      if (atom.space) {
        if (current.glyphs.length) {
          current.glyphs.push({ space: atom.glyphs[0] });
          current.width += atom.width;
        }
        return;
      }
      if (current.glyphs.length && current.width + atom.width > maxWidth) {
        trimTrailingSpaces();
        newLine();
      }
      if (atom.width > maxWidth) {
        atom.glyphs.forEach(function (glyph) {
          if (current.glyphs.length && current.width + glyph.advancePt > maxWidth) {
            newLine();
          }
          current.glyphs.push(glyph);
          current.width += glyph.advancePt;
        });
        return;
      }
      atom.glyphs.forEach(function (glyph) {
        current.glyphs.push(glyph);
        current.width += glyph.advancePt;
      });
    });
    trimTrailingSpaces();
    return lines;
  }

  function measureWidth(text, fontSize) {
    var atoms = buildAtoms(text, fontSize);
    var width = 0;
    atoms.forEach(function (atom) { width += atom.width; });
    return width;
  }

  /* ---------------- 内容流绘制指令 ---------------- */

  function padHex4(value) {
    var hex = value.toString(16);
    while (hex.length < 4) hex = '0' + hex;
    return hex.toUpperCase();
  }

  function formatNumber(value) {
    return String(Math.round(value * 100) / 100);
  }

  /* 一行字形 → TJ 数组；组合附标（零步进）居中到前一个字形上。 */
  function buildTjArray(glyphs, fontSize) {
    var parts = [];
    for (var index = 0; index < glyphs.length; index++) {
      var glyph = glyphs[index];
      if (glyph.space) {
        parts.push('<' + padHex4(glyph.space.gid) + '>');
        continue;
      }
      if (glyph.isMark && index > 0) {
        var previous = glyphs[index - 1];
        var previousAdvance = previous.space ? previous.space.advancePt : previous.advancePt;
        var adjustment = Math.round((previousAdvance + glyph.markWidthPt) / 2 * 1000 / fontSize);
        parts.push(String(adjustment));
        parts.push('<' + padHex4(glyph.gid) + '>');
        parts.push(String(-adjustment));
        continue;
      }
      parts.push('<' + padHex4(glyph.gid) + '>');
    }
    return '[' + parts.join(' ') + '] TJ';
  }

  /* 一行可能混排两种字体：按字体分组，每组一个 BT/ET 块，x 顺序累加。 */
  function emitLine(ops, x, y, line, fontSize, color) {
    var index = 0;
    var cursorX = x;
    while (index < line.glyphs.length) {
      var entry = line.glyphs[index];
      var view = entry.space ? entry.space.view : entry.view;
      var runGlyphs = [];
      var runWidth = 0;
      while (index < line.glyphs.length) {
        entry = line.glyphs[index];
        var entryView = entry.space ? entry.space.view : entry.view;
        if (entryView !== view) break;
        runGlyphs.push(entry);
        runWidth += entry.space ? entry.space.advancePt : entry.advancePt;
        index++;
      }
      if (!runGlyphs.length) continue;
      ops.push('BT /' + view.resourceId + ' ' + formatNumber(fontSize) + ' Tf');
      ops.push(color + ' rg');
      ops.push('1 0 0 1 ' + formatNumber(cursorX) + ' ' + formatNumber(y) + ' Tm');
      ops.push(buildTjArray(runGlyphs, fontSize));
      ops.push('ET');
      cursorX += runWidth;
    }
  }

  /* ---------------- 表格布局 ---------------- */

  /*
   * 列宽分配：先保证每列的最小宽度，再把剩余版心按“偏好超出最小值
   * 的部分”成比例分配。列多时整体收紧、列少时整体放宽，任何情况下
   * 总宽都恰好等于版心宽度。
   */
  function normalizeColumns(columns) {
    var list = columns.map(function (column) {
      var preferred = Math.max(24, Number(column.width) || 80);
      return {
        id: column.id,
        label: column.label,
        preferred: preferred,
        min: Math.max(24, Number(column.min) || Math.floor(preferred * 0.5))
      };
    });
    if (!list.length) return list;

    var minWidth = 0;
    var wantWidth = 0;
    list.forEach(function (column) {
      minWidth += column.min;
      wantWidth += Math.max(0, column.preferred - column.min);
    });

    if (minWidth >= CONTENT_WIDTH) {
      /* 极端情况：最小宽度之和已超版心，等比压缩最小值。 */
      var squeeze = CONTENT_WIDTH / minWidth;
      list.forEach(function (column) { column.width = column.min * squeeze; });
      return list;
    }

    var extra = CONTENT_WIDTH - minWidth;
    var overflow = extra >= wantWidth;
    var share = overflow ? wantWidth : extra;
    var leftover = overflow ? extra - wantWidth : 0;
    var total = 0;
    list.forEach(function (column) {
      var width = column.min + (column.preferred - column.min) * (wantWidth ? share / wantWidth : 0);
      column.width = width;
      total += width;
    });
    if (leftover > 0 && list.length) {
      /* 偏好全部满足后仍有富余：均摊，避免最后一列独吞。 */
      list.forEach(function (column) { column.width += leftover / list.length; });
    }
    /* 取整误差记到最后一列。 */
    total = 0;
    list.forEach(function (column) { total += column.width; });
    list[list.length - 1].width += CONTENT_WIDTH - total;
    return list;
  }

  function cellText(row, column) {
    var value = row[column.id];
    return value == null ? '' : String(value);
  }

  /* ---------------- PDF 对象组装 ---------------- */

  function base64ToBytes(base64) {
    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function stringToBytes(text) {
    var bytes = new Uint8Array(text.length);
    for (var i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 0xff;
    return bytes;
  }

  function assemble(objects) {
    var chunks = [];
    var total = 0;
    function push(part) {
      chunks.push(part);
      total += part.length;
    }
    push(stringToBytes('%PDF-1.5\n%\xE2\xE3\xCF\xD3\n'));

    var offsets = [];
    objects.forEach(function (object) {
      offsets[object.num] = total;
      push(stringToBytes(object.num + ' 0 obj\n'));
      object.parts.forEach(function (part) {
        push(typeof part === 'string' ? stringToBytes(part) : part);
      });
      push(stringToBytes('endobj\n'));
    });

    var xrefOffset = total;
    var count = objects.length + 1;
    var xref = 'xref\n0 ' + count + '\n0000000000 65535 f \n';
    for (var i = 1; i < count; i++) {
      var offset = String(offsets[i]);
      while (offset.length < 10) offset = '0' + offset;
      xref += offset + ' 00000 n \n';
    }
    push(stringToBytes(xref));
    push(stringToBytes('trailer\n<< /Size ' + count + ' /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF\n'));

    var out = new Uint8Array(total);
    var position = 0;
    chunks.forEach(function (chunk) {
      out.set(chunk, position);
      position += chunk.length;
    });
    return out;
  }

  /* 字体四件套：Type0 + CIDFontType2 + FontDescriptor + FontFile2。 */
  function registerFont(objects, view) {
    var type0Num = objects.length + 1;
    var descendantNum = type0Num + 1;
    var descriptorNum = type0Num + 2;
    var fileNum = type0Num + 3;
    objects.push({ num: type0Num, parts: ['<< /Type /Font /Subtype /Type0 /BaseFont /' + view.data.baseFont +
      ' /Encoding /Identity-H /DescendantFonts [' + descendantNum + ' 0 R] >>\n'] });

    /*
     * W 数组以 “起始 CID [w1 w2 ...]” 的序列格式输出，避免渲染器把
     * “c w c w” 误读为 “c [w1 w2 w3 ...]”。同一字体字形按 gid 升序、
     * 连续段落合并到一个内嵌数组里。
     */
    var sortedGids = Object.keys(view.widths)
      .map(function (gid) { return Number(gid); })
      .filter(function (gid) { return !isNaN(gid); })
      .sort(function (a, b) { return a - b; });
    var widthsRun = [];
    for (var i = 0; i < sortedGids.length; i++) {
      widthsRun.push(Math.round(view.widths[sortedGids[i]]));
    }
    var wParts = [];
    if (sortedGids.length) {
      wParts.push(sortedGids[0]);
      wParts.push('[' + widthsRun.join(' ') + ']');
    }
    objects.push({ num: descendantNum, parts: ['<< /Type /Font /Subtype /CIDFontType2 /BaseFont /' + view.data.baseFont +
      ' /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >>' +
      ' /FontDescriptor ' + descriptorNum + ' 0 R /DW 500 /W [' + wParts.join(' ') + ']' +
      ' /CIDToGIDMap /Identity >>\n'] });

    objects.push({ num: descriptorNum, parts: ['<< /Type /FontDescriptor /FontName /' + view.data.baseFont +
      ' /Flags 4 /FontBBox [' + view.data.bbox.join(' ') + ']' +
      ' /ItalicAngle 0 /Ascent ' + view.data.ascent + ' /Descent ' + view.data.descent +
      ' /CapHeight ' + view.data.capHeight + ' /StemV ' + view.data.stemV +
      ' /FontFile2 ' + fileNum + ' 0 R >>\n'] });

    var fontBytes = base64ToBytes(view.data.base64);
    objects.push({ num: fileNum, parts: [
      '<< /Length ' + fontBytes.length + ' /Length1 ' + fontBytes.length + ' >>\nstream\n',
      fontBytes,
      '\nendstream\n'
    ] });

    return type0Num;
  }

  function buildDocument(options) {
    ensureViews();
    var columns = normalizeColumns(options.columns || []);
    var rows = options.rows || [];
    var fontSize = options.fontSize || 9.5;
    var headerFontSize = 10;
    var lineH = Math.round(fontSize * LINE_HEIGHT_FACTOR * 100) / 100;
    var headerH = 24;

    var tableTop = PAGE_HEIGHT - MARGIN_TOP;
    var titleBlockH = 0;
    if (options.title) titleBlockH += 24;
    if (options.subtitle) titleBlockH += 14;
    if (titleBlockH) titleBlockH += 10;
    var tableStartY = tableTop - titleBlockH;

    /* ---- 布局：每行各列先完成换行，再计算行高与分页。 ---- */
    var laidOutRows = rows.map(function (row) {
      var linesPerColumn = columns.map(function (column) {
        return wrapText(cellText(row, column), fontSize, column.width - CELL_PAD_X * 2);
      });
      var maxLines = 1;
      linesPerColumn.forEach(function (lines) {
        if (lines.length > maxLines) maxLines = lines.length;
      });
      return {
        linesPerColumn: linesPerColumn,
        height: Math.max(22, maxLines * lineH + CELL_PAD_Y * 2)
      };
    });

    var pages = [];
    var pageOps = null;
    var cursorY = 0;

    function columnX(columnIndex) {
      var x = MARGIN_X;
      for (var i = 0; i < columnIndex; i++) x += columns[i].width;
      return x;
    }

    function emitHeaderRow() {
      pageOps.push('q 0.93 0.94 0.96 rg');
      pageOps.push(formatNumber(MARGIN_X) + ' ' + formatNumber(cursorY - headerH) + ' ' +
        formatNumber(CONTENT_WIDTH) + ' ' + formatNumber(headerH) + ' re f Q');
      columns.forEach(function (column, columnIndex) {
        var lines = wrapText(column.label, headerFontSize, column.width - CELL_PAD_X * 2);
        emitLine(pageOps, columnX(columnIndex) + CELL_PAD_X,
          cursorY - headerH / 2 - headerFontSize * 0.35, lines[0] || { glyphs: [] }, headerFontSize, COLOR_DARK);
      });
      cursorY -= headerH;
      emitRowSeparator();
    }

    function emitRowSeparator() {
      pageOps.push(COLOR_LINE + ' RG 0.5 w');
      pageOps.push(formatNumber(MARGIN_X) + ' ' + formatNumber(cursorY) + ' m ' +
        formatNumber(MARGIN_X + CONTENT_WIDTH) + ' ' + formatNumber(cursorY) + ' l S');
    }

    function startPage() {
      pageOps = [];
      pages.push(pageOps);
      cursorY = tableStartY;
      emitHeaderRow();
    }

    startPage();
    laidOutRows.forEach(function (entry) {
      if (cursorY - entry.height < MARGIN_BOTTOM) startPage();
      var topY = cursorY;
      entry.linesPerColumn.forEach(function (lines, columnIndex) {
        var x = columnX(columnIndex) + CELL_PAD_X;
        var baseline = topY - CELL_PAD_Y - fontSize * 0.92;
        lines.forEach(function (line) {
          emitLine(pageOps, x, baseline, line, fontSize, COLOR_DARK);
          baseline -= lineH;
        });
      });
      cursorY -= entry.height;
      emitRowSeparator();
    });

    /* ---- 标题块只出现在第一页顶部。 ---- */
    if (titleBlockH) {
      var titleOps = [];
      if (options.title) {
        var titleLines = wrapText(options.title, 16, CONTENT_WIDTH);
        emitLine(titleOps, MARGIN_X, tableTop - 15, titleLines[0] || { glyphs: [] }, 16, COLOR_DARK);
      }
      if (options.subtitle) {
        var subtitleLines = wrapText(options.subtitle, 8.5, CONTENT_WIDTH);
        emitLine(titleOps, MARGIN_X, tableTop - 29, subtitleLines[0] || { glyphs: [] }, 8.5, COLOR_MUTED);
      }
      pages[0] = titleOps.concat(pages[0]);
    }

    /* ---- 每页页脚：第 i / n 页。 ---- */
    pages.forEach(function (ops, pageIndex) {
      var footerText = '第 ' + (pageIndex + 1) + ' / ' + pages.length + ' 页';
      var lines = wrapText(footerText, 8, CONTENT_WIDTH);
      var width = measureWidth(footerText, 8);
      emitLine(ops, (PAGE_WIDTH - width) / 2, 24, lines[0] || { glyphs: [] }, 8, COLOR_MUTED);
    });

    /* ---- 组装对象与字节流。 ---- */
    var objects = [];
    objects.push({ num: 1, parts: ['<< /Type /Catalog /Pages 2 0 R >>\n'] });
    objects.push({ num: 2, parts: ['<< /Kids [] /Count 0 >>\n'] });

    var cjkFontNum = registerFont(objects, cjkView);
    var latinFontNum = registerFont(objects, latinView);

    var pageNums = [];
    pages.forEach(function (ops) {
      var contentBytes = stringToBytes(ops.join('\n'));
      var contentNum = objects.length + 1;
      objects.push({ num: contentNum, parts: [
        '<< /Length ' + contentBytes.length + ' >>\nstream\n',
        contentBytes,
        '\nendstream\n'
      ] });
      var pageNum = objects.length + 1;
      objects.push({ num: pageNum, parts: ['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' +
        PAGE_WIDTH + ' ' + PAGE_HEIGHT + ']' +
        ' /Resources << /Font << /F1 ' + cjkFontNum + ' 0 R /F2 ' + latinFontNum + ' 0 R >> >>' +
        ' /Contents ' + contentNum + ' 0 R >>\n'] });
      pageNums.push(pageNum);
    });

    objects[1].parts = ['<< /Kids [' + pageNums.map(function (num) { return num + ' 0 R'; }).join(' ') +
      '] /Count ' + pageNums.length + ' >>\n'];

    return { bytes: assemble(objects), pageCount: pages.length };
  }

  function download(bytes, filename) {
    var blob = new Blob([bytes], { type: 'application/pdf' });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename || 'export.pdf';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  return {
    loadFonts: loadFonts,
    buildDocument: buildDocument,
    download: download,
    wrapText: wrapText,
    measureWidth: measureWidth
  };
})();
