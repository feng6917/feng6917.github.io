##### 马燕争

姓名：马燕争 · 学历：本科 · 经验：8 年 · 所在地：杭州 · 求职：Golang 后端 / AI 工程化（2018—至今）  
电话：175-2132-8428 · 邮箱：[feng6917@gmail.com](mailto:feng6917@gmail.com) · 博客：[feng6917.github.io](https://feng6917.github.io)

##### 工作技能

**后端与架构**

1. 8 年 Golang 服务端经验，熟悉 Gin、Kratos 等框架，具备框架定制与二次开发能力。
2. 双网/跨网闸架构设计与落地，GA/1400 等协议对接与转换，高并发数据传输与同步。
3. 分布式与微服务：任务调度、服务治理；gRPC、WebSocket 长连接与多服务协同。
4. 可观测性：Prometheus 指标、Jaeger 链路追踪、Grafana 看板、pprof 性能分析；限流、熔断、监控告警。
5. 熟悉 MySQL、TiDB、向量库（Vearch / Milvus）、消息队列、对象存储等中间件；容器化、CI/CD、K8s 私有化部署。

**大模型与智能体**

1. 大模型业务：以图搜图、以文搜图及组合检索；流摘要向量提取与 Milvus 向量存储与检索。
2. 智能体：规则/关键词路由与意图 LLM（纠偏、抽槽、短总结）；档案库/知识库、RAG；Prompt 设计与迭代。
3. 工程化：Function Call、Tool/MCP 接入；FunASR 语音转文字、CosyVoice 文字转语音及多模态业务链路。
4. 擅长结合 AI 工具提升研发效率，具备 LLM/Agent 从方案到落地的实践经验。

##### 工作经历

- 智慧视通（杭州）科技有限公司  
2023.03～至今 · Golang 研发组长
  1. 设计并落地企业级双网数据传输架构（跨网闸），支撑约 4000 路设备摘要与状态同步；协议转换及 GA/1400 等行业协议对接。
  2. 主导形体识别项目检索、布控预警、历史回溯等核心服务重构（人脸/形体特征基于 Vearch）；引入任务调度与服务治理体系，提升稳定性与可运维性。
  3. 设计并落地大模型以图搜图、以文搜图及组合搜图（Milvus）；推进智能体（路由 + 意图 LLM、档案库/RAG）及 Function Call/MCP/Tool 集成。
  4. 搭建 GitLab CI 与集成环境，平滑迁移仓库、依赖与镜像；FunASR / CosyVoice 语音链路等多模态业务参与设计与落地。
  5. 梳理业务流程，任务分配与攻坚，周报汇总与团队协作。
- 亮风台（上海）信息科技有限公司  
2021.11～2023.01 · Golang 开发工程师
  1. 参与 AR PaaS 云平台重构：主导库表迁移（MySQL→PostgreSQL）、RBAC 权限落地及 Redash 查数/看板集成。
  2. 负责工地可视化：Rust 薪资管理服务 Go 重写；海康平台视频流接入与播放；业务短信发送。
- 上海司睿杰建筑科技有限公司  
2018.08～2021.11 · Python/Golang 开发  
  1. 实现 FTP 服务器文档与 MySQL 文章同步，基于 Elasticsearch（IK 分词）的全文检索（Python、MySQL Binlog、Elasticsearch）。
  2. 主导监理协会考核系统从零到一；OA 侧参与网盘、权限及文档在线预览（Casbin、 Offlice Online）。

##### 项目经验

- 蜂鸟项目（双网智能分析平台）
  1. 项目介绍
    企业级双网智能化分析应用系统，视频流取帧与人脸/形体解析，支撑检索、布控、档案库、聚类等场景；含大模型检索与智能体业务扩展。
  2. 工作内容
    1. **双网与协议**：跨网闸数据传输；GA/1400 等协议转换及多平台对接；压缩、限流与大容量数据分治，支撑百亿级检索、日亿级存储。
    2. **核心服务**：重构布控（业务中心 + 无状态工作节点）、摘要检索与历史回溯；数据分片、动态缩略图与分布式处理。
    3. **服务治理**：任务调度；Prometheus + Jaeger + Grafana + pprof；gRPC/WebSocket；限流、熔断与链路追踪。
    4. **大模型与智能体**：Milvus 向量检索；图/文/组合搜图与文字布控；智能体路由与意图 LLM、档案库/RAG；Function Call、MCP/Tool、Prompt；FunASR / CosyVoice。
    5. **向量检索**：人脸/形体特征检索沿用 Vearch；大模型与智能体侧接入 Milvus。
  3. 技术栈
    `Gin`、`gRPC`、`WebSocket`、`MySQL`、`TiDB`、`Vearch`、`Milvus`、`MinIO`、`SeaweedFS`、`NSQ`、`Kafka`、`FunASR`、`CosyVoice`、`Docker`、`K8s`、`Helm`、`Prometheus`、`Jaeger`、`Grafana`
- 云平台（PaaS）与工地可视化
  1. 项目介绍
    自研 AR PaaS（[console.hiar.com](https://console.hiar.com/)）及工地可视化场景；重构期实践 DDD 拆分与 Kratos 微服务治理。
  2. 工作内容
    1. **PaaS 重构**：制定并实施全量/增量数据迁移；权限体系（RBAC + Keycloak）；ARStudio 图像识别架构精简；Redash 自助分析集成；Excel 导出等通用插件。
    2. **工地可视化**：Rust 薪资管理服务 Go 重写，统一技术栈；海康平台视频流接入与播放；业务短信发送。
  3. 技术栈
    `Kratos`、`Wire`、`MySQL`、`PostgreSQL`、`Keycloak`、`Nacos`、`MinIO`、`OSS`、`Prometheus`、`Rancher`、`Redash`

##### 感谢您花时间阅读我的简历，期待能有机会和您共事

