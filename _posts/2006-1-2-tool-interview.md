---
layout: post
title: "知识复习"
date:   2018-8-28
tags: 
  - 工具类
comments: false
author: feng6917
protected: true
access_password: myz
---

本文档为知识复习资料，打开页面后需输入密码方可查看。

<!-- more -->

<h2 id="c-1-0" class="mh1">一、个人</h2>

<h2 id="c-1-1" class="mh1">入职公司简介</h2>

<h3 id="c-1-1-1" class="mh2">1. 司睿杰</h3>

内部考核系统（监理协会、从零到一），OA 项目权限（Casbin），网盘，数据分词检索 ECK

<h3 id="c-1-1-2" class="mh2">2. 亮风台</h3>

rust 薪资服务重写，mysql -> pg 迁移

<h3 id="c-1-1-3" class="mh2">3. 现在公司</h3>

业务重构，服务治理，大模型，CICD，双网架构

<h2 id="c-1-2" class="mh1">Go 与 Python 进行比较？</h2>

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

<h2 id="c-1-3" class="mh1">框架该如何设计定义？</h2>

参考 Gin、Kratos、Spring Boot 等市面框架，框架设计通常包含以下层次：

<h3 id="c-1-3-1" class="mh2">1. 定位与边界（针对性、倾向性）</h3>

- 先明确框架解决什么问题：轻量 HTTP（如 Gin）、微服务工程化（如 Kratos）、企业级全家桶（如 Spring Boot）
- 不同定位决定抽象粒度：路由框架只关心请求链路；微服务框架还要管配置、通信、治理

<h3 id="c-1-3-2" class="mh2">2. 架构定义（分层、模块划分、模块交互）</h3>

- **分层**：常见为接入层（HTTP/gRPC）→ 业务层 → 数据层；Kratos 还区分 API / Service / Biz / Data
- **模块划分**：路由、中间件、配置、日志、依赖注入、数据访问等各司其职
- **模块交互**：通过接口 + 依赖注入（Wire）或中间件链（Handler Chain）解耦，避免业务直接耦合底层实现

<h3 id="c-1-3-3" class="mh2">3. 三方面构成（工程落地视角）</h3>


| 方面       | 内容                                              |
| -------- | ----------------------------------------------- |
| **基础设施** | 配置管理、日志、DB/缓存/MQ 接入、HTTP/gRPC Server、统一错误码与响应格式 |
| **服务治理** | 注册发现、限流熔断、链路追踪、监控告警、健康检查                        |
| **打包部署** | Docker 镜像规范、CI/CD 流水线、配置外置、多环境（dev/test/prod）   |


img

<h2 id="c-1-4" class="mh1">Gin：Radix Tree 与 Context</h2>

<h3 id="c-1-4-1" class="mh2">1. Radix Tree</h3>

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


| 字段          | 说明                                            |
| ----------- | --------------------------------------------- |
| `path`      | 节点相对路径，拼接 RouterGroup 的 `basePath` 得完整路由 path |
| `indices`   | 各子节点 path 首字母组成的字符串，用于定位子节点                   |
| `priority`  | 途径本节点的路由数量，反映检索优先级                            |
| `children`  | 子节点集合                                         |
| `handlers`  | 匹配到该路由的处理器链                                   |
| `fullPath`  | 完整路径（basePath + path）                         |
| `wildChild` | 是否存在通配子节点                                     |
| `nType`     | 节点类型：普通 / 参数 / 通配等                            |


img

<h3 id="c-1-4-2" class="mh2">2. Context</h3>

`gin.Context` 对应一次 HTTP 请求，贯穿整条 **Handler Chain** 调用链路的上下文。

**sync.Pool 复用**

- 请求到达时从 pool 获取 Context，池空则 `pool.New` 新建
- 请求处理完毕归还 pool，等待复用
- sync.Pool 更像回收站：逻辑上已删除，物理上仍可存活两轮 GC，期间可被复用

img

**核心字段**


| 字段                   | 说明                         |
| -------------------- | -------------------------- |
| `Request` / `Writer` | HTTP 请求与响应读写入口             |
| `handlers`           | 本次请求对应的处理函数链               |
| `index`              | 当前处理进度（Handler Chain 索引位置） |
| `engine`             | 当前请求对应的路由引擎                |
| `mu`                 | 保护 map 的读写互斥锁              |
| `keys`               | handlers 链上共享数据的 map       |


<h2 id="c-1-5" class="mh1">Casbin 与 Open Policy Agent（OPA）是什么？</h2>

**Casbin 是什么？**

Casbin 是一个开源的**访问控制库**（不是独立服务），嵌入业务代码中做**授权（Authorization）**判断。

- 核心模型：**Subject（谁）+ Object（资源）+ Action（操作）**
- 支持多种访问模型：**ACL、RBAC、ABAC、RESTful** 等
- 策略与模型分离：通过 `.conf` 定义模型，通过 CSV / DB 存储策略
- 典型用法：用户请求接口 → 业务代码调用 `Enforce(sub, obj, act)` → 返回 allow / deny
- **适用场景**：应用内权限控制（如 OA 系统的用户、角色、菜单、表单权限），你在司睿杰项目中用过
- **表单权限（简）**：分表单级 + 字段级两层。`sub` 用 user/role（`g` 继承）；`obj` 用 `form:leave`（整表）、`form:leave/field:days`（字段）；`act` 表单用 read/create/submit/approve，字段用 visible/editable。后端每个接口 `Enforce`，写字段逐字段校验 editable；前端只管隐藏/只读。配置存 DB 后同步为 p 规则；字段少可 JSON 冗余，字段多单独建字段权限表

**Open Policy Agent（OPA）是什么？**

OPA 是 CNCF 的通用**策略引擎**，用 **Rego** 语言编写策略，与应用解耦，统一做「该不该允许」的决策。

- 策略即代码（Policy as Code），与应用逻辑分离
- 输入 JSON 上下文 → OPA 评估 Rego 策略 → 输出 allow / deny
- **适用场景**：K8s 准入控制、Service Mesh、微服务 API 鉴权、CI/CD 流水线策略、基础设施合规检查

**两者对比（面试常问）**


|      | Casbin           | OPA                        |
| ---- | ---------------- | -------------------------- |
| 形态   | 嵌入应用的库           | 独立策略引擎（可 sidecar / 集中部署）   |
| 策略语言 | `.conf` + CSV/DB | Rego                       |
| 侧重点  | 应用层 RBAC/ABAC    | 通用策略决策，云原生场景多              |
| 集成方式 | 代码内 `Enforce()`  | HTTP/gRPC 查询 OPA，或 WASM 嵌入 |


<h2 id="c-1-6" class="mh1">微服务是什么？</h2>

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


|     | 单体        | 微服务             |
| --- | --------- | --------------- |
| 通信  | 进程内调用     | 网络调用（HTTP/gRPC） |
| 一致性 | 本地事务易保证   | 分布式事务 / 最终一致性   |
| 扩展  | 整体扩容      | 按服务独立扩容         |
| 复杂度 | 开发简单，后期臃肿 | 研发灵活，运维与治理成本高   |


img

<h2 id="c-1-7" class="mh1">链路追踪（OpenTracing）</h2>

运行时记录服务之间的调用过程，通过可视化 UI 帮助运维人员快速定位出错点。

**何时需要**

少量服务不必 trace（增加复杂度与开销）；**服务数量多、调用链长**时 trace 价值明显。

**基本元素**


| 元素         | 说明                 |
| ---------- | ------------------ |
| `TraceId`  | 全局唯一，标识一次完整请求      |
| `SpanId`   | 全局唯一，标识请求内的一个步骤    |
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

<h2 id="c-1-8" class="mh1">服务熔断、降级与限流</h2>

<h3 id="c-1-8-1" class="mh2">1. 服务熔断与降级</h3>

img

**熔断**：服务异常超过一定时间、次数或失败比例时，**不再调用下游**，直接返回错误（可配合降级）。暂停一段时间后周期性探测，直到服务恢复。

**降级**（两个维度）：

- **小降级**：熔断后返回错误、返回默认值，或调用次级服务
- **大降级**：业务允许时，高峰期为保障核心服务，关闭或缩减非核心服务

**Hystrix 熔断三种状态**


| 状态                | 说明                                             |
| ----------------- | ---------------------------------------------- |
| **Closed（关闭）**    | 正常调用；计数器记录失败率，窗口内超过阈值 → 切 Open；时间窗口重置防偶发误熔断    |
| **Open（打开）**      | 请求立即失败；超时后切 Half-Open，或定时探测下游是否恢复              |
| **Half-Open（半开）** | 放行少量探测请求；成功 → Closed 并重置计数；仍失败 → Open，防止恢复中被打垮 |


<h3 id="c-1-8-2" class="mh2">2. 服务限流</h3>

**常见场景**：突发流量（如双十一）、恶意攻击、业务自身容量上限。

**1）计数器限流**

维护时间窗口内请求计数，超限则拒绝。实现简单，但窗口重置时无法平滑处理突发。

img

**2）滑动窗口限流**

将窗口切分为多个小段，逐段计数，可更好应对短时突发。

img

**3）漏桶算法**

请求入队，按固定速率流出；队列满则拒绝。**无法应对突发**（平滑输出）。

img

**4）令牌桶算法**

以固定速率向桶中放令牌，请求取令牌，无令牌则拒绝。**可应对突发**（桶内有余量时）。

img

**Go 插件示例**：`github.com/juju/ratelimit`（令牌桶）

<h2 id="c-2-0" class="mh1">二、Docker & K8s</h2>

<h2 id="c-2-1" class="mh1">Docker</h2>

<h3 id="c-2-1-1" class="mh2">1. 什么是 Docker、容器、镜像？</h3>

Docker 是一个开源的应用容器引擎，让开发者可以打包他们的应用以及依赖包到一个可移植的容器中，然后发布到任何流行的 Linux 机器上，也可以实现虚拟化。容器是完全使用沙箱机制，相互之间不会有任何接口。

容器技术是轻量级的虚拟化技术，容器之间共享宿主机的内核，容器之间相互隔离，每个容器有自己的文件系统，容器之间进程相互隔离，互不影响。

镜像是一种轻量级、可执行的独立软件包，用来打包软件运行环境和基于运行环境开发的软件，它包含运行某个软件所需的所有内容，包括代码、运行时、库、环境变量和配置文件。

<h3 id="c-2-1-2" class="mh2">2. Docker 镜像应该遵循哪些原则？</h3>

整体上，尽量保持镜像**功能明确**、**内容精简**：

1. 尽量选取满足需求但**较小的基础系统镜像**
2. 清理编译生成文件、安装包缓存等**临时文件**
3. 安装软件时**指定准确版本号**，避免引入不必要依赖
4. 从安全角度考虑，应用尽量**使用系统库和依赖**
5. 使用 Dockerfile 构建时，添加 `**.dockerignore**` 或使用干净的工作目录
6. 合理**分层**，将变化频率低的层放前面，提高构建缓存命中率
7. 生产镜像避免包含调试工具、源码、密钥等敏感信息

<h3 id="c-2-1-3" class="mh2">3. 如何更改 Docker 的默认存储路径？</h3>

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

<h2 id="c-2-2" class="mh1">Kubernetes</h2>

<h3 id="c-2-2-1" class="mh2">1. 容器化开发的好处？</h3>

1. 共享宿主机资源，利用率更高
2. 一次构建，到处运行，可移植性强
3. 秒级启动，便于弹性伸缩
4. 契合 DevOps，缩短交付与运维周期

<h3 id="c-2-2-2" class="mh2">2. 容器化开发流程？</h3>

1. 搭建容器化平台，构建自动化运维基础设施
2. 构建服务环境镜像，集成基本开发环境
3. 服务持续开发及服务运维插件集成（监控、日志、链路追踪等）

<h3 id="c-2-2-3" class="mh2">3. 容器化 / K8s 部署常见问题？</h3>

1. 调用链路过长，问题定位困难
2. 数据持久化与挂载配置不当导致数据丢失
3. 镜像过大、启动慢，资源 limits/requests 配置不合理
4. 网络策略、Service/Ingress 配置错误导致服务不可达

<h3 id="c-2-2-4" class="mh2">4. Deployment、StatefulSet、DaemonSet 区别？</h3>


|            | **Deployment（deploy）**   | **StatefulSet（sts）**      | **DaemonSet（ds）**            |
| ---------- | ------------------------ | ------------------------- | ---------------------------- |
| **适用场景**   | 无状态应用（Web API、业务服务）      | 有状态应用（MySQL、Redis、MQ）     | 每个节点跑一份（日志、监控、CNI、节点 Agent）  |
| **Pod 名称** | 随机（`xxx-7d8f9`）          | 稳定有序（`mysql-0`、`mysql-1`） | 通常随节点，名称含节点信息                |
| **网络标识**   | 无固定身份，靠 Service 负载均衡     | 固定身份，配合 Headless Service  | 一般不需要对外 Service              |
| **存储**     | 通常共享或无持久化                | 每 Pod 独立 PVC，删 Pod 数据保留   | 可选 hostPath / 本地盘            |
| **扩缩容**    | 并行、无序                    | **有序**（0→1→2 顺序创建/删除）     | 随节点自动增减，不由 replicas 横向扩      |
| **更新策略**   | RollingUpdate / Recreate | 有序滚动更新                    | RollingUpdate                |
| **典型例子**   | 蜂鸟业务服务、API 网关            | TiDB、Kafka、ZooKeeper      | node-exporter、fluentd、Calico |


**选型口诀**

- 无状态、可随意替换 → **Deployment**
- 要稳定 hostname、有序启停、独立存储 → **StatefulSet**
- 每个节点都要跑一个 → **DaemonSet**

<h2 id="c-3-0" class="mh1">三、AI</h2>

<h2 id="c-3-1" class="mh1">RAG（Retrieval-Augmented Generation）</h2>

**RAG** = 检索外部知识 + LLM 生成

```
用户问题 → 检索相关文档 → 拼进 Prompt → LLM 生成答案
```

**目的**：减少幻觉，接入私有/最新知识，不依赖微调。

<h3 id="c-3-1-1" class="mh2">1. 基础流程（Naive RAG）</h3>

```
Indexing（离线索引）          在线查询
文档 → 分块 → 向量化 → 向量库
                               ↓
用户 Query → 向量检索 Top-K → LLM 生成
```

**痛点**：查询理解浅、检索噪声大、复杂问题效果差。

<h3 id="c-3-1-2" class="mh2">2. 三代演进</h3>


| 范式               | 核心         | 流程                                                   |
| ---------------- | ---------- | ---------------------------------------------------- |
| **Naive RAG**    | 查一次、答一次    | Index → Retrieve → Generate                          |
| **Advanced RAG** | 优化检索前后     | Pre-Retrieval → Retrieve → Post-Retrieval → Generate |
| **Modular RAG**  | 模块化 + 动态编排 | 6 大模块 + Orchestration，支持分支/循环                        |


继承关系：**Naive ⊂ Advanced ⊂ Modular**

<h3 id="c-3-1-3" class="mh2">3. Advanced RAG 关键点</h3>


| 阶段                 | 手段                                   | 作用            |
| ------------------ | ------------------------------------ | ------------- |
| **Pre-Retrieval**  | Rewrite、HyDE、Multi-Query、Text-to-SQL | 提升召回、改写 query |
| **Retrieval**      | BM25 + 向量混合、领域微调                     | 检索更准          |
| **Post-Retrieval** | Rerank、压缩、过滤                         | 去噪、控上下文长度     |
| **Generation**     | 微调、答案验证                              | 降低幻觉          |


**特点**：固定线性流水线，所有 query 走同一路径。

<h3 id="c-3-1-4" class="mh2">4. Modular RAG 关键点</h3>

**三层架构**


| 层级                | 说明      | 示例                                                                                 |
| ----------------- | ------- | ---------------------------------------------------------------------------------- |
| **L1 Module**     | 六大模块    | Indexing / Pre-Retrieval / Retrieval / Post-Retrieval / Generation / Orchestration |
| **L2 Sub-Module** | 子能力     | Query Expansion、Rerank、Routing                                                     |
| **L3 Operator**   | 最小可替换单元 | HyDE、Rewrite、f_r 路由…                                                               |


**Orchestration（核心差异）**


| 能力             | 作用                 |
| -------------- | ------------------ |
| **Routing**    | 按 query 类型选不同 Flow |
| **Scheduling** | 决定何时检索、何时停止        |
| **Fusion**     | 合并多分支结果（RRF 等）     |


**四种 Flow Pattern**


| 模式              | 形态      | 场景                 |
| --------------- | ------- | ------------------ |
| **Linear**      | A→B→C→D | 等同 Advanced RAG    |
| **Conditional** | 路由分支    | 不同问题类型不同策略         |
| **Branching**   | 并行多路    | Multi-Query、REPLUG |
| **Loop**        | 检索⇄生成循环 | Self-RAG、多跳 QA     |


<h3 id="c-3-1-5" class="mh2">5. 常见命名模式（速查）</h3>


| 模式              | 一句话                    |
| --------------- | ---------------------- |
| **Self-RAG**    | 模型自主决定要不要检索、结果是否可信     |
| **CRAG**        | 检索结果差则丢弃，改走 Web Search |
| **Agentic RAG** | Agent 多步规划、按需检索        |
| **GraphRAG**    | 基于知识图谱做关系/多跳检索         |


<h2 id="c-3-2" class="mh1">LangChain</h2>

**LangChain** = 构建 LLM 应用的开源框架

把 Model、Prompt、Tool、Retriever 等组件标准化、可组合，减少从零拼 API 的样板代码。

**官方核心公式**：`Agent = Model + Harness`


| 部分          | 含义                                 |
| ----------- | ---------------------------------- |
| **Model**   | 大模型本身                              |
| **Harness** | Prompt、Tools、Middleware 等围绕模型循环的外壳 |


**如何理解**


| 类比                  | 含义        |
| ------------------- | --------- |
| **乐高积木**            | 组件可插拔、可组合 |
| **Express for LLM** | 提供统一抽象层   |


**核心组件**


| 组件             | 作用                                     |
| -------------- | -------------------------------------- |
| **Models**     | 统一 LLM / Embedding 接口（OpenAI、Ollama 等） |
| **Prompts**    | 模板化提示词                                 |
| **Tools**      | 模型可调用的函数/API                           |
| **Retrievers** | 向量检索（RAG）                              |
| **Agents**     | 模型 + 工具循环，直到任务完成                       |
| **LCEL**       | 用 `                                    |


**生态关系**

```
Deep Agents  →  开箱即用（规划、子 Agent、文件系统）
LangChain    →  通用框架（create_agent + LCEL）
LangGraph    →  底层编排（循环、状态、人机协作）
LangSmith    →  追踪、调试、评估
```

LangChain Agent **底层基于 LangGraph**：简单用 LangChain，复杂工作流用 LangGraph。

**何时用 / 不用**


| 适合        | 不必用              |
| --------- | ---------------- |
| 多模型切换     | 单次 API 调用        |
| RAG 文档问答  | 简单固定 Prompt 聊天   |
| 多工具 Agent | 逻辑极简、直接调 SDK 更清晰 |


**经验法则**：涉及文档检索、多工具、多模型中 **≥2 项** 时，值得引入。

<h2 id="c-4-0" class="mh1">四、简历项目深挖（问答）</h2>

> 用法：面试官常从简历项目切入。每题按 **「问题 → 思路 → 参考答案」** 组织，回答时先讲**背景与 trade-off**，再落到**你做了什么、指标如何、失败怎么办**。

---

<h3 id="c-4-1" class="mh2">A. 司睿杰 · 内部 OA / 监理协会考核系统</h3>

#### Q1. 考核系统从零到一：需求拆分、选型、防作弊、交卷与异常？

**思路**：模块边界 → 选型 → 三条核心链路（**draft 保存 / 防作弊 / 交卷判定**），一律**服务端权威**。

**参考答案**：

**1）模块与选型**

- **拆分**：题库 / 组卷 / 在线考试 / 阅卷 / 统计 / 证书，六块独立
- **选型**：Gin + MySQL（事务卷）+ MongoDB（大题附件）+ ES（文档检索）
- **原则**：考试写主库；阅卷统计走 MQ 异步

**2）交卷判定（核心：只认 DB status）**


| 方式     | status | 谁触发       |
| ------ | ------ | --------- |
| 主动交卷   | 已交卷    | submit 接口 |
| 到点     | 超时交卷   | 定时任务      |
| 作弊/管理员 | 强制收卷   | 规则/人工     |


- **draft ≠ submit**：心跳/切题只写 draft，不改 status、不阅卷；交卷事务内 draft→final 并改 status
- **幂等**：`submission_id` + `(exam_id, user_id)` 唯一索引，重复点击/重试均返回成功
- **计时**：`deadline = start_at + duration` 服务端计算，不信客户端时钟

**3）防作弊 + 心跳（30s 上报）**

```
POST /heartbeat { session_token, seq, answers_delta, events:[blur,...] }
→ 校验 token / status=进行中 / now<=deadline
→ 写 draft + 累计 blur_count + 记录 IP（X-Real-IP）
→ 返回 remaining_sec
```


| 维度  | 做法                                         |
| --- | ------------------------------------------ |
| 时间窗 | 开考、入场、deadline 中间件硬拦                       |
| 切屏  | visibilitychange/blur 上报，超 N 次警告，超 M 次强制收卷 |
| IP  | 开考记 start_ip，变更告警标记复核                      |
| 多端  | Redis session_token，新端登录踢旧端                |


**4）断电 / 断网等异常**


| 异常      | 处理                                      |
| ------- | --------------------------------------- |
| 断电 / 崩溃 | `GET /exam/session` → 用服务端 draft 续考     |
| 交卷时断网   | 轮询 status；未交卷则带同一 `submission_id` 重试    |
| 到点客户端全挂 | 定时任务扫 `deadline<now`，用**最后 draft** 超时收卷 |
| 心跳丢失    | 不立刻收卷；接近 deadline 仍用最后 draft 兜底         |


**一句话**：答题靠**心跳+draft**防丢，交卷靠**status+幂等**防重，到点靠**定时任务**兜底。

---

#### Q2. Casbin 做 OA 权限，表单级 + 字段级怎么设计？为什么不用 OPA？

**思路**：讲清 Subject-Object-Action 建模 + 存储 + 变更同步 + 前后端分工。

**参考答案**：

1. **两层权限**：
  - 表单级：`obj=form:{id}` + `act=read/create/submit/approve`
  - 字段级：`obj=form:{id}/field:{key}` + `act=visible/editable`
2. **RBAC 继承**：用户 → 角色（`g, user, role`）→ 策略（`p, role, obj, act`）；部门管理员单独加组策略。
3. **存储**：策略落 DB，变更时刷 Casbin Adapter；进程内 `Enforcer` 缓存，变更广播或定时 reload。
4. **接口层**：每个写接口 `Enforce(sub, obj, act)`；读接口逐字段校验 `editable`，前端只做展示隐藏。
5. **为何 Casbin 而非 OPA**：策略模型固定（RBAC+表单），嵌入进程延迟低；OA 不需要 K8s 级通用策略引擎。若未来跨 10+ 微服务统一策略，再评估 OPA Sidecar。

---

#### Q3. 网盘父子级权限 + 路径 + 在线预览，怎么设计？最易出 bug 的点？

**思路**：**node_id 定位，祖先链算权**；展示路径与 OSS 存储分离；预览用短效签名。

**参考答案**：

**1）核心模型**

- **节点表**：`id + parent_id + name`；`logical_path`（如 `/1/12/`）便于列目录；`storage_key` 存 OSS 位置，**不暴露前端**
- **权限表**：挂在文件夹/文件上，绑定用户/角色；动作拆成 `list / read / preview / upload / delete`
- **继承**：沿 `parent_id` 向上合并祖先权限；**子可收紧，不可放大**

**2）鉴权（统一流程）**

```
只收 node_id → 查祖先链 → 合并 effective 权限 → 校验本次 action → 再执行业务
下载/预览：服务端查 storage_key，客户端不传 path
```

**3）关键操作**


| 操作  | 要点                                       |
| --- | ---------------------------------------- |
| 列目录 | 后端 filter，无权限的不返回                        |
| 上传  | 校验父目录 `upload`                           |
| 移动  | 校验源+目标权限；**子树 logical_path 批量更新**        |
| 预览  | 鉴权 → 预签名 URL（TTL 5～15min）→ Office Online |


**4）最易出 bug**


| 坑       | 对策                           |
| ------- | ---------------------------- |
| IDOR 越权 | 只认 node_id + 祖先链，不单校验 fileId |
| 路径穿越    | 不信前端 path，只用 node_id         |
| 移动后错乱   | 同步更新子树 path，失效权限缓存           |
| 预览泄露    | 短 TTL 签名 URL，不用永久链接          |


**一句话**：**node_id 算权，path 管展示，OSS 管存储，预览短链**。

---

#### Q4. MySQL 文档同步到 ES 全文检索，如何保证一致性与可检索？

**思路**：增量同步、失败重试、mapping 设计、中文分词。

**参考答案**：

1. **同步路径**：业务写 MySQL → binlog/定时扫增量 → 同步 worker 写 ES；FTP 文档先入库元数据再异步解析正文。
2. **一致性**：at-least-once + 幂等 docId；失败进死信队列人工补偿；全量 rebuild 索引 alias 切换（蓝绿）。
3. **Mapping**：keyword 存文件名/类型；text 用 ik 分词；高亮字段单独存 `content.excerpt` 控制返回大小。
4. **查询**：multi_match + filter（权限 tag）；结果按权限二次过滤，**不在 ES 里存明文密码**。

---

<h3 id="c-4-2" class="mh2">B. 亮风台 · 云平台（Rust→Go / MySQL→PG）</h3>

#### Q5. 为什么把 Rust 薪资服务重写为 Go？不是 Rust 性能更好吗？

**思路**：团队成本、维护面、性能是否瓶颈、迁移风险。

**参考答案**：

1. **真实动机**：团队 Go 占多数、Rust 服务维护人员已离职；招聘与 on-call 成本 > 单服务性能收益。
2. **性能评估**：薪资服务 QPS 低、IO 型（DB+HTTP），Go 足够；Profiling 证明瓶颈在 DB 不在语言。
3. **迁移策略**：协议对齐（gRPC/HTTP 字段一一映射）→  灰度切流 → 观察 7 天无 diff 下线 Rust。
4. **保留 Rust 的场景**：若热点 CPU 算子或内存安全极端敏感，可保留；本项目不满足。

---

#### Q6. MySQL → PostgreSQL 迁移，你如何做到「可回滚、可验证」？

**思路**：全量+增量、双写/对账、类型映射、SQL 兼容层。

**参考答案**：

1. **阶段**：Schema 转换 → 全量 dump/load → 增量（Debezium/binlog 或应用双写）→ 对账 → 切读 → 切写 → 下线 MySQL。
2. **代码改造**：
  - `GROUP BY` 语义差异：PG 要求 SELECT 列在 GROUP BY 或聚合内
  - 零值/布尔/JSON 类型映射
  - 自增改 sequence 或 UUID
3. **对账**：按主键 hash 行数、sum 校验、抽样 diff；不一致自动告警。
4. **回滚**：切流前保留 MySQL 只读副本 + 反向同步脚本；业务开关一键回 Old DB。

---

#### Q7. Kratos + Wire 重构后，服务分层你怎么划？

**思路**：对齐 Kratos 官方分层，讲依赖方向。

**参考答案**：

```
API (proto/http) → Service (DTO 转换) → Biz (领域规则) → Data (repo)
```

- **Biz 层**不放 SQL；薪资计算、权限校验在 Biz。
- **Data 层**接口化，便于 mock 与 PG/MySQL 切换。
- **Wire** 编译期注入，避免运行时反射容器；新增依赖改 provider set 即可。

---

<h3 id="c-4-3" class="mh2">C. 智慧视通 · 蜂鸟（双网 / 百亿检索 / 服务治理 / 大模型）</h3>

#### Q8. 双网架构下 4000 路设备摘要同步，核心难点是什么？

**思路**：网闸约束、顺序/幂等、压缩、分批、对账。

**参考答案**：

1. **约束**：内外网物理隔离，只能经**网闸**单向/限时传输；包大小、频率、协议格式受限。
2. **方案**：
  - 数据**分片+压缩**（protobuf/zstd）减少体积
  - **分批 ACK**：每批带 checkpoint，失败从 checkpoint 重传
  - **幂等键**：`(deviceId, segmentId, version)` 防重复入库
3. **对账**：内外网按设备维度日对账条数+hash；偏差超阈值告警人工介入。
4. **延迟 vs 一致**：允许秒级~分钟级最终一致；关键告警走优先级队列。

---

#### Q9. 百亿级检索、日亿级写入，TiDB + 分区 + 缓存策略怎么配合？

**思路**：冷热分离、分区键、索引、写放大、查询路径。

**参考答案**：

1. **分区**：按天/按设备 hash 分区；查询必须带分区键，避免全表扫。
2. **垂直拆分**：主表留检索字段，大字段/低频字段副表；减少回表 IO。
3. **索引**：联合索引遵循最左前缀；避免过多二级索引拖慢写入。
4. **写优化**：批量 insert、异步 flush；峰值限流保护 TiKV。
5. **读优化**：热点明细 Redis 缓存 + TTL；统计走预聚合表（按小时 rollup）。
6. **降级**：检索超时返回「最近 N 天」；非核心统计延迟计算。

---

#### Q10. 布控服务拆成「业务中心 + 无状态 Worker」，为什么这样拆？

**思路**：有状态 vs 无状态、调度、扩缩容、脑裂。

**参考答案**：

1. **问题**：旧架构任务状态、订阅、调度耦合，扩容要 sticky session，故障影响面大。
2. **拆分**：
  - **业务中心**：接 API、鉴权、任务 CRUD、gRPC 调度入口；广播任务变更流
  - **Worker**：无状态，从队列/调度拉任务执行；可 HPA 水平扩
3. **一致性**：任务状态以 DB//etcd 为准；Worker 上报 heartbeat；超时重新分配。
4. **删改同步**：业务中心发广播流，Worker 订阅 invalidate 本地缓存。

---

#### Q11. 摘要复用 + 动态缩略图，怎么做到「该省的省、该算的才算」？

**思路**：去重键、懒加载、异步 pipeline。

**参考答案**：

1. **摘要复用**：同一 `(deviceId, timeRange, algoVersion)` 命中缓存直接返回，避免重复抽帧/推理。
2. **缩略图**：首屏不预生成全量缩略图；用户首次查看时异步生成缩略图写对象存储，下次直出。
3. **存储**：MinIO/SeaweedFS 存原图与 thumb；DB 只存 URI + meta。
4. **指标**：复用命中率、缩略图生成队列堆积、P95 首屏时延。

---

#### Q12. Jaeger 链路追踪接入后，你实际用它解决过什么线上问题？

**思路**：举真实场景：慢请求、下游故障、重复调用。

**参考答案**：

1. **场景**：检索接口 P99 3s+；Trace 显示 Vearch 调用 2.4s，TiDB 0.3s，序列化 0.2s。
2. **动作**：Vearch topK 从 500 降到 100 + rerank；连接池从 10→50；P99 降到 800ms。
3. **规范**：入口 middleware 注入 TraceId；跨 gRPC metadata 传递；日志打印 trace_id 便于关联。
4. **采样**：生产 1% 概率采样 + 错误全采样，控制存储成本。

---

#### Q13. 限流用令牌桶，接口级还是租户级？参数怎么定？

**思路**：维度、算法、观测、调参。

**参考答案**：

1. **维度**：网关层租户级 + 服务内热点接口级双层；防止单客户打满集群。
2. **算法**：`golang.org/x/time/rate` 或 juju/ratelimit； burst 允许短时突发，rate 控平均。
3. **调参**：压测得单 Pod 饱和 QPS → rate = 0.8 * 饱和值；上线后看 429 比例与 CPU 联动调。
4. **体验**：返回 `Retry-After`；关键接口排队（漏桶）而非直接 429。

---

#### Q14. GitLab CI 你搭了哪些 stage？如何保证镜像可复现？

**思路**：流水线阶段、缓存、tag 策略、安全扫描。

**参考答案**：

1. **Stage**：lint（golangci-lint）→ test（-race, coverage）→ build → docker build → push → deploy（helm/kubectl）。
2. **可复现**：go.mod sum 校验；Docker 多阶段构建；基础镜像 pin digest；私有依赖走 GitLab Package/Go Proxy。
3. **迁移**：老仓库 mirror + CI 模板化；依赖镜像先同步到内网 Harbor 再切 pipeline。
4. **门禁**：MR 必须通过 CI；main 分支才 push latest；发布打 semver tag。

---

#### Q15. 大模型以图搜图 / 文搜图，和 Vearch 向量检索怎么分工？

**思路**：Embedding 链路、索引、RAG vs 向量召回、双网合规。

**参考答案**：

1. **离线**：摘要帧 → Embedding 模型 → 向量写 Vearch/Milvus；元数据写 TiDB。
2. **在线**：
  - 以图搜图：query 图 Embedding → ANN 检索 → 回表补全设备/时间/权限过滤
  - 文搜图：文本 Embedding 或 LLM 改写 query 再检索
3. **与 RAG 区别**：这里是**视觉语义检索**，不是文档 QA；LLM 可用于 query 扩展、结果解释，非必须每请求都调大模型。
4. **合规**：内外网模型部署分离；出网数据脱敏；审计谁搜了什么。

---

<h3 id="c-4-4" class="mh2">D. 跨项目 · 语言 / 框架 / 运维通用深挖</h3>

#### Q16. Gin Context 用 sync.Pool 复用，有什么坑？

**思路**：Reset 必须彻底、不能跨请求泄漏、Handler 里 goroutine 逃逸。

**参考答案**：

1. **必须 Reset**：`keys` map、index、handlers 每次归还前清空，否则 A 用户数据泄漏给 B。
2. **坑**：Handler 里 `go func(){ c.JSON(...) }()` 异步写 Context — **禁止**，请求结束 Context 已回收。
3. **理解**：Pool 减少分配 GC 压力；路由匹配与路径长度相关，与路由总数弱相关（Radix Tree）。

---

#### Q17. 线上 goroutine 泄漏，你怎么定位？

**思路**：pprof goroutine、trace、常见泄漏模式。

**参考答案**：

1. `curl /debug/pprof/goroutine?debug=2` 看栈；关注大量相同栈（如 channel 未读、Ticker 未 Stop、订阅未 Unsubscribe）。
2. **蜂鸟案例**：布控订阅流客户端断开未 cancel context，goroutine 堆积；修复 `context.WithCancel` + defer cancel。
3. **预防**：长生命周期 goroutine 必须绑定 context；Review 禁止无界 `go func()`。

---

#### Q18. 微服务拆分后，分布式事务你怎么处理？

**思路**：能避免则避免；最终一致；Outbox；Saga。

**参考答案**：

1. **原则**：业务允许则**最终一致**优于 2PC；跨服务用**事件驱动**。
2. **模式**：本地事务 + Outbox 表 → MQ → 下游消费幂等；失败重试 + 死信。
3. **蜂鸟例**：写检索索引与写 DB 不强一致；MQ 异步索引，补偿 job 扫 diff。
4. **避免**：跨 TiDB + ES + MinIO 大事务；每步可单独回滚或补偿。

---

#### Q19. Deployment vs StatefulSet，蜂鸟里哪些用哪种？

**思路**：结合简历 K8s 表，举实际服务。

**参考答案**：


| 服务                   | 选型          | 原因         |
| -------------------- | ----------- | ---------- |
| API 网关 / 检索 API      | Deployment  | 无状态，随意扩缩   |
| TiDB / Kafka         | StatefulSet | 稳定网络标识、持久卷 |
| 日志采集 / node-exporter | DaemonSet   | 每节点一份      |


Worker 无状态 → Deployment + HPA；有本地缓存需清空或走 Redis。

---

#### Q20. Prometheus 监控，你会看哪些 RED/USE 指标？

**思路**：面向服务接口与资源。

**参考答案**：

1. **RED**：Rate（QPS）、Errors（5xx 比例）、Duration（P95/P99）。
2. **USE**：Utilization（CPU/内存）、Saturation（队列长度、连接池等待）、Errors（磁盘/网络）。
3. **告警**：P99 > SLO 5 分钟、错误率 > 1%、Kafka lag 超阈值、Pod OOMKilled。
4. **联动**：告警带 trace_id 模板，On-call 先查 Jaeger 再查日志。

---

#### Q21. 容器镜像过大导致启动慢，你怎么优化？

**思路**：多阶段构建、基础镜像、分层缓存、无关文件。

**参考答案**：

1. **多阶段**：builder 阶段编译，runtime 阶段只 COPY 静态二进制 + ca-certificates。
2. **基础镜像**：distroless / alpine；pin 版本；`.dockerignore` 排除 `.git`、`vendor` 测试文件。
3. **缓存**：go mod download 单独层；业务代码变更不重复下载依赖。
4. **K8s**：合理 requests/limits；readiness 探针别太早；preStop 优雅退出。

---

#### Q22. RAG 落地到企业内网，Naive RAG 不够用时你怎么升级？

**思路**：对照 Advanced/Modular RAG，结合双网与权限。

**参考答案**：

1. **Pre-Retrieval**：Multi-Query 改写；HyDE 生成假设文档提升召回。
2. **Retrieval**：BM25 + 向量混合；文档带 ACL tag，检索后**权限过滤**。
3. **Post-Retrieval**：Rerank 交叉编码器；上下文压缩防超 token。
4. **Generation**：答案必须带引用片段；低置信度拒答或转人工。
5. **编排**：复杂多跳用 LangGraph Loop；简单 FAQ 保持 Linear。

---

#### Q23. LangChain 引入后，Agent 死循环怎么防？

**思路**：Harness 层限制、最大步数、工具超时、人机确认。

**参考答案**：

1. **Scheduling**：max_iterations=10；单工具 timeout；总 token 预算。
2. **Routing**：简单问题走固定 RAG chain，复杂才进 Agent。
3. **观测**：LangSmith 记录每步 tool call；异常循环告警。
4. **生产**：写操作工具必须 human-in-the-loop 确认。

---

#### Q23b. 智能体：规则/关键词路由与意图 LLM 怎么分工？

**思路**：规则保确定性、低成本、合规闸门；LLM 补泛化与纠偏；执行与展示层不再二次调模型。

**参考答案**：

用户一句话先进 **规则路由**，得到 `ruleIntent`（及规则侧槽位/上下文）。只有规则 **拿不准** 时才调 **意图 LLM**；合并后走 **硬闸门** 执行；列表 **短总结** 只依赖最终 intent + 业务数据，**与意图 LLM 无关**。

```
用户输入（文本 / 可选图片）
    │
    ▼
[1] 规则路由（必走，零 LLM）
    · @功能：@搜图 / @档案 / … → 直接钉死 ruleIntent
    · 关键词 / 正则：词典、业务口令
    · 有无图：有图走图搜等固定分支
    → 输出 ruleIntent（+ 规则已抽槽位）
    │
    ▼
[2] 是否调意图 LLM？
    跳过（不调模型）当任一成立：
    · 已 @ 功能
    · 「单人查档 / 词典命中 / 人脸车 / incomplete …」等钉死场景
    否则 → 意图 LLM，结构化 JSON：
    { intent, name/keywords/address, confidence }
    │
    ▼
[3] 合并 ruleIntent × LLM intent
    · confidence < 0.45 → **以规则为准**（防模型乱飘）
    · 高置信 → 模型可 **纠偏**（例：口语「联系」→ 人人关系 intent）
    · **硬闸门**（规则/配置优先，LLM 不能推翻）：
      档案 / 轨迹 / 抓拍等多条敏感或高成本链路
    │
    ▼
[4] 执行（Tool / MCP / 检索 / 档案 API）
    · **槽位优先**：合并结果里的 name、keywords、address
    · **本地抽词兜底**：LLM 槽位缺失时用 NER/词典/正则补全
    │
    ▼
[5] 列表短总结（展示层）
    · 按 **最终 intent + 结果列表数据** 模板或轻量生成
    · **不再调用意图 LLM**（意图阶段一次定调，避免延迟与口径不一致）
```

| 层次 | 职责 | 为什么这样拆 |
| --- | --- | --- |
| 规则路由 | 高频、强约束、@ 与合规 | 确定性、毫秒级、可审计、省 token |
| 意图 LLM | 长尾说法、抽槽、纠偏 | 泛化；低置信回退规则 |
| 硬闸门 | 档案/轨迹/抓拍等 | 安全与成本；避免模型误路由 |
| 执行抽槽 | 槽位优先 + 本地兜底 | 执行要稳，不绑单次 LLM |
| 短总结 | 结果导向 | 与意图解耦，列表可读即可 |

**与 Q23「Agent 死循环」的关系**：意图只 **一步 JSON**，不进入 ReAct 环；复杂多步走 Function Call/MCP，仍受 max_iterations、硬闸门路由限制。

**面试怎么讲**：**规则先行、模型补位、低置信听规则的** 三层；强调 **硬闸门** 和 **意图 LLM 只负责认路，不负责列表文案**；双网/档案场景可补一句「敏感 intent 必须规则或阈值+人工策略，不能纯 LLM 放行」。

---

#### Q24. 作为研发组长，你怎么分配任务和控风险？

**思路**：结合简历「梳理流程、分配任务、周报、攻坚难点」。

**参考答案**：

1. **拆任务**：按服务边界 + 可验收接口；每个任务有 owner、截止时间、回滚方案。
2. **风险前置**：双网/sync/迁移类需求先做 POC + 对账方案再全量。
3. **节奏**：周会看 blocker；难点结对攻坚；上线 checklist（监控、告警、回滚、值班）。
4. **Code Review：讲 trade-off，不只讲风格**


| 优先级        | Review 什么    | 示例                        |
| ---------- | ------------ | ------------------------- |
| **P0 必拦**  | 正确性、安全、数据一致性 | 越权、幂等缺失、事务边界错误            |
| **P1 应聊**  | 性能、可观测、失败路径  | 无超时的 RPC、缺 trace/log、错误被吞 |
| **P2 可建议** | 可维护性、边界清晰度   | 职责过重、缺接口抽象                |
| **P3 不强求** | 命名、格式、个人偏好   | 除非团队已有统一规范                |


**怎么讲 trade-off**（比「这里命名不好」有价值）：

- 「A 实现更简单，但扩容时要改 DB；B 多一层缓存，运维成本上去——这服务 QPS 多少，选哪个？」
- 「这里同步写 ES，一致性更好；异步 MQ 吞吐更高——业务能接最终一致吗？」
- 「直接 `go func` 快，但 Context 取消传不下去——建议绑 `ctx` 或说明为何不会泄漏。」

**原则**：指出**备选方案 + 取舍依据 + 风险**；风格类意见一次性对齐规范，不逐行抠格式。

---

<h3 id="c-4-5" class="mh2">E. 简历补充 · 协议 / 向量双栈 / 智能体 / 多模态 / 实时 / 身份（P0）</h3>

#### Q25. GA/1400 等行业协议对接，在双网架构里你怎么做？

**思路**：网闸只认固定载荷；内外网业务模型不一致时要有 **适配层 + 幂等 + 对账**，和 Q8 摆渡链路一体讲。

**参考答案**：

1. **分层**：
  - **协议适配**：GA/1400（及平台变种 XML/JSON）→ 内部统一事件模型（protobuf/struct）
  - **摆渡传输**：分片、压缩、ACK（见 Q8、G55）
  - **业务消费**：布控、摘要、状态入库，带幂等键
2. **转换要点**：字段映射表 + 必填/枚举校验；设备 ID、时间、坐标系规范化；平台不支持的能力 **显式降级** 并打 metric，不 silent drop。
3. **版本与联调**：协议版本号进消息头；适配层单测（golden file）+ 抓包联调；变更走配置热更或发版窗口。
4. **可靠**：网闸重传 ≠ 业务重复写；`(deviceId, bizSeq, protocolVersion)` 幂等；日对账条数/hash，偏差告警（Q8）。
5. **面试怎么讲**：双网难点不只有带宽，还有 **语义对齐**；我在中间层做 GA/1400→内部模型，和 checkpoint/对账绑在一起，避免「协议通了但数据重复/丢失」。

---

#### Q26. Vearch（人脸/形体）和 Milvus（大模型语义）为什么两套？怎么分工？

**思路**：特征类型、索引基建、QPS 路径不同；讲清 **共存理由** 和 **在线查询路径**，避免「将来全迁 Milvus」空话。

**参考答案**：

1. **Vearch**：
  - **人脸/形体结构化特征**，和布控、1:N、历史回溯链路深度绑定
  - 低维、高 QPS ANN；集群与运维团队已有经验（Q12 慢查优化案例）
2. **Milvus**：
  - **多模态 Embedding**（以图搜图、以文搜图、流摘要向量）
  - 向量 + 丰富 metadata（设备、时间、权限 tag）；组合检索常和 TiDB 条件过滤配合（Q9）
3. **在线路径**：
  - 布控命中、形体/人脸 1:N → **Vearch**
  - 语义搜图、组合条件检索 → **Milvus**（先结构化缩小范围再 ANN，或 ANN 后 ACL 过滤，看选择性）
4. **离线**：摘要帧/流摘要 → Embedding 任务 → 写 Milvus；结构化特征仍走原 Vearch 流水线；模型版本变更需 **双写或灰度索引**。
5. **合规**：向量与模型在内网（G55）；检索 API 审计谁查了什么（Q15）。
6. **面试怎么讲**：不是二选一，是 **两类特征、两条 SLA**；Vearch 守核心业务，Milvus 守大模型检索扩展。

---

#### Q27. 组合搜图 + 文字布控，和单次以图搜图有何不同？

**思路**：多条件编排、召回融合、布控 **误报成本**；和 Q10 任务中心、Q23b 意图硬闸门衔接。

**参考答案**：

1. **组合搜图**：
  - 输入：图 + 可选文本/时间窗/区域/设备列表
  - **多路召回**：向量 ANN + TiDB/标签结构化过滤 → 交集或加权融合 → 权限过滤 → 分页
  - 控制 topK（Q12）；避免单 ANN 拉 500 再内存过滤
2. **文字布控**：
  - 自然语言或关键词 → **规则/意图 LLM** 定布控类型（Q23b 硬闸门）
  - 落 **结构化规则** 写业务中心（Q10）；Worker 无状态执行；创建/变更可审计
3. **与单次以图搜图**：后者单模态、只读检索；组合搜图强调 **条件选择性**；文字布控是 **写路径**，失败重试、幂等、告警优先级更高。
4. **指标**：检索 P99、融合后有效条数；布控生效延迟、误报率；Prometheus 业务 Counter（G51 storeproxy 同类做法）。
5. **面试怎么讲**：组合搜图是 **召回工程**；文字布控是 **意图→结构化任务**，必须规则+闸门，不能纯 LLM 直接写库。

---

#### Q28. Function Call / MCP / Tool 在生产里怎么接？和 Q23b 路由怎么衔接？

**思路**：意图只认路；执行层 **白名单 Tool + 超时 + 鉴权**；别讲成 LangChain 教程（Q23 防死循环）。

**参考答案**：

1. **衔接 Q23b**：`final intent` + 槽位 → **Intent→Tool 映射表**（配置/代码生成）；未在白名单的 intent 拒绝或转人工。
2. **Function Call**：对支持 FC 的模型，Tool Schema 与内部 HTTP/gRPC **同一套参数校验**（validator）；模型只填参，服务端仍二次校验。
3. **MCP**：适合 **可插拔、边界清晰** 的能力（文档、外部工具）；内网核心（档案、检索、Milvus）优先 **直连 gRPC**，MCP 作统一接入层时加网关鉴权与审计。
4. **可靠性**：单 Tool `context` 超时；写操作幂等键；`max_iterations` 限制多步调用（Q23）；敏感 Tool（档案/轨迹）走硬闸门 + 租户 ACL。
5. **可观测**：每 Tool 一次 span（Jaeger Q12）；RED 指标 + 失败分类（可重试/不可重试，G42）。
6. **面试怎么讲**：路由 **一步 JSON** 定 intent；执行是 **确定性 Tool 链**，FC/MCP 只是调用外观，生产权在服务端白名单。

---

#### Q29. FunASR + CosyVoice 在多模态链路里怎么串？

**思路**：语音是 **I/O 适配**；认路仍 Q23b；异步、GPU、双网模型不出内网。

**参考答案**：

1. **ASR（FunASR）**：
  - 音频上传或流式 chunk → ASR 服务 → 文本 → **同一套规则路由 + 意图 LLM**
  - 长音频分片、队列、超时；失败返回可重试错误码
2. **TTS（CosyVoice）**：
  - 回复文本（或模板）→ TTS → 对象存储 URL / 流式下发
  - 常用话术可缓存；注意并发与 GPU 资源隔离
3. **与视频摘要**：摘要向量走 Milvus（Q26）；语音智能体走文本链路，**不混在一个大模型端到端**里，便于控成本与合规。
4. **工程**：CI 镜像与模型版本 pin（Q14）；健康检查与队列堆积告警（G51）；内网部署（G55）。
5. **面试怎么讲**：ASR/TTS 是 **入口/出口适配**；业务语义仍 **规则先行、意图 LLM 补位**，避免语音全链路黑盒。

---

#### Q30. WebSocket 长连接：设备/前端实时协同你怎么设计？

**思路**：和 gRPC 分工；心跳、扩缩容、广播；接 Q10 业务中心发流。

**参考答案**：

1. **场景**：实时状态、任务推送、大屏；比 HTTP 轮询更省资源；对内服务间仍 **gRPC**（G28）。
2. **连接管理**：网关或专用 WS 服务；连接注册（Redis/分片 map）；**心跳 + 空闲断开**；单 IP/租户连接数上限。
3. **消息下发**：
  - 业务中心任务变更 → MQ 或 gRPC 广播 → WS 节点 **pub/sub** 推送到本机连接
  - 扩缩容时避免 sticky 丢消息：以 **userId/deviceId 路由到 channel**，重连后补拉增量（version/checkpoint）
4. **治理**：单连接限流；消息体大小上限；与 Jaeger 关联 `connectionId`（日志脱敏）。
5. **面试怎么讲**：WS 管 **端上实时**；状态以 DB/业务中心为准（Q10），WS 只是通知，不是 source of truth。

---

#### Q31. 档案库 vs 知识库 RAG，产品和技术差异？

**思路**：结构化精确查询 vs 非结构化文档 QA；权限与智能体硬闸门（Q23b、Q22）。

**参考答案**：

1. **档案库**：
  - 强 schema：人/车/案事件/轨迹等 **精确查询 API**
  - 智能体：`@档案`、档案/轨迹/抓拍等 **硬闸门 intent** → Tool 调档案服务，**禁止 LLM 编造**
  - 列表短总结用结果数据生成，与意图 LLM 解耦（Q23b）
2. **知识库 RAG**：
  - 制度、手册、FAQ 等 PDF/Markdown → 切分 → Embedding → 向量检索
  - **ACL tag** 检索后过滤（Q22 Advanced RAG）；答案 **必须带引用片段**；低置信拒答
3. **不要混用**：档案库不是「把档案 PDF 扔进去向量问答」；结构化走 API，非结构化走 RAG。
4. **双网**：索引与模型在内网；外网若有助手，仅脱敏 FAQ 或只读接口（G55、Q15）。
5. **面试怎么讲**：档案 **Tool + 审计**；知识库 **RAG + 引用**；智能体路由里两者 intent 不同、闸门不同。

---

#### Q32. Keycloak + RBAC（亮风台 PaaS）和 Casbin（OA）差异？你怎么落地？

**思路**：身份（IdP）vs 应用内细粒度授权（Q2）；PaaS 微服务 JWT 与控制台 SSO 一体。

**参考答案**：

1. **Keycloak**：
  - 平台 **IdP**：用户、角色、客户端、OIDC/SAML
  - 微服务验 JWT 签名 + 解析角色/租户声明；控制台、Redash 等走 **同一 SSO**
2. **Casbin（Q2）**：
  - 应用内 **资源/表单/字段级** 策略；适合 OA 网盘、考核等细粒度数据权限
  - 可并存：**Keycloak 管「是谁」**，Casbin 管「能看哪张表哪一行」
3. **与 Q6 迁移**：MySQL→PostgreSQL 同期切 IdP；服务间从共享 session 迁到 **Bearer Token**；回调 URL、证书轮换进 checklist（Q24）。
4. **实践**：Redash/自助分析用 **只读 DB 账号 + SSO**；敏感 API 仍走服务侧二次鉴权，不单信 JWT 里的 role 字符串。
5. **面试怎么讲**：PaaS 要 **统一身份**；OA 要 **数据面策略**；别用一个 Casbin 扛所有平台登录。

---

<h2 id="c-5-0" class="mh1">五、高级 Go 能力深挖（语言 / 框架 / 运维 / CI/CD / 架构）</h2>

> 按能力维度组织，共 **72 题（G1–G72）**；每题 **思路 + 参考答案（含面试怎么讲、代码/命令示例、排障步骤）**。与第四节「简历项目」互补。

---

<h3 id="c-5-1" class="mh2">1. 语言（Go 本身）</h3>

#### G1. 逃逸分析是什么？怎么判断变量堆还是栈分配？

**思路**：编译期决定分配位置；堆分配增加 GC 压力。

**参考答案**：

**面试怎么讲（30 秒版）**：Go 编译器在编译期做逃逸分析，决定变量分配在栈上还是堆上。栈分配随函数返回自动回收，几乎零成本；堆分配由 GC 管理，会增加扫描负担。优化热路径的核心是「少逃逸、少分配」，而不是盲目追求全栈分配。

**核心机制**：

- **逃逸分析本质是追踪：这个变量的地址，会不会被当前函数之外的地方用到？** 会 → 堆分配；不会 → 栈分配
- 逃逸分析在 **编译期** 完成，不是运行时判断；每个函数的局部变量若其生命周期超出函数栈帧，就会「逃逸到堆」
- 栈分配：函数返回时帧弹出，内存自动回收，无 GC 参与
- 堆分配：对象被 GC 三色标记扫描，对象越多、指针链越长，GC CPU 与 STW 压力越大

**常见逃逸场景（带示例）**：

```go
// 1. 返回局部变量指针 —— 经典逃逸
func newUser() *User {
    u := User{Name: "alice"} // u escapes to heap
    return &u
}

// 2. 闭包捕获外部变量 闭包捕获 &u 且闭包被返回 -> 闭包活得比函数久 → 逃逸
func counter() func() int {
    n := 0 // n escapes: 闭包生命周期 > 函数返回
    return func() int { n++; return n }
}

// 3. 赋值给 interface{} —— 装箱常导致逃逸
func printAny(v interface{}) { fmt.Println(v) }
printAny(42) // 42 可能逃逸（取决于具体类型与优化）

// 4. slice/map 底层数组指针逃逸
func makeSlice(n int) []byte {
    return make([]byte, n) // 大 slice 或返回 slice 时底层数组常逃逸
}

// 5. 过大对象 —— 超过栈阈值（约 64KB，版本相关）直接堆分配
```

**检测命令**：

```bash
# 单文件/包查看逃逸报告
go build -gcflags="-m -m" ./pkg/...

# 输出示例：
# ./main.go:10:2: moved to heap: u
# ./main.go:15:6: ... argument does not escape
# ./main.go:20:9: ... escapes to heap
```

`-m` 重复两次会输出更详细的决策原因（「because ...」）。配合 `-gcflags="-m -l"` 可关闭内联，便于看清真实逃逸路径。

**优化手段**：

```go
// 热路径：返回值类型而非指针（若对象不大）
func newUserVal() User { return User{Name: "alice"} }

// 预分配 slice，避免循环 append 反复扩容
buf := make([]byte, 0, 1024)

// 字符串拼接：循环里避免 fmt.Sprintf
var b strings.Builder
b.Grow(n)
for _, s := range parts { b.WriteString(s) }
```

**验证优化效果**：

```bash
go test -bench=. -benchmem ./...
# 关注 allocs/op（每 op 分配次数）和 B/op（每 op 分配字节）
```

**常见误区**：

- 「逃逸 = 一定慢」：小对象堆分配成本未必高，但 **高频路径** 累积的 GC 压力才是瓶颈
- 「指针一定比值慢」：大 struct 传值拷贝反而更贵，需结合 size 与逃逸一起看
- 只看 `-m` 不看 benchmark：优化要以 `allocs/op` 和延迟实测为准

---

#### G2. GC 三色标记 + 写屏障，STW 在哪？

**思路**：并发标记 + 写屏障；调 GOGC 是手段，少分配是根本。

**参考答案**：

**面试怎么讲（30 秒版）**：Go GC 是并发三色标记-清除：Mark 找出存活对象，Sweep 回收死亡对象。STW 只出现在三个极短同步点——标记开始扫根、mark termination 收尾、以及 sweep 阶段启动清扫时的状态切换（**不是整段 sweep 都 STW**）。Mark 和 Sweep 主体都与业务 goroutine 并行；写屏障保证并发标记不漏标。调优上**减少堆分配**比调 GOGC 更有效。

**Mark 与 Sweep 分工**：

| 阶段 | 做什么 | 与业务关系 |
| --- | --- | --- |
| **Mark（标记）** | 从根对象出发，三色标记找出所有存活对象 | 主体并发，写屏障保正确性 |
| **Sweep（清扫）** | 回收标记阶段判定为「白色」的死亡对象，内存还给堆 | 主体并发/异步，仅少数同步点可能 STW |

**三色标记流程**：


| 颜色  | 含义           | 状态     |
| --- | ------------ | ------ |
| 白   | 未被扫描，默认认为可回收 | 初始所有对象 |
| 灰   | 已发现，子引用待扫描   | 工作队列   |
| 黑   | 已扫描完所有引用     | 不会被回收  |


1. STW 极短：扫描根对象（goroutine 栈、全局变量、寄存器），入灰队列
2. **并发标记**：业务 goroutine 与 GC worker 并行，灰对象出队 → 扫描引用 → 子对象变灰 → 自身变黑
3. STW 极短：mark termination，处理剩余灰对象，确保一致性
4. **并发清扫（Sweep）**：回收白色死亡对象；Go 1.5+ 起并发清扫，Go 1.14+ 异步清扫（background goroutine + 分配时 lazy sweep），业务在大部分 sweep 期间照常运行

**Sweep 两种并发机制**：

- **Background sweep**：后台 goroutine 持续清扫 span
- **Lazy sweep**：业务 `new` 分配时，顺带清扫对应 span 的空闲槽位

```
Mark:   [STW 开始] → [并发标记，业务并行] → [STW termination]
Sweep:  [可能极短 STW 启动/状态切换] → [并发/异步清扫，业务并行] → ...
```

**写屏障（混合写屏障，Go 1.8+）**：

并发标记时，业务代码可能在「黑对象」上写入指向「白对象」的指针，若不处理会漏标。混合写屏障规则（简化）：

- 写指针时：若新值是白色，标灰；同时 shade 旧值
- 保证：**存活对象不会被误回收**（强三色不变性 / 弱三色配合）

**STW 出现在哪**（共三处，均极短）：

| 同步点 | 做什么 | 说明 |
| --- | --- | --- |
| 标记开始 | 短暂 STW，准备 root scan | 固定、可预期 |
| mark termination | 短暂 STW，flush 写屏障缓冲、处理剩余 work | 固定、可预期 |
| sweep 阶段的少数同步点 | 清扫启动或状态切换时的短 STW | **不是整段 sweep 都 STW**；Go 1.5+ 大幅缩短，Go 1.14+ 通常 < 1ms（负载相关） |

与 Mark 对比：Mark 的 STW 点固定好记；Sweep 的 STW 更短、更分散，且随 Go 版本演进持续缩短，日常调优不必死盯 sweep STW。

**GOGC 与调优**：

```bash
GOGC=100   # 默认：堆增长到上次 GC 后存活量的 100% 时触发下一轮
GOGC=200   # 触发频率降低，内存占用升高，GC CPU 下降
GOGC=50    # 更频繁 GC，内存更省，GC CPU 升高

GODEBUG=gctrace=1 ./your-app
# 输出每轮 GC：时间戳、GC 次数、堆大小、STW 时间、并发标记时间等
```

**实战建议**：

- CPU 密集型服务：默认 GOGC 通常够用；若 GC 占 CPU 高，先查 `alloc_space`（pprof）找分配热点
- 内存敏感型：可适当降低 GOGC 或设 `debug.SetMemoryLimit`（Go 1.19+）做软上限
- **ballast**（大数组占位）：Go 1.20 前后行为有变，生产慎用，需压测验证
- 根本手段：sync.Pool 复用、预分配、避免`热路径 interface{}` 装箱、减少短生命周期大对象

**常见误区**：

- 认为 GC 会随时 STW 停掉所有 goroutine —— 实际 Mark/Sweep 主体期业务几乎不受影响
- 把「sweep 部分阶段 STW」理解成「只清扫一部分对象」—— 实际是 sweep **阶段里**只有**少数同步子步骤**会 STW，清扫工作本身是并发/异步的
- 只调 GOGC 不查分配 —— 治标不治本

---

#### G3. goroutine、channel、select 使用边界？

**思路**：CSP；channel 协调，mutex 保护共享状态。

**参考答案**：

**面试怎么讲**：Go 推荐「通过通信共享内存」，channel 负责 **所有权转移与同步**，mutex 负责 **保护共享可变状态**。goroutine 便宜但不免费，要有退出路径和背压控制。

**goroutine 使用边界**：

```go
// 正确：有 ctx 取消 + WaitGroup 等待
func worker(ctx context.Context, jobs <-chan Job, wg *sync.WaitGroup) {
    defer wg.Done()
    for {
        select {
        case <-ctx.Done():
            return
        case job, ok := <-jobs:
            if !ok { return }
            process(job)
        }
    }
}
```

- 每个 `go func()` 都应有 **退出条件**（ctx、closed channel、timeout）
- 避免无界 goroutine：来一条请求起一个，高 QPS 会 OOM 或调度延迟飙升
- `runtime.NumGoroutine()` 持续涨 → 典型泄漏信号

**channel 选型**：


| 类型                    | 行为                    | 典型场景         |
| --------------------- | --------------------- | ------------ |
| 无缓冲 `make(chan T)`    | send/recv 必须同时就绪，同步握手 | 任务交接、信号通知    |
| 有缓冲 `make(chan T, n)` | 满则 send 阻塞，空则 recv 阻塞 | 生产者-消费者队列、限流 |


```go
// 背压：buffer 满时生产者阻塞，天然限流
jobs := make(chan Job, 100)
```

**select 要点**：

```go
select {
case v := <-ch1:
    // 处理
case ch2 <- x:
    // 发送
case <-time.After(3 * time.Second):
    // 超时
case <-ctx.Done():
    return ctx.Err()
default:
    // 非阻塞：立即走 default，不等待
}
```

- 多个 case 同时就绪：**伪随机** 选一个，避免饥饿但不保证公平
- `default` 用于非阻塞尝试，忙轮询会烧 CPU，应加 `time.Sleep` 或改 blocking select

**channel vs mutex 原则**：

- **数据所有权转移** → channel（谁 recv 谁负责处理/释放）
- **共享计数器、缓存 map、配置快照** → mutex / atomic
- 不要用语义模糊的 channel 当锁（可读性差、易死锁）

**典型死锁场景**：

```go
ch := make(chan int) // 无缓冲
ch <- 1              // 永久阻塞：没有 receiver

// 互相等待
// goroutine A: ch1 <- x 等 B 从 ch1 读
// goroutine B: ch2 <- y 等 A 从 ch2 读
```

**Worker Pool 模板**：

```go
func pool(ctx context.Context, n int, jobs <-chan Job) {
    var wg sync.WaitGroup
    for i := 0; i < n; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for job := range jobs { // jobs 由上游 close
                select {
                case <-ctx.Done():
                    return
                default:
                    process(job)
                }
            }
        }()
    }
    wg.Wait()
}
```

---

#### G4. mutex / rwmutex / atomic / sync.Map 怎么选？

**思路**：按读写比例、数据结构选原语。

**参考答案**：

**面试怎么讲**：没有「万能锁」，按 **读写比例、数据形状、竞争程度** 选型。Mutex 最简单可靠；RWMutex 读多写少时有优势但写会阻塞所有读写；atomic 适合单值；sync.Map 适合特定只增不减或读极多场景。

**选型表**：


| 场景                   | 选型               | 说明                    |
| -------------------- | ---------------- | --------------------- |
| 读写均衡 / 写多            | `sync.Mutex`     | 默认首选，简单不易错            |
| 读多写少                 | `sync.RWMutex`   | 多个 RLock 可并行；Lock 时独占 |
| 简单计数/标志/指针 swap      | `atomic`         | 无锁单变量，性能最好            |
| 读极多、key 集合较稳定        | `sync.Map`       | 内置 read/dirty 双 map   |
| 复杂结构 + 多字段 invariant | `Mutex` + 普通 map | 业务逻辑需要原子性更新整块结构       |


**代码示例**：

```go
// Mutex + map：最常用
type SafeCache struct {
    mu sync.Mutex
    m  map[string]string
}

func (c *SafeCache) Get(k string) (string, bool) {
    c.mu.Lock()
    defer c.mu.Unlock()
    v, ok := c.m[k]
    return v, ok
}

// atomic 计数
var reqCount atomic.Int64
reqCount.Add(1)

// RWMutex 读多写少
type Config struct {
    mu   sync.RWMutex
    data map[string]string
}
func (c *Config) Get(k string) string {
    c.mu.RLock()
    defer c.mu.RUnlock()
    return c.data[k]
}
```

**RWMutex 写饥饿**：大量读锁持续占用时，写锁可能长时间等待（Go 1.18+ 对 starving writer 有优化，但仍需避免长时间 RLock 内做 IO）。

**sync.Map 注意**：

- `Load`/`Store`/`LoadOrStore`/`Range` 语义与普通 map 不同，**没有 Len**
- 适合：key 相对稳定、读 >> 写、或不同 goroutine 写不同 key
- 不适合：频繁 delete 全量 key、需要事务性批量更新

**atomic vs mutex**：单变量递增 atomic 比 mutex 快一个数量级；但 composite 操作（check-then-act）仍需 mutex：

```go
// 错误：非原子复合操作
if atomic.LoadInt64(&n) > 0 { atomic.AddInt64(&n, -1) } // 竞态

// 正确：用 mutex 或 atomic 提供的 CompareAndSwap
```

**常见误区**：

- 读多写少就无脑 RWMutex —— 写频繁时 RWMutex 可能比 Mutex 更慢
- sync.Map 当通用并发 map —— 大多数场景 Mutex+map 更清晰

---

#### G5. context 超时取消怎么传递到下游？

**思路**：树状 cancel；deadline 向下游传递。

**参考答案**：

**面试怎么讲**：`context` 是一棵取消树，父节点 cancel 或 deadline 到期，所有子节点自动失效。超时控制要从 **HTTP/gRPC 入口** 创建，逐层传给 DB/Redis/下游 RPC，每一层都要 respect `ctx.Done()`。

**入口创建**：

```go
func handler(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
    defer cancel() // 必须调用，释放 timer 资源

    result, err := svc.GetUser(ctx, id)
    if err != nil {
        if errors.Is(err, context.DeadlineExceeded) {
            http.Error(w, "timeout", http.StatusGatewayTimeout)
            return
        }
        // ...
    }
}
```

**HTTP 客户端传递**：

```go
req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
resp, err := http.DefaultClient.Do(req)
```

**gRPC 传递**：

```go
// 客户端：ctx 自动携带 deadline
resp, err := client.GetUser(ctx, &pb.Req{Id: id})

// trace-id 通过 metadata（与 cancel 独立）
md := metadata.Pairs("trace-id", traceID)
ctx = metadata.NewOutgoingContext(ctx, md)
```

**DB / Redis**：

```go
row := db.QueryRowContext(ctx, "SELECT ...", id)
// go-redis v9
val, err := rdb.Get(ctx, key).Result()
```

**下游 goroutine 必须监听取消**：

```go
go func() {
    select {
    case <-ctx.Done():
        return // 清理资源
    case result := <-workCh:
        // ...
    }
}()
```

**禁止事项**：

- **不要把 ctx 存进 struct 字段** —— ctx 是请求级生命周期，存 struct 会导致泄漏或用到过期 ctx
- **不要用 context.Value 传业务参数** —— 仅适合 trace-id、auth token 等横切关注点
- 父 cancel 后子 ctx 全部失效，不可「复活」

**Value 传递 trace（推荐模式）**：

```go
type ctxKey struct{}
func WithTraceID(ctx context.Context, id string) context.Context {
    return context.WithValue(ctx, ctxKey{}, id)
}
```

---

#### G6. nil interface 陷阱是什么？

**思路**：interface = (type, value)；typed nil 有类型信息。

**参考答案**：

**面试怎么讲**：interface 底层是 `(type, data)` 二元组。只有当 **type 和 data 都为 nil** 时，`i == nil` 才为 true。typed nil 指针（如 `(*User)(nil)`）赋给 interface 后 type 非 nil，导致「看起来是 nil 实际不是」的经典坑。

**经典示例**：

```go
var p *User = nil
var i interface{} = p
fmt.Println(i == nil) // false —— type=*User, data=nil

var err error = (*MyError)(nil)
fmt.Println(err == nil) // false —— 调用方 if err != nil 会进入错误分支！
```

**error 返回正确写法**：

```go
func findUser(id int) (*User, error) {
    if id <= 0 {
        return nil, ErrInvalidID // 哨兵 error，interface 有具体类型
    }
    // 未找到
    return nil, nil // 真正 nil error
}

// 若必须返回自定义 error 类型指针：
func bad() error {
    var e *MyError // nil 指针
    return e       // 危险！应 return nil
}
```

**检测与断言**：

```go
if err != nil { ... }           // 永远用这种方式判 error

v, ok := i.(User)               // comma-ok 断言
if !ok { /* 类型不匹配 */ }

switch x := i.(type) {
case *User:
    // ...
case nil:
    // 仅当 i 为 untyped nil
}
```

**JSON / ORM 场景**：`var u *User = nil` 序列化为 `"user": null` 是合理的；但作为 error 或 interface 返回值时要 conscious typed nil。

**常见误区**：

- `return nil, err` 中 err 是 typed nil 指针
- 用 `reflect.ValueOf(i).IsNil()` 前未检查 Kind 是否为 Ptr/Chan/Map 等

---

#### G7. slice / map 常见坑？

**思路**：底层数组共享、并发写、扩容。

**参考答案**：

**面试怎么讲**：slice 是 `(ptr, len, cap)` 三元组，多个 slice 可共享底层数组；map 非线程安全，并发写直接 panic。理解共享与扩容规则才能避免数据串扰和性能陷阱。

**slice 共享底层数组**：

```go
s1 := []int{1, 2, 3, 4, 5}
s2 := s1[2:4]        // [3, 4]，与 s1 共享 array
s2[0] = 99           // s1 变成 [1, 2, 99, 4, 5]

// 安全拷贝
s3 := append([]int(nil), s1...) // 新底层数组
copy(dst, src)
```

**append 扩容规则**：

```go
s := make([]int, 0, 2)
s = append(s, 1, 2)   // cap=2, len=2
s = append(s, 3)      // cap 扩容（通常翻倍），可能新 array，旧 slice 不受影响
sub := s[:2]
s = append(s, 4, 5)   // 若 cap 足够且 sub 仍引用同一 array，可能覆盖 sub 可见元素
```

**传 slice 给函数**：修改元素可见（共享），append 可能不反映到 caller（若未 re-slice 返回）。

**map 并发**：

```go
// 并发写 —— fatal error: concurrent map writes
go func() { m["a"] = 1 }()
go func() { m["b"] = 2 }()

// 读 + 写也需要 sync.Mutex 或 sync.Map
```

**遍历时 delete**：

```go
for k, v := range m {
    if shouldDelete(v) {
        delete(m, k) // Go 允许，当前迭代继续
    }
}
// 大规模删除：重建新 map 有时更高效
```

**nil slice vs 空 slice**：

```go
var s1 []int           // nil, len=0, JSON → null
s2 := []int{}          // 非 nil, len=0, JSON → []
s3 := make([]int, 0)   // 同 s2，常用于表达「空但非 nil」
```

**性能提示**：大数据 `range map` 随机访问 cache 不友好；需要有序遍历可维护 `[]key` 索引。map 迭代顺序 **随机**，不要依赖顺序写测试。

---

#### G8. errors.Is / As / Wrap 怎么用？

**思路**：错误链 + 业务码分层。

**参考答案**：

**面试怎么讲**：Go 1.13+ 错误是可包装链，`%w` 保留 cause；`errors.Is` 判断哨兵，`errors.As` 提取类型。分层包装让日志有完整上下文，对外 API 映射统一错误码。

**包装与 unwrap**：

```go
func (r *userRepo) Get(ctx context.Context, id int64) (*User, error) {
    row := r.db.QueryRowContext(ctx, "...", id)
    if err := row.Scan(&u); err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, fmt.Errorf("userRepo.Get id=%d: %w", id, ErrNotFound)
        }
        return nil, fmt.Errorf("userRepo.Get id=%d: %w", id, err)
    }
    return &u, nil
}
```

**Is vs ==**：

```go
// 错误：包装后 == 失效
if err == ErrNotFound { ... }

// 正确：沿链查找
if errors.Is(err, ErrNotFound) {
    return http.StatusNotFound
}
```

**As 提取类型**：

```go
var pgErr *pgconn.PgError
if errors.As(err, &pgErr) && pgErr.Code == "23505" {
    return ErrDuplicateKey
}
```

**自定义 error 类型**：

```go
type BizError struct {
    Code    int
    Message string
    Cause   error
}

func (e *BizError) Error() string { return e.Message }
func (e *BizError) Unwrap() error { return e.Cause }

// 哨兵
var ErrNotFound = errors.New("not found")
```

**分层约定**：


| 层       | 职责                      | 示例                                                     |
| ------- | ----------------------- | ------------------------------------------------------ |
| DAO     | 包装 IO/驱动错误，映射 ErrNoRows | `fmt.Errorf("query user: %w", err)`                    |
| Service | 包装业务语义                  | `fmt.Errorf("create order: %w", ErrInsufficientStock)` |
| API     | Is/As 映射 HTTP/gRPC 码    | 404 / 409 / 500                                        |


**对外 vs 对内**：日志打 `%+v` 或 `fmt.Sprintf("%+v", err)` 含 stack（若用 pkg/errors）；HTTP 响应只返回安全 message，不泄露 SQL。

---

#### G9. pprof 定位 CPU / 内存 / goroutine 泄漏？

**思路**：采样 → 火焰图 → 修复 → benchmark 验证。

**参考答案**：

**面试怎么讲**：pprof 是 Go 性能排查标配。流程：复现 → 采 profile → 火焰图找 cum 热点 → 修复 → benchmark/profile 对比验证。生产用 HTTP endpoint 或 Continuous Profiling（Pyroscope/Datadog）。

**采集方式**：

```go
import _ "net/http/pprof"
go func() { log.Println(http.ListenAndServe(":6060", nil)) }()
```

```bash
# CPU 30 秒
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# 堆内存（在用空间）
go tool pprof http://localhost:6060/debug/pprof/heap

# goroutine
go tool pprof http://localhost:6060/debug/pprof/goroutine

# 阻塞 / 锁
go tool pprof http://localhost:6060/debug/pprof/block
go tool pprof http://localhost:6060/debug/pprof/mutex

# 测试内采集
go test -cpuprofile=cpu.prof -memprofile=mem.prof -bench=. ./...
go tool pprof -http=:0 cpu.prof   # 浏览器火焰图
```

**各 profile 关注点**：


| 类型          | 命令/视图                           | 排查目标                        |
| ----------- | ------------------------------- | --------------------------- |
| CPU         | `top` / `web` 火焰图，看 cum         | 热点函数、JSON 序列化、regexp        |
| Heap        | `inuse_space` / `inuse_objects` | 泄漏、未 close body、全局 cache 无界 |
| Goroutine   | 相同栈聚类                           | channel 阻塞、缺少 ctx 退出        |
| alloc_space | 累计分配                            | GC 压力源，即使 inuse 不大          |


**goroutine 泄漏典型栈**：

```
runtime.chanrecv
  yourpkg.worker
```

→ 检查是否永久阻塞在 channel recv 且无 consumer。

**排查流程**：

1. CPU 高但业务逻辑简单 → 先看 `alloc_space`，可能是 GC 在烧 CPU
2. 对比优化前后两次 profile（`go tool pprof -base=old.prof new.prof`）
3. 修复后用 `go test -benchmem` 确认 `allocs/op` 下降

**注意**：profile 有采样开销，生产采集控制 duration；heap profile 是 **采样时刻快照**，不是历史累计泄漏唯一证据，需多次对比 `inuse_objects` 是否单调涨。

---

#### G10. 表驱动测试与 `-race`？

**思路**：边界覆盖 + 竞态必测。

**参考答案**：

**面试怎么讲**：表驱动测试把 **输入/期望/场景名** 结构化，子测试 `t.Run` 隔离失败；`-race` 是并发代码必跑项，CI 强制开启。Mock 依赖接口，单元测与集成测分层。

**表驱动模板**：

```go
func TestAdd(t *testing.T) {
    tests := []struct {
        name string
        a, b int
        want int
    }{
        {"positive", 1, 2, 3},
        {"zero", 0, 0, 0},
        {"negative", -1, 1, 0},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            if got := Add(tt.a, tt.b); got != tt.want {
                t.Errorf("Add(%d,%d)=%d, want %d", tt.a, tt.b, got, tt.want)
            }
        })
    }
}
```

**边界覆盖清单**：空输入、零值、单元素、最大值、重复 key、非法参数、并发路径。

**Mock 策略**：

```go
type UserRepo interface {
    Get(ctx context.Context, id int64) (*User, error)
}

// 手写 fake（推荐简单场景）
type fakeRepo struct{ users map[int64]*User }

// testify/mock 或 gomock 适合复杂交互验证
```

**CI 命令**：

```bash
go test ./... -race -count=1 -cover -timeout 5m
```

- `-race`：检测 data race，CI 必开，约 2~10x  slowdown
- `-count=1`：禁用 test cache，避免 race 结果被缓存掩盖
- `-cover`：覆盖率参考，不追求 100%

**测试分层**：


| 层级  | 工具                              | 范围               |
| --- | ------------------------------- | ---------------- |
| 单元  | 表驱动 + mock                      | 纯函数、domain logic |
| 集成  | testcontainers / docker-compose | DB、Redis 真实交互    |
| E2E | httptest / 真实环境                 | 全链路 API          |


**常见误区**：表驱动里共用可变全局状态导致 `-race` 失败；子测试并行 `t.Parallel()` 与共享资源冲突。

---

#### G11. GOMAXPROCS 与 GMP 调度模型？

**思路**：G 协程、M 系统线程、P 逻辑处理器。

**参考答案**：

**面试怎么讲**：GMP 中 G 是 goroutine，M 是 OS 线程，P 是逻辑处理器（本地 runq + 调度上下文）。`GOMAXPROCS` 控制 P 的数量，默认等于 CPU 核数。M 阻塞时 P 可移交其他 M，保证 CPU 不闲置。

**模型关系**：

```
G (goroutine)  —— 用户态协程，几 KB 栈，可扩缩
M (machine)    —— 内核线程，执行 G 的实际载体
P (processor)  —— 逻辑 CPU，持有 local run queue，数量 = GOMAXPROCS
```

**调度流程（简化）**：

1. G 在 P 的 local runq 等待执行
2. M 绑定 P 后从 runq 取 G 运行
3. G 系统调用阻塞 → M 与 P 分离，P 交给其他 M（或 idle M 池）
4. work stealing：P 的 runq 空时从其他 P 偷一半 G

**GOMAXPROCS 设置**：

```go
runtime.GOMAXPROCS(runtime.NumCPU()) // 默认已是 NumCPU
```

- CPU 密集型：默认即可，设过大反而增加上下文切换
- 容器环境：Go 1.25 前需关注 cgroup CPU quota，可能需 `automaxprocs` 库；新版本已改进
- IO 密集型：阻塞多，默认 P 数通常够用；瓶颈常在 IO 而非 P 数

**阻塞与调度**：

- 网络 IO：netpoller 异步，G 不长期占 M
- channel/mutex 阻塞：G 挂起，M 可运行其他 G
- `runtime.LockOSThread()`：G 绑定 M，影响调度，仅 cgo/GUI 等场景

**排查**：

```bash
GODEBUG=schedtrace=1000,scheddetail=1 ./app  # 每秒打印调度 trace
curl localhost:6060/debug/pprof/threadcreate
```

**注意**：`runtime.NumGoroutine()` 只是快照；调度 **不保证 FIFO** 公平，不要依赖 goroutine 执行顺序写逻辑。

---

#### G12. sync.Pool 适用场景与坑？

**思路**：复用临时对象，减轻 GC；不是缓存。

**参考答案**：

**面试怎么讲**：`sync.Pool` 是 **GC 驱动的临时对象池**，不是通用缓存。对象可能在下轮 GC 时被清空。适合高频短生命周期对象（buffer、临时 struct），Get 后必须 Reset，归还前清理敏感字段。

**基本用法**：

```go
var bufPool = sync.Pool{
    New: func() any {
        return make([]byte, 0, 4096)
    },
}

func handle(w http.ResponseWriter, r *http.Request) {
    b := bufPool.Get().([]byte)
    defer func() {
        b = b[:0] // Reset 长度，保留 cap
        bufPool.Put(b)
    }()
    // 使用 b...
}
```

**适用场景**：

- `bytes.Buffer` / `[]byte` 复用
- 框架层临时对象（如 Gin `Context` 通过 pool 复用）
- 解码器临时 slice（json/protobuf decode）

**不适合**：

- 长生命周期缓存（用 LRU / freecache）
- 带连接/文件句柄的对象
- 需要稳定命中率的池（Pool 随时可能被 GC 清空）

**坑点**：

1. **Get 后未 Reset**：上一请求数据泄漏到下一请求（安全 + 正确性）
2. **Put 了仍被引用的对象**：并发读写同一块 buffer
3. **Pool 当 cache**：GC 清空后仍重新分配，性能不稳定
4. **对象过大**：Pool 持有大对象会抬高 heap baseline，影响 GC

**Gin Context 启示**：归还 Pool 前必须 `Reset()` 清空 keys、请求引用，否则内存泄漏 + 数据串扰。

---

#### G13. channel 关闭原则？

**思路**：只 sender close；receiver 用 range 或 ok 模式。

**参考答案**：

**面试怎么讲**：channel 关闭是 **发送方的信号**——「不会再有新数据」。只 close 一次，由 sender close；receiver 用 `range` 或 `v, ok := <-ch` 检测结束。close 不是取消机制，取消用 context。

**黄金法则**：

1. **只在 sender 端 close**
2. **不要 close 接收端** —— receiver 无法知道是否还有 sender 在写
3. **不要 close 已关闭的 channel** —— panic
4. **nil channel** 上 send/recv 永久阻塞（有时故意用于 disable case）

**接收模式**：

```go
// range 自动检测 close
for v := range ch {
    process(v)
}

// 手动 ok 检测
for {
    v, ok := <-ch
    if !ok {
        break // 已关闭且 drained
    }
    process(v)
}
```

**fan-in 合并**：

```go
func merge(ctx context.Context, cs ...<-chan int) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup
    wg.Add(len(cs))
    for _, c := range cs {
        go func(ch <-chan int) {
            defer wg.Done()
            for v := range ch { // 各 upstream 由各自 sender close
                select {
                case out <- v:
                case <-ctx.Done():
                    return
                }
            }
        }(c)
    }
    go func() {
        wg.Wait()
        close(out) // 唯一 close out 的地方
    }()
    return out
}
```

**close 后的行为**：


| 操作                    | 结果               |
| --------------------- | ---------------- |
| recv 已关闭且空            | 立即返回零值, ok=false |
| send 已关闭              | panic            |
| close 已关闭             | panic            |
| send/recv nil channel | 永久阻塞             |


**常见误区**：用 close 通知多个 receiver「退出」—— 若仍有 sender 在写会 panic；应用 `context.Cancel` 广播退出，channel 只传数据。

---

#### G14. defer / panic / recover 边界？

**思路**：defer 逆序执行；recover 仅在 defer 内有效。

**参考答案**：

**面试怎么讲**：`defer` 在函数 return 前 **LIFO** 执行，常用于资源释放；`panic` 应仅用于不可恢复编程错误；`recover` 只能拦当前 goroutine 的 panic，且必须在 defer 中调用。业务错误一律 `return err`。

**defer 机制**：

```go
func example() (n int) {
    defer func() { n++ }() // defer 修改命名返回值
    return 1               // 实际返回 2
}
```

**循环 defer 陷阱**：

```go
// 错误：所有 defer 在函数结束时才执行，文件可能同时打开很多
for _, path := range paths {
    f, _ := os.Open(path)
    defer f.Close()
}

// 正确：包一层函数
for _, path := range paths {
    func() {
        f, _ := os.Open(path)
        defer f.Close()
        // ...
    }()
}
```

**defer 性能**：Go 1.14+ defer 开销已大幅降低，热路径仍可显式 close 再 benchmark 对比。

**panic / recover**：

```go
func recoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if rec := recover(); rec != nil {
                log.Printf("panic: %v\n%s", rec, debug.Stack())
                http.Error(w, "internal error", 500)
            }
        }()
        next.ServeHTTP(w, r)
    })
}
```

- `recover()` 仅在 **defer 直接调用** 时有效
- recover 后程序从 panic 点 **不会继续执行**，仅阻止栈展开摧毁进程
- 每个 goroutine 独立：子 goroutine panic 不会被子 recover 捕获

**边界建议**：


| 场景                 | 做法                           |
| ------------------ | ---------------------------- |
| 业务错误（参数非法、未找到）     | `return err`                 |
| 编程错误（invariant 破坏） | panic（测试）或 log + return 500  |
| HTTP 服务            | 最外层 middleware recover       |
| init / main        | panic 导致进程无法启动，init 避免 panic |


**生产原则**：少 panic，多 error；panic 栈应打日志含 `debug.Stack()`。

---

#### G15. interface 底层 itab / efaced？

**思路**：iface 有 itab（含方法表）；eface 仅类型+数据。

**参考答案**：

**面试怎么讲**：非空 interface（iface）= data pointer + itab（类型元信息 + 方法表）；空 interface（eface / `any`）= type pointer + data pointer，无方法表。动态分派通过 itab 查函数指针；理解这个能解释 nil interface、逃逸、类型断言。

**内存布局**：

```
iface (如 io.Reader)
┌─────────┬─────────┐
│  tab    │  data   │
│ (*itab) │ (ptr)   │
└─────────┴─────────┘
itab: inter type, concrete type, method table...

eface (interface{} / any)
┌─────────┬─────────┐
│ _type   │  data   │
└─────────┴─────────┘
```

**itab 创建**：首次将具体类型赋给 interface 时，runtime 查找或生成 itab（方法集匹配）。因此首次转换有小开销，之后会缓存。

**动态派发**：

```go
var r io.Reader = os.Stdin
r.Read(buf) // 通过 itab 找到 *os.File 的 Read 方法地址
```

**类型断言**：

```go
f, ok := r.(*os.File)
// runtime 比较 itab 中 concrete type 与 *os.File
```

**与逃逸的关系**：小值赋给 interface 会 **装箱**（heap allocate），如 `var i interface{} = 42` 中 42 可能逃逸；传指针有时反而减少拷贝但增加堆分配。

**方法集规则**：

- `T` 方法集：值接收者方法
- `*T` 方法集：值 + 指针接收者方法
- 值 `T` 赋给 interface 若方法集在 `*T` 上，会自动取地址（可能逃逸）

**断言失败**：`v, ok := i.(T)` 安全；`i.(T)` 失败 panic。type switch 处理多类型。

---

#### G16. benchmark 与 fuzz 测试？

**思路**：bench 比性能；fuzz 找边界 crash。

**参考答案**：

**面试怎么讲**：benchmark 测稳定环境下的吞吐/延迟/allocs；fuzz（Go 1.18+）自动变异输入找 panic/崩溃边界。benchmark 要防编译器优化（结果赋给包级变量）；对比用 `benchstat` 多次运行。

**benchmark 模板**：

```go
var result int // 防止 DCE（dead code elimination）

func BenchmarkParse(b *testing.B) {
    data := loadTestData()
    b.ResetTimer()
    b.ReportAllocs()
    for i := 0; i < b.N; i++ {
        result, _ = Parse(data)
    }
}
```

**常用命令**：

```bash
go test -bench=BenchmarkParse -benchmem -count=5 ./...
go test -bench=. -cpuprofile=cpu.prof -memprofile=mem.prof
go install golang.org/x/perf/cmd/benchstat@latest
benchstat old.txt new.txt   # 对比两次结果，看 p-value
```

**关注指标**：

- `ns/op`：每次操作耗时
- `B/op`、`allocs/op`：分配字节与次数（GC 敏感代码必看）

**benchmark 注意**：

- 关闭 CPU 频率缩放、固定 `-count` 多次取稳
- `-benchtime=3s` 延长单轮
- 并行 benchmark：`b.RunParallel` 测多核
- 子 benchmark：`b.Run("size=1K", ...)` 分场景

**fuzz 测试**：

```go
func FuzzParse(f *testing.F) {
    f.Add([]byte(`{"id":1}`)) // seed corpus
    f.Fuzz(func(t *testing.T, data []byte) {
        _, _ = Parse(data) // 不应 panic
    })
}
```

```bash
go test -fuzz=FuzzParse -fuzztime=30s ./...
# corpus 存入 testdata/fuzz/FuzzParse/
```

**fuzz 适用**：解析器、解码器、压缩、权限校验等接受 []byte/string 的入口。

**fuzz vs bench**：fuzz 找正确性边界；bench 测性能回归。发版前 corpus 提交仓库，CI 可 `-fuzztime=10s` 冒烟。

---

#### G17. 反射 reflect 使用边界？

**思路**：运行时类型信息，慢且 lose compile-time check。

**参考答案**：

**面试怎么讲**：反射在 **运行时** Inspect/Modify 类型信息，比直接调用慢 1~2 数量级，且无编译期检查。适用序列化框架、ORM、DI、通用导出；热路径业务逻辑应改用 **代码生成**。

**基本操作**：

```go
v := reflect.ValueOf(x)
t := reflect.TypeOf(x)

// 修改需传指针且字段可导出
v = reflect.ValueOf(&x).Elem()
if v.Field(0).CanSet() {
    v.Field(0).SetInt(42)
}

// 动态调用方法
m := v.MethodByName("String")
m.Call(nil)
```

**Struct tag 驱动（典型合理用法）**：

```go
type User struct {
    ID   int    `json:"id" excel:"用户ID"`
    Name string `json:"name" validate:"required"`
}
// encoding/json、validator、excelize 内部用反射读 tag
```

**适用场景**：


| 场景                  | 示例                     |
| ------------------- | ---------------------- |
| 序列化/反序列化            | `encoding/json`        |
| ORM / SQL builder   | GORM、ent schema        |
| 依赖注入                | wire（编译期生成，运行时无反射）     |
| 通用 DeepEqual / copy | testify, copier        |
| API 参数校验            | validator 读 struct tag |


**不适用**：订单计算、支付路由等热路径；应用 **代码生成** 替代：

```bash
go generate  # stringer, mockgen, ent, protobuf
```

**性能对比（量级）**：

- 直接调用：~1ns
- 反射调用：~100ns+，且难 inline
- 可先用反射原型验证，性能不达标再 codegen

**安全边界**：

- `reflect.Value.Interface()` 仅在 `CanInterface()` 为 true 时用（可导出字段）
- `reflect.ValueOf(nil)` 无效，要先判 `IsValid()`
- 修改 unexported field：`unsafe` + reflect 可破，但破坏封装，仅测试/debug

**面试结论句**：反射是框架作者的工具，业务代码优先显式类型 + 代码生成；若必须用，缓存 `reflect.Type`/`Value` 减少重复解析。

---

<h3 id="c-5-2" class="mh2">2. 框架与工程化</h3>

#### G18. Gin Radix Tree 路由为何优于 map？

**思路**：前缀/参数路由；中间件链。

**参考答案**：

**为什么不用 map？** 简单 `map[string]Handler` 只能做精确路径匹配；REST API 普遍需要 `:id`、`*filepath` 等参数路由。Gin 基于 **httprouter** 的 **radix tree（压缩前缀树）**，按路径段逐层匹配，时间复杂度与路径**段数**相关（通常 O(k)，k 很小），而非路由表总条目数。

**9 棵树 + 路由组**：

```go
r := gin.New()
r.Use(gin.Recovery(), gin.Logger()) // 全局中间件

v1 := r.Group("/api/v1", AuthMiddleware())
{
    v1.GET("/users/:id", getUser)            // 参数节点
    v1.GET("/static/*filepath", serveStatic) // 通配节点
    admin := v1.Group("/admin", AdminOnly()) // 子组叠加中间件
    admin.DELETE("/users/:id", deleteUser)
}
```

Gin 为 GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS/CONNECT/TRACE 各维护一棵独立 radix tree，避免方法维度冲突；`Group` 共享前缀并挂载中间件链，子组继承父组中间件。

**Context 与 sync.Pool**：

```go
// gin/context.go 核心思路：每个请求从 Pool Get，处理完 Put
func (c *Context) reset() {
    c.Writer = nil
    c.Request = nil
    c.Params = c.Params[:0]
    c.Keys = nil
    c.Errors = c.Errors[:0]
    c.Accepted = nil
    c.index = -1 // 归零，否则中间件链状态泄漏
}
```

**生产注意**：

- 高基数动态路由（如 `/user/:uuid` 百万级不同路径）会使 tree 节点膨胀，影响匹配与内存；**静态路由优先注册**，参数路由放后
- 不要在 `Context.Keys` 存大对象或敏感信息未清理就归还 Pool
- 路由冲突（同路径同方法重复注册）启动时 panic，CI 里应有集成测试覆盖路由表

**对比 trade-off**：map O(1) 精确匹配更快，但无法表达 REST 语义；标准库 `ServeMux` Go 1.22+ 也支持 `{id}` 模式，Gin 优势在于中间件生态、性能基准与工程成熟度。

---

#### G19. 中间件链顺序怎么设计？

**思路**：越外层越通用；Recovery 最外。

**参考答案**：

**推荐顺序（外 → 内）**：

```
Recovery → Trace/RequestID → Logger → CORS → Auth → RateLimit → Timeout → 业务 Handler
```

**各层职责与原因**：


| 中间件             | 位置               | 原因                                                  |
| --------------- | ---------------- | --------------------------------------------------- |
| Recovery        | 最外               | 必须 catch 内层所有 panic，含 Logger/Auth 内的 panic          |
| Trace/RequestID | 早                | 后续 Logger、Auth、业务日志都需 trace_id                      |
| Logger          | Auth 前或包装 Writer | 需记录最终 status/latency；用 `responseWriter` 包装捕获 status |
| CORS            | Auth 前           | 预检 OPTIONS 不应被 Auth 拦截返回 401                        |
| Auth            | RateLimit 前      | 先识别 tenant/user，才能做 per-tenant 限流                   |
| RateLimit       | 业务前              | 未认证流量也应限流（防 DDoS）                                   |
| Timeout         | 最贴近 Handler      | 只约束业务耗时，不含外层 middleware 开销                          |


**Logger 包装示例**（读取 status 必须在 Handler 返回后）：

```go
type respWriter struct {
    gin.ResponseWriter
    status int
}

func (w *respWriter) WriteHeader(code int) {
    w.status = code
    w.ResponseWriter.WriteHeader(code)
}

func LoggerMiddleware(log *zap.Logger) gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        rw := &respWriter{ResponseWriter: c.Writer, status: 200}
        c.Writer = rw
        c.Next()
        log.Info("request",
            zap.String("trace_id", c.GetString("trace_id")),
            zap.Int("status", rw.status),
            zap.Duration("latency", time.Since(start)),
        )
    }
}
```

**Recovery 示例**：

```go
func RecoveryMiddleware(log *zap.Logger) gin.HandlerFunc {
    return func(c *gin.Context) {
        defer func() {
            if r := recover(); r != nil {
                log.Error("panic recovered",
                    zap.Any("panic", r),
                    zap.ByteString("stack", debug.Stack()),
                )
                c.AbortWithStatusJSON(500, gin.H{"code": 50001, "message": "internal error"})
            }
        }()
        c.Next()
    }
}
```

**设计原则**：中间件只做横切关注点（鉴权、日志、限流），**禁止写重业务逻辑**；每个 middleware 应可独立单测（`httptest.NewRecorder` + mock `Next`）；用 `c.Abort()` 短路时外层 Logger 仍应执行；条件中间件用 Group 隔离：`r.Group("/internal").Use(IPWhitelist())`。

---

#### G20. Kratos 分层 API / Service / Biz / Data？

**思路**：依赖单向；Biz 无 SQL。

**参考答案**：

Kratos 推荐**整洁架构**变体，依赖方向严格单向：API → Service → Biz → Data，**禁止跳层**（API 直接调 Data repo）。


| 层       | 职责                           | 典型代码                                                |
| ------- | ---------------------------- | --------------------------------------------------- |
| API     | proto/HTTP 绑定、参数校验、错误码映射     | `api/user/v1/user.proto` + `RegisterUserHTTPServer` |
| Service | DTO ↔ DO 转换，编排多个 Biz UseCase | `service/user.go` 实现 `UserServiceServer`            |
| Biz     | 领域规则、事务边界、领域实体               | `biz/user.go` 定义 `UserUsecase` + `UserRepo` 接口      |
| Data    | repo 实现、GORM/Redis/MQ        | `data/user.go` 实现 `biz.UserRepo`                    |


**目录结构示例**：

```
internal/
  service/user.go      # 实现 pb.UserServiceServer
  biz/user.go          # UserUsecase + UserRepo interface
  data/user.go         # type userRepo struct{ data *Data }
  data/data.go         # DB/Redis/MQ 连接聚合
```

**Biz 层示例**（无 SQL、无 HTTP）：

```go
// biz/user.go
type UserRepo interface {
    GetByID(ctx context.Context, id int64) (*User, error)
    Save(ctx context.Context, u *User) error
}

type UserUsecase struct {
    repo UserRepo
    log  *log.Helper
}

func (uc *UserUsecase) Transfer(ctx context.Context, from, to int64, amount decimal.Decimal) error {
    return uc.repo.InTx(ctx, func(ctx context.Context) error {
        // 事务内多 repo 操作：扣款、加款、写流水
        ...
    })
}
```

**Service 层只做转换**：

```go
func (s *UserService) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserReply, error) {
    u, err := s.uc.GetByID(ctx, req.Id)
    if err != nil {
        return nil, err
    }
    return &pb.GetUserReply{Id: u.ID, Name: u.Name}, nil
}
```

**Wire 编译期 DI**：

```go
// wire.go
//go:build wireinject
func wireApp(*conf.Server, *conf.Data, log.Logger) (*kratos.App, func(), error) {
    panic(wire.Build(server.ProviderSet, data.ProviderSet, biz.ProviderSet, service.ProviderSet, newApp))
}
```

运行 `wire` 生成 `wire_gen.go`，依赖关系编译期校验，无运行时反射容器。

**事务边界**：在 **Biz 或 Service** 开启，不在 API 层；Data 层提供 `InTx(ctx, fn)`；跨聚合根事务尽量缩小范围，避免长事务锁表。Biz 层接口由**使用方（Biz）定义**，Data 层实现——方便 mock 测试。

---

#### G21. Wire 依赖注入 vs 全局变量？

**思路**：显式依赖、可测试。

**参考答案**：

**全局变量的问题**：

```go
var DB *gorm.DB   // 反模式
var Redis *redis.Client

func GetUser(id int64) (*User, error) {
    return query(DB, id) // 测试无法替换 DB；init 顺序难控
}
```

隐式耦合、单测必须连真实 DB、多环境切换困难。

**Wire 工作流**：

```go
// internal/data/data.go
type Data struct { db *gorm.DB }
func NewData(c *conf.Data) (*Data, func(), error) { ... }

// internal/biz/user.go
func NewUserUsecase(repo UserRepo, logger log.Logger) *UserUsecase { ... }

// internal/data/user.go
func NewUserRepo(data *Data) biz.UserRepo { return &userRepo{data: data} }

// cmd/server/wire.go
//go:build wireinject
func InitializeApp(cfg *Config) (*App, func(), error) {
    wire.Build(data.NewData, data.NewUserRepo, biz.NewUserUsecase, service.NewUserService, NewHTTPServer)
    return nil, nil, nil
}
```

```bash
go install github.com/google/wire/cmd/wire@latest
cd cmd/server && wire   # 生成 wire_gen.go，提交到仓库
```

**构造函数注入**：

```go
func NewUserService(repo UserRepo, logger *zap.Logger) *UserService {
    return &UserService{repo: repo, logger: logger}
}
```

**单测 mock**（**接口由 consumer 定义**）：

```go
type mockUserRepo struct{ mock.Mock }

func (m *mockUserRepo) GetByID(ctx context.Context, id int64) (*User, error) {
    args := m.Called(ctx, id)
    return args.Get(0).(*User), args.Error(1)
}

func TestGetUser(t *testing.T) {
    repo := new(mockUserRepo)
    repo.On("GetByID", mock.Anything, int64(1)).Return(&User{ID: 1}, nil)
    svc := NewUserService(repo, zap.NewNop())
    ...
}
```

**trade-off**：Wire 增加代码生成步骤，但编译期发现循环依赖；小脚本可用 `fx` 换灵活，大型服务推荐 Wire。避免「半 DI」混用全局变量。

---

#### G22. Viper / Nacos / Apollo 配置策略？

**思路**：启动配置 vs 运行期热更。

**参考答案**：

**配置分层策略**：


| 类型    | 存放位置               | 示例             | 是否热更            |
| ----- | ------------------ | -------------- | --------------- |
| 启动配置  | 本地文件 + 环境变量        | 端口、DB DSN、环境名  | 否，改后重启          |
| 运行期配置 | Nacos / Apollo     | 功能开关、限流阈值、降级开关 | 是，watch 回调      |
| 密钥    | Vault / K8s Secret | DB 密码、JWT 私钥   | 否，**永不进配置中心明文** |


**Viper 本地 + 环境变量**：

```go
viper.SetConfigName("config")
viper.SetConfigType("yaml")
viper.AddConfigPath("./configs")
viper.AutomaticEnv()
viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
viper.ReadInConfig()
viper.Unmarshal(&cfg)
```

```yaml
# configs/config.yaml
server:
  port: 8080
  name: user-service
log:
  level: info
```

**Nacos 热更**：

```go
client.ListenConfig(vo.ConfigParam{
    DataId: "user-service.yaml",
    Group:  "DEFAULT_GROUP",
    OnChange: func(_, _, _, data string) {
        var newCfg Config
        if err := yaml.Unmarshal([]byte(data), &newCfg); err != nil {
            log.Error("config reload failed, keep old", zap.Error(err))
            return // 热更失败保持旧值
        }
        atomic.StorePointer(&cfgPtr, unsafe.Pointer(&newCfg))
        // audit：记录变更人、时间、diff
    },
})
```

**生产 tips**：热更用 `atomic.Value` 或读写锁；不可热更项（端口、连接池）启动时校验；配置变更加 audit + 告警；敏感项 `${DB_PASSWORD}` 运行时从 Secret 注入；本地用 `config.local.yaml`（gitignore）。

---

#### G23. zap / zerolog 结构化日志规范？

**思路**：JSON、可检索、关联 trace。

**参考答案**：

**字段规范**（ELK/Loki 可检索）：


| 字段                      | 说明                 |
| ----------------------- | ------------------ |
| `trace_id`              | 全链路追踪 ID           |
| `request_id`            | 单服务内请求 ID          |
| `user_id` / `tenant_id` | 业务主体               |
| `method` / `path`       | HTTP 或 gRPC method |
| `latency_ms`            | 耗时                 |
| `status`                | HTTP status 或业务码   |
| `err`                   | 错误信息（配合 stack）     |


**zap 生产配置**：

```go
cfg := zap.NewProductionConfig()
cfg.Level = zap.NewAtomicLevelAt(zap.InfoLevel)
cfg.EncoderConfig.TimeKey = "ts"
cfg.Sampling = &zap.SamplingConfig{Initial: 100, Thereafter: 100}

logger, _ := cfg.Build(
    zap.AddCaller(),
    zap.AddStacktrace(zapcore.ErrorLevel), // Error 及以上带 stack
)
defer logger.Sync()
```

**请求级 logger**：

```go
func TraceMiddleware(log *zap.Logger) gin.HandlerFunc {
    return func(c *gin.Context) {
        traceID := c.GetHeader("X-Trace-Id")
        if traceID == "" { traceID = uuid.NewString() }
        c.Set("trace_id", traceID)
        c.Set("logger", log.With(
            zap.String("trace_id", traceID),
            zap.String("method", c.Request.Method),
            zap.String("path", c.Request.URL.Path),
        ))
        c.Next()
    }
}
```

**zerolog 等价**：`log.Info().Str("trace_id", id).Int("latency_ms", ms).Msg("done")`

**日志 vs metrics**：metrics 答「QPS、P99、错误率」；日志答「这一请求发生了什么」。高基数标签放日志，**不要**放 Prometheus label。

**高 QPS 优化**：异步 core `zapcore.NewAsync`；Debug 仅非 prod；热路径用结构化字段而非 `Sprintf`；注意背压（队列满时丢弃/阻塞）；Error stack 可采样减 IO。

---

#### G24. GORM N+1 与深分页？

**思路**：Preload/Joins；seek 分页。

**参考答案**：

**N+1 问题**：

```go
// 坏：1 次查 users + N 次查 orders
var users []User
db.Find(&users)
for _, u := range users {
    db.Where("user_id = ?", u.ID).Find(&u.Orders)
}
```

**解法 1 — Preload**：

```go
db.Preload("Orders").Find(&users)
db.Preload("Orders", "status = ?", "paid").Find(&users)
```

**解法 2 — Joins**（单次 SQL，注意重复行）：

```go
db.Joins("LEFT JOIN orders ON orders.user_id = users.id").Find(&users)
```

排查：`db.Debug()` 打印 SQL 数请求次数；`EXPLAIN` 看索引。

**深分页 — Seek（cursor）**：

```sql
-- 坏：OFFSET 100000 需扫描跳过 10 万行
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 100000;
```

```go
db.Where("id > ?", lastID).Order("id ASC").Limit(20).Find(&orders)
// API 返回 next_cursor = 最后一条 id
```

复合排序：`(created_at, id)` 唯一键做 tuple 比较。

**其他优化**：

```go
db.Select("id", "name").Find(&users)
db.CreateInBatches(users, 100)
db.Clauses(clause.OnConflict{UpdateAll: true}).Create()
```

读写分离：写后立即读走主库 `db.Clauses(dbresolver.Write)`。OFFSET 适合跳页 UI；cursor 适合 Feed，不支持随机跳页。

---

#### G25. ent / sqlx 何时替代 GORM？

**思路**：类型安全 vs 灵活 SQL。

**参考答案**：

**选型矩阵**：


| 场景             | 推荐                   | 原因           |
| -------------- | -------------------- | ------------ |
| 常规 CRUD、关联预加载  | GORM                 | 开发效率高        |
| Schema 即代码、图遍历 | ent                  | 编译期类型安全      |
| 复杂报表、窗口函数      | sqlx / raw SQL       | DBA 可 review |
| 批量导入、性能极致      | sqlx + prepared stmt | 少 ORM 反射     |


**ent 示例**：

```go
func (User) Fields() []ent.Field {
    return []ent.Field{field.String("name"), field.Time("created_at")}
}
func (User) Edges() []ent.Edge {
    return []ent.Edge{edge.To("orders", Order.Type)}
}
// go generate → client.User.Query().WithOrders().All(ctx)
```

**sqlx 示例**：

```go
db.SelectContext(ctx, &stats, `
    SELECT user_id, SUM(amount) as total FROM orders
    WHERE created_at >= $1 GROUP BY user_id HAVING SUM(amount) > $2
`, startDate, minAmount)
```

**混用策略**：同一项目按 repo 边界分——`orderRepo` 用 GORM CRUD，`reportRepo` 用 sqlx 报表；**不要**在同一事务混用不同 driver 连接。GORM 的 `Raw`/`Exec` 可过渡，长期复杂 SQL 应隔离到 sqlx。

---

#### G26. Redis 穿透 / 击穿 / 雪崩？

**思路**：三种模式三种解法。

**参考答案**：


| 问题  | 现象          | 对策                  |
| --- | ----------- | ------------------- |
| 穿透  | 查不存在 key    | 布隆过滤器 / 空值短 TTL     |
| 击穿  | 热点 key 过期   | singleflight / 互斥重建 |
| 雪崩  | 大量 key 同时过期 | TTL 抖动 + 多级缓存 + 限流  |


**穿透 — 空值缓存**：

```go
user, err := db.GetUser(id)
if errors.Is(err, ErrNotFound) {
    rdb.Set(ctx, key, "NULL", 60*time.Second)
    return nil, ErrNotFound
}
```

**击穿 — singleflight**：

```go
v, err, _ := g.Do(key, func() (interface{}, error) {
    u, err := db.GetUser(ctx, id)
    if err != nil { return nil, err }
    setRedis(ctx, key, u, ttlWithJitter(30*time.Minute))
    return u, nil
})
```

**雪崩 — TTL 抖动**：`base + rand(base/10)`

**分布式锁**：

```go
ok, _ := rdb.SetNX(ctx, lockKey, token, 10*time.Second).Result()
if ok {
    defer releaseLock(ctx, lockKey, token) // Lua: if get==token then del
    // 重建缓存；业务必须幂等
}
```

**缓存一致性**：接受短暂不一致；**写路径**先更 DB 再**删**缓存；强一致用 Canal/Debezium 监听 binlog。Redis 宕机：本地 LRU 二级缓存 + 限流降级。

---

#### G27. Kafka 消费组与幂等？

**思路**：at-least-once + 消费端幂等。

**参考答案**：

**消费组基础**：

```go
reader := kafka.NewReader(kafka.ReaderConfig{
    Brokers: []string{"kafka:9092"},
    GroupID: "order-consumer",
    Topic:   "orders",
})
```

同 GroupID 分摊 partition；rebalance 时 partition 重分配——`max.poll.interval.ms` 须大于最长处理时间，避免 rebalance 风暴。

**提交策略（at-least-once）**：

```go
msg, _ := reader.FetchMessage(ctx)
if err := handleOrder(msg.Value); err != nil {
    sendToDLQ(msg) // 死信队列
    continue
}
reader.CommitMessages(ctx, msg) // 业务成功后再 commit
```

**消费端幂等**：

```go
// 方案 1：唯一索引
db.Clauses(clause.OnConflict{DoNothing: true}).Create(&Order{ID: o.OrderID})

// 方案 2：去重表
db.Exec("INSERT INTO consumed_msgs(id) VALUES(?)", msgID) // duplicate → skip

// 方案 3：Redis SETNX
ok, _ := rdb.SetNX(ctx, "msg:"+msgID, 1, 7*24*time.Hour).Result()
```

**顺序消息**：Producer 同 key 进同 partition；消费端 key 级锁或单线程。

**积压监控**：`kafka_consumer_group_lag` 告警；consumer 数不超过 partition 数；DLQ 需 replay 工具。幂等 + 至少一次 = 有效恰好一次。

---

#### G28. gRPC vs REST / Protobuf 版本兼容？

**思路**：内 gRPC 外 REST。

**参考答案**：

**选型对比**：


| 维度  | gRPC       | REST          |
| --- | ---------- | ------------- |
| 协议  | HTTP/2 二进制 | HTTP/1.1 JSON |
| 流式  | 单向流、bidi   | SSE/WebSocket |
| 场景  | 微服务内部      | 公网 API、浏览器    |


**proto 版本兼容**：

```protobuf
message User {
  reserved 2, 15;
  reserved "legacy_field";
  int64 id = 1;
  string name = 3;
  optional string email = 4;
}
```

字段编号**只增不改**；删字段 `reserved`；不改字段类型；enum 新值旧客户端需默认分支。

**grpc-gateway 统一出口**：

```protobuf
rpc GetUser(GetUserRequest) returns (User) {
  option (google.api.http) = { get: "/v1/users/{id}" };
}
```

```bash
protoc --go_out=. --go-grpc_out=. --grpc-gateway_out=. user.proto
```

一份 proto 同时生成 gRPC server 与 REST gateway。breaking change 走 `user.v2` 新 package；CI 用 `buf breaking` 检测；deadline 用 `context.WithTimeout` 传递。

---

#### G29. JWT + Casbin / OPA 鉴权链路？

**思路**：Authentication ≠ Authorization。

**参考答案**：

**完整链路**：`Request → JWT(Authentication) → Casbin/OPA(Authorization) → Handler`

**JWT 中间件**：

```go
func JWTMiddleware(secret []byte) gin.HandlerFunc {
    return func(c *gin.Context) {
        tokenStr := strings.TrimPrefix(c.GetHeader("Authorization"), "Bearer ")
        claims := &Claims{}
        token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
            return secret, nil
        })
        if err != nil || !token.Valid {
            c.AbortWithStatusJSON(401, gin.H{"code": 40101, "message": "invalid token"})
            return
        }
        c.Set("sub", claims.Subject)
        c.Next()
    }
}
```

**Casbin 嵌入**：

```ini
# model.conf
[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
```

```go
ok, _ := enforcer.Enforce(userID, c.Request.URL.Path, c.Request.Method)
if !ok { c.AbortWithStatusJSON(403, ...) }
```

**OPA Sidecar**（多语言/K8s）：

```rego
allow { input.roles[_] == "admin" }
```

HTTP POST `http://localhost:8181/v1/data/authz/allow` 查策略。

**权限变更**：策略热 reload；**不依赖 JWT 内嵌角色**为唯一权威（JWT 签发后 roles 不变）。Refresh token 轮换：登录返 access(15min) + refresh(7d)；refresh 时旧 token 加黑名单(Redis)。敏感操作（转账、改密）需二次验证。

---

#### G30. 服务注册发现 Nacos / Consul？

**思路**：健康检查 + 客户端负载均衡。

**参考答案**：

**生命周期**：启动 → 注册 → 心跳保活 → 订阅方更新 → 下线反注册

**Nacos 注册**：

```go
sc.RegisterInstance(vo.RegisterInstanceParam{
    Ip: "10.0.1.5", Port: 8080,
    ServiceName: "user-service",
    Weight: 10, Healthy: true,
    Metadata: map[string]string{"version": "v1.2.0"},
})
defer sc.DeregisterInstance(...)
```

**客户端发现**（Kratos）：

```go
grpc.DialInsecure(ctx,
    grpc.WithEndpoint("discovery:///user-service"),
    grpc.WithDiscovery(r),
    grpc.WithBalancerName("round_robin"),
)
```

**K8s 内 vs 跨集群**：


| 场景        | 方案                   |
| --------- | -------------------- |
| 同集群 Pod   | K8s Service DNS      |
| 跨集群/非 K8s | Nacos / Consul       |
| 混合        | Nacos Sync 同步 K8s 服务 |


**注册中心故障**：客户端缓存实例 + 过期策略（30s 无更新拒绝新实例）；核心服务配静态 fallback；metadata 带 `version` 支持灰度；优雅下线先反注册再 preStop sleep。

---

#### G31. 自研中间件：限流 / 熔断 / Recovery？

**思路**：对照文章「熔断限流」+ Gin 中间件。

**参考答案**：

**令牌桶限流**：

```go
var limiters sync.Map // key → *rate.Limiter

func RateLimitMiddleware(r rate.Limit, burst int) gin.HandlerFunc {
    return func(c *gin.Context) {
        key := c.ClientIP()
        lim, _ := limiters.LoadOrStore(key, rate.NewLimiter(r, burst))
        if !lim.(*rate.Limiter).Allow() {
            c.Header("Retry-After", "1")
            c.AbortWithStatusJSON(429, gin.H{"code": 42901, "message": "rate limited"})
            return
        }
        c.Next()
    }
}
```

分布式限流用 Redis 滑动窗口或 Sentinel；单实例 `x/time/rate` 适合网关粗限。

**熔断器（Closed → Open → HalfOpen）**：

```go
// Open：快速失败保护下游
// HalfOpen：放少量探测请求
// 成功 → Closed；失败 → Open
```

可用 `sony/gobreaker`。滑动窗口统计失败率，超阈值切 Open。

**Recovery**：panic → 打 stack → 500 JSON，不向客户端泄露内部细节（见 G19）。

**Prometheus 指标**：`req_total`、`req_duration`、`rate_limit_hits`、`breaker_state`。阈值从 Nacos 热更，单测验证状态转换。

---

#### G32. API 设计：RESTful 错误码与版本？

**思路**：统一响应 envelope。

**参考答案**：

**统一响应**：

```json
{
  "code": 0,
  "message": "ok",
  "data": { "id": 1, "name": "alice" },
  "trace_id": "abc-123"
}
```

**HTTP 码 vs 业务码**：


| HTTP | 业务 code | 含义     |
| ---- | ------- | ------ |
| 200  | 0       | 成功     |
| 400  | 40001   | 参数校验失败 |
| 401  | 40101   | 未认证    |
| 403  | 40301   | 无权限    |
| 429  | 42901   | 限流     |
| 500  | 50001   | 内部错误   |


HTTP 码给网关/代理；`code` 给前端 i18n 映射。

**版本**：推荐 `/v1/users` path 版本；备选 Header `Accept-Version: v2`。breaking change 升 major；additive 同版本加字段；Deprecated 用 `Sunset` 响应头。

**Cursor 分页**：

```json
{ "data": [...], "pagination": { "cursor": "eyJpZCI6MTAwfQ==", "has_more": true } }
```

**排序白名单**（防 SQL 注入）：

```go
var allowed = map[string]string{"created_at": "created_at", "name": "name"}
col := allowed[c.Query("sort_by")] // 未命中用默认值
```

**幂等 POST**：客户端传 `Idempotency-Key: uuid`；服务端存 key→response，TTL 24h，重复请求直接返回缓存响应。错误 message 对用户友好，细节放日志；OpenAPI 自动生成文档。

---

<h3 id="c-5-3" class="mh2">3. 插件与生态</h3>

#### G33. 令牌桶 / 漏桶 / 滑动窗口？

**思路**：见文章「服务限流」四算法。

**参考答案**：

三种算法解决不同流量形态，生产常见**网关层 + 服务层双层限流**（前者防 DDoS/租户滥用，后者保护单服务 CPU/DB）。


| 算法   | 特点                 | 典型场景                |
| ---- | ------------------ | ------------------- |
| 令牌桶  | 允许 burst，桶满后匀速补充令牌 | API 限流、允许短时突发       |
| 漏桶   | 请求进桶，匀速流出，超桶丢弃     | 下游写 MQ/第三方 API，削峰填谷 |
| 滑动窗口 | 按时间片计数，比固定窗口边界更平滑  | 短信/验证码、按分钟配额        |


**Go 令牌桶（**`golang.org/x/time/rate`**）**：

```go
import "golang.org/x/time/rate"

// 每秒 100 个，burst 200（允许瞬时 200 并发通过）
limiter := rate.NewLimiter(rate.Limit(100), 200)

func handler(c *gin.Context) {
    if !limiter.Allow() {
        c.Header("Retry-After", "1")
        c.JSON(429, gin.H{"code": 42901, "message": "rate limit exceeded"})
        c.Abort()
        return
    }
    // ...
}
```

**Redis 滑动窗口（多实例共享配额）**：

```lua
-- KEYS[1]=key, ARGV[1]=now_ms, ARGV[2]=window_ms, ARGV[3]=limit
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1] - ARGV[2])
local n = redis.call('ZCARD', KEYS[1])
if n >= tonumber(ARGV[3]) then return 0 end
redis.call('ZADD', KEYS[1], ARGV[1], ARGV[1] .. '-' .. math.random())
redis.call('PEXPIRE', KEYS[1], ARGV[2])
return 1
```

Key 设计：`ratelimit:{tenant_id}:{api}`，TTL 略大于窗口，避免 key 堆积。

**漏桶在 Kafka 生产侧**：Producer 侧 `linger.ms` + `batch.size` 天然有「攒批匀速发」效果；业务层可用 channel + ticker 做内存漏桶，防止瞬时 10 万条打满 broker。

**限流 vs 熔断**：限流控**请求量**（429）；熔断控**失败传播**（下游已不健康时快速失败，503/自定义码）。Sentinel 可同时配置两者；网关 Nginx `limit_req` 只做限流，熔断在应用侧。

---

#### G34. sentinel-golang / hystrix-go 选型？

**思路**：规则可视化 vs 轻量库。

**参考答案**：


| 维度    | sentinel-golang    | hystrix-go               | 自研 breaker |
| ----- | ------------------ | ------------------------ | ---------- |
| 流控    | QPS/并发/热点参数/系统负载   | 无原生流控                    | 需自己实现      |
| 熔断    | 慢调用 + 异常比例/数       | 经典 Closed/Open/Half-Open | 50 行可覆盖核心  |
| 规则动态化 | 支持 Nacos/文件/API 推送 | 编译期配置为主                  | 自行对接配置中心   |
| 生态    | 阿里系、Dashboard      | Netflix 原版 Go 移植，维护弱     | 无          |
| 适用    | 微服务治理全家桶           | 遗留项目、概念对齐 Java Hystrix   | 单服务、依赖极少   |


**sentinel 生产要点**：

```go
import (
    sentinel "github.com/alibaba/sentinel-golang/api"
    "github.com/alibaba/sentinel-golang/core/circuitbreaker"
)

// 熔断规则：RT > 500ms 且比例 > 50%，最小样本 20，统计窗口 10s
_, _ = circuitbreaker.LoadRules([]*circuitbreaker.Rule{
    {
        Resource:         "call_payment",
        Strategy:         circuitbreaker.SlowRequestRatio,
        MaxAllowedRtMs:   500,
        Threshold:        0.5,
        MinRequestAmount: 20,
        StatIntervalMs:   10000,
        RetryTimeoutMs:   30000, // Open 30s 后 Half-Open 探测
    },
})

entry, blockErr := sentinel.Entry("call_payment")
if blockErr != nil {
    return ErrCircuitOpen // 快速失败，勿重试打穿
}
defer entry.Exit()
// 调用下游...
```

**熔断阈值务必加「最小请求数」**：样本 < 20 时即使 3/3 失败也不应熔断，否则冷启动或低流量误开。Half-Open 探测用 1～3 个请求，成功则 Closed，失败则重新 Open。

**选型建议**：新项目优先 sentinel 或 Kratos 内置 middleware；已有 Hystrix 概念团队可短期用 hystrix-go 但需评估维护风险；仅 1～2 个外部依赖、QPS < 1k 可自研 + Prometheus 指标（`breaker_state{resource="x"}` gauge）。

---

#### G35. resty 超时 / 重试 / 连接池？

**思路**：defaults 必须显式设。

**参考答案**：

resty 默认**无超时、无重试上限意识**，生产必须显式配置；且 **context 超时 ≤ client 超时**，否则 cancel 后连接仍占用 pool。

```go
import (
    "context"
    "crypto/tls"
    "net/http"
    "time"

    "github.com/go-resty/resty/v2"
)

client := resty.New().
    SetTimeout(5 * time.Second).           // 整请求硬上限（含连接+读写）
    SetRetryCount(2).
    SetRetryWaitTime(500 * time.Millisecond).
    SetRetryMaxWaitTime(3 * time.Second).
    AddRetryCondition(func(r *resty.Response, err error) bool {
        if err != nil { // 超时、连接拒绝
            return true
        }
        // 仅对幂等：GET/HEAD/PUT；POST 默认 false
        return r.StatusCode() == 503 || r.StatusCode() == 429
    }).
    SetTransport(&http.Transport{
        MaxIdleConns:        100,
        MaxIdleConnsPerHost: 20,  // 单 host 连接池，防打满
        IdleConnTimeout:     90 * time.Second,
        TLSHandshakeTimeout: 5 * time.Second,
        TLSClientConfig:     &tls.Config{MinVersion: tls.VersionTLS12},
    })

func call(ctx context.Context) error {
    ctx, cancel := context.WithTimeout(ctx, 4*time.Second) // 小于 SetTimeout
    defer cancel()
    _, err := client.R().
        SetContext(ctx).
        SetHeader("X-Request-ID", traceID).
        Get("https://api.example.com/v1/users")
    return err
}
```

**连接池打满症状**：`http: server closed idle connection`、goroutine 堆积在 `net/http.(*persistConn).readLoop`。排查：`MaxIdleConnsPerHost` 过小导致频繁建连；或下游 keep-alive 不匹配。

**POST 重试**：仅当业务带 `Idempotency-Key` 且下游支持时可开；支付/下单默认不重试。429 应读 `Retry-After` header 而非固定 backoff。

**TLS Pin**（内网 mTLS 或防中间人）：自定义 `Transport.TLSClientConfig.RootCAs` 或 `VerifyPeerCertificate`；公网 HTTPS 一般交给系统 CA。

---

#### G36. validator/v10 自定义校验？

**思路**：struct tag + 注册自定义 validator。

**参考答案**：

**API 层做格式/范围校验，Biz 层做业务规则**（如「优惠券是否可用」），两层不可互相替代。

```go
import (
    "regexp"
    "github.com/go-playground/validator/v10"
)

var mobileRe = regexp.MustCompile(`^1[3-9]\d{9}$`)

func validateMobile(fl validator.FieldLevel) bool {
    return mobileRe.MatchString(fl.Field().String())
}

func init() {
    if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
        _ = v.RegisterValidation("mobile", validateMobile)
    }
}

type CreateUserReq struct {
    Name   string `json:"name"   validate:"required,min=2,max=32"`
    Email  string `json:"email"  validate:"required,email"`
    Mobile string `json:"mobile" validate:"required,mobile"`
    Age    int    `json:"age"    validate:"gte=18,lte=120"`
}
```

**Gin 统一绑定与错误翻译**：

```go
func BindJSON(c *gin.Context, req any) error {
    if err := c.ShouldBindJSON(req); err != nil {
        var ve validator.ValidationErrors
        if errors.As(err, &ve) {
            fields := make([]string, 0, len(ve))
            for _, fe := range ve {
                fields = append(fields, translateField(fe)) // mobile -> 手机号格式错误
            }
            return apierr.InvalidParams(strings.Join(fields, "; "))
        }
        return apierr.InvalidParams("invalid json")
    }
    return nil
}
```

**高级用法**：`validate:"required_if=Type enterprise"` 条件校验；结构体级 `RegisterStructValidation` 校验跨字段（结束时间 > 开始时间）。自定义 tag 名注册一次，全局 tag 复用；单测对 validator 函数单独 table-driven test。

---

#### G37. cron / asynq / machinery？

**思路**：单点 cron vs 分布式队列。

**参考答案**：


| 方案          | 后端             | 适用               | 生产注意                  |
| ----------- | -------------- | ---------------- | --------------------- |
| robfig/cron | 无（进程内）         | 单实例定时、轻量 sweep   | 多副本必须分布式锁或 leader 选举  |
| asynq       | Redis          | 异步任务、重试、优先级、延迟   | 监控 asynqmon；Redis 高可用 |
| machinery   | Redis/AMQP/SQS | 多 broker、DAG 工作流 | 配置重，小团队 asynq 更简单     |


**多副本 cron 陷阱**：3 个 Pod 各跑 `0 0 * * `* 会执行 3 次。解法一——Redis 分布式锁：

```go
// SET lock:cron:daily_report NX EX 300
ok, _ := rdb.SetNX(ctx, "lock:cron:daily_report", podID, 5*time.Minute).Result()
if !ok { return }
defer rdb.Del(ctx, "lock:cron:daily_report")
runDailyReport()
```

解法二——**改 asynq Scheduler**，集群只一个 scheduler 实例（Deployment replicas=1）或使用 K8s CronJob。

**asynq 生产模板**：

```go
srv := asynq.NewServer(asynq.RedisClientOpt{Addr: "redis:6379"}, asynq.Config{
    Concurrency: 10,
    Queues: map[string]int{"critical": 6, "default": 3, "low": 1},
    RetryDelayFunc: func(n int, err error, t *asynq.Task) time.Duration {
        return time.Duration(n*n) * time.Minute // 指数退避
    },
})
mux.HandleFunc("email:send", handleEmail) // handler 必须幂等
```

**任务三件套**：幂等（业务键去重）、超时（`context.WithTimeout` + asynq `Timeout` option）、死信（重试耗尽进 archived，人工 dashboard 回放）。Kafka 做事件驱动时用 Consumer Group 替代 cron 触发，cron 仅做「定时扫描补偿」。

---

#### G38. Elasticsearch 接入全链路？

**思路**：mapping → sync → query → 权限。

**参考答案**：

**1. Mapping 设计（先设计后写代码，改 mapping 代价高）**：

```json
{
  "mappings": {
    "properties": {
      "title":   { "type": "text", "analyzer": "ik_max_word", "search_analyzer": "ik_smart" },
      "status":  { "type": "keyword" },
      "tags":    { "type": "keyword" },
      "author":  {
        "type": "nested",
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" }
        }
      },
      "created_at": { "type": "date", "format": "epoch_millis||strict_date_optional_time" }
    }
  }
}
```

- 精确过滤、聚合、排序 → `keyword`；全文检索 → `text` + IK；数组对象独立查询 → `nested`（普通 object 会扁平化丢失关联）。
- 禁止动态映射生产环境自动建字段；用 index template 统一版本。

**2. 数据同步（at-least-once + 幂等 docId）**：

```
MySQL binlog → Canal/Debezium → Kafka topic → ES Consumer
                              ↘ 失败重试 / DLQ
```

- `docId = fmt.Sprintf("%s:%d", table, pk)`，Upsert 用 `index` API + 外部版本号。
- 全量：Scroll / PIT + search_after 导出再 bulk；增量靠 binlog。延迟监控：Canal lag、Kafka consumer lag、ES `_cat/indices?v` doc count 与 DB 抽样对比。

**3. Bulk 写入**：

```go
bulk := esutil.NewBulkIndexer(esutil.BulkIndexerConfig{
    Index: "articles", Client: esClient, NumWorkers: 4, FlushBytes: 5e6,
})
bulk.Add(ctx, esutil.BulkIndexerItem{
    Action: "index", DocumentID: docID, Body: bytes.NewReader(jsonBytes),
})
```

单批 5～15MB；失败 item 记日志重投，勿 silent drop。

**4. 查询**：

```json
{
  "query": {
    "bool": {
      "filter": [
        { "term": { "status": "published" } },
        { "range": { "created_at": { "gte": "now-30d" } } }
      ],
      "must": [
        { "match": { "title": { "query": "监理", "operator": "and" } } }
      ]
    }
  },
  "highlight": { "fields": { "title": {} }, "fragment_size": 80, "number_of_fragments": 1 }
}
```

`filter` 不参与评分、可 cache；`must` 做相关性。深分页用 `search_after`，禁用大 `from+size`。

**5. 二次鉴权**：ES 不存完整 ACL 时，检索结果 `article_id` 列表回表 `WHERE id IN (...) AND tenant_id=?`；或在 ES doc 写 `acl_tags: ["dept:1001","user:42"]`，查询 bool filter 加 `terms`。

**6. 零停机 reindex**：新建 `articles_v2` → reindex API 灌数据 → alias 原子切换：

```json
POST _aliases
{ "actions": [
  { "remove": { "index": "articles_v1", "alias": "articles" } },
  { "add":    { "index": "articles_v2", "alias": "articles" } }
]}
```

回滚只需反向切换 alias。

---

#### G39. MinIO / OSS / S3 SDK 实践？

**思路**：私有桶 + 预签名 + 分片。

**参考答案**：

**统一抽象**：业务只认 `storage_key`（服务端 UUID），不存客户端原始文件名（防路径穿越、编码问题）。

```go
type ObjectStore interface {
    Put(ctx context.Context, key string, r io.Reader, size int64, contentType string) error
    PresignGet(ctx context.Context, key string, ttl time.Duration) (string, error)
    Delete(ctx context.Context, key string) error
}
```

**上传链路（推荐直传）**：

1. 客户端请求「上传凭证」→ 服务端校验 quota/类型/大小上限（如 100MB、仅 `image/*`）。
2. 生成 `storage_key = uuid.New().String()`，写 DB 状态 `pending`。
3. 返回 MinIO/OSS **预签名 PUT URL**（TTL 5～15min）或 STS 临时 AK。
4. 客户端直传对象存储；回调或轮询后服务端 `HeadObject` 验大小/ETag，更新 `ready`。

**MinIO Go SDK 分片（>5MB）**：

```go
_, err := minioClient.PutObject(ctx, bucket, key, file, fileSize, minio.PutObjectOptions{
    ContentType: "application/pdf",
})
// 大文件用 NewMultipartUpload + PutObjectPart
```

**下载**：私有桶不公开读；`PresignedGetObject` TTL 5～15min，响应 `Content-Disposition: attachment` 防 XSS（浏览器 inline 执行）。

**DB 表设计**：


| 字段           | 说明                        |
| ------------ | ------------------------- |
| storage_key  | UUID，唯一                   |
| bucket       | 逻辑桶名                      |
| size_bytes   | HeadObject 回填             |
| content_type | 白名单校验                     |
| owner_id     | 鉴权                        |
| status       | pending / ready / deleted |


**CORS**：仅允许前端域名 + `PUT/GET` + 必要 header（`Content-Type`），禁止 `*` 配 credentials。

**异步 hook**：上传完成后 Kafka 事件 → ClamAV 病毒扫描 → 恶意则删对象并标记；图片生成缩略图写衍生 key。

---

#### G40. Milvus / Qdrant / Vearch 向量库选型？

**思路**：规模、部署、过滤。

**参考答案**：


| 引擎     | 语言/架构       | 规模  | 过滤/metadata       | 典型场景          |
| ------ | ----------- | --- | ----------------- | ------------- |
| Milvus | Go/C++，分布式  | 亿级  | 标量字段 + expr 过滤    | 大规模 RAG、推荐    |
| Qdrant | Rust，单集群易部署 | 千万级 | JSON payload 过滤丰富 | 中小团队、多租户 SaaS |
| Vearch | C++/Gamma   | 视集群 | 结合业务已有            | 已有 Vearch 基建  |


**共性模型**：Collection = schema（vector dim + fields）+ index（HNSW/IVF_FLAT）+ partition。

**Milvus 生产示例**：

```go
// dim 必须与 embedding 模型一致，如 text-embedding-3-small = 1536
schema := &entity.Schema{
    CollectionName: "docs",
    Fields: []*entity.Field{
        {Name: "id", DataType: entity.FieldTypeInt64, PrimaryKey: true},
        {Name: "embedding", DataType: entity.FieldTypeFloatVector, TypeParams: map[string]string{"dim": "1536"}},
        {Name: "tenant_id", DataType: entity.FieldTypeInt64},
        {Name: "doc_id", DataType: entity.FieldTypeVarChar, TypeParams: map[string]string{"max_length": "64"}},
    },
}
// 检索带过滤
expr := fmt.Sprintf("tenant_id == %d", tenantID)
searchParam, _ := entity.NewIndexHNSWSearchParam(16) // ef
```

**Qdrant**：

```go
client.Query(ctx, &qdrant.QueryPoints{
    CollectionName: "docs",
    Query:          qdrant.NewQuery(embedding...),
    Filter: &qdrant.Filter{Must: []*qdrant.Condition{
        qdrant.NewMatch("tenant_id", tenantID),
    }},
    Limit: 10,
    WithPayload: qdrant.NewWithPayload(true),
})
```

**索引维护**：embedding 模型升级 → 维度变则必须新 collection + 全量 re-embed + 双写切换；同维度可调 HNSW `M/efConstruction` rebuild。监控：P99 检索延迟、recall@k 离线评测、segment 数量。

**Redis 向量**：Redis 8+ Vector Set 适合 <100 万量级缓存式检索；主存储仍用专业向量库。

---

#### G41. RAG / LangChain 生产最小集？

**思路**：检索 + 权限 + 引用 + 拒答。

**参考答案**：

生产最小闭环：**ingest → chunk → embed → retrieve → rerank → generate with citation → 低分拒答**，权限贯穿检索链。

**1. Chunk 策略**：

- 按标题/段落切，512～1024 token，overlap 10%～15%（防句断）。
- 表格/代码块单独 chunk；保留 `source_doc_id`、`page`、`heading` metadata 供 citation。

**2. 检索链（Advanced 但生产常用）**：

```
User Query → Multi-Query（LLM 改写 3 个 query）→ 向量检索 TopK=20
          → Rerank（bge-reranker / Cohere）→ TopN=5
          → Context 压缩（LLMLingua 或按相关性截断）
          → LLM 生成
```

**3. 权限**：检索必须带 `tenant_id / user_acl` filter（Milvus expr / Qdrant filter / ES bool filter）；无权限 doc 不得进 context。

**4. 引用与拒答**：

```python
# Prompt 约束
"仅根据以下 context 回答；每条结论标注 [1][2] 对应 source；
若 context 不足以回答，回复「根据现有资料无法确定」"
```

检索最高分 < 阈值（如 cosine < 0.75）或 rerank top score < 0.5 → **拒答**，勿 hallucinate。

**5. LangGraph 多跳**：复杂问答拆「检索 → 判断够不够 → 再检索」状态机，比单轮 chain 可控。

**6. LangSmith / OpenTelemetry**：记录 trace_id、retrieved_doc_ids、token 用量、latency；采样 bad case 人工标注回流。

**Kafka ingest 管道**：文档上传 → OCR/解析 → chunk 事件 → embedding worker → 写向量库 + ES 倒排双写（混合检索）。

---

#### G42. 重试：指数退避 + 抖动？

**思路**：防 thundering herd。

**参考答案**：

**公式**：`wait = min(cap, base * 2^attempt) + random_jitter`，jitter 取 `[0, wait/2)` 或 full jitter `random(0, wait)`。

```go
func Retry(ctx context.Context, maxAttempts int, base, capDur time.Duration, fn func() error) error {
    var err error
    for attempt := 0; attempt < maxAttempts; attempt++ {
        if err = fn(); err == nil {
            return nil
        }
        if !isRetryable(err) { // 4xx 业务错误不重试
            return err
        }
        if attempt == maxAttempts-1 {
            break
        }
        exp := min(capDur, base*time.Duration(1<<attempt))
        jitter := time.Duration(rand.Int63n(int64(exp / 2)))
        wait := exp + jitter
        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-time.After(wait):
        }
    }
    return err
}

func isRetryable(err error) bool {
    // net.Error Timeout、503、429、Kafka ErrNotLeaderForPartition 等
    var netErr net.Error
    return errors.As(err, &netErr) && netErr.Timeout()
}
```

**可重试**：超时、连接拒绝、503、429（尊重 Retry-After）、Kafka 可重试异常。**不可重试**：4xx 参数错误、401/403、业务 duplicate key。

**总超时**：外层 `context.WithTimeout(ctx, 30*time.Second)` 包住整个重试循环，避免无限重试。

**与熔断配合**：breaker Open 时 `fn` 直接返回 `ErrCircuitOpen`，**禁止重试**否则 Half-Open 探测被放大。Redis 分布式锁获取失败可短 jitter 重试；DB deadlock 可重试 2～3 次。

**Kafka Consumer**：`enable.auto.commit=false`，处理成功再 commit；失败进 DLQ 而非无限 poll 重试阻塞 partition。

---

#### G43. 幂等键 / 去重表设计？

**思路**：唯一约束 + 状态机。

**参考答案**：

**HTTP 幂等（Stripe/支付网关同款）**：

```
Header: Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000  (客户端 UUID，24h 内复用)
```

**表结构**：

```sql
CREATE TABLE idempotency_keys (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    idem_key      VARCHAR(64)  NOT NULL,
    user_id       BIGINT       NOT NULL,
    request_hash  VARCHAR(64)  NOT NULL,  -- 同 key 不同 body 应 409
    status        TINYINT      NOT NULL,  -- 0=processing 1=done 2=failed
    response_body JSON,
    created_at    DATETIME     NOT NULL,
    expires_at    DATETIME     NOT NULL,
    UNIQUE KEY uk_key_user (idem_key, user_id)
);
```

**处理流程**：

1. `INSERT ... status=processing`；唯一键冲突 → 读已有记录。
2. 若 `done` → 直接返回缓存 `response_body`（201/200 同首次）。
3. 若 `processing` 且未超时 → 409 或 202「处理中」。
4. 若 `processing` 超时（如 >5min）→ 允许**安全重入**（查业务是否已落库再决定）。
5. 业务完成 → `UPDATE status=done, response_body=?`；定时任务清理 `expires_at` 已过期的 done 记录。

**Go 伪代码**：

```go
func HandlePay(ctx context.Context, userID int64, key string, req PayReq) (*PayResp, error) {
    rec, err := repo.TryLockIdempotency(ctx, userID, key, hash(req))
    if err == ErrConflictProcessing {
        return nil, apierr.Conflict("request in progress")
    }
    if rec.Status == Done {
        return rec.CachedResp, nil
    }
    defer repo.FinishIdempotency(ctx, rec.ID, ...)
    return doPay(ctx, req)
}
```

**MQ 消费去重**：


| 方案          | 实现                                 | 适用        |
| ----------- | ---------------------------------- | --------- |
| Redis SETNX | `SET dedup:{msg_id} 1 EX 86400 NX` | 高吞吐、可丢持久化 |
| 去重表         | `INSERT msg_dedup(msg_id) UNIQUE`  | 要求强持久     |
| 业务唯一键       | 订单号 UNIQUE                         | 天然幂等      |


Kafka：`msg_id = topic-partition-offset` 或 header `event_id`（UUID）；消费前先 dedup，成功后再 commit offset。Redis key TTL 略大于 max retry 窗口；表方案定期归档。

**与 G42 关系**：幂等解决「重复执行副作用」；重试解决 transient 失败；两者必须同时设计。

---

<h3 id="c-5-4" class="mh2">4. 运维（Ops）</h3>

#### G44. 502 / 504 / 连接池打满排障？

**思路**：Ingress → Pod → 应用 → DB 逐层。

**参考答案**：

502/504 本质是 **网关等不到健康 upstream** 或 **upstream 处理超时**；连接池打满则是 **下游慢 + 并发高 + 池太小** 叠加。排障口诀：**从外到内、从症状到根因**，每层用日志 + 指标 + 命令交叉验证。

**Step 0：确认现象与范围**

```bash
# 502 Bad Gateway：Nginx/Ingress 连不上 upstream 或 upstream 返回非法响应
# 504 Gateway Timeout：upstream 在 proxy_read_timeout 内没响应完
curl -v https://api.example.com/health   # 看 HTTP 状态码与耗时
# 同时看 Grafana：error rate、P99 latency 是否突增，影响单服务还是全站
```

**Step 1：Ingress / Nginx 层**

```bash
# 查 Ingress Controller Pod 日志（nginx-ingress 示例）
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=200 | grep -E '502|504|upstream'

# 常见 error log 含义：
# upstream timed out (110: Connection timed out)     → 504，后端慢或 hung
# connect() failed (111: Connection refused)        → 502，无 Pod 监听或 Service 无 Endpoints
# upstream prematurely closed connection            → 502，后端主动断连（panic/OOM/超时 kill）
# no live upstreams while connecting to upstream    → 502，Endpoints 全 NotReady
```

Nginx 关键配置（排查超时要对照）：

```nginx
upstream api_backend {
    server 10.0.1.10:8080 max_fails=3 fail_timeout=30s;
    keepalive 32;   # 与后端 keepalive，减少建连开销
}
location /api/ {
    proxy_pass         http://api_backend;
    proxy_connect_timeout  5s;    # 连后端超时
    proxy_send_timeout     60s;
    proxy_read_timeout     60s;   # 504 常见：此处 < 后端实际处理时间
    proxy_next_upstream    error timeout http_502 http_503;
}
```

**Step 2：K8s Service / Pod 层**

```bash
NS=prod APP=api
kubectl get pods -n $NS -l app=$APP -o wide
kubectl get svc,ep -n $NS $APP          # Endpoints 是否为空？NotReady 比例？
kubectl describe pod -n $NS <pod>       # Events 里 OOMKilled / CrashLoopBackOff？
kubectl logs -n $NS <pod> --previous    # 重启前日志

# readiness 过严会导致 EP 被摘掉 → 502「无可用 upstream」
kubectl get deploy $APP -n $NS -o yaml | grep -A20 readinessProbe
```

**Step 3：应用层 — 连接池打满**

Go 典型症状：`sql: connection pool exhausted`、`context deadline exceeded`、goroutine 暴涨。

```bash
# 若暴露了 metrics，查连接池 wait
# prometheus: db_pool_wait_count_total、db_pool_open_connections
curl -s localhost:9090/metrics | grep -E 'pool|goroutine'

# pprof 看是否 goroutine 堵在 IO
curl -s 'http://localhost:6060/debug/pprof/goroutine?debug=2' | head -80
```

应用侧检查清单：


| 指标                       | 含义    | 典型阈值           |
| ------------------------ | ----- | -------------- |
| `pool_wait_duration`     | 等连接时间 | P99 > 100ms 告警 |
| `pool_in_use / max_open` | 使用率   | > 85% 持续 5min  |
| goroutine 数              | 泄漏/阻塞 | 线性增长不回落        |


```go
// 连接池配置示例（database/sql）
db.SetMaxOpenConns(50)          // ≤ DB max_connections / 实例数
db.SetMaxIdleConns(25)
db.SetConnMaxLifetime(5 * time.Minute)  // 防 MySQL wait_timeout 断连
db.SetConnMaxIdleTime(2 * time.Minute)
```

**Step 4：DB 层**

```sql
-- MySQL
SHOW GLOBAL STATUS LIKE 'Threads_connected';
SHOW PROCESSLIST;   -- 大量 Sleep / Locked / Sending data？
SHOW ENGINE INNODB STATUS\G   -- 锁等待

-- 慢查询
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;
```

**Step 5：网络抓包（RST / 半开连接）**

```bash
ss -s                    # TCP 统计：timewait、orphaned
ss -antp | grep :3306 | wc -l
sudo tcpdump -i any host db.internal -nn 'tcp[tcpflags] & (tcp-rst) != 0' -c 20
# 大量 RST → 连接被对端拒绝或中间设备 reset
```

**根因对照表**：


| 现象             | 常见根因                       | 修复方向         |
| -------------- | -------------------------- | ------------ |
| 502 + EP 空     | readiness 失败 / 全 Pod Crash | 修探针或应用启动     |
| 504 + 后端 CPU 低 | 等锁/等连接池/等下游 RPC            | 查 DB 锁、调池大小  |
| 504 + 后端 CPU 高 | 热点 SQL / 无限循环              | explain + 限流 |
| pool exhausted | 慢 SQL 占满连接 + 并发突增          | 索引 + 超时 + 熔断 |


**面试怎么讲**：502/504 我按 **Ingress → Endpoints → 应用 → DB** 四层查；504 先看 `proxy_read_timeout` 和后端 P99，502 先看 Endpoints 是否 ready；连接池打满要同时看 **慢查询占连接** 和 **池配置/泄漏**。

---

#### G45. OOMKilled / 内存飙高？

**思路**：limit 与 request；heap profile。

**参考答案**：

OOM 分两类：**K8s cgroup OOMKilled**（超 limits 被内核杀）和 **进程内内存泄漏/无界缓存**（最终触发前者）。调大 limits 只是止血，必须找到 **谁在涨、为何涨**。

**Step 1：确认是 K8s OOM 还是节点 OOM**

```bash
kubectl describe pod -n prod api-7f8b9c - | grep -A5 "Last State"
# OOMKilled → container 超 memory limits
# Exit Code 137 = 128 + 9 (SIGKILL)

kubectl get pod api-7f8b9c -o jsonpath='{.spec.containers[0].resources}'
# 对比实际用量
kubectl top pod -n prod api-7f8b9c
```

Pod 内存配置示例：

```yaml
resources:
  requests:
    memory: "512Mi"   # 调度依据，应接近常态用量
  limits:
    memory: "1Gi"     # 超过此值 → OOMKilled
```

**Step 2：Go 应用 heap 分析**

```bash
# 生产通过 port-forward 或 debug endpoint（需鉴权）
kubectl port-forward pod/api-7f8b9c 6060:6060
go tool pprof -http=:8081 http://localhost:6060/debug/pprof/heap

# 命令行快速看 top
go tool pprof -top http://localhost:6060/debug/pprof/heap
# 关注 inuse_space、inuse_objects；对比 alloc（累计分配）vs inuse（当前占用）
```

```bash
# 连续采样对比（泄漏会单调涨）
curl -s localhost:6060/debug/pprof/heap > heap_t0.pb.gz
sleep 300
curl -s localhost:6060/debug/pprof/heap > heap_t5.pb.gz
go tool pprof -base heap_t0.pb.gz heap_t5.pb.gz
```

常见 Go 内存问题：


| 类型           | 特征                | 修复                      |
| ------------ | ----------------- | ----------------------- |
| goroutine 泄漏 | goroutine 数线性涨    | 修 channel/context/订阅    |
| 无界 map/cache | heap 中 map 占比高    | LRU + TTL + max size    |
| []byte 复用不当  | alloc 高但 inuse 正常 | sync.Pool + 限 buffer 大小 |
| JSON 大对象     | decode 后长期持有      | 流式处理、及时置 nil            |


**Step 3：Java vs Go 在容器中的差异**

- **Java**：堆 `-Xmx` 只是 JVM 堆；堆外（DirectByteBuffer、Metaspace、线程栈）也占 cgroup 内存。若 `-Xmx=4g` 且 limits=4g，极易 OOMKilled。**建议** `-Xmx` **≤ limits 的 70%～75%**。
- **Go**：runtime 直接受 cgroup 限制；`GOMEMLIMIT`（Go 1.19+）可设软上限，配合 GC 更平滑：

```bash
env:
  - name: GOMEMLIMIT
    value: "900MiB"   # 略低于 limits 1Gi
  - name: GOGC
    value: "100"
```

**Step 4：节点级排查**

```bash
dmesg | grep -i 'out of memory'   # 节点 OOM killer 杀进程
journalctl -k | grep -i oom
cat /sys/fs/cgroup/memory/memory.stat   # 旧 cgroup v1
```

**面试怎么讲**：OOM 先看 `kubectl describe` 是否 OOMKilled 和 limits 是否合理；Go 用 **heap pprof 看 inuse 增长**，区分泄漏 vs 峰值；调 limits 是缓解，根因是无界缓存或 goroutine 泄漏。

---

#### G46. goroutine 泄漏线上定位？

**思路**：pprof goroutine 相同栈聚类。

**参考答案**：

goroutine 泄漏 = **只创建不退出**，内存和调度开销持续涨。定位核心：**数量趋势 + 相同 stack 聚类 + 对照代码路径**。

**Step 1：确认泄漏（非业务峰值）**

```bash
# 方式 A：metrics（推荐生产）
# prometheus: go_goroutines{job="api"}
# 规则：压测停止后 10min 内 goroutine 应 plateau；若仍线性涨 → 泄漏

# 方式 B：pprof
curl -s 'http://localhost:6060/debug/pprof/goroutine?debug=1' | head -5
# goroutine profile: total 48291  ← 数量

watch -n 5 'curl -s localhost:6060/debug/pprof/goroutine?debug=1 | head -1'
```

**Step 2：抓 profile 并聚类**

```bash
go tool pprof -http=:8082 http://localhost:6060/debug/pprof/goroutine
# Flame Graph / Top / Source 看哪条调用栈 goroutine 最多

# 文本模式看重复栈
curl -s 'http://localhost:6060/debug/pprof/goroutine?debug=2' | \
  awk '/^goroutine/{n++} END{print n}'
curl -s 'http://localhost:6060/debug/pprof/goroutine?debug=2' | grep -A10 'chan receive'
```

**Step 3：常见泄漏模式与代码对照**


| 模式                | 栈特征                                | 修复                         |
| ----------------- | ---------------------------------- | -------------------------- |
| channel 阻塞        | `chan receive` 无 sender            | 加 buffer / 超时 / 关闭 channel |
| context 未 cancel  | `select` 等 `<-ctx.Done()` 永不触发     | `defer cancel()`           |
| HTTP 未 Close Body | `net/http.(*persistConn).readLoop` | `defer resp.Body.Close()`  |
| 订阅未退订             | `pubsub/subscribe` 阻塞              | unsubscribe on shutdown    |
| worker 无退出        | `for { ... }` 无 break              | 监听 ctx.Done()              |


泄漏示例与修复：

```go
// ❌ 泄漏：每次请求起一个永不退出的 goroutine
func handler(w http.ResponseWriter, r *http.Request) {
    ch := make(chan struct{}) // 无 buffer，无人接收
    go func() {
        ch <- struct{}{} // 永久阻塞
    }()
}

// ✅ 修复：带 context 生命周期
func worker(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            return
        case job := <-jobs:
            process(job)
        }
    }
}
```

**Step 4：优雅关闭验证**

```bash
# 发 SIGTERM 后 goroutine 应降到 baseline
kill -TERM $(pidof api)
sleep 5
curl -s localhost:6060/debug/pprof/goroutine?debug=1 | head -1
# 压测后 plateau 测试
hey -z 60s -c 50 http://localhost:8080/api/orders
sleep 600
curl -s localhost:6060/debug/pprof/goroutine?debug=1 | head -1
```

**面试怎么讲**：先看 `go_goroutines` 曲线压测后是否回落；再用 **goroutine pprof 聚类相同栈**，八成是 channel 阻塞或 context 没 cancel；修复后做 plateau 验证。

---

#### G47. Docker 多阶段构建与安全？

**思路**：最小运行时镜像。

**参考答案**：

目标：**构建环境与运行环境分离**，最终镜像只含二进制 + 必要 CA，缩小攻击面、加快拉取、减少 CVE。

**多阶段 Dockerfile（Go 生产模板）**：

```dockerfile
# syntax=docker/dockerfile:1
FROM golang:1.22-alpine AS builder
RUN apk add --no-cache git ca-certificates
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" -o /out/app ./cmd/api

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /out/app /app
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/app"]
```

**.dockerignore**（减少 build context、防泄露）：

```
.git
**/*_test.go
.env
*.md
Dockerfile*
```

**安全 checklist**：


| 项         | 做法                                                   |
| --------- | ---------------------------------------------------- |
| 非 root    | `USER nonroot`（distroless 自带 uid 65532）              |
| 只读根文件系统   | K8s `readOnlyRootFilesystem: true` + emptyDir 写 /tmp |
| 无 shell   | distroless/scratch 减 RCE 面                           |
| 镜像扫描      | `trivy image api:v1.2.3` / CI 阻断 Critical            |
| 固定 digest | `FROM golang@sha256:...` 防 tag 漂移                    |
| SBOM      | `syft api:v1.2.3 -o spdx-json` 供应链审计                 |


**多架构 buildx**：

```bash
docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 \
  -t registry.example.com/api:v1.2.3 --push .
```

**K8s 安全上下文配合**：

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 65532
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
  readOnlyRootFilesystem: true
```

**面试怎么讲**：多阶段把编译器和源码留在 builder，运行时只留 **distroless + 静态二进制 + 非 root**；安全上靠 `.dockerignore`、CVE 扫描、无 shell 镜像和 readOnlyRootFS。

---

#### G48. K8s Deployment / STS / DS / Job？

**思路**：按状态与部署模式选。

**参考答案**：


| 类型            | 场景                           | 关键特性                       |
| ------------- | ---------------------------- | -------------------------- |
| Deployment    | 无状态 API、Web                  | 随意扩缩、滚动更新、Pod 名随机          |
| StatefulSet   | MySQL、Kafka、ES               | 稳定网络标识 `pod-0`、有序启停、独立 PVC |
| DaemonSet     | node-exporter、fluent-bit、CNI | 每节点一个 Pod                  |
| Job / CronJob | 迁移、报表、清理                     | 完成即退出；Cron 定时              |


**Deployment 生产示例**：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0   # 零停机
  selector:
    matchLabels: { app: api }
  template:
    spec:
      terminationGracePeriodSeconds: 30
      containers:
        - name: api
          image: registry.example.com/api:v1.2.3
          resources:
            requests: { cpu: "500m", memory: "512Mi" }
            limits:   { cpu: "2",    memory: "1Gi" }
          readinessProbe:
            httpGet: { path: /health/ready, port: 8080 }
            periodSeconds: 5
          livenessProbe:
            httpGet: { path: /health/live, port: 8080 }
            initialDelaySeconds: 10
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 5"]  # 等 Endpoint 摘除
```

**StatefulSet 要点**：

```yaml
# headless Service：pod-0.api-headless.ns.svc.cluster.local
volumeClaimTemplates:
  - metadata: { name: data }
    spec:
      accessModes: ["ReadWriteOnce"]
      resources: { requests: { storage: 100Gi } }
```

**HPA 与 PDB**：

```bash
kubectl autoscale deploy api --min=3 --max=20 --cpu-percent=70
```

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
spec:
  minAvailable: 2        # 滚动/驱逐时至少保留 2 个
  selector:
    matchLabels: { app: api }
```

**选型决策**：

- 数据放 Pod 本地盘且要稳定 hostname → StatefulSet
- 每节点都要跑 agent → DaemonSet
- 跑完就结束 → Job；`CronJob` 用 `schedule: "0 2 * * *"`

**面试怎么讲**：无状态用 Deployment，要稳定身份和盘用 StatefulSet，节点级 agent 用 DaemonSet；生产必配 **requests/limits、探针、PDB、preStop**。

---

#### G49. Service / Ingress / NetworkPolicy？

**思路**：集群内 LB vs 对外入口 vs 网络隔离。

**参考答案**：

三层分工：**Service 集群内发现与负载均衡 → Ingress 七层入口与 TLS → NetworkPolicy 东西向隔离**。

**Service 类型**：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  type: ClusterIP          # 默认，仅集群内
  selector: { app: api }
  ports:
    - port: 80
      targetPort: 8080
---
# 对外：LoadBalancer（云 LB）或 NodePort（裸机/测试）
# type: LoadBalancer
```

```bash
kubectl get svc,ep api -n prod
kubectl run tmp --rm -it --image=curlimages/curl -- curl -s http://api.prod.svc:80/health
```

**Ingress（nginx-ingress 示例）**：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts: [api.example.com]
      secretName: api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port: { number: 80 }
```

Ingress Controller 本身要高可用：至少 2 副本 + PDB + 独立节点池或 anti-affinity。

**NetworkPolicy（零信任东西向）**：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-allow-ingress-only
spec:
  podSelector:
    matchLabels: { app: api }
  policyTypes: [Ingress, Egress]
  ingress:
    - from:
        - podSelector: { matchLabels: { app: gateway } }
      ports: [{ protocol: TCP, port: 8080 }]
  egress:
    - to:
        - podSelector: { matchLabels: { app: mysql } }
      ports: [{ protocol: TCP, port: 3306 }]
    - to:                          # 允许 DNS
        - namespaceSelector: {}
      ports: [{ protocol: UDP, port: 53 }]
```

```bash
# 需 CNI 支持（Calico/Cilium）；默认不启用则全通
kubectl describe networkpolicy api-allow-ingress-only -n prod
```

**面试怎么讲**：ClusterIP 做集群内 LB，Ingress 做 HTTP/TLS 入口，NetworkPolicy 限制 **谁能连谁**；Ingress Controller 本身也要 HA。

---

#### G50. MySQL / PG 慢查询与索引？

**思路**：explain → 索引 → 改写 SQL。

**参考答案**：

慢查询治理闭环：**开启 slow log → EXPLAIN 看执行计划 → 加/改索引 → 验证 → 监控回归**。

**Step 1：开启慢查询日志**

```ini
# MySQL my.cnf
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 0.5          # 超过 500ms 记录
log_queries_not_using_indexes = 1
```

```sql
-- 在线查看（MySQL 8）
SELECT * FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC LIMIT 10;
```

```ini
# PostgreSQL
log_min_duration_statement = 500   # ms
```

**Step 2：EXPLAIN 示例**

```sql
-- MySQL：订单按用户+时间查（缺索引典型坏计划）
EXPLAIN ANALYZE
SELECT id, amount FROM orders
WHERE user_id = 12345 AND status = 1
ORDER BY created_at DESC LIMIT 20;

-- 坏结果：type=ALL, rows=5000000, Using filesort
-- 好结果：type=ref, key=idx_user_status_created, rows=20
```

加索引：

```sql
CREATE INDEX idx_user_status_created ON orders (user_id, status, created_at DESC);
-- 联合索引最左前缀：WHERE user_id=? AND status=? ORDER BY created_at 可覆盖
```

**索引失效常见坑**：


| SQL 写法                        | 问题                                           |
| ----------------------------- | -------------------------------------------- |
| `WHERE YEAR(created_at)=2024` | 函数包列，索引失效 → 改范围查询                            |
| `WHERE status != 1`           | 负向扫描大范围                                      |
| `VARCHAR` 隐式转换                | `WHERE phone = 13800138000`（phone 是 varchar） |
| 选择性低的列单独索引                    | `gender` 单独索引几乎无用                            |


```sql
-- ✅ 范围查询代替函数
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'
```

**Step 3：连接池（应用侧）**

```go
db.SetMaxOpenConns(50)
db.SetMaxIdleConns(25)
db.SetConnMaxLifetime(5 * time.Minute)
// 监控：wait_count、wait_duration、in_use
```

**Step 4：PG 迁移注意**

- `GROUP BY`：PG 要求 SELECT 列在 GROUP BY 中或聚合；MySQL 旧版 `ONLY_FULL_GROUP_BY` 关闭时更宽松。
- JSON：`->>` 操作符可建 GIN 索引：`CREATE INDEX ON docs USING GIN (metadata jsonb_path_ops);`
- `EXPLAIN (ANALYZE, BUFFERS)` 看实际行数与 IO。

**读写分离陷阱**：

```go
// 写后立即读：可能读到从库旧数据（复制延迟）
// 方案：写后读走主库；或 cookie/session 标记「刚写入」强制主库
```

**面试怎么讲**：慢查先 **EXPLAIN 看 type/rows/key**，联合索引遵循最左前缀；连接池看 wait 指标；读写分离要处理 **主从延迟读旧数据**。

---

#### G51. Prometheus + Grafana 实践？

**思路**：RED 服务 + USE 资源 + 业务指标。

**参考答案**：

**指标体系**：


| 方法论     | 指标                            | 示例                  |
| ------- | ----------------------------- | ------------------- |
| RED（服务） | Rate、Errors、Duration          | QPS、5xx 率、P99       |
| USE（资源） | Utilization、Saturation、Errors | CPU%、队列深度、磁盘 IO err |
| 业务      | 领域 KPI                        | 下单成功率、支付金额          |

**业务落地：storeproxy（preprocessstoreproxy Pod）→ Prometheus + Grafana**

典型 **Pull 模型**：进程只暴露 `/metrics`，不推、不向 Prometheus 注册；Grafana **不 scrape Pod**，只向 Prometheus 发 PromQL 读 TSDB。

```
preprocessstoreproxy Pod
│
├─ [进程内] InitPrometheusMetrics("")
│     ① Sink + go-metrics 全局化（全进程 metrics.* 打点都进这里）
│     ② Register → prometheus DefaultRegisterer（与 promhttp 共用一套 Registry）
│     ③ 格式：go-metrics → Gauge / Counter / Summary + 命名与 host 等标签规则
│     ④ 暂存：指标在内存；Expiration 控制「运行时新建」指标的过期/剔除
│     ⑤ :9090 上 GET /metrics → promhttp 输出当前快照（被动，不推、不注册到 Prometheus）
│
│     业务示例（同一条管道）：
│     resolveScenePicIsJpg / resolveSmallPicIsJpg → 路径生成
│     → observeImagePathGenerated → preprocess_store_image_path_total{format, kind}
│     observeIOOperation → preprocess_store_io_total{operation, outcome}
│
├─ [Pod 元数据] prometheus.io/scrape=true, prometheus.io/port=9090
│     （与 Init 无关；Helm 写在 Pod Template，可选 prometheus.io/path=/metrics）
│
├─ [集群] Prometheus（loki-prometheus-server）
│     job: kubernetes-pods
│       K8s 发现 Pod → keep scrape=true
│       __address__ = PodIP:9090，__metrics_path__ = /metrics
│       约每 15s GET → 解析样本 → 写入 TSDB（带时间戳的历史）
│     查询面（本进程不调用）：
│       Web Graph / API：/api/v1/query、/api/v1/query_range + PromQL
│
└─ [集群] Grafana（loki-grafana）
      ① 数据源（一次性）：Configuration → Data sources → Prometheus
           URL = http://loki-prometheus-server.loki:80（与 common-config [PROMETHEUS].Address 一致）
           Save & test → UP
      ② 查数方式：不 scrape Pod，只向 Prometheus 发 PromQL（读 TSDB）
      ③ 建板路径（二选一）：
           Explore → PromQL → 有曲线 → Add to dashboard
           或 New dashboard → Add empty panel → Query 填 PromQL → Apply → Save
      ④ 面板常用配置：
           Visualization = Time series（时间–数值折线）
           Legend = {{format}} 或 {{kind}}-{{format}}（图例用标签值）
           时间范围 = Last 1 hour（Dashboard 右上角）
      ⑤ 示例 PromQL（preprocessstoreproxy）：
           路径 jpg/png 速率：
             sum by (format) (rate(preprocess_store_image_path_total{k8s_app="go-server-hb-preprocessstoreproxy"}[5m]))
           场景 vs 小图：
             sum by (kind, format) (rate(preprocess_store_image_path_total{...}[5m]))
      ⑥ 告警（可选）：Alerting → Contact points / Rule → 条件仍是对 Prometheus 做 PromQL
```

| 环节 | 谁负责 | 要点 |
| --- | --- | --- |
| 打点 | 业务 + `observe*` | 业务 Counter 与通用 `metrics.*` 同走 Sink，label 控基数（format/kind，勿用 trace_id） |
| 暴露 | Init + `:9090/metrics` | 与业务 HTTP 端口分离；Registry 与 promhttp 一致 |
| 发现 | Pod 注解 + `kubernetes_sd_configs` | 注解是「可被谁拉」的声明，Init 只管「拉到了什么格式」 |
| 存储 | Prometheus TSDB | 拉取间隔、retention；K8s 发现会带上 `k8s_app` 等 meta label 供 PromQL 过滤 |
| 展示 | Grafana 数据源 | 配置一次 Prometheus URL；面板/Explore/告警规则共用同一 PromQL 语义 |

```promql
# preprocessstoreproxy：按 format 看路径生成速率
sum by (format) (
  rate(preprocess_store_image_path_total{k8s_app="go-server-hb-preprocessstoreproxy"}[5m])
)

# 场景图 vs 小图
sum by (kind, format) (
  rate(preprocess_store_image_path_total{k8s_app="go-server-hb-preprocessstoreproxy"}[5m])
)
```

**基础设施落地：node-exporter（DaemonSet）→ USE 资源层**

与业务 Pod 一样仍是 **Pull**；差异在 **每 Node 一个 DaemonSet Pod**，指标来自 **宿主机** 而非应用进程。Prometheus / Grafana 数据源与 storeproxy 共用 **loki-prometheus-server**，Grafana 仍只发 PromQL。

```
K8s 每个 Node
  └─ Pod: node-exporter（DaemonSet，每节点 1 个）
        挂载宿主机 /proc、/sys、/ 等（hostPath / hostNetwork 视 Chart 而定）
        读 CPU、内存、磁盘、网络、文件系统等
        暴露 :9100/metrics（标准 node_* 指标族）
              ↓ scrape（常见：Pod 注解 prometheus.io/port=9100 + job kubernetes-pods，或独立 node job）
        loki-prometheus-server → TSDB
              ↓
        Grafana：node_memory_*、node_cpu_*、node_filesystem_* 等（可用官方 Node Exporter Full 模板）
```

| 对比 | 业务 Pod（如 preprocessstoreproxy） | node-exporter |
| --- | --- | --- |
| 部署 | Deployment / 多副本 | DaemonSet，与 Node 1:1 |
| 指标含义 | 领域 KPI、IO、自定义 Counter | USE：CPU/内存/磁盘/网络 |
| 端口 | 常 9090（自研 Init） | 9100（社区约定） |
| 面试归类 | RED + 业务 | **USE**（与 G51 磁盘告警 `node_filesystem_*` 同一套） |

```promql
# 节点 CPU 非 idle 占比（示意，按实际 job/instance 过滤）
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# 内存可用比例
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes
```

与 **promauto 直出** 的差异：存量服务若已用 go-metrics，用 Sink 桥接比全量改 CounterVec 成本低；新服务仍推荐原生 `client_golang` + Histogram。

**Go 暴露 metrics（prometheus/client_golang）**：

```go
var (
    httpRequests = promauto.NewCounterVec(
        prometheus.CounterOpts{Name: "http_requests_total"},
        []string{"method", "path", "status"},
    )
    httpDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "latency",
            Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
        },
        []string{"method", "path"},
    )
)
```

**Prometheus 查询示例**：

```promql
# QPS
sum(rate(http_requests_total{job="api"}[5m]))

# 错误率
sum(rate(http_requests_total{status=~"5.."}[5m]))
/ sum(rate(http_requests_total[5m]))

# P99 延迟
histogram_quantile(0.99,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le, path)
)

# 实例存活
up{job="api"} == 0

# 磁盘将满（node_exporter）
(node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
```

**告警规则（Alertmanager）**：

```yaml
groups:
  - name: api
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels: { severity: critical }
        annotations:
          summary: "API 5xx > 5%"

      - alert: HighLatencyP99
        expr: |
          histogram_quantile(0.99,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
          ) > 2
        for: 10m
```

**告警处理策略：从 PromQL 到钉钉 / 企微 / 邮件**

两条常见路径（集群里可并存，避免同一规则双发）：

```
路径 A（经典）
  Prometheus 采集 TSDB
    → alerting rules（expr + for 持续满足才 firing）
    → Alertmanager（去重、分组、抑制、路由、静默）
    → receiver：webhook / email / …
    → 钉钉适配器（Alertmanager 无原生钉钉，需中间层）
    → 钉钉群自定义机器人（Markdown / @手机号）

路径 B（Grafana Unified Alerting）
  Grafana 对 Prometheus 数据源执行 PromQL 规则
    → Contact points（Webhook / Email / …）
    → 同上：Webhook → 钉钉机器人 或 Grafana 钉钉插件
```

| 阶段 | 做什么 | 策略要点 |
| --- | --- | --- |
| **触发** | `expr` 为真且 **`for` 窗口内持续** | 防抖动：错误率类常 `for: 5m`；`up==0` 可更短 |
| **标签** | `labels`: severity、team、service | 路由依据：`severity=critical` → 电话/on-call 群 |
| **分组** | Alertmanager `group_by: [alertname, cluster, service]` | 多 Pod 同时挂只发 **一条聚合**（带 instance 列表） |
| **抑制** | `inhibit_rules` | 例：节点 down 时抑制该节点上所有 Pod 的 up 告警 |
| **路由** | `route` → 子 route 匹配 label | 业务群 / 基础设施群 / 大模型链路分 channel |
| **静默** | Silences（维护窗口） | 发布前建 silence，避免预期抖动轰炸 |
| **恢复** | `resolved` 通知 | 钉钉消息标明 **已恢复**，便于值班关单 |

**钉钉接入（典型）**：

1. 群设置 → **自定义机器人** → 安全设置（签名校验或 IP 白名单）→ 得到 Webhook URL。  
2. 部署 **Webhook 转换服务**（如 `prometheus-webhook-dingtalk`、自研小服务）：接收 Alertmanager `POST /api/v2/alerts` JSON，拼 Markdown（summary、description、startsAt、generatorURL 链到 Grafana/Prometheus）。  
3. Alertmanager 配置示例：

```yaml
route:
  group_by: ["alertname", "k8s_app"]
  group_wait: 30s      # 同组首条稍等，凑批
  group_interval: 5m
  repeat_interval: 4h  # 未恢复时重复提醒上限
  receiver: dingtalk-default
  routes:
    - match: { severity: critical }
      receiver: dingtalk-oncall
receivers:
  - name: dingtalk-default
    webhook_configs:
      - url: "http://prometheus-webhook-dingtalk:8060/dingtalk/webhook1/send"
        send_resolved: true
```

4. **Grafana**：Alerting → Contact points → Webhook 填同一适配器 URL；Notification policies 按 label 分到不同机器人（测试群 / 生产群）。

**值班与闭环（和「发消息」配套）**：

- **分级**：warning 仅工作群；critical @值班 + 可选电话（阿里云/腾讯云语音回调）。  
- **模板**：告警带 `k8s_app`、`instance`、当前值、**Runbook 链接**（G51 里 Jaeger/Loki 查链）。  
- **On-call**：谁 ACK、谁静默、事故复盘写 postmortem；非生产环境可 `repeat_interval` 拉长或单独机器人。

**面试怎么讲**：规则在 Prometheus/Grafana 用 PromQL 定义；**Alertmanager 负责「别刷屏」**（group/inhibit/repeat）；钉钉走 **Webhook 适配器**；维护用 silence，恢复要通知。

**Grafana Dashboard 分层**：

1. **Overview**：全局 QPS、错误率、P99、Saturation
2. **Per Service**：按 `path` / `deployment` 下钻
3. **Infrastructure**：CPU、内存、磁盘、网络、Pod 重启次数

**踩坑**：

- histogram bucket 要覆盖业务 SLO 区间（如 200ms～2s），否则 P99 不准
- **高基数 label 禁用**：`user_id`、`trace_id` 做 label 会炸 TSDB
- recording rule 预聚合：`job:api:http_requests:rate5m` 加速大盘

**面试怎么讲**：服务层 RED、资源层 USE；histogram 设合理 bucket；告警看 **error rate + P99 + up**；label 控制基数。可讲两条 Pull 链：**业务**（Init + 9090 + 自定义 Counter）与 **节点**（DaemonSet node-exporter + 9100 + `node_*`），最后都进同一 Prometheus，Grafana 只查 TSDB；业务例 `rate(preprocess_store_image_path_total[5m])`，资源例 `node_memory_*` / 磁盘余量。

---

#### G52. Jaeger / Loki / ELK 分工？

**思路**：metrics 发现异常，trace 定位路径，log 看细节。

**参考答案**：

可观测性三板斧分工：**Metrics 报警 → Trace 定位慢在哪一跳 → Log 看那一跳的参数与堆栈**。

```
告警（Prometheus）→ Grafana 看 P99 飙高
    → Jaeger 按 trace_id 查调用链，发现 DB 调用 2s
        → Loki/ELK 用 trace_id 过滤日志，看 SQL 与 error stack
```

**Jaeger（分布式追踪）**：

```go
// OpenTelemetry 注入 trace_id 到 log
span := trace.SpanFromContext(ctx)
log.Info("query orders",
    "trace_id", span.SpanContext().TraceID().String(),
    "user_id", userID,
)
```

- 生产采样：**1%～10%** 头部采样 + 错误全采（tail sampling）
- 查链：`service=api operation=GET /orders minDuration=500ms`

**Loki（label 驱动日志，K8s 友好）**：

```yaml
# promtail 采集
scrape_configs:
  - job_name: kubernetes-pods
    kubernetes_sd_configs: [{ role: pod }]
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        target_label: app
```

```logql
# 查某 trace 相关日志
{namespace="prod", app="api"} |= "trace_id=abc123"

# 错误率
sum(rate({app="api"} |= "level=error"[5m])) by (app)
```

**ELK（Elasticsearch + Logstash + Kibana）**：

- 优势：**全文检索**、复杂聚合、Kibana 可视化
- 劣势：成本高、索引体积大；适合合规审计、安全分析
- 查询：`message:"connection refused" AND service:api AND @timestamp:[now-1h TO now]`

**三者关联键**：


| 字段           | 用途                       |
| ------------ | ------------------------ |
| `trace_id`   | metrics → trace → log 串联 |
| `span_id`    | 链内具体 span                |
| `request_id` | 无 trace 时的 fallback      |


**安全**：日志 **禁止** 打 password、token、身份证；PII 脱敏；trace attribute 同样约束。

**面试怎么讲**：Metrics 发现异常，Trace 定位 **哪一跳慢**，Log 看 **参数和 stack**；用 trace_id 串联；生产 trace 要采样。

---

#### G53. 灰度 / 金丝雀 / 蓝绿发布？

**思路**：控制爆炸半径。

**参考答案**：


| 策略  | 原理               | 优点       | 缺点        |
| --- | ---------------- | -------- | --------- |
| 金丝雀 | 小流量新版本，指标 OK 再扩  | 省资源、风险可控 | 发布慢、需流量调度 |
| 蓝绿  | 两套完整环境，切换入口      | 回滚秒级     | 资源 double |
| 灰度  | 按用户/地域/Header 分批 | 精准控制受众   | 路由规则复杂    |


**K8s 金丝雀（双 Deployment + Ingress weight）**：

```yaml
# stable + canary 两个 Deployment，共用 Service selector 或分开
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "5"   # 5% 到新版本
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            backend:
              service:
                name: api-canary
                port: { number: 80 }
```

**Argo Rollouts（推荐）**：

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
spec:
  strategy:
    canary:
      steps:
        - setWeight: 5
        - pause: { duration: 10m }
        - analysis:
            templates: [{ templateName: success-rate }]
        - setWeight: 50
        - pause: { duration: 10m }
        - setWeight: 100
```

```promql
# 金丝雀分析：新版本 error rate 不得高于 stable 2 倍
sum(rate(http_requests_total{version="canary",status=~"5.."}[5m]))
/ sum(rate(http_requests_total{version="canary"}[5m]))
```

**蓝绿切换**：

```bash
kubectl patch svc api -p '{"spec":{"selector":{"version":"green"}}}'
# 或 Istio/Flagger 切换 VirtualService subset
```

**数据库兼容（必谈）**：

- **Expand-Contract**：先加列（nullable）→ 双写 → 切读 → 删旧列
- 金丝雀期间 **新旧代码共存**，schema 变更必须 backward compatible
- 禁止：先删列再发版（/canary 旧 Pod 必挂）

**面试怎么讲**：金丝雀是 **小流量验证 metrics**，蓝绿是 **双环境瞬时切换**；K8s 可用 Ingress weight 或 Argo Rollouts；DB 变更必须 backward compatible。

---

#### G54. Linux：fd / ulimit / tcp 排障？

**思路**：连接与文件描述符是隐形上限。

**参考答案**：

「too many open files」和「连接数打满」常是 **ulimit、系统上限、应用泄漏** 三层问题。

**Step 1：文件描述符**

```bash
# 进程级软/硬限制
ulimit -n                    # 如 1024 → 高并发必调
cat /proc/<pid>/limits | grep "open files"

# 系统级
cat /proc/sys/fs/file-max
cat /proc/sys/fs/nr_open

# 当前使用
ls /proc/<pid>/fd | wc -l
lsof -p <pid> | wc -l
lsof -p <pid> | awk '{print $5}' | sort | uniq -c | sort -rn | head
```

永久调大（systemd 服务）：

```ini
# /etc/systemd/system/api.service.d/limits.conf
[Service]
LimitNOFILE=65535
```

```bash
sudo systemctl daemon-reload && sudo systemctl restart api
```

**Step 2：TCP 连接状态**

```bash
ss -s
# Total: 15234 (kernel 9890)
# TCP:   12000 (estab 8000, closed 3000, orphaned 50, timewait 3500)

ss -antp | awk 'NR>1{print $1}' | sort | uniq -c | sort -rn
# 3500 TIME_WAIT → 短连接过多，考虑 keepalive / 连接池

ss -antp | grep :8080 | wc -l   # 某端口连接数
```

**TIME_WAIT 调优（谨慎，先理解业务）**：

```ini
# /etc/sysctl.conf — 仅短连接风暴且确认无 NAT 问题时
net.ipv4.tcp_tw_reuse = 1       # 复用 TIME_WAIT 发起新连接（客户端场景）
net.ipv4.ip_local_port_range = 1024 65535
# 不推荐盲目 tcp_tw_recycle（已废弃）/ 过短 fin_timeout
```

**Step 3：应用泄漏排查**

```bash
# Go：goroutine 泄漏常伴随 fd 涨
curl -s localhost:6060/debug/pprof/goroutine?debug=1 | head -1
lsof -p $(pidof api) | grep -c TCP

# 找未 Close 的资源：HTTP Body、DB rows、文件句柄
```

**Step 4：系统日志**

```bash
journalctl -u api -n 200 --no-pager
dmesg | tail -50              # OOM、TCP 相关内核消息
grep -i "too many open files" /var/log/syslog
```

**面试怎么讲**：fd 问题先看 **ulimit 和 lsof 按类型统计**；TCP 看 `ss -s` 里 TIME_WAIT/estab；too many open files 多半是 **泄漏或未 Close**。

---

#### G55. 双网 / 网闸 / 跳板机？

**思路**：物理隔离下的同步与运维。

**参考答案**：

双网（内外网物理隔离）场景：**数据跨网闸单向/双向同步**，**运维只能经跳板机审计访问**，模型与敏感数据不出内网。

**架构示意**：

```
[外网区]  SaaS / 公网 API
    ↕ 网闸（协议剥离、DLP、病毒扫、审计）
[内网区]  核心业务、训练数据、模型权重
    ↕ 跳板机（堡垒机）+ 全程 audit log
[运维人员]  无直连内网 IP，Web SSH/RDP 经网关
```

**数据同步（跨网闸）设计**：


| 要点  | 做法                             |
| --- | ------------------------------ |
| 分片  | 大文件拆 chunk，单片失败可重传             |
| 压缩  | gzip/zstd 减带宽                  |
| ACK | 每片 checksum + 批次 ACK，至少一次 → 幂等 |
| 幂等  | `batch_id + seq` 唯一键，重复投递不重复写  |
| 对账  | T+1 比对条数/哈希，差异告警人工介入           |


```sql
-- 同步批次表
CREATE TABLE sync_batch (
    batch_id   VARCHAR(64) PRIMARY KEY,
    direction  ENUM('in','out'),
    status     TINYINT,  -- 0=sending 1=acked 2=reconciled
    checksum   VARCHAR(64),
    created_at DATETIME
);
```

**运维通道**：

- **跳板机（堡垒机）**：运维人员 → VPN/零信任 → 堡垒机 Web 终端 → 内网主机；**禁止**私钥落本地、禁止直连 DB 3306
- 全程 **录屏/命令审计**；高危命令二次审批
- 凭证经 **密钥网关** 动态签发，非静态 password

**内网独立制品库**：

- 内网 **Harbor** 镜像仓库，外网 build 完经网闸 **离线 tar 导入** 或单向 replication
- 模型权重、训练数据集 **不出内网**；外网仅同步脱敏后的 inference API

**与 Q8 蜂鸟双网呼应**：业务上外网采集 → 网闸摆渡 → 内网训练/推理；运维与数据链路分离，合规审计可追溯。

**面试怎么讲**：双网核心是 **网闸摆渡 + 幂等对账** 做数据，**跳板机 + audit** 做运维；内网独立 Harbor，敏感模型数据不出网。

---

<h3 id="c-5-5" class="mh2">5. CI/CD</h3>

#### G56. Git Flow vs Trunk Based？

**思路**：分支策略影响发布频率。

**参考答案**：

**Git Flow**（Vincent Driessen 经典模型）：

```
main (生产) ← release/x.y ← develop ← feature/*
                ↑ hotfix/* 直接合 main + develop
```

- `develop` 集成功能；`release` 分支做版本冻结与 bugfix；`hotfix` 从 `main` 切出修生产。
- 适合：桌面客户端、SDK、**版本号对外承诺** 的产品（如 v2.3.0 发版周期 2 周）。
- 代价：长期分支 merge 痛苦、集成滞后、release 分支「冻结期」拖慢 hotfix。

**Trunk Based Development**：

```
main (常绿主干) ← 短生命周期 feature 分支（≤2 天）
              ← 或直接 commit + feature flag 隐藏未完成逻辑
```

- 所有人频繁合入 `main`；功能未完成用 **feature flag**（LaunchDarkly / 自研开关）控制曝光。
- 适合：Web/SaaS、**日级/周级持续交付**、小团队（≤15 人）。
- 配套：主干必过 CI、MR 小步合并、生产可快速回滚。

**对比表**：


| 维度       | Git Flow     | Trunk Based  |
| -------- | ------------ | ------------ |
| 发布频率     | 周/月          | 日/多次         |
| 分支寿命     | 数周           | 数小时～2 天      |
| merge 成本 | 高            | 低            |
| 未完成特性    | release 分支隔离 | feature flag |
| 团队规模     | 中大           | 小～中          |


**选型建议**：

- 团队 ≤10 人、K8s 已就绪、有自动化测试 → **Trunk + flag**。
- 多版本并行维护（LTS）、合规要求「版本审计」→ Git Flow 或 **GitHub Flow**（main + feature，无 develop）。
- 无论哪种：**MR/PR 必过 CI**；禁止直接向 main push；protected branch + required reviewers。

**Feature Flag 最小实现**：

```go
if ff.Enabled(ctx, "new-checkout", userID) {
    return newCheckoutFlow(order)
}
return legacyCheckout(order)
```

**面试怎么讲**：先问对方发布频率和团队规模，再给出选型。强调「分支策略是组织问题，不是纯技术问题」——Trunk 要求测试与 CI 成熟，否则主干会被打红。

---

#### G57. GitLab CI 完整 pipeline？

**思路**：lint → test → build → image → deploy。

**参考答案**：

**完整** `.gitlab-ci.yml` **示例（Go 微服务）**：

```yaml
variables:
  GO_VERSION: "1.22"
  DOCKER_DRIVER: overlay2
  IMAGE: $CI_REGISTRY_IMAGE
  HELM_RELEASE: my-api

stages:
  - lint
  - test
  - build
  - docker
  - deploy-staging
  - deploy-prod

.default_go:
  image: golang:${GO_VERSION}
  cache:
    key: go-mod-${CI_COMMIT_REF_SLUG}
    paths:
      - .go/pkg/mod/
  before_script:
    - export GOPATH=$CI_PROJECT_DIR/.go
    - export PATH=$GOPATH/bin:$PATH

lint:
  extends: .default_go
  stage: lint
  script:
    - go install github.com/golangci/golangci-lint/cmd/golangci-lint@v1.59
    - golangci-lint run --timeout=5m ./...
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

test:
  extends: .default_go
  stage: test
  services:
    - name: redis:7-alpine
      alias: redis
  variables:
    REDIS_ADDR: redis:6379
  script:
    - go test -race -count=1 -coverprofile=coverage.out ./...
    - go tool cover -func=coverage.out | tail -1
  coverage: '/total:\s+\(statements\)\s+(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.out
    expire_in: 1 week
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

build:
  extends: .default_go
  stage: build
  script:
    - CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o bin/app ./cmd/server
  artifacts:
    paths:
      - bin/app
    expire_in: 1 day
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_COMMIT_TAG

docker:
  stage: docker
  image: docker:24
  services:
    - docker:24-dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - |
      docker build \
        --build-arg VERSION=$CI_COMMIT_SHA \
        -t $IMAGE:$CI_COMMIT_SHA \
        -t $IMAGE:$CI_COMMIT_REF_SLUG \
        .
    - docker push $IMAGE:$CI_COMMIT_SHA
    - docker push $IMAGE:$CI_COMMIT_REF_SLUG
    - echo "IMAGE_DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' $IMAGE:$CI_COMMIT_SHA)" >> build.env
  artifacts:
    reports:
      dotenv: build.env
  needs: [build]
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_COMMIT_TAG

.deploy_template:
  stage: deploy-staging
  image: alpine/helm:3.14
  script:
    - helm upgrade --install $HELM_RELEASE ./deploy/helm/my-api \
        --namespace $NAMESPACE --create-namespace \
        --set image.repository=$IMAGE \
        --set image.tag=$CI_COMMIT_SHA \
        --set env=$DEPLOY_ENV \
        --wait --timeout 5m
  needs: [docker]

deploy-staging:
  extends: .deploy_template
  variables:
    NAMESPACE: staging
    DEPLOY_ENV: staging
  environment:
    name: staging
    url: https://staging.example.com
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

deploy-prod:
  extends: .deploy_template
  stage: deploy-prod
  variables:
    NAMESPACE: production
    DEPLOY_ENV: prod
  environment:
    name: production
    url: https://api.example.com
  when: manual          # 生产需人工点 deploy
  rules:
    - if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+$/
```

**Pipeline 设计要点**：

1. **MR pipeline 与 release pipeline 分离**：MR 只跑 lint + test；合入 main 才 build 镜像；打 tag 才允许 deploy-prod。
2. **Cache**：`go mod` 缓存 key 用 branch slug，避免跨分支污染；大依赖可设 `GOPROXY=https://goproxy.cn,direct`。
3. **Artifact 传递**：`coverage.out` 上传供 MR 覆盖率对比；`build.env` 传递 digest 给下游 job。
4. **并行**：lint 与 test 可同 stage 并行；docker 依赖 build artifact 而非重新编译。
5. **Rules 替代 only/except**：GitLab 15+ 推荐 `rules`，条件更清晰。

**Makefile 本地与 CI 对齐**：

```makefile
lint:  golangci-lint run ./...
test:  go test -race -coverprofile=coverage.out ./...
build: CGO_ENABLED=0 go build -o bin/app ./cmd/server
ci:    lint test build
```

**面试怎么讲**：按 stage 顺序讲一遍，重点强调「MR 门禁什么、合 main 发生什么、打 tag 如何晋级生产」，体现 CI/CD 分层而非一个大 pipeline 全跑。

---

#### G58. golangci-lint 与质量门禁？

**思路**：统一静态检查，CR 不抠风格。

**参考答案**：

**团队** `.golangci.yml` **参考**：

```yaml
run:
  timeout: 5m
  modules-download-mode: readonly

linters:
  enable:
    - govet          # 官方 vet，必开
    - errcheck       # 忽略 error 返回值
    - staticcheck    # 静态分析（含 unused、SA 规则）
    - gosec          # 安全（SQL 拼接、弱随机等）
    - bodyclose      # HTTP response body 未 Close
    - gocritic       # 代码味道
    - misspell       # 拼写
    - unconvert      # 多余类型转换
    - prealloc       # slice 预分配建议
  disable:
    - exhaustive     # 初期可先关，enum switch 全覆盖

linters-settings:
  errcheck:
    check-type-assertions: true
  gosec:
    excludes:
      - G104  # 部分 io 忽略 error 可白名单
  gocritic:
    enabled-tags: [performance, diagnostic]

issues:
  exclude-rules:
    - path: _test\.go
      linters: [gosec, errcheck]
  max-issues-per-linter: 50
  max-same-issues: 3
```

**常用 linter 职责**：


| Linter      | 抓什么                                          |
| ----------- | -------------------------------------------- |
| govet       | printf 格式、struct tag、copy lock               |
| errcheck    | `_ = fn()` 吞 error                           |
| staticcheck | dead code、错误 string 比较、deprecated API        |
| gosec       | SQL 拼接、硬编码 credential、TLS InsecureSkipVerify |
| bodyclose   | `resp, _ := http.Get` 后未 Close               |


**Coverage 门禁**：

```yaml
# GitLab CI
script:
  - go test -coverprofile=coverage.out ./...
  - |
    COVER=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | tr -d '%')
    echo "Coverage: ${COVER}%"
    awk -v c="$COVER" 'BEGIN { exit !(c >= 60) }'  # 低于 60% 失败
```

- 参考值 **60～80%**，**重质量非数字**：100% 覆盖率仍可能有逻辑 bug；核心包（payment、auth）要求更高。
- MR 可设「覆盖率不得下降」：`diff-cover` 对比 base branch。

**渐进启用策略**（避免一次全开炸 MR）：

1. 第 1 周：只开 govet + errcheck，存量问题 `//nolint` 标注 + issue 跟踪。
2. 第 2～3 周：加 staticcheck、gosec；每周 fix 一批存量。
3. 第 4 周：全量启用；新代码零 tolerance。

**本地与 CI 一致**：`make lint` 调用同一配置文件；pre-commit hook 可选 `golangci-lint run --new-from-rev=origin/main`。

**面试怎么讲**：强调「linter 解放 CR 精力，CR 专注业务逻辑与设计」；提到渐进启用，体现落地经验而非纸上谈兵。

---

#### G59. 镜像 digest 不可变与晋级？

**思路**：同一 digest 从 test → staging → prod。

**参考答案**：

**Tag vs Digest**：

```
registry.example.com/my-api:latest          → 可变，每次 push 覆盖
registry.example.com/my-api:v1.2.3            → 语义化，人读友好
registry.example.com/my-api@sha256:abc123...  → 不可变，内容寻址
```

- `:latest` **绝不进生产**；CI 构建时打 `$CI_COMMIT_SHA` tag，同时记录 digest。
- Harbor / ECR / GCR 可设 **immutable tag** 策略，禁止覆盖已有 tag。

**晋级（Promotion）流程**：

```
┌─────────┐    同一 digest    ┌─────────┐    同一 digest    ┌─────────┐
│  Build  │ ────────────────→ │ Staging │ ────────────────→ │  Prod   │
│ CI job  │   digest=sha256:  │ 验证通过 │   人工 approve   │ deploy  │
└─────────┘   abc123...       └─────────┘                   └─────────┘
```

```bash
# 1. CI 构建并记录 digest
DIGEST=$(crane digest $IMAGE:$CI_COMMIT_SHA)
echo $DIGEST > image-digest.txt

# 2. Staging 部署（test 环境已自动部署同一 SHA tag，digest 相同）
helm upgrade --install my-api ./helm \
  --set image.repository=$IMAGE \
  --set image.tag=$CI_COMMIT_SHA

# 3. Staging 验证通过后，Prod 用 digest 部署（非 tag，防 tag 被覆盖）
helm upgrade --install my-api ./helm \
  --set image.repository=$IMAGE \
  --set image.digest=sha256:abc123def456...

# 或用 crane 复制到 prod namespace（多 registry 场景）
crane copy $TEST_REGISTRY/my-api@sha256:abc... $PROD_REGISTRY/my-api@sha256:abc...
```

**供应链安全 Gate**：

```yaml
# CI 中 Trivy 扫描，Critical CVE 阻断
trivy image --severity CRITICAL,HIGH --exit-code 1 $IMAGE:$CI_COMMIT_SHA

# SBOM 生成（Syft）
syft $IMAGE:$CI_COMMIT_SHA -o spdx-json > sbom.spdx.json
```

- SBOM 随 artifact 存档，合规审计可追溯。
- 配置外置：同一镜像 + 不同 ConfigMap/Secret = 多环境；**镜像内不含环境差异**。

**面试怎么讲**：画一条「build once, deploy many」链路，强调 digest 是内容哈希、tag 只是指针；晋级是「验证过的 digest 往前走」，不是重新 build。

---

#### G60. Helm / K8s 回滚？

**思路**：revision 可逆。

**参考答案**：

**Helm 发布与回滚**：

```bash
# 首次安装
helm upgrade --install my-api ./deploy/helm/my-api \
  --namespace production \
  --set image.tag=v1.2.3 \
  --wait --timeout 5m

# 查看历史 revision
helm history my-api -n production
# REV  UPDATED                   STATUS    CHART         APP VERSION  DESCRIPTION
# 1    Mon Jan  1 10:00:00 2026  superseded my-api-0.1.0 1.0.0        Install complete
# 2    Mon Jan  1 11:00:00 2026  deployed   my-api-0.1.0 1.1.0        Upgrade complete
# 3    Mon Jan  1 12:00:00 2026  failed     my-api-0.1.0 1.2.0        Upgrade failed

# 回滚到 revision 2
helm rollback my-api 2 -n production --wait

# 回滚到上一版
helm rollback my-api -n production --wait
```

**kubectl 原生回滚**：

```bash
# Deployment 回滚
kubectl rollout history deployment/my-api -n production
kubectl rollout undo deployment/my-api -n production              # 上一版
kubectl rollout undo deployment/my-api -n production --to-revision=3

# 查看 rollout 状态
kubectl rollout status deployment/my-api -n production

# 暂停/恢复（金丝雀期间）
kubectl rollout pause deployment/my-api -n production
kubectl rollout resume deployment/my-api -n production
```

**Helm values 多环境差异**：

```yaml
# values-staging.yaml
replicaCount: 2
resources:
  requests: { cpu: 100m, memory: 128Mi }
ingress:
  host: staging.example.com

# values-prod.yaml
replicaCount: 5
resources:
  requests: { cpu: 500m, memory: 512Mi }
ingress:
  host: api.example.com
autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 20
```

```bash
helm upgrade --install my-api ./helm -f values-prod.yaml --set image.tag=$SHA
```

**发布 Checklist（贴 runbook）**：


| 步骤      | 动作                                                |
| ------- | ------------------------------------------------- |
| T-15min | 确认 on-call 在线；告警静默窗口关闭                            |
| T-5min  | 备份当前 revision 号：`helm history`                    |
| T-0     | `helm upgrade --wait`；观察 Grafana error rate / P99 |
| T+5min  | 冒烟测试核心 API；确认无 panic log                          |
| 异常      | 执行预写回滚命令：`helm rollback my-api <REV>`             |
| T+30min | 发布总结；更新 changelog                                 |


**DB Migration 与 App 回滚配套**：

- **Expand-Contract 模式**：先加列（nullable）→ 双写 → 切读 → 删旧列；app 回滚时旧代码仍能读旧 schema。
- 破坏性 migration（删列、改类型）**不可随 app 回滚**；必须 forward-only + 兼容期。
- Flyway / golang-migrate 版本号与 app 版本绑定，runbook 写明「回滚 app 到 rev N 时 DB 最低版本 ≥ M」。

**面试怎么讲**：先讲 Helm revision 机制，再补「回滚 app 不等于回滚 DB」这个坑；体现生产经验。

---

#### G61. 密钥 / 配置外置？

**思路**：12-factor；不进镜像不进 git。

**参考答案**：

**12-Factor 配置原则**：

- 配置存环境变量或外部配置中心，**不硬编码、不进镜像、不进 git**。
- 同一份镜像跑 dev/staging/prod，差异只在注入的配置。

**K8s 分层**：

```yaml
# ConfigMap — 非敏感
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-api-config
data:
  LOG_LEVEL: "info"
  REDIS_ADDR: "redis.svc.cluster.local:6379"
  FEATURE_FLAGS_URL: "http://ff-service/config"

---
# Secret — 敏感（base64 仅传输编码，非加密！）
apiVersion: v1
kind: Secret
metadata:
  name: my-api-secret
type: Opaque
stringData:
  DATABASE_URL: "postgres://user:pass@pg:5432/app"
  JWT_SIGNING_KEY: "xxx"
```

```yaml
# Deployment 注入
envFrom:
  - configMapRef:
      name: my-api-config
  - secretRef:
      name: my-api-secret
# 或 volume mount（文件形式，适合 TLS 证书）
volumeMounts:
  - name: tls
    mountPath: /etc/tls
    readOnly: true
volumes:
  - name: tls
    secret:
      secretName: my-api-tls
```

**Vault 动态密钥（生产推荐）**：

```go
// Init 时从 Vault 拉取，非启动写死
secret, err := vaultClient.Logical().Read("secret/data/my-api/db")
dbURL := secret.Data["data"].(map[string]interface{})["url"].(string)
```

- Vault Agent Sidecar 自动续期；Pod 无需感知轮换。
- 云厂商：AWS Secrets Manager / 阿里云 KMS，通过 CSI Driver 挂载。

**GitLab CI 变量**：

```yaml
# Settings → CI/CD → Variables
# DB_PASSWORD: masked + protected（仅 protected branch 可用）
deploy:
  script:
    - helm upgrade --set database.password=$DB_PASSWORD ...
  only:
    - main
```

- **Masked**：日志中自动打码；**Protected**：仅 protected branch/tag 可读取。
- Prod deploy 权限：仅 maintainers + 人工 approve；audit log 记录谁触发了 deploy。

**密钥轮换 Runbook**：

1. Vault 生成新 key v2；应用支持读 v1 + v2 验签（JWT 场景）。
2. 滚动重启 Pod 加载新 Secret。
3. 观察 24h 无异常；废弃 v1。
4. GitLab audit + K8s audit log 追溯「谁在何时改了 Secret」。

**面试怎么讲**：从 12-factor 讲起，落到 K8s ConfigMap/Secret 分工，再提 Vault 动态密钥——体现「知道为什么不进 git」比背概念更重要。

---

#### G62. CI 与 CD 边界再述？

**思路**：CI 证明质量，CD 重复发布。

**参考答案**：

**职责分界**：

```
┌──────────────────────────────────────────────────────────────┐
│  CI（Continuous Integration）                                 │
│  触发：每次 push / MR                                         │
│  产出：lint 报告、测试结果、覆盖率、二进制、镜像 digest + SBOM  │
│  目标：证明「这份代码可以发布」                                 │
└──────────────────────────┬───────────────────────────────────┘
                           │ artifact（不可变 digest）
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  CD（Continuous Delivery / Deployment）                       │
│  输入：digest + 环境配置（values/ConfigMap/Secret）            │
│  动作：部署到 staging → 验证 → promote 到 prod               │
│  目标：「把已验证 artifact 安全、重复地推到目标环境」            │
└──────────────────────────────────────────────────────────────┘
```

**CI 产出清单**：


| Artifact           | 用途                    |
| ------------------ | --------------------- |
| 测试报告 JUnit XML     | MR 界面展示失败用例           |
| coverage.out       | 覆盖率趋势 / 门禁            |
| bin/app 或镜像 digest | CD 部署输入               |
| SBOM + 扫描报告        | 合规 gate               |
| migration SQL（版本化） | CD 阶段 pre-deploy hook |


**CD 输入与动作**：

```bash
# CD 不做 go build，只 deploy 已有 digest
helm upgrade --install my-api ./helm \
  --set image.repository=$IMAGE \
  --set image.digest=$PROMOTED_DIGEST \
  -f values-$ENV.yaml
```

**失败策略**：

- **CI 红 → 禁止 merge**（GitLab: «Pipelines must succeed» + «All threads resolved»）。
- **CD 失败 → 自动 rollback**（Helm `--atomic`：失败自动回滚到上一 revision）：

```bash
helm upgrade --install my-api ./helm --atomic --wait --timeout 5m
```

**GitOps 模式（ArgoCD / Flux）**：

```
开发者 MR → CI 构建镜像 push registry
         → 更新 git repo 中 deploy/overlays/prod/kustomization.yaml 的 image digest
         → ArgoCD 检测 git drift → 自动 sync 到集群
```

- **Desired state 在 git**：谁改了 deploy 配置有 MR 审计；集群漂移可自动纠正或告警。
- CI 负责 build；CD（ArgoCD）负责 reconcile；职责清晰。

**面试怎么讲**：用「CI 回答能不能发，CD 回答怎么发、发到哪」一句话定调，再展开 artifact 不可变 + GitOps，体现工程化思维。

---

<h3 id="c-5-6" class="mh2">6. 架构与软技能</h3>

#### G63. 何时拆 / 不拆微服务？

**思路**：边界、团队、事务、规模。

**参考答案**：

**拆微服务的充分条件**（满足 2～3 条再考虑）：


| 驱动力  | 说明                                    |
| ---- | ------------------------------------- |
| 独立伸缩 | 订单 QPS 10 倍于用户服务，需单独 HPA              |
| 技术异构 | 推荐引擎用 Python/Go，核心交易用 Go              |
| 发布解耦 | 营销页日发 10 次，支付服务月发 1 次                 |
| 团队对齐 | Conway 定律：2 个团队维护 2 个 bounded context |
| 故障隔离 | 搜索挂了不影响下单（熔断 + 降级）                    |


**不拆的信号**：

- **强 ACID 跨模块**：下单扣库存扣余额必须在同一事务 → 拆了就要 Saga/TCC，复杂度飙升。
- **小团队**（≤5 人）：微服务运维成本（注册发现、链路、配置、CI/CD × N）> 收益。
- **低 QPS**（<100）：单体 + 垂直扩容足够。
- **领域边界不清**：先拆必然变成 **分布式单体**（服务间紧耦合 RPC 网状调用）。

**演进路径（推荐）**：

```
模块化单体 → 抽离读多写少/独立伸缩模块 → 逐步微服务
     ↑
  清晰 package 边界 + interface 隔离 + 领域事件
```

```go
// 模块化单体：按 bounded context 分包，未来可整包抽出
internal/
  order/     // 聚合 Order + OrderLine
  inventory/ // 聚合 Stock
  payment/   // 聚合 Payment
  shared/    // 仅基础设施，不含业务
```

**拆后必补基础设施**：

- 服务注册发现（Consul / K8s DNS）
- 统一配置中心、链路追踪（TraceId 透传）
- API Gateway / 限流熔断（Sentinel / istio）
- 分布式事务方案（Outbox / Saga，见 G64）
- 契约测试（Pact）防接口 breaking change

**面试怎么讲**：先说「默认不拆，模块化单体是第一步」——这比一上来喊微服务成熟。用 Conway 定律 + 事务边界举例，体现架构权衡而非教条。

---

#### G64. 幂等 / 最终一致 / Saga / TCC？

**思路**：能不用 2PC 就不用。

**参考答案**：

**方案选型表**：


| 方案                     | 一致性         | 复杂度 | 适用场景                |
| ---------------------- | ----------- | --- | ------------------- |
| 幂等 + 重试                | 至少一次 → 等价一次 | 低   | 大部分 MQ 消费、支付回调      |
| Outbox                 | 本地事务 + 最终一致 | 中   | DB 写入 + 发 MQ 必须原子   |
| Saga（编排/ choreography） | 最终一致        | 中～高 | 长流程多步（下单→扣库存→支付→通知） |
| TCC                    | 近似强一致       | 高   | 金融扣款/冻结，容忍补偿逻辑      |
| 2PC/XA                 | 强一致         | 很高  | 跨库强一致（Go 生态少用）      |


**1. 幂等 + 重试**：

```go
func HandlePaymentCallback(ctx context.Context, req CallbackReq) error {
    // 业务幂等键：支付渠道 + 渠道订单号
    key := req.Channel + ":" + req.OutTradeNo
    inserted, err := idempotencyStore.TryInsert(ctx, key, req)
    if err != nil {
        return err
    }
    if !inserted {
        return nil // 已处理，直接返回成功
    }
    return applyPayment(ctx, req)
}
```

- MQ 消费同理：`INSERT INTO consumed(msg_id) ... ON CONFLICT DO NOTHING`。
- 重试带指数退避；**只有幂等操作才可安全重试**。

**2. Outbox 模式**：

```go
func CreateOrder(ctx context.Context, order Order) error {
    return db.Transaction(func(tx *gorm.DB) error {
        if err := tx.Create(&order).Error; err != nil {
            return err
        }
        // 同一事务写 outbox 表
        return tx.Create(&OutboxEvent{
            AggregateID: order.ID,
            EventType:   "order.created",
            Payload:     marshal(order),
        }).Error
    })
}

// 独立 poller 读 outbox → 发 MQ → 标记 sent
func OutboxPoller(ctx context.Context) {
    events, _ := repo.FetchPending(ctx, 100)
    for _, e := range events {
        if err := mq.Publish(ctx, e); err != nil {
            continue
        }
        repo.MarkSent(ctx, e.ID)
    }
}
```

- 保证 **DB 写入与消息发送原子性**（同库事务）；poller 至少一次，消费端幂等。

**3. Saga 编排式（Orchestrator）**：

```
OrderSaga:
  1. CreateOrder     → 失败：结束
  2. ReserveStock    → 失败：CancelOrder（补偿）
  3. ProcessPayment  → 失败：ReleaseStock + CancelOrder
  4. ConfirmOrder    → 失败：Refund + ReleaseStock + CancelOrder
```

```go
type SagaStep struct {
    Name       string
    Execute    func(ctx context.Context) error
    Compensate func(ctx context.Context) error
}

func RunSaga(ctx context.Context, steps []SagaStep) error {
    done := []SagaStep{}
    for _, s := range steps {
        if err := s.Execute(ctx); err != nil {
            for i := len(done) - 1; i >= 0; i-- {
                _ = done[i].Compensate(ctx) // 逆序补偿
            }
            return err
        }
        done = append(done, s)
    }
    return nil
}
```

- **补偿必须业务可逆**：CancelOrder 恢复库存、Refund 退钱；已发货的订单不能简单 Delete。
- Choreography 版：每步完成发事件触发下一步，无中心编排器，但链路难追踪。

**4. TCC（Try-Confirm-Cancel）**：

```
Try:     冻结库存、冻结余额     （资源预留，不提交）
Confirm: 扣减库存、扣减余额     （确认提交）
Cancel:  释放冻结库存、释放余额 （回滚预留）
```

- 每个参与者实现三个接口；**开发成本是 Saga 的 2～3 倍**。
- 适合支付、库存冻结等「必须预留再确认」场景；一般业务 Outbox + 幂等足够。

**面试怎么讲**：按复杂度递增讲：幂等 → Outbox → Saga → TCC，强调「2PC 在 Go 微服务几乎不用」；Saga 重点提补偿可逆性。

---

#### G65. 压测 wrk/vegeta 与容量规划？

**思路**：找饱和点 → 留冗余。

**参考答案**：

**压测工具对比**：


| 工具     | 特点         | 示例                                                                   |
| ------ | ---------- | -------------------------------------------------------------------- |
| wrk    | 高并发、Lua 脚本 | `wrk -t4 -c100 -d30s --latency http://host/api`                      |
| vegeta | 恒定 QPS、可管道 | `echo "GET http://host/api" | vegeta attack -duration=30s -rate=200` |
| k6     | JS 脚本、场景丰富 | 适合复杂业务流程                                                             |
| hey    | Go 编写、简单   | `hey -n 10000 -c 50 url`                                             |


**Vegeta 完整流程**：

```bash
# 1. 准备目标
echo "GET http://localhost:8080/api/v1/orders?page=1" | \
  vegeta attack -duration=60s -rate=100 -workers=50 | \
  vegeta report -type=text

# 2. 输出 latency 分布
echo "GET http://localhost:8080/api/v1/orders" | \
  vegeta attack -duration=30s -rate=500 | \
  vegeta report -type=hist[0,2ms,5ms,10ms,25ms,50ms,100ms,250ms,500ms,1s]

# 3. 绘制图表（可选）
echo "GET http://localhost:8080/api/v1/orders" | \
  vegeta attack -duration=30s -rate=200 | \
  vegeta plot > latency.html
```

**wrk 带 POST body**：

```bash
wrk -t4 -c200 -d60s -s post.lua --latency http://localhost:8080/api/v1/orders
# post.lua: wr.method = "POST"; wr.body = '{"sku":"A001","qty":1}'; wr.headers["Content-Type"] = "application/json"
```

**观察指标（压测时同步看）**：


| 指标             | 工具                 | 饱和信号               |
| -------------- | ------------------ | ------------------ |
| P50/P95/P99 延迟 | vegeta report      | P99 陡增             |
| Error rate     | vegeta / 应用 log    | >0.1% 即危险          |
| CPU            | `top` / Grafana    | >70% sustained     |
| 内存             | Grafana            | 持续增长 → 泄漏          |
| DB 连接          | `pg_stat_activity` | 接近 max_connections |
| GC pause       | pprof / Grafana    | STW >10ms          |


**容量规划公式**：

```
所需实例数 = ceil(峰值 QPS × 1.5 / 单实例饱和 QPS)

例：峰值 3000 QPS，单 Pod 饱和 500 QPS
    → ceil(3000 × 1.5 / 500) = ceil(9) = 9 Pod
    → HPA maxReplicas ≥ 9，requests 按饱和 CPU 反推
```

```
DB 连接池：每 Pod max_open = (DB max_connections × 0.8) / Pod 数
例：PG max=200，10 Pod → 每 Pod max_open ≤ 16
```

- **1.5 冗余**：应对突发 + 滚动更新 + 单 AZ 故障。
- **瓶颈组件单独扩**：DB 先打满就加 read replica 或 cache，盲目加 Pod 无效。

**压测数据要接近生产**：

- 请求体大小、header（含 auth token）、参数分布（热点 SKU vs 均匀）影响结果。
- 空接口压测只测框架 overhead；**带 DB/Redis 的真实路径**才有意义。
- 建议在 staging 用生产流量 mirror（GoReplay）录制回放。

**面试怎么讲**：讲「找饱和点 → 算冗余 → 验证瓶颈组件」三步；举一个 P99 陡增 + DB 连接打满的例子，比背命令更有说服力。

---

#### G66. 安全：注入 / 越权 / 脱敏？

**思路**：纵深防御。

**参考答案**：

**1. SQL 注入**：

```go
// ❌ 拼接
query := fmt.Sprintf("SELECT * FROM users WHERE name = '%s'", name)

// ✅ 预编译参数化
db.Query("SELECT * FROM users WHERE name = $1", name)

// GORM
db.Where("name = ?", name).Find(&users)
```

- ORM 不是银弹：`db.Raw("... "+ userInput)` 同样危险。
- gosec G201/G202 可 CI 拦截。

**2. 越权（BOLA / IDOR）**：

```go
func GetOrder(ctx context.Context, orderID int64) (*Order, error) {
    userID := auth.UserIDFrom(ctx)
    order, err := repo.GetOrder(ctx, orderID)
    if err != nil {
        return nil, err
    }
    // 对象级校验：必须属于当前用户（或当前 tenant）
    if order.UserID != userID {
        return nil, ErrForbidden // 404 或 403，不泄露存在性
    }
    return order, nil
}
```

- **每接口 Enforce**：RBAC（角色）+ ABAC（资源属性）；管理员接口单独 middleware。
- 批量接口：`WHERE id IN (...) AND tenant_id = ?` 防跨租户。

**3. XSS**：

- 输出到 HTML 必须编码（`html/template` 自动转义；`text/template` 不会！）。
- API 返回 JSON 给 SPA：CSP header `Content-Security-Policy: default-src 'self'`。
- 富文本场景：白名单 sanitize（bluemonday）。

**4. 日志与导出脱敏**：

```go
func MaskPhone(phone string) string {
    if len(phone) < 7 {
        return "***"
    }
    return phone[:3] + "****" + phone[len(phone)-4:]
}

// zap 字段脱敏
logger.Info("user login",
    zap.String("phone", MaskPhone(user.Phone)),
    // 密码、token、身份证号：never log
)
```


| 字段       | 规则                 |
| -------- | ------------------ |
| 手机号      | 中间四位 `138****5678` |
| 身份证      | 保留前3后4             |
| 银行卡      | 保留后4               |
| 密码/token | 永不记录               |


**5. 依赖漏洞与 SBOM**：

```bash
govulncheck ./...                    # Go 官方漏洞扫描
trivy fs --severity HIGH,CRITICAL .   # 全项目
syft dir:. -o spdx-json > sbom.json   # 软件物料清单
```

- CI gate：Critical CVE 阻断 merge；定期（周/月）扫描 + 自动 PR bump 依赖。

**面试怎么讲**：按「注入 → 越权 → XSS → 脱敏 → 供应链」五层讲；越权举对象级 IDOR 代码示例，体现「鉴权 ≠ 授权」。

---

#### G67. RFC / 技术方案怎么写？

**思路**：背景 → 方案对比 → 决策 → 风险。

**参考答案**：

**RFC 模板（One-pager → Deep dive）**：

```markdown
# RFC-042: 订单服务从单体拆出独立微服务

## 1. 元信息
- 作者：张三 | 审阅：架构组 | 状态：Draft / Accepted / Rejected
- 日期：2026-01-15 | 预计工期：6 周

## 2. 背景与目标（量化）
- 现状：订单模块占单体 40% CPU，发布需全量回归 4h
- 目标：订单独立发布；P99 延迟 ≤200ms（当前 350ms）；支持独立 HPA
- 非目标：不改支付流程；不迁移历史订单（只读同步）

## 3. 现状与问题
- 架构图（当前）
- 痛点：发布耦合、无法独立扩缩、故障影响全站

## 4. 方案对比

| 维度 | A: 模块化单体 | B: 独立微服务 | C: 购买 SaaS |
| --- | --- | --- | --- |
| 工期 | 2 周 | 6 周 | 4 周 |
| 独立发布 | ❌ | ✅ | ✅ |
| 数据主权 | ✅ | ✅ | ❌ |
| 运维成本 | 低 | 中 | 低 |
| 风险 | 低 | 中 | 高（供应商锁定） |

## 5. 选定方案 B + 架构图
（Mermaid / draw.io 图：API GW → Order Svc → PG + Redis + MQ）

## 6. 详细设计
- API 契约（OpenAPI link）
- 数据迁移：双写 → 切读 → 停写旧库
- 分布式事务：Outbox + Saga（见 G64）

## 7. 里程碑
| 周 | 交付物 |
| --- | --- |
| W1 | API 契约评审通过；CI/CD 脚手架 |
| W2-W3 | 核心 CRUD + 双写 |
| W4 | 切读 + 压测 |
| W5 | 灰度 5% → 100% |
| W6 | 下线旧模块 |

## 8. 回滚计划
- 灰度期间：Ingress weight 切回旧服务
- 双写期间：新服务故障 → 旧服务继续写
- DB：expand-contract，不做 destructive migration

## 9. 监控与验收
- 指标：QPS、P99、error rate、双写 lag
- 告警：P99 >300ms、error >0.1%、lag >5s
- 验收：压测 2× 峰值通过；on-call runbook 就绪

## 10. 风险与未决问题
| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| 双写不一致 | 中 | 高 | 对账 job + 幂等 |
| 工期超 6 周 | 中 | 中 | W2  checkpoint 评估 |

- 未决：历史订单查询走新库还是 API 聚合？
```

**写作节奏**：

1. **One-pager 先对齐**：背景 + 方案对比 + 推荐，30 分钟评审拍板要不要做。
2. **Deep dive 再展开**：选定方案后写详细设计、里程碑、回滚。
3. 避免：一上来 20 页细节无人看完；或只有口号无量化目标。

**面试怎么讲**：强调「方案对比表 + 明确非目标 + 回滚计划」三件套；体现写 RFC 是为了 **决策可追溯**，不是形式主义。

---

#### G68. Swagger / OpenAPI 协作？

**思路**：契约先行或代码生成。

**参考答案**：

**两种模式**：


| 模式           | 流程                                 | 适合         |
| ------------ | ---------------------------------- | ---------- |
| Design-first | 手写 openapi.yaml → 生成 server/client | 前后端并行、多消费者 |
| Code-first   | 代码注释 → swaggo 生成 yaml              | 后端主导、快速迭代  |


**Design-first 示例**：

```yaml
# api/openapi.yaml
openapi: 3.0.3
info:
  title: Order API
  version: 1.2.0
paths:
  /orders:
    post:
      operationId: createOrder
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateOrderRequest'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'
components:
  schemas:
    CreateOrderRequest:
      type: object
      required: [sku, quantity]
      properties:
        sku:      { type: string }
        quantity: { type: integer, minimum: 1 }
        coupon_code:
          type: string
          deprecated: true
          description: "v1.3 移除，用 coupons 数组替代"
```

```bash
# 生成 Go server interface（oapi-codegen）
oapi-codegen -generate types,server -package api api/openapi.yaml > internal/api/gen.go

# 生成 TypeScript client（openapi-generator）
openapi-generator-cli generate -i api/openapi.yaml -g typescript-fetch -o frontend/src/api
```

**Code-first（swaggo）**：

```go
// @Summary 创建订单
// @Tags orders
// @Accept json
// @Produce json
// @Param body body CreateOrderRequest true "请求体"
// @Success 201 {object} Order
// @Router /orders [post]
func (h *Handler) CreateOrder(c *gin.Context) { ... }
```

```bash
swag init -g cmd/server/main.go -o docs/
# 产出 docs/swagger.json → 导入 Swagger UI / Redoc
```

**版本变更规范**：

- **Additive only**：新字段 optional；删字段先 `deprecated: true` 保留 ≥1 版本。
- Breaking change → **major version bump**（`/v2/orders` 或 header `API-Version: 2`）。
- CI 校验：`openapi-diff` 对比 MR 变更，breaking change 需架构师 approve。

**Mock Server 前端并行**：

```bash
# Prism mock（根据 openapi 自动返回示例）
prism mock api/openapi.yaml

# 或 Stoplight Mock
# 前端在 backend 未就绪时用 mock URL 开发
```

**面试怎么讲**：问清团队模式后推荐 design-first 或 code-first；强调 deprecated 字段策略和 mock 并行——体现「契约是协作工具，不是文档摆设」。

---

#### G69. 带人：排期 / 风险 / 周报？

**思路**：可验收、可见、可回滚。

**参考答案**：

**任务拆分（1～3 天可交付）**：

```
❌ 「完成订单模块重构」（2 周黑盒）
✅ 「订单 API 加 tenant_id 过滤 + 单测」（1 天）
✅ 「Outbox poller 实现 + 集成测」（2 天）
✅ 「staging 双写验证 + 对账脚本」（1 天）
```

**Definition of Done（DoD）**：

- [ ] 代码 + 单测（覆盖率不降）
- [ ] CI 绿（lint + test + scan）
- [ ] API 文档 / changelog 更新
- [ ] staging 自测通过（附截图或 curl）
- [ ] PR 描述含：为什么改、怎么测、回滚方式

**风险管理**：


| 类型         | 信号           | 动作                          |
| ---------- | ------------ | --------------------------- |
| 依赖方延迟      | 对接团队无 commit | 升级 blocker；准备降级方案           |
| 技术 unknown | 没见过的中间件      | 先排 **spike**（≤2 天 POC），再估工期 |
| 范围蔓延       | 「顺便加个 XX」    | 新开 task，不塞进当前 sprint        |
| 单人风险       | 只有一人懂某模块     | 结对 + 文档；bus factor ≥ 2      |


**周报模板**：

```markdown
## 本周完成
- [订单] Outbox poller 上线 staging，lag <1s
- [CI] golangci-lint 全量启用，MR 通过率 95%

## 进行中
- [订单] 双写切读（进度 60%，预计周三完成）

## Blocker
- [支付] 对接方 API 文档未更新 → 已 escalate 到 PM，预计周五给

## 下周计划
- 完成切读 + staging 压测
- 开始 RFC-042 灰度方案评审

## 风险
- 双写对账发现 0.01% 不一致，已加补偿 job，需观察 1 周
```

**难点结对**：复杂模块（Saga、迁移）两人一起写，避免知识孤岛；review 互相看。

**面试怎么讲**：用「任务可验收、风险可见、blocker 主动 escalate」三点概括；周报举例体现结构化管理，而非流水账。

---

#### G70. Code Review trade-off（详见 Q24）？

**思路**：P0 正确性；讨论方案不抠格式。

**参考答案**：

**Review 优先级**：


| 级别    | 关注点           | 示例                           |
| ----- | ------------- | ---------------------------- |
| P0 必拦 | 安全、幂等、事务、越权   | SQL 拼接、无 tenant 过滤、吞 error   |
| P1 应改 | 性能、超时、观测、错误处理 | 无 context 传递、缺 metric、N+1 查询 |
| P2 建议 | 命名、结构、可读性     | 函数过长、可提取 helper              |
| 不讨论   | 格式、import 顺序  | golangci-lint 统一             |


**提问式 Review（比命令式更有效）**：

```
❌ 「这里必须用 sync.Pool」
✅ 「如果 QPS ×10，这里的 []byte 分配会成为瓶颈吗？考虑过 sync.Pool 吗？」

❌ 「这个设计不对」
✅ 「如果支付回调重复到达，这段逻辑会重复扣款吗？幂等键在哪？」
```

**PR 作者责任（减少往返）**：

```markdown
## Why
修复订单列表跨租户泄露（IDOR）

## What
- GetOrder / ListOrders 加 tenant_id 过滤
- 补 3 个越权单测

## How to test
curl -H "Authorization: Bearer $TOKEN_A" /orders/123  # 他人订单应 404

## Rollback
Revert commit xxx，无 DB 变更
```

**Linter 统一风格后 CR 聚焦设计**：

- `golangci-lint` CI 拦截格式；reviewer 不浪费时间在「加个空行」。
- CR 时间花在：接口设计、错误路径、并发安全、边界条件。

**Review 节奏**：

- MR 控制在 **≤400 行**（Google 建议）；大了拆 PR。
- 24h 内响应；blocker 标 `[blocking]`，nit 标 `[nit]`。
- 作者 merge 前 resolve 所有 thread；不同意则线下讨论，不在 thread 拉锯。

**面试怎么讲**：说「P0 安全正确性不妥协，风格交给 linter；用提问引导而非命令」——体现 senior 的 review 文化。

---

#### G71. 技术债怎么还？

**思路**：童子军规则 + 专项比例。

**参考答案**：

**两种还债方式**：

**1. 童子军规则（Boy Scout Rule）**：

> 离开代码时比发现时更干净。

- 改 bug 时顺手补测试；触达文件去掉一个 `//nolint`；rename 模糊变量。
- **零额外排期**，积少成多；适合小债（缺测试、命名差、缺 error wrap）。

**2. 专项比例（10～20% 迭代容量）**：

```
Sprint 容量 40 人天
├── 32 人天：功能交付（80%）
└──  8 人天：tech debt epic（20%）
         ├── 升级 Go 1.21 → 1.22
         ├── 订单模块补集成测试
         └── 迁移 deprecated JWT 库
```

**优先级排序**：


| 优先级 | 类型     | 示例                    |
| --- | ------ | --------------------- |
| P0  | 稳定性/安全 | 无超时 RPC、CVE 依赖、无 PDB  |
| P1  | 开发效率   | CI 慢 20min、缺 mock 难单测 |
| P2  | 美观/风格  | 命名统一、目录整理             |
| P3  | 过度设计   | 暂无必要拆的微服务             |


**度量（证明还债有效）**：


| 指标                     | 趋势目标  |
| ---------------------- | ----- |
| Lead time / Cycle time | 下降    |
| Incident 次数（P1/P2）     | 下降    |
| 测试覆盖率                  | 稳定或上升 |
| CI 时长                  | 下降    |
| MTTR                   | 下降    |


**禁止「大爆炸重写」**：

```
❌ 「停功能 3 个月重写订单系统」
✅ Strangler Fig：新接口走新实现，旧接口逐步迁移
   W1-W2: 新 Order Svc 处理 CreateOrder
   W3-W4: 迁移 ListOrders（读路径）
   W5-W6: 迁移 UpdateOrder + 下线旧代码
```

- 无迁移计划的重写 = 技术债换技术债。

**面试怎么讲**：「触达即小改 + 每 sprint 留 10～20% 专项 + 度量验证」三句话；强调大爆炸重写是反模式。

---

#### G72. DDD 轻量：聚合边界怎么划？

**思路**：事务一致性边界。

**参考答案**：

**聚合（Aggregate）核心规则**：

1. **一个聚合根（Aggregate Root）** 是对外唯一入口；外部只能通过根 ID 引用，不能直接改内部实体。
2. **一个事务只修改一个聚合**；跨聚合用领域事件 / MQ（最终一致）。
3. 聚合内强一致；聚合间最终一致。

**示例：电商订单**：

```go
// 聚合根 Order
type Order struct {
    ID         int64
    UserID     int64
    Status     OrderStatus
    Lines      []OrderLine  // 聚合内实体，不单独暴露 repo
    TotalCents int64
}

// ✅ 通过聚合根修改
func (o *Order) AddLine(sku string, qty int, priceCents int64) error {
    if o.Status != Draft {
        return ErrOrderNotEditable
    }
    o.Lines = append(o.Lines, OrderLine{SKU: sku, Qty: qty, PriceCents: priceCents})
    o.recalcTotal()
    return nil
}

// ❌ 外部直接改 OrderLine
// lineRepo.UpdateQty(lineID, 5)  — 破坏聚合封装
```

**边界划分 heuristics**：


| 问题        | 同一聚合              | 不同聚合         |
| --------- | ----------------- | ------------ |
| 是否同一事务修改？ | Order + OrderLine | Order + User |
| 生命周期是否绑定？ | 订单行随订单删除          | 用户独立于订单      |
| 不变量是否跨实体？ | 订单总额 = 各行之和       | 用户积分 vs 订单   |
| 并发冲突域？    | 同一订单同时改行          | 不同用户各自下单     |


**跨聚合通信**：

```go
// Order 聚合完成 → 发布领域事件
func (o *Order) Confirm() error {
    o.Status = Confirmed
    events.Publish(OrderConfirmed{OrderID: o.ID, UserID: o.UserID, Total: o.TotalCents})
    return nil
}

// Inventory 聚合订阅事件，独立事务扣库存
func OnOrderConfirmed(e OrderConfirmed) {
    stock.Reserve(e.OrderID, e.Items)
}
```

**防腐层（Anti-Corruption Layer）**：

```go
// 外部支付系统 DTO 不直接进入 domain
type PaymentGatewayDTO struct { ... } // 外部格式

func (dto PaymentGatewayDTO) ToDomain() domain.Payment {
    return domain.Payment{
        Amount:   dto.Amt,           // 字段映射
        Currency: parseCurrency(dto.Ccy),
    }
}
```

- 外部系统模型与内部 domain 隔离；外部变更只改 ACL，不污染核心逻辑。

**轻量落地建议**：

- 小项目（≤5 人）：**entity + service 够用**，不必强行 Repository/Factory 全套。
- 何时引入：业务规则变复杂、多团队协作、需要事件驱动时。
- 过度 DDD 的信号：为一个 CRUD 建 4 层抽象、聚合只有 1 个字段。

**面试怎么讲**：用 Order/OrderLine vs Order/User 举例说明边界；强调「一个事务一个聚合」是硬规则，跨聚合走事件——体现理解 DDD 精髓而非教条。

---

<h3 id="c-5-7" class="mh2">7. 高级自检（速查）</h3>


| 模块           | 题号      | 题量  | 核心覆盖                                                        |
| ------------ | ------- | --- | ----------------------------------------------------------- |
| **1. 语言**    | G1–G17  | 17  | 逃逸/GC/GMP、并发、context、slice/map、errors、pprof、测试、Pool、channel |
| **2. 框架**    | G18–G32 | 15  | Gin/Kratos、Wire、配置、日志、GORM、Redis、Kafka、gRPC、JWT、Nacos、API   |
| **3. 插件**    | G33–G43 | 11  | 限流熔断、resty、validator、定时任务、ES、OSS、向量库、RAG、幂等                 |
| **4. 运维**    | G44–G55 | 12  | 502/OOM、Docker/K8s、DB、Prometheus/Jaeger、灰度、双网、Linux         |
| **5. CI/CD** | G56–G62 | 7   | 分支策略、GitLab CI、lint、镜像 digest、Helm 回滚、密钥、GitOps             |
| **6. 架构**    | G63–G72 | 10  | 微服务拆分、Saga/TCC、压测、安全、RFC、Swagger、带人、CR、技术债、DDD              |



| 维度        | 高级应能答                             |
| --------- | --------------------------------- |
| **语言**    | 调优 GC/并发，pprof 排障，不是只会写 CRUD      |
| **框架**    | 选型、分层、中间件链、缓存/MQ/鉴权全链路            |
| **插件**    | 问题域 → 库选型；生产级接入与监控                |
| **运维**    | 独立部署、502/OOM/泄漏排障、可观测三板斧          |
| **CI/CD** | 搭流水线、digest 晋级、回滚演练               |
| **架构**    | trade-off 决策、压测、安全、带人与 CR         |
| **业务**    | 结合简历：双网、Casbin、TiDB、GitLab CI、RAG |


**学习路径**：G1–G17 语言 → G18–G32 框架 → G44–G55 运维 → G56–G62 CI/CD → G63–G72 架构；G33–G43 按项目补插件/AI。


<hr aria-hidden="true" style=" border: 0; height: 2px; background: linear-gradient(90deg, transparent, #1bb75c, transparent); margin: 2rem 0; " />

<!-- 目录容器 -->
<div class="mi1">
    <strong>目录</strong>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
            <li style="list-style-type: none;"><a href="#c-1-0">一、个人</a></li>
            <ul style="padding-left: 15px; list-style-type: none;">
                <li style="list-style-type: none;"><a href="#c-1-1">入职公司简介</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-1-1-1">1. 司睿杰</a></li>
                    <li style="list-style-type: none;"><a href="#c-1-1-2">2. 亮风台</a></li>
                    <li style="list-style-type: none;"><a href="#c-1-1-3">3. 现在公司</a></li>
                </ul>
                <li style="list-style-type: none;"><a href="#c-1-2">Go 与 Python 进行比较？</a></li>
                <li style="list-style-type: none;"><a href="#c-1-3">框架该如何设计定义？</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-1-3-1">1. 定位与边界</a></li>
                    <li style="list-style-type: none;"><a href="#c-1-3-2">2. 架构定义</a></li>
                    <li style="list-style-type: none;"><a href="#c-1-3-3">3. 三方面构成</a></li>
                </ul>
                <li style="list-style-type: none;"><a href="#c-1-4">Gin：Radix Tree 与 Context</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-1-4-1">1. Radix Tree</a></li>
                    <li style="list-style-type: none;"><a href="#c-1-4-2">2. Context</a></li>
                </ul>
                <li style="list-style-type: none;"><a href="#c-1-5">Casbin 与 OPA 是什么？</a></li>
                <li style="list-style-type: none;"><a href="#c-1-6">微服务是什么？</a></li>
                <li style="list-style-type: none;"><a href="#c-1-7">链路追踪（OpenTracing）</a></li>
                <li style="list-style-type: none;"><a href="#c-1-8">服务熔断、降级与限流</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-1-8-1">1. 服务熔断与降级</a></li>
                    <li style="list-style-type: none;"><a href="#c-1-8-2">2. 服务限流</a></li>
                </ul>
            </ul>
            <li style="list-style-type: none;"><a href="#c-2-0">二、Docker & K8s</a></li>
            <ul style="padding-left: 15px; list-style-type: none;">
                <li style="list-style-type: none;"><a href="#c-2-1">Docker</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-2-1-1">1. 什么是 Docker、容器、镜像？</a></li>
                    <li style="list-style-type: none;"><a href="#c-2-1-2">2. Docker 镜像原则</a></li>
                    <li style="list-style-type: none;"><a href="#c-2-1-3">3. 更改默认存储路径</a></li>
                </ul>
                <li style="list-style-type: none;"><a href="#c-2-2">Kubernetes</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-2-2-1">1. 容器化好处</a></li>
                    <li style="list-style-type: none;"><a href="#c-2-2-2">2. 容器化流程</a></li>
                    <li style="list-style-type: none;"><a href="#c-2-2-3">3. 部署常见问题</a></li>
                    <li style="list-style-type: none;"><a href="#c-2-2-4">4. deploy / sts / ds 区别</a></li>
                </ul>
            </ul>
            <li style="list-style-type: none;"><a href="#c-3-0">三、AI</a></li>
            <ul style="padding-left: 15px; list-style-type: none;">
                <li style="list-style-type: none;"><a href="#c-3-1">RAG（Retrieval-Augmented Generation）</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-3-1-1">1. 基础流程（Naive RAG）</a></li>
                    <li style="list-style-type: none;"><a href="#c-3-1-2">2. 三代演进</a></li>
                    <li style="list-style-type: none;"><a href="#c-3-1-3">3. Advanced RAG 关键点</a></li>
                    <li style="list-style-type: none;"><a href="#c-3-1-4">4. Modular RAG 关键点</a></li>
                    <li style="list-style-type: none;"><a href="#c-3-1-5">5. 常见命名模式（速查）</a></li>
                </ul>
                <li style="list-style-type: none;"><a href="#c-3-2">LangChain</a></li>
            </ul>
            <li style="list-style-type: none;"><a href="#c-4-0">四、简历项目深挖（问答）</a></li>
            <ul style="padding-left: 15px; list-style-type: none;">
                <li style="list-style-type: none;"><a href="#c-4-1">A. 司睿杰 · 内部 OA / 监理协会考核系统</a></li>
                <li style="list-style-type: none;"><a href="#c-4-2">B. 亮风台 · 云平台（Rust→Go / MySQL→PG）</a></li>
                <li style="list-style-type: none;"><a href="#c-4-3">C. 智慧视通 · 蜂鸟（双网 / 百亿检索 / 服务治理 / 大模型）</a></li>
                <li style="list-style-type: none;"><a href="#c-4-4">D. 跨项目 · 语言 / 框架 / 运维通用深挖</a></li>
            </ul>
            <li style="list-style-type: none;"><a href="#c-5-0">五、高级 Go 能力深挖</a></li>
            <ul style="padding-left: 15px; list-style-type: none;">
                <li style="list-style-type: none;"><a href="#c-5-1">1. 语言（Go 本身）</a></li>
                <li style="list-style-type: none;"><a href="#c-5-2">2. 框架与工程化</a></li>
                <li style="list-style-type: none;"><a href="#c-5-3">3. 插件与生态</a></li>
                <li style="list-style-type: none;"><a href="#c-5-4">4. 运维（Ops）</a></li>
                <li style="list-style-type: none;"><a href="#c-5-5">5. CI/CD</a></li>
                <li style="list-style-type: none;"><a href="#c-5-6">6. 架构与软技能</a></li>
                <li style="list-style-type: none;"><a href="#c-5-7">7. 高级自检（速查）</a></li>
            </ul>
        </ul>
</div>

本技术手册将持续更新，欢迎提交Issue和Pull Request

