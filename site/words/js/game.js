/* Full-screen vocabulary sorting game. */
(function () {
'use strict';
var activateModal = WordTales.FeatureModal.activate;
var deactivateModal = WordTales.FeatureModal.deactivate;
function isWordStarred(word, occurrenceId) { return WordTales.Progress.has(word, occurrenceId); }
function toggleStarWord(word, add, occurrenceId) { return WordTales.Progress.toggle(word, add, occurrenceId); }
function updateMainCardStars(section) { return WordTales.Progress.refresh(section); }
var gameOverlay = null;
var gameDropzones = [];
var gameCards = [];
var gameDroppedCount = 0;
var floatCards = [];
var floatReq = null;
var CARD_W = 150;
var CARD_H = 80;
var gameFloatTop = 180;
var cachedDzRects = [];
var gameResizeHandler = null;
var _gameSection = null;

function updateDzRects() {
// 碰撞循环读取缓存矩形，只有开始和 resize 时才触发布局测量。
cachedDzRects = gameDropzones.map(function(dz){
return dz ? dz.getBoundingClientRect() : null;
});
gameFloatTop = cachedDzRects.reduce(function(maxBottom, rect){
return rect ? Math.max(maxBottom, rect.bottom + 16) : maxBottom;
}, 180);
}

function startGame(section, scope) {
/*
 * Game 为当前专栏克隆一组全屏卡片。克隆而不是搬移主卡片，可以让退出游戏
 * 成为纯清理操作，也避免破坏原页面的翻卡状态和布局。
 */
scope = scope === 'starred' ? 'starred' : 'all';
var allCards = Array.prototype.slice.call(section.querySelectorAll('.vocab-card'));
var cards = allCards.filter(function(card){
var vw = card.querySelector('.vw');
return scope === 'all' || (vw && isWordStarred(vw.textContent.trim(), card.dataset.vocabId));
});
if (allCards.length === 0) return;

_gameSection = section;

if (gameOverlay) {
endGame();
}

gameOverlay = document.createElement('div');
gameOverlay.className = 'game-overlay active';

var header = document.createElement('div');
header.className = 'game-header';
var title = document.createElement('div');
title.className = 'game-title';
var themeEl = section.querySelector('.theme');
title.textContent = themeEl ? themeEl.textContent : '词汇游戏';
var progress = document.createElement('div');
progress.className = 'game-progress';
progress.setAttribute('role', 'status');
progress.setAttribute('aria-live', 'polite');
progress.textContent = '已收集 0 / ' + cards.length;
var exitBtn = document.createElement('button');
exitBtn.type = 'button';
exitBtn.className = 'game-exit';
exitBtn.textContent = '退出游戏';
exitBtn.setAttribute('aria-label', '退出游戏模式');
exitBtn.addEventListener('click', endGame);
header.appendChild(title);
var scopeToggle = document.createElement('div');
scopeToggle.className = 'game-scope-toggle';
scopeToggle.setAttribute('role', 'group');
scopeToggle.setAttribute('aria-label', '游戏单词范围');
[['all','全部词'],['starred','生词']].forEach(function(option){
var scopeBtn = document.createElement('button');
scopeBtn.type = 'button';
scopeBtn.textContent = option[1];
scopeBtn.className = option[0] === scope ? 'active' : '';
scopeBtn.setAttribute('aria-pressed', option[0] === scope ? 'true' : 'false');
scopeBtn.addEventListener('click', function(){
if (option[0] === scope) return;
endGame();
startGame(section, option[0]);
});
scopeToggle.appendChild(scopeBtn);
});
header.appendChild(scopeToggle);
header.appendChild(progress);
header.appendChild(exitBtn);
gameOverlay.appendChild(header);

if (cards.length === 0) {
var emptyState = document.createElement('div');
emptyState.className = 'game-empty-state';
emptyState.innerHTML = '<strong>这个栏目还没有生词</strong><span>在单词学习中选择“没想起来”，或先用“全部词”进行分类。</span>';
gameOverlay.appendChild(emptyState);
document.body.appendChild(gameOverlay);
activateModal(gameOverlay, endGame, '词汇分类游戏');
return;
}

gameDropzones = [];
var dzFamiliar = document.createElement('div');
dzFamiliar.className = 'game-dropzone familiar empty';
dzFamiliar.setAttribute('role', 'group');
dzFamiliar.setAttribute('aria-label', '比较认识的单词');
var labelF = document.createElement('span');
labelF.className = 'game-zone-label';
labelF.textContent = '比较认识';
dzFamiliar.appendChild(labelF);
gameOverlay.appendChild(dzFamiliar);
gameDropzones.push(dzFamiliar);

var dzUnfamiliar = document.createElement('div');
dzUnfamiliar.className = 'game-dropzone unfamiliar empty';
dzUnfamiliar.setAttribute('role', 'group');
dzUnfamiliar.setAttribute('aria-label', '不太认识的单词');
var labelU = document.createElement('span');
labelU.className = 'game-zone-label';
labelU.textContent = '不太认识';
dzUnfamiliar.appendChild(labelU);
gameOverlay.appendChild(dzUnfamiliar);
gameDropzones.push(dzUnfamiliar);

document.body.appendChild(gameOverlay);
activateModal(gameOverlay, endGame, '词汇分类游戏');
updateDzRects();

gameCards = [];
gameDroppedCount = 0;
floatCards = [];
floatReq = null;
var placedPositions = [];

cards.forEach(function(card, idx){
var vw = card.querySelector('.vw');
var vp = card.querySelector('.vp');
var vm = card.querySelector('.vm');
if (!vw) return;

var gameCard = document.createElement('div');
gameCard.className = 'game-card floating';
gameCard.dataset.idx = idx;
gameCard.dataset.vocabId = card.dataset.vocabId || '';
gameCard.setAttribute('role', 'button');
gameCard.setAttribute('tabindex', '0');

var word = vw.textContent.trim();
gameCard.dataset.word = word;
gameCard.setAttribute('aria-label', word + '，按左方向键标记为比较认识，按右方向键标记为不太认识');

var inner = document.createElement('div');
inner.className = 'card-inner';
var front = document.createElement('div');
front.className = 'card-face card-front';
var frontWord = document.createElement('span');
frontWord.className = 'vw';
frontWord.textContent = vw.textContent;
front.appendChild(frontWord);
var back = document.createElement('div');
back.className = 'card-face card-back';
back.appendChild(vw.cloneNode(true));
if (vp) back.appendChild(vp.cloneNode(true));
if (vm) back.appendChild(vm.cloneNode(true));
inner.appendChild(front);
inner.appendChild(back);
gameCard.appendChild(inner);

if (isWordStarred(word, gameCard.dataset.vocabId)) {
var star = document.createElement('span');
star.className = 'game-star';
star.textContent = '\u2605';
gameCard.appendChild(star);
}

// 随机尝试不重叠起点；达到上限后允许重叠，避免小屏幕陷入无限寻找。
var cardW = CARD_W;
var cardH = CARD_H;
var maxAttempts = 50;
var startX, startY;
for (var attempt = 0; attempt < maxAttempts; attempt++) {
startX = 20 + Math.random() * Math.max(20, window.innerWidth - cardW - 40);
startY = gameFloatTop + Math.random() * Math.max(20, window.innerHeight - cardH - gameFloatTop - 20);
var overlap = false;
for (var j = 0; j < placedPositions.length; j++) {
var p = placedPositions[j];
if (Math.abs(startX - p.x) < cardW + 12 && Math.abs(startY - p.y) < cardH + 12) {
overlap = true;
break;
}
}
if (!overlap) break;
}
placedPositions.push({x:startX, y:startY});
gameCard.style.transform = 'translate3d(' + startX + 'px,' + startY + 'px,0)';

gameOverlay.appendChild(gameCard);
gameCards.push(gameCard);

makeFloatable(gameCard);
gameCard.addEventListener('keydown', function(e){
if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
e.preventDefault();
dropCard(gameCard, e.key === 'ArrowLeft' ? dzFamiliar : dzUnfamiliar);
} else if (gameCard.classList.contains('dropped') && (e.key === 'Enter' || e.key === ' ')) {
e.preventDefault();
gameCard.classList.toggle('flipped');
gameCard.setAttribute('aria-pressed', gameCard.classList.contains('flipped') ? 'true' : 'false');
}
});
});

updateDzRects();
startFloatLoop();
var _resizeTimer = null;
function _debouncedUpdateDzRects() {
if (_resizeTimer) clearTimeout(_resizeTimer);
_resizeTimer = setTimeout(updateDzRects, 150);
}
window.addEventListener('resize', _debouncedUpdateDzRects);
gameResizeHandler = _debouncedUpdateDzRects;
}

function startFloatLoop() {
/*
 * requestAnimationFrame 只更新 transform，不改布局属性；系统要求减少动态效果时
 * 完全跳过漂浮，拖拽和键盘分类仍保持可用。
 */
if (floatReq) cancelAnimationFrame(floatReq);
if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
floatCards = Array.prototype.slice.call(document.querySelectorAll('.game-card.floating'));
floatCards.forEach(function(card){
if (!card.floatState) {
var match = (card.style.transform || '').match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px/);
var left = match ? parseFloat(match[1]) : 0;
var top = match ? parseFloat(match[2]) : 0;
card.floatState = {
x: left,
y: top,
vx: (Math.random() - 0.5) * 1.2,
vy: (Math.random() - 0.5) * 1.2
};
}
});

function step() {
var w = window.innerWidth;
var h = window.innerHeight;
var dzList = cachedDzRects;
floatCards.forEach(function(card){
if (card.classList.contains('dragging') || card.classList.contains('dropped')) return;
var s = card.floatState;
s.x += s.vx;
s.y += s.vy;
if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx); }
if (s.x >= w - CARD_W) { s.x = w - CARD_W; s.vx = -Math.abs(s.vx); }
if (s.y <= gameFloatTop) { s.y = gameFloatTop; s.vy = Math.abs(s.vy); }
if (s.y >= h - CARD_H) { s.y = h - CARD_H; s.vy = -Math.abs(s.vy); }
dzList.forEach(function(dz){
// 漂浮卡把投放区视作障碍物，只有用户主动拖入时才会触发分类。
if (!dz) return;
if (s.x + CARD_W > dz.left && s.x < dz.right &&
s.y + CARD_H > dz.top && s.y < dz.bottom) {
if (s.vx > 0 && s.x + CARD_W > dz.left && s.x < dz.left) {
s.vx = -Math.abs(s.vx);
}
if (s.vx < 0 && s.x < dz.right && s.x + CARD_W > dz.right) {
s.vx = Math.abs(s.vx);
}
if (s.vy > 0 && s.y + CARD_H > dz.top && s.y < dz.top) {
s.vy = -Math.abs(s.vy);
}
if (s.vy < 0 && s.y < dz.bottom && s.y + CARD_H > dz.bottom) {
s.vy = Math.abs(s.vy);
}
}
});
card.style.transform = 'translate3d(' + s.x + 'px,' + s.y + 'px,0)';
});
floatReq = requestAnimationFrame(step);
}
floatReq = requestAnimationFrame(step);
}

function makeFloatable(card) {
// 指针事件生命周期绑在 document 上，拖出卡片边界后仍能收到 move/end。
var isDragging = false;
var startX, startY, offsetX, offsetY;
var originDz = null;
var dragMoved = false;
var DRAG_THRESHOLD = 8;

function getPos(e) {
if (e.touches && e.touches.length > 0) {
return {x: e.touches[0].clientX, y: e.touches[0].clientY};
}
return {x: e.clientX, y: e.clientY};
}

function onStart(e) {
isDragging = true;
dragMoved = false;
var rect = card.getBoundingClientRect();
var pos = getPos(e);
startX = pos.x;
startY = pos.y;
offsetX = rect.left;
offsetY = rect.top;
originDz = card.parentElement && card.parentElement.classList.contains('game-dropzone')
? card.parentElement
: null;
document.addEventListener('mousemove', onMove);
document.addEventListener('mouseup', onEnd);
document.addEventListener('touchmove', onMove, {passive: false});
document.addEventListener('touchend', onEnd);
}

function onMove(e) {
if (!isDragging) return;
var pos = getPos(e);
var deltaX = pos.x - startX;
var deltaY = pos.y - startY;
if (!dragMoved && Math.sqrt(deltaX * deltaX + deltaY * deltaY) < DRAG_THRESHOLD) {
return;
}
if (!dragMoved) {
dragMoved = true;
/*
 * 只有越过阈值才真正提起卡片。这样按下、轻微手抖再松开仍是一次点击，
 * 不会让框内卡片短暂消失或误触发重新分类。
 */
var currentRect = card.getBoundingClientRect();
offsetX = currentRect.left - deltaX;
offsetY = currentRect.top - deltaY;
card.classList.add('dragging');
card.classList.remove('floating');
if (originDz) {
releaseDropzoneCard(card, originDz);
gameOverlay.appendChild(card);
card.style.position = 'absolute';
}
}
var newX = offsetX + deltaX;
var newY = offsetY + deltaY;
card.style.transform = 'translate3d(' + newX + 'px,' + newY + 'px,0)';
if (card.floatState) {
card.floatState.x = newX;
card.floatState.y = newY;
}
e.preventDefault();
}

function onEnd(e) {
if (!isDragging) return;
isDragging = false;
card.classList.remove('dragging');
document.removeEventListener('mousemove', onMove);
document.removeEventListener('mouseup', onEnd);
document.removeEventListener('touchmove', onMove);
document.removeEventListener('touchend', onEnd);
if (!dragMoved) {
// 保留原 DOM 位置，让随后产生的 click 事件负责翻面。
originDz = null;
return;
}
var cardRect = card.getBoundingClientRect();
var targetDz = null;
// 松手时以矩形相交判定投放，不要求指针中心落在区域内，触屏更宽容。
gameDropzones.forEach(function(dz){
var dzRect = dz.getBoundingClientRect();
if (cardRect.left < dzRect.right && cardRect.right > dzRect.left &&
cardRect.top < dzRect.bottom && cardRect.bottom > dzRect.top) {
targetDz = dz;
}
});
if (targetDz) {
dropCard(card, targetDz, originDz);
} else if (originDz) {
// 从分类框拖出但没有命中另一框时回到原处，避免一次失手让卡片重新漂走。
dropCard(card, originDz, originDz);
} else {
card.classList.add('floating');
if (!card.floatState) {
card.floatState = {
x: offsetX,
y: offsetY,
vx: (Math.random() - 0.5) * 1.2,
vy: (Math.random() - 0.5) * 1.2
};
}
if (floatCards.indexOf(card) < 0) {
floatCards.push(card);
}
if (!floatReq) startFloatLoop();
}
card._suppressFlipUntil = dragMoved ? Date.now() + 500 : 0;
originDz = null;
}

card.addEventListener('mousedown', onStart);
card.addEventListener('touchstart', onStart, {passive: false});

card._cleanup = function() {
document.removeEventListener('mousemove', onMove);
document.removeEventListener('mouseup', onEnd);
document.removeEventListener('touchmove', onMove);
document.removeEventListener('touchend', onEnd);
};
}

function releaseDropzoneCard(card, dropzone) {
var parentDz = dropzone || card.parentElement;
if (!parentDz || !parentDz.classList.contains('game-dropzone')) return;
if (parentDz.currentCard === card) {
parentDz.currentCard = null;
}
if (card.parentElement === parentDz) card.remove();
if (!parentDz.querySelector('.game-card')) {
parentDz.classList.add('empty');
}
}

function dropCard(card, targetDz, sourceDz) {
/*
 * 每个投放区只展示最近一张卡；旧卡移除但其学习结果已持久化。
 * 已投放卡可以跨框改判；同框放回不重复记学习事件，也不增加收集计数。
 */
var previousClassification = card.dataset.classification || '';
var nextClassification = targetDz.classList.contains('unfamiliar') ? 'unfamiliar' : 'familiar';
var currentParent = card.parentElement && card.parentElement.classList.contains('game-dropzone')
? card.parentElement
: null;
if (targetDz.currentCard && targetDz.currentCard !== card) {
removeDroppedCard(targetDz.currentCard);
}
if (currentParent && currentParent !== targetDz) {
releaseDropzoneCard(card, currentParent);
}
if (sourceDz && sourceDz !== targetDz && sourceDz.currentCard === card) {
releaseDropzoneCard(card, sourceDz);
}
card.classList.remove('floating');
card.classList.add('dropped');
card.style.transform = '';
card.style.position = 'relative';
targetDz.classList.remove('empty');
targetDz.appendChild(card);
targetDz.currentCard = card;
var idx = floatCards.indexOf(card);
if (idx >= 0) floatCards.splice(idx, 1);

var word = card.dataset.word || '';
var isUnfamiliar = nextClassification === 'unfamiliar';
if (card.dataset.vocabId && previousClassification !== nextClassification) {
var trackMeta = {
columnId: _gameSection ? _gameSection.id : '',
occurrenceId: card.dataset.vocabId || ''
};
if (previousClassification) {
trackMeta.reclassifiedFrom = previousClassification === 'unfamiliar' ? 'unknown' : 'known';
}
WordTales.LearningProgress.trackWord(card.dataset.vocabId, isUnfamiliar ? 'unknown' : 'known', trackMeta);
}
card.dataset.classification = nextClassification;
card.setAttribute(
'aria-label',
word + '，当前为' + (isUnfamiliar ? '不太认识' : '比较认识') +
'；可拖到另一个框重新分类，按左方向键标记为比较认识，按右方向键标记为不太认识，按回车翻面'
);
if (isUnfamiliar) {
toggleStarWord(word, true, card.dataset.vocabId);
var existingStar = card.querySelector('.game-star');
if (!existingStar) {
var star = document.createElement('span');
star.className = 'game-star';
star.textContent = '\u2605';
card.appendChild(star);
}
} else {
toggleStarWord(word, false, card.dataset.vocabId);
var existingStar = card.querySelector('.game-star');
if (existingStar) existingStar.remove();
}
updateMainCardStars(_gameSection);

if (card._dropClickHandler) {
card.removeEventListener('click', card._dropClickHandler);
}
var handler = function(e){
e.stopPropagation();
if (card._suppressFlipUntil && Date.now() <= card._suppressFlipUntil) {
card._suppressFlipUntil = 0;
return;
}
card.classList.toggle('flipped');
card.setAttribute('aria-pressed', card.classList.contains('flipped') ? 'true' : 'false');
};
card._dropClickHandler = handler;
card.addEventListener('click', handler);
if (!previousClassification) {
gameDroppedCount++;
}
var progress = gameOverlay.querySelector('.game-progress');
if (progress) progress.textContent = '已收集 ' + gameDroppedCount + ' / ' + gameCards.length;
}

function removeDroppedCard(card) {
if (card._cleanup) card._cleanup();
if (card._dropClickHandler) card.removeEventListener('click', card._dropClickHandler);
var parentDz = card.parentElement;
card.remove();
if (parentDz) {
if (parentDz.currentCard === card) {
parentDz.currentCard = null;
}
if (!parentDz.querySelector('.game-card')) {
parentDz.classList.add('empty');
}
}
}

function endGame() {
// 退出时同时撤销 RAF、窗口监听和每张卡的 document 监听，防止后台继续运算。
if (floatReq) {
cancelAnimationFrame(floatReq);
floatReq = null;
}
window.removeEventListener('resize', gameResizeHandler);
gameResizeHandler = null;
if (gameOverlay) {
gameCards.forEach(function(card){
if (card._cleanup) card._cleanup();
});
gameOverlay.remove();
gameOverlay = null;
deactivateModal();
gameDropzones = [];
gameCards = [];
gameDroppedCount = 0;
floatCards = [];
cachedDzRects = [];
_gameSection = null;
}
}


function resolveSection(sectionOrId) {
return typeof sectionOrId === 'string' ? document.getElementById(sectionOrId) : sectionOrId;
}
WordTales.Game = {
start: function(sectionOrId) { startGame(resolveSection(sectionOrId)); },
end: endGame
};
})();

