# Unity 刷题与复习 · Interview Question Bank

基于 React + Vite + Tailwind 的刷题站点，作为子应用部署在 Hugo 博客的 `/quiz` 路径下。

## 本地开发

```bash
npm install
npm run dev
```

## 构建与预览

因站点配置了 `base: '/quiz/'`，直接 `serve dist` 会导致请求 `/quiz/assets/...` 时 404（服务器在 dist 根下找不到 `quiz/` 子路径）。需先让产物落在「子目录」再起服务：

```bash
npm run preview:quiz
```

会先执行 `build`，再把 `dist` 拷到 `dist-preview/quiz/` 并用 serve 托管，端口 5000。浏览器访问 **`http://localhost:5000/quiz/`** 与 `http://localhost:5000/quiz/#/quiz` 验证子目录与 Hash 路由。

## 部署方式

- **子目录**：Vite `base: '/quiz/'`，路由使用 `HashRouter`，静态资源与前端路由均在 `/quiz` 下，适合挂到任意静态站点（如 Hugo）的子路径。
- **CI**：推送 `main` 分支后，GitHub Actions 自动执行 `npm run build`，并将 `dist` 推送到 [EvanWonghere/EvanWonghere.github.io](https://github.com/EvanWonghere/EvanWonghere.github.io) 的 `static/quiz` 目录。

### 配置 CI 所需 Secret

在 **本仓库** Settings → Secrets and variables → Actions 中新增：

- **Name**: `API_TOKEN_GITHUB`
- **Value**: 对 `EvanWonghere/EvanWonghere.github.io` 具备 **Contents: Read and write** 的 GitHub Personal Access Token（Classic 或 Fine-grained 均可）。

## 技术栈

- React 18、Vite 7、Tailwind CSS 4、Zustand、react-router-dom（HashRouter）
