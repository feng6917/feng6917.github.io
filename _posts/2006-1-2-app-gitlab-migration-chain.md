---
layout: post
title: "GitLab 部署后全链路迁移：代码仓库、Docker 镜像与 Harbor 打通"
date:   2026-4-24
tags: 
  - 软件类
comments: true
author: feng6917
---

本文将 **GitLab 部署完成之后** 的常见工作串成一条可执行链路：**自建根 CA 与站点证书（OpenSSL）**、**域名与信任分发**、**Harbor 统一 Registry 域名**、**Runner 与 CI 解析**、**GitLab 数据在旧机备份导出、新机导入恢复**，以及 **Docker 镜像离线双机脚本（旧机 `docker-migrate-01-*`：save/scp；新机 `docker-migrate-02-*`：load/push）**。内容综合整理自内网运维脚本与说明文档，并统一为「新手按章节操作、老手当检查表」的写法；文中 IP、路径、域名均为**示例拓扑**，实施时请替换为你们环境的真实值。

<!-- more -->

<h2 id="c-0-0" class="mh1">〇、先建立心智模型：三件事、三台机</h2>

| 维度 | 你要打通的是什么 |
|---|---|
| **代码 / GitLab 数据** | 研发通过 `git clone` / `git push` 访问的 **GitLab SSH/HTTPS**；整机搬迁时以 **备份导出 → 新机恢复导入** 为主，单库可辅以 `git push --mirror`。 |
| **镜像** | CI 或运维侧构建的 **容器镜像**，能 **pull/push** 到 **Harbor（Registry）**；内网若不能直连公网，往往还要 **离线 tar 迁移**。 |
| **信任与解析** | 自建 CA 时，宿主机与 Job 容器内的 **TLS 信任**、**hosts / DNS**、Runner 的 **`extra_hosts`** 必须一致，否则会在「证书不受信」「Could not resolve host」处卡住。 |

下文采用与多篇 ZHST 内网文档一致的**角色划分示例**（请按需改名改 IP）：

| 角色 | 示例 IP | 说明 |
|---|---:|---|
| GitLab | `10.0.0.186` | Web、SSH、仓库数据；建议在证书机维护 `/srv/certs/ca`。 |
| GitLab Runner | `10.0.0.187` | 执行 CI；默认脚本里镜像 tar 落地目录常为 `/data1/77_tar`。 |
| Harbor | `10.0.0.188` | 私库；推荐对外统一为 `registry.zhst.com`（HTTPS）。 |

**推荐域名（与脚本默认值一致时最省事）：**

- GitLab：`https://gitlab.zhst.com`
- Harbor / Registry：`https://registry.zhst.com`，镜像引用形如 `registry.zhst.com/<项目>/<仓库>:<标签>`

> **安全说明**：Runner 注册令牌、Harbor 密码等敏感信息请使用 **GitLab / Harbor 界面或变量** 管理；下文命令中的令牌、密码一律用占位符表示，勿直接粘贴到公开仓库。`ca.key` 为根私钥，**严禁外发**，权限建议 `chmod 700 /srv/certs/ca`。


<h2 id="c-0-5" class="mh1">根 CA 与站点证书（OpenSSL 生成与分发）</h2>

内网若无商业 CA，一般在 **GitLab 同机或独立证书机** 维护 `/srv/certs/ca`，再用该根为 **GitLab**、**Harbor** 签发服务端证书。以下命令与本文拓扑一致：`gitlab.zhst.com` / `10.0.0.186`，`registry.zhst.com` / `10.0.0.188`；请按实际修改 `subj`、SAN 与 IP。

<h2 id="c-0-5-1" class="mh2">生成根 CA（10 年示例）</h2>

```bash
sudo mkdir -p /srv/certs/{ca,gitlab,harbor}
sudo chmod 700 /srv/certs/ca

cd /srv/certs/ca
sudo openssl genrsa -out ca.key 4096
sudo openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
  -subj "/C=CN/ST=SH/L=SH/O=ZHST-INTRA/OU=DevOps/CN=ZHST-INTRA-ROOT-CA" \
  -out ca.crt
```

<h2 id="c-0-5-2" class="mh2">签发 GitLab 站点证书（SAN：域名 + GitLab 机 IP）</h2>

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

Compose 中把 `fullchain.pem`、`privkey.pem` 挂入容器（如 `/etc/gitlab/ssl`），并在 `GITLAB_OMNIBUS_CONFIG` 里配置 `nginx['ssl_certificate']` 等，与现有部署文档一致即可。

<h2 id="c-0-5-3" class="mh2">签发 Harbor / Registry 站点证书（SAN：域名 + Harbor 机 IP）</h2>

```bash
cd /srv/certs/harbor
sudo openssl genrsa -out privkey.pem 4096
sudo openssl req -new -key privkey.pem \
  -subj "/C=CN/ST=SH/L=SH/O=ZHST/OU=Harbor/CN=registry.zhst.com" \
  -out registry.csr

sudo tee registry.ext >/dev/null <<'EOF'
basicConstraints=CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = registry.zhst.com
IP.1 = 10.0.0.188
EOF

sudo openssl x509 -req -in registry.csr \
  -CA /srv/certs/ca/ca.crt -CAkey /srv/certs/ca/ca.key -CAcreateserial \
  -out fullchain.pem -days 825 -sha256 -extfile registry.ext

sudo chmod 600 /srv/certs/harbor/privkey.pem
sudo chmod 644 /srv/certs/harbor/fullchain.pem
```

将 `fullchain.pem`、`privkey.pem` 同步到 Harbor 机 `/srv/certs/harbor/`，并在 `harbor.yml` 中指向该路径；`hostname` 与 SAN 中的 DNS 保持一致。

<h2 id="c-0-5-4" class="mh2">分发 `ca.crt`：系统信任与 Docker</h2>

**Linux（每台 GitLab / Runner / Harbor 及需 pull 的服务器）**：

```bash
sudo cp /srv/certs/ca/ca.crt /etc/pki/ca-trust/source/anchors/zhst-intra-ca.crt
sudo update-ca-trust
```

**Docker 访问私库 / GitLab Registry 时**（目录名必须与浏览器 / `docker login` 使用的**主机名**一致）：

```bash
sudo mkdir -p /etc/docker/certs.d/registry.zhst.com
sudo mkdir -p /etc/docker/certs.d/gitlab.zhst.com
sudo cp /srv/certs/ca/ca.crt /etc/docker/certs.d/registry.zhst.com/ca.crt
sudo cp /srv/certs/ca/ca.crt /etc/docker/certs.d/gitlab.zhst.com/ca.crt
sudo systemctl restart docker
```

**GitLab Runner 校验 GitLab HTTPS** 时，常将同一 `ca.crt` 复制为挂载用的文件名，例如 `/srv/runner/certs/gitlab.zhst.com.crt`（与 Runner 文档一致），然后 `docker restart gitlab-runner`。

**Windows 开发机**：将 `ca.crt` 导入「受信任的根证书颁发机构」，否则浏览器会提示证书不受信任。


<h2 id="c-1-0" class="mh1">一、端到端链路总览（从部署完成到业务可跑）</h2>

建议按顺序推进；若某一步已验证通过，可跳到对应章节做增量变更。

1. **DNS / hosts**：`gitlab.zhst.com` → GitLab 机，`registry.zhst.com` → Harbor 机；**删除或废弃**已不使用的旧 Harbor 主机名（如历史中的 `harbor.zhst.com`），避免 CI 与脚本混用两套名。  
2. **系统与 Docker 信任**：各机安装根 CA，`/etc/docker/certs.d/<域名>/ca.crt` 与访问域名一致；改证书后 **`systemctl restart docker`**。  
3. **Harbor**：`harbor.yml` 中 `hostname`、证书 SAN、浏览器访问 URL **三者一致**；执行 `prepare` / `install` 或 `docker compose` 流程使配置生效。  
4. **GitLab**：`docker-compose.yml` 中 `GITLAB_OMNIBUS_CONFIG` 多行块 **缩进一致**；改完后先 `docker compose config` 再启动。  
5. **Runner**：`config.toml` 中 `[runners.docker]` 配置 **`extra_hosts`**，使 Job 容器能解析 GitLab 与 Registry；**`docker restart gitlab-runner`**。  
6. **GitLab 数据迁移**：**先核对源/目标 GitLab 版本**，再在旧机 **手工**执行 `gitlab-rake gitlab:backup:create`（可用 `SKIP=registry,artifacts,lfs` 缩小包体），新机停 `puma`/`sidekiq` 后 `gitlab:backup:restore`（见第六章）；单项目可用界面「导出 / 导入项目」。  
7. **镜像迁移（可选）**：旧机 `docker-migrate-01-export-old-host.sh`、新机 `docker-migrate-02-import-new-host.sh` 完成 **统计 → save → scp → load → push**（见第七章；`docker tag` 仍可能需手工）。


<h2 id="c-2-0" class="mh1">二、Harbor 域名统一到 `registry.zhst.com`</h2>

若历史环境使用 `harbor.zhst.com`，迁移的核心原则是：**客户端看到的 Registry 主机名**、**Harbor 服务端 `hostname`**、**TLS 证书 SAN**、**Docker `certs.d` 目录名** 四者对齐；Harbor **磁盘上的镜像数据**通常仍在 `data_volume`（如 `/data`），**不必因改名而重做数据**，但要全局替换 CI、Kubernetes `image:`、本地脚本中的旧域名。

<h2 id="c-2-1" class="mh2">2.1 三台机 hosts 与 Docker 旧目录清理（示例）</h2>

在 GitLab、Runner、Harbor **每台**执行（路径与 IP 按实际修改）：

```bash
sudo sed -i '/harbor\.zhst\.com/d' /etc/hosts 2>/dev/null || true
sudo sh -c "grep -q 'registry.zhst.com' /etc/hosts || echo '10.0.0.188 registry.zhst.com' >> /etc/hosts"
sudo rm -rf /etc/docker/certs.d/harbor.zhst.com
```

<h2 id="c-2-2" class="mh2">2.2 在证书机用原 CA 重签 Harbor 站点证书（概要）</h2>

1. 备份 `/srv/certs/harbor/` 下现有 `privkey.pem`、`fullchain.pem`。  
2. 生成新私钥与 CSR，**CN 与 SAN** 使用 `registry.zhst.com`，并包含 Harbor 机 IP（如 `10.0.0.188`）。  
3. 用 `/srv/certs/ca/ca.crt` / `ca.key` 签发新的 `fullchain.pem`，拷贝到 Harbor 机 `/srv/certs/harbor/`。  
4. 编辑 Harbor 机 `/srv/harbor/harbor.yml`：`hostname: registry.zhst.com`，`https.certificate` / `https.private_key` 指向上述文件。  
5. 在 Harbor 安装目录执行：`docker compose down`（或 `docker-compose down`）→ `./prepare` → `./install.sh`。  

**验证**：`openssl s_client -connect registry.zhst.com:443 -servername registry.zhst.com` 查看证书 SAN；浏览器与 `docker login registry.zhst.com` 均应成功。

> **过渡期**：若短期必须双域名访问，可在证书 SAN 中同时写两个 DNS；长期仍建议只保留 `registry.zhst.com`，减少配置分叉。


<h2 id="c-3-0" class="mh1">三、根 CA 轮换（可选，与镜像链路无关但常一起做）</h2>

首次建站请直接按上文 **「根 CA 与站点证书」** 生成；本节仅在**需要吊销旧根、统一换根**时执行。在**已全量备份** `/srv/certs` 的前提下，于证书机重新生成根 `ca.key` / `ca.crt`，再用新根为 **GitLab**、**Harbor** 重签站点证书。随后在 **186 / 187 / 188** 及开发机：

- 系统信任：`/etc/pki/ca-trust/source/anchors/` 下更新 `ca.crt` 后执行 `update-ca-trust`；  
- Docker：`/etc/docker/certs.d/registry.zhst.com/ca.crt`（及若使用的 `gitlab.zhst.com` 目录）替换为新根；  
- Runner：`/srv/runner/certs/gitlab.zhst.com.crt` 等与校验相关的 CA 文件同步更新；  
- 依次重启 GitLab 容器、Harbor、`gitlab-runner`。

Windows 开发机需在「受信任的根证书颁发机构」中**删除旧根**再导入新根。


<h2 id="c-4-0" class="mh1">四、GitLab Compose 与 Omnibus 配置常见坑</h2>

<h2 id="c-4-1" class="mh2">4.1 `yaml: line N: did not find expected key`</h2>

`environment.GITLAB_OMNIBUS_CONFIG` 使用 `|` 多行块时，**块内每一行缩进必须一致**，且比 `GITLAB_OMNIBUS_CONFIG:` 多一级。某行少一个空格会导致后续行被解析到错误层级。修改后务必：

```bash
docker compose config
```

无报错再 `docker compose up -d`。

<h2 id="c-4-2" class="mh2">4.2 SSH 对外端口与 `gitlab_shell_ssh_port` 不一致</h2>

现象：`docker-compose.yml` 写的是 `22`，但 `gitlab-rails runner 'puts Gitlab.config.gitlab_shell.ssh_port'` 仍输出 **2022** 等旧值。常见原因是 **已存在的数据卷** 里 `/srv/gitlab/config/gitlab.rb`（或容器内 `/etc/gitlab/gitlab.rb`）仍为历史配置，`GITLAB_OMNIBUS_CONFIG` 未覆盖旧值。

处理思路：

1. 在宿主机搜索：`grep -n "gitlab_shell_ssh_port" /srv/gitlab/config/gitlab.rb`。  
2. 将端口改为与对外映射一致（例如 `22`），或追加正确的一行配置。  
3. 执行 `docker exec -it <gitlab容器名> gitlab-ctl reconfigure` 并重启 GitLab 容器。  
4. 再次用 `gitlab-rails runner` 验证。


<h2 id="c-5-0" class="mh1">五、GitLab Runner：解析、证书与注册</h2>

<h2 id="c-5-1" class="mh2">5.1 `extra_hosts`（Job 容器内解析）</h2>

Docker Executor 的 Job 容器默认未必继承宿主机的内网 DNS。Runner `config.toml` 示例：

```toml
[runners.docker]
  extra_hosts = ["gitlab.zhst.com:10.0.0.186", "registry.zhst.com:10.0.0.188"]
  pull_policy = "if-not-present"
```

修改后：`docker restart gitlab-runner`。

<h2 id="c-5-2" class="mh2">5.2 注册 `linux`（Docker Executor）</h2>

适用于 **在容器里跑 CI**（`script` 里可再调 `docker build` / `docker push` 等）。在 GitLab 获取 **Registration token**（项目/群组/实例级，权限范围与 token 类型一致）后执行；**勿将真实 token 写入仓库**。

```bash
docker exec -it gitlab-runner gitlab-runner register \
  --non-interactive \
  --url "https://gitlab.zhst.com/" \
  --registration-token "<YOUR_REGISTRATION_TOKEN>" \
  --name "linux" \
  --executor "docker" \
  --docker-image "registry.zhst.com/<项目>/piggy:latest" \
  --tag-list "linux" \
  --run-untagged="false" \
  --locked="false" \
  --docker-volumes "/var/run/docker.sock:/var/run/docker.sock" \
  --docker-network-mode "host"
```

- **`--name "linux"`**：在 GitLab **Admin → Runners** 或项目 **Settings → CI/CD → Runners** 中显示的名称，仅便于识别，可与 `tag` 同名也可不同。  
- **`--executor "docker"`**：每个 Job 在**独立容器**中执行；默认镜像见 `--docker-image`。  
- **`--docker-image`**：无 `image:` 的 Job 使用的**默认镜像**；须含 Runner 能解析的 Registry 前缀（如 `registry.zhst.com/...`），且 Runner 宿主机已 `docker login`。  
- **`--tag-list "linux"`**：该 Runner **只承接**在 `.gitlab-ci.yml` 里声明了 `tags: [linux]`（或等价）的 Job。  
- **`--run-untagged="false"`**：**不**运行未打 tag 的 Job，避免与 Shell Runner 抢队列。若希望同一 Runner 兼跑无 tag 任务，改为 `true`（需评估隔离与安全）。  
- **`--locked="false"`**：Runner **不**锁定在单一项目（是否可选取决于 GitLab 版本与 token；锁定后仅对注册时所在项目可见）。  
- **`--docker-volumes "/var/run/docker.sock:..."`**：把宿主机 Docker socket 挂进 Job 容器，脚本内才能使用 **`docker`** 命令（等同 Docker-outside-of-Docker）。有安全风险：Job 理论上可操控宿主机 Docker，请配合受控镜像、最小权限与受信流水线。  
- **`--docker-network-mode "host"`**：Job 容器使用 **host 网络**，便于访问仅写在宿主机 `hosts` 或内网段上的服务；副作用是与宿主机端口共用命名空间，注意端口冲突。若 Job 仅需 `extra_hosts` 即可访问 GitLab/Registry，可改为 `bridge` 并依赖 **5.1** 的 `extra_hosts`。

注册成功后建议：`docker restart gitlab-runner`，并在 GitLab UI 确认 Runner 为 **online**。

<h2 id="c-5-3" class="mh2">5.3 注册 `linux-shell`（Shell Executor）</h2>

适用于 **直接在 Runner 宿主机 shell 里执行** `script`（无隔离容器、启动快；适合简单编译、调用本机已装工具，**不适合**与 Docker 构建混用除非自行管理环境）。

```bash
docker exec -it gitlab-runner gitlab-runner register \
  --non-interactive \
  --url "https://gitlab.zhst.com/" \
  --registration-token "<YOUR_REGISTRATION_TOKEN>" \
  --name "linux-shell" \
  --executor "shell" \
  --tag-list "linux-shell" \
  --run-untagged="false" \
  --locked="false"
```

- **`--name "linux-shell"`**：与 Docker 那条区分显示；可按组织规范改名。  
- **`--executor "shell"`**：Job 进程以 **`gitlab-runner` 所运行用户**（常见为 `root` 或专用 `gitlab-runner` 用户）在**宿主机**上执行；**无** `--docker-image`、`--docker-volumes` 等 Docker 专用参数。  
- **`--tag-list "linux-shell"`**：流水线中需写 `tags: [linux-shell]` 才会派发到本 Runner；与 `linux` 标签**分离**，避免 Docker Job 落到 Shell 上。  
- **`--run-untagged` / `--locked`**：含义同 **5.2**；若希望 Shell Runner 专门处理「仅脚本、无容器」类任务，保持 `run-untagged=false` 并用标签精确分流即可。

**注意**：若 `gitlab-runner` 本身跑在容器里、却注册为 `shell` executor，实际执行环境是该**容器内**的 shell，而不是宿主机；需与运维约定一致（常见做法是 Runner 用 **shell 安装包**跑在宿主机，或仍用 Docker executor）。本文命令以 **`docker exec` 进入 `gitlab-runner` 容器** 注册为例，与内网文档一致；若你改为宿主机直接 `gitlab-runner register`，参数相同。

<h2 id="c-5-4" class="mh2">5.4 `gitlab-runner register` 参数对照（两路共用）</h2>

| 参数 | 是否两路共用 | 说明 |
|---|---|---|
| `--non-interactive` | 是 | 非交互注册，所有必填项由命令行提供；适合脚本化与文档复现。 |
| `--url` | 是 | GitLab 实例根地址，须带协议，**与浏览器访问一致**（如 `https://gitlab.zhst.com/`）。末尾是否带 `/` 建议与官方示例一致。 |
| `--registration-token` | 是 | 在 GitLab **项目 / 群组 / 管理区** 生成的注册令牌；**泄露等同凭据泄露**，应定期轮换。 |
| `--name` | 是 | Runner 展示名称；建议 `linux` 与 `linux-shell` 语义区分。 |
| `--executor` | 否 | `docker`：隔离容器；`shell`：宿主机（或 Runner 容器内）shell。 |
| `--docker-image` | 仅 Docker | Shell 注册**不要**带此参数。值为默认 CI 镜像，须能 pull。 |
| `--tag-list` | 是 | 逗号分隔多个标签，如 `linux,docker`。两路使用**不同 tag** 以便 `.gitlab-ci.yml` 分流。 |
| `--run-untagged` | 是 | `true`：可跑未指定 `tags` 的 Job；`false`：仅跑匹配 tag 的 Job。 |
| `--locked` | 是 | `true`：Runner 仅绑定注册时所选项目（行为随 GitLab 版本略有差异）；`false`：可被多个有权限的项目使用（视 token 范围）。 |
| `--docker-volumes` | 仅 Docker | 挂载卷到 Job 容器；挂 `docker.sock` 即允许 Job 内使用宿主 Docker。 |
| `--docker-network-mode` | 仅 Docker | `host` / `bridge` 等；影响 Job 网络命名空间与 DNS/hosts 行为。 |

`.gitlab-ci.yml` 中按需选择 Runner 示例：

```yaml
# 使用 Docker Runner（linux）
docker-job:
  tags: [linux]
  image: registry.zhst.com/mirror/docker:24
  script:
    - docker info

# 使用 Shell Runner（linux-shell）
shell-job:
  tags: [linux-shell]
  script:
    - hostname
    - whoami
```

注册多条 Runner 时，每次 `register` 会在 `config.toml` 中追加一个 `[[runners]]`；若需改 `extra_hosts`、`pull_policy` 等，编辑 **`/srv/runner/config/config.toml`**（路径以实际为准）后 **`docker restart gitlab-runner`**。

<h2 id="c-5-5" class="mh2">5.5 Runner 磁盘与「换机」</h2>

Runner 节点 `/var/lib/docker` 多为**拉取缓存**，换机时通常**不必整盘迁移镜像**；新 Runner **标签与旧的一致** 后，流水线会重新 `pull`。若必须离线预热，再用下文镜像 tar 流程或先推 Harbor 再拉。


<h2 id="c-6-0" class="mh1">六、GitLab 数据迁移：旧机导出备份、新机导入恢复</h2>

本环境采用 **手工触发 Omnibus 备份** 在旧服务器**导出**，在新服务器**导入恢复**的方式迁移 GitLab。这与「研发本机 `git push` 迁仓库」互补：前者适合 **换机 / 换域名后的整体搬迁**，后者适合从第三方 Git 迁入已有 GitLab。

> **官方文档**：[Backup and restore](https://docs.gitlab.com/ee/administration/backup_restore/)。下文 rake 命令适用于 **Omnibus 包 / 容器内** 同一套 `gitlab-rake`；若你使用较新版本提供的 `gitlab-backup` 子命令，可与 `gitlab-rake gitlab:backup:*` **二选一**（勿混用含义不同的参数格式）。

<h2 id="c-6-0-1" class="mh2">6.0 迁移前必读：版本对齐 + 手工备份</h2>

1. **先确认版本一致或可升级恢复**  
   - 在**源机、目标机**分别查看 GitLab 版本（须与发行版说明一致，常见策略：**目标机版本 ≥ 源机生成备份时的版本**）。  
   - 示例（Omnibus 宿主机）：`sudo gitlab-rake gitlab:env:info`；或在管理界面查看 **Help → GitLab version**。  
   - 版本不一致时**不要直接 restore**，应按官方说明先升级或安装与备份匹配的版本，否则可能失败或产生数据不兼容。

2. **手工备份**  
   - 在维护窗口由运维**显式执行**备份命令（非依赖自动定时任务），便于控制 `SKIP`、磁盘与传输窗口。

3. **`SKIP=registry,artifacts,lfs` 的含义**  
   - 不在本备份包中包含：**容器镜像仓库（registry）数据**、**CI Job artifacts**、**Git LFS 对象**。  
   - 可显著缩短备份时间与减小包体积；若生产依赖 Harbor 存镜像、或流水线强依赖 artifacts/LFS，需在迁移计划中**另行迁移**（例如 Registry 走 Harbor 同步、LFS 走对象存储拷贝等）。

<h2 id="c-6-1" class="mh2">6.1 源服务器：执行备份（导出）</h2>

在 **Omnibus 原生安装**的源机器上执行（于维护窗口、磁盘空间充足时操作）：

```bash
sudo gitlab-rake gitlab:backup:create SKIP=registry,artifacts,lfs
```

**Docker 部署**时，在宿主机将上述命令放进容器内执行即可（容器名以 `gitlab` 为例）：

```bash
docker exec -t gitlab gitlab-rake gitlab:backup:create SKIP=registry,artifacts,lfs
```

备份完成后，在 **`gitlab.rb` 中 `gitlab_rails['backup_path']` 指定的目录**（默认 **`/var/opt/gitlab/backups`**）下会得到形如：

`1753938180_2025_07_31_11.0.3_gitlab_backup.tar`

的文件。其中 **`1753938180_2025_07_31_11.0.3`** 即为下文恢复时使用的 **备份 ID**（下划线前缀至 `_gitlab_backup.tar` 之前整段）。

**后续动作**：

- 将该 `.tar` 拷贝到目标机同一备份目录（或 NFS/对象存储中转）；  
- **务必同步拷贝** `/etc/gitlab/gitlab.rb`、`/etc/gitlab/gitlab-secrets.json`（Docker 场景对应宿主机挂载的 **`/srv/gitlab/config/`** 下同名文件）。`gitlab-secrets.json` 丢失会导致无法解密部分数据。

> **可选**：新版本亦可使用 `gitlab-backup create`（参数与 rake 不完全相同），以当前实例 `gitlab-backup --help` 为准。

<h2 id="c-6-2" class="mh2">6.2 目标服务器：安装 GitLab 并放入备份文件</h2>

1. 安装与迁移计划匹配的 **Omnibus GitLab**（版本见 **6.0**），**先不要**对外承接写流量。  
2. 将备份 `.tar` 放到目标机 **`backup_path`** 目录（默认 **`/var/opt/gitlab/backups`**），权限需满足官方要求（常见为 `chown git:git` 备份文件，以文档为准）。  
3. 将源机的 **`gitlab.rb`、`gitlab-secrets.json`** 拷入目标机对应路径；若 **域名 / IP 变更**，在恢复前后按官方指引调整 `external_url`、证书与 SSH 相关项。

<h2 id="c-6-3" class="mh2">6.3 目标服务器：停止服务 → 恢复 → 重启 → 自检</h2>

在 **Omnibus 原生安装**的目标机上执行：

```bash
# 停止相关服务（降低恢复过程中写入）
sudo gitlab-ctl stop puma
sudo gitlab-ctl stop sidekiq

# 执行恢复：BACKUP 仅填「备份 ID」，不要写路径、不要带 _gitlab_backup.tar
# 示例备份文件：1753938180_2025_07_31_11.0.3_gitlab_backup.tar
sudo gitlab-rake gitlab:backup:restore BACKUP=1753938180_2025_07_31_11.0.3

sudo gitlab-ctl restart

# 验证状态（SANITIZE=true 会屏蔽部分敏感输出，适合排障）
sudo gitlab-rake gitlab:check SANITIZE=true
```

**常见错误**：将 `BACKUP=` 写成 **`/var/opt/gitlab/backups/1753938180_2025_07_31_11.0.3`**。正确写法是 **`BACKUP=1753938180_2025_07_31_11.0.3`**；`.tar` 文件必须已位于 `backup_path` 目录，且命名符合 `备份ID_gitlab_backup.tar`。

**Docker 部署**时等价执行：

```bash
docker exec -it gitlab gitlab-ctl stop puma
docker exec -it gitlab gitlab-ctl stop sidekiq
docker exec -it gitlab gitlab-rake gitlab:backup:restore BACKUP=1753938180_2025_07_31_11.0.3
docker exec -it gitlab gitlab-ctl restart
docker exec -it gitlab gitlab-rake gitlab:check SANITIZE=true
```

恢复完成后登录 Web：核对项目、用户、CI 变量、Runner；若曾 `SKIP=registry`，确认镜像与容器 Registry 数据已通过 Harbor 或其它方式就绪。

> **与 `gitlab-backup restore` 的对应关系**：若使用 `gitlab-backup restore BACKUP=...`，同样只传**备份 ID**字符串；具体以实例版本帮助为准。

<h2 id="c-6-4" class="mh2">6.4 轻量方式：项目「导出 / 导入」（可选）</h2>

仅迁移**单个项目**时，可在旧 GitLab **Settings → General → Advanced → Export project** 下载导出包，在新 GitLab **New project → Import project → GitLab export** 上传。注意导出包**不包含** Runner、部分全局级配置；大项目需关注超时与磁盘空间。

<h2 id="c-6-5" class="mh2">6.5 仍适用：从其它 Git 平台迁入（`git push --mirror`）</h2>

若源站不是 GitLab、或只需迁少数仓库，可在本机或跳板机：

```bash
git clone --mirror git@old-git.example.com:group/old.git
cd old.git
git remote set-url origin git@gitlab.zhst.com:new-group/new.git
git push --mirror
```

新库需预先创建空项目；**弱网**可用 `git bundle create` 生成单文件再拷贝后 `git clone` 再 `push --mirror`。

<h2 id="c-6-6" class="mh2">6.6 迁移后验证克隆</h2>

确保 `hosts` / DNS 指向新 GitLab（示例）：

```text
10.0.0.186 gitlab.zhst.com
```

```bash
git clone git@gitlab.zhst.com:group/project.git
```


<h2 id="c-7-0" class="mh1">七、Docker 镜像离线迁移与推送 Harbor</h2>

适用：**源机无法直连 Harbor**、或需从旧 Runner **批量搬迁** 本地镜像。原四条脚本已**合并为下列两台各一个完整脚本**（**第七节全文收录**，可直接复制保存为 `.sh` 使用），职责清晰：**旧机只负责导出与传输**，**新机只负责导入与推送**。

| 文件 | 运行位置 | 合并来源 | 作用摘要 |
|---|---|---|---|
| `docker-migrate-01-export-old-host.sh` | **旧机 / 有镜像的源端** | 由原 `docker-image-tag-report` 与 `docker-image-pack-from` 合并 | 统计筛选 → `docker save` →（可选）`scp` 到新机目录 → 删本地 tar；支持 **`PACK_START_INDEX` 续跑**。 |
| `docker-migrate-02-import-new-host.sh` | **新机 / Runner 等目标端** | 由原 `docker-load-from-dir-187` 与 `docker-push-registry-images` 合并 | 目录批量 **`docker load`** → 按子串筛选 **`docker push`**；可用 **`PHASE`** 只跑其中一段。 |

**日常迁移使用下文两个全文脚本即可**。必须用 **`bash *.sh`** 执行（`set -euo pipefail`、Bash 4 关联数组）；勿用 `sh`。

<h2 id="c-7-0-0" class="mh2">7.0 端到端迁移流程（旧机 → 新机）</h2>

1. **旧机**：配置到新机（默认 `root@10.0.0.187`）的 **SSH 公钥免密**；可选先 `SKIP_DOCKER_SAVE=1 bash docker-migrate-01-export-old-host.sh` 只看筛选后列表。  
2. **旧机**：`bash docker-migrate-01-export-old-host.sh` — 按规则生成 `.tar` 并 **scp** 到新机 `REMOTE_DIR`（默认 `/data1/77_tar`）；失败则记下**筛选后行号**，在相同 `SORT_BY`、`EXCLUDE_TAG_THRESHOLD` 下执行 `PACK_START_INDEX=N bash docker-migrate-01-export-old-host.sh` 或 `bash docker-migrate-01-export-old-host.sh N`。  
3. **新机**：确认 tar 已到 `SRC_DIR`；执行 `docker login registry.zhst.com`（及所需项目权限）。若 load 后镜像名仍非目标私库路径，先对需推送条目执行 **`docker tag`**。  
4. **新机**：`DRY_RUN=1 bash docker-migrate-02-import-new-host.sh` 预览 push 列表，再去掉 `DRY_RUN` 执行；或 `PHASE=load` 只导入、`PHASE=push` 只推送。

```bash
chmod +x docker-migrate-01-export-old-host.sh docker-migrate-02-import-new-host.sh
```

<h2 id="c-7-0-1" class="mh2">7.1 旧机脚本：环境变量与行为说明</h2>

| 变量 | 默认值 | 说明 |
|---|---|---|
| `EXCLUDE_TAG_THRESHOLD` | `10` | 某 `REPOSITORY` 在 `docker images` 中 TAG **行数**大于该值则整库**不参与**筛选与打包（避免海量 tag 的中间层仓库）。 |
| `SORT_BY` | `name` | `name` 按仓库名字母序；`count` 按 TAG 行数降序。**与续跑行号绑定**，续跑时不可改。 |
| `SKIP_DOCKER_SAVE` | `0` | `1` 或 `true`：只打印汇总与明细，**不** `docker save`、不 scp。 |
| `SAVE_TOP_N` | `all` | `all`：自 `PACK_START_INDEX` 起打到列表末尾；正整数：从起点起最多打 N 个仓库；`0`：不打包。 |
| `PACK_START_INDEX` / `$1` | `1` | 从「筛选后、排序后」明细的**第几行**开始打包；`1` 即从头。中断续跑必须与上次排序/排除一致。 |
| `SAVE_INTERVAL_SEC` | `1` | 每个仓库（及多包时每个 tar）之间的休眠秒数，减轻磁盘与网络尖峰。 |
| `PACK_OUT_DIR` | `/tmp` | 本地临时 tar 输出目录；需足够空间。 |
| `LARGE_IMAGE_BYTES` | `2GiB` | 多 TAG 且单层最大超过该字节时，改为**每个 tag 单独 save**，全部成功后再依次 scp。 |
| `REMOTE_COPY` | `1` | `0`：只生成 tar，不 scp（便于 U 盘拷贝场景）。 |
| `REMOTE_HOST` / `REMOTE_DIR` / `REMOTE_USER` | `10.0.0.187` / `/data1/77_tar` / `root` | scp 目标；远端目录会自动 `mkdir -p`。 |
| `REMOTE_SSH_IDENTITY_FILE` | 空 | 非空时 `ssh`/`scp` 增加 `-i` 指定私钥。 |
| `REMOTE_SSH_USE_PASSWORD` 等 | `0` | 为 `1` 时使用 sshpass/expect（不推荐）；与免密二选一。 |

<h2 id="c-7-0-2" class="mh2">7.2 新机脚本：环境变量与行为说明</h2>

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PHASE` | `all` | `all`：先执行 load 再 push；`load`：仅 `docker load`；`push`：仅按子串 push（tar 已导入过时使用）。 |
| `SKIP_LOAD` / `SKIP_PUSH` | `0` | 在 `PHASE=all` 时跳过其中一段（例如仅补 push：`SKIP_LOAD=1`）。 |
| `SRC_DIR` | `/data1/77_tar` | 存放旧机 scp 过来的 `*.tar` 的目录。 |
| `FILE_GLOB` | `*.tar` | 匹配要 load 的文件名模式。 |
| `START_INDEX` | `1` | 从排序后第 N 个文件开始 load（断点续传 tar 列表）。 |
| `LOAD_BATCH_SIZE` | `10` | 每批连续 load 个数；`0` 表示不分批、不批间 sleep。 |
| `BATCH_SLEEP_SEC` | `1` | 每批之间的等待秒数。 |
| `REGISTRY_SUBSTRING` | `registry.zhst.com` | 仅对 `REPOSITORY` **包含**该子串（不区分大小写）的 `repo:tag` 执行 `docker push`。 |
| `DRY_RUN` | `0` | `1`：只打印将要 push 的列表，不执行 push。 |
| `CONTINUE_ON_ERROR` | `0` | `1`：单条 push 失败继续下一条；结束码仍可能非 0。 |
| `PUSH_INTERVAL_SEC` | `0` | 两条 push 之间的间隔秒数。 |

<h2 id="c-7-0-3" class="mh2">7.3 旧机脚本全文：`docker-migrate-01-export-old-host.sh`</h2>

以下为**完整可执行脚本正文**（保存为 `docker-migrate-01-export-old-host.sh` 后 `chmod +x` 即可）。因含 Docker `--format` 中的 `{{` … `}}`，站点生成静态页时用 `raw` 包裹以免被模板引擎误解析。

{% raw %}
```bash
#!/usr/bin/env bash
# 【旧机 / 源端】Docker 镜像离线导出：合并原 docker-image-tag-report.sh + docker-image-pack-from.sh。
# 流程：汇总与筛选后明细 → 按规则 docker save →（可选）scp 至新机目录 → 删本地 tar → 间隔。
# 多 TAG 且单镜像 > LARGE_IMAGE_BYTES 时按每 tag 一包；中断后可从筛选后第 N 行续跑。
#
# 排除规则：TAG 条目数 > EXCLUDE_TAG_THRESHOLD 的仓库不参与「筛选后」明细与打包。
#
# 用法:
#   bash docker-migrate-01-export-old-host.sh
#   SKIP_DOCKER_SAVE=1 bash docker-migrate-01-export-old-host.sh          # 仅统计，不 save
#   PACK_START_INDEX=74 bash docker-migrate-01-export-old-host.sh           # 从筛选后第 74 行续跑
#   bash docker-migrate-01-export-old-host.sh 74                            # 同上，第一个参数为行号
# 远端：默认 scp 到 REMOTE_USER@REMOTE_HOST:REMOTE_DIR（BatchMode=yes 免密）
#
# 环境变量: 同原 tag-report（EXCLUDE_TAG_THRESHOLD, SORT_BY, SAVE_TOP_N, SAVE_INTERVAL_SEC, PACK_OUT_DIR,
#   REMOTE_*, REMOTE_SSH_*, LARGE_IMAGE_BYTES, SKIP_DOCKER_SAVE）；
#   另: PACK_START_INDEX  从筛选后排序列表第几行开始打包（默认 1；须与 SORT_BY/EXCLUDE 与上次一致）

set -euo pipefail

if [[ -z "${BASH_VERSION:-}" ]]; then
  echo "错误: 请使用 bash 运行本脚本（不要用 sh）。示例: bash $0" >&2
  exit 1
fi

LARGE_IMAGE_BYTES="${LARGE_IMAGE_BYTES:-$((2 * 1024 * 1024 * 1024))}"

_human_size() {
  local b=$1
  if command -v numfmt >/dev/null 2>&1; then
    numfmt --to=iec-i --suffix=B "$b" 2>/dev/null || echo "${b} B"
  else
    echo "${b} B"
  fi
}

EXCLUDE_TAG_THRESHOLD="${EXCLUDE_TAG_THRESHOLD:-10}"
SAVE_TOP_N="${SAVE_TOP_N:-all}"
SAVE_INTERVAL_SEC="${SAVE_INTERVAL_SEC:-1}"
PACK_OUT_DIR="${PACK_OUT_DIR:-/tmp}"
SKIP_DOCKER_SAVE="${SKIP_DOCKER_SAVE:-0}"

REMOTE_COPY="${REMOTE_COPY:-1}"
REMOTE_HOST="${REMOTE_HOST:-10.0.0.187}"
REMOTE_DIR="${REMOTE_DIR:-/data1/77_tar}"
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_SSH_IDENTITY_FILE="${REMOTE_SSH_IDENTITY_FILE:-}"
REMOTE_SSH_USE_PASSWORD="${REMOTE_SSH_USE_PASSWORD:-0}"
REMOTE_SSH_PASSWORD="${REMOTE_SSH_PASSWORD:-}"
REMOTE_SSH_PASSWORD_FILE="${REMOTE_SSH_PASSWORD_FILE:-}"

SSH_OPTS=(-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null)

should_exclude() {
  local _repo=$1 cnt=$2
  [[ "$cnt" -gt "$EXCLUDE_TAG_THRESHOLD" ]]
}

if [[ "$REMOTE_SSH_USE_PASSWORD" == "1" && -z "$REMOTE_SSH_PASSWORD" && -n "$REMOTE_SSH_PASSWORD_FILE" && -f "$REMOTE_SSH_PASSWORD_FILE" ]]; then
  REMOTE_SSH_PASSWORD=$(tr -d '\r\n' <"$REMOTE_SSH_PASSWORD_FILE")
fi

remote_scp_tar() {
  local outfile=$1
  local base dest mk_rc scp_rc
  local -a scp_id ssh_id
  base=$(basename "$outfile")
  dest="${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/${base}"
  scp_id=()
  ssh_id=()
  if [[ -n "$REMOTE_SSH_IDENTITY_FILE" ]]; then
    if [[ ! -f "$REMOTE_SSH_IDENTITY_FILE" || ! -r "$REMOTE_SSH_IDENTITY_FILE" ]]; then
      echo "错误: 私钥不可读: ${REMOTE_SSH_IDENTITY_FILE}" >&2
      return 1
    fi
    ssh_id=(-i "$REMOTE_SSH_IDENTITY_FILE")
    scp_id=(-i "$REMOTE_SSH_IDENTITY_FILE")
  fi

  # --- 默认：公钥免密（BatchMode=yes，禁止交互读密码）---
  if [[ "$REMOTE_SSH_USE_PASSWORD" != "1" || -z "$REMOTE_SSH_PASSWORD" ]]; then
    set +e
    # 兼容 set -u：即使数组变量未定义也不报错
    ssh ${SSH_OPTS[@]+"${SSH_OPTS[@]}"} ${ssh_id[@]+"${ssh_id[@]}"} -o BatchMode=yes "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p \"${REMOTE_DIR}\""
    mk_rc=$?
    if [[ "$mk_rc" -ne 0 ]]; then
      set -e
      echo "错误: 免密 ssh 失败（退出码 ${mk_rc}）${REMOTE_USER}@${REMOTE_HOST}。请在本机执行: ssh-copy-id -i 你的公钥.pub ${REMOTE_USER}@${REMOTE_HOST}" >&2
      echo "      或设置 REMOTE_SSH_IDENTITY_FILE=指定私钥；若需密码则 REMOTE_SSH_USE_PASSWORD=1 并安装 sshpass/expect。" >&2
      return "$mk_rc"
    fi
    scp ${SSH_OPTS[@]+"${SSH_OPTS[@]}"} ${scp_id[@]+"${scp_id[@]}"} -o BatchMode=yes "$outfile" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"
    scp_rc=$?
    set -e
    if [[ "$scp_rc" -ne 0 ]]; then
      echo "错误: 免密 scp 失败（退出码 ${scp_rc}）→ ${dest}" >&2
      return "$scp_rc"
    fi
    return 0
  fi

  # --- 密码模式（仅 REMOTE_SSH_USE_PASSWORD=1）: sshpass ---
  if command -v sshpass >/dev/null 2>&1; then
    set +e
    sshpass -p"$REMOTE_SSH_PASSWORD" ssh "${SSH_OPTS[@]}" "${ssh_id[@]}" "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p \"${REMOTE_DIR}\""
    mk_rc=$?
    if [[ "$mk_rc" -ne 0 ]]; then
      set -e
      echo "错误: 远端 mkdir 失败（退出码 ${mk_rc}）: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}" >&2
      return "$mk_rc"
    fi
    sshpass -p"$REMOTE_SSH_PASSWORD" scp "${SSH_OPTS[@]}" "${scp_id[@]}" "$outfile" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"
    scp_rc=$?
    set -e
    if [[ "$scp_rc" -ne 0 ]]; then
      echo "错误: scp 失败（退出码 ${scp_rc}）→ ${dest}" >&2
      return "$scp_rc"
    fi
    return 0
  fi

  # --- expect（无 sshpass 时的备选）---
  if command -v expect >/dev/null 2>&1; then
    echo "    提示: 未安装 sshpass，已改用 expect 进行密码认证拷贝。" >&2
    export REMOTE_HOST REMOTE_USER REMOTE_DIR LOCAL_TAR="$outfile"
    set +e
    expect <<'EXPECTEOF'
set timeout 120
set pass $env(REMOTE_SSH_PASSWORD)
spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(REMOTE_USER)@$env(REMOTE_HOST) "mkdir -p $env(REMOTE_DIR)"
expect {
  -re "(?i)yes/no" { send "yes\r"; exp_continue }
  -re "(?i)assword|密码" { send "$pass\r"; exp_continue }
  eof
}
EXPECTEOF
    mk_rc=$?
    if [[ "$mk_rc" -ne 0 ]]; then
      set -e
      echo "错误: expect+ssh mkdir 失败（退出码 ${mk_rc}）" >&2
      return "$mk_rc"
    fi
    expect <<'EXPECTEOF'
set timeout -1
set pass $env(REMOTE_SSH_PASSWORD)
spawn scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(LOCAL_TAR) $env(REMOTE_USER)@$env(REMOTE_HOST):$env(REMOTE_DIR)/
expect {
  -re "(?i)yes/no" { send "yes\r"; exp_continue }
  -re "(?i)assword|密码" { send "$pass\r"; exp_continue }
  eof
}
EXPECTEOF
    scp_rc=$?
    set -e
    if [[ "$scp_rc" -ne 0 ]]; then
      echo "错误: expect+scp 失败（退出码 ${scp_rc}）→ ${dest}" >&2
      return "$scp_rc"
    fi
    return 0
  fi

  echo "错误: REMOTE_SSH_USE_PASSWORD=1 但本机无 sshpass/expect，无法非交互读密码。" >&2
  echo "      请: yum install -y sshpass 或 expect；或改走免密（unset REMOTE_SSH_PASSWORD 且 REMOTE_SSH_USE_PASSWORD=0）。" >&2
  return 1
}

if ! command -v docker >/dev/null 2>&1; then
  echo "错误: 未找到 docker 命令。" >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "错误: 无法连接 Docker daemon（权限不足或未启动）。" >&2
  exit 1
fi

SORT_BY="${SORT_BY:-name}" # name | count

PACK_START_INDEX="${PACK_START_INDEX:-1}"
[[ -n "${1:-}" ]] && [[ "$1" =~ ^[1-9][0-9]*$ ]] && PACK_START_INDEX="$1"

mapfile -t lines < <(docker images --format '{{.Repository}}\t{{.Tag}}' 2>/dev/null || true)

if [[ ${#lines[@]} -eq 0 ]]; then
  echo "当前无任何镜像记录。"
  exit 0
fi

declare -A repo_tag_count
for line in "${lines[@]}"; do
  repo="${line%%$'\t'*}"
  [[ -z "$repo" ]] && repo="<empty>"
  ((repo_tag_count["$repo"]++)) || true
done

tmp=$(mktemp)
excluded_tmp=$(mktemp)
sorted_filtered=$(mktemp)
trap 'rm -f "$tmp" "$excluded_tmp" "$sorted_filtered"' EXIT

excluded_tag_sum=0
for repo in "${!repo_tag_count[@]}"; do
  cnt=${repo_tag_count[$repo]}
  if should_exclude "$repo" "$cnt"; then
    printf '%s\t%d\n' "$repo" "$cnt" >>"$excluded_tmp"
    ((excluded_tag_sum += cnt)) || true
    continue
  fi
  printf '%s\t%d\n' "$repo" "$cnt" >>"$tmp"
done

if [[ -s "$tmp" ]]; then
  if [[ "$SORT_BY" == "count" ]]; then
    sort -t$'\t' -k2,2nr -k1,1 "$tmp" >"$sorted_filtered"
  else
    sort -t$'\t' -k1,1 "$tmp" >"$sorted_filtered"
  fi
else
  : >"$sorted_filtered"
fi

full_repo_count=${#repo_tag_count[@]}
full_tag_lines=${#lines[@]}
excluded_repo_count=0
if [[ -s "$excluded_tmp" ]]; then
  excluded_repo_count=$(wc -l <"$excluded_tmp" | tr -d ' ')
fi

filtered_repo_count=0
filtered_tag_lines=0
while IFS=$'\t' read -r _ cnt; do
  ((filtered_repo_count++)) || true
  ((filtered_tag_lines += cnt)) || true
done <"$tmp"

unique_ids=$(docker images -q --no-trunc 2>/dev/null | sort -u | wc -l | tr -d ' ')

echo "========================================"
echo "汇总（先全量统计，再应用排除规则）"
echo "========================================"
echo "  全量 — 镜像仓库数量: ${full_repo_count}"
echo "  全量 — TAG 条目总数（docker images 行数）: ${full_tag_lines}"
echo "  全机 — 唯一 IMAGE ID 数量: ${unique_ids}"
echo ""
echo "  排除规则: TAG>${EXCLUDE_TAG_THRESHOLD} 的仓库不进入筛选后明细（可调 EXCLUDE_TAG_THRESHOLD）"
echo "  已排除 — 镜像仓库数量: ${excluded_repo_count}"
echo "  已排除 — TAG 条目数: ${excluded_tag_sum}"
echo ""
echo "  筛选后 — 镜像仓库数量: ${filtered_repo_count}"
echo "  筛选后 — TAG 条目总数: ${filtered_tag_lines}"
echo "========================================"
echo ""
echo "说明: TAG 数量按 REPOSITORY 分组后的行数，与 docker images 一致。"
echo "      「唯一 IMAGE ID」为全机 Docker 层，不受筛选影响。"
echo ""

echo "----------------------------------------"
printf "%-55s %10s\n" "REPOSITORY（筛选后明细，TAG≤${EXCLUDE_TAG_THRESHOLD}）" "TAG数量/说明"
echo "----------------------------------------"

if [[ ! -s "$sorted_filtered" ]]; then
  echo "（无筛选后仓库；可能全部被排除）"
  echo "----------------------------------------"
else
  while IFS=$'\t' read -r repo cnt; do
    if [[ "$repo" == "<empty>" ]]; then
      printf "%-55s %10s\n" "$repo" "$cnt"
      continue
    fi
    refs=()
    while IFS=$'\t' read -r r t; do
      [[ "$r" == "$repo" ]] || continue
      [[ "$t" == "<none>" ]] && continue
      refs+=("$r:$t")
    done < <(docker images --format '{{.Repository}}\t{{.Tag}}' 2>/dev/null || true)

    if [[ ${#refs[@]} -gt 1 ]]; then
      max_b=0
      for ref in "${refs[@]}"; do
        b=$(docker image inspect -f '{{.Size}}' "$ref" 2>/dev/null || echo 0)
        ((b > max_b)) && max_b=$b
      done
      if ((max_b > LARGE_IMAGE_BYTES)); then
        printf "%-55s %10s\n" "${repo}" "展开${#refs[@]}TAG"
        while IFS= read -r ref; do
          b=$(docker image inspect -f '{{.Size}}' "$ref" 2>/dev/null || echo 0)
          hu=$(_human_size "$b")
          printf "      %-62s %18s\n" "$ref" "$hu"
        done < <(printf '%s\n' "${refs[@]}" | sort)
        continue
      fi
    fi
    printf "%-55s %10d\n" "$repo" "$cnt"
  done <"$sorted_filtered"
  echo "----------------------------------------"
fi

# 筛选后明细：从 PACK_START_INDEX 起依次打包 →（可选）scp → 删本地 → 间隔（PACK_START_INDEX=1 即自开头）
if [[ "$SKIP_DOCKER_SAVE" != "1" && "$SKIP_DOCKER_SAVE" != "true" ]] && [[ -s "$sorted_filtered" ]] && [[ "$SAVE_TOP_N" != "0" ]]; then
  total_lines_pack=$(wc -l <"$sorted_filtered" | tr -d ' ')
  if ! [[ "$PACK_START_INDEX" =~ ^[1-9][0-9]*$ ]]; then
    echo "错误: PACK_START_INDEX 须为正整数（当前: ${PACK_START_INDEX}）" >&2
    exit 1
  fi
  if [[ "$PACK_START_INDEX" -gt "$total_lines_pack" ]]; then
    echo "错误: PACK_START_INDEX=${PACK_START_INDEX} 大于筛选后总行数 ${total_lines_pack}" >&2
    exit 1
  fi
  if [[ "$SAVE_TOP_N" == "all" || "$SAVE_TOP_N" == "ALL" ]]; then
    mapfile -t top_lines < <(tail -n "+${PACK_START_INDEX}" "$sorted_filtered")
    if [[ "$PACK_START_INDEX" -eq 1 ]]; then
      pack_label="全部"
    else
      pack_label="从筛选后第 ${PACK_START_INDEX} 行起至末尾"
    fi
  else
    if ! [[ "$SAVE_TOP_N" =~ ^[1-9][0-9]*$ ]]; then
      echo "错误: SAVE_TOP_N 须为 all 或正整数（当前: ${SAVE_TOP_N}）" >&2
      exit 1
    fi
    mapfile -t top_lines < <(tail -n "+${PACK_START_INDEX}" "$sorted_filtered" | head -n "$SAVE_TOP_N")
    pack_label="从第 ${PACK_START_INDEX} 行起最多 ${SAVE_TOP_N} 个仓库"
  fi
  n_pack=${#top_lines[@]}
  if [[ "$n_pack" -gt 0 ]]; then
    echo ""
    echo "========================================"
    echo "打包（${pack_label}，共 ${n_pack} 个仓库；SORT_BY=${SORT_BY} PACK_START_INDEX=${PACK_START_INDEX}）"
    echo "  本地目录: ${PACK_OUT_DIR}"
    if [[ "$REMOTE_COPY" == "1" ]]; then
      echo "  远端(免密): scp/ssh -o BatchMode=yes → ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/  （可选 REMOTE_SSH_IDENTITY_FILE=私钥；密码: REMOTE_SSH_USE_PASSWORD=1）"
    else
      echo "  远端拷贝: 已关闭（REMOTE_COPY=0），本地 tar 将保留"
    fi
    echo "  每项结束后间隔 ${SAVE_INTERVAL_SEC}s 再处理下一项"
    echo "========================================"
    mkdir -p "$PACK_OUT_DIR"
    idx=0
    for line in "${top_lines[@]}"; do
      repo="${line%%$'\t'*}"
      cnt="${line#*$'\t'}"
      ((idx++)) || true
      if [[ "$repo" == "<empty>" ]]; then
        echo "[$idx/${n_pack}] 跳过 REPOSITORY=<empty>"
        if (( idx < n_pack )); then
          echo "    等待 ${SAVE_INTERVAL_SEC} 秒后进行下一项..."
          sleep "$SAVE_INTERVAL_SEC"
        fi
        continue
      fi

      refs=()
      while IFS=$'\t' read -r r t; do
        [[ "$r" == "$repo" ]] || continue
        [[ "$t" == "<none>" ]] && continue
        refs+=("$r:$t")
      done < <(docker images --format '{{.Repository}}\t{{.Tag}}' 2>/dev/null || true)

      if [[ ${#refs[@]} -eq 0 ]]; then
        echo "[$idx/${n_pack}] 跳过（无有效 tag）: ${repo}"
        if (( idx < n_pack )); then
          echo "    等待 ${SAVE_INTERVAL_SEC} 秒后进行下一项..."
          sleep "$SAVE_INTERVAL_SEC"
        fi
        continue
      fi

      safe_name=$(echo "$repo" | tr '/:' '__' | tr -c 'A-Za-z0-9._-' '_')
      split_large=0
      max_b=0
      if [[ ${#refs[@]} -gt 1 ]]; then
        for ref in "${refs[@]}"; do
          b=$(docker image inspect -f '{{.Size}}' "$ref" 2>/dev/null || echo 0)
          ((b > max_b)) && max_b=$b
        done
        ((max_b > LARGE_IMAGE_BYTES)) && split_large=1
      fi

      echo ""
      if [[ "$split_large" -eq 1 ]]; then
        nt=${#refs[@]}
        echo "[$idx/${n_pack}] ${repo}：多 TAG（${nt}）且镜像>${LARGE_IMAGE_BYTES} 字节 — 每 tag 单独 save，全部完成后再依次拷贝。"
        echo "    TAG 列表:"
        while IFS= read -r ref; do
          b=$(docker image inspect -f '{{.Size}}' "$ref" 2>/dev/null || echo 0)
          hu=$(_human_size "$b")
          printf "      %-62s %18s\n" "$ref" "$hu"
        done < <(printf '%s\n' "${refs[@]}" | sort)
        saved_tars=()
        ti=0
        while IFS= read -r ref; do
          ((ti++)) || true
          safe_ref=$(echo "$ref" | tr '/:' '__' | tr -c 'A-Za-z0-9._-' '_')
          outfile="${PACK_OUT_DIR}/docker_save_${safe_name}_t${ti}_${safe_ref}_${idx}_$$.tar"
          echo "    [save ${ti}/${nt}] $ref → $(basename "$outfile")"
          set +e
          docker save -o "$outfile" "$ref"
          save_rc=$?
          set -e
          if [[ "$save_rc" -ne 0 ]]; then
            echo "    save 失败（退出码 ${save_rc}）: $ref" >&2
            rm -f "$outfile"
          else
            echo "    save 成功: $outfile"
            saved_tars+=("$outfile")
          fi
        done < <(printf '%s\n' "${refs[@]}" | sort)

        if [[ ${#saved_tars[@]} -eq 0 ]]; then
          echo "[$idx/${n_pack}] 本仓库无成功 save 的包，跳过拷贝。" >&2
        elif [[ "$REMOTE_COPY" == "1" ]]; then
          ci=0
          for outfile in "${saved_tars[@]}"; do
            ((ci++)) || true
            echo "    [拷贝 ${ci}/${#saved_tars[@]}] → ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/ $(basename "$outfile")"
            if remote_scp_tar "$outfile"; then
              echo "    拷贝完成，已删本地: $outfile"
              rm -f "$outfile"
            else
              echo "    拷贝失败，本地保留: $outfile" >&2
            fi
            if (( ci < ${#saved_tars[@]} )); then
              echo "    等待 ${SAVE_INTERVAL_SEC} 秒后进行下一个拷贝..."
              sleep "$SAVE_INTERVAL_SEC"
            fi
          done
        else
          echo "    REMOTE_COPY=0，保留 ${#saved_tars[@]} 个本地 tar（未 scp）"
        fi
      else
        outfile="${PACK_OUT_DIR}/docker_save_${safe_name}_${idx}_$$.tar"
        echo "[$idx/${n_pack}] 正在打包: ${repo}（共 ${#refs[@]} 个引用: ${cnt} 行 TAG）→ ${outfile}"
        set +e
        docker save -o "$outfile" "${refs[@]}"
        save_rc=$?
        set -e
        if [[ "$save_rc" -ne 0 ]]; then
          echo "[$idx/${n_pack}] 打包失败（docker save 退出码 ${save_rc}）: ${repo}" >&2
          rm -f "$outfile"
        else
          echo "[$idx/${n_pack}] 打包成功: ${repo} → ${outfile}"
          if [[ "$REMOTE_COPY" == "1" ]]; then
            echo "    正在拷贝到 ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/ ..."
            if remote_scp_tar "$outfile"; then
              echo "    拷贝完成: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/$(basename "$outfile")"
              rm -f "$outfile"
              echo "    已删除本地打包文件: ${outfile}"
            else
              echo "    拷贝失败，本地 tar 仍保留: ${outfile}" >&2
            fi
          else
            echo "    REMOTE_COPY=0，跳过 scp，本地 tar 保留: ${outfile}"
          fi
        fi
      fi

      if (( idx < n_pack )); then
        echo "    等待 ${SAVE_INTERVAL_SEC} 秒后进行下一项..."
        sleep "$SAVE_INTERVAL_SEC"
      fi
    done
    echo ""
    echo "========================================"
    echo "打包流程结束"
    echo "========================================"
  fi
fi

if [[ -s "$excluded_tmp" ]]; then
  echo ""
  echo "----------------------------------------"
  printf "%-55s %10s\n" "已排除仓库（仅列表，不计入上表明细）" "TAG数量/说明"
  echo "----------------------------------------"
  sort -t$'\t' -k2,2nr -k1,1 "$excluded_tmp" | while IFS=$'\t' read -r er ec; do
    if [[ "$er" == "<empty>" ]]; then
      printf "%-55s %10s\n" "$er" "$ec"
      continue
    fi
    eref=()
    while IFS=$'\t' read -r r t; do
      [[ "$r" == "$er" ]] || continue
      [[ "$t" == "<none>" ]] && continue
      eref+=("$r:$t")
    done < <(docker images --format '{{.Repository}}\t{{.Tag}}' 2>/dev/null || true)
    if [[ ${#eref[@]} -gt 1 ]]; then
      max_b=0
      for ref in "${eref[@]}"; do
        b=$(docker image inspect -f '{{.Size}}' "$ref" 2>/dev/null || echo 0)
        ((b > max_b)) && max_b=$b
      done
      if ((max_b > LARGE_IMAGE_BYTES)); then
        printf "%-55s %10s\n" "${er}" "展开${#eref[@]}TAG"
        while IFS= read -r ref; do
          b=$(docker image inspect -f '{{.Size}}' "$ref" 2>/dev/null || echo 0)
          hu=$(_human_size "$b")
          printf "      %-62s %18s\n" "$ref" "$hu"
        done < <(printf '%s\n' "${eref[@]}" | sort)
        continue
      fi
    fi
    printf "%-55s %10d\n" "$er" "$ec"
  done
  echo "----------------------------------------"
fi
```
{% endraw %}

<h2 id="c-7-0-4" class="mh2">7.4 新机脚本全文：`docker-migrate-02-import-new-host.sh`</h2>

以下为**完整可执行脚本正文**（保存为 `docker-migrate-02-import-new-host.sh` 后 `chmod +x` 即可）。同样因含 `{{`，用 `raw` 包裹。

{% raw %}
```bash
#!/usr/bin/env bash
# 【新机 / 目标端】Docker 镜像离线导入：合并原 docker-load-from-dir-187.sh + docker-push-registry-images.sh。
#
# 默认流程（PHASE=all）：
#   1）对 SRC_DIR 下 FILE_GLOB 批量 docker load（可分批、可断点 START_INDEX）
#   2）对 REPOSITORY 含 REGISTRY_SUBSTRING 的镜像依次 docker push（需已 docker login）
#
# 用法:
#   bash docker-migrate-02-import-new-host.sh
#   PHASE=load bash docker-migrate-02-import-new-host.sh              # 只 load
#   PHASE=push bash docker-migrate-02-import-new-host.sh              # 只 push（已 load）
#   SKIP_PUSH=1 SRC_DIR=/data1/77_tar bash docker-migrate-02-import-new-host.sh
#
# 环境变量 — load 段:
#   SRC_DIR, LOAD_BATCH_SIZE, BATCH_SLEEP_SEC, FILE_GLOB, START_INDEX（含义同原 load 脚本）
# 环境变量 — push 段:
#   REGISTRY_SUBSTRING, DRY_RUN, CONTINUE_ON_ERROR, PUSH_INTERVAL_SEC（含义同原 push 脚本）

set -euo pipefail

if [[ -z "${BASH_VERSION:-}" ]]; then
  echo "错误: 请使用 bash 运行本脚本（不要用 sh）。示例: bash $0" >&2
  exit 1
fi

PHASE="${PHASE:-all}"
SKIP_PUSH="${SKIP_PUSH:-0}"
SKIP_LOAD="${SKIP_LOAD:-0}"

SRC_DIR="${SRC_DIR:-/data1/77_tar}"
LOAD_BATCH_SIZE="${LOAD_BATCH_SIZE:-10}"
BATCH_SLEEP_SEC="${BATCH_SLEEP_SEC:-1}"
FILE_GLOB="${FILE_GLOB:-*.tar}"
START_INDEX="${START_INDEX:-1}"

REGISTRY_SUBSTRING="${REGISTRY_SUBSTRING:-registry.zhst.com}"
DRY_RUN="${DRY_RUN:-0}"
CONTINUE_ON_ERROR="${CONTINUE_ON_ERROR:-0}"
PUSH_INTERVAL_SEC="${PUSH_INTERVAL_SEC:-0}"

if ! command -v docker >/dev/null 2>&1; then
  echo "错误: 未找到 docker 命令。" >&2
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "错误: 无法连接 Docker daemon（权限不足或未启动）。" >&2
  exit 1
fi

# ---------- load 段（来自 docker-load-from-dir-187.sh）----------
do_load() {
  if [[ ! -d "$SRC_DIR" ]]; then
    echo "错误: 目录不存在: $SRC_DIR" >&2
    return 1
  fi
  if ! [[ "$START_INDEX" =~ ^[1-9][0-9]*$ ]]; then
    echo "错误: START_INDEX 必须为正整数（当前: $START_INDEX）" >&2
    return 1
  fi
  if ! [[ "$LOAD_BATCH_SIZE" =~ ^[0-9]+$ ]]; then
    echo "错误: LOAD_BATCH_SIZE 必须为非负整数（当前: $LOAD_BATCH_SIZE）" >&2
    return 1
  fi
  if ! [[ "$BATCH_SLEEP_SEC" =~ ^[0-9]+$ ]]; then
    echo "错误: BATCH_SLEEP_SEC 必须为非负整数（当前: $BATCH_SLEEP_SEC）" >&2
    return 1
  fi

  shopt -s nullglob
  local files=( "$SRC_DIR"/$FILE_GLOB )
  shopt -u nullglob

  if [[ ${#files[@]} -eq 0 ]]; then
    echo "未找到任何文件: ${SRC_DIR}/${FILE_GLOB}"
    return 0
  fi

  local total=${#files[@]}
  if (( START_INDEX > total )); then
    echo "错误: START_INDEX=$START_INDEX 大于文件总数 $total" >&2
    return 1
  fi

  echo "========================================"
  echo "docker load 批量导入"
  echo "  目录: $SRC_DIR"
  echo "  匹配: $FILE_GLOB"
  echo "  文件数: $total"
  echo "  起始: 第 $START_INDEX 个"
  if (( LOAD_BATCH_SIZE == 0 )); then
    echo "  批次: 不分批"
  else
    echo "  批次: 每批 $LOAD_BATCH_SIZE 个；批间等待 ${BATCH_SLEEP_SEC}s"
  fi
  echo "========================================"

  local idx=0 in_batch=0 i
  for i in $(seq "$START_INDEX" "$total"); do
    local f="${files[$((i-1))]}"
    ((idx++)) || true
    ((in_batch++)) || true

    echo ""
    echo "[$i/$total] 正在加载: $(basename "$f")"
    set +e
    local out rc
    out=$(docker load -i "$f" 2>&1)
    rc=$?
    set -e

    if [[ $rc -ne 0 ]]; then
      echo "[$i/$total] 加载失败（退出码 $rc）: $f" >&2
      echo "$out" >&2
    else
      echo "[$i/$total] 加载成功: $f"
      echo "$out"
    fi

    if (( LOAD_BATCH_SIZE > 0 )) && (( in_batch >= LOAD_BATCH_SIZE )) && (( i < total )); then
      in_batch=0
      if (( BATCH_SLEEP_SEC > 0 )); then
        echo ""
        echo "---- 批次完成，等待 ${BATCH_SLEEP_SEC}s 后继续 ----"
        sleep "$BATCH_SLEEP_SEC"
      fi
    fi
  done

  echo ""
  echo "========================================"
  echo "导入完成，镜像/tag 统计"
  echo "========================================"

  mapfile -t img_lines < <(docker images --format '{{.Repository}}\t{{.Tag}}\t{{.ID}}' 2>/dev/null || true)
  if [[ ${#img_lines[@]} -eq 0 ]]; then
    echo "当前 docker images 无任何记录。"
    return 0
  fi

  declare -A repo_tag_count
  local total_tag_lines=0
  echo ""
  echo "----------------------------------------"
  echo "所有镜像（repo:tag）"
  echo "----------------------------------------"
  local line repo rest tag
  for line in "${img_lines[@]}"; do
    repo="${line%%$'\t'*}"
    rest="${line#*$'\t'}"
    tag="${rest%%$'\t'*}"
    [[ -z "$repo" ]] && repo="<empty>"
    printf "%s:%s\n" "$repo" "$tag"
    ((total_tag_lines++)) || true
    ((repo_tag_count["$repo"]++)) || true
  done | sort

  local repo_count=0
  for _ in "${!repo_tag_count[@]}"; do
    ((repo_count++)) || true
  done
  local unique_ids
  unique_ids=$(docker images -q --no-trunc 2>/dev/null | sort -u | wc -l | tr -d ' ')
  echo "----------------------------------------"
  echo "汇总: 仓库数=${repo_count} TAG行数=${total_tag_lines} 唯一IMAGE ID=${unique_ids}"
  echo "----------------------------------------"
}

# ---------- push 段（来自 docker-push-registry-images.sh）----------
_substring_match_ci() {
  local haystack=$1 needle=$2
  local hl nl
  hl=$(printf '%s' "$haystack" | tr '[:upper:]' '[:lower:]')
  nl=$(printf '%s' "$needle" | tr '[:upper:]' '[:lower:]')
  [[ "$hl" == *"$nl"* ]]
}

do_push() {
  if ! [[ "$DRY_RUN" =~ ^[01]$ ]]; then
    echo "错误: DRY_RUN 须为 0 或 1（当前: $DRY_RUN）" >&2
    return 1
  fi
  if ! [[ "$CONTINUE_ON_ERROR" =~ ^[01]$ ]]; then
    echo "错误: CONTINUE_ON_ERROR 须为 0 或 1（当前: $CONTINUE_ON_ERROR）" >&2
    return 1
  fi
  if ! [[ "$PUSH_INTERVAL_SEC" =~ ^[0-9]+$ ]]; then
    echo "错误: PUSH_INTERVAL_SEC 须为非负整数（当前: $PUSH_INTERVAL_SEC）" >&2
    return 1
  fi
  if [[ -z "$REGISTRY_SUBSTRING" ]]; then
    echo "错误: REGISTRY_SUBSTRING 不能为空。" >&2
    return 1
  fi

  mapfile -t img_lines < <(docker images --format '{{.Repository}}\t{{.Tag}}' 2>/dev/null || true)
  local candidates=()
  local line repo rest tag
  for line in "${img_lines[@]}"; do
    [[ -z "${line:-}" ]] && continue
    repo="${line%%$'\t'*}"
    rest="${line#*$'\t'}"
    tag="${rest%%$'\t'*}"
    [[ "$repo" == "<none>" ]] && continue
    [[ "$tag" == "<none>" ]] && continue
    [[ -z "$repo" ]] && continue
    [[ -z "$tag" ]] && continue
    if _substring_match_ci "$repo" "$REGISTRY_SUBSTRING"; then
      candidates+=("${repo}:${tag}")
    fi
  done

  echo "========================================"
  echo "按 REPOSITORY 子串筛选并 docker push"
  echo "  子串: $REGISTRY_SUBSTRING  DRY_RUN=$DRY_RUN  CONTINUE_ON_ERROR=$CONTINUE_ON_ERROR"
  echo "========================================"

  if [[ ${#candidates[@]} -eq 0 ]]; then
    echo "未找到匹配的镜像（REPOSITORY 含「$REGISTRY_SUBSTRING」且非 <none>）。"
    return 0
  fi

  printf "共 %d 条:\n" "${#candidates[@]}"
  local ref
  for ref in "${candidates[@]}"; do
    printf "  %s\n" "$ref"
  done

  if [[ "$DRY_RUN" == "1" ]]; then
    echo "DRY_RUN=1，未执行 docker push。"
    return 0
  fi

  echo ""
  echo "开始 push …"
  local failures=0 idx=0 total=${#candidates[@]} rc
  for ref in "${candidates[@]}"; do
    ((idx++)) || true
    echo ""
    echo "[$idx/$total] docker push $ref"
    set +e
    docker push "$ref"
    rc=$?
    set -e
    if [[ $rc -ne 0 ]]; then
      echo "[$idx/$total] push 失败（退出码 $rc）: $ref" >&2
      ((failures++)) || true
      if [[ "$CONTINUE_ON_ERROR" != "1" ]]; then
        return "$rc"
      fi
    else
      echo "[$idx/$total] push 成功: $ref"
    fi
    if (( PUSH_INTERVAL_SEC > 0 )) && (( idx < total )); then
      sleep "$PUSH_INTERVAL_SEC"
    fi
  done

  echo ""
  if [[ "$failures" -gt 0 ]]; then
    echo "完成，失败条数: $failures / $total" >&2
    return 1
  fi
  echo "全部 push 成功（$total 条）。"
  return 0
}

# ---------- 主流程 ----------
run_load=0
run_push=0
case "$PHASE" in
  all)
    [[ "$SKIP_LOAD" != "1" ]] && run_load=1
    [[ "$SKIP_PUSH" != "1" ]] && run_push=1
    ;;
  load) run_load=1 ;;
  push) run_push=1 ;;
  *)
    echo "错误: PHASE 须为 all、load 或 push（当前: $PHASE）" >&2
    exit 1
    ;;
esac

if [[ "$run_load" -eq 1 ]]; then
  do_load
fi
if [[ "$run_push" -eq 1 ]]; then
  do_push
fi
```
{% endraw %}

<h2 id="c-7-0-5" class="mh2">7.5 按镜像大小查看占用（辅助）</h2>

{% raw %}
```bash
docker images --format "{{.Size}}\t{{.Repository}}:{{.Tag}}" | sort -h -r
```
{% endraw %}

Windows 若无 GNU `sort -h`，可在 **Git Bash** 或 **WSL** 中执行；或 `docker system df -v` 查看空间分布。



<h2 id="c-8-0" class="mh1">八、排障速查（与全链路相关）</h2>

| 现象 | 常见原因 | 处理方向 |
|---|---|---|
| `curl` 到 GitLab **拒绝连接**（非证书报错） | 443 未监听、端口映射错误、防火墙/安全组 | 在 GitLab 宿主机查 `ss -lntp`、`docker compose ps`、本机 `curl -vk https://127.0.0.1/` |
| `x509: certificate signed by unknown authority` | 未信任自建根，或 `certs.d` 目录名与登录域名不一致 | 安装根 CA；`/etc/docker/certs.d/registry.zhst.com/ca.crt` 后重启 Docker |
| CI：`Could not resolve host: registry.zhst.com` | Job 容器无内网 DNS | Runner `extra_hosts` 增加 `registry.zhst.com:10.0.0.188` 并重启 Runner |
| `id_opt[@]: unbound variable` 等 | 用 `sh` 跑 Bash 脚本 | 使用 `bash xxx.sh`；同步脚本到最新版 |
| `unauthorized` / 404 on push | 项目名、Robot 权限、路径错误 | 与域名无关时查 Harbor 项目与账号权限 |


<h2 id="c-9-0" class="mh1">九、上线前检查表（可打印勾选用）</h2>

- [ ] DNS/hosts：`gitlab.zhst.com`、`registry.zhst.com` 指向正确，**无**已废弃的旧 Harbor 名混用（除非刻意过渡期）。  
- [ ] Harbor：`harbor.yml` 的 `hostname` 与证书 SAN、浏览器访问 URL 一致；`docker login registry.zhst.com` 成功。  
- [ ] GitLab：`docker compose config` 通过；SSH/Web 端口符合预期；`gitlab_shell_ssh_port` 与对外一致。  
- [ ] 各机 Docker：`/etc/docker/certs.d/<域名>/ca.crt` 存在且为**当前**信任链。  
- [ ] Runner：`extra_hosts`、Executor、标签与 `.gitlab-ci.yml` 一致；示例流水线能 **pull** 私库镜像。  
- [ ] GitLab：源/目标**版本已核对**；旧机已手工执行 `gitlab:backup:create`（含所需 `SKIP`）；备份包与 `gitlab-secrets.json` / `gitlab.rb` 已安全传输；新机已 `stop puma/sidekiq` 并以正确 **`BACKUP=备份ID`**（非路径）执行 `gitlab:backup:restore`，随后 `restart` 与 `gitlab:check SANITIZE=true`；Web / SSH 验证通过。  
- [ ] 单库迁移时：导出包已导入或 mirror 推送完成，默认分支与保护规则已检查。  
- [ ] 镜像：若走离线链路，旧机已跑 `docker-migrate-01-export-old-host.sh`、新机 tar 目录正确；`docker-migrate-02-import-new-host.sh` 在 `DRY_RUN=1` 下 push 列表正确，正式执行成功。


<h2 id="c-10-0" class="mh1">十、小结</h2>

GitLab 部署完成只是起点：**自建 CA 与站点证书**决定全链路 TLS 是否可信；**换机迁移 GitLab** 宜先对齐**源/目标版本**，再 **手工** `gitlab:backup:create`（按需 `SKIP` 缩小包体）、新机 **`BACKUP=备份ID`** 执行 `gitlab:backup:restore` 并做 `gitlab:check`；**镜像**靠 Harbor 域名、Docker 信任、Runner 解析与 `docker login` 打通；**离线镜像**靠本文第七节的 **`docker-migrate-01-export-old-host.sh`（旧机）** 与 **`docker-migrate-02-import-new-host.sh`（新机）** 形成 **save → scp → load → tag → push** 闭环。将域名一次性统一到 `registry.zhst.com`、证书与 `certs.d` 同步对齐，并在改 YAML 后养成 **`docker compose config`** 的习惯，可以显著减少「环境看似就绪、CI 随机失败」的隐性成本。


<hr aria-hidden="true" style=" border: 0; height: 2px; background: linear-gradient(90deg, transparent, #1bb75c, transparent); margin: 2rem 0; " />

<!-- 目录容器 -->
<div class="mi1">
    <strong>目录</strong>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
            <li style="list-style-type: none;"><a href="#c-0-0">〇、先建立心智模型</a></li>
            <li style="list-style-type: none;"><a href="#c-0-5">根 CA 与站点证书（OpenSSL）</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-0-5-1">生成根 CA</a></li>
                    <li style="list-style-type: none;"><a href="#c-0-5-2">签发 GitLab 站点证书</a></li>
                    <li style="list-style-type: none;"><a href="#c-0-5-3">签发 Harbor 站点证书</a></li>
                    <li style="list-style-type: none;"><a href="#c-0-5-4">分发 ca.crt</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-1-0">一、端到端链路总览</a></li>
            <li style="list-style-type: none;"><a href="#c-2-0">二、Harbor 域名统一</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-2-1">2.1 hosts 与旧目录清理</a></li>
                    <li style="list-style-type: none;"><a href="#c-2-2">2.2 重签 Harbor 证书</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-3-0">三、根 CA 轮换</a></li>
            <li style="list-style-type: none;"><a href="#c-4-0">四、GitLab Compose 常见坑</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-4-1">4.1 YAML expected key</a></li>
                    <li style="list-style-type: none;"><a href="#c-4-2">4.2 SSH 端口不一致</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-5-0">五、GitLab Runner</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-5-1">5.1 extra_hosts</a></li>
                    <li style="list-style-type: none;"><a href="#c-5-2">5.2 注册 linux</a></li>
                    <li style="list-style-type: none;"><a href="#c-5-3">5.3 注册 linux-shell</a></li>
                    <li style="list-style-type: none;"><a href="#c-5-4">5.4 register 参数对照</a></li>
                    <li style="list-style-type: none;"><a href="#c-5-5">5.5 Runner 磁盘</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-6-0">六、GitLab 备份迁移</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-6-0-1">6.0 版本与手工备份</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-1">6.1 源机备份</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-2">6.2 目标机准备</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-3">6.3 恢复与自检</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-4">6.4 项目导出导入</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-5">6.5 git push mirror</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-6">6.6 验证克隆</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-7-0">七、Docker 镜像离线迁移</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-7-0-0">7.0 迁移流程</a></li>
                    <li style="list-style-type: none;"><a href="#c-7-0-1">7.1 旧机环境变量</a></li>
                    <li style="list-style-type: none;"><a href="#c-7-0-2">7.2 新机环境变量</a></li>
                    <li style="list-style-type: none;"><a href="#c-7-0-3">7.3 旧机脚本全文</a></li>
                    <li style="list-style-type: none;"><a href="#c-7-0-4">7.4 新机脚本全文</a></li>
                    <li style="list-style-type: none;"><a href="#c-7-0-5">7.5 镜像大小查看</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-8-0">八、排障速查</a></li>
            <li style="list-style-type: none;"><a href="#c-9-0">九、上线前检查表</a></li>
            <li style="list-style-type: none;"><a href="#c-10-0">十、小结</a></li>
        </ul>
</div>

<style>
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
    .mh2 {
      -webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;
    }
    .mi1 {
      position: fixed; bottom: 240px; right: 10px; width: 240px; height: 240px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; overflow-y: auto; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; font-size: 14px; line-height: 1.15; color: #444; letter-spacing: 0.33px; transition: all 0.3s ease;
    }
</style>

*本文整理自内网运维记录与运维脚本实践；实施命令请以你们当前 GitLab / Harbor 版本官方文档为准。**镜像离线迁移的权威正文即第七节中两个脚本全文**；若你本地另存副本后自行修改，以你环境中实际文件为准。*

本文将随环境与 GitLab / Harbor 版本变化持续修订。
