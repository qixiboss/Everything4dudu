# Everything 4 Dudu

统一入口采用手机主屏幕布局，包含词汇学习、训练记录、考研日程、更新记录和用户登录五个应用图标。三个学习应用保持独立页面，但都要求先使用同一个预先创建的 Supabase 邮箱密码账号登录，随后才会读取和操作学习数据。

生产站点：<https://qixiboss.github.io/Everything4dudu/>

## 本地查看

```sh
npm run build          # 从 words/、training/、exam-schedule/ 三个克隆整合应用,输出 _site/
cd _site && python3 -m http.server 8000
```

访问 `/`、`/words/`、`/training/`、`/exam-schedule/` 或 `/changelog/`。

## 应用在各自仓库开发

三个应用保持独立仓库,各自有自己的 GitHub Pages:

- `qixiboss/WordTales` → `/words/`
- `qixiboss/Train_record` → `/training/`
- `qixiboss/-Graduate-Entrance-Exam-Schedule` → `/exam-schedule/`

本仓库的 `words/`、`training/`、`exam-schedule/` 是这三个仓库的本地克隆(不入库,已 gitignore),仅作为构建输入:开发时直接在克隆里改代码并 `git push` 到各自仓库即可。门户的整合(共享登录/同步脚本、CSP、返回主页入口)由 `scripts/integrate.js` 在构建 `_site/` 时注入,不修改应用源码。

**部署时机**:

- 应用仓库各自推送、各自部署它们自己的 GitHub Pages,与门户互不影响;
- 推送门户仓库 → 构建时检出三个应用的最新 `main`,整合后部署门户。

`changelog/` 是门户自有应用,只在本仓库维护。

## 更新记录

`/changelog/` 记录门户自身的每次发布。内置种子条目在 `changelog/changelog.js` 的 `SEED` 中维护,发布新版本时随提交更新;页面是只读的,不提供手动添加,也不按账户同步。

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
npm run verify    # build + test + check,校验的是构建产物 _site/
```
