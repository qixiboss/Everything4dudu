/* ============================================================
 * Modules: Navigation / Reader / WordPopup / Progress / Game /
 *          CopyPractice / Analysis / Cards / App
 * 每个模块只暴露页面需要直接调用的函数，其余状态保留在闭包内。
 * ============================================================ */
WordTales.Features = (function() {
/*
 * 共享 modal 基础设施
 *
 * 游戏、抄写和旋转提示都需要相同的无障碍行为：背景 inert、焦点圈定、
 * Escape 关闭和退出后恢复焦点。集中管理可避免多个全屏功能叠加监听器。
 */
var _activeModal = null;
var _modalPreviousFocus = null;
var _modalClose = null;

function setPageInert(inert) {
document.querySelectorAll('body > header, body > nav, body > main, body > footer').forEach(function(el){
el.inert = inert;
if (inert) el.setAttribute('aria-hidden', 'true');
else el.removeAttribute('aria-hidden');
});
}

function getModalFocusables(container) {
return Array.prototype.filter.call(container.querySelectorAll('button, input, [href], [tabindex]:not([tabindex="-1"])'), function(el){
return !el.disabled && el.getClientRects().length > 0;
});
}

function handleModalKeydown(e) {
if (!_activeModal) return;
if (e.key === 'Escape') {
e.preventDefault();
if (_modalClose) _modalClose();
return;
}
if (e.key !== 'Tab') return;
// 手工构造焦点环，防止 Tab 离开无原生 <dialog> 的自定义遮罩。
var focusables = getModalFocusables(_activeModal);
if (focusables.length === 0) {
e.preventDefault();
_activeModal.focus();
return;
}
var first = focusables[0];
var last = focusables[focusables.length - 1];
if (e.shiftKey && document.activeElement === first) {
e.preventDefault();
last.focus();
} else if (!e.shiftKey && document.activeElement === last) {
e.preventDefault();
first.focus();
}
}

function activateModal(container, closeFn, label, initialFocus) {
if (!_activeModal) {
// 仅第一层 modal 隔离页面；横竖屏提示切到画板时会复用同一层状态。
_modalPreviousFocus = document.activeElement;
setPageInert(true);
document.addEventListener('keydown', handleModalKeydown);
}
_activeModal = container;
_modalClose = closeFn;
container.setAttribute('role', 'dialog');
container.setAttribute('aria-modal', 'true');
container.setAttribute('aria-label', label);
container.setAttribute('tabindex', '-1');
setTimeout(function(){
if (_activeModal !== container || !container.isConnected) return;
var preferredFocus = typeof initialFocus === 'function' ? initialFocus() : initialFocus;
if (preferredFocus && container.contains(preferredFocus) && !preferredFocus.disabled && preferredFocus.getClientRects().length > 0) {
preferredFocus.focus();
return;
}
var focusables = getModalFocusables(container);
(focusables[0] || container).focus();
}, 0);
}

function deactivateModal() {
document.removeEventListener('keydown', handleModalKeydown);
setPageInert(false);
var previous = _modalPreviousFocus;
_activeModal = null;
_modalPreviousFocus = null;
_modalClose = null;
if (previous && typeof previous.focus === 'function') previous.focus();
}

function initSetFeatures(root) {
// 各初始化器都具备幂等保护，因此切回已访问词集不会重复绑定事件。
if (!root) return;
initFlipCards(root);
initFlipToggles(root);
initParaFlip(root);
initReadAloud(root);
initWordJump(root);
}

function switchSet(setId, btn) {
/*
 * 切换前先终止朗读和弹层，再改变 active/inert 状态。这样隐藏词集里不会
 * 残留语音、高亮或可被键盘聚焦的控件。目录始终从 Data 重建以保持一致。
 */
closeWordPopups();
_clearReadTimer();
if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
if (currentBlock) unwrapWords(currentBlock);
resetReadButtons();
document.querySelectorAll('.set-content').forEach(function(el){ el.classList.remove('active'); });
document.querySelectorAll('.set-content').forEach(function(el){
el.setAttribute('aria-hidden', 'true');
el.inert = true;
});
document.querySelectorAll('.set-btn').forEach(function(b){
b.classList.remove('active');
b.setAttribute('aria-pressed', 'false');
});
if(btn) {
btn.classList.add('active');
btn.setAttribute('aria-pressed', 'true');
}
var nav = document.getElementById('toc');
nav.innerHTML = '';
if (setId === 'changelog') {
// 更新日志没有 column 数据，因此走独立元信息分支，但仍复用 set-content 容器。
var activeSet = document.getElementById('changelog');
if (!activeSet) return;
activeSet.classList.add('active');
activeSet.setAttribute('aria-hidden', 'false');
activeSet.inert = false;
document.getElementById('setMeta').textContent = '第八份 · 更新日志';
} else {
var setData = WordTales.Data.getSet(setId) || WordTales.Data.sets[0];
if (!setData) return;
setId = setData.id;
var activeSet = document.getElementById(setId);
if (!activeSet) return;
initSetFeatures(activeSet);
activeSet.classList.add('active');
activeSet.setAttribute('aria-hidden', 'false');
activeSet.inert = false;
setData.columns.forEach(function(column){
var a = document.createElement('a');
a.href = '#' + column.id;
a.textContent = column.title;
nav.appendChild(a);
});
document.getElementById('setMeta').textContent = WordTales.Data.getMeta(setData);
}
}

var currentBtn = null;
var currentBlock = null;
var readCancelled = false;
var _currentClosePopup = null;
var _wordPopupOwnerId = 0;
var _readTimer = null;
var _currentAudio = null;
var _audioRaf = null;
var _audioRunId = 0;
var _readRate = 1;
var _readPaused = false;
var _floatingReadControls = null;

/*
 * Reader 的共享状态保证任意时刻只有一条朗读链：
 * - 录音优先使用 audio + cues 获得稳定音色和逐词同步；
 * - 缺少录音或加载失败时退回 SpeechSynthesis；
 * - runId / readCancelled 让旧异步回调在切换或停止后自动失效。
 */
function _clearReadTimer() {
if (_readTimer) { clearTimeout(_readTimer); _readTimer = null; }
}

function createRateSelect(className) {
// 页面内和悬浮控制条使用同一速率状态，任一选择器改变都会同步另一处。
var select = document.createElement('select');
select.className = 'read-rate-select' + (className ? ' ' + className : '');
select.setAttribute('aria-label', '朗读倍速');
[1, 1.1, 1.2, 1.3, 1.4, 1.5].forEach(function(rate){
var option = document.createElement('option');
option.value = String(rate);
option.textContent = 'x' + rate.toFixed(1);
select.appendChild(option);
});
select.value = String(_readRate);
select.addEventListener('change', function(){
setReadRate(Number(select.value));
});
return select;
}

function setReadRate(rate) {
// 白名单限制 UI 和外部调用只能使用经过版面测试的倍速。
if (![1, 1.1, 1.2, 1.3, 1.4, 1.5].some(function(value){ return Math.abs(value - rate) < 0.001; })) {
rate = 1;
}
_readRate = rate;
document.querySelectorAll('.read-rate-select').forEach(function(select){
select.value = String(rate);
});
if (_currentAudio) _currentAudio.playbackRate = rate;
}

function getCurrentReadingTitle() {
var section = currentBlock && currentBlock.closest('.column-section');
var heading = section && section.querySelector('.section-head h2');
return heading ? heading.textContent.trim() : '短文朗读';
}

function updateFloatingReadControls() {
if (!_floatingReadControls) return;
var pauseBtn = _floatingReadControls.querySelector('.read-floating-pause');
var title = _floatingReadControls.querySelector('.read-floating-title');
if (pauseBtn) {
pauseBtn.textContent = _readPaused ? '继续' : '暂停';
pauseBtn.setAttribute('aria-label', _readPaused ? '继续朗读' : '暂停朗读');
}
if (title) title.textContent = getCurrentReadingTitle();
}

function showFloatingReadControls() {
if (!_floatingReadControls) return;
_floatingReadControls.hidden = false;
updateFloatingReadControls();
}

function hideFloatingReadControls() {
_readPaused = false;
if (_floatingReadControls) _floatingReadControls.hidden = true;
}

function stopCurrentReading() {
// 所有停止入口最终汇聚到同一清理路径，避免音频停了但 token 包装仍留在 DOM。
var activeBlock = currentBlock;
readCancelled = true;
_clearReadTimer();
if (typeof window.speechSynthesis !== 'undefined') window.speechSynthesis.cancel();
stopRecordedAudio();
if (activeBlock) unwrapWords(activeBlock);
resetReadButtons();
}

function toggleReadPause() {
// Audio 与 SpeechSynthesis API 不同，但在这里统一成相同的暂停按钮语义。
if (!currentBtn || readCancelled) return;
_readPaused = !_readPaused;
if (_currentAudio) {
if (_readPaused) {
_currentAudio.pause();
} else {
var playPromise = _currentAudio.play();
if (playPromise && typeof playPromise.catch === 'function') {
playPromise.catch(function(){ stopCurrentReading(); });
}
}
} else if (typeof window.speechSynthesis !== 'undefined') {
if (_readPaused) window.speechSynthesis.pause();
else window.speechSynthesis.resume();
}
updateFloatingReadControls();
var status = currentBlock && currentBlock.querySelector('.read-status');
if (status && _readPaused) status.textContent = '朗读已暂停 · x' + _readRate.toFixed(1);
else if (status) status.textContent = '朗读中 · x' + _readRate.toFixed(1);
}

function initFloatingReadControls() {
// 控件挂到 body 而非文章内部，长文滚动时仍可暂停或停止。
if (_floatingReadControls) return;
var controls = document.createElement('div');
controls.className = 'read-floating-controls';
controls.hidden = true;
controls.setAttribute('role', 'region');
controls.setAttribute('aria-label', '朗读控制');

var title = document.createElement('span');
title.className = 'read-floating-title';
controls.appendChild(title);

var rateLabel = document.createElement('label');
rateLabel.className = 'read-rate-label';
var rateText = document.createElement('span');
rateText.textContent = '倍速';
rateLabel.appendChild(rateText);
rateLabel.appendChild(createRateSelect('read-floating-rate'));
controls.appendChild(rateLabel);

var pauseBtn = document.createElement('button');
pauseBtn.type = 'button';
pauseBtn.className = 'read-floating-btn read-floating-pause';
pauseBtn.textContent = '暂停';
pauseBtn.addEventListener('click', toggleReadPause);
controls.appendChild(pauseBtn);

var stopBtn = document.createElement('button');
stopBtn.type = 'button';
stopBtn.className = 'read-floating-btn stop';
stopBtn.textContent = '停止';
stopBtn.addEventListener('click', stopCurrentReading);
controls.appendChild(stopBtn);

document.body.appendChild(controls);
_floatingReadControls = controls;
}

function stopRecordedAudio() {
// 递增 runId 会令旧 requestAnimationFrame 回调失效，即使浏览器稍后才执行它。
_audioRunId++;
if (_audioRaf !== null) {
cancelAnimationFrame(_audioRaf);
_audioRaf = null;
}
if (_currentAudio) {
_currentAudio.pause();
try { _currentAudio.currentTime = 0; } catch (e) {}
_currentAudio.removeAttribute('src');
_currentAudio.load();
_currentAudio = null;
}
}

function closeWordPopups() {
if (_currentClosePopup) {
document.removeEventListener('click', _currentClosePopup);
_currentClosePopup = null;
}
document.querySelectorAll('.word-popup').forEach(function(popup){
var wordId = popup.dataset.ownerWordId;
var owner = wordId ? document.getElementById(wordId) : null;
if (owner) owner.setAttribute('aria-expanded', 'false');
popup.remove();
});
}

function resetReadButtons() {
// reset 是 Reader 的状态归零点；调用者无需知道当前走的是录音还是系统语音。
readCancelled = true;
_clearReadTimer();
stopRecordedAudio();
document.querySelectorAll('.read-btn').forEach(function(b){
b.textContent = '朗读';
b.classList.remove('reading');
});
var pbar = document.querySelector('.read-progress-wrap');
if (pbar) pbar.remove();
var status = document.querySelector('.read-status');
if (status) status.remove();
clearHighlight();
hideFloatingReadControls();
currentBtn = null;
currentBlock = null;
}

function clearHighlight() {
document.querySelectorAll('.reading-highlight').forEach(function(el){
el.classList.remove('reading-highlight');
});
}

function unwrapWords(block) {
// 朗读结束后恢复原始文本节点，避免重复朗读不断嵌套 span.tok。
block.querySelectorAll('span.tok').forEach(function(span){
var parent = span.parentNode;
parent.replaceChild(document.createTextNode(span.textContent), span);
});
block.querySelectorAll('p').forEach(function(p){ p.normalize(); });
}

function wrapWords(paragraphs) {
/*
 * 在不破坏 <strong class="word"> 等语义节点的前提下，只拆文本节点。
 * 每个 token 保存全文字符区间，供 SpeechSynthesis 的 charIndex 二分定位。
 */
var tokens = [];
var fullText = '';
var ctx = { tokens: tokens, fullText: fullText };
paragraphs.forEach(function(p, paraIdx){
var walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, {
acceptNode: function(node){
return node.parentElement && node.parentElement.closest('button') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
}
});
var textNodes = [];
var node;
while (node = walker.nextNode()) textNodes.push(node);
textNodes.forEach(function(textNode){
var text = textNode.textContent;
var parts = text.split(/(\s+)/);
var frag = document.createDocumentFragment();
parts.forEach(function(part){
if (part === '') return;
if (/^\s+$/.test(part)) {
frag.appendChild(document.createTextNode(part));
fullText += part;
} else {
var span = document.createElement('span');
span.className = 'tok';
span.textContent = part;
frag.appendChild(span);
tokens.push({ el: span, start: fullText.length, end: fullText.length + part.length, index: tokens.length });
fullText += part;
}
});
textNode.parentNode.replaceChild(frag, textNode);
});
if (paraIdx < paragraphs.length - 1) fullText += ' ';
});
return { tokens: tokens, fullText: fullText };
}

var cachedVoices = [];

function loadVoices() {
if (typeof speechSynthesis === 'undefined') return [];
var v = speechSynthesis.getVoices();
if (v.length > 0) cachedVoices = v;
return cachedVoices;
}

if (typeof speechSynthesis !== 'undefined') {
loadVoices();
speechSynthesis.onvoiceschanged = function(){
loadVoices();
};
}

var ACCENT_KEY = 'wordtales.accent';

function getAccent() {
// 口音偏好只认 us/uk，其余取值一律按美音处理，避免坏数据破坏朗读。
var value = null;
try { value = localStorage.getItem(ACCENT_KEY); } catch (e) {}
return value === 'uk' ? 'uk' : 'us';
}

function setAccent(accent) {
accent = accent === 'uk' ? 'uk' : 'us';
try { localStorage.setItem(ACCENT_KEY, accent); } catch (e) {}
return accent;
}

function pickBestVoice(voices, accent) {
/*
 * 先按口音过滤出 en-GB/en-US 语音池，再在池内按名称顺序表选自然音色，
 * 最后逐级降级到 neural/premium、口音语音、任意英文。口音池为空时回退
 * 到全部英文语音，保证任何平台都能出声。
 */
if (!voices || voices.length === 0) voices = loadVoices();
if (!voices || voices.length === 0) return null;
if (accent !== 'uk' && accent !== 'us') accent = getAccent();

var enVoices = voices.filter(function(v){
return v.lang && v.lang.indexOf('en') === 0;
});
if (enVoices.length === 0) return null;

var preferredLang = accent === 'uk' ? 'en-GB' : 'en-US';
var pool = enVoices.filter(function(v){ return v.lang === preferredLang; });
if (pool.length === 0) pool = enVoices;

var tiers = accent === 'uk'
? [
['Google UK English Female', 'Google UK English Male'],
['Microsoft Libby', 'Microsoft Sonia', 'Microsoft Ryan', 'Microsoft George'],
['Daniel', 'Serena'],
['Hazel']
]
: [
['Samantha'],
['Google US English', 'Google UK English Female', 'Google UK English Male'],
['Microsoft Aria', 'Microsoft Jenny', 'Microsoft Zira', 'Microsoft Guy', 'Microsoft Davis'],
['Sandy','Shelley','Reed','Eddy','Flo','Daniel','Karen','Tessa','Moira','Fiona'],
['Microsoft David', 'Microsoft Mark']
];

for (var i = 0; i < tiers.length; i++) {
for (var j = 0; j < tiers[i].length; j++) {
var match = pool.find(function(v){
return v.name.indexOf(tiers[i][j]) >= 0;
});
if (match) return match;
}
}

var neuralMatch = pool.find(function(v){
return v.name.toLowerCase().indexOf('neural') >= 0 ||
v.name.toLowerCase().indexOf('premium') >= 0 ||
v.name.toLowerCase().indexOf('enhanced') >= 0;
});
if (neuralMatch) return neuralMatch;

var langMatch = enVoices.find(function(v){ return v.lang === preferredLang; });
if (langMatch) return langMatch;

return enVoices[0];
}

function toggleSpeechRead(block, btn) {
// SpeechSynthesis 是无录音专栏与录音失败时的完整降级路径。
if (typeof window.speechSynthesis === 'undefined' || typeof window.SpeechSynthesisUtterance === 'undefined') {
btn.textContent = '暂不支持朗读';
btn.disabled = true;
btn.setAttribute('aria-disabled', 'true');
return;
}
if (currentBtn === btn && !readCancelled) {
stopCurrentReading();
return;
}
var previousBlock = currentBlock;
window.speechSynthesis.cancel();
if (previousBlock) unwrapWords(previousBlock);
resetReadButtons();

closeWordPopups();

var paragraphs = block.querySelectorAll('p');
var result = wrapWords(paragraphs);
var totalLen = result.fullText.length;
var tokenCount = result.tokens.length;

var progressBar = document.createElement('div');
progressBar.className = 'read-progress-wrap';
var progressFill = document.createElement('div');
progressFill.className = 'read-progress-bar';
progressBar.appendChild(progressFill);
block.querySelector('.essay-head').after(progressBar);

var statusLabel = document.createElement('div');
statusLabel.className = 'read-status';
statusLabel.setAttribute('role', 'status');
statusLabel.setAttribute('aria-live', 'polite');
statusLabel.textContent = '准备朗读…';
progressBar.after(statusLabel);

var voices = loadVoices();
var bestVoice = pickBestVoice(voices, getAccent());

if (!bestVoice) {
btn.textContent = '朗读';
btn.classList.add('reading');
statusLabel.textContent = '当前环境不支持语音朗读，请用 Chrome/Safari 等浏览器打开';
statusLabel.style.color = '#c0392b';
setTimeout(function(){
if (!readCancelled) {
progressBar.remove();
statusLabel.remove();
btn.textContent = '朗读';
btn.classList.remove('reading');
}
}, 4000);
return;
}

/*
 * 按句号确定语气、再按逗号切短句。短 utterance 的 boundary 事件通常更稳定，
 * 也能在分句间加入自然停顿，但必须保存全局字符偏移以继续高亮原文。
 */
var chunks = [];
var sentences = result.fullText.match(/[^.!?]+[.!?]*/g) || [result.fullText];
var sentOffset = 0;
sentences.forEach(function(sent, sIdx){
var trimmed = sent.trim();
var sentStart = result.fullText.indexOf(trimmed, sentOffset);
sentOffset = sentStart + trimmed.length;
var sentType = 'statement';
var lastChar = trimmed.charAt(trimmed.length - 1);
if (lastChar === '?') sentType = 'question';
else if (lastChar === '!') sentType = 'exclaim';

var clauses = trimmed.split(/,\s+/);
var clauseOffset = sentStart;
clauses.forEach(function(clause, cIdx){
var clauseTrimmed = clause.trim();
if (!clauseTrimmed) return;
var clauseStart = result.fullText.indexOf(clauseTrimmed, clauseOffset);
if (clauseStart < 0) clauseStart = clauseOffset;
clauseOffset = clauseStart + clauseTrimmed.length;
var isLast = (cIdx === clauses.length - 1);
chunks.push({
text: clauseTrimmed,
start: clauseStart,
type: sentType,
isLastClause: isLast,
clauseIdx: cIdx,
totalClauses: clauses.length
});
});
});

function findTokenByGlobalChar(globalChar) {
// token 区间按字符位置有序，二分查询避免每个 boundary 都线性扫描整篇文章。
var lo = 0, hi = result.tokens.length - 1;
while (lo <= hi) {
var mid = (lo + hi) >> 1;
var t = result.tokens[mid];
if (globalChar < t.start) hi = mid - 1;
else if (globalChar >= t.end) lo = mid + 1;
else return t;
}
return null;
}

var chunkIdx = 0;

var PROSODY = {
QUESTION_PITCH: 1.15, QUESTION_RATE: 0.90,
EXCLAIM_PITCH: 1.10, EXCLAIM_RATE: 0.98,
STATEMENT_PITCH: 1.0, STATEMENT_RATE: 0.95,
NON_LAST_PITCH_BOOST: 0.04, NON_LAST_RATE_BOOST: 0.02,
LAST_PITCH_DROP: 0.03, LAST_RATE_DROP: 0.02,
LONG_SENTENCE_RATE_DROP: 0.04,
SHORT_SENTENCE_RATE_BOOST: 0.04, SHORT_SENTENCE_PITCH_BOOST: 0.03,
LONG_WORD_THRESHOLD: 12, SHORT_WORD_THRESHOLD: 5,
PITCH_MIN: 0.85, PITCH_MAX: 1.25,
RATE_MIN: 0.80, RATE_MAX: 1.05
};

function getProsody(chunk) {
// 标点、分句位置和句长共同微调语速音高，最后钳制到浏览器表现稳定的范围。
var pitch = PROSODY.STATEMENT_PITCH;
var rate = PROSODY.STATEMENT_RATE;
var wordCount = chunk.text.split(/\s+/).length;

if (chunk.type === 'question') {
pitch = PROSODY.QUESTION_PITCH;
rate = PROSODY.QUESTION_RATE;
} else if (chunk.type === 'exclaim') {
pitch = PROSODY.EXCLAIM_PITCH;
rate = PROSODY.EXCLAIM_RATE;
}

if (!chunk.isLastClause) {
pitch += PROSODY.NON_LAST_PITCH_BOOST;
rate += PROSODY.NON_LAST_RATE_BOOST;
} else {
pitch -= PROSODY.LAST_PITCH_DROP;
rate -= PROSODY.LAST_RATE_DROP;
}

if (wordCount > PROSODY.LONG_WORD_THRESHOLD) {
rate -= PROSODY.LONG_SENTENCE_RATE_DROP;
} else if (wordCount < PROSODY.SHORT_WORD_THRESHOLD) {
rate += PROSODY.SHORT_SENTENCE_RATE_BOOST;
pitch += PROSODY.SHORT_SENTENCE_PITCH_BOOST;
}

pitch = Math.max(PROSODY.PITCH_MIN, Math.min(PROSODY.PITCH_MAX, pitch));
rate = Math.max(PROSODY.RATE_MIN, Math.min(PROSODY.RATE_MAX, rate));

return { pitch: pitch, rate: rate };
}

function speakNext() {
// 一个 chunk 完成后才创建下一个 utterance，使取消、暂停和分句停顿都可控。
if (readCancelled) return;
if (chunkIdx >= chunks.length) {
btn.textContent = '朗读';
btn.classList.remove('reading');
progressFill.style.width = '100%';
statusLabel.textContent = '朗读完毕 · 共 ' + tokenCount + ' 词';
clearHighlight();
hideFloatingReadControls();
_readTimer = setTimeout(function(){
if (!readCancelled) {
progressBar.remove();
statusLabel.remove();
unwrapWords(block);
}
}, 2000);
currentBtn = null;
currentBlock = null;
return;
}

var chunk = chunks[chunkIdx];
var prosody = getProsody(chunk);
var displayText = chunk.text;
var punct = '';
var lastChar = chunk.text.charAt(chunk.text.length - 1);
if (lastChar !== '.' && lastChar !== '?' && lastChar !== '!' && chunk.isLastClause) {
if (chunk.type === 'question') punct = '?';
else if (chunk.type === 'exclaim') punct = '!';
else punct = '.';
}
var speakText = chunk.text + (punct ? punct : '');

var utterance = new SpeechSynthesisUtterance(speakText);
utterance.lang = getAccent() === 'uk' ? 'en-GB' : 'en-US';
utterance.rate = prosody.rate * _readRate;
utterance.pitch = prosody.pitch;
utterance.volume = 1.0;
if (bestVoice) utterance.voice = bestVoice;

var thisChunkStart = chunk.start;

var scrollRaf = null;
utterance.onboundary = function(e){
clearHighlight();
var globalChar = thisChunkStart + e.charIndex;
var token = findTokenByGlobalChar(globalChar);
if (!token) {
token = findTokenByGlobalChar(globalChar - 1) || findTokenByGlobalChar(globalChar + 1);
}
if (token) {
token.el.classList.add('reading-highlight');
var wordIdx = token.index + 1;
var pct = Math.round((token.end / totalLen) * 100);
progressFill.style.width = pct + '%';
statusLabel.textContent = '朗读中 · 第 ' + wordIdx + ' / ' + tokenCount + ' 词 · ' + pct + '%';
if (!scrollRaf) {
var scrollTarget = token.el;
scrollRaf = requestAnimationFrame(function(){
scrollRaf = null;
var rect = scrollTarget.getBoundingClientRect();
if (rect.top < 80 || rect.bottom > window.innerHeight - 40) {
scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
});
}
}
};

utterance.onend = function(){
if (readCancelled) return;
chunkIdx++;
var delay = 0;
if (chunkIdx < chunks.length) {
var nextChunk = chunks[chunkIdx];
if (nextChunk.clauseIdx === 0) {
var prevType = chunk.type;
if (prevType === 'question') delay = 500;
else if (prevType === 'exclaim') delay = 450;
else delay = 400;
} else {
delay = 120;
}
}
if (delay > 0) {
_readTimer = setTimeout(speakNext, delay);
} else {
speakNext();
}
};

utterance.onerror = function(){
if (readCancelled) return;
readCancelled = true;
_clearReadTimer();
speechSynthesis.cancel();
btn.textContent = '朗读';
btn.classList.remove('reading');
progressBar.remove();
statusLabel.remove();
clearHighlight();
unwrapWords(block);
hideFloatingReadControls();
currentBtn = null;
currentBlock = null;
};

speechSynthesis.speak(utterance);
}

currentBtn = btn;
currentBlock = block;
readCancelled = false;
_readPaused = false;
_clearReadTimer();
btn.textContent = '停止';
btn.classList.add('reading');
statusLabel.textContent = '朗读中 · ' + (bestVoice ? bestVoice.name : '默认') + ' 语音';
showFloatingReadControls();
_readTimer = setTimeout(speakNext, 200);
}

function getRecordedAudioConfig(block) {
// 专栏 ID 是 DOM 与 Data 的连接点；audio 缺省即表示该列应使用系统语音。
var section = block && block.closest('.column-section');
if (!section || !WordTales.Data.getColumn) return null;
var column = WordTales.Data.getColumn(section.id);
return column && column.audio ? column.audio : null;
}

function toggleRecordedRead(block, btn, audioConfig) {
/*
 * 录音模式仍复用 wrapWords 生成的 token，只把“当前读到哪里”的来源
 * 从 boundary.charIndex 换成 audio.currentTime → cue。
 */
if (currentBtn === btn && !readCancelled) {
stopCurrentReading();
return;
}

var previousBlock = currentBlock;
if (typeof window.speechSynthesis !== 'undefined') window.speechSynthesis.cancel();
if (previousBlock) unwrapWords(previousBlock);
resetReadButtons();
closeWordPopups();

var paragraphs = block.querySelectorAll('p');
var result = wrapWords(paragraphs);
var tokenCount = result.tokens.length;
var cues = Array.isArray(audioConfig.cues) ? audioConfig.cues : [];

function fallBackToSpeech(message) {
// 降级前完全拆除录音态，再走正常 Speech 路径，避免两套播放状态并存。
if (readCancelled) return;
readCancelled = true;
stopRecordedAudio();
if (progressBar && progressBar.parentNode) progressBar.remove();
if (statusLabel && statusLabel.parentNode) statusLabel.remove();
clearHighlight();
unwrapWords(block);
currentBtn = null;
currentBlock = null;
toggleSpeechRead(block, btn);
var fallbackStatus = block.querySelector('.read-status');
if (fallbackStatus && message) {
fallbackStatus.textContent = message + '，已切换系统语音';
}
}

if (cues.length !== tokenCount || typeof window.Audio === 'undefined') {
readCancelled = false;
fallBackToSpeech('录音时间轴不可用');
return;
}

var validCues = [];
cues.forEach(function(cue, index){
// null cue 保留 token 位置但不参与二分时间搜索，适合未读出的标点或省略词。
if (!Array.isArray(cue) || cue.length !== 2) return;
validCues.push({ index: index, start: cue[0], end: cue[1] });
});

var progressBar = document.createElement('div');
progressBar.className = 'read-progress-wrap';
var progressFill = document.createElement('div');
progressFill.className = 'read-progress-bar';
progressBar.appendChild(progressFill);
block.querySelector('.essay-head').after(progressBar);

var statusLabel = document.createElement('div');
statusLabel.className = 'read-status';
statusLabel.setAttribute('role', 'status');
statusLabel.setAttribute('aria-live', 'polite');
statusLabel.textContent = '正在加载录音…';
progressBar.after(statusLabel);

var audio = new Audio(audioConfig.src);
audio.preload = 'auto';
audio.playbackRate = _readRate;
var runId = ++_audioRunId;
var activeTokenIndex = -1;
var lastPercent = -1;
var fallingBack = false;
_currentAudio = audio;
currentBtn = btn;
currentBlock = block;
readCancelled = false;
_readPaused = false;
btn.textContent = '停止';
btn.classList.add('reading');
showFloatingReadControls();

function findCueAt(time) {
// cue 按开始时间排序；先找最后一个 start<=time，再确认仍处于结束时间内。
var lo = 0;
var hi = validCues.length - 1;
var candidate = -1;
while (lo <= hi) {
var mid = (lo + hi) >> 1;
if (validCues[mid].start <= time) {
candidate = mid;
lo = mid + 1;
} else {
hi = mid - 1;
}
}
if (candidate < 0) return null;
var cue = validCues[candidate];
return time <= cue.end + 0.02 ? cue : null;
}

function updateRecordedProgress() {
// 用动画帧驱动视觉同步，比 timeupdate 的低频事件更适合逐词高亮。
if (readCancelled || runId !== _audioRunId || _currentAudio !== audio) return;
var duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
var percent = duration ? Math.min(100, Math.round((audio.currentTime / duration) * 100)) : 0;
progressFill.style.width = percent + '%';

var cue = findCueAt(audio.currentTime);
var nextTokenIndex = cue ? cue.index : -1;
var tokenChanged = nextTokenIndex !== activeTokenIndex;
if (tokenChanged) {
clearHighlight();
activeTokenIndex = nextTokenIndex;
if (activeTokenIndex >= 0) {
var token = result.tokens[activeTokenIndex];
token.el.classList.add('reading-highlight');
var rect = token.el.getBoundingClientRect();
if (rect.top < 80 || rect.bottom > window.innerHeight - 40) {
token.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
}
}

if (percent !== lastPercent || tokenChanged) {
lastPercent = percent;
if (activeTokenIndex >= 0) {
statusLabel.textContent = '录音朗读中 · x' + _readRate.toFixed(1) + ' · 第 ' + (activeTokenIndex + 1) + ' / ' + tokenCount + ' 词 · ' + percent + '%';
} else {
statusLabel.textContent = '录音朗读中 · x' + _readRate.toFixed(1) + ' · ' + percent + '%';
}
}
_audioRaf = requestAnimationFrame(updateRecordedProgress);
}

function handleAudioFailure() {
// error 与 play() rejection 可能同时到达，fallingBack 保证只降级一次。
if (fallingBack || readCancelled || runId !== _audioRunId) return;
fallingBack = true;
fallBackToSpeech('录音加载失败');
}

audio.addEventListener('playing', function(){
if (runId !== _audioRunId) return;
_readPaused = false;
lastPercent = -1;
updateFloatingReadControls();
statusLabel.textContent = '录音朗读中 · x' + _readRate.toFixed(1);
if (_audioRaf === null) _audioRaf = requestAnimationFrame(updateRecordedProgress);
});
audio.addEventListener('pause', function(){
if (runId !== _audioRunId || readCancelled || audio.ended) return;
_readPaused = true;
updateFloatingReadControls();
statusLabel.textContent = '朗读已暂停 · x' + _readRate.toFixed(1);
});
audio.addEventListener('waiting', function(){
if (runId === _audioRunId) statusLabel.textContent = '录音缓冲中…';
});
audio.addEventListener('error', handleAudioFailure);
audio.addEventListener('ended', function(){
if (readCancelled || runId !== _audioRunId) return;
if (_audioRaf !== null) {
cancelAnimationFrame(_audioRaf);
_audioRaf = null;
}
_currentAudio = null;
progressFill.style.width = '100%';
btn.textContent = '朗读';
btn.classList.remove('reading');
statusLabel.textContent = '朗读完毕 · 共 ' + tokenCount + ' 词';
clearHighlight();
hideFloatingReadControls();
currentBtn = null;
_readTimer = setTimeout(function(){
if (!readCancelled) {
progressBar.remove();
statusLabel.remove();
unwrapWords(block);
currentBlock = null;
}
}, 2000);
});

var playPromise = audio.play();
if (playPromise && typeof playPromise.catch === 'function') {
playPromise.catch(handleAudioFailure);
}
}

function toggleRead(block, btn) {
// 录音元数据存在即优先录音；内部任何校验/加载失败都会无缝退回系统语音。
var audioConfig = getRecordedAudioConfig(block);
if (audioConfig) {
toggleRecordedRead(block, btn, audioConfig);
} else {
toggleSpeechRead(block, btn);
}
}

function initReadAloud(root) {
// 按需增强 Renderer 产出的 h3；essay-head 也是重复初始化的幂等标记。
initFloatingReadControls();
(root || document).querySelectorAll('.essay-block').forEach(function(block){
if (block.querySelector('.essay-head')) return;
var h3 = block.querySelector('h3');
if (!h3) return;
var head = document.createElement('div');
head.className = 'essay-head';
head.appendChild(h3.cloneNode(true));
h3.remove();
var btn = document.createElement('button');
btn.type = 'button';
btn.className = 'read-btn';
btn.textContent = '朗读';
btn.addEventListener('click', function(){ toggleRead(block, btn); });
var controls = document.createElement('div');
controls.className = 'read-controls';
var rateLabel = document.createElement('label');
rateLabel.className = 'read-rate-label';
var rateText = document.createElement('span');
rateText.textContent = '倍速';
rateLabel.appendChild(rateText);
rateLabel.appendChild(createRateSelect());
controls.appendChild(rateLabel);
controls.appendChild(btn);
head.appendChild(controls);
block.insertBefore(head, block.firstChild);
});
}

function speakWord(word) {
// 单词点读会取消当前系统语音，避免单词发音与全文 TTS 同时说话。
if (typeof speechSynthesis === 'undefined') return;
speechSynthesis.cancel();
var utterance = new SpeechSynthesisUtterance(word);
var accent = getAccent();
utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US';
utterance.rate = 0.9;
utterance.pitch = 1.0;
var voices = loadVoices();
var bestVoice = pickBestVoice(voices, accent);
if (bestVoice) utterance.voice = bestVoice;
speechSynthesis.speak(utterance);
}

function initWordJump(root) {
/*
 * WordPopup 优先用稳定的 data-vocab-id 查 Data；cardMap 和模糊文本匹配只为
 * 兼容旧手写 DOM。弹层挂到 body，可避开文章翻转与 overflow 的裁切上下文。
 */
(root || document).querySelectorAll('.essay-block').forEach(function(block){
var section = block.closest('.column-section');
if (!section) return;
var grid = section.querySelector('.vocab-grid');
if (!grid) return;
var cards = grid.querySelectorAll('.vocab-card');
var cardMap = {};
cards.forEach(function(card){
var w = card.querySelector('.vw');
if (w) {
var key = w.textContent.trim().toLowerCase();
if (!cardMap[key]) {
var vp = card.querySelector('.vp');
var vm = card.querySelector('.vm');
cardMap[key] = {
word: w.textContent.trim(),
pos: vp ? vp.textContent.trim() : '',
meaning: vm ? vm.textContent.trim() : ''
};
}
}
});
block.querySelectorAll('strong.word').forEach(function(wordEl){
if (wordEl.dataset.popupInitialized === 'true') return;
wordEl.dataset.popupInitialized = 'true';
if (!wordEl.id) wordEl.id = 'word-popup-owner-' + (++_wordPopupOwnerId);
wordEl.setAttribute('role', 'button');
wordEl.setAttribute('tabindex', '0');
wordEl.setAttribute('aria-expanded', 'false');
wordEl.setAttribute('aria-label', wordEl.textContent.trim() + '，查看释义并朗读');
wordEl.addEventListener('click', function(e){
e.stopPropagation();
var word = wordEl.textContent.trim().toLowerCase();
var info = WordTales.Data.getWord(wordEl.dataset.vocabId) || cardMap[word];
if (!info) {
for (var k in cardMap) {
if (k.indexOf(word) >= 0 || word.indexOf(k) >= 0) {
info = cardMap[k];
break;
}
}
}
if (!info) return;
WordTales.LearningProgress.trackWord(wordEl.dataset.vocabId, 'click', {
paragraphId: wordEl.closest('p') ? wordEl.closest('p').dataset.paragraphId : '',
occurrenceId: wordEl.dataset.vocabId
});
document.querySelectorAll('.word-popup').forEach(function(p){
var owner = p.dataset.ownerWordId ? document.getElementById(p.dataset.ownerWordId) : null;
if (owner) owner.setAttribute('aria-expanded', 'false');
p.remove();
});
var popup = document.createElement('div');
popup.className = 'word-popup';
popup.setAttribute('role', 'status');
popup.setAttribute('aria-live', 'polite');
popup.dataset.ownerWordId = wordEl.id;
var pw = document.createElement('div');
pw.className = 'pw';
pw.textContent = info.word;
popup.appendChild(pw);
if (info.pos || info.meaning) {
var line = document.createElement('div');
if (info.pos) {
var pp = document.createElement('span');
pp.className = 'pp';
pp.textContent = info.pos;
line.appendChild(pp);
}
if (info.meaning) {
var pm = document.createElement('span');
pm.className = 'pm';
pm.textContent = info.meaning;
line.appendChild(pm);
}
popup.appendChild(line);
}
popup.addEventListener('click', function(ev){ ev.stopPropagation(); });
popup.style.visibility = 'hidden';
popup.style.animation = 'none';
document.body.appendChild(popup);
// 先不可见地测量真实尺寸，再在上下可用空间中选择更宽裕的一侧并钳制到视口。
var wordRect = wordEl.getBoundingClientRect();
var popupRect = popup.getBoundingClientRect();
var viewportGap = 8;
var popupGap = 6;
var left = wordRect.left + (wordRect.width - popupRect.width) / 2;
left = Math.max(viewportGap, Math.min(left, window.innerWidth - popupRect.width - viewportGap));
var roomBelow = window.innerHeight - wordRect.bottom - popupGap - viewportGap;
var roomAbove = wordRect.top - popupGap - viewportGap;
var placeAbove = popupRect.height > roomBelow && roomAbove > roomBelow;
var top = placeAbove
? Math.max(viewportGap, wordRect.top - popupRect.height - popupGap)
: Math.min(wordRect.bottom + popupGap, window.innerHeight - popupRect.height - viewportGap);
popup.style.left = Math.round(left) + 'px';
popup.style.top = Math.round(Math.max(viewportGap, top)) + 'px';
popup.style.visibility = '';
popup.style.animation = '';
wordEl.setAttribute('aria-expanded', 'true');
speakWord(info.word);
if (_currentClosePopup) {
document.removeEventListener('click', _currentClosePopup);
_currentClosePopup = null;
}
var closePopup = function(ev){
if (!popup.contains(ev.target) && ev.target !== wordEl) {
popup.remove();
wordEl.setAttribute('aria-expanded', 'false');
document.removeEventListener('click', closePopup);
_currentClosePopup = null;
}
};
_currentClosePopup = closePopup;
document.addEventListener('click', closePopup);
});
wordEl.addEventListener('keydown', function(e){
if (e.key === 'Enter' || e.key === ' ') {
e.preventDefault();
wordEl.click();
} else if (e.key === 'Escape') {
closeWordPopups();
wordEl.setAttribute('aria-expanded', 'false');
}
});
});
});
}

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

function getStarredWords() {
if (!WordTales.LearningProgress) return [];
return WordTales.LearningProgress.getStarredEntryIds().map(function(id){
var entry = WordTales.Data.getEntry(id);
return entry ? entry.word : '';
}).filter(Boolean);
}

function setStarredWords(arr) {
var selected = (arr || []).map(function(word){ return String(word).toLowerCase(); });
WordTales.Data.getAllEntries().forEach(function(entry){
WordTales.LearningProgress.setStarred(entry.id, selected.indexOf(entry.word.toLowerCase()) >= 0, 'compatibility');
});
}

function toggleStarWord(word, add, occurrenceId) {
if (occurrenceId) {
WordTales.LearningProgress.setStarred(occurrenceId, add, add ? 'manual' : '');
return;
}
WordTales.Data.getAllEntries().forEach(function(entry){
if (entry.word.toLowerCase() === String(word).toLowerCase()) WordTales.LearningProgress.setStarred(entry.id, add, add ? 'manual' : '');
});
}

function isWordStarred(word, occurrenceId) {
if (occurrenceId) {
var record = WordTales.LearningProgress.getEntryState(occurrenceId);
return !!(record && record.isStarred);
}
return getStarredWords().some(function(value){ return value.toLowerCase() === String(word).toLowerCase(); });
}

function updateMainCardStars(section) {
// 游戏或词卡修改星标后立即镜像到主词卡；学习档案才是唯一事实来源。
(section || document).querySelectorAll('.vocab-card').forEach(function(card){
var vw = card.querySelector('.vw');
if (!vw) return;
setCardStarState(card, isWordStarred(vw.textContent.trim(), card.dataset.vocabId));
});
updateColumnCompletionButtons(section || document);
}

function setColumnCompletionButtonState(button, completed) {
if (!button) return;
button.textContent = completed ? '已完成' : '今日完成';
button.classList.toggle('is-completed', completed);
button.setAttribute('aria-pressed', completed ? 'true' : 'false');
button.setAttribute('aria-label', completed ? '已完成今天的学习，点击取消' : '标记今天完成学习');
button.title = completed ? '已完成今天的学习，点击取消' : '标记今天完成学习';
}

function updateColumnCompletionButtons(root) {
var progress = WordTales.LearningProgress;
if (!progress || !progress.isReady || !progress.isReady() || !progress.getDayKey) return;
var dateKey = progress.getDayKey(new Date());
(root || document).querySelectorAll('.column-complete-btn').forEach(function(button) {
if (button.disabled || !button.dataset.columnId) return;
setColumnCompletionButtonState(button, progress.isColumnCompleted(button.dataset.columnId, dateKey));
});
}

function setCardStarState(card, starred) {
var star = card.querySelector('.vocab-card-star');
if (!star) return;
if (starred) star.classList.add('is-starred');
else star.classList.remove('is-starred');
star.setAttribute('aria-pressed', starred ? 'true' : 'false');
star.setAttribute('aria-label', starred ? '已标记为不太认识，点击取消标记' : '标记为不太认识');
star.title = starred ? '已标记为不太认识，点击取消标记' : '标记为不太认识';
}

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


function initParaFlip(root) {
/*
 * Analysis 把原 essay-block 增强为前后两面：正面保留整篇文章，背面只渲染
 * 用户所选段落。返回时保存段落和按钮引用，以恢复滚动位置及键盘焦点。
 */
(root || document).querySelectorAll('.essay-block').forEach(function(block){
if (block.querySelector('.essay-inner')) return;
var inner = document.createElement('div');
inner.className = 'essay-inner';
var front = document.createElement('div');
front.className = 'essay-face';
var back = document.createElement('div');
back.className = 'essay-back';
var essayHead = block.querySelector('.essay-head');
if (essayHead) {
block.removeChild(essayHead);
}
while (block.firstChild) {
front.appendChild(block.firstChild);
}
inner.appendChild(front);
inner.appendChild(back);
block.appendChild(inner);
if (essayHead) block.insertBefore(essayHead, inner);

block.querySelectorAll('p').forEach(function(p, idx){
var btn = document.createElement('button');
btn.type = 'button';
btn.className = 'para-btn';
btn.textContent = '解析';
btn.addEventListener('click', function(e){
e.stopPropagation();
var paraEl = block.querySelectorAll('.essay-face p')[idx];
if (paraEl && paraEl.dataset.paragraphId) {
WordTales.LearningProgress.trackAnalysis(paraEl.dataset.paragraphId);
}
block._scrollReturnPara = paraEl;
block._scrollReturnButton = btn;
showAnalysis(block, back, idx);
block.classList.add('flipped');
front.setAttribute('aria-hidden', 'true');
back.setAttribute('aria-hidden', 'false');
setTimeout(function(){
var top = block.getBoundingClientRect().top + window.pageYOffset - 80;
window.scrollTo({ top: top, behavior:'smooth' });
returnBtn.focus();
}, 650);
});
var lastText = p.lastChild;
while (lastText && lastText.nodeType !== 3) {
lastText = lastText.previousSibling;
}
if (lastText && lastText.nodeType === 3) {
p.appendChild(btn);
} else {
p.appendChild(btn);
}
});

var returnBtn = document.createElement('button');
returnBtn.type = 'button';
returnBtn.className = 'return-btn';
returnBtn.textContent = '← 返回短文';
returnBtn.addEventListener('click', function(e){
e.stopPropagation();
var targetPara = block._scrollReturnPara;
var targetButton = block._scrollReturnButton;
block._scrollReturnPara = null;
block._scrollReturnButton = null;
block.classList.remove('flipped');
front.setAttribute('aria-hidden', 'false');
back.setAttribute('aria-hidden', 'true');
if (targetPara) {
setTimeout(function(){
var top = targetPara.getBoundingClientRect().top + window.pageYOffset - 80;
window.scrollTo({ top: top, behavior:'smooth' });
if (targetButton) targetButton.focus();
}, 650);
}
});
back.appendChild(returnBtn);
back.setAttribute('aria-hidden', 'true');
});
}

function showAnalysis(block, backEl, paraIdx) {
closeWordPopups();
var paragraphs = block.querySelectorAll('.essay-face p');
var paragraphId = paragraphs[paraIdx] ? paragraphs[paraIdx].dataset.paragraphId : '';
var paragraphData = WordTales.Data.getParagraph(paragraphId);
var data = paragraphData ? paragraphData.analysis : null;

while (backEl.children.length > 1) {
backEl.removeChild(backEl.lastChild);
}

var srcDiv = document.createElement('div');
srcDiv.className = 'analysis-src';
// 从结构化 segments 重建原文，避免把正面按钮文字或朗读 token 混进解析标题。
if (paragraphData && paragraphData.segments) {
paragraphData.segments.forEach(function(segment){
if (typeof segment === 'string') {
srcDiv.appendChild(document.createTextNode(segment));
} else {
var emphasizedWord = document.createElement('strong');
emphasizedWord.className = 'analysis-word';
emphasizedWord.textContent = segment.text;
srcDiv.appendChild(emphasizedWord);
}
});
} else {
srcDiv.textContent = paragraphs[paraIdx] ? paragraphs[paraIdx].textContent.replace('解析','').trim() : '';
}
backEl.appendChild(srcDiv);

if (data) {
var transDiv = document.createElement('div');
transDiv.className = 'analysis-trans';
var label = document.createElement('span');
label.className = 'label';
label.textContent = '翻译：';
transDiv.appendChild(label);
transDiv.appendChild(document.createTextNode(data.translation));
backEl.appendChild(transDiv);
var list = document.createElement('ol');
list.className = 'analysis-list';
data.points.forEach(function(pt){
var li = document.createElement('li');
var temp = document.createElement('div');
temp.textContent = pt;
/*
 * 先把整条说明转义，再只恢复精确的 <span class="keyword"> 白名单。
 * 数据可保留重点标记，同时不会开放任意 HTML 注入能力。
 */
var safe = temp.innerHTML
.replace(/&lt;span class="keyword"&gt;/g, '<span class="keyword">')
.replace(/&lt;\/span&gt;/g, '</span>');
li.innerHTML = safe;
list.appendChild(li);
});
backEl.appendChild(list);
} else {
var loading = document.createElement('div');
loading.style.cssText = 'color:var(--muted);font-size:.85rem;padding:1rem 0';
loading.textContent = '该段落解析内容待生成';
backEl.appendChild(loading);
}
}

function initFlipCards(root) {
/*
 * Cards 把 Renderer 的三段静态文字改造成可访问的 3D 双面卡。
 * clone 后清空原节点，确保视觉前后面各自独立且重复初始化不会再次嵌套。
 */
(root || document).querySelectorAll('.vocab-card').forEach(function(card){
if (card.querySelector('.card-inner')) return;
var vw = card.querySelector('.vw');
var vp = card.querySelector('.vp');
var vm = card.querySelector('.vm');
var star = card.querySelector('.vocab-card-star');
if (!vw) return;
var inner = document.createElement('div');
inner.className = 'card-inner';
var front = document.createElement('div');
front.className = 'card-face card-front';
front.appendChild(vw.cloneNode(true));
var back = document.createElement('div');
back.className = 'card-face card-back';
back.appendChild(vw.cloneNode(true));
if (vp) back.appendChild(vp.cloneNode(true));
if (vm) {
var line = document.createElement('div');
line.appendChild(vm.cloneNode(true));
back.appendChild(line);
}
while (card.firstChild) card.removeChild(card.firstChild);
inner.appendChild(front);
inner.appendChild(back);
// 星标放在 DOM 的第一个位置：Tab 会先聚焦右上角标记，再进入翻卡控件。
if (star) card.appendChild(star);
card.appendChild(inner);
// 翻转控件放在 card-inner，避免外层“按钮”再嵌套星标按钮。
inner.setAttribute('role', 'button');
inner.setAttribute('tabindex', '0');
inner.setAttribute('aria-pressed', 'false');
inner.setAttribute('aria-label', vw.textContent.trim() + '，单词卡片，按回车或空格键翻转');
function toggleCard() {
// 每次人为翻面都算一次接触；批量显示模式只改 DOM，不污染个人学习记录。
card.classList.toggle('flipped');
inner.setAttribute('aria-pressed', card.classList.contains('flipped') ? 'true' : 'false');
if (card.dataset.vocabId) {
WordTales.LearningProgress.trackWord(card.dataset.vocabId, 'card', {
columnId: card.closest('.column-section') ? card.closest('.column-section').id : '',
occurrenceId: card.dataset.vocabId
});
}
}
inner.addEventListener('click', function(e){
toggleCard();
});
inner.addEventListener('keydown', function(e){
if (e.key === 'Enter' || e.key === ' ') {
e.preventDefault();
toggleCard();
}
});
if (star) {
setCardStarState(card, isWordStarred(vw.textContent.trim(), card.dataset.vocabId));
star.addEventListener('click', function(e){
// 星标点击不能触发外层卡片翻面。
e.preventDefault();
e.stopPropagation();
var starred = !isWordStarred(vw.textContent.trim(), card.dataset.vocabId);
WordTales.LearningProgress.setStarred(card.dataset.vocabId, starred, starred ? 'manual' : '');
setCardStarState(card, starred);
});
star.addEventListener('keydown', function(e){
// Enter/Space 在按钮上只操作星标，不交给外层词卡的翻转快捷键。
e.stopPropagation();
});
}
});
}

function initFlipToggles(root) {
/*
 * “英文 / 自定义 / 释义”是专栏级显示策略：
 * 英文和释义统一全部卡面；自定义保留每张卡现状，便于逐词自测。
 */
(root || document).querySelectorAll('.column-section').forEach(function(section){
var head = section.querySelector('.section-head');
if (!head) return;
if (head.querySelector('.flip-toggle')) return;
var toggle = document.createElement('div');
toggle.className = 'flip-toggle';
var btnEn = document.createElement('button');
btnEn.type = 'button';
btnEn.textContent = '英文';
btnEn.dataset.mode = 'front';
var btnCustom = document.createElement('button');
btnCustom.type = 'button';
btnCustom.textContent = '自定义';
btnCustom.dataset.mode = 'custom';
btnCustom.classList.add('active');
var btnCn = document.createElement('button');
btnCn.type = 'button';
btnCn.textContent = '释义';
btnCn.dataset.mode = 'back';
toggle.appendChild(btnEn);
toggle.appendChild(btnCustom);
toggle.appendChild(btnCn);
head.appendChild(toggle);
toggle.setAttribute('role', 'group');
toggle.setAttribute('aria-label', '词卡显示方式');
toggle.querySelectorAll('button').forEach(function(button){
button.setAttribute('aria-pressed', button.classList.contains('active') ? 'true' : 'false');
});
toggle.querySelectorAll('button').forEach(function(btn){
btn.addEventListener('click', function(){
toggle.querySelectorAll('button').forEach(function(b){
b.classList.remove('active');
b.setAttribute('aria-pressed', 'false');
});
btn.classList.add('active');
btn.setAttribute('aria-pressed', 'true');
var mode = btn.dataset.mode;
var cards = section.querySelectorAll('.vocab-card');
if (mode === 'front') {
cards.forEach(function(c){
c.classList.remove('flipped');
var flipControl = c.querySelector('.card-inner');
if (flipControl) flipControl.setAttribute('aria-pressed', 'false');
});
} else if (mode === 'back') {
cards.forEach(function(c){
c.classList.add('flipped');
var flipControl = c.querySelector('.card-inner');
if (flipControl) flipControl.setAttribute('aria-pressed', 'true');
});
}
});
});
var completionButton = document.createElement('button');
completionButton.type = 'button';
completionButton.className = 'column-complete-btn';
completionButton.dataset.columnId = section.id;
completionButton.setAttribute('aria-live', 'off');
var completionStatus = document.createElement('span');
completionStatus.className = 'column-complete-status visually-hidden';
completionStatus.setAttribute('role', 'status');
completionStatus.setAttribute('aria-live', 'polite');
head.appendChild(completionButton);
head.appendChild(completionStatus);

function completionDateKey() {
var progress = WordTales.LearningProgress;
if (progress && progress.getDayKey) return progress.getDayKey(new Date());
var today = new Date();
return today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);
}
function updateCompletionButton(completed) {
setColumnCompletionButtonState(completionButton, completed);
}
function announceCompletion(message, error) {
completionStatus.textContent = message;
completionStatus.classList.toggle('is-error', !!error);
}
function saveCompletion() {
var progress = WordTales.LearningProgress;
var dateKey = completionDateKey();
if (!progress || !progress.isReady || !progress.isReady()) {
announceCompletion('学习记录尚未准备好，请稍后重试', true);
return;
}
var requested = !progress.isColumnCompleted(section.id, dateKey);
var restoreFocus = document.activeElement === completionButton;
completionButton.disabled = true;
completionButton.classList.add('is-saving');
completionButton.setAttribute('aria-busy', 'true');
announceCompletion('正在保存今天的学习记录');
progress.setColumnCompleted(section.id, dateKey, requested).then(function(result) {
var completed = !!result.completed;
updateCompletionButton(completed);
if (result.saved) {
announceCompletion(completed ? '已记录今天完成' : '已取消今天的完成记录');
} else {
announceCompletion('学习记录保存失败，请重试', true);
}
if (restoreFocus && completionButton.isConnected) completionButton.focus();
}).catch(function() {
updateCompletionButton(progress.isColumnCompleted(section.id, dateKey));
announceCompletion('学习记录保存失败，请重试', true);
if (restoreFocus && completionButton.isConnected) completionButton.focus();
}).then(function() {
completionButton.disabled = false;
completionButton.classList.remove('is-saving');
completionButton.removeAttribute('aria-busy');
});
}
updateCompletionButton(WordTales.LearningProgress && WordTales.LearningProgress.isColumnCompleted
? WordTales.LearningProgress.isColumnCompleted(section.id, completionDateKey()) : false);
completionButton.addEventListener('click', saveCompletion);
var gameBtn = document.createElement('button');
gameBtn.type = 'button';
gameBtn.className = 'game-btn';
gameBtn.textContent = '游戏';
gameBtn.addEventListener('click', function(){
startGame(section);
});
head.appendChild(gameBtn);
var copyBtn = document.createElement('button');
copyBtn.type = 'button';
copyBtn.className = 'game-btn';
copyBtn.textContent = '抄写';
copyBtn.addEventListener('click', function(){
startCopy(section);
});
head.appendChild(copyBtn);
});
}

function init() {
/*
 * App 是唯一启动入口：先渲染，再根据 URL hash 激活正确词集并初始化该词集功能，
 * 最后恢复星标与异步学习档案。hashchange 复用同一路径以支持深链接和浏览器历史。
 */
WordTales.Renderer.render();
document.querySelectorAll('.set-btn').forEach(function(btn){
btn.addEventListener('click', function(){ WordTales.Navigation.switchSet(btn.dataset.set, btn); });
});
function switchToHash() {
var targetId = '';
try {
targetId = window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : '';
} catch (e) {
targetId = window.location.hash.slice(1);
}
if (targetId === 'study') {
// 已发布的旧链接仍可打开，但不再保留已移除的背词路由。
try {
window.history.replaceState(null, '', window.location.href.split('#')[0] + '#library');
} catch (e) {
window.location.hash = 'library';
return;
}
targetId = '';
}
if (targetId === 'library') targetId = '';
if (targetId === 'changelog') {
var changelogBtn = document.querySelector('.set-btn[data-set="changelog"]');
WordTales.Navigation.switchSet('changelog', changelogBtn);
return;
}
// hash 可以指向词集或专栏；先反查所属词集，切换后再滚动到具体专栏。
var targetSet = null;
WordTales.Data.sets.some(function(set){
var containsTarget = set.id === targetId || set.columns.some(function(column){ return column.id === targetId; });
if (containsTarget) targetSet = set;
return containsTarget;
});
if (!targetSet) targetSet = WordTales.Data.sets[0];
if (!targetSet) return;
var targetButton = null;
document.querySelectorAll('.set-btn').forEach(function(button){
if (button.dataset.set === targetSet.id) targetButton = button;
});
WordTales.Navigation.switchSet(targetSet.id, targetButton);
if (targetId && document.getElementById(targetId)) {
requestAnimationFrame(function(){
document.getElementById(targetId).scrollIntoView({ block: 'start' });
});
}
}
WordTales.Auth.init().then(function(){
return WordTales.CloudSync.init();
}).then(function(){
return WordTales.LearningProgress.init();
}).then(function(){
WordTales.StudyRecord.init();
WordTales.Progress.refresh();
window.addEventListener('hashchange', switchToHash);
switchToHash();
return WordTales.CloudSync.connectProfile();
});
}

function resolveSection(sectionOrId) {
return typeof sectionOrId === 'string' ? document.getElementById(sectionOrId) : sectionOrId;
}

function stopReading() {
// 对外 API 不暴露内部播放类型，调用方只需请求“停止当前朗读”。
if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
if (currentBlock) unwrapWords(currentBlock);
resetReadButtons();
}

/*
 * 公共表面刻意保持很小：外部代码只能调用稳定入口，临时 DOM、计时器和
 * 动画状态都留在闭包内，减少单文件全局命名冲突。
 */
return {
Navigation: { switchSet: switchSet },
Reader: { init: initReadAloud, toggle: toggleRead, stop: stopReading, speakWord: speakWord, getAccent: getAccent, setAccent: setAccent },
WordPopup: { init: initWordJump, close: closeWordPopups },
Progress: { list: getStarredWords, save: setStarredWords, toggle: toggleStarWord, has: isWordStarred, refresh: updateMainCardStars },
Game: { start: function(sectionOrId) { startGame(resolveSection(sectionOrId)); }, end: endGame },
CopyPractice: { start: function(sectionOrId) { startCopy(resolveSection(sectionOrId)); }, end: endCopy },
Analysis: { init: initParaFlip, show: showAnalysis },
Cards: { init: initFlipCards, initToolbar: initFlipToggles },
App: { init: init }
};
})();

WordTales.Navigation = WordTales.Features.Navigation;
WordTales.Reader = WordTales.Features.Reader;
WordTales.WordPopup = WordTales.Features.WordPopup;
WordTales.Progress = WordTales.Features.Progress;
WordTales.Game = WordTales.Features.Game;
WordTales.CopyPractice = WordTales.Features.CopyPractice;
WordTales.Analysis = WordTales.Features.Analysis;
WordTales.Cards = WordTales.Features.Cards;
WordTales.App = WordTales.Features.App;

document.addEventListener('DOMContentLoaded', WordTales.App.init);
