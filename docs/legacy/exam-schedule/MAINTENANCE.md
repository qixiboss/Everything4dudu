# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

考研一轮学习日程 —— 一个无需后端的单文件静态网页应用，帮助管理 45 天考研第一轮复习。完成状态保存在浏览器 `localStorage` 中。

## 本地运行

直接打开 `index.html` 即可，无需构建工具或开发服务器。

## 门户部署

本应用是 Everything 4 Dudu 门户内的普通源码目录。请在门户根目录运行 `npm run verify`；门户根目录的 GitHub Actions 统一构建和部署整合后的站点。

## 架构

整个应用是一个 **单文件 HTML**（`index.html`，约 1340 行），采用双层结构：

### 外层（宿主页）
- 极简 HTML shell，设置严格的 CSP（`default-src 'none'`，仅允许 inline script/style）
- 通过 `<iframe srcdoc="...">` 嵌入真正的应用，实现安全沙箱隔离
- 外层 CSS 仅负责 body 布局和 iframe 尺寸

### 内层（iframe srcdoc 中的应用）
- 完整的 SPA，三视图切换：「今日执行」「完整日程」「学习进度」
- 侧边栏导航 + 工作区布局（响应式，移动端导航移到底部）
- CSS 自定义属性体系：定义了一套完整的 design token（颜色、字体、圆角、阴影），支持 light/dark 模式，`--viz-*` 系列变量用于可视化组件

### 数据层

**课程数据**（硬编码在 JS 中）：
- `courseRaw`：四个科目的视频清单，每项 `[标题, 时长字符串]`
  - `math`（数学，25 个视频）
  - `co`（计组，72 个视频）
  - `os`（操作系统，79 个视频）
  - `net`（计算机网络，86 个视频）
- `historyCompleted`：已提前完成的科目（高数 1-9、数据结构 1-8），记录已完成的时长

**日程生成**（在 JS 初始化时计算，非持久化）：
- 起始日：2026-07-18，共 45 天
- 每周日（cycle===6）为计划休息日；周三、周六（cycle===2 或 5）为晚间休息日
- 分 4 个阶段（phase）：第 1-14 天 → 第 15-28 天 → 第 29-40 天 → 第 41-45 天
- 每日任务分配逻辑：
  - 数学每天并行推进（晚间休息日 55min，正常日 65min）
  - 专业课严格串行：计组 → 操作系统 → 计算机网络（晚间休息日 135min，正常日 170min）
  - 每日末尾添加练习复盘任务（晚间休息日 60min，正常日 90min）
- 未分配的剩余视频顺延填入同科目学习日末尾
- 长视频会被切割（`take` 函数），超出当日预算的剩余部分次日以「续 · 」标题继续

**状态管理**（`localStorage`，key: `kaoyan-first-round-state-v3`）：
- `state.completed`：`{ [taskId]: timestamp }` —— 已完成任务的勾选时间
- `state.rested`：`{ [dayIndex]: true }` —— 标记为实际休息的日期
- 未完成的任务会自动顺延到后续日期显示
- 已完成的任务在当天排到最后，按完成时间排序

### 渲染函数

| 函数 | 职责 |
|------|------|
| `renderStats()` | 更新进度条、完成率、科目进度条、下一步提示 |
| `renderToday()` | 渲染当前选中日期的任务队列、休息日状态、顺延标签 |
| `renderTimeline()` | 渲染「完整日程」视图，支持按科目/阶段/范围筛选 |
| `renderAll()` | 同时调用 `renderStats()` + `renderToday()` |

### 外部依赖（运行时 CDN）

- **Floating UI** (`@floating-ui/core` + `@floating-ui/dom`)：tooltip 定位，处理边界翻转和偏移
- **Lucide** (`lucide@1.17.0`)：图标库

### 关键 DOM 元素

所有可交互元素通过 `elements` 对象集中引用（`root.querySelector` 映射），包括导航按钮（`data-view`）、应用视图面板（`.app-view`）、进度条、筛选器等。

### 动画

任务完成后的队列重排使用 FLIP 动画（`animateTaskQueue`），通过 `Element.animate()` 实现。会检查 `prefers-reduced-motion`，尊重用户的减弱动画偏好。
