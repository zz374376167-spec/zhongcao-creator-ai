# 部署指南

本项目是 Next.js 16 + App Router 应用，Dify API Key 存放在**服务端环境变量**中，
通过 `app/api/dify/*` Route Handlers 调用 Dify Workflow，因此**必须运行在支持 Node.js 服务端的平台**。

> ⚠️ 千万不要把 `.env.local` 提交到仓库（已由 `.gitignore` 忽略），也不要直接把 Dify API Key 写进前端代码。

---

## 方案 A：Vercel（推荐）

Vercel 是 Next.js 官方平台，免费额度足够朋友使用，支持 API Routes 与环境变量，绑定 GitHub 后自动部署。

### 步骤

1. **推送到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "init: 种草智作 AI"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```

2. **导入 Vercel**
   - 打开 https://vercel.com/new ，用 GitHub 账号登录
   - 点击 **Import**，选择刚推送的仓库
   - Framework Preset 自动识别为 **Next.js**，无需改动

3. **配置环境变量**（Settings → Environment Variables，或导入时填写）
   | 变量 | 值 |
   |---|---|
   | `DIFY_API_URL` | `https://api.dify.ai/v1` |
   | `DIFY_ANALYZE_API_KEY` | 商品分析 Workflow 的 API Key |
   | `DIFY_CONTENT_API_KEY` | 内容生成 Workflow 的 API Key |

4. **Deploy**，完成后会得到一个 `https://<项目名>.vercel.app` 链接，直接发给朋友使用。

5. **更新**：之后每次 `git push` 到 `main`，Vercel 都会自动重新部署。

> 说明：Vercel 免费版（Hobby）函数最长执行 60s，本项目 Dify 调用设置了 95s 超时上限；
> 通常 Dify 工作流 10~30s 内完成，若个别请求超过 60s 被截断，重新生成一次即可。

---

## 方案 B：GitHub Pages（不推荐，有已知限制）

GitHub Pages 是**纯静态托管**，无法运行 `app/api/dify/*` 服务端路由，且环境变量在构建期被替换后直接暴露在网页源码中。

如果仍想用 GitHub Pages，只有两种改造方式，都需要接受 **API Key 暴露**的风险：

1. **前端直连 Dify**：把 Dify 调用从 Route Handler 移到浏览器端（`fetch("https://api.dify.ai/v1/workflows/run", ...)`）。
   - 风险：`app-` 开头的 Key 会公开在页面源码里，任何人可盗用消耗你的 Dify 额度/费用。
   - 还需在 Dify 控制台 → 设置 → API 访问 → CORS 中，把你的 Pages 域名加入白名单。

2. **嵌入 Dify Web App 分享页**：在 Dify 控制台把工作流发布为 Web App，复制分享链接用 iframe 嵌入静态页。
   - 优点：Key 不暴露、零改造。
   - 缺点：页面是 Dify 原生界面，不是本项目定制的 UI 流程。

**结论**：如果核心目标是"给朋友一个能用的网址"，直接选 **方案 A（Vercel）**，10 分钟内即可上线。

---

## 本地开发

```bash
npm install
# 复制 .env.example 为 .env.local 并填入真实 Key
npm run dev
```

## 测试

```bash
npm test        # 单元测试（含 Dify 解析容错 / 自动重试）
npm run lint    # TypeScript 类型检查
```
