# 种草智作 AI｜商品种草策略生成器

基于 **Dify Workflow** + **Next.js 16** 的 AI 商品种草内容生成工具。
输入商品信息，自动生成小红书种草策略、营销文案和短视频脚本。

## ✨ 功能

- 📊 **商品分析**：识别目标人群、用户痛点、核心卖点，生成 3 套差异化种草策略
- ✍️ **内容生成**：基于所选策略生成小红书标题（3 个）、种草正文、短视频脚本（4 段）
- 🛡️ **稳定输出**：Dify 输出经过严格解析 + 自动重试（最多 3 次）+ 容错修复三层防御

## 🚀 快速开始

```bash
npm install
cp .env.example .env.local   # 填入你的 Dify API Key
npm run dev
```

打开 http://localhost:3000

## 🔧 环境变量

| 变量 | 说明 |
|---|---|
| `DIFY_API_URL` | Dify API 地址，如 `https://api.dify.ai/v1` |
| `DIFY_ANALYZE_API_KEY` | 商品分析 Workflow 的 API Key |
| `DIFY_CONTENT_API_KEY` | 内容生成 Workflow 的 API Key |

> ⚠️ API Key 仅存放在服务端环境变量中，通过 `app/api/dify/*` Route Handlers 调用，不会暴露给前端。

## 🧪 测试

```bash
npm test        # 21 个单元测试（解析容错 / 自动重试 / 修复回退）
npm run lint    # TypeScript 类型检查
```

## 📦 部署

详见 [DEPLOY.md](DEPLOY.md)（支持 Vercel / Cloudflare Pages / Zeabur，需 Node.js 服务端环境）。

## 🛠️ 技术栈

- **Next.js 16**（App Router + Turbopack）+ React 19 + TypeScript
- **Dify Workflow API**（blocking 模式）
- Tailwind CSS

## 📄 许可证

MIT
