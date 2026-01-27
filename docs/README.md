# Webhook Manager 文档中心

> 欢迎使用 Webhook Manager 文档

---

## 文档目录

### 部署指南

| 文档 | 说明 |
|------|------|
| [deployment.md](./deployment.md) | **主部署文档** - Docker 部署完整指南，包含快速部署、HTTPS 配置、分离部署等 |
| [data-migration.md](./data-migration.md) | 数据备份、迁移、域名更换指南 |

### 开发文档

| 文档 | 说明 |
|------|------|
| [backend-manual.md](./backend-manual.md) | 后端开发手册 - NestJS API 文档、数据库操作等 |
| [frontend-manual.md](./frontend-manual.md) | 前端开发手册 - React 组件、页面操作指南等 |

---

## 快速入门

### 1. 快速部署（HTTP 模式）

```bash
# 克隆项目
git clone <your-repo-url> webhook_mange
cd webhook_mange

# 配置环境变量
cp env.example .env
nano .env  # 修改 DB_PASSWORD 和 JWT_SECRET

# 启动服务
docker compose up -d --build
```

### 2. 生产部署（HTTPS 模式）

```bash
# 配置域名和邮箱
DOMAIN=your-domain.com
FRONTEND_DOMAIN=www.your-domain.com
ACME_EMAIL=your-email@example.com

# 使用全栈部署（前后端同一服务器）
docker compose -f docker-compose.full.yml up -d --build
```

### 3. 默认账户

首次启动后自动创建管理员账户：

- **用户名**: admin
- **密码**: admin

> ⚠️ 请登录后立即修改默认密码！

---

## 技术栈

| 组件 | 技术 |
|------|------|
| 后端 | NestJS + TypeORM + PostgreSQL + JWT |
| 前端 | React + Vite + Ant Design + Tailwind CSS |
| 部署 | Docker + Docker Compose + Traefik |
| SSL | Let's Encrypt 自动证书 |

---

## 常用命令

### 服务管理

```bash
# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down
```

### 更新部署

**方式一：使用更新脚本（推荐）**

```bash
# 添加执行权限（首次使用）
chmod +x scripts/*.sh

# 一键更新（自动备份 + 拉取代码 + 重新部署）
./scripts/update.sh

# 仅更新后端
./scripts/update.sh backend

# 仅更新前端
./scripts/update.sh frontend
```

**方式二：手动更新**

```bash
# 1. 备份数据库（重要！）
docker exec webhook-postgres pg_dump -U webhook webhook_manager > backup_$(date +%Y%m%d).sql

# 2. 拉取最新代码
git pull

# 3. 重新构建并部署
docker compose -f docker-compose.full.yml up -d --build

# 4. 查看日志确认启动成功
docker compose -f docker-compose.full.yml logs -f

# 5. 清理旧镜像（可选）
docker image prune -f
```

### 数据备份

```bash
# 使用备份脚本（自动压缩）
./scripts/backup.sh

# 备份并清理 7 天前的旧文件
./scripts/backup.sh --cleanup

# 手动备份
docker exec webhook-postgres pg_dump -U webhook webhook_manager > backup.sql

# 恢复数据库
cat backup.sql | docker exec -i webhook-postgres psql -U webhook webhook_manager
```

---

---

## 域名更换

如果域名到期或需要更换域名，请参考 [域名更换指南](./data-migration.md#域名更换指南)。

简要步骤：
1. 配置新域名 DNS 解析
2. 更新 `.env` 中的 `DOMAIN`、`FRONTEND_DOMAIN`、`CORS_ORIGIN`
3. 删除旧 SSL 证书
4. 重新部署服务
5. 更新第三方服务中的 Webhook URL

---

## 获取帮助

如遇到问题，请参考：

1. 部署问题 → [deployment.md](./deployment.md#问题排查)
2. 数据迁移 → [data-migration.md](./data-migration.md#常见问题)
3. 域名更换 → [data-migration.md](./data-migration.md#域名更换指南)
4. 后端开发 → [backend-manual.md](./backend-manual.md#常见问题)
5. 前端开发 → [frontend-manual.md](./frontend-manual.md#常见问题)
