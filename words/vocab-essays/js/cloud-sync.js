/* ============================================================
 * Module: CloudSync
 * 每个已登录用户仅有一份 RLS 保护的云端学习档案。本地存储继续作为离线缓存。
 * ============================================================ */
WordTales.CloudSync = (function() {
  var OWNER_KEY = 'wordtales.cloud-sync.owner.v1';
  var TABLE = 'learning_profiles';
  var timer = null;
  var initialized = false;
  var syncing = false;
  var status = 'local';

  function readOwner() { try { return localStorage.getItem(OWNER_KEY) || ''; } catch (e) { return ''; } }
  function writeOwner(userId) { try { localStorage.setItem(OWNER_KEY, userId); } catch (e) {} }
  function user() { var session = WordTales.Auth && WordTales.Auth.getSession(); return session && session.user ? session.user : null; }
  function client() { return WordTales.Auth && WordTales.Auth.getClient(); }
  function updateStatus(next, message) {
    status = next;
    if (WordTales.Auth && WordTales.Auth.setStatus) WordTales.Auth.setStatus(message || '');
  }
  function time(value) { var parsed = new Date(value || 0).getTime(); return isFinite(parsed) ? parsed : 0; }
  function schedule() {
    if (!initialized || !user() || !WordTales.LearningProgress || !WordTales.LearningProgress.isReady()) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function() { timer = null; upload(); }, 1400);
  }
  function fetchRemote(currentUser) {
    return client().from(TABLE).select('profile, updated_at').eq('user_id', currentUser.id).maybeSingle().then(function(result) {
      if (result.error) throw result.error;
      return result.data || null;
    });
  }
  function upload(force) {
    var currentUser = user();
    if (!currentUser || !client() || !WordTales.LearningProgress || !WordTales.LearningProgress.isReady() || (syncing && !force)) return Promise.resolve(false);
    syncing = true;
    updateStatus('syncing', '正在同步进度…');
    return client().from(TABLE).upsert({ user_id: currentUser.id, profile: WordTales.LearningProgress.getData() }, { onConflict: 'user_id' }).then(function(result) {
      if (result.error) throw result.error;
      writeOwner(currentUser.id);
      updateStatus('synced', '进度已同步');
      return true;
    }).catch(function(error) {
      updateStatus('error', '云端同步失败，本地进度已保留：' + error.message);
      return false;
    }).finally(function() { syncing = false; });
  }
  function connectProfile() {
    var currentUser = user();
    if (!currentUser || !client() || !WordTales.LearningProgress || !WordTales.LearningProgress.isReady()) { updateStatus('local', '本地进度模式'); return Promise.resolve(false); }
    syncing = true;
    updateStatus('syncing', '正在读取云端进度…');
    return fetchRemote(currentUser).then(function(remote) {
      var local = WordTales.LearningProgress.getData();
      var owner = readOwner();
      if (owner && owner !== currentUser.id) {
        if (remote) return WordTales.LearningProgress.replaceData(remote.profile).then(function() { writeOwner(currentUser.id); updateStatus('synced', '已载入你的云端进度'); return true; });
        return WordTales.LearningProgress.replaceData(null).then(function() { writeOwner(currentUser.id); return upload(true); });
      }
      if (remote && time(remote.updated_at) > time(local.updatedAt)) {
        return WordTales.LearningProgress.replaceData(remote.profile).then(function() { writeOwner(currentUser.id); updateStatus('synced', '已载入最新云端进度'); return true; });
      }
      writeOwner(currentUser.id);
      return upload(true);
    }).catch(function(error) {
      updateStatus('error', '无法读取云端进度，本地进度已保留：' + error.message);
      return false;
    }).finally(function() { syncing = false; });
  }
  function init() {
    if (initialized) return Promise.resolve(api);
    initialized = true;
    WordTales.Auth.onChange(function(nextSession) {
      if (nextSession && WordTales.LearningProgress && WordTales.LearningProgress.isReady()) connectProfile();
      else if (!nextSession) updateStatus('local', '本地进度模式');
    });
    return Promise.resolve(api);
  }
  var api = { init: init, connectProfile: connectProfile, schedule: schedule, upload: upload, getStatus: function() { return status; } };
  return api;
})();
