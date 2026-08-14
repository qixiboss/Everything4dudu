# WordTales

一个把英语词汇放回语境中学习的静态单页应用，是 Everything 4 Dudu 门户的一部分。项目收录 **7 份词集、28 个主题栏目、897 个原始出现项、892 个规范学习词条和 132 个短文段落**。

默认首页是文章学习页。项目没有构建步骤，所有资源和 FSRS-6 调度器都随站点打包，可离线或通过 `file://` 使用。

## 主要功能

- **规范词条**：897 个文章出现项映射到 892 个学习词条；跨文章同义词共享状态，不同词义的两个 `brisk` 独立。
- **统一生词状态**：文章词卡、分类游戏和生词抄写统一读取规范词条的 `isStarred`。
- **语境阅读与朗读**：28 个栏目提供原创短文、预生成 MP3、逐词高亮、段落解析和系统语音降级。
- **词汇练习**：支持词卡翻面、文章点词、全部词/生词游戏、桌面拼写和移动端手写。
- **学习记录表**：按月查看日期 × 词集栏目表格，支持全屏与缩放查看，默认优先展示最近七天，并在当前浏览器中自动保存。
- **响应式与打印**：文章、练习和记录表均支持桌面端和移动端。

## 快速开始

直接打开：

```text
vocab-essays/vocab-essays.html
```

或在仓库根目录启动静态服务器：

```bash
python3 -m http.server 8000
```

然后访问 `http://localhost:8000/vocab-essays/vocab-essays.html`。

路由约定：

- 空 hash 或 `#library`：文章主页。
- `#study`：兼容旧链接并自动规范化为 `#library`。
- `#s1col1` 等栏目 hash：直接进入对应文章。
- 词集和更新日志原有 hash 继续可用。

## 使用路径

1. 在页首选择一份词集，通过粘性目录一次跳到目标栏目。
2. 浏览词卡并阅读短文；点击高亮词可查看释义并听发音。
3. 点击段尾“解析”查看翻译与语法说明，或选择倍速后朗读全文。
4. 使用“游戏”按熟悉程度分类；标为“不太认识”的词会加星。
5. 回到同一栏目点击“抄写”，集中练习已加星的词；完成后可直接点击栏目标题右侧、位于“游戏”左边的“今日完成”，也可以打开页首“记录表”补记。登录后这条完成记录会随账号同步。

## 内容概览

| 词集 | 栏目 | 出现项 | 段落 |
| --- | ---: | ---: | ---: |
| 第一份 | 4 | 131 | 16 |
| 第二份 | 4 | 115 | 16 |
| 第三份 | 5 | 169 | 24 |
| 第四份 | 4 | 130 | 21 |
| 第五份 | 4 | 136 | 24 |
| 第六份 | 4 | 130 | 18 |
| 第七份 | 3 | 86 | 13 |
| **合计** | **28** | **897** | **132** |

## 项目结构

```text
.
├── .codex/skills/sync-article-audio/ # 音频对齐与逐词高亮维护技能
├── scripts/
│   └── check-integrity.js             # 语料、资源和脚本完整性检查
├── tests/                             # 零依赖 Node 测试
│   ├── helpers/                       # 浏览器环境模拟与共享常量
│   ├── data.test.js                   # 语料索引与规范词条
│   ├── learning-progress.test.js      # FSRS 与学习档案
│   └── study-record.test.js           # 学习记录表
├── vocab-essays/
│   ├── audio/                         # 28 个栏目朗读 MP3
│   ├── css/styles.css                 # 文章主页、交互和响应式样式
│   ├── js/
│   │   ├── namespace.js               # WordTales 命名空间
│   │   ├── data.js                    # 内容、出现项和规范词条索引
│   │   ├── renderer.js                # 文章主页 DOM
│   │   ├── learning-progress-v2.js    # FSRS、迁移、事件和统一星标
│   │   ├── study-record.js            # 按月学习记录表与勾选交互
│   │   └── features.js                # 文章、朗读、游戏、抄写和路由
│   ├── vendor/ts-fsrs/                # 官方 UMD 包、元数据与 MIT 许可证
│   └── vocab-essays.html
├── CLAUDE.md
├── LICENSE
└── README.md
```

经典脚本使用 `defer` 按依赖顺序加载：

```text
ts-fsrs UMD
  → namespace
  → data
  → renderer
  → learning-progress-v2
  → study-record
  → features / App.init
```

## 公共接口

`WordTales.Data`：

- `resolveEntryId(occurrenceId)`
- `getEntry(entryId)`
- `getContexts(entryId)`
- `getAllEntries()`

`WordTales.LearningProgress`：

- `rateWord(entryId, rating, meta, submissionId)`
- `getDueEntries(at)`
- `getEntryState(entryId)`
- `getStarredEntryIds()` / `setStarred(entryId, value, meta)`
- `getCompletedColumnIds(date)` / `isColumnCompleted(columnId, date)` / `await setColumnCompleted(columnId, date, value)`（返回完成状态与保存结果）
- `trackWord()`（旧功能兼容适配器）

## 数据保存与迁移

学习档案、事件和记录表勾选优先保存在 IndexedDB。v1 档案会幂等迁移为规范词条状态：保留既有到期时间，合并重复词记录，并把旧字符串星标映射到同拼写的规范词条。新档案中的 `isStarred` 是唯一事实来源；`localStorage.starredWords` 只作为旧功能兼容镜像。

### 跨设备同步（Supabase）

站点已预留由 Everything 4 Dudu 门户统一提供的登录和按账号同步能力。离线或未登录时仍照常使用本地进度；登录后会把当前浏览器作为离线缓存，并同步同一账号的云端档案。

1. 在 Supabase 项目执行 `supabase/migrations/20260811000000_create_learning_profiles.sql`。
2. 在 Supabase Auth 的 URL Configuration 中添加门户 GitHub Pages 地址作为 Site URL 和 Redirect URL。
3. Supabase URL 和 **publishable key** 由门户根目录的 `shared/config.js` 统一提供；应用源码不要再单独配置或连接其他 Supabase 项目。

`learning_profiles` 已开启 RLS，登录用户只能读写 `user_id = auth.uid()` 的那一行。首次登录时：若云端没有档案，会上传本机已有进度；若云端已有较新的档案，会优先下载云端版本。多人共用同一台设备时，不同账号不会互相上传既有的本地档案。

浏览器无法使用 IndexedDB 时自动降级到 localStorage。旧单卡会话的 `wordtales.study-session.v1` 数据不会被读取，也不会被主动删除；已有词条状态、文章记录和加星数据继续保留。

## 验证

运行零依赖核心功能测试：

```bash
node --test tests/*.test.js
```

测试覆盖规范词条索引、别名迁移、三档评分、幂等提交、到期排序和学习档案兼容。

运行零依赖完整性检查：

```bash
node scripts/check-integrity.js
```

检查包括脚本语法、资源路径、897→892 映射、五组同义合并、两个 `brisk` 独立、所有词条语境和来源顺序、FSRS-6 版本与三档间隔，以及音频 cue 完整性。

手动 smoke test 应覆盖：空 hash、`#library` 与旧 `#study`；栏目首次跳转和跨词集深链；统一星标、游戏、抄写、记录表勾选与重载恢复、文章朗读和解析；桌面和窄屏布局，以及 `file://` 打开。

## 门户构建与部署

在门户根目录运行 `npm run verify`，会把本应用与其他应用一起构建、测试并输出到 `_site/`。GitHub Pages 只由门户根目录的工作流发布；不运行本目录的独立 Pages/CI 流程，也不从 CDN 下载运行时依赖。

`ts-fsrs` 按 MIT 许可证分发，许可证文本位于 `vocab-essays/vendor/ts-fsrs/LICENSE`。
