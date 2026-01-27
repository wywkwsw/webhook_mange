# Webhook Manager 部署指南

> 域名：www.12346.icu  
> 部署模式：全栈部署（前端 + 后端 + 数据库）  
> 配置文件：docker-compose.full.yml

---

## 目录

- [前置要求](#前置要求)
- [第一步：VPS 服务器初始化](#第一步vps-服务器初始化)
- [第二步：安装 Docker](#第二步安装-docker)
- [第三步：配置防火墙](#第三步配置防火墙)
- [第四步：上传项目到 VPS](#第四步上传项目到-vps)
- [第五步：配置环境变量](#第五步配置环境变量)
- [第六步：验证 DNS 解析](#第六步验证-dns-解析)
- [第七步：构建并启动服务](#第七步构建并启动服务)
- [第八步：验证部署](#第八步验证部署)
- [第九步：访问测试](#第九步访问测试)
- [常见问题排查](#常见问题排查)
- [日常运维命令](#日常运维命令)
- [部署检查清单](#部署检查清单)

---

## 前置要求

| 要求       | 说明                                             |
| ---------- | ------------------------------------------------ |
| VPS 服务器 | Ubuntu 20.04+ 推荐，内存 >= 1GB                  |
| 域名解析   | `www.12346.icu` 和 `12346.icu` 均已解析到 VPS IP |
| 端口开放   | 80 和 443 端口可从外网访问                       |
| SSH 访问   | 可通过 SSH 连接到 VPS                            |

---

## 第一步：VPS 服务器初始化

```bash
# SSH 连接到 VPS
ssh root@your-vps-ip

# 更新系统
apt update && apt upgrade -y

# 安装必要工具
apt install -y curl git wget nano
```

---

## 第二步：安装 Docker

```bash
# 安装 Docker（官方脚本）
curl -fsSL https://get.docker.com | sh

# 启动 Docker 并设置开机自启
systemctl start docker
systemctl enable docker

# 验证安装
docker --version
docker compose version
```

**预期输出示例：**

```
Docker version 24.x.x, build xxxxxxx
Docker Compose version v2.x.x
```

---

## 第三步：配置防火墙

```bash
# 安装 ufw
apt install -y ufw

# 允许 SSH（⚠️ 重要：防止锁定自己）
ufw allow ssh

# 允许 HTTP 和 HTTPS
ufw allow 80
ufw allow 443

# 启用防火墙
ufw enable

# 检查状态
ufw status
```

**预期输出：**

```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

---

## 第四步：上传项目到 VPS

### 方式 A：从 Git 克隆（推荐）

```bash
cd /opt
git clone <your-repo-url> webhook_mange
cd webhook_mange
```

### 方式 B：从本地 SCP 上传

在**本地机器**上执行：

```bash
scp -r /path/to/webhook_mange root@your-vps-ip:/opt/
```

在 **VPS** 上执行：

```bash
cd /opt/webhook_mange
ls -la
```

---

## 第五步：配置环境变量

```bash
# 进入项目目录
cd /opt/webhook_mange

# 创建 .env 文件
cat > .env << 'EOF'
# ========================================
# Webhook Manager - Production Config
# ========================================

# ----------------------------------------
# Database Configuration
# ----------------------------------------
DB_USERNAME=webhook
DB_PASSWORD=YourSecurePassword123!
DB_DATABASE=webhook_manager

# ----------------------------------------
# JWT Configuration
# ----------------------------------------
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d

# ----------------------------------------
# Security
# ----------------------------------------
BCRYPT_SALT_ROUNDS=10

# ----------------------------------------
# Database Auto Sync (重要！首次部署必须设置)
# ----------------------------------------
# 首次部署必须设为 true，让 TypeORM 自动创建表
# 表创建完成后建议改为 false
DB_SYNCHRONIZE=true
# 生产环境强制覆盖，允许自动同步
DB_SYNC_FORCE=true

# ----------------------------------------
# CORS Configuration
# ----------------------------------------
CORS_ORIGIN=https://www.12346.icu

# ----------------------------------------
# Domain Configuration (重要！)
# ----------------------------------------
# 主域名（用于后端 API）
DOMAIN=12346.icu

# 前端域名
FRONTEND_DOMAIN=www.12346.icu

# Let's Encrypt 邮箱（用于证书通知）
ACME_EMAIL=your-email@example.com
EOF
```

### ⚠️ 必须修改的配置项

使用编辑器修改 `.env` 文件：

```bash
nano .env
```

| 配置项        | 说明                            | 示例                              |
| ------------- | ------------------------------- | --------------------------------- |
| `DB_PASSWORD` | 数据库密码，使用强密码          | `MyStr0ngP@ssw0rd!`               |
| `JWT_SECRET`  | JWT 密钥，至少 32 字符          | `your-32-char-secret-key-here!!!` |
| `ACME_EMAIL`  | 你的真实邮箱，用于 SSL 证书通知 | `admin@12346.icu`                 |

### 生成安全密钥

```bash
# 生成随机 JWT_SECRET
openssl rand -base64 32

# 生成随机 DB_PASSWORD
openssl rand -base64 16
```

---

## 第六步：验证 DNS 解析

```bash
# 检查域名解析是否正确
dig www.12346.icu +short
dig 12346.icu +short
```

**预期输出：**

```
xxx.xxx.xxx.xxx  # 应该返回你的 VPS IP 地址
```

### DNS 配置说明

在域名服务商（如阿里云、腾讯云、Cloudflare）处配置：

| 记录类型 | 主机记录 | 记录值      |
| -------- | -------- | ----------- |
| A        | @        | your-vps-ip |
| A        | www      | your-vps-ip |

> ⚠️ DNS 解析生效可能需要几分钟到几小时，请耐心等待。

---

## 第七步：构建并启动服务

```bash
# 进入项目目录
cd /opt/webhook_mange

# 使用 docker-compose.full.yml 启动所有服务
docker compose -f docker-compose.full.yml up -d --build
```

### 查看启动日志

```bash
# 实时查看所有服务日志
docker compose -f docker-compose.full.yml logs -f

# 按 Ctrl+C 退出日志查看
```

### 服务启动顺序

1. **webhook-traefik** - 反向代理启动，开始获取 SSL 证书
2. **webhook-postgres** - 数据库启动并初始化
3. **webhook-backend** - 后端 API 等待数据库就绪后启动
4. **webhook-frontend** - 前端服务启动

> 首次启动可能需要 2-5 分钟，取决于网络和服务器性能。

---

## 第八步：验证部署

### 8.1 检查容器状态

```bash
docker compose -f docker-compose.full.yml ps
```

**预期输出：**

```
NAME                STATUS              PORTS
webhook-traefik     running             0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
webhook-postgres    running (healthy)   5432/tcp
webhook-backend     running             3000/tcp
webhook-frontend    running             80/tcp
```

> ⚠️ 确保所有 4 个容器状态都是 `running`，数据库状态是 `healthy`。

### 8.2 检查 SSL 证书获取

```bash
docker logs webhook-traefik 2>&1 | grep -i "certificate\|acme"
```

**成功标志：**

```
... legolog: ... certificate obtained successfully ...
```

### 8.3 测试 HTTPS 访问

```bash
# 测试前端页面
curl -I https://www.12346.icu

# 预期响应头包含：
# HTTP/2 200
# content-type: text/html
```

### 8.4 测试后端 API

```bash
# 测试 API 端点
curl https://www.12346.icu/api/health

# 或通过主域名访问
curl https://12346.icu/api/health
```

---

## 第九步：访问测试

打开浏览器访问以下地址：

| 地址                            | 说明                     |
| ------------------------------- | ------------------------ |
| https://www.12346.icu           | 前端页面                 |
| https://www.12346.icu/api/docs  | API 文档（如有 Swagger） |
| https://www.12346.icu/hook/test | Webhook 端点测试         |
| https://12346.icu/api/health    | 后端健康检查             |

### 测试 Webhook 接收

```bash
# 发送测试 Webhook
curl -X POST https://www.12346.icu/hook/test \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from test"}'
```

---

## 常见问题排查

### 问题 1：访问返回 404

**原因**：Traefik 路由规则与域名不匹配

**排查步骤：**

```bash
# 检查 .env 中的域名配置
cat .env | grep DOMAIN

# 检查 Traefik 日志
docker logs webhook-traefik --tail 100 2>&1 | grep -i "rule\|host"

# 检查 frontend 容器
docker logs webhook-frontend --tail 50
```

**解决方案：**
确保 `.env` 配置正确：

```ini
DOMAIN=12346.icu
FRONTEND_DOMAIN=www.12346.icu
```

### 问题 2：SSL 证书获取失败

**原因**：DNS 未生效或端口未开放

**排查步骤：**

```bash
# 检查 ACME 日志
docker logs webhook-traefik 2>&1 | grep -i acme

# 验证 DNS 解析
dig www.12346.icu +short

# 验证端口开放
curl -v http://www.12346.icu --max-time 5
```

**常见错误和解决：**

- `DNS problem: NXDOMAIN` → DNS 尚未生效，等待或检查 DNS 配置
- `connection refused` → 检查防火墙是否开放 80 端口
- `timeout` → 检查 VPS 安全组或云厂商防火墙

### 问题 3：后端无法连接数据库

**排查步骤：**

```bash
# 检查数据库日志
docker logs webhook-postgres --tail 50

# 检查后端日志
docker logs webhook-backend --tail 50

# 检查数据库健康状态
docker compose -f docker-compose.full.yml ps | grep postgres
```

**解决方案：**

```bash
# 重启所有服务
docker compose -f docker-compose.full.yml restart

# 如果仍有问题，重新构建
docker compose -f docker-compose.full.yml down
docker compose -f docker-compose.full.yml up -d --build
```

### 问题 4：前端页面白屏

**排查步骤：**

```bash
# 检查前端构建是否成功
docker logs webhook-frontend --tail 100

# 进入容器检查文件
docker exec -it webhook-frontend ls -la /usr/share/nginx/html/
```

### 问题 5：需要完全重置

```bash
# 停止并删除所有容器和数据卷（⚠️ 会删除数据库数据！）
docker compose -f docker-compose.full.yml down -v

# 清理 Docker 缓存
docker system prune -f

# 重新构建并启动
docker compose -f docker-compose.full.yml up -d --build
```

---

## 日常运维命令

### 查看日志

```bash
# 所有服务日志
docker compose -f docker-compose.full.yml logs -f

# 特定服务日志
docker logs webhook-frontend -f
docker logs webhook-backend -f
docker logs webhook-traefik -f
docker logs webhook-postgres -f
```

### 服务管理

```bash
# 重启所有服务
docker compose -f docker-compose.full.yml restart

# 重启特定服务
docker compose -f docker-compose.full.yml restart frontend
docker compose -f docker-compose.full.yml restart backend

# 停止服务
docker compose -f docker-compose.full.yml down

# 启动服务
docker compose -f docker-compose.full.yml up -d
```

### 更新部署

```bash
# 拉取最新代码
cd /opt/webhook_mange
git pull

# 重新构建并部署
docker compose -f docker-compose.full.yml up -d --build
```

### 数据库备份

```bash
# 备份数据库
docker exec webhook-postgres pg_dump -U webhook webhook_manager > backup_$(date +%Y%m%d).sql

# 恢复数据库
cat backup_20260127.sql | docker exec -i webhook-postgres psql -U webhook webhook_manager
```

### 查看资源使用

```bash
# 查看容器资源使用情况
docker stats

# 查看磁盘使用
docker system df
```

---

## 部署检查清单

在完成部署后，请确认以下各项：

- [ ] VPS 系统已更新 (`apt update && apt upgrade`)
- [ ] Docker 已安装并运行 (`docker --version`)
- [ ] 防火墙已配置，80/443 端口开放 (`ufw status`)
- [ ] 项目已上传到 `/opt/webhook_mange`
- [ ] `.env` 文件已创建并配置正确
  - [ ] `DOMAIN=12346.icu`
  - [ ] `FRONTEND_DOMAIN=www.12346.icu`
  - [ ] `ACME_EMAIL` 已设置真实邮箱
  - [ ] `DB_PASSWORD` 已修改为强密码
  - [ ] `JWT_SECRET` 已修改为随机字符串
- [ ] DNS 已解析 (`dig www.12346.icu +short` 返回 VPS IP)
- [ ] Docker Compose 启动成功
- [ ] 所有 4 个容器状态为 running
- [ ] SSL 证书获取成功
- [ ] https://www.12346.icu 可正常访问
- [ ] 可以正常登录系统

---

## 架构说明

```
                    ┌─────────────────────────────────────┐
                    │              Internet               │
                    └─────────────────────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────────┐
                    │   Traefik (Reverse Proxy + SSL)     │
                    │   - 自动 HTTPS (Let's Encrypt)       │
                    │   - 路由分发                         │
                    │   Port: 80, 443                     │
                    └─────────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
                    ▼                                 ▼
        ┌───────────────────────┐      ┌───────────────────────┐
        │       Frontend        │      │        Backend        │
        │   (React + Nginx)     │      │     (NestJS API)      │
        │                       │      │                       │
        │ Host: www.12346.icu   │      │ Path: /api/*, /hook/* │
        │ Path: /*              │      │                       │
        └───────────────────────┘      └───────────────────────┘
                                                  │
                                                  ▼
                                       ┌───────────────────────┐
                                       │      PostgreSQL       │
                                       │      (Database)       │
                                       └───────────────────────┘
```

### 路由规则

| 域名          | 路径      | 目标服务 |
| ------------- | --------- | -------- |
| www.12346.icu | `/api/*`  | Backend  |
| www.12346.icu | `/hook/*` | Backend  |
| www.12346.icu | `/*`      | Frontend |
| 12346.icu     | `/api/*`  | Backend  |
| 12346.icu     | `/hook/*` | Backend  |

---

## 联系支持

如遇到无法解决的问题，请提供以下信息：

1. 错误截图或完整错误信息
2. `docker compose -f docker-compose.full.yml ps` 输出
3. `docker logs webhook-traefik --tail 50` 输出
4. `.env` 文件内容（隐藏敏感信息）

---

> **文档版本**: 1.0  
> **更新日期**: 2026-01-27  
> **适用域名**: www.12346.icu
