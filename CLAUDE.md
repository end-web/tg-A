# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概况

`tuoguan-a` 是一个**托管班作业记录小程序**，主端为微信小程序（AppID `wxe1ad102c8c75995e`）。技术栈：

- **前端**：uni-app + Vue 3（`<script setup>`），HBuilderX 工程（**无 npm/package.json，无构建脚本**）
- **后端**：uniCloud-aliyun 云函数 + 云数据库（spaceId `mp-f72cbfe6-8460-4535-bb4d-4424acd001f8`，见 `uniCloud-aliyun/space.json`）
- **角色**：`teacher` / `parent`（当前 `pages/` 下只实现了 teacher 端，parent 端路由在登录跳转/上线指南中被引用但未落地）

## 开发与部署

本工程**没有命令行 build/test/lint**，所有动作都在 HBuilderX 中完成：

- **运行调试**：HBuilderX → 运行 → 运行到小程序模拟器 → 微信开发者工具
- **上传云函数**：右键 `uniCloud-aliyun/cloudfunctions/<auth|students|homework>` → 上传部署
- **上传 schema**：右键 `uniCloud-aliyun/database` → 上传所有 DB Schema
- **关联云空间**：右键 `uniCloud-aliyun` → 关联云服务空间（必须先做，否则云函数调用全失败）
- **发布**：HBuilderX → 发行 → 小程序-微信，再用微信开发者工具上传

完整流程见 `上线指南.md`，修改云函数或 schema 后**必须重新上传**才会生效，本地改动不会自动同步到云端。

## 架构要点

### 调用链：页面 → `utils/request.js` → 云函数

`utils/request.js` 是**唯一**的接口出口，所有云函数调用都从这里走：

- 自动从 `uni.getStorageSync('token')` 取 token 注入到 `event.token`
- 约定 `res.result.code`：`200/201` 成功，`401` 自动清缓存 + `reLaunch` 到 `/pages/login/login`，其它弹 toast
- 云函数按 `action` 字段分发（`list` / `add` / `update` / `delete` / `create` / `stats` / `wxLogin` / `register` / `getUserInfo`）

新加接口时，**两边都要改**：`utils/request.js` 加导出函数 + 对应云函数 `index.js` 加 `if (action === '...')` 分支，并在 HBuilderX 重新上传该云函数。

### 鉴权模型（简化版，注意）

- **token 实际就是微信 openid**（见 `cloudfunctions/auth/index.js` 第 47 行 `token: openid`），未签名、未过期、无刷新机制
- 每个业务云函数（students、homework）在入口处用 `usersCollection.where({ openid: token }).get()` 反查 `currentUser` 来鉴权
- 角色权限**靠云函数代码里的 `if (currentUser.role !== 'teacher')` 判断**，schema 的 `permission` 字段（`auth.role == 'teacher'`）只在 clientDB 直连时生效，云函数走的是管理员权限会绕过

如果要加新的写操作云函数，**必须显式做 role 校验**，否则家长也能写。

### 数据模型（`uniCloud-aliyun/database/`）

- `users`：`openid` / `role`（`teacher` | `parent`）/ `name` / `phone` / `avatar`
- `students`：`name` / `grade` / `class` / `parent_id`（指向 `users._id`，**目前要在云数据库手工填**绑定家长）/ `avatar`
- `homework_records`：`student_id` / `teacher_id` / `subject`（枚举：语文/数学/英语/物理/化学/其它）/ `status`（已完成/未完成/部分完成）/ `quality_score` 0-5 / `record_date` `YYYY-MM-DD`

家长侧通过 `parent_id` 反查自己孩子的作业（见 `homework/index.js` 的 `list` action），未绑定就什么都看不到。

### 页面结构

`pages.json` 里所有页面都是 `navigationStyle: custom` —— **不要依赖系统导航栏**，每个页面自己用 `padding-top: 60px` 留状态栏空间（参考 `pages/teacher/home/home.vue` 的 `.nav-header`）。

底部 TabBar 也是自绘的（`tab-bar` class，固定定位），不是 `pages.json` 的 `tabBar` 配置。新增 tab 页要在每个页面的模板里同步加。

### 全局样式

`App.vue` import 了 `static/styles/apple-theme.css`（苹果风），主色 `#007AFF`，背景 `#F2F2F7`。新组件继续用这套色板，不要引入新主题。

## 重要约束

- **WeChat AppSecret 当前硬编码在 `cloudfunctions/auth/index.js`**（`83adb806ecc63ec3d2019352222d3b04`）。这是已知问题，迁移时改成云函数环境变量；不要复制到日志或前端。
- **`上线指南.md` 第 30-58 行提到的 Mock 登录代码已经不在 `pages/login/login.vue` 中**（当前是真实云函数登录）。如果指南内容和代码冲突，**以代码为准**，并顺手把指南里那段过时说明删掉。
- 登录后强制跳 `/pages/teacher/home/home`（`login.vue` 写死），家长端登录会跳到一个**不存在**的 `/pages/parent/home/home`（参考 `上线指南.md` 也提到该路径）。新增家长端时要补这个页面 + 改登录分支。
- 微信小程序需在公众平台配置三个合法域名（request / uploadFile / downloadFile），具体见 `上线指南.md` 第三节。

## 写代码的几个约定

- Vue 文件统一用 `<script setup>` + `ref`/`computed`，不要混 Options API
- 业务调用一律走 `utils/request.js` 的命名导出，不要直接 `uniCloud.callFunction`
- 云函数返回**永远**是 `{ code, message?, data? }`，前端按 code 判断
- 学生 ID 在前端可能是 `_id`（云端）或 `id`（mock），读的时候用 `item._id || item.id` 兜底（见 `home.vue` 第 14、152 行）
