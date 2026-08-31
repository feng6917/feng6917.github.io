---
layout: post
title: "知识复习"
date:   2018-8-28
permalink: /tool-interview/
tags: 
  - 工具类
comments: false
author: feng6917
---

本文档为知识复习资料，打开页面后需输入密码方可查看。

<!-- more -->

<div id="interview-gate" style="display:none">

<h2 id="c-0-0" class="mh1">一、个人</h2>

<h2 id="c-0-1" class="mh2">入职公司简介</h2>

1. **司睿杰** 内部考核系统（监理协会、从零到一），OA 项目权限（Casbin），网盘，数据分词检索 ECK
2. **亮风台** rust 薪资服务重写，mysql -> pg 迁移
3. **现在公司** 业务重构，服务治理，大模型，CICD，双网架构

<h2 id="c-0-2" class="mh2">Go 与 Python 进行比较？</h2>

- **go:**
  1. 简单
  2. 强大的标准库
  3. Golang 中的并发
  4. 编译速度
- **python:**
  1. 面向对象语言
  2. GUI编程支持
  3. 可扩展性和便携性
  4. 一种可移植和被解释的高级语言

<h2 id="c-0-3" class="mh2">框架该如何设计定义？</h2>

<details>
<summary>Ans</summary>

参考 Gin、Kratos、Spring Boot 等市面框架，框架设计通常包含以下层次：

**1. 定位与边界（针对性、倾向性）**

- 先明确框架解决什么问题：轻量 HTTP（如 Gin）、微服务工程化（如 Kratos）、企业级全家桶（如 Spring Boot）
- 不同定位决定抽象粒度：路由框架只关心请求链路；微服务框架还要管配置、通信、治理

**2. 架构定义（分层、模块划分、模块交互）**

- **分层**：常见为接入层（HTTP/gRPC）→ 业务层 → 数据层；Kratos 还区分 API / Service / Biz / Data
- **模块划分**：路由、中间件、配置、日志、依赖注入、数据访问等各司其职
- **模块交互**：通过接口 + 依赖注入（Wire）或中间件链（Handler Chain）解耦，避免业务直接耦合底层实现

**3. 三方面构成（工程落地视角）**

| 方面 | 内容 |
|------|------|
| **基础设施** | 配置管理、日志、DB/缓存/MQ 接入、HTTP/gRPC Server、统一错误码与响应格式 |
| **服务治理** | 注册发现、限流熔断、链路追踪、监控告警、健康检查 |
| **打包部署** | Docker 镜像规范、CI/CD 流水线、配置外置、多环境（dev/test/prod） |

![框架构成示意](/images/2020-3-3/30.jpg)

</details>

<h2 id="c-0-4" class="mh2">Gin：Radix Tree 与 Context</h2>

**1. Radix Tree？**

<details>
<summary>Ans</summary>

Gin 中基于**压缩前缀树**作为路由树的数据结构，对应 9 种 HTTP 方法共有 **9 棵树**。

**前缀树（Trie）**

1. 除根节点外，每个节点对应一个字符
2. 从根到某节点，路径上字符串联即为该节点对应的字符串
3. 尽可能复用公共前缀，如无必要不分配新节点

**压缩前缀树（Radix Tree / 基数树）**

对前缀树的改良，主要优化空间：若某子节点是父节点唯一子节点，且不存在以父节点结尾的情况，则将父节点与子节点合并。

**补偿策略**

节点路径下挂载子节点越多，认为该节点被索引概率越大，优先级越高，优先放在左边。

**为什么不使用 map？**

1. map 适合精确一对一查询，不适合模糊匹配、`*` 匹配；radix tree 更适合前缀匹配
2. map 查询与数据量有关，数据量大越慢；radix tree 与路径长度有关，与路由总量关系不大
3. 路径基于公共前缀分组，可针对前缀做中间件特殊处理；路由组与树形结构更契合

**节点字段**

| 字段 | 说明 |
|------|------|
| `path` | 节点相对路径，拼接 RouterGroup 的 `basePath` 得完整路由 path |
| `indices` | 各子节点 path 首字母组成的字符串，用于定位子节点 |
| `priority` | 途径本节点的路由数量，反映检索优先级 |
| `children` | 子节点集合 |
| `handlers` | 匹配到该路由的处理器链 |
| `fullPath` | 完整路径（basePath + path） |
| `wildChild` | 是否存在通配子节点 |
| `nType` | 节点类型：普通 / 参数 / 通配等 |

![Radix Tree 节点结构](/images/2020-3-3/31.jpg)

</details>

**2. Context？**

<details>
<summary>Ans</summary>

`gin.Context` 对应一次 HTTP 请求，贯穿整条 **Handler Chain** 调用链路的上下文。

**sync.Pool 复用**

- 请求到达时从 pool 获取 Context，池空则 `pool.New` 新建
- 请求处理完毕归还 pool，等待复用
- sync.Pool 更像回收站：逻辑上已删除，物理上仍可存活两轮 GC，期间可被复用

![Context 对象池](/images/2020-3-3/32.jpg)

**核心字段**

| 字段 | 说明 |
|------|------|
| `Request` / `Writer` | HTTP 请求与响应读写入口 |
| `handlers` | 本次请求对应的处理函数链 |
| `index` | 当前处理进度（Handler Chain 索引位置） |
| `engine` | 当前请求对应的路由引擎 |
| `mu` | 保护 map 的读写互斥锁 |
| `keys` | handlers 链上共享数据的 map |

</details>

<h2 id="c-0-5" class="mh2">Casbin 与 Open Policy Agent（OPA）是什么？</h2>

<details>
<summary>Ans</summary>

**Casbin 是什么？**

Casbin 是一个开源的**访问控制库**（不是独立服务），嵌入业务代码中做**授权（Authorization）**判断。

- 核心模型：**Subject（谁）+ Object（资源）+ Action（操作）**
- 支持多种访问模型：**ACL、RBAC、ABAC、RESTful** 等
- 策略与模型分离：通过 `.conf` 定义模型，通过 CSV / DB 存储策略
- 典型用法：用户请求接口 → 业务代码调用 `Enforce(sub, obj, act)` → 返回 allow / deny
- **适用场景**：应用内权限控制（如 OA 系统的用户、角色、菜单、表单权限），你在司睿杰项目中用过

**Open Policy Agent（OPA）是什么？**

OPA 是 CNCF 的通用**策略引擎**，用 **Rego** 语言编写策略，与应用解耦，统一做「该不该允许」的决策。

- 策略即代码（Policy as Code），与应用逻辑分离
- 输入 JSON 上下文 → OPA 评估 Rego 策略 → 输出 allow / deny
- **适用场景**：K8s 准入控制、Service Mesh、微服务 API 鉴权、CI/CD 流水线策略、基础设施合规检查

**两者对比（面试常问）**

| | Casbin | OPA |
|---|--------|-----|
| 形态 | 嵌入应用的库 | 独立策略引擎（可 sidecar / 集中部署） |
| 策略语言 | `.conf` + CSV/DB | Rego |
| 侧重点 | 应用层 RBAC/ABAC | 通用策略决策，云原生场景多 |
| 集成方式 | 代码内 `Enforce()` | HTTP/gRPC 查询 OPA，或 WASM 嵌入 |

</details>

<h2 id="c-0-6" class="mh2">微服务是什么？</h2>

<details>
<summary>Ans</summary>

**定义**

微服务是一种以**业务边界**为切割线，用**网络通信**代替进程内调用，牺牲部分**即时一致性**来换取**研发灵活性、高可用性和可扩展性**的架构模式。

也可表述为：将单个应用拆为一组小型服务，每个服务独立进程运行，通过轻量机制（通常 **HTTP REST / gRPC**）通信，围绕业务能力构建，可独立部署、独立扩展，各服务可用不同语言与不同数据库。

**特点**

1. 一种架构思想，企业演进的自然结果，**没有银弹**
2. 围绕业务能力拆分，**小而精、高内聚、低耦合**
3. 服务间**网络调用**（替代本地方法调用），需考虑超时、重试、熔断、限流
4. 各服务**独立开发、独立部署、独立扩缩容**，技术栈可异构
5. **自动化部署、持续发版**；治理侧需注册发现、配置中心、链路追踪等配套

**与单体对比（简要）**

| | 单体 | 微服务 |
|---|------|--------|
| 通信 | 进程内调用 | 网络调用（HTTP/gRPC） |
| 一致性 | 本地事务易保证 | 分布式事务 / 最终一致性 |
| 扩展 | 整体扩容 | 按服务独立扩容 |
| 复杂度 | 开发简单，后期臃肿 | 研发灵活，运维与治理成本高 |

![微服务架构](/images/2020-3-3/56.jpg)

</details>

<h2 id="c-0-7" class="mh2">链路追踪（OpenTracing）</h2>

<details>
<summary>Ans</summary>

运行时记录服务之间的调用过程，通过可视化 UI 帮助运维人员快速定位出错点。

**何时需要**

少量服务不必 trace（增加复杂度与开销）；**服务数量多、调用链长**时 trace 价值明显。

**基本元素**

| 元素 | 说明 |
|------|------|
| `TraceId` | 全局唯一，标识一次完整请求 |
| `SpanId` | 全局唯一，标识请求内的一个步骤 |
| `ParentId` | 父节点 SpanId，用于串联调用树 |

**大体流程**

1. **创建 Trace**：请求到达入口时创建 Trace，由 TraceId 标识
2. **创建 Span**：每个步骤创建 Span，含 SpanId 与 ParentId
3. **记录信息**：记录开始/结束时间、耗时、错误信息等
4. **发送数据**：请求完成后将 Trace 数据发送到追踪系统（如 Jaeger Collector）
5. **查看数据**：通过 Web UI 查看调用路径、各步骤耗时与错误

**Jaeger 常见参数配置**

1. 采样策略：全量 / 按概率 / 按速率
2. 发送到 Collector 的频率（默认 1 秒）
3. 发送前队列大小（默认 1000，满则丢弃新数据）
4. 数据包最大大小（默认 4096 字节，超出则分包）

**具体使用**

1. HTTP/gRPC 集成中间件，数据库中间件
2. 采集点：跨进程调用处、代码埋点（`span.start` / `span.end`）

</details>

<h2 id="c-0-8" class="mh2">服务熔断、降级与限流</h2>

**1. 服务熔断与降级**

<details>
<summary>Ans</summary>

![熔断示意](/images/2020-3-3/42.jpg)

**熔断**：服务异常超过一定时间、次数或失败比例时，**不再调用下游**，直接返回错误（可配合降级）。暂停一段时间后周期性探测，直到服务恢复。

**降级**（两个维度）：

- **小降级**：熔断后返回错误、返回默认值，或调用次级服务
- **大降级**：业务允许时，高峰期为保障核心服务，关闭或缩减非核心服务

**Hystrix 熔断三种状态**

| 状态 | 说明 |
|------|------|
| **Closed（关闭）** | 正常调用；计数器记录失败率，窗口内超过阈值 → 切 Open；时间窗口重置防偶发误熔断 |
| **Open（打开）** | 请求立即失败；超时后切 Half-Open，或定时探测下游是否恢复 |
| **Half-Open（半开）** | 放行少量探测请求；成功 → Closed 并重置计数；仍失败 → Open，防止恢复中被打垮 |

</details>

**2. 服务限流**

<details>
<summary>Ans</summary>

**常见场景**：突发流量（如双十一）、恶意攻击、业务自身容量上限。

**1）计数器限流**

维护时间窗口内请求计数，超限则拒绝。实现简单，但窗口重置时无法平滑处理突发。

![计数器限流](/images/2020-3-3/68.jpg)

**2）滑动窗口限流**

将窗口切分为多个小段，逐段计数，可更好应对短时突发。

![滑动窗口](/images/2020-3-3/69.jpg)

**3）漏桶算法**

请求入队，按固定速率流出；队列满则拒绝。**无法应对突发**（平滑输出）。

![漏桶](/images/2020-3-3/70.jpg)

**4）令牌桶算法**

以固定速率向桶中放令牌，请求取令牌，无令牌则拒绝。**可应对突发**（桶内有余量时）。

![令牌桶](/images/2020-3-3/71.jpg)

**Go 插件示例**：`github.com/juju/ratelimit`（令牌桶）

</details>

<h2 id="c-1-0" class="mh1">二、Docker & K8s</h2>

<h2 id="c-1-1" class="mh2">1. Docker</h2>

**1. 什么是 Docker、容器、镜像？**

<details>
<summary>Ans</summary>

Docker 是一个开源的应用容器引擎，让开发者可以打包他们的应用以及依赖包到一个可移植的容器中，然后发布到任何流行的 Linux 机器上，也可以实现虚拟化。容器是完全使用沙箱机制，相互之间不会有任何接口。

容器技术是轻量级的虚拟化技术，容器之间共享宿主机的内核，容器之间相互隔离，每个容器有自己的文件系统，容器之间进程相互隔离，互不影响。

镜像是一种轻量级、可执行的独立软件包，用来打包软件运行环境和基于运行环境开发的软件，它包含运行某个软件所需的所有内容，包括代码、运行时、库、环境变量和配置文件。

</details>

**2. Docker 镜像应该遵循哪些原则？**

<details>
<summary>Ans</summary>

整体上，尽量保持镜像**功能明确**、**内容精简**：

1. 尽量选取满足需求但**较小的基础系统镜像**
2. 清理编译生成文件、安装包缓存等**临时文件**
3. 安装软件时**指定准确版本号**，避免引入不必要依赖
4. 从安全角度考虑，应用尽量**使用系统库和依赖**
5. 使用 Dockerfile 构建时，添加 **`.dockerignore`** 或使用干净的工作目录
6. 合理**分层**，将变化频率低的层放前面，提高构建缓存命中率
7. 生产镜像避免包含调试工具、源码、密钥等敏感信息

</details>

**3. 如何更改 Docker 的默认存储路径？**

<details>
<summary>Ans</summary>

修改配置文件：

- Linux：`/etc/docker/daemon.json`
- Windows：`C:\ProgramData\Docker\config\daemon.json`

示例：

```json
{
  "data-root": "/data/docker"
}
```

也可使用软链接迁移已有数据目录。

</details>

<h2 id="c-1-2" class="mh2">2. Kubernetes</h2>

**1. 容器化开发的好处？**

<details>
<summary>Ans</summary>

1. 共享宿主机资源，利用率更高
2. 一次构建，到处运行，可移植性强
3. 秒级启动，便于弹性伸缩
4. 契合 DevOps，缩短交付与运维周期

</details>

**2. 容器化开发流程？**

<details>
<summary>Ans</summary>

1. 搭建容器化平台，构建自动化运维基础设施
2. 构建服务环境镜像，集成基本开发环境
3. 服务持续开发及服务运维插件集成（监控、日志、链路追踪等）

</details>

**3. 容器化 / K8s 部署常见问题？**

<details>
<summary>Ans</summary>

1. 调用链路过长，问题定位困难
2. 数据持久化与挂载配置不当导致数据丢失
3. 镜像过大、启动慢，资源 limits/requests 配置不合理
4. 网络策略、Service/Ingress 配置错误导致服务不可达

</details>

**4. Deployment、StatefulSet、DaemonSet 区别？**

<details>
<summary>Ans</summary>

| | **Deployment（deploy）** | **StatefulSet（sts）** | **DaemonSet（ds）** |
|---|--------------------------|-------------------------|----------------------|
| **适用场景** | 无状态应用（Web API、业务服务） | 有状态应用（MySQL、Redis、MQ） | 每个节点跑一份（日志、监控、CNI、节点 Agent） |
| **Pod 名称** | 随机（`xxx-7d8f9`） | 稳定有序（`mysql-0`、`mysql-1`） | 通常随节点，名称含节点信息 |
| **网络标识** | 无固定身份，靠 Service 负载均衡 | 固定身份，配合 Headless Service | 一般不需要对外 Service |
| **存储** | 通常共享或无持久化 | 每 Pod 独立 PVC，删 Pod 数据保留 | 可选 hostPath / 本地盘 |
| **扩缩容** | 并行、无序 | **有序**（0→1→2 顺序创建/删除） | 随节点自动增减，不由 replicas 横向扩 |
| **更新策略** | RollingUpdate / Recreate | 有序滚动更新 | RollingUpdate |
| **典型例子** | 蜂鸟业务服务、API 网关 | TiDB、Kafka、ZooKeeper | node-exporter、fluentd、Calico |

**选型口诀**

- 无状态、可随意替换 → **Deployment**
- 要稳定 hostname、有序启停、独立存储 → **StatefulSet**
- 每个节点都要跑一个 → **DaemonSet**

</details>

<hr aria-hidden="true" style=" border: 0; height: 2px; background: linear-gradient(90deg, transparent, #1bb75c, transparent); margin: 2rem 0; " />

<div class="mi1">
    <strong>目录</strong>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
            <li style="list-style-type: none;"><a href="#c-0-0">一、个人</a></li>
            <li style="list-style-type: none;"><a href="#c-0-1">入职公司简介</a></li>
            <li style="list-style-type: none;"><a href="#c-0-2">Go 与 Python 进行比较？</a></li>
            <li style="list-style-type: none;"><a href="#c-0-3">框架该如何设计定义？</a></li>
            <li style="list-style-type: none;"><a href="#c-0-4">Gin：Radix Tree 与 Context</a></li>
            <li style="list-style-type: none;"><a href="#c-0-5">Casbin 与 OPA 是什么？</a></li>
            <li style="list-style-type: none;"><a href="#c-0-6">微服务是什么？</a></li>
            <li style="list-style-type: none;"><a href="#c-0-7">链路追踪（OpenTracing）</a></li>
            <li style="list-style-type: none;"><a href="#c-0-8">服务熔断、降级与限流</a></li>
            <li style="list-style-type: none;"><a href="#c-1-0">二、Docker & K8s</a></li>
            <li style="list-style-type: none;"><a href="#c-1-1">1. Docker</a></li>
            <li style="list-style-type: none;"><a href="#c-1-2">2. Kubernetes</a></li>
        </ul>
</div>

</div>

<script>
(function () {
  var STORAGE_KEY = 'tool-interview-unlocked';
  var PASSWORD = 'myz17521';
  var gate = document.getElementById('interview-gate');

  function unlock() {
    if (gate) gate.style.display = 'block';
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
  }

  function deny() {
    alert('三次机会已用完，即将返回上一页！');
    history.go(-1);
  }

  if (gate && sessionStorage.getItem(STORAGE_KEY) === '1') {
    unlock();
    return;
  }

  var attempts = 0;
  var pass = prompt('请输入访问密码：', '');

  while (attempts < 3) {
    if (!pass) {
      history.go(-1);
      return;
    }
    if (pass === PASSWORD) {
      unlock();
      return;
    }
    attempts += 1;
    if (attempts === 1) {
      pass = prompt('密码错误，还剩两次机会。');
    } else if (attempts === 2) {
      pass = prompt('密码错误，还剩一次机会。');
    }
  }

  if (pass !== PASSWORD && attempts === 3) {
    deny();
  }
})();
</script>
