# SSL 证书目录

此目录用于存放 SSL 证书文件（手动证书方案）。

## 需要的文件

| 文件名 | 说明 |
|--------|------|
| `privkey.pem` | 私钥文件 |
| `fullchain.pem` | 完整证书链（包含中间证书） |

## 获取证书

### 方式一：Let's Encrypt（免费）

```bash
# 安装 certbot
sudo apt install certbot -y

# 获取证书（独立模式，需要先停止 80 端口服务）
sudo certbot certonly --standalone -d your-domain.com

# 证书位置
# /etc/letsencrypt/live/your-domain.com/privkey.pem
# /etc/letsencrypt/live/your-domain.com/fullchain.pem

# 复制证书
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/
```

### 方式二：宝塔面板

1. 在宝塔中为域名申请 SSL 证书
2. 下载证书文件
3. 将 `privkey.pem` 和 `fullchain.pem` 复制到此目录

### 方式三：购买商业证书

从 DigiCert、Comodo 等购买证书后，按照他们的说明导出为 PEM 格式。

## 证书续期

Let's Encrypt 证书有效期 90 天，需要定期续期：

```bash
# 手动续期
sudo certbot renew

# 设置自动续期（推荐）
echo "0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/your-domain.com/*.pem /path/to/ssl/ && docker compose restart frontend" | crontab -
```

## 注意事项

⚠️ **不要将证书文件提交到 Git！**

此目录已在 `.gitignore` 中排除，请确保：
- 不要手动添加证书文件到 Git
- 备份证书到安全位置
