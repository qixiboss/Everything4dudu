/* Starred-word copy practice for keyboard and touch input. */
(function () {
'use strict';
var activateModal = WordTales.FeatureModal.activate;
var deactivateModal = WordTales.FeatureModal.deactivate;
function isWordStarred(word, occurrenceId) { return WordTales.Progress.has(word, occurrenceId); }
var copyOverlay = null;
var copyWordList = [];
var copyIdx = 0;
var copyDrawing = false;
var copyLastX = 0;
var copyLastY = 0;
var copyOrientationHandler = null;
var copyCanvasResizeHandler = null;
var copyAdvanceTimer = null;

/*
 * CopyPractice 只练当前专栏的星标词，形成“游戏暴露薄弱项 → 定向抄写”的闭环。
 * 桌面端验证键盘拼写；触屏端提供 Canvas 自主手写，不做易误判的 OCR 判分。
 */
function isMobile() {
// 宽度用于普通手机，UA/触点判断覆盖横屏 iPad 和伪装成 Mac 的 iPadOS。
if (window.matchMedia('(max-width: 600px)').matches) return true;
var ua = navigator.userAgent;
if (/iPhone|iPod/i.test(ua)) return true;
if (/Android/i.test(ua) && /Mobile/i.test(ua)) return true;
if (/iPad/i.test(ua)) return true;
if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 0) return true;
return false;
}

var _copyCardMap = null;
var _copySection = null;

function buildCopyCardMap() {
// 释义缓存限定在本次专栏，避免同形词从其他专栏取到不同词性或含义。
var map = {};
if (!_copySection) return map;
_copySection.querySelectorAll('.vocab-card').forEach(function(card){
var vw = card.querySelector('.vw');
if (!vw) return;
var key = vw.textContent.trim().toLowerCase();
if (map[key]) return;
var vp = card.querySelector('.vp');
var vm = card.querySelector('.vm');
var pos = vp ? vp.textContent.trim() : '';
var meaning = vm ? vm.textContent.trim() : '';
map[key] = (pos && meaning) ? pos + ' ' + meaning : (meaning || pos || '');
});
return map;
}

function getWordMeaning(word) {
if (!_copyCardMap) _copyCardMap = buildCopyCardMap();
return _copyCardMap[word.toLowerCase()] || '';
}

function startCopy(section) {
_copyCardMap = null;
_copySection = section;
var sectionStarred = [];
if (section) {
section.querySelectorAll('.vocab-card').forEach(function(card){
var vw = card.querySelector('.vw');
if (vw && isWordStarred(vw.textContent.trim(), card.dataset.vocabId)) sectionStarred.push(vw.textContent.trim());
});
}
if (sectionStarred.length === 0) {
showCopyAlert(section);
return;
}
copyWordList = sectionStarred.slice();
shuffleArray(copyWordList);
copyIdx = 0;
if (isMobile()) {
startCopyMobile();
} else {
startCopyDesktop();
}
}

function showCopyAlert(section) {
// 空列表不是死路：直接提供进入同栏目游戏的行动入口。
var mask = document.createElement('div');
mask.className = 'copy-alert-mask';
var box = document.createElement('div');
box.className = 'copy-alert-box';
var icon = document.createElement('div');
icon.className = 'copy-alert-icon';
icon.textContent = '\u2B50';
var title = document.createElement('div');
title.className = 'copy-alert-title';
title.textContent = '还没有标记的单词';
var desc = document.createElement('div');
desc.className = 'copy-alert-desc';
desc.textContent = '当前列还没有标记的单词，去游戏模式中把不太认识的单词拖入"不太认识"框，标记五角星后再来抄写练习吧！';
var actions = document.createElement('div');
actions.className = 'copy-alert-actions';
var goGame = document.createElement('button');
goGame.type = 'button';
goGame.className = 'copy-alert-btn primary';
goGame.textContent = '去游戏标记';
goGame.addEventListener('click', function(){
deactivateModal();
mask.remove();
if (section) startGame(section);
});
var cancel = document.createElement('button');
cancel.type = 'button';
cancel.className = 'copy-alert-btn secondary';
cancel.textContent = '取消';
cancel.addEventListener('click', function(){ deactivateModal(); mask.remove(); });
actions.appendChild(goGame);
actions.appendChild(cancel);
box.appendChild(icon);
box.appendChild(title);
box.appendChild(desc);
box.appendChild(actions);
mask.appendChild(box);
document.body.appendChild(mask);
activateModal(mask, function(){ deactivateModal(); mask.remove(); }, '未标记单词提示');
}

function shuffleArray(arr) {
// 原地 Fisher–Yates，重新开始时打破固定顺序带来的位置记忆。
for (var i = arr.length - 1; i > 0; i--) {
var j = Math.floor(Math.random() * (i + 1));
var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
}
}

function buildCopyOverlay() {
// 桌面和移动练习共用标题、进度和退出区，只替换主体交互。
if (copyOverlay) { copyOverlay.remove(); copyOverlay = null; }
copyOverlay = document.createElement('div');
copyOverlay.className = 'copy-overlay active';

var header = document.createElement('div');
header.className = 'copy-header';
var title = document.createElement('div');
title.className = 'copy-title';
title.textContent = '抄写练习';
var progress = document.createElement('div');
progress.className = 'copy-progress';
progress.setAttribute('role', 'status');
progress.setAttribute('aria-live', 'polite');
progress.textContent = '1 / ' + copyWordList.length;
var exitBtn = document.createElement('button');
exitBtn.type = 'button';
exitBtn.className = 'copy-exit';
exitBtn.textContent = '退出';
exitBtn.setAttribute('aria-label', '退出抄写模式');
exitBtn.addEventListener('click', endCopy);
header.appendChild(title);
header.appendChild(progress);
header.appendChild(exitBtn);
copyOverlay.appendChild(header);
copyOverlay._progress = progress;
document.body.appendChild(copyOverlay);
return copyOverlay;
}

function startCopyDesktop() {
// 桌面模式大小写不敏感，但要求整词一致；错误只给即时视觉反馈，不自动泄露答案。
var overlay = buildCopyOverlay();
activateModal(overlay, endCopy, '抄写练习', function(){ return overlay._input; });

var wordDisplay = document.createElement('div');
wordDisplay.className = 'copy-word-display';
overlay.appendChild(wordDisplay);

var meaningDisplay = document.createElement('div');
meaningDisplay.className = 'copy-word-meaning';
overlay.appendChild(meaningDisplay);

var hint = document.createElement('div');
hint.className = 'copy-word-hint';
hint.textContent = '看着单词，在下方输入框中打出这个单词，按回车切换下一个';
overlay.appendChild(hint);

var input = document.createElement('input');
input.className = 'copy-input';
input.type = 'text';
input.setAttribute('autocapitalize', 'off');
input.setAttribute('autocomplete', 'off');
input.setAttribute('autocorrect', 'off');
input.setAttribute('spellcheck', 'false');
input.setAttribute('aria-label', '输入当前显示的英文单词');
hint.id = 'copyInputHint';
input.setAttribute('aria-describedby', 'copyInputHint');
overlay.appendChild(input);
overlay._input = input;
overlay._wordDisplay = wordDisplay;
overlay._meaningDisplay = meaningDisplay;

showCopyWord();

input.addEventListener('keydown', function(e){
if (e.key === 'Enter') {
e.preventDefault();
if (copyOverlay._completed) {
copyOverlay._completed = false;
var cc = copyOverlay.querySelector('.copy-complete');
if (cc) cc.remove();
copyIdx = 0;
shuffleArray(copyWordList);
showCopyWord();
return;
}
var typed = input.value.trim().toLowerCase();
var target = copyWordList[copyIdx].toLowerCase();
if (typed === target) {
if (copyAdvanceTimer) return;
input.classList.add('correct');
input.classList.remove('wrong');
input.disabled = true;
copyAdvanceTimer = setTimeout(function(){
copyAdvanceTimer = null;
if (!copyOverlay || copyOverlay._input !== input) return;
copyIdx++;
input.disabled = false;
if (copyIdx >= copyWordList.length) {
showCopyComplete(true);
} else {
showCopyWord();
}
input.classList.remove('correct');
}, 300);
} else {
input.classList.add('wrong');
setTimeout(function(){ input.classList.remove('wrong'); }, 300);
}
}
});

}

function showCopyWord() {
if (!copyOverlay) return;
var word = copyWordList[copyIdx];
copyOverlay._wordDisplay.textContent = word;
if (copyOverlay._meaningDisplay) {
copyOverlay._meaningDisplay.textContent = getWordMeaning(word);
}
copyOverlay._input.value = '';
copyOverlay._progress.textContent = (copyIdx + 1) + ' / ' + copyWordList.length;
copyOverlay._input.focus();
}

function startCopyMobile() {
// 画布需要横向空间，竖屏先展示旋转提示；方向变化时复用同一 modal 状态。
var overlay = buildCopyOverlay();

var rotateHint = document.createElement('div');
rotateHint.className = 'copy-rotate-hint';
var icon = document.createElement('div');
icon.className = 'rotate-icon';
icon.textContent = '🔄';
var p = document.createElement('p');
p.textContent = '请将手机横屏使用';
rotateHint.appendChild(icon);
rotateHint.appendChild(p);
var exitBtn = document.createElement('button');
exitBtn.type = 'button';
exitBtn.className = 'copy-exit';
exitBtn.textContent = '退出';
exitBtn.setAttribute('aria-label', '退出抄写模式');
exitBtn.addEventListener('click', endCopy);
rotateHint.appendChild(exitBtn);
document.body.appendChild(rotateHint);

function checkOrientation() {
var isPortrait = window.matchMedia('(orientation:portrait)').matches;
if (isPortrait) {
rotateHint.style.display = 'flex';
overlay.style.display = 'none';
activateModal(rotateHint, endCopy, '请将手机横屏使用');
} else {
rotateHint.style.display = 'none';
overlay.style.display = 'flex';
activateModal(overlay, endCopy, '手写抄写练习');
setupCanvas();
}
}

copyOrientationHandler = function() {
var _t = copyOrientationHandler._timer;
if (_t) clearTimeout(_t);
copyOrientationHandler._timer = setTimeout(checkOrientation, 200);
};
window.addEventListener('resize', copyOrientationHandler);
window.addEventListener('orientationchange', copyOrientationHandler);
checkOrientation();
}

function setupCanvas() {
// 方向监听可能多次触发，_canvasSetup 保证画布和监听器只创建一次。
if (!copyOverlay) return;
if (copyOverlay._canvasSetup) return;
copyOverlay._canvasSetup = true;

var canvasWrap = document.createElement('div');
canvasWrap.className = 'copy-canvas-wrap active';

var canvas = document.createElement('canvas');
canvas.id = 'copyCanvas';
canvas.setAttribute('role', 'region');
canvas.setAttribute('aria-label', '手写画板；键盘用户可使用“下一个”按钮继续练习');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvasWrap.appendChild(canvas);

var wordHint = document.createElement('div');
wordHint.className = 'copy-canvas-word';
canvasWrap.appendChild(wordHint);

var meaningHint = document.createElement('div');
meaningHint.className = 'copy-canvas-meaning';
canvasWrap.appendChild(meaningHint);

var nextBtn = document.createElement('button');
nextBtn.type = 'button';
nextBtn.className = 'copy-canvas-next';
nextBtn.textContent = '\u2192 下一个';
nextBtn.addEventListener('click', function(){
copyIdx++;
if (copyIdx >= copyWordList.length) {
showCopyComplete(false, copyCtx, canvas, wordHint, meaningHint);
} else {
copyCtx.clearRect(0, 0, canvas.width, canvas.height);
wordHint.textContent = copyWordList[copyIdx];
meaningHint.textContent = getWordMeaning(copyWordList[copyIdx]);
copyOverlay._progress.textContent = (copyIdx + 1) + ' / ' + copyWordList.length;
}
});
canvasWrap.appendChild(nextBtn);

copyOverlay.appendChild(canvasWrap);
copyOverlay._canvasWrap = canvasWrap;

var copyCtx = canvas.getContext('2d');
copyCtx.strokeStyle = '#1b5e72';
copyCtx.lineWidth = 3;
copyCtx.lineCap = 'round';
copyCtx.lineJoin = 'round';

wordHint.textContent = copyWordList[copyIdx];
meaningHint.textContent = getWordMeaning(copyWordList[copyIdx]);

function getPos(e) {
var rect = canvas.getBoundingClientRect();
if (e.touches && e.touches.length > 0) {
return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
}
return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function onStart(e) {
e.preventDefault();
copyDrawing = true;
var pos = getPos(e);
copyLastX = pos.x;
copyLastY = pos.y;
}

function onMove(e) {
if (!copyDrawing) return;
e.preventDefault();
var pos = getPos(e);
copyCtx.beginPath();
copyCtx.moveTo(copyLastX, copyLastY);
copyCtx.lineTo(pos.x, pos.y);
copyCtx.stroke();
copyLastX = pos.x;
copyLastY = pos.y;
}

function onEnd(e) {
e.preventDefault();
copyDrawing = false;
}

canvas.addEventListener('mousedown', onStart);
canvas.addEventListener('mousemove', onMove);
canvas.addEventListener('mouseup', onEnd);
canvas.addEventListener('mouseleave', onEnd);
canvas.addEventListener('touchstart', onStart, { passive: false });
canvas.addEventListener('touchmove', onMove, { passive: false });
canvas.addEventListener('touchend', onEnd, { passive: false });

canvas._copyListeners = [
{ type: 'mousedown', fn: onStart },
{ type: 'mousemove', fn: onMove },
{ type: 'mouseup', fn: onEnd },
{ type: 'mouseleave', fn: onEnd },
{ type: 'touchstart', fn: onStart, opts: { passive: false } },
{ type: 'touchmove', fn: onMove, opts: { passive: false } },
{ type: 'touchend', fn: onEnd, opts: { passive: false } }
];

copyCanvasResizeHandler = function() {
if (copyCanvasResizeHandler._timer) clearTimeout(copyCanvasResizeHandler._timer);
copyCanvasResizeHandler._timer = setTimeout(function() {
copyCanvasResizeHandler._timer = null;
if (!copyOverlay) return;
// 改 canvas 尺寸会清空位图；调整前暂存像素，尽可能保留用户尚未写完的笔迹。
var imgData = null;
try { imgData = copyCtx.getImageData(0, 0, canvas.width, canvas.height); } catch(e) {}
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
copyCtx.strokeStyle = '#1b5e72';
copyCtx.lineWidth = 3;
copyCtx.lineCap = 'round';
copyCtx.lineJoin = 'round';
if (imgData) {
try { copyCtx.putImageData(imgData, 0, 0); } catch(e) {}
}
}, 150);
};
window.addEventListener('resize', copyCanvasResizeHandler);
}

function showCopyComplete(isDesktop, copyCtx, canvas, wordHint, meaningHint) {
// 两种输入模式共享完成语义，但按各自最自然的方式提供“再来一次”。
if (!copyOverlay) return;
copyOverlay._completed = true;
var box = document.createElement('div');
box.className = 'copy-complete';
var title = document.createElement('div');
title.className = 'copy-complete-title';
title.textContent = '已完成所有不太认识的单词！';
var desc = document.createElement('div');
desc.className = 'copy-complete-desc';
box.appendChild(title);
box.appendChild(desc);
if (isDesktop) {
desc.textContent = '按回车再来一次，或点击右上角退出按钮退出抄写模式';
copyOverlay.appendChild(box);
copyOverlay._input.value = '';
copyOverlay._input.focus();
} else {
desc.textContent = '点击下方按钮再来一次，或点击右上角退出按钮退出抄写模式';
var restartBtn = document.createElement('button');
restartBtn.type = 'button';
restartBtn.className = 'copy-complete-btn';
restartBtn.textContent = '再来一次';
restartBtn.addEventListener('click', function(){
box.remove();
copyOverlay._completed = false;
copyIdx = 0;
shuffleArray(copyWordList);
copyCtx.clearRect(0, 0, canvas.width, canvas.height);
wordHint.textContent = copyWordList[copyIdx];
meaningHint.textContent = getWordMeaning(copyWordList[copyIdx]);
copyOverlay._progress.textContent = (copyIdx + 1) + ' / ' + copyWordList.length;
});
box.appendChild(restartBtn);
copyOverlay.appendChild(box);
}
}

function endCopy() {
// 显式移除窗口和 Canvas 监听，避免多次进入练习后事件成倍触发。
if (copyAdvanceTimer) {
clearTimeout(copyAdvanceTimer);
copyAdvanceTimer = null;
}
if (copyOrientationHandler) {
if (copyOrientationHandler._timer) {
clearTimeout(copyOrientationHandler._timer);
copyOrientationHandler._timer = null;
}
window.removeEventListener('resize', copyOrientationHandler);
window.removeEventListener('orientationchange', copyOrientationHandler);
copyOrientationHandler = null;
}
if (copyCanvasResizeHandler) {
if (copyCanvasResizeHandler._timer) {
clearTimeout(copyCanvasResizeHandler._timer);
copyCanvasResizeHandler._timer = null;
}
window.removeEventListener('resize', copyCanvasResizeHandler);
copyCanvasResizeHandler = null;
}
if (copyOverlay) {
var canvas = copyOverlay.querySelector('#copyCanvas');
if (canvas && canvas._copyListeners) {
canvas._copyListeners.forEach(function(item){
canvas.removeEventListener(item.type, item.fn, item.opts);
});
canvas._copyListeners = null;
}
copyOverlay.remove();
copyOverlay = null;
}
var rh = document.querySelector('.copy-rotate-hint');
if (rh) rh.remove();
deactivateModal();
copyWordList = [];
copyIdx = 0;
copyDrawing = false;
}



function resolveSection(sectionOrId) {
return typeof sectionOrId === 'string' ? document.getElementById(sectionOrId) : sectionOrId;
}
WordTales.CopyPractice = {
start: function(sectionOrId) { startCopy(resolveSection(sectionOrId)); },
end: endCopy
};
})();

