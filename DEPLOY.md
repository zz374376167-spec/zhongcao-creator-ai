# 部署指南

本项目是 Next.js 16 + App Router 应用，Dify API Key 存放在**服务端环境变量**中，
通过 `app/api/dify/*` Route Handlers 调用 Dify Workflow，因此**必须运行在支持 Node.js 服务端的平台**。

> ⚠️ 千万不要把 `.env.local` 提交到仓库（已由 `.gitignore` 忽略），也不要直接把 Dify API Key 写进前端代码。

---

## ✅ 正式部署（2026-09-02）：Netlify 已上线

**正式 URL：https://tangerine-duckanoo-b223ac.netlify.app**

- 平台：Netlify（GitHub 登录，免费额度足够，Next.js Runtime 原生支持 Route Handlers，密钥在服务端受保护）。
- 已通过公网端到端验证：首页 200 + analyze（3 人群 / 3 痛点 / 卖点解析）+ generate（3 标题 / 正文 / 6 段视频脚本）全部正常，`workflowStatus: succeeded`。
- 站点可见性已设为 **Public**（普通访客无需登录即可访问）。
- 自动部署：推送 `main` 分支到 GitHub 即自动构建发布。

### 环境变量（Netlify → Project configuration → Environment variables）

| 变量 | 值 |
|---|---|
| `DIFY_API_URL` | `https://api.dify.ai/v1` |
| `DIFY_ANALYZE_API_KEY` | 商品分析 Workflow 的 API Key |
| `DIFY_CONTENT_API_KEY` | 内容生成 Workflow 的 API Key |

### 项目信息

- Netlify 项目名：`tangerine-duckanoo-b223ac`（Site ID: `88a94258-a2be-4072-8144-4bcb62aa82c5`，团队 `zheng-personal-site`）
- 部署来源：GitHub 仓库 `zz374376167-spec/zhongcao-creator-ai`（分支 `main`）
- 框架检测：Next.js（自动识别，构建命令 `npm run build`，发布目录 `.next`）

---

## 历史方案（保留备查）

### 方案 A：Cloudflare 临时隧道（应急分享用，URL 会变）

- 曾用 `cloudflared tunnel --url http://localhost:3000` 生成临时 URL：`https://combine-parameters-cocktail-abilities.trycloudflare.com`（现已废弃）。
- 依赖本机 dev server 运行，电脑关机 / 隧道重启后 URL 失效。**正式分享请用上面的 Netlify URL。**

### 方案 B：Cloudflare Pages（曾计划，未采用）

- 需要 `@cloudflare/next-on-pages` 适配器，对 Next.js 16 兼容性未验证，故未走此路线。

### 方案 C：Zeabur（已排除）

- GitHub 一键登录可行，但免费额度已取消（需购买付费服务器，用户余额 0），故放弃。

### 方案 D：Vercel（已排除）

- 登录需要手机号验证（用户登录受阻），故放弃。

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
