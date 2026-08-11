# Everything 4 Dudu

统一入口采用手机主屏幕布局，包含词汇学习、训练记录、考研日程和用户登录四个应用图标。三个学习应用保持独立页面，但使用同一个 Supabase 邮箱密码账号同步数据。

生产站点：<https://qixiboss.github.io/Everything4dudu/>

## 本地查看

```sh
python3 -m http.server 8000
```

访问 `/`、`/words/`、`/training/` 或 `/exam-schedule/`。

## 自动跟随三个应用仓库

门户每 15 分钟检查一次以下仓库：

- `qixiboss/WordTales` → `/words/`
- `qixiboss/Train_record` → `/training/`
- `qixiboss/-Graduate-Entrance-Exam-Schedule` → `/exam-schedule/`

发现新提交后，GitHub Actions 会重新生成三个应用目录、注入统一导航、Supabase 登录和同步适配器，运行完整验证，然后把结果提交回本仓库。该提交会自动触发 GitHub Pages 发布。实际部署通常会比上游提交晚 15 分钟左右，再加一次 Pages 构建时间。

可以在 Actions 中手动运行 **Sync upstream applications**。如果需要近乎即时同步，也可以从三个源仓库发送 `repository_dispatch` 事件，事件类型为 `upstream-app-updated`；轮询仍作为兜底。

`words/`、`training/`、`exam-schedule/` 是自动生成目录，不应直接维护。门户接入代码位于 `integrations/`，生成规则位于 `scripts/sync-upstreams.js`，每次同步采用的源提交记录在 `upstreams.json`。如果上游页面结构变化导致无法安全注入，任务会验证失败且不会提交损坏版本。

## Supabase 部署

1. 在已使用的 WordTales Supabase 项目应用 `supabase/migrations/` 中尚未执行的迁移。
2. 在 Dashboard 的 **Data API** 中确认 `sync_items` 被暴露给 API；迁移已包含 authenticated 的权限与 RLS。
3. 在 Auth URL Configuration 中把 Site URL 设为 `https://qixiboss.github.io/Everything4dudu/`，并添加以下精确的 Redirect URLs：
   - `https://qixiboss.github.io/Everything4dudu/`
   - `https://qixiboss.github.io/Everything4dudu/words/`
   - `https://qixiboss.github.io/Everything4dudu/training/`
   - `https://qixiboss.github.io/Everything4dudu/exam-schedule/`
4. 在 **Authentication → Sign In / Providers → Email** 中启用 Email Provider 和新用户注册。当前产品不验证邮箱所有权，因此需关闭 Confirm email，注册后才会立即建立会话。
5. 密码只提交给 Supabase Auth 并由其加盐哈希保存；不要在业务表、日志或前端存储密码。
6. 浏览器只使用 `shared/config.js` 内的 publishable key；不要填写 service-role 或 secret key。

首次使用统一门户登录时，会保留本机数据备份。若同一应用既有旧本机数据又有云端数据，会询问应导入本机数据还是使用云端数据。

## 验证

```sh
npm run verify
```
