#!/bin/bash
# ========================================
# Webhook Manager - 更新部署脚本
# ========================================
#
# 用法：
#   ./scripts/update.sh              # 更新全栈部署
#   ./scripts/update.sh backend      # 仅更新后端
#   ./scripts/update.sh frontend     # 仅更新前端
#   ./scripts/update.sh --no-backup  # 跳过备份（不推荐）
#
# ========================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${PROJECT_DIR}/backups"
COMPOSE_FILE="docker-compose.full.yml"
DATE=$(date +%Y%m%d_%H%M%S)

# 解析参数
SERVICE=""
SKIP_BACKUP=false

for arg in "$@"; do
    case $arg in
        backend|frontend)
            SERVICE=$arg
            ;;
        --no-backup)
            SKIP_BACKUP=true
            ;;
    esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    Webhook Manager 更新部署${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

cd "$PROJECT_DIR"

# 步骤 1：备份数据库
if [ "$SKIP_BACKUP" = false ]; then
    echo -e "${YELLOW}[1/4] 备份数据库...${NC}"
    mkdir -p "$BACKUP_DIR"
    
    if docker exec webhook-postgres pg_dump -U webhook webhook_manager > "$BACKUP_DIR/db_$DATE.sql" 2>/dev/null; then
        echo -e "${GREEN}✓ 数据库备份完成: $BACKUP_DIR/db_$DATE.sql${NC}"
        
        # 保留最近 7 天的备份
        find "$BACKUP_DIR" -name "db_*.sql" -mtime +7 -delete 2>/dev/null || true
    else
        echo -e "${RED}⚠ 数据库备份失败（可能是首次部署）${NC}"
    fi
else
    echo -e "${YELLOW}[1/4] 跳过数据库备份${NC}"
fi
echo ""

# 步骤 2：拉取最新代码
echo -e "${YELLOW}[2/4] 拉取最新代码...${NC}"
if git pull; then
    echo -e "${GREEN}✓ 代码更新完成${NC}"
else
    echo -e "${RED}✗ 代码更新失败${NC}"
    exit 1
fi
echo ""

# 步骤 3：重新构建并部署
echo -e "${YELLOW}[3/4] 重新构建并部署...${NC}"
if [ -n "$SERVICE" ]; then
    echo -e "仅更新服务: ${BLUE}$SERVICE${NC}"
    docker compose -f "$COMPOSE_FILE" up -d --build --no-deps "$SERVICE"
else
    echo -e "更新所有服务"
    docker compose -f "$COMPOSE_FILE" up -d --build
fi
echo -e "${GREEN}✓ 部署完成${NC}"
echo ""

# 步骤 4：清理旧镜像
echo -e "${YELLOW}[4/4] 清理旧镜像...${NC}"
docker image prune -f > /dev/null 2>&1 || true
echo -e "${GREEN}✓ 清理完成${NC}"
echo ""

# 完成
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}    更新完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "查看日志: ${BLUE}docker compose -f $COMPOSE_FILE logs -f${NC}"
echo -e "检查状态: ${BLUE}docker compose -f $COMPOSE_FILE ps${NC}"
echo ""

# 显示服务状态
docker compose -f "$COMPOSE_FILE" ps
