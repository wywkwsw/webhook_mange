# Webhook Manager 数据迁移指南

> 本文档描述如何备份、迁移和恢复 Webhook Manager 的数据

---

## 目录

- [数据组成](#数据组成)
- [备份数据](#备份数据)
- [迁移到新服务器](#迁移到新服务器)
- [恢复数据](#恢复数据)
- [自动备份脚本](#自动备份脚本)
- [常见问题](#常见问题)

---

## 数据组成

Webhook Manager 的数据主要包括以下部分：

| 数据类型 | 存储位置 | 说明 |
|----------|----------|------|
| PostgreSQL 数据库 | Docker Volume `postgres_data` | 用户、Webhook 配置、日志记录 |
| SSL 证书 | Docker Volume `letsencrypt_data` | Let's Encrypt 自动颁发的证书 |
| 环境配置 | `.env` 文件 | 数据库密码、JWT 密钥等敏感配置 |

---

## 备份数据

### 1. 完整备份（推荐）

在源服务器上执行以下命令进行完整备份：

```bash
#!/bin/bash
# 创建备份目录
BACKUP_DIR="/opt/webhook_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

cd /opt/webhook_mange

# 1. 备份数据库
echo "=== 备份数据库 ==="
docker exec webhook-postgres pg_dump -U webhook webhook_manager > $BACKUP_DIR/database.sql

# 2. 备份环境配置
echo "=== 备份环境配置 ==="
cp .env $BACKUP_DIR/env.backup

# 3. 备份 SSL 证书（可选，新服务器会自动获取）
echo "=== 备份 SSL 证书 ==="
docker cp webhook-traefik:/letsencrypt/acme.json $BACKUP_DIR/acme.json 2>/dev/null || echo "SSL 证书备份跳过"

# 4. 创建压缩包
echo "=== 创建压缩包 ==="
tar -czvf webhook_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C $(dirname $BACKUP_DIR) $(basename $BACKUP_DIR)

echo "=== 备份完成 ==="
echo "备份文件: webhook_backup_*.tar.gz"
ls -la webhook_backup_*.tar.gz
```

### 2. 仅备份数据库

```bash
# 进入项目目录
cd /opt/webhook_mange

# 备份数据库到 SQL 文件
docker exec webhook-postgres pg_dump -U webhook webhook_manager > backup_$(date +%Y%m%d).sql

# 查看备份文件
ls -la backup_*.sql
```

### 3. 备份数据库（带压缩）

```bash
docker exec webhook-postgres pg_dump -U webhook webhook_manager | gzip > backup_$(date +%Y%m%d).sql.gz
```

---

## 迁移到新服务器

### 步骤 1：准备新服务器

在新服务器上按照 [deploy-12346icu.md](./deploy-12346icu.md) 完成基础环境配置：

```bash
# 1. 安装 Docker
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker

# 2. 配置防火墙
ufw allow ssh
ufw allow 80
ufw allow 443
ufw enable

# 3. 上传项目代码
cd /opt
git clone <your-repo-url> webhook_mange
cd webhook_mange
```

### 步骤 2：传输备份文件

从源服务器传输备份文件到新服务器：

```bash
# 在源服务器执行
scp /opt/webhook_backup_*.tar.gz root@new-server-ip:/opt/

# 或使用 rsync（更适合大文件）
rsync -avz --progress /opt/webhook_backup_*.tar.gz root@new-server-ip:/opt/
```

### 步骤 3：在新服务器解压备份

```bash
# 在新服务器执行
cd /opt
tar -xzvf webhook_backup_*.tar.gz

# 查看解压内容
ls -la webhook_backup_*/
```

### 步骤 4：恢复环境配置

```bash
cd /opt/webhook_mange

# 复制备份的环境配置
cp /opt/webhook_backup_*/env.backup .env

# 编辑并确认配置（如需修改域名等）
nano .env
```

### 步骤 5：启动服务（不恢复数据）

```bash
# 首先启动服务，让数据库初始化
docker compose -f docker-compose.full.yml up -d

# 等待数据库完全启动
sleep 30

# 检查数据库状态
docker compose -f docker-compose.full.yml ps
```

### 步骤 6：恢复数据库

```bash
# 停止后端（防止写入冲突）
docker compose -f docker-compose.full.yml stop backend

# 恢复数据库
cat /opt/webhook_backup_*/database.sql | docker exec -i webhook-postgres psql -U webhook webhook_manager

# 重启后端
docker compose -f docker-compose.full.yml start backend

# 验证恢复
docker compose -f docker-compose.full.yml logs backend --tail 20
```

### 步骤 7：恢复 SSL 证书（可选）

如果想复用旧证书而不重新申请：

```bash
# 停止 Traefik
docker compose -f docker-compose.full.yml stop traefik

# 复制证书文件
docker cp /opt/webhook_backup_*/acme.json webhook-traefik:/letsencrypt/acme.json

# 重启 Traefik
docker compose -f docker-compose.full.yml start traefik
```

> **注意**：通常不需要恢复 SSL 证书，Traefik 会自动从 Let's Encrypt 获取新证书。

### 步骤 8：更新 DNS 解析

将域名 DNS 指向新服务器 IP：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| A | @ | new-server-ip |
| A | www | new-server-ip |

### 步骤 9：验证迁移

```bash
# 检查所有服务状态
docker compose -f docker-compose.full.yml ps

# 测试 HTTPS 访问
curl -I https://www.12346.icu

# 检查 SSL 证书
curl -vI https://www.12346.icu 2>&1 | grep -i "issuer\|subject"
```

---

## 恢复数据

### 从 SQL 文件恢复

```bash
# 完整恢复（会清除现有数据）
cat backup_20260127.sql | docker exec -i webhook-postgres psql -U webhook webhook_manager

# 或者使用 psql 恢复
docker exec -i webhook-postgres psql -U webhook webhook_manager < backup_20260127.sql
```

### 从压缩文件恢复

```bash
gunzip -c backup_20260127.sql.gz | docker exec -i webhook-postgres psql -U webhook webhook_manager
```

### 恢复前清空数据库（可选）

如果需要完全重置再恢复：

```bash
# 删除并重建数据库
docker exec -i webhook-postgres psql -U webhook -c "DROP DATABASE webhook_manager;"
docker exec -i webhook-postgres psql -U webhook -c "CREATE DATABASE webhook_manager;"

# 然后恢复
cat backup_20260127.sql | docker exec -i webhook-postgres psql -U webhook webhook_manager
```

---

## 自动备份脚本

### 创建定时备份脚本

```bash
# 创建备份脚本
cat > /opt/webhook_mange/backup.sh << 'EOF'
#!/bin/bash
set -e

# 配置
BACKUP_DIR="/opt/backups/webhook"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
echo "[$(date)] Starting database backup..."
docker exec webhook-postgres pg_dump -U webhook webhook_manager | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 备份环境配置
cp /opt/webhook_mange/.env $BACKUP_DIR/env_$DATE.backup

# 清理旧备份
echo "[$(date)] Cleaning old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "env_*.backup" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
EOF

# 添加执行权限
chmod +x /opt/webhook_mange/backup.sh
```

### 配置定时任务（Cron）

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天凌晨 3 点执行备份）
0 3 * * * /opt/webhook_mange/backup.sh >> /var/log/webhook_backup.log 2>&1
```

### 验证定时任务

```bash
# 查看 crontab
crontab -l

# 手动测试备份脚本
/opt/webhook_mange/backup.sh

# 查看备份文件
ls -la /opt/backups/webhook/
```

---

## 常见问题

### Q1：恢复后无法登录

**原因**：可能是 JWT_SECRET 不一致

**解决方案**：
1. 确保 `.env` 中的 `JWT_SECRET` 与备份时相同
2. 重启后端服务：`docker compose -f docker-compose.full.yml restart backend`

### Q2：恢复后数据为空

**原因**：恢复到了错误的数据库或恢复命令执行失败

**解决方案**：
```bash
# 检查数据库连接
docker exec -it webhook-postgres psql -U webhook webhook_manager -c "SELECT COUNT(*) FROM \"user\";"

# 重新执行恢复
cat backup.sql | docker exec -i webhook-postgres psql -U webhook webhook_manager
```

### Q3：SSL 证书无法恢复

**原因**：证书与域名或服务器绑定

**解决方案**：
- 不需要恢复旧证书
- Traefik 会自动申请新证书
- 删除旧证书重新申请：`docker exec webhook-traefik rm /letsencrypt/acme.json && docker compose restart traefik`

### Q4：迁移后 Webhook URL 变更

**原因**：域名或路径发生变化

**解决方案**：
- 更新调用方（如 TradingView）的 Webhook URL
- 新 URL 格式：`https://www.12346.icu/hook/<path>`

### Q5：数据库连接被拒绝

**原因**：数据库容器未完全启动或密码不匹配

**解决方案**：
```bash
# 检查数据库状态
docker compose -f docker-compose.full.yml ps postgres

# 查看数据库日志
docker logs webhook-postgres --tail 50

# 确保 .env 中密码与备份时相同
```

---

## 快速命令参考

### 更新部署（带备份）

```bash
# 一键更新脚本
cd /opt/webhook_mange

# 1. 备份
docker exec webhook-postgres pg_dump -U webhook webhook_manager > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. 更新代码
git pull

# 3. 重新部署
docker compose -f docker-compose.full.yml up -d --build

# 4. 查看日志
docker compose -f docker-compose.full.yml logs -f --tail=50
```

### 基础操作

```bash
# 备份数据库
docker exec webhook-postgres pg_dump -U webhook webhook_manager > backup.sql

# 恢复数据库
cat backup.sql | docker exec -i webhook-postgres psql -U webhook webhook_manager

# 查看数据库中的表
docker exec -it webhook-postgres psql -U webhook webhook_manager -c "\dt"

# 查看用户数量
docker exec -it webhook-postgres psql -U webhook webhook_manager -c "SELECT COUNT(*) FROM \"user\";"

# 查看 Webhook 数量
docker exec -it webhook-postgres psql -U webhook webhook_manager -c "SELECT COUNT(*) FROM webhook;"

# 进入数据库交互模式
docker exec -it webhook-postgres psql -U webhook webhook_manager
```

---

---

## 域名更换指南

当域名到期或需要更换域名时，按以下步骤操作。

### 步骤 1：配置新域名 DNS

在新域名服务商处添加 DNS 解析：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| A | @ | your-server-ip |
| A | www | your-server-ip |

> DNS 解析生效可能需要几分钟到几小时。

验证 DNS 解析：
```bash
dig new-domain.com +short
dig www.new-domain.com +short
# 应该返回你的服务器 IP
```

### 步骤 2：更新环境配置

```bash
cd /opt/webhook_mange

# 编辑 .env 文件
nano .env
```

修改以下配置项：

```ini
# 更新域名
DOMAIN=new-domain.com
FRONTEND_DOMAIN=www.new-domain.com

# 更新 CORS（重要！）
CORS_ORIGIN=https://www.new-domain.com

# 更新 Let's Encrypt 邮箱（如果需要）
ACME_EMAIL=admin@new-domain.com
```

### 步骤 3：删除旧 SSL 证书

旧证书与旧域名绑定，需要删除让 Traefik 重新申请：

```bash
# 停止 Traefik
docker compose -f docker-compose.full.yml stop traefik

# 删除旧证书
docker volume rm webhook_mange_letsencrypt_data 2>/dev/null || true

# 或者进入容器删除
docker exec webhook-traefik rm /letsencrypt/acme.json 2>/dev/null || true
```

### 步骤 4：重新部署

```bash
# 重新启动所有服务
docker compose -f docker-compose.full.yml down
docker compose -f docker-compose.full.yml up -d

# 查看 Traefik 日志，确认证书申请成功
docker logs webhook-traefik 2>&1 | grep -i "certificate\|acme"
```

### 步骤 5：验证新域名

```bash
# 测试 HTTPS 访问
curl -I https://www.new-domain.com

# 检查 SSL 证书
curl -vI https://www.new-domain.com 2>&1 | grep -i "subject\|issuer"
```

### 步骤 6：更新 Webhook URL（重要！）

如果你在第三方服务（如 TradingView）配置了 Webhook URL，需要更新：

**旧地址**：`https://old-domain.com/hook/your-path`

**新地址**：`https://www.new-domain.com/hook/your-path`

### 域名更换检查清单

- [ ] 新域名 DNS 已解析到服务器 IP
- [ ] `.env` 中 `DOMAIN` 已更新
- [ ] `.env` 中 `FRONTEND_DOMAIN` 已更新
- [ ] `.env` 中 `CORS_ORIGIN` 已更新
- [ ] 旧 SSL 证书已删除
- [ ] 服务已重新部署
- [ ] 新域名可通过 HTTPS 正常访问
- [ ] SSL 证书已正确颁发给新域名
- [ ] 第三方服务的 Webhook URL 已更新

### 常见问题

#### Q1：新域名无法访问

**检查 DNS**：
```bash
dig www.new-domain.com +short
```
如果返回空，说明 DNS 还未生效，等待几分钟再试。

#### Q2：SSL 证书申请失败

**检查原因**：
```bash
docker logs webhook-traefik 2>&1 | grep -i "error\|acme"
```

常见原因：
- DNS 未生效
- 80 端口被占用
- Let's Encrypt 速率限制（同一域名短时间内申请次数过多）

#### Q3：CORS 错误

确保 `.env` 中的 `CORS_ORIGIN` 与新域名一致：
```ini
CORS_ORIGIN=https://www.new-domain.com
```

重启后端服务：
```bash
docker compose -f docker-compose.full.yml restart backend
```

---

## 迁移检查清单

- [ ] 源服务器数据库备份完成
- [ ] 环境配置文件备份完成
- [ ] 备份文件已传输到新服务器
- [ ] 新服务器 Docker 已安装
- [ ] 新服务器防火墙已配置
- [ ] 项目代码已上传到新服务器
- [ ] .env 配置已复制并检查
- [ ] 服务已启动
- [ ] 数据库已恢复
- [ ] DNS 已更新指向新服务器
- [ ] HTTPS 可正常访问
- [ ] 可以正常登录
- [ ] Webhook 功能测试通过

---

> **文档版本**: 1.0  
> **更新日期**: 2026-01-27
