/* WordTales bootstrap and route restoration. */
(function () {
'use strict';
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
WordTales.PortalSync.init().then(function(){
return WordTales.LearningProgress.init();
}).then(function(){
WordTales.StudyRecord.init();
WordTales.StarredWords.init();
WordTales.Progress.refresh();
window.addEventListener('hashchange', switchToHash);
switchToHash();
WordTales.PortalSync.start();
return WordTales.PortalSync.queue();
});
}


WordTales.App = { init: init };
})();

