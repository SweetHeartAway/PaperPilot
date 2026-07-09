# ─── Build Stage ──────────────────────────────────────
FROM node:20-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ─── Serve Stage ──────────────────────────────────────
FROM nginx:alpine

# 复制构建产物
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx 配置：代理 /api/ 到后端 + 静态文件服务
RUN echo '\
server {\
    listen       80;\
    server_name  localhost;\
\
    # API 反向代理到后端容器\
    location /api/ {\
        proxy_pass http://backend:8000;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
\
    # 静态文件服务（SPA 路由回退）\
    location / {\
        root   /usr/share/nginx/html;\
        index  index.html;\
        try_files $uri $uri/ /index.html;\
    }\
}\
' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
