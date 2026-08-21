/* Pomodoro Forest — deterministic isometric SVG renderer and completion
 * celebration. Data derivation stays in model.js; this module only turns
 * { trees } into a tiny 2.5D plot and animates the newest planted tree. */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var W = 1000;
  var H = 700;
  var CX = 500;
  var CY = 320;

  function makeLayout(side) {
    var safeSide = Math.max(1, side || 1);
    var growth = Math.min(1, 0.72 + (safeSide - 1) * 0.025);
    return {
      cx: CX,
      cy: CY,
      halfW: 320 * growth,
      halfH: 170 * growth,
      soil: 52 * (0.84 + growth * 0.16)
    };
  }

  var activeLayout = makeLayout(1);

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

  function appendPlot(svg) {
    /* 顶部菱形草地 + 正前方左右两条泥土切面，构成 2.5D 方块。 */
    var l = activeLayout;
    var topY = l.cy - l.halfH;
    var bottomY = l.cy + l.halfH;
    var leftX = l.cx - l.halfW;
    var rightX = l.cx + l.halfW;
    svg.appendChild(svgEl('polygon', {
      points: [l.cx + ',' + topY, rightX + ',' + l.cy, l.cx + ',' + bottomY, leftX + ',' + l.cy].join(' '),
      class: 'forest-grass'
    }));
    svg.appendChild(svgEl('polygon', {
      points: [leftX + ',' + l.cy, l.cx + ',' + bottomY, l.cx + ',' + (bottomY + l.soil), leftX + ',' + (l.cy + l.soil)].join(' '),
      class: 'forest-soil-left'
    }));
    svg.appendChild(svgEl('polygon', {
      points: [l.cx + ',' + bottomY, rightX + ',' + l.cy, rightX + ',' + (l.cy + l.soil), l.cx + ',' + (bottomY + l.soil)].join(' '),
      class: 'forest-soil-right'
    }));
    svg.appendChild(svgEl('path', {
      d: 'M' + leftX + ' ' + l.cy + ' L' + l.cx + ' ' + bottomY + ' L' + rightX + ' ' + l.cy + ' L' + l.cx + ' ' + topY + ' Z',
      class: 'forest-grass-rim'
    }));
  }

  function positionFor(index, side) {
    var l = activeLayout;
    var center = (side - 1) / 2;
    var u = index % side;
    var v = Math.floor(index / side);
    var uNorm = (u - center) / side;
    var vNorm = (v - center) / side;
    return {
      x: l.cx + (uNorm - vNorm) * l.halfW * 0.84,
      y: l.cy + (uNorm + vNorm) * l.halfH * 0.84,
      u: u,
      v: v
    };
  }

  function appendShadow(parent) {
    appendEllipse(parent, 0, 4, 30, 10, { class: 'forest-shadow' });
  }

  function appendTrunk(parent, color, height) {
    appendPath(parent, 'M-3 0 L-3 -' + height + ' L3 -' + height + ' L3 0 Z', { fill: color });
  }

  function appendRoots(parent, color) {
    appendPath(parent, 'M-9 2 C-8 8 -3 10 0 6 C3 10 8 8 9 2 Z', { fill: color, opacity: '.8' });
  }

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

  function appendPineTree(parent, variant) {
    var dark = variant === 2 ? '#1E5A3B' : '#266B43';
    var mid = variant === 2 ? '#2D7449' : '#357C51';
    var light = '#5FA676';
    appendShadow(parent);
    appendTrunk(parent, '#6F4B31', 24);
    appendRoots(parent, '#6F4B31');
    appendPath(parent, 'M-31 -12 L0 -45 L31 -12 Z', { fill: dark });
    appendPath(parent, 'M-25 -25 L0 -55 L25 -25 Z', { fill: mid });
    appendPath(parent, 'M-18 -38 L0 -66 L18 -38 Z', { fill: light });
    appendCircle(parent, 6, -47, 2.6, { fill: '#E8F7EE', opacity: '.9' });
  }

  function appendMapleTree(parent, variant) {
    var amber = variant === 2 ? '#D9683B' : '#E8763F';
    var gold = variant === 2 ? '#F2A14E' : '#F5B25C';
    var red = '#C94F36';
    appendShadow(parent);
    appendTrunk(parent, '#79503A', 30);
    appendRoots(parent, '#79503A');
    appendEllipse(parent, 0, -32, 29, 22, { fill: red });
    appendEllipse(parent, -17, -24, 19, 15, { fill: amber });
    appendEllipse(parent, 17, -24, 19, 15, { fill: amber });
    appendEllipse(parent, 0, -44, 20, 17, { fill: gold });
    appendCircle(parent, -9, -49, 3, { fill: '#FFE0A6', opacity: '.9' });
  }

  function appendBlossomTree(parent, variant) {
    var deep = variant === 2 ? '#E47A96' : '#EE8CA4';
    var soft = variant === 2 ? '#F3A8BB' : '#F8B8C7';
    var pale = '#FFDCE3';
    appendShadow(parent);
    appendTrunk(parent, '#91614A', 29);
    appendRoots(parent, '#91614A');
    appendEllipse(parent, 0, -33, 27, 21, { fill: deep });
    appendEllipse(parent, -16, -24, 18, 15, { fill: soft });
    appendEllipse(parent, 16, -24, 18, 15, { fill: soft });
    appendEllipse(parent, 0, -45, 19, 16, { fill: soft });
    [-22, -9, 5, 18].forEach(function (x) {
      appendCircle(parent, x, -29 + (x % 3) * -5, 3.5, { fill: pale, opacity: '.95' });
    });
  }

  function appendCamelliaTree(parent, variant) {
    var red = variant === 2 ? '#C84A52' : '#D95C5B';
    var deep = '#A93F47';
    appendShadow(parent);
    appendTrunk(parent, '#79513C', 30);
    appendRoots(parent, '#79513C');
    appendEllipse(parent, 0, -32, 27, 21, { fill: deep });
    appendEllipse(parent, -16, -24, 18, 15, { fill: red });
    appendEllipse(parent, 16, -24, 18, 15, { fill: red });
    appendEllipse(parent, 0, -45, 19, 16, { fill: red });
    [-19, -7, 6, 17].forEach(function (x) {
      appendCircle(parent, x, -38 + (x % 2) * 9, 3.4, { fill: '#FFE3E0', opacity: '.95' });
    });
  }

  function appendCherryTree(parent, variant) {
    var blush = variant === 2 ? '#F3B4C0' : '#F9C4CC';
    var rose = '#EE8FA7';
    var light = '#FFF3F6';
    appendShadow(parent);
    appendTrunk(parent, '#8A5C48', 31);
    appendRoots(parent, '#8A5C48');
    appendPath(parent, 'M-4 -23 C-25 -26 -32 -45 -20 -54', { fill: 'none', stroke: '#8A5C48', 'stroke-width': '3', 'stroke-linecap': 'round' });
    appendPath(parent, 'M4 -23 C25 -26 32 -45 20 -54', { fill: 'none', stroke: '#8A5C48', 'stroke-width': '3', 'stroke-linecap': 'round' });
    appendEllipse(parent, 0, -31, 29, 22, { fill: rose });
    appendEllipse(parent, -17, -24, 18, 15, { fill: blush });
    appendEllipse(parent, 17, -24, 18, 15, { fill: blush });
    appendEllipse(parent, 0, -45, 20, 17, { fill: blush });
    [-23, -10, 7, 19].forEach(function (x) {
      appendCircle(parent, x, -38 + (x % 2) * 7, 3.3, { fill: light, opacity: '.95' });
    });
  }

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

  function appendTree(svg, tree, index, side, opts) {
    var pos = positionFor(index, side);
    var seed = tree.seed >>> 0;
    var l = activeLayout;
    var xStep = l.halfW * 0.84 / side;
    var yStep = l.halfH * 0.84 / side;
    var jitterX = ((seed % 1000) / 1000 - 0.5) * xStep * 0.42;
    var jitterY = ((Math.floor(seed / 1000) % 1000) / 1000 - 0.5) * yStep * 0.42;
    var baseScale = Math.max(0.52, Math.min(1.12, 1.12 - (side - 1) * 0.055));
    var scale = baseScale * (0.88 + ((seed % 27) / 100));
    var group = svgEl('g', {
      class: 'forest-tree tier-' + tree.tier + ' species-' + (tree.species || 'oak') + ' variant-' + tree.variant,
      transform: 'translate(' + (pos.x + jitterX).toFixed(2) + ' ' + (pos.y + jitterY).toFixed(2) + ') scale(' + scale.toFixed(3) + ')',
      'data-id': tree.id,
      'data-x': (pos.x + jitterX).toFixed(2),
      'data-y': (pos.y + jitterY).toFixed(2),
      'data-date': tree.dateKey
    });
    if (opts && opts.highlightId && tree.id === opts.highlightId) group.setAttribute('class', group.getAttribute('class') + ' is-latest');
    group.appendChild(svgEl('title', { text: tree.dateKey + ' · ' + labelForTree(tree) }));
    var inner = svgEl('g', { class: 'forest-tree-inner' });
    appendTreeArt(inner, tree);
    group.appendChild(inner);
    svg.appendChild(group);
    return group;
  }

  function decorationKind(seed) {
    var kinds = ['flower', 'rock', 'mushroom', 'rabbit', 'house'];
    return kinds[seed % kinds.length];
  }

  function appendDecoration(svg, kind, index, side) {
    var seed = index * 7919 + 104729;
    var pos = positionFor(index, side);
    var jx = ((seed % 89) / 44 - 1) * 6;
    var jy = ((Math.floor(seed / 89) % 89) / 44 - 1) * 6;
    var scale = Math.max(0.55, 1 - (side - 1) * 0.04);
    var group = svgEl('g', {
      class: 'forest-decoration deco-' + kind,
      transform: 'translate(' + (pos.x + jx).toFixed(2) + ' ' + (pos.y + jy).toFixed(2) + ') scale(' + scale.toFixed(3) + ')'
    });
    appendEllipse(group, 0, 2, 12, 4, { class: 'forest-shadow', opacity: '.65' });
    if (kind === 'flower') {
      appendPath(group, 'M0 2 L0 -16', { stroke: '#2F9E63', 'stroke-width': '3', 'stroke-linecap': 'round' });
      [-10, 0, 10].forEach(function (x) {
        appendCircle(group, x, -18 - Math.abs(x) * 0.15, 6, { fill: '#F3C15A', stroke: '#E09E3C', 'stroke-width': '1.4' });
      });
    } else if (kind === 'rock') {
      appendPath(group, 'M-13 3 L-5 -7 L11 -2 L10 4 Z', { fill: '#B7C1B8', stroke: '#94A199', 'stroke-width': '1.4' });
    } else if (kind === 'mushroom') {
      appendRect(group, -3, -12, 7, 14, 3, { fill: '#F3E8D2' });
      appendPath(group, 'M-13 -10 C-13 -24 13 -24 13 -10 Z', { fill: '#E8553A', stroke: '#C74230', 'stroke-width': '1.5' });
      appendCircle(group, -5, -17, 1.6, { fill: '#FFF3E5' });
      appendCircle(group, 4, -14, 1.4, { fill: '#FFF3E5' });
    } else if (kind === 'rabbit') {
      appendEllipse(group, 0, -2, 10, 8, { fill: '#F8F1E7' });
      appendCircle(group, 0, -12, 6, { fill: '#F8F1E7' });
      appendEllipse(group, -4, -23, 2.8, 9, { fill: '#F8F1E7', stroke: '#E2D4C3', 'stroke-width': '1' });
      appendEllipse(group, 4, -23, 2.8, 9, { fill: '#F8F1E7', stroke: '#E2D4C3', 'stroke-width': '1' });
    } else {
      appendRect(group, -16, -26, 32, 28, 3, { fill: '#F5C978' });
      appendPath(group, 'M-20 -25 L0 -46 L20 -25 Z', { fill: '#D9774A', stroke: '#B85F3A', 'stroke-width': '1.5' });
      appendRect(group, -4, -10, 9, 13, 2, { fill: '#8A5A38' });
    }
    svg.appendChild(group);
  }

  function appendGrassTuft(parent, seed) {
    var tint = seed % 2 ? '#4BA664' : '#66BC77';
    var group = svgEl('g', { class: 'forest-grass-tuft' });
    appendPath(group, 'M0 3 C-1 -8 -6 -13 -12 -17', { fill: 'none', stroke: tint, 'stroke-width': '3', 'stroke-linecap': 'round' });
    appendPath(group, 'M0 3 C0 -9 2 -14 5 -19', { fill: 'none', stroke: tint, 'stroke-width': '3', 'stroke-linecap': 'round' });
    appendPath(group, 'M0 3 C2 -7 8 -11 14 -14', { fill: 'none', stroke: tint, 'stroke-width': '3', 'stroke-linecap': 'round' });
    parent.appendChild(group);
  }

  function appendGroundFlower(parent, seed) {
    var pinks = ['#F4A6B8', '#F5B94E', '#F07D8E', '#C6E98B'];
    var color = pinks[seed % pinks.length];
    var group = svgEl('g', { class: 'forest-ground-flower' });
    appendPath(group, 'M0 2 L0 -13', { stroke: '#339B61', 'stroke-width': '2.6', 'stroke-linecap': 'round' });
    [0, 72, 144, 216, 288].forEach(function (deg) {
      var angle = deg * Math.PI / 180;
      var x = Math.cos(angle) * 6.5;
      var y = -14 + Math.sin(angle) * 6.5;
      appendCircle(group, x, y, 4.2, { fill: color, opacity: '.9' });
    });
    appendCircle(group, 0, -14, 2.2, { fill: '#FFF3A8' });
    parent.appendChild(group);
  }

  function greeneryKey(forest) {
    return (forest && forest.trees && forest.trees.length)
      ? forest.trees[0].id + ':' + forest.trees[forest.trees.length - 1].id + ':' + (forest.totalFocusSec || 0)
      : 'empty:' + (forest && forest.totalFocusSec ? forest.totalFocusSec : 0);
  }

  function appendGroundGreenery(svg, forest, side) {
    var l = activeLayout;
    var key = greeneryKey(forest);
    var groundSide = Math.max(4, side);
    var grassCount = forest && Number.isFinite(forest.grassCount) ? forest.grassCount : 0;
    var flowerCount = forest && Number.isFinite(forest.flowerCount) ? forest.flowerCount : 0;
    var total = grassCount + flowerCount;
    var used = {};
    for (var index = 0; index < total; index += 1) {
      var seed = stableHash(key + ':greenery:' + index);
      var cell = seed % (groundSide * groundSide);
      if (used[cell]) {
        cell = (cell + index * 5 + 3) % (groundSide * groundSide);
      }
      used[cell] = true;
      var pos = positionFor(cell, groundSide);
      var jitterX = ((stableHash(key + ':gx:' + index) % 100) / 50 - 1) * 5;
      var jitterY = ((stableHash(key + ':gy:' + index) % 100) / 50 - 1) * 5;
      var scale = Math.max(0.55, 1 - (side - 1) * 0.04);
      var group = svgEl('g', {
        class: index < grassCount ? 'forest-greenery grass' : 'forest-greenery flower',
        transform: 'translate(' + (pos.x + jitterX).toFixed(2) + ' ' + (pos.y + jitterY).toFixed(2) + ') scale(' + scale.toFixed(3) + ')'
      });
      if (index < grassCount) appendGrassTuft(group, seed);
      else appendGroundFlower(group, seed);
      svg.appendChild(group);
    }
  }

  function baseKey(forest) {
    return (forest && forest.trees && forest.trees.length)
      ? forest.trees[0].id + ':' + (forest.trees[forest.trees.length - 1] ? forest.trees[forest.trees.length - 1].id : '')
      : 'empty';
  }

  function render(container, forest, opts) {
    if (!container) return;
    container.innerHTML = '';
    container.classList.remove('has-empty');
    var trees = forest && Array.isArray(forest.trees) ? forest.trees : [];
    var side = Math.max(1, Math.ceil(Math.sqrt(Math.max(trees.length, 1))));
    activeLayout = makeLayout(side);
    var svg = svgEl('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      preserveAspectRatio: 'xMidYMid meet',
      class: 'forest-svg',
      role: 'img',
      'aria-label': forest && forest.treeCount ? ('森林，已种 ' + forest.treeCount + ' 棵树') : '森林，还没有树'
    });
    appendPlot(svg);
    if (!trees.length) {
      var text = svgEl('text', {
        x: CX,
        y: CY,
        'text-anchor': 'middle',
        class: 'forest-empty-text'
      });
      text.textContent = (opts && opts.emptyText) || '完成一个番茄，种下第一棵树';
      svg.appendChild(text);
      container.appendChild(svg);
      container.classList.add('has-empty');
      return svg;
    }
    appendGroundGreenery(svg, forest, side);
    trees.forEach(function (tree, index) { appendTree(svg, tree, index, side, opts); });
    var used = {};
    trees.forEach(function (tree, index) {
      var pos = positionFor(index, side);
      used[pos.u + ':' + pos.v] = true;
    });
    var decoCount = Math.min(6, Math.floor(trees.length / 8));
    for (var d = 0; d < decoCount; d += 1) {
      var keySeed = 0;
      var attempt = 0;
      while (attempt < 40) {
        keySeed = ((d * 131 + attempt * 47 + trees.length * 17) * 2654435761) >>> 0;
        var cell = Math.floor((keySeed % (side * side)));
        var candidate = positionFor(cell, side);
        if (!used[candidate.u + ':' + candidate.v]) {
          appendDecoration(svg, decorationKind(keySeed), cell, side);
          used[candidate.u + ':' + candidate.v] = true;
          break;
        }
        attempt += 1;
      }
    }
    container.appendChild(svg);
    if (opts && opts.animateId) celebrate(container, opts.animateId);
    return svg;
  }

  function renderEmpty(container, text) {
    if (!container) return;
    render(container, { trees: [], treeCount: 0, totalTrees: 0, totalFocusSec: 0, capped: false }, { emptyText: text || '完成一个番茄，种下第一棵树' });
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
      /* 强制重排后重新添加类，确保同一次完成也能重播动画。 */
      void inner.getBoundingClientRect();
      inner.classList.add('forest-tree-inner');
      inner.classList.add('is-planting');
    }
    var svg = container.querySelector('.forest-svg');
    if (svg) {
      var particles = appendParticles(svg, node.getAttribute('data-x') || '0', node.getAttribute('data-y') || '0');
      window.setTimeout(function () {
        if (particles && particles.parentNode) particles.parentNode.removeChild(particles);
      }, 1250);
    }
  }

  window.PomodoroForest = {
    render: render,
    renderEmpty: renderEmpty,
    celebrate: celebrate,
    positionFor: positionFor,
    decorationKind: decorationKind
  };
})();
