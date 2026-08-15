/* Starred-word and daily-completion UI helpers. */
(function () {
'use strict';
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


WordTales.Progress = {
list: getStarredWords,
save: setStarredWords,
toggle: toggleStarWord,
has: isWordStarred,
refresh: updateMainCardStars
};
WordTales.FeatureProgress = {
setCardStarState: setCardStarState,
setColumnCompletionButtonState: setColumnCompletionButtonState
};
})();

