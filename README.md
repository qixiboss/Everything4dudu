# Everything 4 Dudu

Everything 4 Dudu 是 Dudu 的个人学习与成长门户，包含词汇学习、训练记录、考研日程、记账和更新记录。所有运行源码都直接维护在 `site/`，由同一个 Supabase 邮箱密码账户提供登录和跨设备同步。

生产站点：<https://qixiboss.github.io/Everything4dudu/>

## 项目结构

```text
site/       # 唯一运行源码，也是 GitHub Pages 发布目录
tests/      # 门户与应用回归测试
scripts/    # 静态站点契约和完整性检查
supabase/   # 数据库迁移
docs/       # 历史应用资料，仅供参考，不参与发布或 CI
```

`site/` 内的 `/`、`/words/`、`/training/`、`/exam-schedule/`、`/CostTrace/` 和 `/changelog/` 都是直接可发布的静态页面。不要再生成、提交或编辑 `_site/`。

## 本地查看与验证

```sh
cd site && python3 -m http.server 8000
```

访问 <http://localhost:8000/>。

```sh
npm test        # 所有回归测试
npm run check   # 词汇语料、资源和脚本完整性检查
npm run verify  # test + check，CI 发布前的完整验证
```

开发时直接修改 `site/` 中对应的页面、脚本或样式。共享认证、同步和返回主页逻辑位于 `site/shared/`；每个应用自己的同步适配器和运行脚本保留在该应用目录中。共享脚本顺序由 `scripts/site-contract.js` 约束。

## 部署

推送到 `master` 或 `main` 后，GitHub Actions 会运行 `npm run verify`，通过后直接发布 `site/`。所有应用与门户在同一份源码、同一次验证和同一个部署流程中推进。

## Supabase

1. 在当前 Supabase 项目执行 `supabase/migrations/` 中尚未执行的迁移。
2. 在 Data API 中确认 `words_sync_items`、`training_sync_items`、`exam_sync_items`、`costtrace_sync_items` 已暴露，并保留迁移中定义的 RLS。
3. 在 Auth URL Configuration 中把 Site URL 设为 `https://qixiboss.github.io/Everything4dudu/`，并添加门户主页及五个应用路径作为精确 Redirect URL。
4. 预先创建允许登录的账户，启用 Email Provider，并关闭公开注册。
5. 浏览器只使用 `site/shared/config.js` 中的 publishable key；绝不提交 service-role 或其他 secret key。

首次登录会保留本机数据备份；切换账号时会先备份并清除旧账号的应用缓存，再恢复新账号的云端数据。客户端登录门只负责页面体验，数据库 RLS 才是最终访问边界。

历史应用的原始说明、维护资料和音频对齐技能位于 `docs/legacy/`，它们不再代表当前发布架构。
