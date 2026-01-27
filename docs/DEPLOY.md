# Webhook Manager - VPS 部署指南

## 项目简介

Webhook Manager 是一个用于创建、管理和监控 Webhook 的全栈应用。

**技术栈**:
- **后端**: NestJS + TypeORM + PostgreSQL + JWT认证
- **前端**: React + Vite + Ant Design + Nginx
- **部署**: Docker + Docker Compose

---

## 前置要求

### 服务器配置
| 配置项 | 最低要求 | 推荐配置 |
|--------|----------|----------|
| CPU | 1核 | 2核+ |
| 内存 | 1GB | 2GB+ |
| 磁盘 | 10GB | 20GB+ SSD |
| 带宽 | 1Mbps | 5Mbps+ |

### 软件要求
- Docker Engine 20.10+
- Docker Compose v2+
- Git
- 域名（可选，用于HTTPS）

---

## 本地编译后部署（推荐）

适用于本地开发环境较强，希望减少服务器构建时间的场景。

### 优势
- 利用本地环境和缓存，构建更快
- 减少服务器资源消耗
- 可在本地验证构建结果后再部署

### 1. 本地编译

```bash
# 在项目根目录
cd webhook_mange

# 安装依赖
npm install

# 编译前后端
npm run build
```

编译后会生成：
- `packages/backend/dist/` - 后端编译产物
- `packages/frontend/dist/` - 前端编译产物

### 2. 打包上传到服务器

```bash
# 打包项目（包含编译产物）
tar -czvf webhook_mange.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  webhook_mange/

# 上传到服务器
scp webhook_mange.tar.gz root@your-server-ip:/opt/

# 服务器上解压
ssh root@your-server-ip
cd /opt
tar -xzvf webhook_mange.tar.gz
cd webhook_mange
```

### 3. 配置环境变量

```bash
cp env.example .env
nano .env
```

### 4. 启动服务（使用预编译版本）

```bash
# 使用预编译版 docker-compose 启动
docker compose -f docker-compose.prebuilt.yml up -d

# 查看启动状态
docker compose -f docker-compose.prebuilt.yml ps

# 查看日志
docker compose -f docker-compose.prebuilt.yml logs -f
```

### 5. 更新部署

```bash
# 本地：重新编译
npm run build

# 本地：打包
tar -czvf webhook_mange.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  webhook_mange/

# 上传并解压（同上）

# 服务器：重新部署
docker compose -f docker-compose.prebuilt.yml down
docker compose -f docker-compose.prebuilt.yml up -d --build
```

---

## 快速部署（HTTP模式）

### 1. 连接服务器

```bash
ssh root@your-server-ip
```

### 2. 安装 Docker（如果未安装）

```bash
# Ubuntu/Debian
apt update
apt install -y docker.io docker-compose
systemctl start docker
systemctl enable docker

# 或使用官方脚本安装最新版本
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### 3. 上传项目

**方式一：Git克隆**
```bash
git clone https://github.com/your-username/webhook_mange.git
cd webhook_mange
```

**方式二：上传压缩包**
```bash
# 本地打包
tar -czvf webhook_mange.tar.gz webhook_mange/

# 上传到服务器（另开终端）
scp webhook_mange.tar.gz root@your-server-ip:/root/

# 服务器解压
mkdir -p /opt/webhook_manager
tar -xzvf webhook_mange.tar.gz -C /opt/webhook_manager/
cd /opt/webhook_manager
```

### 4. 配置环境变量

```bash
# 复制环境变量模板
cp env.example .env

# 编辑配置
nano .env
```

**重要配置项说明**：
```bash
# 数据库配置
DB_USERNAME=webhook          # 数据库用户名
DB_PASSWORD=webhook123       # ⚠️ 请修改为强密码
DB_DATABASE=webhook_manager  # 数据库名称

# JWT配置
JWT_SECRET=your-super-secret-key  # ⚠️ 必须修改！

# 端口配置
FRONTEND_PORT=80             # 前端访问端口
BACKEND_PORT_EXPOSE=3000     # 后端API端口
```

### 5. 启动服务

```bash
# 构建并启动所有服务
docker compose up -d --build

# 查看启动状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 6. 访问应用

- **前端**: http://your-server-ip
- **后端API**: http://your-server-ip:3000/api

---

## HTTPS 部署（推荐）

使用 Traefik 自动管理 SSL 证书。

### 1. 配置域名解析

确保域名已解析到服务器 IP：
```bash
# 验证解析
dig your-domain.com
```

### 2. 编辑环境变量

```bash
cp env.example .env
nano .env
```

修改以下配置：
```bash
# 域名配置
DOMAIN=your-domain.com

# Let's Encrypt 邮箱
ACME_EMAIL=your-email@example.com

# CORS 配置（改为你的域名）
CORS_ORIGIN=https://your-domain.com

# JWT密钥
JWT_SECRET=your-super-secret-key-here
```

### 3. 启动服务

```bash
# 使用 HTTPS 配置文件启动
docker compose -f docker-compose.https.yml up -d --build

# 查看启动状态
docker compose -f docker-compose.https.yml ps

# 查看 Traefik 日志（检查证书申请）
docker compose -f docker-compose.https.yml logs traefik
```

### 4. 访问应用

- **前端**: https://your-domain.com
- **API**: https://your-domain.com/api
- **Webhook接收端点**: https://your-domain.com/hook/xxx

---

## 管理命令

### 服务管理
```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 重启单个服务
docker compose restart backend
docker compose restart frontend

# 查看日志
docker compose logs -f        # 所有服务
docker compose logs -f backend   # 仅后端
docker compose logs -f --tail=100 frontend  # 前端最近100行
```

### 更新部署
```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
docker compose down
docker compose up -d --build

# 清理旧镜像
docker image prune -f
```

### 数据备份
```bash
# 备份数据库
docker exec webhook-postgres pg_dump -U webhook webhook_manager > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker exec -i webhook-postgres psql -U webhook webhook_manager < backup_file.sql
```

### 清理环境
```bash
# 停止并删除数据卷（⚠️ 会删除所有数据）
docker compose down -v

# 完全清理（包括镜像）
docker compose down -v --rmi all
```

---

## 常用端口

| 端口 | 服务 | 说明 |
|------|------|------|
| 80 | Nginx (HTTP) | HTTP访问 |
| 443 | Traefik (HTTPS) | HTTPS访问 |
| 3000 | NestJS API | 后端API |
| 5432 | PostgreSQL | 数据库（仅本地访问） |
| 8080 | Traefik Dashboard | 可选管理界面 |

**防火墙配置**：
```bash
# Ubuntu UFW
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable

# 或使用 iptables
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

---

## 默认账户

首次启动后需要注册管理员账户：
1. 访问前端页面
2. 点击注册
3. 创建管理员账户（第一个注册用户为管理员）

---

## 故障排查

### 1. 服务无法启动
```bash
# 检查容器状态
docker compose ps -a

# 查看详细错误
docker compose logs --tail=50
```

### 2. 数据库连接失败
```bash
# 检查数据库健康状态
docker compose exec postgres pg_isready

# 检查数据库日志
docker compose logs postgres
```

### 3. 前端无法连接后端
```bash
# 检查后端健康状态
curl http://localhost:3000/api/docs

# 检查后端日志
docker compose logs backend
```

### 4. HTTPS 证书申请失败
```bash
# 检查域名解析
dig your-domain.com

# 检查 80/443 端口是否开放
telnet your-domain.com 80

# 查看 Traefik 日志
docker compose -f docker-compose.https.yml logs traefik
```

### 5. 清理并重新开始
```bash
# 完全停止并删除数据
docker compose down -v

# 重新启动
docker compose up -d
```

---

## Docker 镜像说明

### 后端镜像
- **基础镜像**: node:20-alpine
- **构建方式**: 多阶段构建（builder + production）
- **安全优化**: 非 root 用户运行

### 前端镜像
- **基础镜像**: nginx:alpine
- **构建方式**: React 构建后用 Nginx 托管
- **静态资源**: 已压缩和优化

---

## 生产环境建议

1. **安全强化**
   - 修改默认端口
   - 使用强密码和 JWT 密钥
   - 配置防火墙规则
   - 定期更新镜像版本

2. **数据备份**
   - 设置自动备份任务
   - 异地存储备份文件

3. **监控告警**
   - 使用 Docker Stats 监控资源
   - 配置日志收集（如 ELK）
   - 设置服务健康检查告警

4. **性能优化**
   - 根据负载调整 PostgreSQL 连接池
   - 启用 Nginx gzip 压缩
   - 配置 CDN 加速静态资源
