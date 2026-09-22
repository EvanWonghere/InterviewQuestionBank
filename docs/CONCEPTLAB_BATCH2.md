# ConceptLab 第二批 · 题库侧验收记录

更新时间：2026-09-22

本文件记录题库前端与 ConceptLab 第二批的本地验收证据。它不代表已执行 Supabase 迁移、Edge Function 部署、Hugo 发布或题库线上发布。

## 本轮题库侧范围

- 题目深链接使用 `questionId`，优先按稳定数据库 ID 定位，同时兼容 `legacyId`。
- `q` 继续作为关键词搜索参数。
- 找不到 `questionId` 时显示明确的失效提示，不自动打开列表中的另一道题。
- 错题、薄弱点和评估报告使用稳定题目 ID生成题库入口；相关 ConceptLab 实验通过生成映射按题号互链。

## 已执行验证

### 题库生产预览浏览器验收

命令：

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
npm run test:e2e -- --output /tmp/quiz-navigation-e2e-results-chrome \
  tests/e2e/public-quiz.spec.js
```

结果：**5 passed（21.3s）**。

覆盖内容：

- `/quiz/` 子路径加载；
- 主观题提交与移动端布局；
- 既有稳定题号入口；
- `questionId=q-151` 精确打开目标题；
- 不存在的 `questionId` 显示“不会自动打开其他题目”；
- 构建与操作系统题目在窄屏下无横向溢出。

默认 Playwright Chromium 未安装，因此使用机器上已有的 Google Chrome 完成浏览器验收；这不改变应用行为。

### 管理员 AI 合成端到端回归

命令：

```sh
npm run test:ai-e2e -- --output /tmp/quiz-ai-e2e-results
```

结果：**11 passed（31.3s）**。

覆盖匿名与非管理员隔离、管理员助手、草稿恢复、错误不自动重发、评估与追问、模拟面试、薄弱点报告及薄弱点出题流程。

### 静态检查与映射状态

```sh
npx eslint tests/e2e/public-quiz.spec.js
```

结果：通过。

```sh
cd '/Volumes/Atelier/Projects/Personal/ConceptLab'
node scripts/sync-catalog.mjs --check
```

早期检查曾报告 `Server catalog is stale`。2026-09-22 最终目录已重新生成，并执行 `npm run sync:catalog -- --check`，实际结果为 `Catalog and quiz mapping match`；后端可信目录与前端实验映射一致。

### 本次额度中断后的复核

2026-09-22 重新执行了当前工作树的题库回归：

```sh
npm test -- --run
```

结果：**26 个测试文件、153 项测试通过**。

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
npm run test:e2e -- --output /tmp/quiz-navigation-e2e-results-current \
  tests/e2e/public-quiz.spec.js
```

结果：**5 passed**。另用合成 Supabase 响应执行 `npm run test:ai-e2e -- --output /tmp/quiz-ai-e2e-results-current`，结果：**11 passed**，覆盖匿名／非管理员隔离、追问归因、评估、模拟面试、薄弱点入口和草稿恢复。

本次补上练习日历对旧 `legacyId` 作答记录的稳定题目解析；题库前端 lint 及稳定导航、Lab 映射的 3 个聚焦测试均通过。上述验证仍是本地验证，未执行迁移、Edge Function 部署、Hugo 发布或正式线上发布。

## 发布前顺序

1. 等 ConceptLab 目录冻结后运行 `node scripts/sync-catalog.mjs`，再运行 `--check`。
2. 在题库仓库运行 `npm run lint && npm test && npm run build`。
3. 使用 `npm run preview:quiz` 和 `npm run test:e2e` 验证 `/quiz/` 子路径。
4. GitHub Actions Variables 保持 `VITE_CONCEPT_LAB_URL=https://yufenghuang.tech/labs/`；浏览器只接收 Supabase publishable key。
5. 由维护者另行确认 Supabase migration、Edge Function、Hugo 静态文件和正式线上发布；本轮未执行这些外部变更。
