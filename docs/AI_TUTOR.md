# 接入管理员学习助手

当前实现兼容 Chat Completions 的流式 API。需要服务商的 API Key、Base URL（通常以 `/v1` 结尾）和 model 名称。Base URL 不包含 `/chat/completions`，代码会自动追加；不支持只提供 Responses 或 Anthropic Messages 协议的端点。

## 一次性部署

在题库仓库执行以下命令。项目 ref 是 Supabase 项目 URL 中 `https://<project-ref>.supabase.co` 的那一段。CLI 登录使用 Supabase 账号，和模型 API Key 无关。

```sh
cd '/Volumes/Atelier/Projects/Personal/Interview Question Bank'
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase migration list
npx supabase db push --dry-run
```

确认迁移历史一致，且待执行的是预期变更后，再执行 `npx supabase db push`。本功能新增 `20260916000000_ai_tutor.sql`：三张 AI 表、服务端 RPC，以及 attempts 的可空辅助标记。不应重跑旧题库导入或重置数据库。如果预览列出大量旧迁移，先核对远程已应用版本；不要直接继续。

在 Supabase 控制台 **Edge Functions → Secrets** 添加：

| 名称 | 填写内容 |
| --- | --- |
| `AI_API_KEY` | DeepSeek 密钥。只用于 DeepSeek，不要填 OpenAI 或 Jev 的密钥 |
| `OPENAI_API_KEY` | OpenAI 密钥。高难任务和均衡/保守策略的常规对话会用到 |
| `TYPESAFE_API_KEY` | Jev 密钥。只做教学决策，不生成给学生看的回答 |
| `TYPESAFE_API_BASE` | 保持 `https://api.typesafe.ai`。代码会自己请求 `/v1/systemone`，不要把路径写进这个值 |
| `AI_CREDIT_POLICY` | `aggressive`（默认）、`balanced` 或 `conservative`。不设置时按 aggressive |
| `AI_ALLOWED_ORIGINS` | Chat Completions 的 HTTPS origin，不含 `/v1` 或末尾斜杠；多个用英文逗号分隔。需要同时包含 `https://api.deepseek.com` 和 `https://api.openai.com` |

可选覆盖：`DEEPSEEK_BASE_URL`、`OPENAI_BASE_URL`、`DEEPSEEK_MODEL`（默认 `deepseek-flash`）、`OPENAI_MODEL_DEFAULT`（默认 `gpt-6-luna`）、`OPENAI_MODEL_REASONING`（默认 `gpt-6-sol`）。

额度策略：aggressive 把容易和中等的实时对话、以及评估、报告、出题交给 DeepSeek；balanced 把中等实时对话交给 Luna；conservative 把实时对话的容易和中等交给 Luna。判为高难，或 Jev 认为明显超出快速模型能力时，走 Sol，不会为了消耗额度改走 DeepSeek。管理员在「API设置」里保存的选择写在 `ai_settings.credit_policy`，优先于密钥 `AI_CREDIT_POLICY`；没保存过则用密钥，密钥也没有时按 aggressive。OpenAI 在出字前遇到超时、429、5xx 或网络错误时，同一用户请求回退一次 DeepSeek。流式聊天的回退必须还留在同一次 90 秒预算内。Jev 失败时用阶段默认教学动作继续，不因此失败整次提问。答前和实验预测阶段默认不直接给结论。

Key 不填写在网页、VITE 环境变量、聊天消息或 Git 仓库中。Supabase 托管函数自动提供 `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`；当前函数使用这些内置变量。若项目停用了 legacy keys，需要先适配函数的服务端客户端配置。

```sh
npx supabase functions deploy ai-tutor
```

保留默认 JWT 校验。函数内部还会调用 `auth.getUser(token)` 验证登录，并查询当前 `is_app_admin` 权限；不能仅靠前端隐藏按钮限制访问。

前端需要另行构建和发布。当前仓库 main 的既有 CI 会发布题库前端；发布前先通过 lint、测试和 build，并确认数据库与函数已部署。只部署函数不会让线上网页出现按钮。

## 网页配置与使用

1. 通过既有 GitHub 登录进入管理员账号，打开一题并点击“问学习助手”。模拟面试进行中不显示助手。
2. 打开“API设置”。网页不再填写 Base URL 或 model。这里保存思考强度和额度策略，并显示 DeepSeek、OpenAI、Jev 密钥是否已在服务端配置。额度策略没保存过时，沿用服务端密钥 `AI_CREDIT_POLICY`；保存后以网页上的选择为准。
3. 点击“测试连接”。这会分别向 DeepSeek、Luna 和 Sol 发送固定测试文本，并逐项显示可用、失败或未测试。三者都通过才算成功；不使用回退掩盖单个模型的故障。缺少 OpenAI 密钥时，Luna 和 Sol 显示为未测试，而不是报整次成功。Jev 固定显示为未测试。可能产生三次少量调用费用。
4. 先用一题试问：答前提示、提交后追问、刷新历史、编辑后追加笔记。发送前可展开“本次会发送什么”；附带本题笔记默认关闭。

教练默认先回答具体疑问，再按需提供反例/变式；可用 Unity 项目联系、C#/C++ 对照和面试追问。答前不发送参考解析；明确要求完整解释时可直接讲解。AI 不改变分数或掌握状态，答前读过助手内容会标记辅助作答。历史按管理员和题目保存，不发送其他题目或整个学习档案。

答后阶段还会附上本题最近一条完整评估链的摘要（`myEvaluation`）：按轮次标注 `kind`，每轮 `weaknesses` 只含该轮回答自身的问题，`unresolved` 是原题仍未纠正的缺口。这样可以直接追问「为什么这轮判我错」。方向是单向的——聊天永远不写 `ai_evaluations`，聊天内容也不会进入评估材料，避免污染实测。答前阶段不发送评估结论。

上下文提示分成两种，不再混用一个标志：`truncated` 表示更早对话超出条数或长度预算而未发送，`phaseFiltered` 表示按学习阶段刻意不发送（例如答前不发答后对话）。服务端多取一条历史就是为了把「取满 20 条」和「按阶段过滤」区分开。

## AI 评估、追问、模拟面试与薄弱点

新增两个迁移，需与函数一起部署（先 `npx supabase db push --dry-run` 核对，再 `db push`，然后 `npx supabase functions deploy ai-tutor`）：

- `20260917000000_practice_calendar.sql`：首页刷题日历的按天聚合 `practice_calendar` 与当天明细 `practice_day`（security invoker，只返回本人记录）。
- `20260917001000_ai_evaluations.sql`：`ai_evaluations`（评估与追问链）、`ai_reports`（面试报告、薄弱点建议）、`attempts.ai_evaluation_id`，以及只授予 service_role 的 `ai_begin_evaluation` / `ai_begin_report`；同时重建 `practice_calendar` 以返回 AI 均分和模拟面试标记。

使用方式：

1. **刷题评估**：提交后点击“AI 评估我的回答”。AI 对照参考答案与评分标准给出分数、维度、优缺点和薄弱点，并可针对最关键的薄弱点追问（最多 3 轮追问）。评分按钮上会标出“AI 建议”、错误原因会预选，但**必须由你点击评分**才会写入复习计划；AI 建议与客观题判分冲突时以判分为准。
2. **模拟面试**：管理员作答后 AI 面试官自动评估并最多追问 2 轮，此时不显示参考答案；结束或跳过追问后再揭晓参考答案并自评。复盘页自动生成一次本场报告，重进复盘读取已保存的报告。AI 未配置或非管理员时回到原流程。
3. **薄弱点**：“薄弱知识点”页汇总最近 200 次 AI 评估中的薄弱点（同一题同一薄弱点只计一次），可按需生成 AI 学习建议。每个薄弱点会标出**最近一轮评估是否仍列出它**（`openQuestionIds`）：追问里纠正过的问题不再算作当前仍未解决，但卡片只陈述这一观察，不代表已掌握，也不会自动清除记录。同一个缺口被追问轮改写成「原题仍未纠正：…」时只算一条。

模拟面试报告按轮次接收材料：每轮标 `kind`（`original` / `follow_up`）、`chainScore`（该轮结束时的综合掌握）与 `answerScore`（仅追问轮，这一轮回答自身的分），`weaknesses` 只含该轮回答暴露的问题；原题遗留缺口作为题目级 `unresolved` 只出现一次。提示词明确要求：同一问题同时出现在 `unresolved` 和某轮 `weaknesses` 不算「反复出现」。

费用与限制：每次评估、每轮追问、每份报告都是一次非流式模型调用，与聊天共用每分钟 10 次限额；仅在点击或进入模拟面试评估时发起。评估要求模型返回 JSON，未使用服务商的 JSON mode；若模型输出无法解析，会记为失败并提示重试（重试是新请求，会再次计费）。网络中断后的“重试”沿用原请求 ID，已完成的结果直接返回，不会重复调用。

## 作答回显与追问入库

- 提交后始终显示“我的回答”（文本原样、选项标记、填空逐项），作答历史和模拟面试复盘中可展开查看。
- AI 评估会对每轮追问回答单独打分（`followUpAnswerScore`）。发送给模型的 `rounds` 会标明 `kind`（`original` / `follow_up`）和 `evaluate`：只有当前轮的 `answer` 算“这轮说过的话”；`weaknesses` 必须带 `origin`（`this_answer` 或 `unresolved`），界面把两者分开显示，避免把原题错误写成追问里又说了一遍。低于 70 分时提示“掌握不牢”，可点“加入题库”：选择题型（或让 AI 选择：概念辨析→单选/多选、术语→填空、原理→简答、C#/C++ 实现→算法题、设计任务→工程任务），AI 生成题干、选项/填空、参考实现、评分要点与解析；预览并调整标题、分类、难度、标签后保存。入库出题仍发送原题、更早追问和全部薄弱点作背景，但会标明哪些是这轮回答暴露的、哪些是原题未纠正的缺口。
- 线上已有、未带 `origin` 的追问评估仍会显示在“待加强”，并注明可能混入原题未纠正的问题；要让新评估真正拆开，需要重新部署 `ai-tutor` 并发布前端。
- 「这轮追问回答得分」只在评估确实返回了 `followUpAnswerScore` 时显示。旧记录只有整条链的综合分，界面改为标注“综合掌握 N（无本轮单独评分）”，不再把综合分冒充本轮得分；“待入库的追问”列表同样区分这两种来源。
- 挂在作答记录上的错误原因只取原题作答暴露的问题，以及追问轮中 `origin=unresolved` 的遗留项；只在追问里出现的失误（`origin=this_answer`）不会预选进这次 attempt 的错误原因。
- 生成接口 `draft-question` 只生成、不写库；保存沿用题目编辑器的 `questionSchema` 校验与 `saveQuestion`，一律为**私有草稿**（管理员练习列表可直接刷到，公开发布请在编辑器确认）。生成计入每分钟 10 次限额。
- 迁移 `20260918000000_question_origin.sql` 为题目增加 `origin_kind`、`origin_evaluation_id` 和 `origin_weakness_tag`，用于显示“已加入题库”和“已出过 N 道”。**必须先执行该迁移再发布前端**，否则题目列表查询会因缺少列而失败（公开页面也会受影响）。
- 模拟面试进行中不打断：面试结束后在“薄弱知识点 → 待入库的追问”中处理低分追问。
- **针对薄弱点出题**：“薄弱知识点”页每个 AI 薄弱点卡片可“针对性出题”，一次 1–3 道，可让 AI 搭配题型或逐道指定。服务端 `draft-weakness-questions` 会根据你自己的评估记录重新聚合该薄弱点（前端传入的标签只用于查找），把相关题目和参考答案作为背景，并附上已有同类题目的标题，要求避免重复。每道题单独预览、编辑，只保存勾选的题；来源记为 `origin_kind = 'weakness'` 和 `origin_weakness_tag`，卡片上会显示“已为此薄弱点出过 N 道”。多题回复的输出预算加倍，但仍受 90 秒超时限制。

## 音乐练习室助手（`music-*`）

博客 `/study/music/` 的管理员 AI 与题库共用本函数。`index.ts` 把 `music-` 前缀的 action 交给 `music.ts`，方式与 `lab-` 交给 `labs.ts` 相同；登录与 `is_app_admin` 校验在分流之前完成。

- 动作：`music-chat`（`kind` 为 `lesson` 讲解、`homework` 作业、`composition` 作曲点评）、`music-history`、`music-clear`。非流式 JSON 响应。
- 判分、进度和复习仍只在浏览器里由确定性代码计算。本函数只写 `music_messages`，系统提示禁止宣布掌握、改成绩或勾选作业；进度快照、作业勾选、日志和 ABC 源码都作为不可信数据放在用户消息里。
- 课程内容来自生成文件 `musicCatalog.json`（博客仓库 `node tools/export-music-catalog.mjs <本仓库路径>`），不含小测题与答案。前端发送每课的 `subjectVersion`，与目录不一致时返回 409，提示等待目录同步。历史列表和回放给模型的上下文只取当前目录版本的对话。
- `homework` 走 `hint` 阶段路由（先提示、不代做），`lesson` 与 `composition` 走 `review`。
- 迁移 `20260925000000_music_ai.sql`：`music_messages`（仅本人且仍是管理员可读，浏览器不能写）、`music_begin`、`music_clear`。同一 `requestId` 重发时，已完成返回原回复且不调模型，运行中返回 `settled: false`，已失败返回 `settled: true`；内容哈希不同返回 `request_context_conflict`。部分唯一索引保证每人同时只有一个进行中的音乐请求。与题库共用每分钟 10 次限额，但不互相阻塞。表中预留了后续编曲提案用的 `arrangement` 类型和 `payload` 列。
- vibe 编曲：`music-arrange` 由 `musicArrange.ts` 处理，走任务路由（与出题相同的 `batch` 档，JSON 输出）。请求带整份编曲（≤24 KB）、范围、页面规则检查结果与描述；服务端用 `arrangement/` 中与页面相同的模块校验文档，要求模型只返回 `{summary, ops}`，并对 ops 试应用。不合格时把校验错误回给模型修正一次，仍不合格则记为失败、返回 422，不返回半成品。成功时 `music_messages` 的 assistant 行保存说明（body）与操作（payload），`subject_version` 是编曲内容的 SHA-256；同一 `requestId` 重发直接返回保存的提案。服务端不修改编曲，由页面预览并经管理员接受后应用。`music-history` 对 `arrangement` 不按版本过滤，并返回 payload。
- AI 写 Strudel：`music-strudel` 由 `musicStrudel.ts` 处理，同样走 `batch` 任务路由。请求带当前即兴手稿（≤12000 字符）、`workId` 与描述；模型只返回 `{summary, code}`，`code` ≤6000 字符，并按博客沙箱离线可用的音色书写。服务端按白名单检查代码：顶层名称只能是 Strudel 函数名（`STRUDEL_GLOBALS`）或片段自己声明的常量与箭头函数参数；不能访问 `.constructor`、`.prototype`、`.call` 等成员，不能用方括号取属性、模板插值、`new` 或 `this`，不能含网址。修正一次仍不合格记为失败并返回 422。沙箱的 CSP 已挡住 fetch、图片、样式与子框架，但挡不住沙箱页面自己跳转，所以服务端这一层不能省略；不过它仍不是唯一的防线：代码在博客页面上只以文本显示，只有管理员点击试听时才在不透明来源的 `<iframe sandbox="allow-scripts">` 里运行，追加或替换手稿也由管理员决定。成功时 assistant 行保存说明（body）与代码（`payload.code`），`subject_version` 是手稿的 SHA-256；同一 `requestId` 重发返回保存的片段。`music-history`/`music-clear` 接受 `kind: 'strudel'`，历史不按版本过滤。
- 迁移 `20260926000000_music_strudel.sql` 只把 `music_messages.kind` 的检查约束扩展为包含 `strudel`，不改表结构、函数或 RLS。须先于带 `music-strudel` 的函数部署；未应用时 `music_begin` 的插入被约束拒绝，该请求失败，不影响其他动作。
- 云端作品同步（不经过 ai-tutor）：迁移 `20260927000000_music_works.sql` 新建 `music_works`（`kind` 为 `score`/`live`/`arrangement`，`body` 为 jsonb，删除后为 null 并保留墓碑）。博客的 `sync.mjs` 在管理员登录后用自己的会话直接读写该表：RLS 只允许 `user_id = auth.uid()` 且仍是管理员，只授予 authenticated 角色 select/insert/update，不能硬删除。触发器 `private.music_works_guard` 由服务端分配版本号（插入为 1、每次更新 +1），禁止改主键，每类最多 50 首未删除作品，全部 body 合计不超过 8 MB。浏览器更新时附带 `revision = 基准版本` 条件，云端已更新则影响 0 行，由博客按冲突处理（两份都保留）。练习进度不写入此表。
- 发布顺序：先 `db push` 该迁移，再部署函数，再把 `https://yufenghuang.tech/study/music/` 加入 Auth 重定向白名单，最后在博客打开 `params.musicAI.enabled`。回退时先关博客开关；函数回退到上一版后 `music-*` 返回“未知操作”，不影响题库和实验室。

## 排错与验收边界

可靠性更新（2026-09-17）：同一账号的后台登录通知和 token 刷新只复核权限，不卸载正在使用的聊天、评估和追问；确认退出、换号或失去权限仍会关闭助手。未发送的聊天草稿按账号与题目缓存在当前标签页，关闭助手再打开可恢复；失败时保留输入，退出或换号清理。标签页被系统丢弃、设备休眠或实际断网仍可能中断请求，聊天可从云端历史核对已保存部分。

登录过期的 401 请求会刷新登录后重试一次，沿用原请求 ID；网络错误、网关超时和“仍在生成”不会自动再次调用模型。评估与报告只有在服务端明确确认失败后才换新请求 ID。

思考模式更新（迁移 `20260917002000_ai_reasoning_settings.sql`）：聊天、AI 评估、面试报告、薄弱点建议和连接测试统一使用“API设置 → 思考强度”，默认 `high`，可选关闭/低/高/最大。DeepSeek 收到 `thinking` 与 `reasoning_effort`；OpenAI 只收到 `reasoning_effort`，不收到 DeepSeek 的 `thinking` 对象。评估与报告对这两家都启用 JSON Output（`response_format: json_object`），若服务商以 400 拒绝该参数，会去掉它重试一次（400 不产生生成费用），服务端仍严格校验 JSON。

多模型路由（迁移 `20260922120000_ai_model_routing.sql`）：`ai_messages` 与 `lab_messages` 增加可空的 `provider`、`model_tier`、`pedagogy_action`、`fallback_used`。2026-09-22 已应用到 `vtbwqnigocrbpmbkbiiv`，并部署了带路由的 `ai-tutor`。设置接口仍返回已保存的 `base_url` 与 `model`，给尚未刷新的旧页面用；生成不再读取这两列。设置页随这次前端发布改为显示额度策略和密钥状态。2026-09-22 晚间用已登录的本机 Chrome，在旧设置页对「3D 中判断目标左右方位与坐标系手性」发了一条答前提示。回复完成，历史里 `provider=deepseek`、`model=deepseek-flash`、`model_tier=fast`、`pedagogy_action=GIVE_HINT`、`fallback_used=false`。同一请求 ID 重试不会再次调用模型。还没在生产里单独证实 Jev 调用成功，也还没测 OpenAI、高难档、评估、报告和实验教练。

预算与超时：思考 token 计入输出上限，因此开启思考时每次输出预算为 8192 token，关闭时为 4096。DeepSeek 使用 `max_tokens`；OpenAI 使用 `max_completion_tokens`，因为 GPT-6 会以 400 拒绝 `max_tokens`。服务端对单次模型调用最多等待 90 秒，浏览器等待 120 秒，数据库把超过 150 秒仍在运行的请求判定为中断（原为 90 秒，否则慢但正常的生成会被误判失败）。连接测试与真实生成使用相同的思考强度、预算和超时。流式聊天在模型思考期间会显示“思考中…”，思考内容本身不转发；评估和报告显示已等待秒数。若频繁超时或提示达到长度上限，先把思考强度降为“低”。参考：[思考模式](https://api-docs.deepseek.com/guides/thinking_mode/)、[JSON Output](https://api-docs.deepseek.com/guides/json_mode)。输出截断、模型格式错误、上游密钥/余额/限流以及超时分别提示，不回显上游敏感响应。

- 无按钮：检查当前账号是否在 `app_admins` 中，以及是否在模拟面试中。未配置 Supabase 的静态模式没有管理员助手。
- 提示未配置 Key：检查 Edge Function 所属项目与 Secrets，注意变量名称大小写。
- 请求失败：核对 `AI_ALLOWED_ORIGINS` 是否同时包含 DeepSeek 与 OpenAI 的 origin，以及服务商是否支持流式 Chat Completions 和 `max_tokens`。高难任务还需要 `OPENAI_API_KEY`。
- 401：重新登录，查看函数日志区分平台 JWT 校验与函数返回的登录失效；不要直接关闭鉴权来处理。
- 403：检查当前账号的管理员权限。
- 429：每个管理员每分钟最多 10 次生成/连接测试，稍后再试。
- 网络中断：先刷新历史核对。重复 request ID 不会重复生成；点击“重新提问”后发送属于新请求，可能再次计费。
- 笔记冲突：保留待追加内容，待原笔记同步后刷新再追加。跨设备手工编辑仍应避免同时覆盖同一份笔记。

当前本地证据包括单元/组件测试、合成 SQL/RLS 检查和模拟 API 的浏览器流程。它们不等于真实 Supabase 部署或真实服务商兼容性验收；部署后仍需以上述一题流程实测。

参考：[Supabase 部署函数](https://supabase.com/docs/guides/functions/deploy)、[函数认证](https://supabase.com/docs/guides/functions/auth)、[环境变量与 Secrets](https://supabase.com/docs/guides/functions/secrets)。
