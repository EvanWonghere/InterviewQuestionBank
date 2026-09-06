# Unity 刷题与复习 · Interview Question Bank

部署在个人 Hugo 博客 `/quiz/` 下的云端题库、错题本与自适应复习系统。公开访客可以刷已发布题目；管理员通过 GitHub 登录后可以录入、编辑、发布题目，并在不同设备同步笔记、作答历史和 SM-2 复习进度。

## 功能

- 单选、多选、填空自动判题；简答、算法、工程任务提交后自评。
- Markdown、GFM、KaTeX、代码块和受权限控制的图片附件。
- 分类、题型、知识点、难度筛选，以及随机练习和模拟面试。
- 今日复习、历史错题、已掌握、薄弱知识点和作答历史。
- 管理员题目 CRUD、复制、软归档、私有草稿和公开发布。
- Supabase Postgres、Auth、Storage 与 RLS；未配置云端时自动回退到现有静态题库。

## 本地开发

```bash
npm ci
cp .env.example .env.local
npm run dev
```

未填写 Supabase 环境变量时，应用使用 `public/questions.json`，适合 UI 开发和离线刷题。完整云端功能需要：

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

浏览器中只能使用 publishable key。禁止把 `SUPABASE_SERVICE_ROLE_KEY` 写成 `VITE_` 变量或提交到仓库。

## Supabase 初始化

1. 创建 Supabase 项目，用 Supabase CLI 应用 `supabase/migrations/` 下的 migration。
2. 在 Auth Providers 启用 GitHub；GitHub OAuth App 的 callback 使用 Supabase 控制台给出的 `/auth/v1/callback`。
3. 在 Supabase URL allow list 加入本地开发地址和 `https://yufenghuang.tech/quiz/`。
4. 首次通过 `/quiz/#/manage/questions` 登录后，在 Supabase SQL Editor 执行：

```sql
insert into public.app_admins(user_id)
select id from auth.users where email = '<你的 GitHub 邮箱>'
on conflict do nothing;
```

5. 使用仅限本地终端的 service-role key 幂等迁移静态JSON中的分类和题目：

```bash
SUPABASE_URL=https://<project-ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<仅本地使用> \
npm run migrate:questions
```

6. 再次登录管理区，打开“迁移旧数据”，系统会先下载备份，再合并浏览器与旧 Gist 的笔记、错题状态。

## 数据与安全边界

- Supabase 是题目、答案、笔记、作答和复习状态的唯一云端事实来源。
- `question_solutions` 不允许匿名直接读取；公开题通过受控判题函数在提交后获取判定和解析。
- 新题默认私有草稿；归档是可恢复的软删除。
- 图片 bucket 为私有，PNG/JPEG/WebP/GIF 单文件上限 5 MB。
- Gist 仅用于一次性迁移；成功后浏览器中的旧 Token 会删除。

## 验证

```bash
npm run lint
npm test
npm run build
npm run preview:quiz
npm run test:e2e
```

`preview:quiz` 会把构建产物置于 `/quiz/` 子目录并在 4173 端口启动，确保 GitHub Pages 子路径和 HashRouter 行为与线上一致。

## 部署

仓库推送 `main` 后，GitHub Actions 会测试、构建并将 `dist/` 更新到 `EvanWonghere.github.io/static/quiz`。在题库仓库的 GitHub Actions Variables 中配置：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

跨仓库部署继续使用现有 `API_TOKEN_GITHUB` Secret。

## 2026-09 题目补充

静态题库现有178题。本轮新增q-149–q-178：UI空间7题、构建产物/排错6题、操作系统基础/场景5题、引擎原理12题，每题含评分点、追问、最小验证与资料链接。支持按稳定题号（含云端legacyId）搜索。

练习与内容规范见 [题目质量约定](docs/QUESTION_QUALITY.md)。云端增量文件为 `supabase/migrations/20260906000000_quality_question_pack.sql`，仅插入缺失ID，不覆盖已编辑内容；本轮经过审核的新题随部署公开。更新静态JSON不等于更新Supabase，发布时必须同时应用迁移。
