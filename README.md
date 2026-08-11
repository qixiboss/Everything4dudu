# Everything 4 Dudu

统一入口包含词汇学习、训练记录和考研日程。三个应用保持独立页面，但使用同一个 Supabase Magic Link 账号同步数据。

## 本地查看

```sh
python3 -m http.server 8000
```

访问 `/`、`/words/`、`/training/` 或 `/exam-schedule/`。

## Supabase 部署

1. 在已使用的 WordTales Supabase 项目应用 `supabase/migrations/` 中尚未执行的迁移。
2. 在 Dashboard 的 **Data API** 中确认 `sync_items` 被暴露给 API；迁移已包含 authenticated 的权限与 RLS。
3. 在 Auth URL Configuration 中添加 GitHub Pages 根地址及 `/words/`、`/training/`、`/exam-schedule/` 路径为 Redirect URLs。
4. 浏览器只使用 `shared/config.js` 内的 publishable key；不要填写 service-role 或 secret key。

首次使用统一门户登录时，会保留本机数据备份。若同一应用既有旧本机数据又有云端数据，会询问应导入本机数据还是使用云端数据。

## 验证

```sh
npm run verify
```
