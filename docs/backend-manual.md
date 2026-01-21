# Webhook 管理系统 - 后端操作手册

## 目录

1. [系统概述](#系统概述)
2. [环境要求](#环境要求)
3. [安装与配置](#安装与配置)
4. [启动服务](#启动服务)
5. [API 接口文档](#api-接口文档)
6. [数据库管理](#数据库管理)
7. [常见问题](#常见问题)

---

## 系统概述

后端服务基于 **NestJS** 框架构建，提供 RESTful API 接口，主要功能包括：

- **用户认证**：注册、登录、修改密码、JWT 令牌管理
- **Webhook 管理**：创建、查询、更新、删除 Webhook
- **请求接收**：接收外部 Webhook 请求并记录日志
- **日志查询**：查看 Webhook 请求历史记录

### 默认管理员账户

系统启动时会自动创建默认管理员账户（如果不存在）：

| 字段   | 值      |
| ------ | ------- |
| 用户名 | `admin` |
| 密码   | `admin` |

> ⚠️ **安全警告**：首次登录后请立即修改默认密码！

### 技术栈

| 技术       | 版本    | 用途           |
| ---------- | ------- | -------------- |
| NestJS     | ^11.0.1 | 后端框架       |
| TypeORM    | ^0.3.20 | ORM 数据库操作 |
| PostgreSQL | 16+     | 数据库         |
| Passport   | ^0.7.0  | 认证中间件     |
| JWT        | -       | 令牌认证       |
| bcrypt     | ^5.1.1  | 密码加密       |

---

## 环境要求

### 系统要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **PostgreSQL**: >= 14.0

### 环境变量

在 `packages/backend` 目录下创建 `.env` 文件：

```bash
# 服务端口
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=webhook_manager

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS 配置
CORS_ORIGIN=http://localhost:5173
```

#### 环境变量说明

| 变量名           | 必填 | 默认值 | 说明                                |
| ---------------- | ---- | ------ | ----------------------------------- |
| `PORT`           | 否   | 3000   | 服务监听端口 (1-65535)              |
| `DB_HOST`        | 是   | -      | PostgreSQL 主机地址                 |
| `DB_PORT`        | 否   | 5432   | PostgreSQL 端口                     |
| `DB_USERNAME`    | 是   | -      | 数据库用户名                        |
| `DB_PASSWORD`    | 是   | -      | 数据库密码                          |
| `DB_DATABASE`    | 是   | -      | 数据库名称                          |
| `JWT_SECRET`     | 是   | -      | JWT 签名密钥 (生产环境请使用强密钥) |
| `JWT_EXPIRES_IN` | 否   | 7d     | JWT 过期时间                        |
| `CORS_ORIGIN`    | 否   | \*     | 允许的跨域来源                      |

---

## 安装与配置

### 1. 安装依赖

```bash
# 在项目根目录执行
npm install

# 或仅安装后端依赖
cd packages/backend
npm install
```

### 2. 数据库设置

#### 创建数据库

```bash
# 使用 PostgreSQL 命令行
createdb webhook_manager

# 或使用 psql
psql -c "CREATE DATABASE webhook_manager;"
```

#### 启用 UUID 扩展

```bash
psql -d webhook_manager -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

### 3. 数据库同步

后端启动时会自动同步数据库结构（开发模式下 `synchronize: true`）。

> ⚠️ **生产环境警告**：生产环境应使用数据库迁移，避免使用 `synchronize: true`。

---

## 启动服务

### 开发模式

```bash
cd packages/backend
npm run dev
```

服务将在 `http://localhost:3000` 启动，支持热重载。

### 生产模式

```bash
# 构建
npm run build

# 启动
npm run start:prod
```

### 使用 PM2（推荐生产环境）

```bash
# 在项目根目录
pm2 start ecosystem.config.js
```

---

## API 接口文档

### 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token (JWT)
- **内容类型**: `application/json`

### 认证接口 (`/api/auth`)

#### 用户注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "demo",
  "password": "password123",
  "email": "demo@example.com"
}
```

**响应示例**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "demo",
  "email": "demo@example.com",
  "createdAt": "2026-01-21T10:00:00.000Z",
  "updatedAt": "2026-01-21T10:00:00.000Z"
}
```

#### 用户登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "demo",
  "password": "password123"
}
```

**响应示例**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "demo"
  }
}
```

#### 获取当前用户信息

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**响应示例**:

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "demo"
}
```

#### 修改密码

```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "admin",
  "newPassword": "newSecurePassword123"
}
```

**请求体参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `currentPassword` | string | 是 | 当前密码 |
| `newPassword` | string | 是 | 新密码（最少 6 个字符） |

**响应示例**:

```json
{
  "message": "Password changed successfully"
}
```

**错误响应**:

- `401 Unauthorized`: 当前密码不正确或 JWT 无效

### Webhook 管理接口 (`/api/webhooks`)

> 所有接口需要 JWT 认证

#### 获取 Webhook 列表

```http
GET /api/webhooks?page=1&limit=20
Authorization: Bearer <token>
```

**查询参数**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |
| `limit` | number | 20 | 每页数量 |

**响应示例**:

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "GitHub Webhook",
      "path": "github-webhook",
      "secret": null,
      "isActive": true,
      "config": null,
      "createdAt": "2026-01-21T10:00:00.000Z",
      "updatedAt": "2026-01-21T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

#### 创建 Webhook

```http
POST /api/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "GitHub Webhook",
  "path": "github-webhook",
  "secret": "optional-secret-key",
  "isActive": true,
  "config": {}
}
```

**请求体参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | Webhook 名称 (1-100 字符) |
| `path` | string | 是 | 路径标识 (字母、数字、下划线、连字符) |
| `secret` | string | 否 | 验证密钥 |
| `isActive` | boolean | 否 | 是否启用 (默认 true) |
| `config` | object | 否 | 自定义配置 |

**响应示例**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "GitHub Webhook",
  "path": "github-webhook",
  "secret": "optional-secret-key",
  "isActive": true,
  "config": {},
  "createdAt": "2026-01-21T10:00:00.000Z",
  "updatedAt": "2026-01-21T10:00:00.000Z"
}
```

#### 获取单个 Webhook

```http
GET /api/webhooks/:id
Authorization: Bearer <token>
```

#### 更新 Webhook

```http
PATCH /api/webhooks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "isActive": false
}
```

#### 删除 Webhook

```http
DELETE /api/webhooks/:id
Authorization: Bearer <token>
```

**响应示例**:

```json
{
  "deleted": true
}
```

### Webhook 日志接口

#### 获取 Webhook 请求日志

```http
GET /api/webhooks/:id/logs
Authorization: Bearer <token>
```

**响应示例**:

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "method": "POST",
    "headers": {
      "content-type": "application/json",
      "user-agent": "GitHub-Hookshot/..."
    },
    "payload": { "action": "push", "ref": "refs/heads/main" },
    "statusCode": 200,
    "response": { "ok": true },
    "receivedAt": "2026-01-21T10:05:00.000Z"
  }
]
```

### Webhook 接收接口 (`/hook`)

> 此接口用于接收外部 Webhook 请求，无需认证

#### 接收 Webhook 请求

```http
POST /hook/:path
Content-Type: application/json

{
  "event": "push",
  "data": {}
}
```

**密钥验证**（如果 Webhook 设置了密钥）:

- 方式一：请求头 `x-webhook-secret: your-secret`
- 方式二：查询参数 `?secret=your-secret`

**响应示例**:

```json
{
  "ok": true
}
```

**错误响应**:

- `404 Not Found`: Webhook 不存在或未启用
- `401 Unauthorized`: 密钥验证失败

---

## 数据库管理

### 数据模型

#### User 用户表

| 字段      | 类型      | 说明          |
| --------- | --------- | ------------- |
| id        | UUID      | 主键          |
| username  | VARCHAR   | 用户名 (唯一) |
| password  | VARCHAR   | 密码哈希      |
| email     | VARCHAR   | 邮箱 (可选)   |
| createdAt | TIMESTAMP | 创建时间      |
| updatedAt | TIMESTAMP | 更新时间      |

#### Webhook 表

| 字段      | 类型      | 说明            |
| --------- | --------- | --------------- |
| id        | UUID      | 主键            |
| userId    | UUID      | 所属用户 ID     |
| name      | VARCHAR   | 名称            |
| path      | VARCHAR   | 路径标识 (唯一) |
| secret    | VARCHAR   | 验证密钥 (可选) |
| isActive  | BOOLEAN   | 是否启用        |
| config    | JSONB     | 配置信息        |
| createdAt | TIMESTAMP | 创建时间        |
| updatedAt | TIMESTAMP | 更新时间        |

#### WebhookLog 日志表

| 字段       | 类型      | 说明            |
| ---------- | --------- | --------------- |
| id         | UUID      | 主键            |
| webhookId  | UUID      | 所属 Webhook ID |
| method     | VARCHAR   | 请求方法        |
| headers    | JSONB     | 请求头          |
| payload    | JSONB     | 请求体          |
| statusCode | INTEGER   | 响应状态码      |
| response   | JSONB     | 响应内容        |
| receivedAt | TIMESTAMP | 接收时间        |

### 数据库备份

```bash
# 备份数据库
pg_dump webhook_manager > backup_$(date +%Y%m%d).sql

# 恢复数据库
psql webhook_manager < backup_20260121.sql
```

---

## 常见问题

### 1. 数据库连接失败

**错误**: `Connection refused` 或 `ECONNREFUSED`

**解决方案**:

```bash
# 检查 PostgreSQL 服务状态
brew services list | grep postgresql

# 启动 PostgreSQL
brew services start postgresql@16
```

### 2. JWT 认证失败

**错误**: `Unauthorized` 或 `Invalid token`

**检查项**:

- 确认 `JWT_SECRET` 环境变量已正确设置
- 确认 Token 未过期
- 确认请求头格式: `Authorization: Bearer <token>`

### 3. 密码哈希错误

**错误**: `Invalid salt version` 或 `bcrypt error`

**解决方案**:

```bash
# 重新安装 bcrypt
npm uninstall bcrypt
npm install bcrypt
```

### 4. 端口被占用

**错误**: `EADDRINUSE: address already in use`

**解决方案**:

```bash
# 查找占用端口的进程
lsof -i :3000

# 结束进程
kill -9 <PID>
```

### 5. 跨域请求失败

**错误**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**解决方案**:
确保 `.env` 文件中 `CORS_ORIGIN` 包含前端地址：

```bash
CORS_ORIGIN=http://localhost:5173
```

---

## 联系支持

如有问题，请联系系统管理员或查看项目 Issue。
