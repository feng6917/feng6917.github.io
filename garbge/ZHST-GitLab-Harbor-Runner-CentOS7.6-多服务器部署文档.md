# ZHST 多服务器部署文档（GitLab + Harbor + GitLab Runner，CentOS 7.6）

适用场景：**三台服务器分离部署**、**内网自建 CA**、**对外开放 80/443**、**内网可能无法访问 Docker Hub（需要 Harbor 镜像源/离线导入）**。

> 本文同时整理了部署过程中常见问题与解决方案（见“常见问题与解决方案”章节）。

---

## 0. 角色与固定信息

### 0.1 服务器角色与 IP

| 角色 | IP | 说明 |
|---|---:|---|
| GitLab | `10.0.0.186` | Web：`80/443`；GitLab SSH：`22`（见 6.3 冲突处理） |
| GitLab Runner | `10.0.0.187` | 一般不需要对外暴露端口 |
| Harbor | `10.0.0.188` | Web/Registry：`80/443` |

### 0.2 域名（内网 DNS 或 hosts）

- `gitlab.zhst.com` → `10.0.0.186`
- `harbor.zhst.com` → `10.0.0.188`

访问目标：

- GitLab：`https://gitlab.zhst.com`
- Harbor：`https://harbor.zhst.com`
- Registry：`harbor.zhst.com/<project>/<repo>:<tag>`

---

## 1. 新手执行顺序（强烈建议照此顺序）

1. **DNS/hosts**（三台都能解析域名）
2. **系统初始化 + Docker + Compose**（三台）
3. **自建 CA + 签发证书**（建议 GitLab 机生成，分发到 Harbor/Runner/开发机）
4. **系统信任 CA**（三台 + 开发机）
5. **GitLab 部署**（GitLab 机）
6. **Harbor 部署**（Harbor 机）
7. **Runner 部署 + 注册**（Runner 机）
8. **Harbor mirror 基础镜像**（解决 DockerHub 不可达）
9. **CI 构建推送**（业务项目）

---

## 2. DNS / hosts（必须）

### 2.1 内网 DNS（推荐）

在公司 DNS 增加 A 记录：

```text
10.0.0.186 gitlab.zhst.com
10.0.0.188 harbor.zhst.com
```

### 2.2 临时 hosts（三台都建议写）

```bash
sudo sh -c "grep -q 'gitlab.zhst.com' /etc/hosts || echo '10.0.0.186 gitlab.zhst.com' >> /etc/hosts"
sudo sh -c "grep -q 'harbor.zhst.com' /etc/hosts || echo '10.0.0.188 harbor.zhst.com' >> /etc/hosts"
```

验证：

```bash
ping -c 1 gitlab.zhst.com
ping -c 1 harbor.zhst.com
```

---

## 3. 系统初始化（三台都做）

```bash
sudo yum -y update
sudo yum -y install vim wget curl git openssl chrony
sudo systemctl enable --now chronyd
timedatectl set-timezone Asia/Shanghai
```

新手建议关闭 SELinux（减少坑）：

```bash
sudo setenforce 0
sudo sed -i 's/^SELINUX=.*/SELINUX=disabled/' /etc/selinux/config
```

---

## 4. 安装 Docker + Compose（三台都做）

```bash
sudo yum -y install yum-utils device-mapper-persistent-data lvm2
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum -y install docker-ce docker-ce-cli containerd.io
sudo systemctl enable --now docker
docker version
```

Compose：

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose version
```

---

## 5. 防火墙（新手方案：直接关闭 firewalld）

> 说明：关闭防火墙会降低主机边界防护，**仅建议在内网隔离环境/新手排障阶段**使用。生产更推荐保留 firewalld 并按最小端口放行。

在三台服务器（GitLab/Harbor/Runner）都执行：

```bash
sudo systemctl stop firewalld
sudo systemctl disable firewalld
sudo systemctl mask firewalld
sudo systemctl status firewalld --no-pager || true
```

> 关闭 firewalld 后，不再需要 `firewall-cmd` 放行 `80/443/2222`；端口是否可达主要取决于 **安全组/交换机 ACL/上层防火墙** 与 **服务是否监听**。

---

## 6. 自建 CA + 签发证书（建议 GitLab 机生成）

### 6.1 在 GitLab 机创建目录

```bash
sudo mkdir -p /srv/certs/{ca,gitlab,harbor}
sudo chmod 700 /srv/certs/ca
```

### 6.2 生成根 CA

```bash
cd /srv/certs/ca
sudo openssl genrsa -out ca.key 4096
sudo openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
  -subj "/C=CN/ST=SH/L=SH/O=ZHST-INTRA/OU=DevOps/CN=ZHST-INTRA-ROOT-CA" \
  -out ca.crt
```

### 6.3 签发 GitLab 证书（SAN：域名 + GitLab IP）

```bash
cd /srv/certs/gitlab
sudo openssl genrsa -out privkey.pem 4096
sudo openssl req -new -key privkey.pem \
  -subj "/C=CN/ST=SH/L=SH/O=ZHST/OU=GitLab/CN=gitlab.zhst.com" \
  -out gitlab.csr

sudo tee gitlab.ext >/dev/null <<'EOF'
basicConstraints=CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = gitlab.zhst.com
IP.1 = 10.0.0.186
EOF

sudo openssl x509 -req -in gitlab.csr \
  -CA /srv/certs/ca/ca.crt -CAkey /srv/certs/ca/ca.key -CAcreateserial \
  -out fullchain.pem -days 825 -sha256 -extfile gitlab.ext
```

### 6.4 签发 Harbor 证书（SAN：域名 + Harbor IP）

```bash
cd /srv/certs/harbor
sudo openssl genrsa -out privkey.pem 4096
sudo openssl req -new -key privkey.pem \
  -subj "/C=CN/ST=SH/L=SH/O=ZHST/OU=Harbor/CN=harbor.zhst.com" \
  -out harbor.csr

sudo tee harbor.ext >/dev/null <<'EOF'
basicConstraints=CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = harbor.zhst.com
IP.1 = 10.0.0.188
EOF

sudo openssl x509 -req -in harbor.csr \
  -CA /srv/certs/ca/ca.crt -CAkey /srv/certs/ca/ca.key -CAcreateserial \
  -out fullchain.pem -days 825 -sha256 -extfile harbor.ext
```

### 6.5 分发证书文件

把以下文件拷贝到 Harbor 机对应路径（可用 scp/WinSCp）：

- Harbor：`/srv/certs/harbor/fullchain.pem`、`/srv/certs/harbor/privkey.pem`
- 三台机器都需要：`/srv/certs/ca/ca.crt`（用于系统信任与 Docker 信任）

---

## 7. 系统信任 CA（GitLab/Harbor/Runner 三台都做）

```bash
sudo cp /srv/certs/ca/ca.crt /etc/pki/ca-trust/source/anchors/zhst-intra-ca.crt
sudo update-ca-trust
```

开发机 Windows：导入 `ca.crt` 到“受信任的根证书颁发机构”，否则浏览器会提示不受信任。

---

## 8. 部署 GitLab（10.0.0.186）

### 8.1 目录

```bash
sudo mkdir -p /srv/gitlab/{config,logs,data}
```

### 8.2 `docker-compose.yml`（标准 80/443）

路径：`/srv/gitlab/docker-compose.yml`

```yaml
version: "3.8"
services:
  gitlab:
    image: gitlab/gitlab-ee:latest
    container_name: gitlab
    restart: unless-stopped
    hostname: gitlab.zhst.com
    shm_size: "256m"
    ports:
      - "80:80"
      - "443:443"
      - "22:22"
    volumes:
      - /srv/gitlab/config:/etc/gitlab
      - /srv/gitlab/logs:/var/log/gitlab
      - /srv/gitlab/data:/var/opt/gitlab
      - /srv/certs/gitlab:/etc/gitlab/ssl:ro
    environment:
      GITLAB_OMNIBUS_CONFIG: |
        external_url 'https://gitlab.zhst.com'
        nginx['ssl_certificate'] = "/etc/gitlab/ssl/fullchain.pem"
        nginx['ssl_certificate_key'] = "/etc/gitlab/ssl/privkey.pem"
        gitlab_rails['gitlab_ssh_host'] = 'gitlab.zhst.com'
        gitlab_rails['gitlab_shell_ssh_port'] = 22
```

启动：

```bash
cd /srv/gitlab
docker-compose up -d
docker logs -f gitlab
```

验证：

```bash
curl -vk https://gitlab.zhst.com/ | head
```

### 8.3 GitLab SSH 使用 22 与宿主机 sshd 冲突（必须处理）

**事实**：宿主机 `sshd` 默认监听 `22`。若 GitLab 容器也要映射 `22:22`，必须把运维 sshd 改到其它端口（例如 `2222`），否则无法同时占用。

推荐流程（GitLab 机执行）：

1) 修改 `/etc/ssh/sshd_config`：

```text
Port 2222
```

2) 重启 sshd：

```bash
sudo systemctl restart sshd
```

3) **务必另开终端验证**：

```bash
ssh -p 2222 root@10.0.0.186
```

成功后再启动 GitLab compose（含 `22:22`）。

> 若你无法改运维 ssh 端口：请放弃 GitLab SSH=22，改用 HTTPS clone 或 GitLab SSH 用非 22 端口。

---

## 9. 部署 Harbor（10.0.0.188，offline installer）

### 9.1 解压与配置

解压 Harbor offline installer 到 `/srv/harbor`，编辑 `/srv/harbor/harbor.yml`：

```yaml
hostname: harbor.zhst.com

http:
  port: 80

https:
  port: 443
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
curl -vk https://harbor.zhst.com/ | head
```

---

## 10. Runner（10.0.0.187）

### 10.1 准备 Runner 证书（解决注册 x509）

```bash
sudo mkdir -p /srv/runner/{config,certs}
sudo cp /srv/certs/ca/ca.crt /srv/runner/certs/gitlab.zhst.com.crt
```

`/srv/runner/docker-compose.yml`：

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

### 10.2 让 CI job 容器能解析域名（无内网 DNS 时必做）

编辑 `/srv/runner/config/config.toml`，在 `[runners.docker]` 增加：

```toml
extra_hosts = ["gitlab.zhst.com:10.0.0.186", "harbor.zhst.com:10.0.0.188"]
pull_policy = "if-not-present"
```

重启：

```bash
docker restart gitlab-runner
```

### 10.3 Runner 宿主机 Docker 信任 Harbor（不带端口）

```bash
sudo mkdir -p /etc/docker/certs.d/harbor.zhst.com
sudo cp /srv/certs/ca/ca.crt /etc/docker/certs.d/harbor.zhst.com/ca.crt
sudo systemctl restart docker
```

### 10.4 注册 Runner

```bash
docker exec -it gitlab-runner gitlab-runner register \
  --url "https://gitlab.zhst.com/" \
  --registration-token "<token>" \
  --executor "docker" \
  --description "runner-10.0.0.187" \
  --docker-image "harbor.zhst.com/mirror/docker:27" \
  --docker-privileged="true" \
  --docker-volumes "/var/run/docker.sock:/var/run/docker.sock"
```

---

## 11. 内网无 DockerHub：Harbor mirror（必须先做）

Harbor UI 创建项目：

- `mirror`：基础镜像（docker-cli/golang/alpine/runner-helper）
- `ci`：业务镜像

离线搬运（外网机 pull → save → 内网 load → push）至少包含：

- `docker:27-cli` → `harbor.zhst.com/mirror/docker:27`
- `golang:1.23-alpine` → `harbor.zhst.com/mirror/golang:1.23-alpine`
- `alpine:3.20` → `harbor.zhst.com/mirror/alpine:3.20`
- `gitlab/gitlab-runner-helper:<tag>` → `harbor.zhst.com/mirror/gitlab-runner-helper:<tag>`

> 细节：`mirror/docker:27` 必须是 **docker-cli** 内容，否则 CI 会出现 `docker: not found`。

---

## 12. CI 示例（业务镜像构建推送）

> 生产建议用 Harbor Robot + GitLab Variables；此处仅给结构示例。

```yaml
stages: [build]

build_push:
  stage: build
  image: harbor.zhst.com/mirror/docker:27
  variables:
    DOCKER_HOST: unix:///var/run/docker.sock
  script:
    - TAG="${CI_COMMIT_SHORT_SHA:-${CI_COMMIT_SHA:-${CI_PIPELINE_IID:-latest}}}"
    - docker login harbor.zhst.com -u "$HARBOR_USER" -p "$HARBOR_PASS"
    - docker build -t harbor.zhst.com/ci/myapp:$TAG -f music_local/Dockerfile music_local
    - docker push harbor.zhst.com/ci/myapp:$TAG
```

---

## 13. 常见问题与解决方案（部署过程已遇到/高概率）

### 13.1 `ssh -p 2222 ... No route to host`

**含义**：网络层不可达或被丢弃（不是密码问题）。

**排查**：

```bash
ping -c 2 10.0.0.186
sudo ss -lntp | egrep '(:22|:2222)\b'
sudo systemctl is-active firewalld || true
```

**处理**：

- 确认 `sshd` 已监听 `2222`
- 若仍不通：检查 **路由/VPN/安全组/交换机 ACL**（关闭本机 firewalld 后，最常见阻塞点在上层网络设备）
- 若跨网段：检查路由/VPN/安全组

### 13.2 Harbor compose 创建网络失败：`iptables ... DOCKER ... No chain/target/match`

**含义**：Docker 写 iptables `nat/DOCKER` 链失败，常见于 iptables 规则异常、Docker iptables 被禁用、firewalld 与 docker 状态不一致（或 firewalld 仍在运行导致规则冲突）。

**处理顺序**：

```bash
sudo cat /etc/docker/daemon.json 2>/dev/null || true
sudo systemctl restart docker
sudo systemctl stop firewalld || true
docker network prune -f
```

重点检查 `daemon.json` 是否包含 `"iptables": false`；如有应改为 `true` 或删除该字段后重启 docker。

### 13.3 Runner 注册 GitLab：`x509: certificate signed by unknown authority`

**原因**：Runner 不信任自建 CA。

**解决**：按本文 10.1，将 `ca.crt` 命名为 `gitlab.zhst.com.crt` 并挂载到 `/etc/gitlab-runner/certs/`。

### 13.4 CI checkout：`Could not resolve host: gitlab.zhst.com`

**原因**：job 容器 DNS 无法解析内网域名。

**解决**：Runner `config.toml` 增加 `extra_hosts`（10.2），或配置内网 DNS 给 Docker。

### 13.5 CI：`docker: not found`

**原因**：CI job 镜像不含 docker-cli，或 `mirror/docker:27` 推错内容。

**解决**：确保 `mirror/docker:27` 来自 `docker:27-cli`。

### 13.6 CI：`invalid tag ...:`（tag 为空）

**原因**：`CI_COMMIT_SHORT_SHA` 为空。

**解决**：使用兜底变量（见 12）。

### 13.7 `docker push`：`unauthorized`

**原因**：Harbor 项目权限不足或项目不存在。

**解决**：创建 `ci`/`mirror` 项目；使用 Robot（push/pull）或给账号项目权限。

### 13.8 构建阶段仍访问 Docker Hub 超时

**原因**：Dockerfile `FROM` 仍指向 `docker.io`。

**解决**：所有 `FROM` 与 CI `image:` 全部改为 `harbor.zhst.com/mirror/...`。

---

## 14. 备份与安全建议（生产必做）

- 备份 GitLab：`/srv/gitlab/config`、`/srv/gitlab/data`
- 备份 Harbor：`/data`、`/srv/harbor/harbor.yml`
- CA：`ca.key` 严禁外发；`ca.crt` 分发到客户端/Runner/服务器信任库
- CI 不要用明文密码；使用 Harbor Robot + GitLab CI Variables（Masked）
