/* ============================================================
 * Module: CloudSync (portal-owned stub)
 * 旧的整份档案 learning_profiles 上传/恢复通道已停用：跨设备同步
 * 全部由 WordTales.HubProfileSync（hub-sync.js）经各应用自己的
 * sync 表分条完成。登录生命周期与状态行保留；永不从远端档案
 * replaceData，避免过期全量档案覆盖本地进度。
 * ============================================================ */
WordTales.CloudSync = (function () {
  var timer = null;
  var initialized = false;
  var status = 'local';

  function user() { var session = WordTales.Auth && WordTales.Auth.getSession(); return session && session.user ? session.user : null; }
  function updateStatus(next, message) {
    status = next;
    if (WordTales.Auth && WordTales.Auth.setStatus) WordTales.Auth.setStatus(message || '');
  }
  function queueProfile() {
    if (WordTales.HubProfileSync) { WordTales.HubProfileSync.start(); WordTales.HubProfileSync.queue(); }
  }
  function schedule() {
    if (!initialized || !user() || !WordTales.LearningProgress || !WordTales.LearningProgress.isReady()) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { timer = null; queueProfile(); }, 1400);
  }
  function connectProfile() {
    if (!user() || !WordTales.LearningProgress || !WordTales.LearningProgress.isReady()) { updateStatus('local', '本地进度模式'); return Promise.resolve(false); }
    updateStatus('syncing', '正在同步进度…');
    queueProfile();
    updateStatus('synced', '进度已同步');
    return Promise.resolve(true);
  }
  function init() {
    if (initialized) return Promise.resolve(api);
    initialized = true;
    WordTales.Auth.onChange(function (nextSession) {
      if (nextSession && WordTales.LearningProgress && WordTales.LearningProgress.isReady()) connectProfile();
      else if (!nextSession) updateStatus('local', '本地进度模式');
    });
    return Promise.resolve(api);
  }
  var api = { init: init, connectProfile: connectProfile, schedule: schedule, getStatus: function () { return status; } };
  return api;
})();
