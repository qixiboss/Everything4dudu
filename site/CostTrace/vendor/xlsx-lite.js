/* CostTrace XLSX Lite v1.0.0 | MIT License | Minimal single-sheet OOXML writer. */
(function (root) {
  'use strict';
  var encoder = new TextEncoder();
  function bytes(text) { return encoder.encode(text); }
  function xml(value) { return String(value).replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]; }); }
  function concat(parts) {
    var length = parts.reduce(function (total, part) { return total + part.length; }, 0);
    var result = new Uint8Array(length), offset = 0;
    parts.forEach(function (part) { result.set(part, offset); offset += part.length; });
    return result;
  }
  function u16(value) { return Uint8Array.of(value & 255, (value >>> 8) & 255); }
  function u32(value) { return Uint8Array.of(value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255); }
  var crcTable = Array.from({ length: 256 }, function (_, index) {
    var value = index;
    for (var bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    return value >>> 0;
  });
  function crc32(data) {
    var crc = 0xffffffff;
    for (var index = 0; index < data.length; index += 1) crc = crcTable[(crc ^ data[index]) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  function zip(files) {
    var local = [], central = [], offset = 0;
    Object.keys(files).forEach(function (name) {
      var nameBytes = bytes(name), data = bytes(files[name]), crc = crc32(data);
      var header = concat([u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), nameBytes]);
      local.push(header, data);
      central.push(concat([u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes]));
      offset += header.length + data.length;
    });
    var centralBytes = concat(central);
    return concat(local.concat([centralBytes, u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length), u32(centralBytes.length), u32(offset), u16(0)]));
  }
  function excelDate(iso) {
    var parts = iso.split('-').map(Number);
    return Math.floor((Date.UTC(parts[0], parts[1] - 1, parts[2]) - Date.UTC(1899, 11, 30)) / 86400000);
  }
  function textCell(ref, value, style) { return '<c r="' + ref + '" t="inlineStr"' + (style ? ' s="' + style + '"' : '') + '><is><t>' + xml(value) + '</t></is></c>'; }
  function numberCell(ref, value, style) { return '<c r="' + ref + '"' + (style ? ' s="' + style + '"' : '') + '><v>' + value + '</v></c>'; }
  function build(records) {
    var header = ['日期', '收支', '明细', '类别', '金额'].map(function (value, index) { return textCell(String.fromCharCode(65 + index) + '1', value, 3); }).join('');
    var rows = records.map(function (record, index) {
      var row = index + 2;
      return '<row r="' + row + '">' + numberCell('A' + row, excelDate(record.date), 1) + textCell('B' + row, record.type === 'income' ? '收入' : '支出') + textCell('C' + row, record.detail) + textCell('D' + row, record.category) + numberCell('E' + row, record.amountCents / 100, 2) + '</row>';
    }).join('');
    var lastRow = Math.max(1, records.length + 1);
    var files = {
      '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
      '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="收支明细" sheetId="1" r:id="rId1"/></sheets></workbook>',
      'xl/_rels/workbook.xml.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
      'xl/styles.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/><numFmt numFmtId="165" formatCode="¥#,##0.00;[Red]-¥#,##0.00"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF586BCF"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
      'xl/worksheets/sheet1.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="13" customWidth="1"/><col min="2" max="2" width="10" customWidth="1"/><col min="3" max="3" width="36" customWidth="1"/><col min="4" max="4" width="14" customWidth="1"/><col min="5" max="5" width="16" customWidth="1"/></cols><sheetData><row r="1" ht="24" customHeight="1">' + header + '</row>' + rows + '</sheetData><autoFilter ref="A1:E' + lastRow + '"/></worksheet>'
    };
    return zip(files);
  }
  function download(records, filename) {
    var url = URL.createObjectURL(new Blob([build(records)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    var link = document.createElement('a');
    link.href = url; link.download = filename; link.hidden = true;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  root.CostTraceXlsx = { version: '1.0.0', build: build, download: download };
})(typeof window !== 'undefined' ? window : globalThis);
