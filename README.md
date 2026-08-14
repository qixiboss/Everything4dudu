# Everything 4 Dudu

统一入口采用手机主屏幕布局，包含词汇学习、训练记录、考研日程、记账、更新记录和用户登录。各应用保持独立页面，并使用同一个预先创建的 Supabase 邮箱密码账号登录和同步数据。所有应用源码都归属于本仓库，由门户统一开发、验证和部署。

生产站点：<https://qixiboss.github.io/Everything4dudu/>

## 本地查看

```sh
npm run build                        # 从门户内应用源码整合,输出 _site/
cd _site && python3 -m http.server 8000
```

访问 `/`、`/words/`、`/training/`、`/exam-schedule/`、`/CostTrace/` 或 `/changelog/`。

## 应用在各自仓库开发

`words/`、`training/`、`exam-schedule/`、`CostTrace/` 和 `changelog/` 都是本仓库内的应用目录，不再作为 git 子模块，也不再连接或依赖其他应用仓库。门户的整合(共享登录/同步脚本、CSP、返回主页入口)由 `scripts/integrate.js` 在构建 `_site/` 时注入。

**部署时机**:

- 所有应用改动与门户改动一起提交到本仓库;
- 推送门户仓库 → CI 在同一份源码上运行 `npm run verify`,整合后部署门户。任一应用的校验失败都会阻止本次门户部署，避免发布不完整的站点。

`changelog/` 和 `CostTrace/` 是门户自有应用，只在本仓库维护。CostTrace 使用浏览器本地存储保持离线可用，并按记录同步到当前 Supabase 账户。

## 更新记录

`/changelog/` 记录门户自身的每次发布。内置种子条目在 `changelog/changelog.js` 的 `SEED` 中维护,发布新版本时随提交更新;页面是只读的,不提供手动添加,也不按账户同步。

## Supabase 部署

1. 在已使用的 WordTales Supabase 项目应用 `supabase/migrations/` 中尚未执行的迁移。
2. 在 Dashboard 的 **Data API** 中确认 `words_sync_items`、`training_sync_items`、`exam_sync_items`、`costtrace_sync_items` 四张表被暴露给 API；迁移已包含 authenticated 的权限与 RLS。
3. 在 Auth URL Configuration 中把 Site URL 设为 `https://qixiboss.github.io/Everything4dudu/`，并添加以下精确的 Redirect URLs：
   - `https://qixiboss.github.io/Everything4dudu/`
   - `https://qixiboss.github.io/Everything4dudu/words/`
   - `https://qixiboss.github.io/Everything4dudu/training/`
   - `https://qixiboss.github.io/Everything4dudu/exam-schedule/`
   - `https://qixiboss.github.io/Everything4dudu/CostTrace/`
   - `https://qixiboss.github.io/Everything4dudu/changelog/`
4. 在 **Authentication → Users** 中预先创建允许使用门户的账号；在 **Authentication → Sign In / Providers → Email** 中启用 Email Provider，并关闭 **Allow new users to sign up**。门户不提供公开注册入口。
5. 保持合理的密码策略和 Auth 速率限制。密码只提交给 Supabase Auth 并由其加盐哈希保存；不要在业务表、日志或前端存储密码。
6. 浏览器只使用 `shared/config.js` 内的 publishable key；不要填写 service-role 或 secret key。客户端登录门负责界面流程，数据库 RLS 才是最终的数据访问边界。

首次使用统一门户登录时，会保留本机数据备份。若同一应用既有旧本机数据又有云端数据，会询问应导入本机数据还是使用云端数据。切换账号时，旧账号数据会先备份并从当前应用缓存中移除；应用在认证和首次云端同步完成前保持锁定。

## 验证

```sh
npm run verify    # build + test + check,校验的是构建产物 _site/
```

应用开发约定：直接修改对应应用目录，在门户根目录运行 `npm run verify`，确认所有应用和门户一起通过后再提交。应用目录中的旧版独立仓库 CI/Pages 配置已移除。
