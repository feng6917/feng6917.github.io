---
layout: post
title: "GitLab Docker 部署指南（CentOS 7.6｜自建 CA｜多服务器）"
date:   2026-4-22
tags: 
  - 软件类
comments: true
author: feng6917
---

本文记录一套在 **CentOS 7.6** 上通过 **Docker Compose** 部署 GitLab 的可复用流程，包含 **自建 CA + HTTPS**、**SSH 端口冲突处理**，并给出与 **Harbor / GitLab Runner** 联动时的关键注意点（多服务器场景）。

<!-- more -->

<h2 id="c-1-0" class="mh1">一、部署规划（先把边界想清楚）</h2>

<h2 id="c-1-1" class="mh2">1.1 角色划分（推荐）</h2>

> 纯 GitLab 单机也可用本文流程；如果你后续要接 Harbor/Runner，建议按角色拆分，排障成本低。

| 角色 | 建议机器 | 说明 |
|---|---|---|
| GitLab | 1 台 | 对外提供 Web（80/443）与 SSH（22 或其它端口） |
| Harbor（可选） | 1 台 | 内网镜像仓库/镜像源，避免 DockerHub 不可达 |
| GitLab Runner（可选） | 1 台 | 负责 CI 构建推送镜像 |

<h2 id="c-1-2" class="mh2">1.2 域名与解析（必须）</h2>

> 只要你要上 HTTPS（无论公网/内网），就应该用域名而不是 IP，证书与后续迁移都会更稳。

示例（改成你自己的域名与 IP）：

- `gitlab.myz.com` → GitLab 服务器 IP
- `harbor.myz.com` → Harbor 服务器 IP（可选）

临时 hosts（没有内网 DNS 时使用，**GitLab/Runner/Harbor 三台都建议写**）：

```bash
sudo sh -c "grep -q 'gitlab.myz.com' /etc/hosts || echo '10.0.0.186 gitlab.myz.com' >> /etc/hosts"
sudo sh -c "grep -q 'harbor.myz.com' /etc/hosts || echo '10.0.0.188 harbor.myz.com' >> /etc/hosts"
```

验证：

```bash
ping -c 1 gitlab.myz.com
```

<h2 id="c-2-0" class="mh1">二、系统初始化（GitLab 机）</h2>

> 下述以 CentOS 7.6 为例；如果是全新环境，新手阶段建议先降低变量，减少排障面。

<h2 id="c-2-1" class="mh2">2.1 基础包与时间同步</h2>

```bash
sudo yum -y update
sudo yum -y install vim wget curl git openssl chrony
sudo systemctl enable --now chronyd
timedatectl set-timezone Asia/Shanghai
```

<h2 id="c-2-2" class="mh2">2.2 SELinux（新手建议关闭）</h2>

```bash
sudo setenforce 0
sudo sed -i 's/^SELINUX=.*/SELINUX=disabled/' /etc/selinux/config
```

<h2 id="c-2-3" class="mh2">2.3 Docker 与 Compose</h2>

```bash
sudo yum -y install yum-utils device-mapper-persistent-data lvm2
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum -y install docker-ce docker-ce-cli containerd.io
sudo systemctl enable --now docker
docker version
```

Compose（二选一即可；建议使用 v2）：

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose version
```

<h2 id="c-2-4" class="mh2">2.4 防火墙（新手排障阶段：直接关闭）</h2>

> 生产建议最小端口放行；这里给的是“快速跑通”的新手方案。

```bash
sudo systemctl stop firewalld
sudo systemctl disable firewalld
sudo systemctl mask firewalld
sudo systemctl status firewalld --no-pager || true
```

<h2 id="c-3-0" class="mh1">三、自建 CA + GitLab HTTPS 证书</h2>

> 如果你使用公网 CA（Let’s Encrypt/商业证书）可跳过本章；内网环境通常需要自建 CA。

<h2 id="c-3-1" class="mh2">3.1 生成根 CA（在 GitLab 机）</h2>

```bash
sudo mkdir -p /srv/certs/{ca,gitlab}
sudo chmod 700 /srv/certs/ca

cd /srv/certs/ca
sudo openssl genrsa -out ca.key 4096
sudo openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
  -subj "/C=CN/ST=SH/L=SH/O=INTRA/OU=DevOps/CN=INTRA-ROOT-CA" \
  -out ca.crt
```

<h2 id="c-3-2" class="mh2">3.2 签发 GitLab 证书（包含 SAN：域名 + IP）</h2>

```bash
cd /srv/certs/gitlab
sudo openssl genrsa -out privkey.pem 4096
sudo openssl req -new -key privkey.pem \
  -subj "/C=CN/ST=SH/L=SH/O=INTRA/OU=GitLab/CN=gitlab.myz.com" \
  -out gitlab.csr

sudo tee gitlab.ext >/dev/null <<'EOF'
basicConstraints=CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = gitlab.myz.com
IP.1 = 10.0.0.186
EOF

sudo openssl x509 -req -in gitlab.csr \
  -CA /srv/certs/ca/ca.crt -CAkey /srv/certs/ca/ca.key -CAcreateserial \
  -out fullchain.pem -days 825 -sha256 -extfile gitlab.ext
```

<h2 id="c-3-3" class="mh2">3.3 系统信任 CA（GitLab 机；其它机器也建议做）</h2>

```bash
sudo cp /srv/certs/ca/ca.crt /etc/pki/ca-trust/source/anchors/intra-ca.crt
sudo update-ca-trust
```

Windows 开发机：把 `ca.crt` 导入到“受信任的根证书颁发机构”，否则浏览器会提示证书不受信任。

<h2 id="c-4-0" class="mh1">四、部署 GitLab（Docker Compose）</h2>

<h2 id="c-4-1" class="mh2">4.1 目录准备</h2>

```bash
sudo mkdir -p /srv/gitlab/{config,logs,data}
```

<h2 id="c-4-2" class="mh2">4.2 处理 SSH 端口冲突（重点）</h2>

**事实**：宿主机 `sshd` 默认监听 `22`；GitLab 容器如果也要映射 `22:22`，两者会冲突。

推荐做法：把宿主机 sshd 改到 `2222`，让 GitLab 使用 `22`。

1）修改 `/etc/ssh/sshd_config`：

```text
Port 2222
```

2）重启并验证（务必另开终端验证成功后再继续）：

```bash
sudo systemctl restart sshd
ssh -p 2222 root@10.0.0.186
```

<h2 id="c-4-3" class="mh2">4.3 编写 docker-compose.yml</h2>

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
        external_url 'https://gitlab.myz.com'
        nginx['ssl_certificate'] = "/etc/gitlab/ssl/fullchain.pem"
        nginx['ssl_certificate_key'] = "/etc/gitlab/ssl/privkey.pem"
        gitlab_rails['gitlab_ssh_host'] = 'gitlab.myz.com'
        gitlab_rails['gitlab_shell_ssh_port'] = 22
```

<h2 id="c-4-4" class="mh2">4.4 启动与验证</h2>

```bash
cd /srv/gitlab
docker-compose up -d
docker logs -f gitlab
```

等待初始化完成后验证：

```bash
curl -vk https://gitlab.myz.com/ | head
```

<h2 id="c-5-0" class="mh1">五、部署 Harbor（Registry / 镜像源）</h2>

> Harbor 建议独立一台服务器。本文以 **offline installer** 为例（内网场景更常用）。

<h2 id="c-5-1" class="mh2">5.1 签发 Harbor 证书（SAN：域名 + IP）</h2>

> 在 GitLab 机生成证书也可以；关键是：证书要包含域名（必要时也包含 Harbor IP），并把根证书 `ca.crt` 分发到所有需要访问 Harbor 的机器（Runner/开发机）。

```bash
sudo mkdir -p /srv/certs/harbor

cd /srv/certs/harbor
sudo openssl genrsa -out privkey.pem 4096
sudo openssl req -new -key privkey.pem \
  -subj "/C=CN/ST=SH/L=SH/O=INTRA/OU=Harbor/CN=harbor.myz.com" \
  -out harbor.csr

sudo tee harbor.ext >/dev/null <<'EOF'
basicConstraints=CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = harbor.myz.com
IP.1 = 10.0.0.188
EOF

sudo openssl x509 -req -in harbor.csr \
  -CA /srv/certs/ca/ca.crt -CAkey /srv/certs/ca/ca.key -CAcreateserial \
  -out fullchain.pem -days 825 -sha256 -extfile harbor.ext
```

把以下文件拷贝到 Harbor 机（路径保持一致）：

- Harbor：`/srv/certs/harbor/fullchain.pem`、`/srv/certs/harbor/privkey.pem`
- 所有机器（GitLab/Harbor/Runner/客户端）：`/srv/certs/ca/ca.crt`

<h2 id="c-5-2" class="mh2">5.2 Harbor 机安装 Docker / Compose（同 2.3）</h2>

> Harbor 机也需要 Docker/Compose。若你已经按“二、系统初始化”做过，可跳过。

<h2 id="c-5-3" class="mh2">5.3 Harbor 安装与配置</h2>

1）准备目录（示例）：

```bash
sudo mkdir -p /srv/harbor
```

2）将 Harbor offline installer 解压到 `/srv/harbor`，编辑 `/srv/harbor/harbor.yml`：

```yaml
hostname: harbor.myz.com

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

3）安装启动：

```bash
cd /srv/harbor
sudo ./prepare
sudo ./install.sh
```

4）验证：

```bash
curl -vk https://harbor.myz.com/ | head
```

<h2 id="c-6-0" class="mh1">六、部署 GitLab Runner（Docker executor）</h2>

> Runner 建议独立一台服务器，并使用 Docker executor；内网环境强烈建议把 CI 基础镜像放到 Harbor（见第七章）。

<h2 id="c-6-1" class="mh2">6.1 Runner 机前置：Docker / Compose / 信任 CA</h2>

Runner 机同样要安装 Docker/Compose（同 2.3），并信任根证书：

```bash
sudo cp /srv/certs/ca/ca.crt /etc/pki/ca-trust/source/anchors/intra-ca.crt
sudo update-ca-trust
```

<h2 id="c-6-2" class="mh2">6.2 Runner 容器信任 GitLab（解决 x509）</h2>

现象：Runner 注册/拉取时出现 `x509: certificate signed by unknown authority`  
原因：Runner 容器不信任自建 CA  
解决：将根证书按域名命名，挂载到 `/etc/gitlab-runner/certs/`

```bash
sudo mkdir -p /srv/runner/{config,certs}
sudo cp /srv/certs/ca/ca.crt /srv/runner/certs/gitlab.myz.com.crt
```

<h2 id="c-6-3" class="mh2">6.3 启动 Runner（docker-compose）</h2>

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

<h2 id="c-6-4" class="mh2">6.4 让 CI job 容器能解析内网域名（无内网 DNS 时必做）</h2>

现象：CI checkout 报 `Could not resolve host: gitlab.myz.com`
原因：job 容器 DNS 无法解析内网域名  
解决：编辑 `/srv/runner/config/config.toml`，在 `[runners.docker]` 增加：

```toml
extra_hosts = ["gitlab.myz.com:10.0.0.186", "harbor.myz.com:10.0.0.188"]
pull_policy = "if-not-present"
```

重启 Runner：

```bash
docker restart gitlab-runner
```

<h2 id="c-6-5" class="mh2">6.5 Runner 宿主机 Docker 信任 Harbor</h2>

> 这里是“Docker 客户端信任 Registry”。目录名必须是 **域名（不带端口）**，否则 docker login/pull/push 仍可能报证书不受信任。

```bash
sudo mkdir -p /etc/docker/certs.d/harbor.myz.com
sudo cp /srv/certs/ca/ca.crt /etc/docker/certs.d/harbor.myz.com/ca.crt
sudo systemctl restart docker
```

<h2 id="c-6-6" class="mh2">6.6 注册 Runner</h2>

在 GitLab UI 获取 Runner token 后，在 Runner 机执行：

```bash
docker exec -it gitlab-runner gitlab-runner register \
  --url "https://gitlab.myz.com/" \
  --registration-token "<token>" \
  --executor "docker" \
  --description "runner-10.0.0.187" \
  --docker-image "harbor.myz.com/mirror/docker:27" \
  --docker-privileged="true" \
  --docker-volumes "/var/run/docker.sock:/var/run/docker.sock"
```

<h2 id="c-7-0" class="mh1">七、内网无 DockerHub：Harbor mirror（强烈建议提前做）</h2>

> 内网经常无法访问 DockerHub；如果不提前准备镜像源，你会在 Runner 拉取 `image:` 或 Dockerfile `FROM` 阶段持续超时。

<h2 id="c-7-1" class="mh2">7.1 Harbor 项目规划</h2>

建议建两个项目：

- `mirror`：基础镜像（docker-cli/golang/alpine/runner-helper）
- `ci`：业务镜像

<h2 id="c-7-2" class="mh2">7.2 离线搬运基础镜像（外网 pull → save → 内网 load → push）</h2>

至少准备以下镜像（示例 tag 可按你实际环境调整）：

- `docker:27-cli` → `harbor.myz.com/mirror/docker:27`
- `golang:1.23-alpine` → `harbor.myz.com/mirror/golang:1.23-alpine`
- `alpine:3.20` → `harbor.myz.com/mirror/alpine:3.20`
- `gitlab/gitlab-runner-helper:<tag>` → `harbor.myz.com/mirror/gitlab-runner-helper:<tag>`

> 细节：`mirror/docker:27` 必须是 **docker-cli** 内容，否则 CI 会出现 `docker: not found`。

<h2 id="c-8-0" class="mh1">八、CI 示例：构建并推送镜像到 Harbor</h2>

> 生产建议使用 Harbor Robot + GitLab CI Variables（Masked/Protected），避免明文密码。

```yaml
stages: [build]

build_push:
  stage: build
  image: harbor.myz.com/mirror/docker:27
  variables:
    DOCKER_HOST: unix:///var/run/docker.sock
  script:
    - TAG="${CI_COMMIT_SHORT_SHA:-${CI_COMMIT_SHA:-${CI_PIPELINE_IID:-latest}}}"
    - docker login harbor.myz.com -u "$HARBOR_USER" -p "$HARBOR_PASS"
    - docker build -t harbor.myz.com/ci/myapp:$TAG -f music_local/Dockerfile music_local
    - docker push harbor.myz.com/ci/myapp:$TAG
```

对应 `Dockerfile` 示例（静态站点：Nginx 托管）：

```dockerfile
FROM harbor.myz.com:18443/mirror/nginx:1.27-alpine
COPY . /usr/share/nginx/html
EXPOSE 80
```

<h2 id="c-9-0" class="mh1">九、常见问题与排查</h2>

<h2 id="c-9-1" class="mh2">9.1 SSH 提示 No route to host</h2>

含义：网络层不可达/被丢弃（不是密码问题）

```bash
ping -c 2 10.0.0.186
sudo ss -lntp | egrep '(:22|:2222)\\b'
sudo systemctl is-active firewalld || true
```

优先检查：端口是否监听、上层网络 ACL/安全组/路由/VPN。

<h2 id="c-9-2" class="mh2">9.2 访问 https 页面证书不受信任</h2>

原因：浏览器/系统未信任自建 CA  
解决：在客户端导入根证书 `ca.crt`，并确保 GitLab 证书 SAN 包含域名（必要时也包含 IP）。

<h2 id="c-9-3" class="mh2">9.3 Runner 注册 GitLab：x509 unknown authority</h2>

原因：Runner 容器不信任自建 CA。  
解决：按 6.2，将 `ca.crt` 命名为 `gitlab.myz.com.crt` 并挂载到 `/etc/gitlab-runner/certs/`。

<h2 id="c-9-4" class="mh2">9.4 CI checkout：Could not resolve host</h2>

原因：job 容器 DNS 无法解析内网域名。  
解决：按 6.4 配置 `extra_hosts`，或配置内网 DNS 给 Docker。

<h2 id="c-9-5" class="mh2">9.5 CI：docker not found</h2>

原因：CI job 镜像不含 docker-cli，或 `mirror/docker:27` 推错内容。  
解决：确保 `mirror/docker:27` 来自 `docker:27-cli`。

<h2 id="c-9-6" class="mh2">9.6 docker push：unauthorized</h2>

原因：Harbor 项目权限不足或项目不存在。  
解决：创建 `ci`/`mirror` 项目；使用 Robot（push/pull）或给账号项目权限。

<h2 id="c-9-7" class="mh2">9.7 构建阶段仍访问 DockerHub 超时</h2>

原因：Dockerfile `FROM` 仍指向 `docker.io`，或 `.gitlab-ci.yml` `image:` 仍是公网镜像。  
解决：所有 `FROM` 与 CI `image:` 全部改为 `harbor.myz.com/mirror/...`。

<h2 id="c-10-0" class="mh1">十、备份与安全建议（生产必做）</h2>

- GitLab：至少备份 `/srv/gitlab/config`、`/srv/gitlab/data`
- 自建 CA：`ca.key` **严禁外发**；`ca.crt` 可以分发给客户端/Runner/服务器信任库

同时建议补充：

- Harbor：备份 `/data`、`/srv/harbor/harbor.yml`
- 凭据：CI 不要用明文密码，使用 Harbor Robot + GitLab CI Variables（Masked）

<h2 id="c-11-0" class="mh1">十一、参考资源</h2>

- [GitLab Docker 安装官方文档](https://docs.gitlab.com/install/docker/)
- [Docker Compose Release](https://github.com/docker/compose/releases)
- [Harbor 官方文档](https://goharbor.io/docs/)

<hr aria-hidden="true" style=" border: 0; height: 2px; background: linear-gradient(90deg, transparent, #1bb75c, transparent); margin: 2rem 0; " />

<!-- 目录容器 -->
<div class="mi1">
    <strong>目录</strong>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
            <li style="list-style-type: none;"><a href="#c-1-0">一、部署规划（先把边界想清楚）</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-1-1">1.1 角色划分（推荐）</a></li>
                    <li style="list-style-type: none;"><a href="#c-1-2">1.2 域名与解析（必须）</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-2-0">二、系统初始化（GitLab 机）</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-2-1">2.1 基础包与时间同步</a></li>
                    <li style="list-style-type: none;"><a href="#c-2-2">2.2 SELinux（新手建议关闭）</a></li>
                    <li style="list-style-type: none;"><a href="#c-2-3">2.3 Docker 与 Compose</a></li>
                    <li style="list-style-type: none;"><a href="#c-2-4">2.4 防火墙（新手排障阶段：直接关闭）</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-3-0">三、自建 CA + GitLab HTTPS 证书</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-3-1">3.1 生成根 CA（在 GitLab 机）</a></li>
                    <li style="list-style-type: none;"><a href="#c-3-2">3.2 签发 GitLab 证书（包含 SAN：域名 + IP）</a></li>
                    <li style="list-style-type: none;"><a href="#c-3-3">3.3 系统信任 CA（GitLab 机；其它机器也建议做）</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-4-0">四、部署 GitLab（Docker Compose）</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-4-1">4.1 目录准备</a></li>
                    <li style="list-style-type: none;"><a href="#c-4-2">4.2 处理 SSH 端口冲突（重点）</a></li>
                    <li style="list-style-type: none;"><a href="#c-4-3">4.3 编写 docker-compose.yml</a></li>
                    <li style="list-style-type: none;"><a href="#c-4-4">4.4 启动与验证</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-5-0">五、部署 Harbor（Registry / 镜像源）</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-5-1">5.1 签发 Harbor 证书（SAN：域名 + IP）</a></li>
                    <li style="list-style-type: none;"><a href="#c-5-2">5.2 Harbor 机安装 Docker / Compose（同 2.3）</a></li>
                    <li style="list-style-type: none;"><a href="#c-5-3">5.3 Harbor 安装与配置</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-6-0">六、部署 GitLab Runner（Docker executor）</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-6-1">6.1 Runner 机前置：Docker / Compose / 信任 CA</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-2">6.2 Runner 容器信任 GitLab（解决 x509）</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-3">6.3 启动 Runner（docker-compose）</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-4">6.4 让 CI job 容器能解析内网域名（无内网 DNS 时必做）</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-5">6.5 Runner 宿主机 Docker 信任 Harbor</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-6">6.6 注册 Runner</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-7-0">七、内网无 DockerHub：Harbor mirror（强烈建议提前做）</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-7-1">7.1 Harbor 项目规划</a></li>
                    <li style="list-style-type: none;"><a href="#c-7-2">7.2 离线搬运基础镜像（外网 pull → save → 内网 load → push）</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-8-0">八、CI 示例：构建并推送镜像到 Harbor</a></li>
                <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-9-0">九、常见问题与排查</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-9-1">9.1 SSH 提示 No route to host</a></li>
                    <li style="list-style-type: none;"><a href="#c-9-2">9.2 访问 https 页面证书不受信任</a></li>
                    <li style="list-style-type: none;"><a href="#c-9-3">9.3 Runner 注册 GitLab：x509 unknown authority</a></li>
                    <li style="list-style-type: none;"><a href="#c-9-4">9.4 CI checkout：Could not resolve host</a></li>
                    <li style="list-style-type: none;"><a href="#c-9-5">9.5 CI：docker not found</a></li>
                    <li style="list-style-type: none;"><a href="#c-9-6">9.6 docker push：unauthorized</a></li>
                    <li style="list-style-type: none;"><a href="#c-9-7">9.7 构建阶段仍访问 DockerHub 超时</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-10-0">十、备份与安全建议（生产必做）</a></li>
                <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-11-0">十一、参考资源</a></li>
                <ul style="padding-left: 15px; list-style-type: none;"></ul>
        </ul>
</div>

<style>
    /* 一级段落 */
    .mh1 {
      text-align: center;
      color: black;
      background: linear-gradient(#fff 60%, #b2e311ff 40%);
      margin: 1.4em 0 1.1em;
      font-size: 1.4em;
      font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif;
      line-height: 1.7;
      letter-spacing: .33px;
    }
    /* 二级段落 */

    .mh2 {
      -webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;
    }

    /* 目录 高度、宽度 可自行调整*/
    .mi1 {
      position: fixed; bottom: 240px; right: 10px; width: 240px; height: 240px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; overflow-y: auto; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; font-size: 14px; line-height: 1.15; color: #444; letter-spacing: 0.33px; transition: all 0.3s ease;
    }

</style>

本技术手册将持续更新，欢迎提交Issue和Pull Request
