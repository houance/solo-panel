# 使用 Node.js 官方镜像作为构建阶段的基础镜像
FROM node:22.13.0-slim as build-stage

# 更新系统依赖
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 声明构建参数，这些值将在构建时通过 --build-arg 传入
ARG VITE_API_BASE_URL

# 复制项目文件（建议先复制 package.json 以提高构建缓存利用率）
COPY package*.json ./
RUN npm install

# 将源代码复制到容器中
COPY . .

# 创建目标目录，下载并解压 PDF.js 到 public/pdfjs
RUN mkdir -p public/pdfjs && \
    wget -O pdfjs.zip https://github.com/mozilla/pdf.js/releases/download/v5.4.149/pdfjs-5.4.149-dist.zip && \
    unzip pdfjs.zip -d public/pdfjs/ && \
    rm pdfjs.zip

# 执行构建命令，Vite 会读取已被修改的 .env.production 文件
RUN npm run build

# 第二阶段, 生产阶段，使用 Nginx 服务静态文件
FROM nginx:alpine as production-stage

# 设置时区（更健壮的Alpine时区设置方式）
ENV TZ=Asia/Shanghai
RUN apk update && apk add --no-cache tzdata && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone && \
    rm -rf /var/cache/apk/*

# 安装shadow包（提供useradd/groupadd命令）
RUN apk add --no-cache shadow

# 创建应用用户和组（动态参数，避免固定GID冲突）
ARG USER_ID=1000
ARG GROUP_ID=1000
ARG USERNAME=solo-panel

# 健壮的用户创建逻辑
RUN set -eux; \
    # 检查组是否存在，不存在则创建 \
    if getent group $GROUP_ID > /dev/null; then \
        existing_group=$(getent group $GROUP_ID | cut -d: -f1); \
        echo "使用已存在的组: $existing_group (GID: $GROUP_ID)"; \
        group_name=$existing_group; \
    else \
        groupadd -g $GROUP_ID app-group; \
        group_name=app-group; \
        echo "创建新组: $group_name (GID: $GROUP_ID)"; \
    fi; \
    \
    # 检查用户是否存在，不存在则创建 \
    if id -u $USER_ID > /dev/null 2>&1; then \
        existing_user=$(id -un $USER_ID); \
        echo "使用已存在的用户: $existing_user (UID: $USER_ID)"; \
        user_name=$existing_user; \
    else \
        useradd -u $USER_ID -g $GROUP_ID -s /bin/sh -d /home/$USERNAME -m $USERNAME; \
        user_name=$USERNAME; \
        echo "创建新用户: $user_name (UID: $USER_ID)"; \
    fi; \
    \
    # 确保Nginx目录权限正确 \
    chown -R $USER_ID:$GROUP_ID /var/cache/nginx && \
    chmod -R g+w /var/cache/nginx

# 删除默认的 nginx 配置
RUN rm /etc/nginx/conf.d/default.conf
# 复制自定义的 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/

# 复制构建产物
COPY --from=build-stage --chown=$USER_ID:$GROUP_ID /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]