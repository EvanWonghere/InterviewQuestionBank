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

## 排错与验收边界

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
