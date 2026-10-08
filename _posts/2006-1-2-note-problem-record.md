---
layout: post
title: "问题记录：线上排查现象、结论与调整方式"
date:   2026-10-8
tags: 
  - 笔记类
comments: true
author: feng6917
---

本文收录线上/现场排查过的典型问题，每条记录包含 **时间、相关服务、现象、排查结果、调整方式**，便于后续检索与复用。

<!-- more -->

<h2 id="c-1-0" class="mh1">1. TiDB 查询未走合适索引导致耗时长</h2>

| 项 | 内容 |
|----|------|
| **记录时间** | 2026-09-02 |
| **相关服务** | preprocessresult、TiDB |

**现象：** 服务查询 TiDB 数据时响应耗时长。

**排查结果：** 未正常使用索引；SQL 自动解析/优化器选择索引时，未选中合适的索引。

**调整方式：** 在指定参数条件下，定向使用某个索引，通过 `USE INDEX` 强制指定索引。

```sql
-- 示例
SELECT ... FROM table_name USE INDEX (idx_xxx) WHERE ...;
```

<h2 id="c-2-0" class="mh1">2. searchmanager 多目标查询结果异常</h2>

| 项 | 内容 |
|----|------|
| **记录时间** | 2026-09-02 |
| **相关服务** | searchmanager |

**现象：** 多个目标查询时数据不对，且查询会立即返回；单个目标查询正常。

**排查结果：** `IN` 查询问题——多目标查询时 `IN` 列表过大导致异常。

**补充说明：**
- 大量 `IN` **只有在超过包大小限制等硬性边界时** 才会立即报错返回；
- **更多时候 MySQL 仍会执行**，只是优化器可能放弃走索引，导致全表/大范围扫描，查询 **极慢** 或超时，表现为结果不对或看似「立即返回」。

**调整方式：** 改为 **分批异步查询**，将多个目标拆成多批分别查询后合并结果，避免单次 `IN` 列表过大。

<h2 id="c-3-0" class="mh1">3. objectgroup 档案轨迹人占比异常</h2>

| 项 | 内容 |
|----|------|
| **记录时间** | 2026-09-02 |
| **相关服务** | objectgroup |

**现象：** 档案轨迹人占比数据不对（占比超出 100%），部分轨迹存在遗漏。

**排查结果：** 业务逻辑问题——
1. 每个档案存在多条轨迹，统计时 **未对轨迹去重**，导致占比累加超过 100%；
2. **未增加路人轨迹关联**，部分轨迹未被纳入统计。

**调整方式：** 修正业务统计逻辑——轨迹去重后再计算占比，并补充路人轨迹关联。

<h2 id="c-4-0" class="mh1">4. NSQ 单条消息发送失败 / gRPC 传输大小受限</h2>

| 项 | 内容 |
|----|------|
| **记录时间** | 2026-09-02 |
| **相关服务** | NSQ、相关业务服务（gRPC 通信） |

**现象：** NSQ 单条数据发送失败；业务服务间请求传输大内容时失败。

**排查结果：**
1. NSQ 默认单条消息大小限制为 **1 MB**，超出即发送失败；
2. 业务服务 gRPC 请求/响应同样有消息大小限制。

**调整方式：**

```bash
# NSQ：调大单条消息限制（nsqd 启动参数）
--max-msg-size=33364900
```

业务服务增加发送及接收配置，通过环境变量 **`MaxGrpcRecvMessageSize`** 控制 gRPC 消息大小上限。

<h2 id="c-5-0" class="mh1">5. Milvus 单台部署抢占 CPU/内存导致 load 飙升</h2>

| 项 | 内容 |
|----|------|
| **记录时间** | 2026-09-02 |
| **相关服务** | Milvus |

**现象：** 单台服务器启动 Milvus 后，CPU、内存被大量抢占，`load average` 飙升至 145 ~ 150。

**排查结果：** Milvus 与其他进程/服务资源争抢，未做资源隔离。

**调整方式：** 改为 **K8s 部署**，并为 Milvus 配置 **CPU / 内存资源限制（requests & limits）**，避免抢占整机资源。

<h2 id="c-6-0" class="mh1">6. 服务长期占用单核 CPU（for {} 空循环阻塞）</h2>

| 项 | 内容 |
|----|------|
| **记录时间** | 2026-09-02 |
| **相关服务** | preprocess（preprocessresult 等） |

**现象：** 某服务长期占用一个 CPU 核心，`top` 中该进程 CPU 占用几乎不变。

**排查结果：**

```bash
top -c -p <preprocessID>
```

定位到具体进程后，为 **常见问题**：代码中存在 `for {}` 空循环阻塞，导致单核 100% 空转。

**调整方式：** 修改服务代码，**移除空循环阻塞**（或改为带 sleep/事件驱动的正确逻辑）。

<h2 id="c-7-0" class="mh1">7. Trajectory list 卡顿</h2>

| 项 | 内容 |
|----|------|
| **记录时间** | 2026-09-03 |
| **相关服务** | trajectory |

**现象：** Trajectory list 接口响应卡顿，请求长时间无返回或极慢。

**排查结果：**

1. **并发过高，瞬间占满连接池**
   - 两批各 13 条 SQL，共 **26 路并发**
   - worker pool 为 **16**，`MaxOpenConns=30`，瞬间打满连接池

2. **无查询超时**
   - 坏连接或慢查询会 **永久挂起**
   - `stopwait()` 等不完，请求一直阻塞

3. **连接池无生命周期**
   - 未设置 `SetConnMaxLifetime`
   - K8s 网络抖动导致 `bad connection: EOF` 后，池里仍保留已断开的 TCP 连接

4. **`updateTrackPointImage` 加剧争用**
   - `Duplicate entry` 仍 `sleep * 3` 重试
   - 大量 goroutine 空等并抢连接

**调整方式：**

| 项 | 调整 |
|----|------|
| 并发 | worker pool **16 → 4**（单次最多占 4 个连接） |
| 超时 | 整体 **15s 超时**（`context.WithTimeout` + `QueryContext`），超时后主动返回，不再永久挂死 |
| 查询 | 新增 `queryTrackpoints()`，用 `QueryContext` 替代无超时的 GORM `Raw` |
| SQL | 修正 `IN (?)` 写法，改为 `IN (?,?,?)` |
| 连接池 | 见下方 `server.go` 配置 |
| 重试 | `updateTrackPointImage` 避免无意义重试（`Duplicate entry` 不再 `sleep * 3` 空等） |

**连接池配置（`server.go`）：**

```go
db.DB().SetMaxIdleConns(10)
db.DB().SetMaxOpenConns(50)              // 30 → 50
db.DB().SetConnMaxLifetime(5 * time.Minute)  // 新增，定期回收可能已断开的连接
```

<h2 id="c-8-0" class="mh1">8. SeaweedFS no free volumes left</h2>

| 项 | 内容 |
|----|------|
| **记录时间** | 2026-09-04 |
| **相关服务** | SeaweedFS（`seaweedfs-volume` StatefulSet，namespace: fileserver） |

**现象：** 写入或上传时报错 `no free volumes left`，存储不可用。

**排查结果：** Volume Server 的 volume 数量已达 `-max` 上限。`-max` 表示单台 Volume Server 最多可挂载的 volume（卷）数量，原配置为 **20000**，槽位已用完。

**调整方式：** 修改 `seaweedfs-volume` STS 启动参数，将 `-max` 从 **20000 调整为 30000**，重启 Pod 后恢复。

<h2 id="c-9-0" class="mh1">9. 早八点前页面裂图（容器时区不对）</h2>

| 项 | 内容 |
|----|------|
| **记录时间** | 2026-09-04 |
| **相关服务** | realtimeserver、store-proxy |

**现象：** 早八点前页面上出现裂图。

**排查方式：** 进入 `realtimeserver`、`store-proxy` 容器，执行 `date` 观察时间是否正确；发现 **store-proxy** 时区有误。

**调整方式：** 在 deploy 中为 `store-proxy` 挂载宿主机时区：

```yaml
volumeMounts:
  - mountPath: /etc/localtime
    name: timezone
```

<h2 id="c-10-0" class="mh1">10. 编辑 ConfigMap 时 JSON 转义格式错位（尾部多余空格）</h2>

| 项 | 内容 |
|----|------|
| **记录时间** | 2026-09-15 |
| **相关服务** | K8s ConfigMap（含 preprocess 等嵌入 JSON 配置） |

**现象：** 修改 ConfigMap 后服务解析配置异常或行为与预期不符。

**排查结果：** ConfigMap 内嵌 JSON 多为单行转义字符串（`\n`、`\"` 等）。某字段在编辑时 **尾部多了空格**，或与相邻字段 **缩进、逗号、换行转义不一致**，导致整段 JSON 结构错位。例如 `preprocess.embed.describe` 一段变成：

```
\"preprocess.embed.describe\":
    {\n      \"text\":  \"\",\n      \"value\": \"1\"\n   },       \n 
```

与同文件其他字段相比，末尾 `},` 后 **多余空格** 及 `\n` 后 **尾随空白**，破坏与其它键值对相同的格式约定。

**调整方式：**

1. 编辑 ConfigMap 时 **严格对照未改动的相邻字段**，保持相同的转义方式、逗号位置与 `\n` 换行模式。
2. 修改后 **删除字段尾部多余空格**，避免 `},       \n` 这类与模板不一致的结尾。
3. 保存前用 diff 或格式化工具核对整段 JSON 是否仍合法；必要时在本地先 `json.Unmarshal` / 在线校验再 apply。

<h2 id="c-11-0" class="mh1">11. 服务器重启进入应急模式（fstab 未用 UUID / 选项拼写错误）</h2>

| 项 | 内容 |
|----|------|
| **记录时间** | 2026-10-08 |
| **相关服务** | 系统层（`/etc/fstab` 挂载）、gitlab-186 |

**现象：** 执行 `shutdown -r now` 重启后，系统无法正常进入多用户模式，落入 **应急模式（emergency mode）**。

**排查结果：** `/etc/fstab` 中 `/data_hdd` 的挂载配置有误：

1. **未使用 UUID 挂载**，直接写死设备名 `/dev/sdd`。重启后设备名可能变化（或与预期不一致），导致挂载失败，进而阻塞开机；
2. 挂载选项拼写错误：`defautls`（少写一个 `l`），正确应为 `defaults`。

问题配置示例：

```text
#UUID="9685a7fb-e6a3-4ac8-9c2d-91d979b72a9b" /data_hdd ext4 defaults 0 0
/dev/sdd                /data_hdd               ext4    defautls        0 0
```

**调整方式：**

1. 应急模式下先 **注释掉** 有问题的 `/dev/sdd` 挂载行，确保能正常登录系统；
2. 登录后查找磁盘真实 UUID：

```bash
blkid
# 或
lsblk -f
```

3. 注释 `/dev/sdd` 设备名挂载方式，改为正确 UUID 与选项，例如：

```text
UUID="9685a7fb-e6a3-4ac8-9c2d-91d979b72a9b" /data_hdd ext4 defaults 0 0
#/dev/sdd                /data_hdd               ext4    defaults        0 0
```

4. 修改后执行 `mount -a` 验证，确认无报错再重启。

**经验：** 持久化挂载优先使用 `UUID=` / `LABEL=`，避免依赖不稳定的 `/dev/sdX` 设备名；写 `fstab` 后务必 `mount -a` 自检，选项拼写错误同样会导致开机挂载失败。

<hr aria-hidden="true" style=" border: 0; height: 2px; background: linear-gradient(90deg, transparent, #1bb75c, transparent); margin: 2rem 0; " />

<!-- 目录容器 -->
<div class="mi1">
    <strong>目录</strong>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
            <li style="list-style-type: none;"><a href="#c-1-0">1. TiDB 查询未走合适索引导致耗时长</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-2-0">2. searchmanager 多目标查询结果异常</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-3-0">3. objectgroup 档案轨迹人占比异常</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-4-0">4. NSQ 单条消息发送失败 / gRPC 传输大小受限</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-5-0">5. Milvus 单台部署抢占 CPU/内存导致 load 飙升</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-6-0">6. 服务长期占用单核 CPU（for {} 空循环阻塞）</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-7-0">7. Trajectory list 卡顿</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-8-0">8. SeaweedFS no free volumes left</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-9-0">9. 早八点前页面裂图（容器时区不对）</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-10-0">10. 编辑 ConfigMap 时 JSON 转义格式错位（尾部多余空格）</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-11-0">11. 服务器重启进入应急模式（fstab 未用 UUID / 选项拼写错误）</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
        </ul>
</div>

本笔记将持续更新，欢迎提交 Issue 和 Pull Request
