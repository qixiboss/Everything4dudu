/* Shared modal behavior and set navigation. */
(function () {
'use strict';
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
WordTales.Cards.init(root);
WordTales.Cards.initToolbar(root);
WordTales.Analysis.init(root);
WordTales.Reader.init(root);
WordTales.WordPopup.init(root);
}

function switchSet(setId, btn) {
/*
 * 切换前先终止朗读和弹层，再改变 active/inert 状态。这样隐藏词集里不会
 * 残留语音、高亮或可被键盘聚焦的控件。目录始终从 Data 重建以保持一致。
 */
WordTales.WordPopup.close();
WordTales.Reader.stop();
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


WordTales.FeatureModal = { activate: activateModal, deactivate: deactivateModal };
WordTales.Navigation = { switchSet: switchSet };
})();

