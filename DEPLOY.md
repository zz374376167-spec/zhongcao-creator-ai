# 部署指南

本项目是 Next.js 16 + App Router 应用，Dify API Key 存放在**服务端环境变量**中，
通过 `app/api/dify/*` Route Handlers 调用 Dify Workflow，因此**必须运行在支持 Node.js 服务端的平台**。

> ⚠️ 千万不要把 `.env.local` 提交到仓库（已由 `.gitignore` 忽略），也不要直接把 Dify API Key 写进前端代码。

---

## ✅ 当前状态（2026-09-02）：临时公网 URL 已生效

**https://combine-parameters-cocktail-abilities.trycloudflare.com**

- 已通过公网端到端验证：分析（3 人群 / 6 痛点 / 3 卖点 / 3 策略）+ 生成（3 标题 / 正文 / 4 段脚本）全部正常。
- 实现方式：Cloudflare Quick Tunnel（`cloudflared tunnel --url http://localhost:3000`），**无需任何账号**。
- ⚠️ **临时性说明**：
  - 依赖本机 `npm run dev` 持续运行；电脑关机 / 终端关闭 / 隧道重启后 URL 会失效或改变。
  - 这是"无账号"实验性隧道，Cloudflare 不保证可用性，适合应急分享，不适合长期使用。
  - 想让朋友**长期稳定**访问，请按下面"正式部署"方案操作一次。

### 如何重新启动临时隧道（URL 会变）

```powershell
# 1. 先启动 dev server（项目目录）
npm run dev
# 2. 新开一个终端，启动隧道
& "$env:LOCALAPPDATA\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000
# 3. 从输出中找到 "Your quick Tunnel has been created! Visit it at: https://xxx.trycloudflare.com"
```

---

## 正式部署：Cloudflare Pages（首选，登录只需邮箱）

Vercel 登录需要手机号验证（用户登录受阻），改用 Cloudflare Pages：
免费、邮箱验证即可登录、国内可访问、支持服务端密钥保护。

### 步骤（需用户在场配合登录一次）

1. **注册 / 登录 Cloudflare**：打开 https://dash.cloudflare.com/sign-up ，邮箱注册（只需收验证邮件，**无需手机号**）。
2. **登录 CLI**：
   ```powershell
   npm i -D wrangler
   npx wrangler login   # 会自动打开浏览器，点 Allow 即可
   ```
3. **改造为 Pages 兼容构建**（服务端路由用 Cloudflare Functions 承载）：
   - 方案：`@cloudflare/next-on-pages` 适配器（支持 Route Handlers）
   - 注意：该适配器对 Next.js 16 的兼容性需验证；若受阻，退回方案 C（Zeabur）。
4. **配置环境变量**（`npx wrangler pages secret put` 或 Dashboard → Project → Settings → Variables）：
   | 变量 | 值 |
   |---|---|
   | `DIFY_API_URL` | `https://api.dify.ai/v1` |
   | `DIFY_ANALYZE_API_KEY` | 商品分析 Workflow 的 API Key |
   | `DIFY_CONTENT_API_KEY` | 内容生成 Workflow 的 API Key |
5. **部署**：`npx wrangler pages deploy out`（或 `next-on-pages` 产物目录），得到 `https://<项目名>.pages.dev`。

---

## 方案 C：Zeabur（备选，GitHub 一键登录、零改造、国内快）

- 国内团队，访问快；**用 GitHub 登录即可**（无需手机验证）。
- Next.js 可直接部署（自动识别框架），API Routes 原生支持，无需改代码。
- 免费额度可支撑朋友试用。
- 步骤：https://zeabur.com 用 GitHub 登录 → 新建项目 → 部署 Git 仓库 → 填 3 个环境变量 → 绑定域名。

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
