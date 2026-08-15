/* Reading playback and word-popup interactions. */
(function () {
'use strict';
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


function stopReading() {
if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
if (currentBlock) unwrapWords(currentBlock);
resetReadButtons();
}
WordTales.Reader = {
init: initReadAloud,
toggle: toggleRead,
stop: stopReading,
speakWord: speakWord,
getAccent: getAccent,
setAccent: setAccent
};
WordTales.WordPopup = { init: initWordJump, close: closeWordPopups };
})();

