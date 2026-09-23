# AI 路由与 ConceptLab 验收 · 2026-09-23

目标：检查用户更新后的代码，重点验证路由、恢复、权限和旧题库兼容性。范围：当前题库提交 7b0e6ba 与 ConceptLab 工作树；本轮仅验收，不修改路由实现或生产配置。失败下一步：先修复下列超时和策略一致性问题，再增加对应集成用例。

## 发现

### P1：非流式回退总时限超过客户端和数据库生命周期

`supabase/functions/ai-tutor/modelClient.js:101-107` 在 OpenAI 失败后重新调用 `callModel`；后者第 7 行每次建立独立 90000 ms 超时。合成 fetch 复现得到 `calls=2, separateTimeoutBudgets=[90000,90000], totalAllowedMs=180000`。Lab 路由还可能先花最多 8 秒做 Jev 判定。

题库 `src/data/aiRepository.js:8` 在 120 秒终止等待；`labs.ts:57` 和 lab_begin / ai_begin_evaluation / ai_begin_report 仍按 150 秒清理 running。举例：首模型 90 秒超时，备选在第 160 秒完成；第 151 秒刷新历史会将它标成 failed，后续 `labs.ts:118` 或 evaluate.ts 的 running 条件保存不再匹配。用户得到超时／失败，即使第二个模型已经生成并可能计费。需要共享整次请求 deadline，且与客户端、SQL 过期阈值协调，不能只延长单个模型超时。流式聊天已有共享剩余预算，不是本问题的主要路径。

### P2：额度策略界面与评估实际路由不一致

`src/components/ai/TutorPanel.jsx:10-11` 两项说明都称评估仍走 DeepSeek，但 `router.js:124-126` 把 evaluate 设为 medium，`selectRoute:78-79` 会在 balanced/conservative 选 Luna。调用实际 planTaskTurn 的合成检查结果为 aggressive=deepseek、balanced=openai、conservative=openai。应确定产品规则后使界面与服务端一致，并测试完整 action×policy 映射。

### P2：连接测试未覆盖高难路由

`index.ts:65-67` 仅测试 DeepSeek 和 Luna 即返回 ok，从不调用 Sol 或 Jev。Luna 可用而 Sol 模型名、权限或参数不可用时，连接测试仍成功，高难问题才失败。建议分别返回各模型的探测结果（未测也明确显示），至少覆盖实际启用的 Sol。此项为代码路径确认，不声称线上 Sol 当前不可用。

## 当前通过的验证

- ConceptLab 单元：6 文件、99 项通过。
- 题库单元：29 文件、171 项通过。
- Edge 入口与 Lab：Deno 23 项通过，含匿名／非管理员拒绝、去重和权限撤销。
- 两个前端生产构建通过；仍有大 chunk 提示。
- 题库合成 AI 浏览器：11 项通过。
- Lab 完整浏览器：52 项全部通过（3.7 min），含新增教学代码随参数变化、运行前隐藏结果、恢复、同步冲突和 AI 请求来源隔离。
- `sync:catalog -- --check`：Catalog and quiz mapping match。
- ConceptLab `git diff --check` 仍报告两个 Unity 材质文件共四处尾随空格；不影响功能，未在本次审查修改。

这些合成测试不包含真实服务商模型可用性、实际延迟和费用；本轮未发送私人学习内容、未调用付费模型、未更改生产数据。旧 PROGRESS.md 仍有中断前状态，不作为本次证据。

## P1 修复 · 2026-09-23

本地已修复，尚未部署：Edge 在读取请求后创建一个 90 秒 deadline，并传入 Lab 教练、非流式评估／报告／出题及连接测试。模型回退沿用同一 deadline，只获得剩余时间；截止时间已过时不启动第二家模型。Lab 的 Jev 判断所花时间从后续模型预算中扣除，响应正文读取同样受剩余 signal 限制。超时错误保持原分类、请求 ID 与入库失败处理；不修改 120 秒客户端和 150 秒数据库阈值，不改模型或 high 思考配置。

新增四个合成回归：80 秒后回退仅剩 10 秒且及时响应成功；90 秒耗尽不回退；迟到的回退结果拒绝；Jev 消耗 8 秒后生成预算为 82 秒。题库完整单元 30 文件 175 项通过；Deno Edge/Lab 23 项通过；git diff --check 通过。本轮只修 P1；P2 策略文案和 Sol 探测保持待处理。发布只需要更新 ai-tutor 函数，无数据库迁移及前端发布需求。

## P2 额度策略一致性修复 · 2026-09-23

按现有设置页约定修正服务端：三种策略下，普通评估、报告与出题统一使用 DeepSeek。交互提问继续按策略和难度选择；显式判为高难或强推理时仍优先 Sol。当前非交互入口仍采用既有 medium 分类，此修复没有新增难度识别。

新增 15 个策略×action 测试，以及 3 个高难／强推理优先级测试。完整单元 193 项、Edge/Lab 23 项通过，git diff --check 通过。保留 P1 的共享超时修复；本轮未部署，Sol 连接探测仍待处理。

## P2 连接测试修复 · 2026-09-23

连接测试改为逐项返回 DeepSeek、Luna、Sol 和 Jev。前三个在密钥存在时各发一次固定文本，共用同一次 90 秒 deadline，不通过回退掩盖失败。任一生成模型失败时，其余结果仍返回，整次 `ok` 为 false。缺少 OpenAI 密钥时 Luna 和 Sol 标为未测试，不报整次成功。Jev 固定标为未测试。设置页按可用、失败、未测试显示。本地修复，尚未部署。
