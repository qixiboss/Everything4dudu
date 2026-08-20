/* Paragraph analysis, cards and per-column controls. */
(function () {
'use strict';
var setCardStarState = WordTales.FeatureProgress.setCardStarState;
var setColumnCompletionButtonState = WordTales.FeatureProgress.setColumnCompletionButtonState;
function isWordStarred(word, occurrenceId) { return WordTales.Progress.has(word, occurrenceId); }
function startGame(section) { return WordTales.Game.start(section); }
function startCopy(section) { return WordTales.CopyPractice.start(section); }
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
/*
 * closeWordPopups 只在 Reader 的闭包内定义；这里必须走 WordPopup 门面，
 * 否则点击“解析”会抛 ReferenceError，翻转与背面渲染都不会发生。
 */
if (WordTales.WordPopup && WordTales.WordPopup.close) WordTales.WordPopup.close();
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
var vf = card.querySelector('.vf');
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
if (vf) back.appendChild(vf.cloneNode(true));
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


WordTales.Analysis = { init: initParaFlip, show: showAnalysis };
WordTales.Cards = { init: initFlipCards, initToolbar: initFlipToggles };
})();

