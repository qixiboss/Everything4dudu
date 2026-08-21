/* Pomodoro Forest — deterministic isometric SVG renderer.
 *
 * 参考「专注森林」的等距方形地块：每个地块都是一个可独立缩放的局部坐标组，
 * 由「云朵垂边 + 泥土崖壁 + 顶部地表」构成，树与花丛都生长在地块上。
 * 今日森林 = 单块放大的地块；洞察页 = 按天分组，把每天拼成一块并错落拼接。
 * 数据推导仍在 model.js，这里只把 { trees | days } 变成 2.5D 主题小岛。 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var W = 1000;
  var H = 700;

  /* 主题地表配色：地表、云朵垂边、垂边高光、左右泥土崖壁、崖壁斑点、地表小点缀。 */
  var BIOMES = {
    grass: {
      label: '绿茵松林',
      ground: '#7CCB62',
      rim: '#5CBE73',
      rimStroke: 'rgba(255,255,255,.4)',
      soilLeft: '#8A5D39',
      soilRight: '#70472C',
      soilSpeck: 'rgba(64,40,20,.5)',
      speckles: ['#F2D85C', '#B4ECC0', '#FFFFFF']
    },
    snow: {
      label: '春花雪原',
      ground: '#F6F8FB',
      rim: '#E9EEF4',
      rimStroke: 'rgba(255,255,255,.9)',
      soilLeft: '#8A6B44',
      soilRight: '#6E5232',
      soilSpeck: 'rgba(64,42,22,.45)',
      speckles: ['#FFFFFF', '#D8E7F6', '#F1F6FB']
    },
    sand: {
      label: '秋果沙地',
      ground: '#F3E7C6',
      rim: '#E6D5A7',
      rimStroke: 'rgba(255,255,255,.55)',
      soilLeft: '#3F8A5A',
      soilRight: '#2F6B45',
      soilSpeck: 'rgba(22,60,38,.5)',
      speckles: ['#F2C14A', '#D9E6B4', '#FFFFFF']
    }
  };
  var BIOME_ORDER = ['grass', 'snow', 'sand'];

  function stableHash(value) {
    var text = String(value == null ? '' : value);
    var hash = 5381;
    for (var index = 0; index < text.length; index += 1) {
      hash = ((hash << 5) + hash + text.charCodeAt(index)) | 0;
    }
    return hash >>> 0;
  }

  function svgEl(tag, attrs, children) {
    var node = document.createElementNS(NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === 'class') node.setAttribute('class', attrs[key]);
        else if (key === 'text') node.textContent = attrs[key];
        else node.setAttribute(key, attrs[key]);
      });
    }
    (children || []).forEach(function (child) {
      if (child == null) return;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  function appendPath(parent, d, attrs) {
    var path = svgEl('path', Object.assign({ d: d }, attrs || {}));
    parent.appendChild(path);
    return path;
  }

  function appendCircle(parent, cx, cy, r, attrs) {
    var circle = svgEl('circle', Object.assign({ cx: cx, cy: cy, r: r }, attrs || {}));
    parent.appendChild(circle);
    return circle;
  }

  function appendEllipse(parent, cx, cy, rx, ry, attrs) {
    var ellipse = svgEl('ellipse', Object.assign({ cx: cx, cy: cy, rx: rx, ry: ry }, attrs || {}));
    parent.appendChild(ellipse);
    return ellipse;
  }

  function appendRect(parent, x, y, width, height, rx, attrs) {
    var rect = svgEl('rect', Object.assign({ x: x, y: y, width: width, height: height }, rx ? { rx: rx } : {}, attrs || {}));
    parent.appendChild(rect);
    return rect;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---------- 地块几何（局部坐标，原点在地块中心） ---------- */

  var TILE_HW = 300;
  var TILE_HH = 150;
  var TILE_SOIL = 56;

  /* 局部坐标 → 树网格位置 */
  function positionInTile(index, side) {
    var center = (side - 1) / 2;
    var u = index % side;
    var v = Math.floor(index / side);
    var uNorm = (u - center) / side;
    var vNorm = (v - center) / side;
    return {
      x: (uNorm - vNorm) * TILE_HW * 0.8,
      y: (uNorm + vNorm) * TILE_HH * 0.8,
      u: u,
      v: v
    };
  }

  function appendSoilSpeckles(g, colors, key) {
    var count = 18;
    for (var i = 0; i < count; i += 1) {
      var seedL = stableHash(key + ':soilL:' + i);
      var seedR = stableHash(key + ':soilR:' + i);
      var tL = (seedL % 100) / 100;
      var sL = 0.3 + ((Math.floor(seedL / 100) % 60) / 100);
      var tR = (seedR % 100) / 100;
      var sR = 0.3 + ((Math.floor(seedR / 100) % 60) / 100);
      var xL = lerp(-TILE_HW, 0, tL);
      var yL = lerp(0, TILE_HH, tL) + TILE_SOIL * sL;
      var xR = lerp(0, TILE_HW, tR);
      var yR = lerp(TILE_HH, 0, tR) + TILE_SOIL * sR;
      var rL = 3 + ((seedL % 5) * 0.6);
      var rR = 3 + ((seedR % 5) * 0.6);
      appendEllipse(g, xL, yL, rL, rL * 0.7, { fill: colors.soilSpeck });
      appendEllipse(g, xR, yR, rR, rR * 0.7, { fill: colors.soilSpeck });
    }
  }

  function appendCloudRim(g, colors, key) {
    var left = { x: -TILE_HW, y: 0 };
    var bottom = { x: 0, y: TILE_HH };
    var right = { x: TILE_HW, y: 0 };
    var edge = Math.sqrt(TILE_HW * TILE_HW + TILE_HH * TILE_HH);
    var bumps = 10;
    var radius = (edge / bumps) * 0.62;
    var drop = radius * 0.5;
    function scallop(a, b, seedBase) {
      for (var i = 0; i < bumps; i += 1) {
        var t = (i + 0.5) / bumps;
        var seed = stableHash(key + ':rim:' + seedBase + ':' + i);
        var jx = ((seed % 100) / 100 - 0.5) * radius * 0.5;
        var jy = ((Math.floor(seed / 100) % 100) / 100 - 0.5) * radius * 0.35;
        var x = lerp(a.x, b.x, t) + jx;
        var y = lerp(a.y, b.y, t) + drop + jy;
        appendCircle(g, x, y, radius, { fill: colors.rim });
      }
    }
    scallop(left, bottom, 0);
    scallop(bottom, right, 1);
  }

  function appendGroundSpeckles(g, colors, key) {
    var count = 40;
    var side = 5;
    var used = {};
    for (var i = 0; i < count; i += 1) {
      var seed = stableHash(key + ':speckle:' + i);
      var cell = seed % (side * side);
      if (used[cell]) cell = (cell + i * 3 + 1) % (side * side);
      used[cell] = true;
      var pos = positionInTile(cell, side);
      var jx = ((stableHash(key + ':spx:' + i) % 100) / 50 - 1) * 16;
      var jy = ((stableHash(key + ':spy:' + i) % 100) / 50 - 1) * 12;
      var color = colors.speckles[seed % colors.speckles.length];
      var r = 2 + (seed % 3) * 1;
      appendCircle(g, pos.x + jx, pos.y + jy, r, { fill: color, opacity: '.8' });
    }
  }

  /* 画一个完整地块到局部坐标组 g。 */
  function appendBiomePlot(g, biome, key) {
    var colors = BIOMES[biome] || BIOMES.grass;
    var topY = -TILE_HH;
    var bottomY = TILE_HH;
    var leftX = -TILE_HW;
    var rightX = TILE_HW;
    /* 泥土崖壁（左右两面） */
    g.appendChild(svgEl('polygon', {
      points: [leftX + ',0', '0,' + bottomY, '0,' + (bottomY + TILE_SOIL), leftX + ',' + TILE_SOIL].join(' '),
      fill: colors.soilLeft
    }));
    g.appendChild(svgEl('polygon', {
      points: ['0,' + bottomY, rightX + ',0', rightX + ',' + TILE_SOIL, '0,' + (bottomY + TILE_SOIL)].join(' '),
      fill: colors.soilRight
    }));
    appendSoilSpeckles(g, colors, key);
    /* 云朵垂边 */
    appendCloudRim(g, colors, key);
    /* 顶部菱形地表 */
    g.appendChild(svgEl('polygon', {
      points: ['0,' + topY, rightX + ',0', '0,' + bottomY, leftX + ',0'].join(' '),
      fill: colors.ground
    }));
    appendGroundSpeckles(g, colors, key);
    g.appendChild(svgEl('path', {
      d: 'M' + leftX + ' 0 L0 ' + bottomY + ' L' + rightX + ' 0 L0 ' + topY + ' Z',
      fill: 'none',
      stroke: colors.rimStroke,
      'stroke-width': '2',
      'stroke-linejoin': 'round'
    }));
  }

  /* ---------- 树 ---------- */

  function appendShadow(parent) {
    appendEllipse(parent, 0, 4, 30, 10, { class: 'forest-shadow' });
  }

  function appendTrunk(parent, color, height) {
    appendPath(parent, 'M-3 0 L-3 -' + height + ' L3 -' + height + ' L3 0 Z', { fill: color });
  }

  function appendRoots(parent, color) {
    appendPath(parent, 'M-9 2 C-8 8 -3 10 0 6 C3 10 8 8 9 2 Z', { fill: color, opacity: '.8' });
  }

  /* 松树：深青蓝塔 + 羽毛锯齿边缘 + 塔顶白色蝴蝶结 + 树身雪点。 */
  function appendPineTree(parent, variant) {
    var dark = variant === 2 ? '#1E3B47' : '#244551';
    var mid = variant === 2 ? '#2A5561' : '#2F606E';
    var light = variant === 2 ? '#4E7F8A' : '#558C98';
    var snowy = '#BFDCE0';
    appendShadow(parent);
    appendTrunk(parent, '#5C4230', 22);
    appendRoots(parent, '#5C4230');
    /* 三层羽毛塔：锯齿边缘用多段折线模拟 */
    function layer(topY, baseY, halfW, fill) {
      var d = 'M' + (-halfW) + ' ' + baseY;
      d += ' L' + (-halfW * 0.9) + ' ' + (baseY - (baseY - topY) * 0.22);
      d += ' L' + (-halfW * 0.5) + ' ' + (baseY - (baseY - topY) * 0.16);
      d += ' L' + (-halfW * 0.45) + ' ' + (baseY - (baseY - topY) * 0.42);
      d += ' L' + (-halfW * 0.2) + ' ' + (baseY - (baseY - topY) * 0.34);
      d += ' L' + (-halfW * 0.14) + ' ' + (baseY - (baseY - topY) * 0.62);
      d += ' L0 ' + topY;
      d += ' L' + (halfW * 0.14) + ' ' + (baseY - (baseY - topY) * 0.62);
      d += ' L' + (halfW * 0.2) + ' ' + (baseY - (baseY - topY) * 0.34);
      d += ' L' + (halfW * 0.45) + ' ' + (baseY - (baseY - topY) * 0.42);
      d += ' L' + (halfW * 0.5) + ' ' + (baseY - (baseY - topY) * 0.16);
      d += ' L' + (halfW * 0.9) + ' ' + (baseY - (baseY - topY) * 0.22);
      d += ' L' + halfW + ' ' + baseY + ' Z';
      appendPath(parent, d, { fill: fill });
    }
    layer(-46, -8, 34, dark);
    layer(-58, -22, 28, mid);
    layer(-70, -36, 22, light);
    /* 层间雪点 */
    appendCircle(parent, -22, -30, 1.8, { fill: snowy, opacity: '.8' });
    appendCircle(parent, 22, -16, 1.8, { fill: snowy, opacity: '.8' });
    appendCircle(parent, -14, -52, 1.8, { fill: snowy, opacity: '.85' });
    appendCircle(parent, 15, -48, 1.8, { fill: snowy, opacity: '.85' });
    appendCircle(parent, 5, -60, 1.6, { fill: snowy, opacity: '.9' });
    /* 塔顶白色蝴蝶结 */
    appendPath(parent, 'M0 -84 L3.2 -79 L10 -77 L5 -72 L6 -65 L0 -69 L-6 -65 L-5 -72 L-10 -77 L-3.2 -79 Z', {
      fill: '#FFFFFF',
      stroke: '#CFE4E8',
      'stroke-width': '0.6',
      'stroke-linejoin': 'round'
    });
    appendCircle(parent, 0, -74, 1.2, { fill: '#FFF' });
  }

  /* 云朵蓬松树冠（花树 / 樱花 / 山茶花共用）：由多个小圆簇堆叠，树干较长。 */
  function appendFluffy(parent, trunk, palette) {
    appendShadow(parent);
    appendTrunk(parent, trunk, 40);
    appendRoots(parent, trunk);
    /* 树冠整体在树干上方，由许多小圆簇堆成云朵 */
    var clusters = [
      [-26, -46, 13], [26, -46, 13], [0, -58, 16], [-16, -56, 12], [16, -56, 12],
      [-12, -70, 12], [12, -70, 12], [0, -80, 13], [-26, -58, 10], [26, -58, 10],
      [0, -44, 16], [-18, -38, 12], [18, -38, 12]
    ];
    clusters.forEach(function (c, i) {
      appendCircle(parent, c[0], c[1], c[2], { fill: i % 2 ? palette.mid : palette.deep });
    });
    /* 高光簇 */
    appendCircle(parent, -8, -74, 8, { fill: palette.light, opacity: '.65' });
    appendCircle(parent, 10, -72, 7, { fill: palette.light, opacity: '.55' });
    appendCircle(parent, 0, -60, 9, { fill: palette.mid });
    /* 顶部雪花高光 */
    appendPath(parent, 'M0 -96 L2.5 -91 L8 -89 L4 -84 L5 -78 L0 -81 L-5 -78 L-4 -84 L-8 -89 L-2.5 -91 Z', {
      fill: '#FFFFFF',
      stroke: 'rgba(255,255,255,.6)',
      'stroke-width': '0.5',
      'stroke-linejoin': 'round'
    });
    /* 树冠表面散落的小白花/花瓣 */
    [-20, -8, 8, 18, -14, 14].forEach(function (x, i) {
      appendCircle(parent, x, -50 + (i % 3) * -8, 2.4, { fill: palette.glow, opacity: '.9' });
    });
  }

  var BLOSSOM_PALETTES = {
    1: { deep: '#EE8CA4', mid: '#F6B4C4', light: '#FBD6E0', glow: '#FFF3F6' },
    2: { deep: '#9B7CC7', mid: '#B79BE0', light: '#D4C4F0', glow: '#F1EBFA' },
    3: { deep: '#8FC0E6', mid: '#B8DCF5', light: '#D9EEFC', glow: '#F2FAFE' }
  };

  function appendBlossomTree(parent, variant) {
    appendFluffy(parent, '#8A5C48', BLOSSOM_PALETTES[variant] || BLOSSOM_PALETTES[1]);
  }

  function appendCamelliaTree(parent, variant) {
    var palettes = {
      1: { deep: '#D95C5B', mid: '#EF8C8C', light: '#F6C4C0', glow: '#FFE8E6' },
      2: { deep: '#C84A52', mid: '#E67C80', light: '#F5BEC0', glow: '#FFF0EF' },
      3: { deep: '#9B7CC7', mid: '#B79BE0', light: '#D4C4F0', glow: '#F1EBFA' }
    };
    appendFluffy(parent, '#79513C', palettes[variant] || palettes[1]);
  }

  function appendCherryTree(parent, variant) {
    var palettes = {
      1: { deep: '#EE8FA7', mid: '#F9C4CC', light: '#FCE4E8', glow: '#FFF6F8' },
      2: { deep: '#8FC0E6', mid: '#B8DCF5', light: '#D9EEFC', glow: '#F2FAFE' },
      3: { deep: '#DDE4EE', mid: '#EEF2F7', light: '#FFFFFF', glow: '#FFFFFF' }
    };
    appendFluffy(parent, '#8A5C48', palettes[variant] || palettes[1]);
  }

  /* 秋枫：橙红多层塔。 */
  function appendMapleTree(parent, variant) {
    var dark = variant === 2 ? '#C2571F' : '#D0662A';
    var mid = variant === 2 ? '#E08A2E' : '#E89A36';
    var light = variant === 2 ? '#F2B14A' : '#F5BE55';
    appendShadow(parent);
    appendTrunk(parent, '#6E4A2E', 26);
    appendRoots(parent, '#6E4A2E');
    function layer(topY, baseY, halfW, fill) {
      var d = 'M' + (-halfW) + ' ' + baseY;
      d += ' L' + (-halfW * 0.9) + ' ' + (baseY - (baseY - topY) * 0.22);
      d += ' L' + (-halfW * 0.5) + ' ' + (baseY - (baseY - topY) * 0.16);
      d += ' L' + (-halfW * 0.45) + ' ' + (baseY - (baseY - topY) * 0.42);
      d += ' L' + (-halfW * 0.2) + ' ' + (baseY - (baseY - topY) * 0.34);
      d += ' L' + (-halfW * 0.14) + ' ' + (baseY - (baseY - topY) * 0.62);
      d += ' L0 ' + topY;
      d += ' L' + (halfW * 0.14) + ' ' + (baseY - (baseY - topY) * 0.62);
      d += ' L' + (halfW * 0.2) + ' ' + (baseY - (baseY - topY) * 0.34);
      d += ' L' + (halfW * 0.45) + ' ' + (baseY - (baseY - topY) * 0.42);
      d += ' L' + (halfW * 0.5) + ' ' + (baseY - (baseY - topY) * 0.16);
      d += ' L' + (halfW * 0.9) + ' ' + (baseY - (baseY - topY) * 0.22);
      d += ' L' + halfW + ' ' + baseY + ' Z';
      appendPath(parent, d, { fill: fill });
    }
    layer(-46, -12, 31, dark);
    layer(-58, -26, 26, mid);
    layer(-70, -40, 20, light);
    appendCircle(parent, 5, -46, 2.4, { fill: '#FFF0C0', opacity: '.9' });
    appendCircle(parent, -14, -30, 2, { fill: '#FFE0A6', opacity: '.85' });
    appendCircle(parent, 15, -50, 1.8, { fill: '#FFE0A6', opacity: '.8' });
  }

  /* 果树：绿冠橙果。 */
  function appendFruitTree(parent, variant) {
    var leaf = variant === 2 ? '#347A4A' : '#3E8B54';
    var light = '#5DA86F';
    appendShadow(parent);
    appendTrunk(parent, '#7B4B2D', 32);
    appendRoots(parent, '#7B4B2D');
    appendEllipse(parent, 0, -32, 30, 23, { fill: leaf });
    appendEllipse(parent, -15, -24, 18, 15, { fill: light });
    appendEllipse(parent, 15, -24, 18, 15, { fill: light });
    [-20, -8, 6, 18].forEach(function (x) {
      appendCircle(parent, x, -29 + (x % 2) * 6, 4.2, { fill: '#F3B84C', stroke: '#D28A2B', 'stroke-width': '1.4' });
    });
  }

  /* 橡树：绿冠。 */
  function appendOakTree(parent, variant) {
    var deep = variant === 2 ? '#256B3E' : '#2D7A47';
    var leaf = variant === 2 ? '#3E9556' : '#4AA55F';
    var light = '#78C58D';
    appendShadow(parent);
    appendTrunk(parent, '#795333', 34);
    appendRoots(parent, '#795333');
    appendEllipse(parent, 0, -33, 29, 22, { fill: deep });
    appendEllipse(parent, -18, -25, 19, 16, { fill: leaf });
    appendEllipse(parent, 18, -25, 19, 16, { fill: leaf });
    appendEllipse(parent, 0, -45, 21, 18, { fill: leaf });
    appendCircle(parent, -10, -50, 4, { fill: light, opacity: '.88' });
    appendCircle(parent, 9, -33, 3, { fill: light, opacity: '.7' });
  }

  function appendTreeArt(parent, tree) {
    if (tree.species === 'pine') appendPineTree(parent, tree.variant);
    else if (tree.species === 'maple') appendMapleTree(parent, tree.variant);
    else if (tree.species === 'blossom') appendBlossomTree(parent, tree.variant);
    else if (tree.species === 'camellia') appendCamelliaTree(parent, tree.variant);
    else if (tree.species === 'cherry') appendCherryTree(parent, tree.variant);
    else if (tree.species === 'fruit') appendFruitTree(parent, tree.variant);
    else appendOakTree(parent, tree.variant);
  }

  function labelForTree(tree) {
    var names = {
      oak: '橡树',
      pine: '松树',
      maple: '枫树',
      blossom: '花树',
      camellia: '山茶花树',
      cherry: '樱花树',
      fruit: '果树'
    };
    var name = names[tree.species] || '普通树';
    return name + ' · ' + Math.max(1, Math.round((tree.durationSec || 0) / 60)) + ' 分钟';
  }

  /* 在局部坐标地块 g 里种一棵树（局部坐标）。 */
  function appendTree(g, tree, index, side) {
    var pos = positionInTile(index, side);
    var seed = tree.seed >>> 0;
    var baseScale = Math.max(0.6, Math.min(1.42, 1.42 - (side - 1) * 0.06));
    var scale = baseScale * (0.9 + ((seed % 21) / 100));
    var group = svgEl('g', {
      class: 'forest-tree tier-' + tree.tier + ' species-' + (tree.species || 'oak') + ' variant-' + tree.variant,
      transform: 'translate(' + pos.x.toFixed(2) + ' ' + pos.y.toFixed(2) + ') scale(' + scale.toFixed(3) + ')',
      'data-id': tree.id,
      'data-x': pos.x.toFixed(2),
      'data-y': pos.y.toFixed(2),
      'data-date': tree.dateKey
    });
    group.appendChild(svgEl('title', { text: tree.dateKey + ' · ' + labelForTree(tree) }));
    var inner = svgEl('g', { class: 'forest-tree-inner' });
    appendTreeArt(inner, tree);
    group.appendChild(inner);
    g.appendChild(group);
    return group;
  }

  /* ---------- 地面花丛（黄水仙 / 粉绣球 / 白雏菊 / 蓝灌木 / 落果） ---------- */

  function appendDaffodil(parent, palette) {
    appendEllipse(parent, 0, 2, 12, 4, { class: 'forest-shadow', opacity: '.55' });
    [-9, 0, 9].forEach(function (x) {
      appendPath(parent, 'M' + x + ' 2 L' + x + ' -16', { stroke: '#2F9E63', 'stroke-width': '2.6', 'stroke-linecap': 'round' });
    });
    [-9, 0, 9].forEach(function (x, i) {
      var y = -18 - Math.abs(x) * 0.2;
      appendCircle(parent, x, y, 4.6, { fill: palette[0], stroke: palette[1], 'stroke-width': '1.2' });
      appendCircle(parent, x, y, 1.8, { fill: '#FFF6C8' });
    });
  }

  function appendHydrangea(parent) {
    appendEllipse(parent, 0, 2, 13, 4, { class: 'forest-shadow', opacity: '.55' });
    appendPath(parent, 'M0 2 L0 -12', { stroke: '#2F8B5A', 'stroke-width': '2.6', 'stroke-linecap': 'round' });
    appendEllipse(parent, -6, -4, 6, 4, { fill: '#4AA565' });
    appendEllipse(parent, 6, -4, 6, 4, { fill: '#4AA565' });
    var pinks = ['#E98FA9', '#F3B2C6', '#F7C9D6'];
    [-8, -3, 2, 7].forEach(function (x, i) {
      appendCircle(parent, x, -13 - (i % 2) * 4, 5.6, { fill: pinks[i % pinks.length] });
    });
    appendCircle(parent, -2, -17, 5.2, { fill: '#F3B2C6' });
    appendCircle(parent, -6, -17, 2, { fill: '#FBE1E8', opacity: '.9' });
    appendCircle(parent, 5, -16, 1.8, { fill: '#FBE1E8', opacity: '.9' });
  }

  function appendDaisy(parent, palette) {
    appendEllipse(parent, 0, 2, 10, 4, { class: 'forest-shadow', opacity: '.5' });
    appendPath(parent, 'M0 2 L0 -14', { stroke: '#3AA566', 'stroke-width': '2.4', 'stroke-linecap': 'round' });
    [0, 72, 144, 216, 288].forEach(function (deg) {
      var angle = deg * Math.PI / 180;
      var x = Math.cos(angle) * 6.2;
      var y = -15 + Math.sin(angle) * 6.2;
      appendCircle(parent, x, y, 4, { fill: palette[0], opacity: '.95' });
    });
    appendCircle(parent, 0, -15, 2.4, { fill: palette[1] });
  }

  function appendBlueBush(parent) {
    appendEllipse(parent, 0, 2, 12, 4, { class: 'forest-shadow', opacity: '.5' });
    appendCircle(parent, -6, -4, 8, { fill: '#4E8A6E' });
    appendCircle(parent, 6, -4, 8, { fill: '#6FAE86' });
    appendCircle(parent, 0, -10, 9, { fill: '#8FCBA0' });
    appendCircle(parent, 3, -14, 2.2, { fill: '#F2D85C', opacity: '.95' });
    appendCircle(parent, -4, -12, 1.8, { fill: '#FFFFFF', opacity: '.7' });
  }

  function appendFruitFall(parent) {
    appendEllipse(parent, 0, 2, 11, 4, { class: 'forest-shadow', opacity: '.5' });
    appendCircle(parent, -4, -3, 4.4, { fill: '#F3B84C', stroke: '#D28A2B', 'stroke-width': '1.2' });
    appendCircle(parent, 4, -4, 3.8, { fill: '#F3B84C', stroke: '#D28A2B', 'stroke-width': '1.2' });
    appendCircle(parent, 0, 0, 3.2, { fill: '#F3B84C', stroke: '#D28A2B', 'stroke-width': '1.2' });
  }

  function appendRock(parent, color) {
    appendEllipse(parent, 0, 2, 12, 4, { class: 'forest-shadow', opacity: '.5' });
    appendPath(parent, 'M-13 3 L-5 -7 L11 -2 L10 4 Z', { fill: color, stroke: '#94A199', 'stroke-width': '1.4' });
  }

  /* 主题花丛生成器：返回一个花丛函数，放入局部坐标 g。 */
  function decorationFor(biome, seed) {
    if (biome === 'snow') return ['daisy', 'bush', 'daisy', 'rock'][seed % 4];
    if (biome === 'sand') return ['fruit', 'daisy', 'rock', 'fruit'][seed % 4];
    return ['daffodil', 'hydrangea', 'daisy', 'bush', 'daffodil'][seed % 5];
  }

  function appendDecoration(g, biome, kind, index, side) {
    var seed = index * 7919 + 104729;
    var pos = positionInTile(index, side);
    var jx = ((seed % 89) / 44 - 1) * 12;
    var jy = ((Math.floor(seed / 89) % 89) / 44 - 1) * 9;
    var scale = Math.max(0.55, 1 - (side - 1) * 0.04);
    var group = svgEl('g', {
      class: 'forest-decoration deco-' + kind,
      transform: 'translate(' + (pos.x + jx).toFixed(2) + ' ' + (pos.y + jy).toFixed(2) + ') scale(' + scale.toFixed(3) + ')'
    });
    if (kind === 'daffodil') appendDaffodil(group, ['#F3C15A', '#E09E3C']);
    else if (kind === 'hydrangea') appendHydrangea(group);
    else if (kind === 'daisy') appendDaisy(group, biome === 'snow' ? ['#D8E7F6', '#FFFFFF'] : ['#FFFFFF', '#F6C94A']);
    else if (kind === 'bush') appendBlueBush(group);
    else if (kind === 'fruit') appendFruitFall(group);
    else appendRock(group, biome === 'sand' ? '#C9B58A' : '#B7C1B8');
    g.appendChild(group);
  }

  /* ---------- 分组与渲染 ---------- */

  function dominantBiome(trees) {
    var counts = {};
    trees.forEach(function (tree) {
      var b = tree.biome || 'grass';
      counts[b] = (counts[b] || 0) + 1;
    });
    var best = 'grass';
    var bestN = 0;
    BIOME_ORDER.forEach(function (b) {
      if (counts[b] > bestN) { best = b; bestN = counts[b]; }
    });
    return best;
  }

  function baseKey(trees) {
    return (trees && trees.length)
      ? trees[0].id + ':' + trees[trees.length - 1].id
      : 'empty';
  }

  function buildSvg(label) {
    return svgEl('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      preserveAspectRatio: 'xMidYMid meet',
      class: 'forest-svg',
      role: 'img',
      'aria-label': label
    });
  }

  /* 把一组树画到一块地上（局部坐标组 g），side 控制网格密度。 */
  function drawTile(g, biome, trees, key, grassCount, flowerCount) {
    appendBiomePlot(g, biome, key);
    var side = Math.max(1, Math.ceil(Math.sqrt(trees.length)));
    var used = {};
    trees.forEach(function (tree, index) {
      appendTree(g, tree, index, side);
      var pos = positionInTile(index, side);
      used[pos.u + ':' + pos.v] = true;
    });
    var decoTotal = Math.min(8, Math.max(2, Math.floor(trees.length / 2)));
    for (var d = 0; d < decoTotal; d += 1) {
      var keySeed = ((d * 131 + trees.length * 17) * 2654435761) >>> 0;
      var cell = Math.floor((keySeed % (side * side)));
      var candidate = positionInTile(cell, side);
      if (!used[candidate.u + ':' + candidate.v]) {
        appendDecoration(g, biome, decorationFor(biome, keySeed), cell, side);
        used[candidate.u + ':' + candidate.v] = true;
      }
    }
  }

  /* 今日森林：单地块放大。 */
  function render(container, forest, opts) {
    if (!container) return;
    container.innerHTML = '';
    container.classList.remove('has-empty');
    var trees = forest && Array.isArray(forest.trees) ? forest.trees : [];
    if (!trees.length) {
      renderEmpty(container, (opts && opts.emptyText) || '完成一个番茄，种下第一棵树');
      return;
    }
    var biome = dominantBiome(trees);
    var svg = buildSvg(forest && forest.treeCount ? ('森林，已种 ' + forest.treeCount + ' 棵树') : '森林');
    var tile = svgEl('g', {
      class: 'forest-plot',
      transform: 'translate(500 330)'
    });
    drawTile(tile, biome, trees, baseKey(trees), forest.grassCount, forest.flowerCount);
    svg.appendChild(tile);
    var tag = svgEl('text', {
      x: 500,
      y: 330 + TILE_HH + TILE_SOIL + 26,
      'text-anchor': 'middle',
      class: 'forest-tile-label'
    });
    tag.textContent = (BIOMES[biome] ? BIOMES[biome].label : '森林') + ' · ' + trees.length + ' 棵';
    svg.appendChild(tag);
    container.appendChild(svg);
    if (opts && opts.animateId) celebrate(container, opts.animateId);
    return svg;
  }

  /* 洞察页：按天分组，每天一个地块，错落拼接成拼贴。 */
  function renderCollage(container, daysForest, opts) {
    if (!container) return;
    container.innerHTML = '';
    container.classList.remove('has-empty');
    var days = daysForest && Array.isArray(daysForest.days) ? daysForest.days : [];
    if (!days.length) {
      renderEmpty(container, (opts && opts.emptyText) || '完成一个番茄，种下第一棵树');
      return;
    }
    var count = days.length;
    var svg = buildSvg('专注森林，已种 ' + (daysForest.totalTrees || 0) + ' 棵树');
    var cols = count <= 1 ? 1 : (count <= 4 ? 2 : 3);
    var rows = Math.ceil(count / cols);
    var colGap = W / cols;
    var rowGap = H / rows;
    /* 树冠会高出地块顶部约 80 单位（局部），每行上方要预留足够空间。 */
    var scale = Math.max(0.42, Math.min(1, Math.min(colGap / 620, rowGap / 520)));
    var topPad = TILE_HH * 0.9 * scale;
    var rowSpace = (H - topPad * 2) / rows;
    var used = {};
    days.forEach(function (day, index) {
      var row = Math.floor(index / cols);
      var col = index % cols;
      var cx = colGap * (col + 0.5);
      var cy = topPad + rowSpace * (row + 0.62);
      var key = baseKey(day.trees) + ':' + day.dateKey;
      var biome = dominantBiome(day.trees);
      var tile = svgEl('g', {
        class: 'forest-plot plot-' + biome,
        transform: 'translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ') scale(' + scale.toFixed(3) + ')'
      });
      drawTile(tile, biome, day.trees, key, day.grassCount, day.flowerCount);
      svg.appendChild(tile);
      var tag = svgEl('text', {
        x: cx,
        y: cy + (TILE_HH + TILE_SOIL) * scale + 12,
        'text-anchor': 'middle',
        class: 'forest-tile-label'
      });
      tag.textContent = day.dateKey.slice(5) + ' · ' + day.treeCount + ' 棵';
      svg.appendChild(tag);
    });
    container.appendChild(svg);
    if (opts && opts.animateId) celebrate(container, opts.animateId);
    return svg;
  }

  function renderEmpty(container, text) {
    if (!container) return;
    container.innerHTML = '';
    container.classList.add('has-empty');
    var svg = buildSvg('森林，还没有树');
    var tile = svgEl('g', { class: 'forest-plot', transform: 'translate(500 300)' });
    appendBiomePlot(tile, 'grass', 'empty');
    svg.appendChild(tile);
    var msg = svgEl('text', {
      x: 500,
      y: 300,
      'text-anchor': 'middle',
      class: 'forest-empty-text'
    });
    msg.textContent = text || '完成一个番茄，种下第一棵树';
    svg.appendChild(msg);
    container.appendChild(svg);
  }

  function findTree(container, treeId) {
    var nodes = container.querySelectorAll('.forest-tree');
    for (var index = 0; index < nodes.length; index += 1) {
      if (nodes[index].getAttribute('data-id') === treeId) return nodes[index];
    }
    return null;
  }

  function appendParticles(svg, x, y) {
    var group = svgEl('g', {
      class: 'forest-particles',
      transform: 'translate(' + x + ' ' + y + ')'
    });
    var colors = ['#F7D95C', '#F5A8B7', '#8FE3C1', '#FFFFFF'];
    for (var index = 0; index < 12; index += 1) {
      var angle = (Math.PI * 2 * index) / 12;
      var distance = 38 + (index % 3) * 12;
      var px = Math.cos(angle) * distance;
      var py = Math.sin(angle) * distance - 20;
      appendCircle(group, px, py, index % 3 === 0 ? 5 : 3.4, {
        fill: colors[index % colors.length],
        opacity: '.92',
        class: 'forest-particle particle-' + index
      });
    }
    svg.appendChild(group);
    return group;
  }

  function celebrate(container, treeId) {
    if (!container || !treeId) return;
    var node = findTree(container, treeId);
    if (!node) return;
    var inner = node.querySelector('.forest-tree-inner');
    if (inner) {
      inner.classList.remove('forest-tree-inner');
      void inner.getBoundingClientRect();
      inner.classList.add('forest-tree-inner');
      inner.classList.add('is-planting');
    }
    /* 粒子使用与树相同的地块局部坐标，因此挂到树所在的地块组（局部坐标系）。
     * 找不到地块组时退回 svg 根。 */
    var host = node.parentNode;
    if (!host) host = container.querySelector('.forest-svg');
    if (host) {
      var particles = appendParticles(host, node.getAttribute('data-x') || '0', node.getAttribute('data-y') || '0');
      window.setTimeout(function () {
        if (particles && particles.parentNode) particles.parentNode.removeChild(particles);
      }, 1250);
    }
  }

  function positionFor(index, side) {
    return positionInTile(index, side);
  }

  function decorationKind(seed) {
    var kinds = ['flower', 'rock', 'bush', 'mushroom', 'fruit'];
    return kinds[seed % kinds.length];
  }

  window.PomodoroForest = {
    render: render,
    renderCollage: renderCollage,
    renderEmpty: renderEmpty,
    celebrate: celebrate,
    positionFor: positionFor,
    decorationKind: decorationKind,
    BIOMES: BIOMES
  };
})();
