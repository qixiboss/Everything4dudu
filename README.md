# Everything 4 Dudu

统一入口采用手机主屏幕布局，包含词汇学习、训练记录、考研日程、更新记录和用户登录五个应用图标。三个学习应用（及更新记录）保持独立页面，但都要求先使用同一个预先创建的 Supabase 邮箱密码账号登录，随后才会读取和操作学习数据；更新记录随账户跨设备同步。

生产站点：<https://qixiboss.github.io/Everything4dudu/>

## 本地查看

```sh
python3 -m http.server 8000
```

访问 `/`、`/words/`、`/training/`、`/exam-schedule/` 或 `/changelog/`。

## 自动跟随三个应用仓库

门户每 15 分钟检查一次以下仓库：

- `qixiboss/WordTales` → `/words/`
- `qixiboss/Train_record` → `/training/`
- `qixiboss/-Graduate-Entrance-Exam-Schedule` → `/exam-schedule/`

发现新提交后，GitHub Actions 会重新生成三个应用目录（以及门户自有的 `/changelog/`）、注入统一导航、登录门和同步适配器，运行完整验证，然后把结果提交回本仓库，并在同一次工作流中直接发布 GitHub Pages。实际部署通常会比上游提交晚 15 分钟左右，再加一次 Pages 构建时间。

可以在 Actions 中手动运行 **Sync upstream applications**。如果需要近乎即时同步，也可以从三个源仓库发送 `repository_dispatch` 事件，事件类型为 `upstream-app-updated`；轮询仍作为兜底。

`words/`、`training/`、`exam-schedule/` 是自动生成目录，不应直接维护。`changelog/` 是门户自有应用，维护入口位于该目录（`index.html`、`changelog.css`、`changelog.js`、`hub-sync.js`），上游同步时由 `scripts/sync-upstreams.js` 重新注入共享脚本并重新生成。门户接入代码位于 `integrations/`，生成规则位于 `scripts/sync-upstreams.js`，每次同步采用的源提交记录在 `upstreams.json`。如果上游页面结构变化导致无法安全注入，任务会验证失败且不会提交损坏版本。

## 更新记录

`/changelog/` 记录门户自身的每次发布。内置种子条目随每次部署一起发布；应用内新增的条目以 `entry:<版本号>` 为键按账户同步。种子条目在加载时会与云端合并（云端较新则覆盖），所以修改种子后部署，已同步过新版本的设备不会被旧种子覆盖。

## Supabase 部署

1. 在已使用的 WordTales Supabase 项目应用 `supabase/migrations/` 中尚未执行的迁移。
2. 在 Dashboard 的 **Data API** 中确认 `sync_items` 被暴露给 API；迁移已包含 authenticated 的权限与 RLS。
3. 在 Auth URL Configuration 中把 Site URL 设为 `https://qixiboss.github.io/Everything4dudu/`，并添加以下精确的 Redirect URLs：
   - `https://qixiboss.github.io/Everything4dudu/`
   - `https://qixiboss.github.io/Everything4dudu/words/`
   - `https://qixiboss.github.io/Everything4dudu/training/`
   - `https://qixiboss.github.io/Everything4dudu/exam-schedule/`
   - `https://qixiboss.github.io/Everything4dudu/changelog/`
4. 在 **Authentication → Users** 中预先创建允许使用门户的账号；在 **Authentication → Sign In / Providers → Email** 中启用 Email Provider，并关闭 **Allow new users to sign up**。门户不提供公开注册入口。
5. 保持合理的密码策略和 Auth 速率限制。密码只提交给 Supabase Auth 并由其加盐哈希保存；不要在业务表、日志或前端存储密码。
6. 浏览器只使用 `shared/config.js` 内的 publishable key；不要填写 service-role 或 secret key。客户端登录门负责界面流程，数据库 RLS 才是最终的数据访问边界。

首次使用统一门户登录时，会保留本机数据备份。若同一应用既有旧本机数据又有云端数据，会询问应导入本机数据还是使用云端数据。切换账号时，旧账号数据会先备份并从当前应用缓存中移除；应用在认证和首次云端同步完成前保持锁定。

## 验证

```sh
npm run verify
```
