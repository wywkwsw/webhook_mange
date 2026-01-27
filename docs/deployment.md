# Webhook 管理系统 - Docker 部署指南

## 目录

1. [系统要求](#系统要求)
2. [快速部署](#快速部署)
3. [配置说明](#配置说明)
4. [常用命令](#常用命令)
5. [生产环境建议](#生产环境建议)
6. [问题排查](#问题排查)

---

## 系统要求

### VPS 最低配置

| 配置项   | 最低要求                               | 推荐配置     |
| -------- | -------------------------------------- | ------------ |
| CPU      | 1 核                                   | 2 核         |
| 内存     | 1 GB                                   | 2 GB         |
| 硬盘     | 10 GB                                  | 20 GB        |
| 操作系统 | Ubuntu 20.04+ / Debian 11+ / CentOS 8+ | Ubuntu 22.04 |

### 软件要求

- Docker 20.10+
- Docker Compose 2.0+

### 安装 Docker（Ubuntu）

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 添加当前用户到 docker 组
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo apt install docker-compose-plugin -y

# 验证安装
docker --version
docker compose version
```

---

## 快速部署

### 步骤 1：克隆/上传项目

```bash
# 克隆项目（如果使用 Git）
git clone <your-repo-url> webhook-manager
cd webhook-manager

# 或者上传项目文件到服务器
# scp -r ./webhook_mange user@your-server:/path/to/
```

### 步骤 2：配置环境变量

```bash
# 复制环境变量模板
cp env.example .env

# 编辑配置文件
nano .env
```

**重要配置项**：

```bash
# 必须修改 - 数据库密码
DB_PASSWORD=your-secure-password-here

# 必须修改 - JWT 密钥（使用随机字符串）
JWT_SECRET=your-random-secret-key-at-least-32-chars

# 可选 - 修改端口
FRONTEND_PORT=80
```

**生成随机 JWT 密钥**：

```bash
openssl rand -base64 32
```

### 步骤 3：构建并启动服务

```bash
# 构建并启动所有服务（后台运行）
docker compose up -d --build

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 步骤 4：验证部署

```bash
# 检查服务是否正常运行
curl http://localhost/api/docs

# 或在浏览器访问
# http://your-server-ip/
```

---

## 分离部署（推荐）

将前端和后端分开部署，便于独立维护和排查问题。

### 方案概述

| 部署文件                      | 包含服务                       | 适用场景        |
| ----------------------------- | ------------------------------ | --------------- |
| `docker-compose.backend.yml`  | Traefik + PostgreSQL + Backend | 后端 API 服务器 |
| `docker-compose.frontend.yml` | Nginx + Frontend               | 前端静态服务器  |

### 后端部署（带 Let's Encrypt 自动证书）

#### 1. 配置环境变量

```bash
cp env.example .env
nano .env
```

**必须配置**：

```bash
# 后端域名（必须已解析到服务器 IP）
DOMAIN=api.example.com

# Let's Encrypt 邮箱
ACME_EMAIL=your-email@example.com

# 数据库密码
DB_PASSWORD=your-secure-password

# JWT 密钥
JWT_SECRET=$(openssl rand -base64 32)

# CORS 允许的来源（前端域名）
CORS_ORIGIN=https://www.example.com
```

#### 2. 启动后端服务

```bash
# 启动后端（包含 Traefik 自动 SSL）
docker compose -f docker-compose.backend.yml up -d

# 查看日志
docker compose -f docker-compose.backend.yml logs -f

# 查看 Traefik 证书状态
docker compose -f docker-compose.backend.yml logs traefik
```

#### 3. 验证后端

```bash
# 测试 HTTPS 访问
curl https://api.example.com/api/docs

# 测试 Webhook 端点
curl -X POST https://api.example.com/hook/test -d '{"test":true}'
```

**Let's Encrypt 证书说明**：

- 证书自动获取，无需手动操作
- 证书自动续期（到期前 30 天自动续）
- 证书存储在 Docker Volume `letsencrypt_data` 中

### 前端部署

#### 1. 配置后端地址

```bash
nano .env
```

```bash
# 后端 API 地址
BACKEND_API_URL=https://api.example.com

# 前端端口
FRONTEND_PORT=80
```

#### 2. 启动前端服务

```bash
# 启动前端
docker compose -f docker-compose.frontend.yml up -d

# 查看日志
docker compose -f docker-compose.frontend.yml logs -f
```

#### 3. 配置前端 HTTPS（可选）

前端可以使用宝塔面板或 Nginx 反向代理配置 HTTPS：

**宝塔面板**：

1. 创建网站，域名填写前端域名
2. 申请 SSL 证书
3. 设置反向代理到 `http://127.0.0.1:80`

**手动 Nginx 反向代理**：

```nginx
server {
    listen 443 ssl http2;
    server_name www.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 分离部署架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
┌─────────────────────┐       ┌─────────────────────┐
│   前端服务器         │       │   后端服务器         │
│   www.example.com   │       │   api.example.com   │
├─────────────────────┤       ├─────────────────────┤
│                     │       │    Traefik          │
│    Nginx            │◀─────▶│    (Auto SSL)       │
│    (静态文件)        │  API  │         │           │
│                     │       │    Backend          │
│                     │       │    (NestJS)         │
│                     │       │         │           │
│                     │       │    PostgreSQL       │
└─────────────────────┘       └─────────────────────┘
```

### 常用命令

```bash
# === 后端 ===
# 启动
docker compose -f docker-compose.backend.yml up -d

# 停止
docker compose -f docker-compose.backend.yml down

# 查看日志
docker compose -f docker-compose.backend.yml logs -f backend

# 重建
docker compose -f docker-compose.backend.yml up -d --build backend

# === 前端 ===
# 启动
docker compose -f docker-compose.frontend.yml up -d

# 停止
docker compose -f docker-compose.frontend.yml down

# 查看日志
docker compose -f docker-compose.frontend.yml logs -f

# 重建
docker compose -f docker-compose.frontend.yml up -d --build
```

---

## 配置说明

### 环境变量

| 变量名                | 默认值          | 说明                                 |
| --------------------- | --------------- | ------------------------------------ |
| `DB_USERNAME`         | webhook         | 数据库用户名                         |
| `DB_PASSWORD`         | webhook123      | 数据库密码 ⚠️ **生产环境必须修改**   |
| `DB_DATABASE`         | webhook_manager | 数据库名称                           |
| `DB_PORT_EXPOSE`      | 5432            | 数据库对外暴露端口                   |
| `JWT_SECRET`          | -               | JWT 签名密钥 ⚠️ **生产环境必须修改** |
| `JWT_EXPIRES_IN`      | 7d              | JWT 过期时间                         |
| `BCRYPT_SALT_ROUNDS`  | 10              | bcrypt 加密轮数                      |
| `CORS_ORIGIN`         | \*              | 允许的跨域来源                       |
| `FRONTEND_PORT`       | 80              | 前端访问端口                         |
| `BACKEND_PORT_EXPOSE` | 3000            | 后端 API 暴露端口                    |

### 服务架构

```
                    ┌─────────────────────────────────────┐
                    │              Docker Network          │
                    │                                      │
 HTTP:80            │   ┌───────────┐    ┌────────────┐   │
────────────────────┼──▶│  Frontend │───▶│   Backend  │   │
                    │   │  (Nginx)  │    │  (NestJS)  │   │
                    │   └───────────┘    └─────┬──────┘   │
                    │                          │          │
                    │                    ┌─────▼──────┐   │
                    │                    │  PostgreSQL │  │
                    │                    └────────────┘   │
                    └─────────────────────────────────────┘
```

---

## 常用命令

### 服务管理

```bash
# 启动所有服务
docker compose up -d

# 停止所有服务
docker compose down

# 重启所有服务
docker compose restart

# 重启单个服务
docker compose restart backend

# 查看服务状态
docker compose ps

# 查看服务日志
docker compose logs -f

# 查看单个服务日志
docker compose logs -f backend
```

### 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker compose up -d --build

# 仅重建某个服务
docker compose up -d --build backend
```

### 数据库管理

```bash
# 进入 PostgreSQL 容器
docker compose exec postgres psql -U webhook -d webhook_manager

# 备份数据库
docker compose exec postgres pg_dump -U webhook webhook_manager > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker compose exec -T postgres psql -U webhook webhook_manager < backup_20260121.sql
```

### 清理资源

```bash
# 停止并删除容器、网络
docker compose down

# 同时删除数据卷（⚠️ 会删除所有数据！）
docker compose down -v

# 清理未使用的镜像
docker image prune -f

# 清理所有未使用的资源
docker system prune -a
```

---

## 生产环境建议

### 1. 安全配置

```bash
# 修改强密码
DB_PASSWORD=<随机生成的强密码>
JWT_SECRET=<至少32位的随机字符串>

# 限制 CORS
CORS_ORIGIN=https://your-domain.com

# 不对外暴露数据库端口
# 注释掉或删除 DB_PORT_EXPOSE
```

### 2. 配置 HTTPS（重要！）

TradingView 等服务的 Webhook 需要 HTTPS。提供三种方案：

#### 方案一：Traefik + Let's Encrypt（推荐）

自动获取和续期 SSL 证书：

```bash
# 1. 设置环境变量
cat >> .env << EOF
DOMAIN=your-domain.com
ACME_EMAIL=your-email@example.com
EOF

# 2. 使用 HTTPS 配置启动
docker compose -f docker-compose.https.yml up -d

# 3. 验证
curl https://your-domain.com/api/docs
```

**优点**：自动获取证书、自动续期、零配置  
**要求**：域名已正确解析到服务器 IP

#### 方案二：使用已有证书

如果你已有 SSL 证书（如从 Certbot/宝塔获取）：

```bash
# 1. 创建证书目录并复制证书
mkdir -p ssl
cp /path/to/your/privkey.pem ./ssl/privkey.pem
cp /path/to/your/fullchain.pem ./ssl/fullchain.pem

# 2. 使用手动证书配置启动
docker compose -f docker-compose.ssl-manual.yml up -d
```

**证书文件说明**：

- `privkey.pem` - 私钥文件
- `fullchain.pem` - 完整证书链（包含中间证书）

#### 方案三：宝塔面板反向代理

如果使用宝塔面板：

```bash
# 1. HTTP 模式启动服务
docker compose up -d

# 2. 在宝塔中创建网站，配置反向代理到 localhost:80
# 3. 在宝塔中申请 SSL 证书
```

#### Webhook 接收地址

部署完成后，你的 Webhook 接收地址为：

```
https://your-domain.com/hook/<path>
```

示例 - TradingView 配置：

```
Webhook URL: https://your-domain.com/hook/tradingview
```

### 3. 配置防火墙

```bash
# 安装 ufw
sudo apt install ufw -y

# 允许 SSH
sudo ufw allow ssh

# 允许 HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# 启用防火墙
sudo ufw enable
```

### 4. 设置自动启动

Docker Compose 服务已配置 `restart: unless-stopped`，会在服务器重启后自动启动。

### 5. 日志管理

```bash
# 配置 Docker 日志轮转
# 创建 /etc/docker/daemon.json
sudo cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# 重启 Docker
sudo systemctl restart docker
```

### 6. 定时备份

```bash
# 创建备份脚本
cat > /opt/backup-webhook.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker compose -f /path/to/webhook-manager/docker-compose.yml exec -T postgres \
  pg_dump -U webhook webhook_manager > "$BACKUP_DIR/webhook_$DATE.sql"

# 保留最近 7 天的备份
find $BACKUP_DIR -name "webhook_*.sql" -mtime +7 -delete
EOF

chmod +x /opt/backup-webhook.sh

# 添加定时任务（每天凌晨 3 点备份）
echo "0 3 * * * /opt/backup-webhook.sh" | crontab -
```

---

## 问题排查

### 1. 容器无法启动

```bash
# 查看详细日志
docker compose logs backend

# 检查容器状态
docker compose ps -a

# 进入容器调试
docker compose exec backend sh
```

### 2. 数据库连接失败

```bash
# 检查数据库容器
docker compose logs postgres

# 测试数据库连接
docker compose exec postgres pg_isready -U webhook

# 验证数据库存在
docker compose exec postgres psql -U webhook -l
```

### 3. 前端无法访问后端

```bash
# 检查 Nginx 配置
docker compose exec frontend cat /etc/nginx/conf.d/default.conf

# 测试后端健康检查
docker compose exec frontend wget -qO- http://backend:3000/api/docs
```

### 4. 端口被占用

```bash
# 查看端口占用
sudo lsof -i :80
sudo lsof -i :3000

# 修改 .env 中的端口配置
FRONTEND_PORT=8080
```

### 5. 磁盘空间不足

```bash
# 查看 Docker 占用空间
docker system df

# 清理未使用的资源
docker system prune -a

# 清理未使用的卷
docker volume prune
```

---

## 联系支持

如有问题，请联系系统管理员或查看项目 Issue。
