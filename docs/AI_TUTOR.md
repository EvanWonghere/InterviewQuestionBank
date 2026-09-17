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
| `AI_API_KEY` | 模型服务商给你的密钥 |
| `AI_ALLOWED_ORIGINS` | Base URL 的 HTTPS origin，例如 `https://api.example.com`，不含 `/v1` 或末尾斜杠；多个用英文逗号分隔 |

Key 不填写在网页、VITE 环境变量、聊天消息或 Git 仓库中。Supabase 托管函数自动提供 `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`；当前函数使用这些内置变量。若项目停用了 legacy keys，需要先适配函数的服务端客户端配置。

```sh
npx supabase functions deploy ai-tutor
```

保留默认 JWT 校验。函数内部还会调用 `auth.getUser(token)` 验证登录，并查询当前 `is_app_admin` 权限；不能仅靠前端隐藏按钮限制访问。

前端需要另行构建和发布。当前仓库 main 的既有 CI 会发布题库前端；发布前先通过 lint、测试和 build，并确认数据库与函数已部署。只部署函数不会让线上网页出现按钮。

## 网页配置与使用

1. 通过既有 GitHub 登录进入管理员账号，打开一题并点击“问学习助手”。模拟面试进行中不显示助手。
2. 打开“API设置”，填写 Base URL 与 model，点击“保存设置”。例如 Base URL 为 `https://api.example.com/v1` 时，上面的允许 origin 应填写 `https://api.example.com`。
3. 点击“测试连接”。这会调用真实模型，仅发送固定测试文本，仍可能产生少量费用。
4. 先用一题试问：答前提示、提交后追问、刷新历史、编辑后追加笔记。发送前可展开“本次会发送什么”；附带本题笔记默认关闭。

教练默认先回答具体疑问，再按需提供反例/变式；可用 Unity 项目联系、C#/C++ 对照和面试追问。答前不发送参考解析；明确要求完整解释时可直接讲解。AI 不改变分数或掌握状态，答前读过助手内容会标记辅助作答。历史按管理员和题目保存，不发送其他题目或整个学习档案。

## AI 评估、追问、模拟面试与薄弱点

新增两个迁移，需与函数一起部署（先 `npx supabase db push --dry-run` 核对，再 `db push`，然后 `npx supabase functions deploy ai-tutor`）：

- `20260917000000_practice_calendar.sql`：首页刷题日历的按天聚合 `practice_calendar` 与当天明细 `practice_day`（security invoker，只返回本人记录）。
- `20260917001000_ai_evaluations.sql`：`ai_evaluations`（评估与追问链）、`ai_reports`（面试报告、薄弱点建议）、`attempts.ai_evaluation_id`，以及只授予 service_role 的 `ai_begin_evaluation` / `ai_begin_report`；同时重建 `practice_calendar` 以返回 AI 均分和模拟面试标记。

使用方式：

1. **刷题评估**：提交后点击“AI 评估我的回答”。AI 对照参考答案与评分标准给出分数、维度、优缺点和薄弱点，并可针对最关键的薄弱点追问（最多 3 轮追问）。评分按钮上会标出“AI 建议”、错误原因会预选，但**必须由你点击评分**才会写入复习计划；AI 建议与客观题判分冲突时以判分为准。
2. **模拟面试**：管理员作答后 AI 面试官自动评估并最多追问 2 轮，此时不显示参考答案；结束或跳过追问后再揭晓参考答案并自评。复盘页自动生成一次本场报告，重进复盘读取已保存的报告。AI 未配置或非管理员时回到原流程。
3. **薄弱点**：“薄弱知识点”页汇总最近 200 次 AI 评估中的薄弱点（同一题同一薄弱点只计一次），可按需生成 AI 学习建议。

费用与限制：每次评估、每轮追问、每份报告都是一次非流式模型调用，与聊天共用每分钟 10 次限额；仅在点击或进入模拟面试评估时发起。评估要求模型返回 JSON，未使用服务商的 JSON mode；若模型输出无法解析，会记为失败并提示重试（重试是新请求，会再次计费）。网络中断后的“重试”沿用原请求 ID，已完成的结果直接返回，不会重复调用。

## 排错与验收边界

可靠性更新（2026-09-17）：同一账号的后台登录通知和 token 刷新只复核权限，不卸载正在使用的聊天、评估和追问；确认退出、换号或失去权限仍会关闭助手。未发送的聊天草稿按账号与题目缓存在当前标签页，关闭助手再打开可恢复；失败时保留输入，退出或换号清理。标签页被系统丢弃、设备休眠或实际断网仍可能中断请求，聊天可从云端历史核对已保存部分。

登录过期的 401 请求会刷新登录后重试一次，沿用原请求 ID；网络错误、网关超时和“仍在生成”不会自动再次调用模型。评估与报告只有在服务端明确确认失败后才换新请求 ID。

思考模式更新（迁移 `20260917002000_ai_reasoning_settings.sql`）：官方 DeepSeek API 的聊天、AI 评估、面试报告、薄弱点建议和连接测试统一使用“API设置 → 思考强度”，默认 `high`，可选关闭/低/高/最大；这些字段不发送给其他服务商。评估与报告额外启用 JSON Output（`response_format: json_object`），若服务商以 400 拒绝该参数，会去掉它重试一次（400 不产生生成费用），服务端仍严格校验 JSON。

预算与超时：思考 token 计入 `max_tokens`，因此开启思考时每次输出预算为 8192 token，关闭时为 4096；服务端对单次模型调用最多等待 90 秒，浏览器等待 120 秒，数据库把超过 150 秒仍在运行的请求判定为中断（原为 90 秒，否则慢但正常的生成会被误判失败）。连接测试与真实生成使用相同的思考强度、预算和超时。流式聊天在模型思考期间会显示“思考中…”，思考内容本身不转发；评估和报告显示已等待秒数。若频繁超时或提示达到长度上限，先把思考强度降为“低”。参考：[思考模式](https://api-docs.deepseek.com/guides/thinking_mode/)、[JSON Output](https://api-docs.deepseek.com/guides/json_mode)。输出截断、模型格式错误、上游密钥/余额/限流以及超时分别提示，不回显上游敏感响应。

- 无按钮：检查当前账号是否在 `app_admins` 中，以及是否在模拟面试中。未配置 Supabase 的静态模式没有管理员助手。
- 提示未配置 Key：检查 Edge Function 所属项目与 Secrets，注意变量名称大小写。
- 请求失败：核对 Base URL 的 origin 是否在 allowlist 中、model 是否正确，以及是否支持流式 Chat Completions 和 `max_tokens`。
- 401：重新登录，查看函数日志区分平台 JWT 校验与函数返回的登录失效；不要直接关闭鉴权来处理。
- 403：检查当前账号的管理员权限。
- 429：每个管理员每分钟最多 10 次生成/连接测试，稍后再试。
- 网络中断：先刷新历史核对。重复 request ID 不会重复生成；点击“重新提问”后发送属于新请求，可能再次计费。
- 笔记冲突：保留待追加内容，待原笔记同步后刷新再追加。跨设备手工编辑仍应避免同时覆盖同一份笔记。

当前本地证据包括单元/组件测试、合成 SQL/RLS 检查和模拟 API 的浏览器流程。它们不等于真实 Supabase 部署或真实服务商兼容性验收；部署后仍需以上述一题流程实测。

参考：[Supabase 部署函数](https://supabase.com/docs/guides/functions/deploy)、[函数认证](https://supabase.com/docs/guides/functions/auth)、[环境变量与 Secrets](https://supabase.com/docs/guides/functions/secrets)。
