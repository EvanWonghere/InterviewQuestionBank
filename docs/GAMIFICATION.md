# 闯关（游戏化）

题库之上的一层闯关玩法：分类是区域，区域拆成关卡，答题得星、叠连击、涨经验和职级。它只读现有的答题记录和 SM-2 状态，不改变评分、复习计划或任何云端表。

设计稿（可试玩）：https://claude.ai/artifact/RxMh1RS6gC1Az2hCfMNV7g

## 已定的决策（2026-09-26）

1. 第三颗星必须靠之后的复习拿到，当场最多 2 星。
2. 自评题只有「重来」扣心；「困难」算过关但清零连击。
3. 地图软锁：所有分类都开放，章内关卡按顺序解锁；随机练习、分类列表、复习页不受影响。
4. 第一、二阶段不加表：星级和经验从现有记录推导，其余存在本地 store。

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

Boss、每日巡检、连签、成就和小芽进化不在第一阶段内。

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

已知限制：`bestStars`、`bonusXp` 和关卡记录只在本机；换设备后经验会从当前记录重新推导，连击奖励和关卡记录从零开始。

## 特效

- 答对：星星依次弹入、星形粒子、上浮「+N XP」；点亮第 3 颗星时加彩纸。
- 答错：HUD 抖动、心碎动画、灰色碎屑。
- 连击：数字放大；×3 起发光，×5 起闪烁变红；×3 和 ×5 时全屏橙色闪光。
- 开局：关卡名砸入。结算：标题逐字弹入、关卡星依次落下并爆粒子、经验计数、职级进度条填充，升职时大量彩纸和「PROMOTED」。
- 粒子画在一个共享的 `position: fixed` canvas 上，无粒子时停止 `requestAnimationFrame`。
- 地图页的「安静模式」和系统的「减少动态效果」都会关掉粒子、上浮文字和 CSS 动画，只保留星星和数字。

## 验证

```bash
npx vitest run src/lib/gameRules.test.js src/pages/StagePage.test.jsx src/pages/MapPage.test.jsx src/components/quiz/AnswerPanel.test.jsx
npm run lint
npm run build
```
