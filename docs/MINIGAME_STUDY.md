# 小游戏客户端专题

专题入口为「小游戏客户端」，分四组共 22 题：复用 14 道公开题，新增加 8 道公开通用题。答题页显示当前可用题数；数据源尚未包含的题会列为缺题。

新题覆盖 TypeScript 数据校验、Laya 事件解绑与定时器、异步资源加载、zIndex 与合批、FontClip、平台回调幂等和 AI 代码验收；旧题补充对象池、资源、渲染等基础。回答以题干所列来源和限定条件为准，具体平台配额或引擎版本应查对应版本的官方文档。题目不包含个人项目细节。

本专题筛选排除非公开或未发布的记录。它复用现有数据源和登录权限机制，并不代替数据库的访问控制。

## 本地验证

- `npm test -- src/lib/minigameTopic.test.js src/pages/MinigameTopic.test.jsx`
- `node scripts/check-minigame-migration.mjs`：在临时数据库验证插入、旧数据保护和重复执行。
- `npx playwright test --config=playwright.minigame-static.config.js`：静态数据浏览器流程。
- `npx playwright test --config=playwright.minigame-cloud.config.js`：合成云端响应浏览器流程，不连接生产数据库。

生产云端题目需要单独应用增量迁移；更新静态数据或本地构建本身不会同步生产数据。
