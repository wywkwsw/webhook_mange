#!/bin/bash
# ========================================
# Webhook Manager - 数据库备份脚本
# ========================================
#
# 用法：
#   ./scripts/backup.sh              # 执行备份
#   ./scripts/backup.sh --cleanup    # 备份并清理旧文件
#
# ========================================

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${PROJECT_DIR}/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    Webhook Manager 数据库备份${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 执行备份
echo -e "${YELLOW}正在备份数据库...${NC}"
BACKUP_FILE="$BACKUP_DIR/db_$DATE.sql"

if docker exec webhook-postgres pg_dump -U webhook webhook_manager > "$BACKUP_FILE"; then
    # 压缩备份
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ 备份完成${NC}"
    echo -e "  文件: ${BLUE}$BACKUP_FILE${NC}"
    echo -e "  大小: ${BLUE}$SIZE${NC}"
else
    echo -e "${RED}✗ 备份失败${NC}"
    exit 1
fi
echo ""

# 清理旧备份
if [[ "$1" == "--cleanup" ]]; then
    echo -e "${YELLOW}清理 $RETENTION_DAYS 天前的备份...${NC}"
    DELETED=$(find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
    echo -e "${GREEN}✓ 已删除 $DELETED 个旧备份文件${NC}"
    echo ""
fi

# 显示备份列表
echo -e "${YELLOW}当前备份文件：${NC}"
ls -lh "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null || echo "无备份文件"
echo ""

echo -e "${GREEN}备份完成！${NC}"
