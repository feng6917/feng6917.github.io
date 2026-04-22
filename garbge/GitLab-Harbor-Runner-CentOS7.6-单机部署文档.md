# GitLab + Harbor + GitLab Runner（CentOS 7.6 单机生产部署文档）

适用场景：**单机**、**内网/生产环境**、**无企业 CA（自建 CA）**、**宿主机不暴露 443**、**宿主机 22 保留给 sshd**、**内网无法访问 Docker Hub**（镜像需通过 Harbor 镜像源/离线导入）。

> 本文档已包含部署过程中常见问题与解决方案（“问题排查与解决”章节）。

---

## 0. 最终规划（固定参数）

- **服务器 IP**：`10.0.0.7`
- **GitLab 域名**：`gitlab.myz.com`
- **Harbor 域名**：`harbor.myz.com`
- **不暴露 443**

### 0.1 端口规划（对外暴露）

| 组件 | 协议 | 对外端口 | 访问示例 |
|---|---|---:|---|
| GitLab Web | HTTPS | 10443 | `https://gitlab.myz.com:10443` |
| GitLab Web（可选） | HTTP | 10080 | `http://gitlab.myz.com:10080` |
| GitLab SSH | SSH | 2222 | `ssh -p 2222 git@gitlab.myz.com` |
| Harbor UI/Registry | HTTPS | 18443 | `https://harbor.myz.com:18443` |
| Harbor HTTP（可选） | HTTP | 18082 | `http://harbor.myz.com:18082` |

> 说明：单机同时运行 GitLab/Harbor 时，如果都想占用 443，必须引入反代（Nginx/Traefik/HAProxy）。本文选择**去反代**，使用非 443 端口。

---

## 1. DNS/hosts（必须）

确保所有访问者（开发机、服务器自身、Runner 所在机）都能解析：

```text
10.0.0.7 gitlab.myz.com
10.0.0.7 harbor.myz.com
```

服务器本机建议写入：

```bash
sudo sh -c "grep -q 'gitlab.myz.com' /etc/hosts || echo '10.0.0.7 gitlab.myz.com harbor.myz.com' >> /etc/hosts"
```

> 关键细节：Runner 触发的 **CI job 容器**也必须能解析域名；仅给宿主机写 hosts 并不一定影响容器（见第 8 节/问题排查）。

---

## 2. 系统初始化（CentOS 7.6）

```bash
sudo yum -y update
sudo yum -y install yum-utils device-mapper-persistent-data lvm2 vim wget curl git openssl
sudo yum -y install chrony
sudo systemctl enable --now chronyd
timedatectl set-timezone Asia/Shanghai
```

关闭 SELinux（新手少坑）：

```bash
sudo setenforce 0
sudo sed -i 's/^SELINUX=.*/SELINUX=disabled/' /etc/selinux/config
```

---

## 3. 安装 Docker + Compose

```bash
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum -y install docker-ce docker-ce-cli containerd.io
sudo systemctl enable --now docker
docker version
```

安装 Compose（二进制方式）：

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose version
```

---

## 4. 防火墙（新手方案：直接关闭 firewalld）

> 说明：关闭防火墙会降低主机边界防护，**仅建议在内网隔离环境/新手排障阶段**使用。生产更推荐保留 firewalld 并按最小端口放行。

```bash
sudo systemctl stop firewalld
sudo systemctl disable firewalld
sudo systemctl mask firewalld
sudo systemctl status firewalld --no-pager || true
```

> 关闭 firewalld 后，不再需要 `firewall-cmd` 放行端口；端口是否可达主要取决于 **安全组/交换机 ACL/上层防火墙** 与 **服务是否监听**。

---

## 5. 自建 CA + 签发证书（GitLab/Harbor）

### 5.1 目录

```bash
sudo mkdir -p /srv/certs/{ca,gitlab,harbor}
sudo chmod 700 /srv/certs/ca
```

### 5.2 根 CA（10 年）

```bash
cd /srv/certs/ca
sudo openssl genrsa -out ca.key 4096
sudo openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
  -subj "/C=CN/ST=SH/L=SH/O=MYZ-INTRA/OU=DevOps/CN=MYZ-INTRA-ROOT-CA" \
  -out ca.crt
```

### 5.3 GitLab 站点证书（SAN 必须包含域名 + IP）

```bash
cd /srv/certs/gitlab
sudo openssl genrsa -out privkey.pem 4096
sudo openssl req -new -key privkey.pem \
  -subj "/C=CN/ST=SH/L=SH/O=MYZ/OU=GitLab/CN=gitlab.myz.com" \
  -out gitlab.csr

sudo tee gitlab.ext >/dev/null <<'EOF'
basicConstraints=CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = gitlab.myz.com
IP.1 = 10.0.0.7
EOF

sudo openssl x509 -req -in gitlab.csr \
  -CA /srv/certs/ca/ca.crt -CAkey /srv/certs/ca/ca.key -CAcreateserial \
  -out fullchain.pem -days 825 -sha256 -extfile gitlab.ext
```

### 5.4 Harbor 站点证书

```bash
cd /srv/certs/harbor
sudo openssl genrsa -out privkey.pem 4096
sudo openssl req -new -key privkey.pem \
  -subj "/C=CN/ST=SH/L=SH/O=MYZ/OU=Harbor/CN=harbor.myz.com" \
  -out harbor.csr

sudo tee harbor.ext >/dev/null <<'EOF'
basicConstraints=CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = harbor.myz.com
IP.1 = 10.0.0.7
EOF

sudo openssl x509 -req -in harbor.csr \
  -CA /srv/certs/ca/ca.crt -CAkey /srv/certs/ca/ca.key -CAcreateserial \
  -out fullchain.pem -days 825 -sha256 -extfile harbor.ext
```

### 5.5 系统信任 CA

```bash
sudo cp /srv/certs/ca/ca.crt /etc/pki/ca-trust/source/anchors/myz-intra-ca.crt
sudo update-ca-trust
```

---

## 6. 部署 GitLab（10443）

### 6.1 目录

```bash
sudo mkdir -p /srv/gitlab/{config,logs,data}
```

### 6.2 `docker-compose.yml`

路径：`/srv/gitlab/docker-compose.yml`

```yaml
version: "3.8"
services:
  gitlab:
    image: gitlab/gitlab-ee:latest
    container_name: gitlab
    restart: unless-stopped
    hostname: gitlab.myz.com
    shm_size: "256m"
    ports:
      - "10080:80"
      - "10443:10443"
      - "2222:22"
    volumes:
      - /srv/gitlab/config:/etc/gitlab
      - /srv/gitlab/logs:/var/log/gitlab
      - /srv/gitlab/data:/var/opt/gitlab
      - /srv/certs/gitlab:/etc/gitlab/ssl:ro
    environment:
      GITLAB_OMNIBUS_CONFIG: |
        external_url 'https://gitlab.myz.com:10443'
        nginx['listen_port'] = 10443
        nginx['listen_https'] = true
        nginx['ssl_certificate'] = "/etc/gitlab/ssl/fullchain.pem"
        nginx['ssl_certificate_key'] = "/etc/gitlab/ssl/privkey.pem"
        gitlab_rails['gitlab_ssh_host'] = 'gitlab.myz.com'
        gitlab_rails['gitlab_shell_ssh_port'] = 2222
```

### 6.3 启动与验证

```bash
cd /srv/gitlab
docker-compose up -d
docker logs -f gitlab
```

```bash
curl -vk https://gitlab.myz.com:10443/ | head
```

### 6.4 root 初始密码/重置

读取初始密码（如果存在）：

```bash
docker exec -it gitlab bash -lc "ls -l /etc/gitlab/initial_root_password && sed -n '1,80p' /etc/gitlab/initial_root_password"
```

如果没有该文件，使用 rails console 重置：

```bash
docker exec -it gitlab gitlab-rails console
```

```ruby
u = User.find_by_username('root')
u.password = 'YourNewStrongPassword'
u.password_confirmation = 'YourNewStrongPassword'
u.save!
exit
```

---

## 7. 部署 Harbor（18443，offline installer）

### 7.1 Docker 信任 Harbor（**host:port 目录名关键**）

```bash
sudo mkdir -p /etc/docker/certs.d/harbor.myz.com:18443
sudo cp /srv/certs/ca/ca.crt /etc/docker/certs.d/harbor.myz.com:18443/ca.crt
sudo systemctl restart docker
```

### 7.2 安装配置

将 Harbor offline installer 解压到 `/srv/harbor`，编辑 `/srv/harbor/harbor.yml`：

```yaml
hostname: harbor.myz.com

http:
  port: 18082

https:
  port: 18443
  certificate: /srv/certs/harbor/fullchain.pem
  private_key: /srv/certs/harbor/privkey.pem

harbor_admin_password: ChangeMe_StrongPassword
database:
  password: ChangeMe_DBPassword
data_volume: /data
```

安装：

```bash
cd /srv/harbor
sudo ./prepare
sudo ./install.sh
```

验证：

```bash
curl -vk https://harbor.myz.com:18443/ | head
docker login harbor.myz.com:18443
```

---

## 8. 部署 GitLab Runner（解决：注册 x509 + job 容器解析）

### 8.1 Runner 目录与证书

```bash
sudo mkdir -p /srv/runner/{config,certs}
sudo cp /srv/certs/ca/ca.crt /srv/runner/certs/gitlab.myz.com.crt
```

> 细节：Runner 会按注册 URL 的主机名自动查找 `/etc/gitlab-runner/certs/<host>.crt`。如果你用 IP 注册（`https://10.0.0.7:10443`），则需要放置 `/srv/runner/certs/10.0.0.7.crt`。

### 8.2 Runner compose

路径：`/srv/runner/docker-compose.yml`

```yaml
version: "3.8"
services:
  gitlab-runner:
    image: gitlab/gitlab-runner:latest
    container_name: gitlab-runner
    restart: unless-stopped
    volumes:
      - /srv/runner/config:/etc/gitlab-runner
      - /srv/runner/certs:/etc/gitlab-runner/certs:ro
      - /var/run/docker.sock:/var/run/docker.sock
```

启动：

```bash
cd /srv/runner
docker-compose up -d
```

### 8.3 注册 Runner（示例为域名）

```bash
docker exec -it gitlab-runner gitlab-runner register \
  --url "https://gitlab.myz.com:10443/" \
  --registration-token "<token>" \
  --executor "docker" \
  --description "runner-centos76-single" \
  --docker-image "harbor.myz.com:18443/mirror/docker:27" \
  --docker-privileged="true" \
  --docker-volumes "/var/run/docker.sock:/var/run/docker.sock"
```

验证：

```bash
docker exec -it gitlab-runner gitlab-runner verify
docker logs --tail 80 gitlab-runner
```

### 8.4 让 CI job 容器也能解析域名（**必须**）

编辑：`/srv/runner/config/config.toml`，在对应 runner 的 `[runners.docker]` 下补充：

```toml
extra_hosts = ["gitlab.myz.com:10.0.0.7", "harbor.myz.com:10.0.0.7"]
pull_policy = "if-not-present"
helper_image = "harbor.myz.com:18443/mirror/gitlab-runner-helper:x86_64-4c96e5ad"
```

重启 runner：

```bash
docker restart gitlab-runner
```

---

## 9. 内网无法访问 Docker Hub：用 Harbor 做镜像源（mirror）

### 9.1 Harbor 创建项目

在 `https://harbor.myz.com:18443` 创建：

- `mirror`：基础镜像镜像源（docker-cli/golang/alpine/runner-helper…）
- `ci`：你的业务镜像推送目标（如 `ci/myapp`）

### 9.2 离线搬运镜像（推荐流程）

在**能上网**机器上：

```bash
docker pull docker:27-cli
docker pull golang:1.23-alpine
docker pull alpine:3.20
docker pull gitlab/gitlab-runner-helper:x86_64-4c96e5ad
docker save -o base-images.tar docker:27-cli golang:1.23-alpine alpine:3.20 gitlab/gitlab-runner-helper:x86_64-4c96e5ad
```

将 `base-images.tar` 拷贝到 `10.0.0.7` 后：

```bash
docker load -i base-images.tar
docker login harbor.myz.com:18443 -u admin -p "<密码>"

docker tag docker:27-cli harbor.myz.com:18443/mirror/docker:27
docker push harbor.myz.com:18443/mirror/docker:27

docker tag golang:1.23-alpine harbor.myz.com:18443/mirror/golang:1.23-alpine
docker push harbor.myz.com:18443/mirror/golang:1.23-alpine

docker tag alpine:3.20 harbor.myz.com:18443/mirror/alpine:3.20
docker push harbor.myz.com:18443/mirror/alpine:3.20

docker tag gitlab/gitlab-runner-helper:x86_64-4c96e5ad harbor.myz.com:18443/mirror/gitlab-runner-helper:x86_64-4c96e5ad
docker push harbor.myz.com:18443/mirror/gitlab-runner-helper:x86_64-4c96e5ad
```

> 细节：CI 中 `docker: not found` 通常是你推错了镜像到 `mirror/docker:27`。务必用 `docker:27-cli` 覆盖推送。

---

## 10. CI 构建并推送业务镜像（示例：music_local）

### 10.1 `music_local/Dockerfile`（FROM 全走 Harbor）

```dockerfile
FROM harbor.myz.com:18443/mirror/golang:1.23-alpine AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

FROM harbor.myz.com:18443/mirror/alpine:3.20
WORKDIR /app
COPY --from=builder /out/server /app/server
EXPOSE 8787
ENTRYPOINT ["/app/server"]
```

### 10.2 `.gitlab-ci.yml`（明文账号密码示例）

> 提醒：明文密码会进入仓库历史与日志，生产强烈建议用 Harbor Robot + GitLab Variables。此处按要求给出明文示例。

```yaml
stages: [build]

build_push:
  stage: build
  image: harbor.myz.com:18443/mirror/docker:27
  variables:
    DOCKER_HOST: unix:///var/run/docker.sock
  script:
    - TAG="${CI_COMMIT_SHORT_SHA:-${CI_COMMIT_SHA:-${CI_PIPELINE_IID:-latest}}}"
    - docker login harbor.myz.com:18443 -u "admin" -p "你的密码"
    - docker build -t harbor.myz.com:18443/ci/myapp:$TAG -f music_local/Dockerfile music_local
    - docker push harbor.myz.com:18443/ci/myapp:$TAG
```

---

## 11. 部署/CI 过程常见问题与解决方案（已遇到问题汇总）

### 11.1 端口冲突：`bind: address already in use`（443/22）

- **现象**
  - `listen tcp 0.0.0.0:443: bind: address already in use`
  - `listen tcp 0.0.0.0:22: bind: address already in use`
- **原因**
  - 443 可能被 Nginx/其他容器占用；22 被宿主机 `sshd` 占用。
- **解决**
  - 本方案不使用 443，改用 `10443/18443`。
  - GitLab SSH 映射 `2222:22`，不要映射 `22:22`。

### 11.2 访问方式错误：`http://...:10443` 无法访问

- **原因**：`10443` 是 HTTPS 端口，应使用 `https://...:10443`。
- **解决**：访问 `https://gitlab.myz.com:10443` 或 `https://10.0.0.7:10443`。

### 11.3 `curl` EOF / `PR_END_OF_FILE_ERROR`

- **原因**：常见为协议/端口不匹配、或 GitLab 内部监听端口与宿主映射不一致。
- **解决**：
  - 确保 GitLab `nginx['listen_port']=10443`，宿主映射 `10443:10443`。
  - 优先用 `openssl s_client` 验证 TLS。

### 11.4 证书域名不匹配：`requested domain name does not match the server's certificate`

- **原因**：使用 `127.0.0.1` 访问，但证书 SAN 仅包含 `gitlab.myz.com` 与 `10.0.0.7`。
- **解决**：使用 `https://gitlab.myz.com:10443` 或 `https://10.0.0.7:10443`，不要用 `127.0.0.1`。

### 11.5 Runner 注册 x509：`certificate signed by unknown authority`

- **原因**：Runner 不信任自建 CA。
- **解决（推荐）**：将 CA 放到 runner 专用目录并按主机名命名：
  - `/srv/runner/certs/gitlab.myz.com.crt` 挂载到 `/etc/gitlab-runner/certs/`。

### 11.6 Runner 容器里 `update-ca-trust` / `curl` 不存在

- **原因**：Runner 镜像是 Debian 系，不含 `update-ca-trust`；也可能未安装 curl。
- **解决**：不依赖 update-ca-*，用 `Runner certs` 机制（11.5）；需要排障再临时 `apt-get install -y curl openssl`。

### 11.7 `Could not resolve host: gitlab.myz.com`（checkout 失败）

- **原因**：CI job 容器无法解析内网域名。
- **解决**：在 `/srv/runner/config/config.toml` 的 `[runners.docker]` 增加：
  - `extra_hosts = ["gitlab.myz.com:10.0.0.7", "harbor.myz.com:10.0.0.7"]`

### 11.8 内网无法访问 Docker Hub：`registry-1.docker.io ... timeout`

- **原因**：网络策略/出口限制导致 Docker Hub 不可达。
- **解决**：
  - 通过外网机 `docker save` → 内网 `docker load` → `push` 到 Harbor 的 `mirror`。
  - Dockerfile 的 `FROM` 必须改成 Harbor 地址，否则构建仍会访问 Docker Hub。

### 11.9 CI 中 `docker: not found`

- **原因**：CI job 使用的镜像不含 docker-cli，或 `mirror/docker:27` 推错内容。
- **解决**：将 `docker:27-cli` 推送覆盖到 `harbor.myz.com:18443/mirror/docker:27`，并在 CI 使用该镜像。

### 11.10 镜像 tag 为空：`invalid reference format`

- **原因**：`CI_COMMIT_SHORT_SHA` 为空导致镜像名以 `:` 结尾。
- **解决**：tag 使用兜底：
  - `TAG="${CI_COMMIT_SHORT_SHA:-${CI_COMMIT_SHA:-${CI_PIPELINE_IID:-latest}}}"`

### 11.11 `Dockerfile` 不存在 / Go module 构建失败

- **现象**：`failed to read dockerfile: Dockerfile no such file` / `pattern ./...: directory prefix . does not contain main module`
- **原因**：仓库多模块；构建上下文/入口路径不对。
- **解决**：针对子模块构建（例：`music_local`）：
  - `docker build -f music_local/Dockerfile music_local`
  - `go build ./cmd/server`（不要随意 `./...` 扫全仓库）。

### 11.12 Harbor push `unauthorized`

- **原因**：Harbor 项目不存在或账号无 push 权限（例如 `ci/myapp`、`mirror/*`）。
- **解决**：
  - Harbor 创建项目 `mirror`、`ci`。
  - 推荐创建 **Robot Account**（push/pull）替代 admin。
  - 确认登录时带端口：`docker login harbor.myz.com:18443`

---

## 12. 生产优化建议（建议至少做前两项）

### 12.1 Docker 日志轮转（防爆盘）

`/etc/docker/daemon.json`：

```json
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "50m", "max-file": "3" }
}
```

```bash
sudo systemctl restart docker
```

### 12.2 备份清单（必须）

- GitLab：`/srv/gitlab/config`、`/srv/gitlab/data`
- Harbor：`/data`、`/srv/harbor/harbor.yml`
- CA：
  - `/srv/certs/ca/ca.crt`（需要分发给客户端/Runner/宿主 docker）
  - `/srv/certs/ca/ca.key`（严禁外发，必须权限控制+备份）

### 12.3 权限最小化

- Harbor 推送建议使用 Robot（仅 `push/pull`），避免在 CI 使用 admin。
- GitLab Runner 建议后续迁移到独立机器（资源隔离更安全）。

