# 吉比特两天冲刺：本地交付与验收

2026-10-15。用户已批准修订2并要求三套全部完成；本地实现与验收完成。没有commit/push/生产迁移，线上尚未增加本批78题。

## 直接练习

本轮保留本地静态Vite服务 `http://127.0.0.1:4181/quiz/#/topics/gbits`。使用静态题库，生产Supabase配置未修改。若服务停止，在源码仓库运行：

```bash
VITE_SUPABASE_URL= VITE_SUPABASE_PUBLISHABLE_KEY= npm run dev -- --host 127.0.0.1 --port 4181 --strictPort
```

先A卷→复盘→B卷，C卷按余力加练。90/120分钟是训练参数，不是正式考试时长。

| 卷 | 题型 | 历年考点原创变式 / 预测训练 |
| --- | --- | --- |
| A | 20单选+4填空+2编程=26 | 15 / 11 |
| B | 16单选+2填空+3编程=21 | 11 / 10 |
| C | 24单选+4填空+3编程=31 | 13 / 18 |

全部78道题面为原创，不是原卷复刻。每题在开头、标签和来源写明证据性质；历史仅支持考点类别，不代表本题条件/今年必考。公开材料缺失内容未用于反推。

## 验收证据

- `npm run lint`：通过。
- `npm test`：49文件、301测试通过。
- `VITE_SUPABASE_URL= VITE_SUPABASE_PUBLISHABLE_KEY= PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e`：本机Google Chrome，17项通过，包含原13项和新增4项。全新Vite生产构建、实际`/quiz/`子路径；三卷390px无横向溢出。
- `npm run test:gbits:cloud`：全新synthetic Supabase构建，本机Google Chrome，2项通过。真实SDK读取无solution列表；完卷前零grade RPC；完卷后按提交快照取解析；503失败不丢交卷，重试恢复；缺题禁用且不静态补齐；没有写attempts/notes/review_states或调用AI。
- `python3 scripts/check-gbits-reference.py`：原14道C++17算法，325样例/边界/差分例通过。
- `python3 scripts/gbits-sprint/verify-a.py`：20单选独立模型、4填空；4927次C++执行；消除4088穷举+350随机，破墙171穷举+300随机，2样例+5最大边界；4负向探针。
- `python3 scripts/gbits-sprint/verify-b.py --negative-probes`：7输出程序；11项结构/数学/系统独立检查；算法1805/553/3781例；3样例；6负向探针。
- `python3 scripts/gbits-sprint/verify-c.py --negative-probes`：12程序、821正向执行；24单选、4填空；算法252/253/304例，3个20万规模/64位例；5负向探针。
- `node scripts/check-gbits-sprint-migration.mjs`：隔离PGlite，旧42+新78题/答案插入；重复执行保留人工编辑、notes、attempts、review_states。临时破坏迁移被同一快照断言捕捉；没有连接生产库，不代表正式RLS验收。
- 状态机额外3个临时变异探针：去掉题型切换保护、允许更高版本、去掉陈旧窗口保护，各自使原断言失败。未修改真实运行源文件。
- `git diff --check`及新增文件空白检查通过；原220题与HEAD逐对象相等，分类未改，最终298题。题包原始JSON、公开题库和增量SQL逐对象相等。

新检查的故障注入均在临时副本或独立数据库中。验收前后记录源码哈希，避免把缓存构建/移动中的目标当通过。

## 独立审查与修正

独立UI审查未发现确定状态机bug，指出静态E2E不能证明云端边界；已补synthetic云端2项并通过。复盘同时存在reference/explanation时现均显示。

独立内容审查读完78题、三脚本、原220标题与高相似旧题全文，未发现确定答案/样例/约束错误。已核实并修正：初稿二分漏一轮、建堆叶节点位置、干扰项解释、跨卷同CRT/BST/SJF重复，以及C117历史来源表残留；A047/B078/C117保守降预测。最后窄复审确认标签与台账一致。

这些检查不能证明今年命中率、正式平台AC或官方评分线。编程仍由学习者按参考与评分点自评；没有自动记录掌握或修改SM-2。

## 关键逻辑

入口在专题的新A/B/C卡片，元数据定义26/21/31个稳定ID。新独立模拟路由不经过AnswerPanel的逐题判分。进入题型后状态机只接受该区块的编辑；提交先持久化完整快照，成功后才锁定并回到类型选择。刷新读取同一记录，已提交区块不可重开。三块都提交后才开放判分与解析；重练创建新attempt并保留旧快照。

源文件：`src/data/gbitsMockPapers.js`、`src/lib/gbitsMock.js`、`src/pages/GbitsWrittenMockPage.jsx`。记录使用独立localStorage key `iqb:gbits-written-mock-v1`，只供本机学习；不承诺防篡改、跨设备或并发原子事务。

## 发布边界

新SQL `supabase/migrations/20261015000000_gbits_sprint_pack.sql` 已准备但未应用。正式云端启用时必须发布数据，静态JSON不会补入云端列表。先获生产迁移授权，再检查migration list/dry-run；commit和push也须各自授权。旧2026-10-13授权不沿用。博客`static/quiz`未修改。

构建有既有依赖注释、混合动态导入和大块体积警告，均未阻止构建。本轮未改依赖或顺手重构。
