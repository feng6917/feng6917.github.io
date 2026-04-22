---
layout: post
title: "ZLMediaKit：流媒体服务部署与协议转换（RTSP/RTMP/HLS/WebRTC｜Docker Compose）"
date:   2026-4-22
tags: 
  - 软件类
comments: true
author: feng6917
---

本文是一份 **ZLMediaKit（`zlmediakit/zlmediakit:master`）部署与使用手册**，包含 Docker / Docker Compose 部署、`config.ini` 初始化、通过 API 拉取 RTSP 并输出 RTSP/RTMP/HLS/WebRTC 的常用操作，以及关键参数与优化建议。

<!-- more -->

<h2 id="c-1-0" class="mh1">一、目标与使用场景</h2>

通常将摄像头/NVR 的 **RTSP** 作为上游输入，由 ZLMediaKit 统一对外输出：

- **RTSP**：给传统播放器/平台
- **RTMP**：给直播推流/部分 CDN 场景
- **HLS**：给浏览器/点播风格播放
- **WebRTC**：低延迟播放（浏览器/移动端）

常见落地方式是：将“分散的 RTSP 上游”汇聚为“统一、可控、多协议输出”。

<h2 id="c-2-0" class="mh1">二、部署方式（Docker / Docker Compose）</h2>

<h2 id="c-2-1" class="mh2">2.1 目录规划（宿主机）</h2>

建议固定一套目录，便于备份与迁移（示例路径如下，按需调整）：

```bash
mkdir -p /root/myz/zlm/{conf,logs,media}
```

- **`conf/`**：`config.ini` 等配置
- **`logs/`**：运行日志目录
- **`media/`**：录制/转封装等输出文件目录（后续开启录制/切片会用到）

<h2 id="c-2-2" class="mh2">2.2 Docker Run（等价方式）</h2>

示例命令如下（目录按实际路径调整）：

```bash
docker run -d --name zlm --restart=always \
  --network host \
  -v /root/myz/zlm/conf/config.ini:/opt/media/conf/config.ini \
  -v /root/myz/zlm/logs:/opt/media/log \
  -v /root/myz/zlm/media:/opt/media/media \
  zlmediakit/zlmediakit:master
```

说明：

- `--network host`：**强烈建议**用于 WebRTC / RTP / 多端口协议场景，减少端口映射复杂度（但它会让容器直接使用宿主机网络栈）。
- 三个挂载路径对应容器内默认目录：`/opt/media/conf`、`/opt/media/log`、`/opt/media/media`。

<h2 id="c-2-3" class="mh2">2.3 Docker Compose（推荐）</h2>

保存为 `docker-compose.yaml`：

```yaml
version: '3.8'

services:
  zlmediakit:
    image: zlmediakit/zlmediakit:master
    container_name: zlm_myz
    restart: always
    network_mode: "host"
    # 使用 host 网络时，不需要 ports 映射；端口由 config.ini 控制
    #ports:
    #  - "11935:1935"           # RTMP
    #  - "1554:554"             # RTSP
    #  - "180:80"               # HTTP API 和 HTTP-FLV
    #  - "18000:8000/tcp"       # WebRTC TCP
    #  - "18000:8000/udp"       # WebRTC UDP
    #  - "9000:9000/udp"        # SRT (如果需要)
    #  - "10000-20000:10000-20000/udp" # RTP over UDP (如果需要)
    volumes:
      - /root/myz/zlm/conf/config.ini:/opt/media/conf/config.ini
      - /root/myz/zlm/logs:/opt/media/log
      - /root/myz/zlm/media:/opt/media/media
```

启动：

```bash
docker compose up -d
docker ps | grep -E "zlm|zlmediakit" || true
```

<h2 id="c-3-0" class="mh1">三、config.ini 初始化获取步骤（首次必做）</h2>

第一次部署时，通常先从镜像里导出一份“默认配置”到宿主机，再按需修改。

```bash
# 先启动一个临时容器（不挂载配置文件）
docker run -d --name zlm_temp zlmediakit/zlmediakit:master

# 复制默认配置到宿主机
docker cp zlm_temp:/opt/media/conf/config.ini /root/myz/zlm/conf/config.ini

# 删除临时容器
docker rm -f zlm_temp
```

之后再用第 2 章的 Compose/Run 挂载该文件启动即可。

<h2 id="c-4-0" class="mh1">四、关键端口与访问入口（以本文配置为例）</h2>

示例 `config.ini` 已将端口改成一套“避免默认冲突”的值：

- **HTTP API**：`[http].port=180`
- **RTMP**：`[rtmp].port=11935`
- **RTSP**：`[rtsp].port=1554`
- **WebRTC**：`[rtc].port=18000` 与 `[rtc].tcpPort=18000`
- **SRT**（可选）：`[srt].port=9000`
- **RTP 代理端口**（可选）：`[rtp_proxy].port=10000` 与 `port_range=30000-35000`

常用入口：

- **HTTP API**：`http://<服务器IP>:180/`
- **添加/删除拉流代理**：见第 5 章

提示：

- 启用 `network_mode: host` 后，这些端口都是 **宿主机端口**，不再经过 Docker 端口映射。
- 如果你把服务器放在 NAT/云厂商安全组后面，需要额外确认：**安全组 + 防火墙** 放行上述端口（尤其是 WebRTC/RTP 的 UDP 端口段）。

<h2 id="c-5-0" class="mh1">五、用 API 做“拉流代理”（RTSP 输入 → 多协议输出）</h2>

<h2 id="c-5-1" class="mh2">5.1 secret 获取</h2>

`secret` 位于配置文件的 `[api].secret`：

```bash
grep -i secret /root/myz/zlm/conf/config.ini
```

示例：

```text
secret=TJeKx53nt3fmhj4vP4P7ltfqzsUJ80Qs
```

<h2 id="c-5-2" class="mh2">5.2 添加代理（addStreamProxy）</h2>

示例（保持可复制粘贴）：

```bash
curl -G "http://10.0.0.7:180/index/api/addStreamProxy" \
  --data-urlencode "secret=TJeKx53nt3fmhj4vP4P7ltfqzsUJ80Qs" \
  --data-urlencode "vhost=__defaultVhost__" \
  --data-urlencode "app=gait" \
  --data-urlencode "stream=ch3" \
  --data-urlencode "url=rtsp://admin:zhst123456@10.0.2.16:554/Streaming/Channels/1" \
  --data-urlencode "enable_rtsp=1" \
  --data-urlencode "enable_rtmp=0" \
  --data-urlencode "enable_hls=0" \
  --data-urlencode "enable_mp4=0"
```

建议补充/优化点（常用、且不破坏你现有思路）：

- `**enable_hls=1**`：要浏览器可播（延迟高但兼容好）就开 HLS。
- `**enable_rtmp=1**`：要把输入转成 RTMP（给直播平台/推流）就开。
- `**enable_mp4=1**`：要“自动录制 MP4”才开（会写磁盘，注意容量与 IO）。

一般命名约定（方便管理）：

- `**app**`：业务分组（例如 `camera` / `gait` / `nvr01`）
- `**stream**`：通道号或唯一标识（例如 `ch1` / `gate_a`）

<h2 id="c-5-3" class="mh2">5.3 移除代理（delStreamProxy）</h2>

```bash
curl -G "http://10.0.0.7:180/index/api/delStreamProxy" \
  --data-urlencode "secret=TJeKx53nt3fmhj4vP4P7ltfqzsUJ80Qs" \
  --data-urlencode "key=__defaultVhost__/gait/ch3"
```

`key` 的规则通常就是：`<vhost>/<app>/<stream>`（和你 add 时的三元组对应）。

<h2 id="c-5-4" class="mh2">5.4 添加代理后怎么访问（输出 URL 规律）</h2>

当你把上游 RTSP 代理到（`vhost/app/stream`）之后，通常可以按下面规律访问（具体以你 `config.ini` 端口为准）：

- **RTSP**：`rtsp://<服务器IP>:1554/<app>/<stream>`
- **RTMP**：`rtmp://<服务器IP>:11935/<app>/<stream>`
- **HTTP-FLV**：`http://<服务器IP>:180/<app>/<stream>.flv`
- **HLS**：`http://<服务器IP>:180/<app>/<stream>/hls.m3u8`

说明：

- 上述 URL 是最常用的“心智模型”，适合排障与集成时快速验证。
- 如果你启用了 vhost（`[general].enableVhost=1`），URL 形式会随 vhost 规则变化；新手阶段建议先保持 `enableVhost=0` 跑通链路。

<h2 id="c-6-0" class="mh1">六、config.ini 关键参数说明（高频项）</h2>

下面只解释“最容易影响可用性/安全性/延迟”的参数，其它保持默认即可。

<h2 id="c-6-1" class="mh2">6.1 API 安全（[api]）</h2>

- `**secret`**：API 调用鉴权关键值
  - 建议改成强随机值
  - 不要放到公网可直接访问的 API 上（至少用防火墙/IP 白名单限制）

<h2 id="c-6-2" class="mh2">6.2 HTTP 与访问控制（[http]）</h2>

- `**port=180**`：HTTP API 与 HTTP-FLV 的服务端口
- `**allow_ip_range**`：允许访问 API 的 IP 段
  - 你当前包含了 `127.0.0.1`、`172.16/12`、`192.168/16`、`10/8` 等内网段
  - 如果你要对公网开放，建议只放行“你自己的运维出口 IP”或 VPN 网段

<h2 id="c-6-3" class="mh2">6.3 RTSP/RTMP 端口（[rtsp]/[rtmp]）</h2>

- `**[rtsp].port=1554**`：RTSP 服务端口（你已避开 554）
- `**[rtmp].port=11935**`：RTMP 服务端口（你已避开 1935）

如果宿主机上已有其它服务占用默认端口，用这种“整体偏移”的方式非常实用。

<h2 id="c-6-4" class="mh2">6.4 WebRTC（[rtc]）</h2>

- `**port` / `tcpPort**`：WebRTC 对外服务端口（你设为 `18000`）
- `**externIP**`：服务器存在 NAT/多网卡/公网 IP 与内网 IP 不一致时需要设置
  - 不设置可能导致：客户端能连上信令但媒体不通（典型：能打开页面但黑屏/无声音）
  - 如果是云服务器，常见写法：填公网 IP（或配合 STUN/TURN）

<h2 id="c-6-5" class="mh2">6.5 RTP 代理（[rtp_proxy]）</h2>

当你需要 RTP over UDP（或部分 GB28181/国标接入链路）时，会用到端口段：

- `**port=10000**`：基础端口
- `**port_range=30000-35000**`：动态端口池

注意：

- 这类端口多为 **UDP**，防火墙/安全组需要放行 **整段**，否则会出现“偶发可播/大面积丢包/时好时坏”。

<h2 id="c-6-6" class="mh2">6.6 HLS 切片保留（[hls] + [protocol]）</h2>

你配置里 HLS 相关参数（摘重点）：

- `**[protocol].enable_hls=1`**：是否启用 HLS 输出
- `**[hls].segDur=2**`：切片时长（秒），越小延迟越低，但请求/文件数量更多
- `**[hls].segNum=3**`：播放列表中保留的切片数（影响播放窗口）
- `**[hls].segRetain=5**`：切片文件额外保留数（影响磁盘占用）
- `**[hls].deleteDelaySec=10**`：切片删除延时（秒）

如果你目标是“尽量低延迟”，可优先从 `segDur`、`segNum` 下手；如果你目标是“更稳更省资源”，就适当增大 `segDur` 并控制保留数量。

<h2 id="c-6-7" class="mh2">6.7 服务器唯一标识（[general]）</h2>

- `**mediaServerId=your_server_id**`：建议改成一个**全局唯一**的值（例如 `zlm-10-0-0-7` 或 UUID 风格）
  - 多实例/集群/迁移时用于区分节点
  - 也方便你看日志和排查“到底是哪台在服务”

<h2 id="c-7-0" class="mh1">七、部署优化与建议（实战常用）</h2>

<h2 id="c-7-1" class="mh2">7.1 强烈建议：网络用 host</h2>

采用 `network_mode: "host"` 的优点是：

- WebRTC/RTP 多端口协议更稳定
- 少踩端口映射与 UDP 映射的坑

缺点是：

- 端口直接暴露在宿主机上，需要更认真地做防火墙/安全组策略

<h2 id="c-7-2" class="mh2">7.2 只给内网访问 API（避免 secret 泄露导致被控）</h2>

建议组合拳：

- `allow_ip_range` 仅放行内网/VPN
- 防火墙/安全组禁止公网访问 `180`
- `secret` 改成强随机值，并避免写到公开文档/截图里

<h2 id="c-7-3" class="mh2">7.3 日志与磁盘（长期运行必看）</h2>

如果你开启了 HLS/录制，磁盘会持续增长：

- 关注 `segRetain`、录制目录、以及宿主机磁盘告警
- 建议对 `/root/myz/zlm/logs` 做 logrotate（或挂载到有统一日志采集的目录）

<h2 id="c-8-0" class="mh1">八、常见问题排查（快速定位）</h2>

<h2 id="c-8-1" class="mh2">8.1 容器启动了但端口不通</h2>

- 检查宿主机端口监听：

```bash
ss -lntup | grep -E "(:180|:11935|:1554|:18000|:9000|:10000)" || true
```

- 检查防火墙/安全组：尤其是 **UDP 端口段**（WebRTC / RTP）。

<h2 id="c-8-2" class="mh2">8.2 addStreamProxy 成功但播放黑屏/卡顿</h2>

常见原因：

- 上游 RTSP 不稳定/认证错误/主码流过大
- WebRTC 场景未正确设置 `externIP`（NAT 环境）
- UDP 端口段未放行（媒体通道建立失败）

可以先用 RTSP/RTMP 方式验证链路是否通，再逐步切到 WebRTC。

<hr aria-hidden="true" style=" border: 0; height: 2px; background: linear-gradient(90deg, transparent, #1bb75c, transparent); margin: 2rem 0; " />

<!-- 目录容器 -->
<div class="mi1">
    <strong>目录</strong>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
            <li style="list-style-type: none;"><a href="#c-1-0">一、目标与使用场景</a></li>
            <li style="list-style-type: none;"><a href="#c-2-0">二、部署方式（Docker / Docker Compose）</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-2-1">2.1 目录规划（宿主机）</a></li>
                    <li style="list-style-type: none;"><a href="#c-2-2">2.2 Docker Run（等价方式）</a></li>
                    <li style="list-style-type: none;"><a href="#c-2-3">2.3 Docker Compose（推荐）</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-3-0">三、config.ini 初始化获取步骤（首次必做）</a></li>
            <li style="list-style-type: none;"><a href="#c-4-0">四、关键端口与访问入口（以本文配置为例）</a></li>
            <li style="list-style-type: none;"><a href="#c-5-0">五、用 API 做“拉流代理”（RTSP 输入 → 多协议输出）</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-5-1">5.1 secret 获取</a></li>
                    <li style="list-style-type: none;"><a href="#c-5-2">5.2 添加代理（addStreamProxy）</a></li>
                    <li style="list-style-type: none;"><a href="#c-5-3">5.3 移除代理（delStreamProxy）</a></li>
                    <li style="list-style-type: none;"><a href="#c-5-4">5.4 添加代理后怎么访问（输出 URL 规律）</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-6-0">六、config.ini 关键参数说明（高频项）</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-6-1">6.1 API 安全（[api]）</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-2">6.2 HTTP 与访问控制（[http]）</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-3">6.3 RTSP/RTMP 端口（[rtsp]/[rtmp]）</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-4">6.4 WebRTC（[rtc]）</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-5">6.5 RTP 代理（[rtp_proxy]）</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-6">6.6 HLS 切片保留（[hls] + [protocol]）</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-7">6.7 服务器唯一标识（[general]）</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-7-0">七、部署优化与建议（实战常用）</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-7-1">7.1 强烈建议：网络用 host</a></li>
                    <li style="list-style-type: none;"><a href="#c-7-2">7.2 只给内网访问 API</a></li>
                    <li style="list-style-type: none;"><a href="#c-7-3">7.3 日志与磁盘</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-8-0">八、常见问题排查（快速定位）</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-8-1">8.1 容器启动了但端口不通</a></li>
                    <li style="list-style-type: none;"><a href="#c-8-2">8.2 播放黑屏/卡顿</a></li>
                </ul>
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
      position: fixed; bottom: 240px; right: 10px; width: 240px; height: 220px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; overflow-y: auto; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; font-size: 14px; line-height: 1.15; color: #444; letter-spacing: 0.33px; transition: all 0.3s ease;
    }

</style>

本技术手册将持续更新，欢迎提交 Issue 和 Pull Request