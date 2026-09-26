# 闯关（游戏化）

题库之上的一层闯关玩法：分类是区域，区域拆成关卡，答题得星、叠连击、涨经验和职级。它只读现有的答题记录和 SM-2 状态，不改变评分、复习计划或任何云端表。

设计稿（可试玩）：https://claude.ai/artifact/RxMh1RS6gC1Az2hCfMNV7g

## 已定的决策（2026-09-26）

1. 第三颗星必须靠之后的复习拿到，当场最多 2 星。
2. 自评题只有「重来」扣心；「困难」算过关但清零连击。
3. 地图软锁：所有分类都开放，章内关卡按顺序解锁；随机练习、分类列表、复习页不受影响。
4. 第一、二阶段不加表：星级和经验从现有记录推导，其余存在本地 store。第三阶段为管理员加了 `game_progress` 做跨设备同步。

## 第一阶段范围

| 部分 | 位置 |
|---|---|
| 规则（纯函数） | `src/lib/gameRules.js`，测试 `gameRules.test.js` |
| 本地状态 | `src/store/gameStore.js`（localStorage `iqb:game`） |
| 经验与职级 hook | `src/hooks/useGameProgress.js` |
| 地图 | `src/pages/MapPage.jsx`，路由 `#/map` |
| 关卡 | `src/pages/StagePage.jsx`，路由 `#/stage/:categoryId/:index` |
| HUD、结算、星星 | `src/components/game/StageHud.jsx`、`StageResult.jsx`、`Stars.jsx` |
| 特效 | `src/components/game/effects.js`，样式 `game.css`、`stage.css`、`map.css` |

`AnswerPanel` 的 `onRated(status)` 增加了第二个参数 `{ quality, correct, assisted, aiScore }`，原有调用方不受影响。

## 第二阶段范围

| 部分 | 位置 |
|---|---|
| 每日巡检 | `src/pages/PatrolPage.jsx`，路由 `#/patrol`；关卡运行逻辑抽到 `src/components/game/StageRun.jsx`，关卡和巡检共用 |
| 连签、补签卡、成就、小芽形态 | `gameRules.js` 的 `streakFrom`、`ACHIEVEMENTS`、`petForm`；`useGameProgress` 一并返回 |
| 小芽形态 | `src/components/pet/petGrowth.js`，只替换帧的前三行（叶子）；`pixelPetSprites.js` 不动，ConceptLab 那份副本不用同步 |
| 地图页 | 巡检入口、连签和补签卡、成就墙 |
| 结算页 | 新成就只提示一次（`gameStore.seenAchievements`），显示连签天数 |

## 第三阶段范围

| 部分 | 位置 |
|---|---|
| 跨设备同步 | 迁移 `supabase/migrations/20260929000000_game_progress.sql`（2026-09-26 经批准已应用），`src/data/gameRepository.js`，`src/hooks/useGameSync.js` |
| 章末 Boss | `src/pages/BossPage.jsx`，路由 `#/boss/<分类 slug>`；`BossSprite.jsx`、`boss.css` |
| 提示卡、追问复活 | `StageRun.jsx`；`AnswerPanel` 新增可选参数 `onEvaluated`、`onAssistance`、`hintEnabled` |
| 弱点副本 | `src/lib/weakDungeon.js`，`src/pages/DungeonPage.jsx`，路由 `#/dungeon` |
| 地图 | Boss 入口、每日剩余次数、弱点副本卡片 |

四个 AI 玩法都复用 `ai-tutor` 现有的作答评估（含追问）、面试报告和学习助手，没有改 Edge Function。

## 规则

### 分关

- 只算 `status === 'published'` 的题，草稿不会挪动关卡边界。
- 分类内按难度（easy → medium → hard）、`order`、`id` 排序，分成 `ceil(n / 6)` 关，每关题数尽量均匀（n ≥ 4 时每关 4–6 题）。
- 关卡键是 `categoryId:序号`。题目增删会让边界移动，本地记录仍按序号对应；第三阶段再考虑固定关卡号。

### 一题的星

局内（本次作答）：

| 情况 | 星 |
|---|---|
| 客观题答错 / 自评「重来」 | 0，扣 1 颗心 |
| 自评「困难」，或作答前问过小芽（`assistance_used`） | 1 |
| 自评「良好」「简单」且没用提示 | 2 |

当前星级（地图用，`currentStars`）从 SM-2 状态推导：`lastQuality < 3` 为 0；`= 3` 为 1；最近一次作答用过提示为 1；`≥ 4` 为 2；`repetitions ≥ 2` 且这段连续通过跨了两个自然日时为 3（同一天连答两次不算复习）。如果连续通过的记录已经滚出 500 条窗口，就直接信任 SM-2 的 `repetitions`。复习失败后当前星会降，地图上的关卡星也跟着降。

### 关卡的星

通关 1 星；不掉心通关 2 星；关内每题当前都是 3 星时为 3 星。从没玩过、但每题当前都 ≥ 2 星的关算已通关（1 星），这样已有的练习记录能直接解锁地图。

### 连击

2 星答题 +1；问过小芽的 1 星保持不变；其余清零。连击 ≥ 2 时 2 星答题的经验加 `(连击 − 1) × 10%`，最多 +50%。

### 经验和职级

`attempts` 本地和云端都只保留最近 500 条，所以经验不按作答次数累加，而是：

- 每题按**历史最高星**计：基础分（easy 10 / medium 20 / hard 35）× `[0, 0.6, 1, 2.5][星]`。历史最高星是本地高水位（`gameStore.bestStars`）与当前推导值取大，复习失败不会扣经验。
- 每次失误（`lapseCount`）+5。
- 加上本地累计的连击奖励（`gameStore.bonusXp`）。

职级门槛：实习生 0、初级客户端 300、中级客户端 900、高级客户端 2000、资深客户端 3800、技术专家 6500、主程 10000。178 题首刷全 2 星约 4205 经验。

局内「+N XP」显示的是真实增量（最高星的提升 + 失误经验 + 连击奖励）；重玩已拿过星的题，增量可能为 0。

管理员的 `bestStars`、`bonusXp` 和关卡记录经 `game_progress` 跨设备同步；访客只在本机。

### 每日巡检

`dueAt` 已到的已发布题，按到期时间最早的排前，每次最多 8 题。巡检不扣心、不会失败，是点亮第 3 颗星的主要入口。完成后记为 `patrol:YYYY-MM-DD`。

### 连签和补签卡

某个本地自然日至少答了一题（任何页面，按 `attempts` 推导，管理员跨设备一致），这一天就算签到。原设计是「完成一关或巡检才算」，实现时放宽了，这样随机练习和复习页也能续签，数据也不用另存。

从第一个签到日重放到今天：签到日连签 +1，连签每满 7 天得 1 张补签卡（最多 2 张）；漏掉的一天自动消耗一张卡、连签不断，没有卡就清零。今天还没答题时不算断签。作答记录只留最近 500 条，更早的签到会丢，连签可能偏小。

### 小芽形态

职级 LV1–2 小芽、LV3–4 双叶、LV5 起开花；到期题 ≥ 10 道时打蔫。只在地图、关卡和结算页生效，悬浮的学习助手小芽不变。

### 成就

| 成就 | 条件 |
|---|---|
| 第一关 | 通关任意一关 |
| 零 GC | C# 基础（slug `csharp-basics`）任一关同一次无伤且没问小芽 |
| 稳定 60 帧 | 一关内连击达到 6 |
| 独立开发 | 最近作答里连续 20 题没问小芽 |
| 未定义行为 | 一道错过 3 次的 C++ 基础（`cpp-basics`）题当前 3 星 |
| IL2CPP 幸存者 | 所有已发布困难题历史最高星 ≥ 2 |
| 三次握手 | 连续 3 天完成每日巡检 |
| 长期支持 | 连签 30 天（补签卡算数） |

成就从记录推导，只有「已提示过」存在本地；换设备后已解锁的成就会在下一次结算再提示一次。

### 跨设备同步

只对管理员开启，访客和 AI 会员仍只存本地。`game_progress` 每个管理员一行，保存关卡、巡检、Boss 记录，每题历史最高星，连击奖励经验，已提示过的成就。浏览器只能调用 `game_progress_merge`，不能直接写表。合并与顺序无关：布尔取或、数字取大、时间取晚、最高星只升不降、成就取并集。连击奖励按「上次同步后新增的量」（`pendingBonus`）累加，单次最多 10000。

`useGameSync` 在管理员的云端作答记录加载完成后合并一次，之后每次本地变化（`localRev`）1.5 秒防抖再合并。失败只保留在本地，等下一次变化再试，不会反复重试。客户端的 `mergeRecords` / `maxStars` 与 SQL 同规则。旧版本本地攒下的连击奖励在第一次同步时整体补传（store 版本 1 的迁移）。已知取舍：请求成功但响应丢失时，这次的奖励增量下次会再加一遍。

### 章末 Boss

本章每关都 ≥ 2 星后解锁。牌组是本章已发布的困难题随机 3 道，不够用中等题补。面试官 100 点血：

- 管理员走模拟面试模式的 AI 评估：每题伤害等于首答和追问里最高 AI 分数的一半，追问把分数提高算暴击；作答自评不再额外加伤害。结束后显示本场「面试官战报」（现有面试报告，一次模型调用）。
- 没有 AI 时按自评算：重来 0、困难 20、良好 35、简单 40。
- 血量归零即 K.O.，提前结算。每天最多 3 场（`fightDay` / `fightsToday`，按本地自然日），记最高伤害 `bestDamage` 和是否击败过 `defeated`。中途离开的场次不计数。
- 每章的面试官名字和台词是手写的，不调用模型。

### 提示卡

只对管理员（学习助手本来就只对管理员开放）。每关 2 张；连击第一次到 5 时再送 1 张。作答前第一次问小芽用掉一张（同一题不重复扣）；用完后作答前不能再问，提交后查看解析时照常可以问。星级规则不变：问过的题最多 1 星。巡检和弱点副本同样适用。

### 追问复活

只对管理员、只在有心的关卡里。扣心后，这题的 AI 评估（练习模式要手动点开）如果给出追问，追问轮次（`round > 1`）得分 ≥ 60 就补回 1 颗心，每关一次；心归零时复活可以接着打。复活过的关不算无伤（`flawless` 看这一轮有没有 0 星答题，不看剩余心数）。

### 弱点副本

标签权重 = 带这个标签的题的失误次数之和，管理员再加上 AI 评估弱点汇总里每个标签 `count × 2`。按权重从高到低，取第一个至少有 3 道已发布题的标签，题目按当前星级从低到高、失误从多到少排，取 5 道，3 颗心。记录键 `dungeon:1`。地图卡片只看本地失误，不去拉评估记录，所以地图和副本页选中的标签偶尔会不同。原方案里「通关后该标签在巡检中优先」没有做。

### 新增成就

「拿到 Offer」（击败任意一章的面试官）和「合批大师」（击败「渲染与图形学」的面试官），成就共 10 个。Boss 结算页不提示新成就，下一次关卡结算和地图成就墙会显示。

## 特效

- 答对：星星依次弹入、星形粒子、上浮「+N XP」；点亮第 3 颗星时加彩纸。
- 答错：HUD 抖动、心碎动画、灰色碎屑。
- 连击：数字放大；×3 起发光，×5 起闪烁变红；×3 和 ×5 时全屏橙色闪光。
- 开局：关卡名砸入。结算：标题逐字弹入、关卡星依次落下并爆粒子、经验计数、职级进度条填充，升职时大量彩纸和「PROMOTED」。
- 粒子画在一个共享的 `position: fixed` canvas 上，无粒子时停止 `requestAnimationFrame`。
- 地图页的「安静模式」和系统的「减少动态效果」都会关掉粒子、上浮文字和 CSS 动画，只保留星星和数字。

## 验证

```bash
npx vitest run src/lib/gameRules.test.js src/lib/weakDungeon.test.js src/hooks/useGameSync.test.jsx src/pages/StagePage.test.jsx src/pages/PatrolPage.test.jsx src/pages/BossPage.test.jsx src/pages/DungeonPage.test.jsx src/pages/MapPage.test.jsx src/components/quiz/AnswerPanel.test.jsx
npm run test:ai-db   # game_progress 合并与权限
npm run lint
npm run build
```
