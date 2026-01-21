# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Webhook 管理系统 - 一个用于创建、管理和监控 Webhook 的全栈应用。

## Commands

```bash
# 开发（同时启动前后端）
npm run dev

# 单独启动
npm run dev:frontend    # Vite dev server :5173
npm run dev:backend     # NestJS watch mode :3000

# 构建
npm run build

# 测试
npm run test

# 生产环境
npm run start:prod      # PM2 集群模式
```

## Architecture

**Monorepo 结构** (Lerna + npm workspaces):
- `packages/backend/` - NestJS API 服务
- `packages/frontend/` - React + Vite SPA

**后端 (NestJS)**:
- 模块化架构：auth, user, webhook, webhook-log, hook
- TypeORM + PostgreSQL
- JWT 认证 (Passport.js)
- API 前缀 `/api`，Webhook 接收端点 `/hook/:path`

**前端 (React)**:
- Zustand 状态管理 (authStore, webhookStore)
- Ant Design UI + Tailwind CSS
- ECharts 图表
- Vite 代理 `/api` 和 `/hook` 到后端

**数据模型**:
- User → Webhook (OneToMany)
- Webhook → WebhookLog (OneToMany, CASCADE)

## Key Patterns

- 前端 API 层：`packages/frontend/src/services/api.ts` - Axios 实例带 JWT 拦截器
- 后端守卫：`JwtAuthGuard` 保护需要认证的端点
- Webhook 安全：timing-safe secret 验证
- 状态持久化：Zustand persist middleware 存储到 localStorage
