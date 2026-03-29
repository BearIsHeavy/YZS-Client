# YanZhuShou Frontend - Docker 部署指南

## 📦 快速部署

### 方法一：Docker Compose（推荐）

```bash
# 1. 克隆项目并进入目录
cd /path/to/YanZhuShou/Client

# 2. 配置环境变量（可选）
cp .env.example .env
# 编辑 .env 文件，设置 API 地址
# VITE_API_URL=http://your-backend-url:8000

# 3. 构建并启动
docker-compose up -d --build

# 4. 查看日志
docker-compose logs -f

# 5. 停止服务
docker-compose down
```

### 方法二：纯 Docker 命令

```bash
# 1. 构建镜像
docker build -t yan-zhu-shou-frontend:latest \
  --build-arg VITE_API_URL=http://localhost:8000 \
  .

# 2. 运行容器
docker run -d \
  --name yan-zhu-shou-frontend \
  -p 80:80 \
  --restart unless-stopped \
  yan-zhu-shou-frontend:latest

# 3. 查看日志
docker logs -f yan-zhu-shou-frontend

# 4. 停止容器
docker stop yan-zhu-shou-frontend
docker rm yan-zhu-shou-frontend
```

## ⚙️ 配置选项

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `VITE_API_URL` | `http://localhost:8000` | 后端 API 地址 |
| `HOST_PORT` | `80` | 主机映射端口 |

### .env 文件示例

```bash
# 后端 API 地址
VITE_API_URL=http://192.168.1.100:8000

# 主机端口
HOST_PORT=8080
```

## 🔍 常用命令

```bash
# 查看容器状态
docker ps -a | grep yan-zhu-shou

# 进入容器
docker exec -it yan-zhu-shou-frontend sh

# 重启容器
docker-compose restart

# 重新构建
docker-compose build --no-cache

# 清理资源
docker-compose down -v  # 删除卷
docker-compose down --rmi all  # 删除镜像
```

## 📊 健康检查

```bash
# 检查容器健康状态
docker inspect --format='{{.State.Health.Status}}' yan-zhu-shou-frontend

# 或直接访问
curl http://localhost:80/
```

## 🔐 安全建议

1. **生产环境**：使用 HTTPS，在 nginx.conf 中配置 SSL
2. **防火墙**：只开放必要端口
3. **更新**：定期更新基础镜像 `docker pull nginx:alpine`
4. **日志**：挂载日志卷持久化存储

## 📝 Nginx 配置

自定义 nginx 配置请编辑 `nginx.conf`，然后重新构建：

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🐛 故障排查

### 容器无法启动

```bash
# 查看日志
docker-compose logs

# 检查端口占用
docker ps | grep :80
```

### 页面空白

1. 检查后端 API 是否可访问
2. 查看浏览器控制台错误
3. 确认 `VITE_API_URL` 配置正确

### 404 错误

确保 nginx.conf 中包含 Vue Router 历史模式支持：
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## 📈 性能优化

1. **启用 Gzip**：已在 nginx.conf 中配置
2. **静态资源缓存**：已配置 1 年缓存
3. **HTTP/2**：如需启用，修改 nginx.conf：
   ```nginx
   listen 443 ssl http2;
   ```

## 🚀 生产环境部署

### 使用 Docker Swarm

```bash
# 初始化 Swarm
docker swarm init

# 部署服务
docker stack deploy -c docker-compose.yml yan-zhu-shou

# 查看服务
docker service ls

# 扩缩容
docker service scale yan-zhu-shou-frontend=3
```

### 使用 Kubernetes

创建 `k8s-deployment.yaml`：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: yan-zhu-shou-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: yan-zhu-shou-frontend
  template:
    metadata:
      labels:
        app: yan-zhu-shou-frontend
    spec:
      containers:
      - name: frontend
        image: yan-zhu-shou-frontend:latest
        ports:
        - containerPort: 80
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: yan-zhu-shou-frontend
spec:
  selector:
    app: yan-zhu-shou-frontend
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

部署：
```bash
kubectl apply -f k8s-deployment.yaml
```

## 📞 技术支持

如有问题，请检查：
1. Docker 版本：`docker --version`
2. Docker Compose 版本：`docker-compose --version`
3. 容器日志：`docker-compose logs`

---

**YanZhuShou - 智能学习平台**

Built with ❤️ using Vue 3 + TypeScript + Element Plus
