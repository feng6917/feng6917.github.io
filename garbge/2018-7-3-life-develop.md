---
layout: post
title: "一次普普通通开发"
date:   2018-7-3
tags: 
  - life
comments: true
author: feng6917
---

`身为一个莽夫，想做一名愚者。`

<!-- more -->

### [目录]

- [需求沟通](#需求沟通)

- [技术调研](#技术调研)

- [技术选型](#技术选型)

- [技术架构](#技术架构)

- [技术文档](#技术文档)

- [技术开发](#技术开发)

- [复盘](#复盘)

#### 需求沟通

  ```
    程序开发最多是写代码，写代码最多是写业务逻辑，写业务逻辑最多是理清开发需求。
    理清开发需求最多是沟通，沟通最多是协调，协调最多是扯皮。
    算了，扯皮就扯皮吧，反正我是程序员，程序员就是干活的。

    1. 需求沟通前，先明确需求文档，整理需求质疑点
    2. 需求沟通时，明确质疑点目标，阐述质疑原因，记录落实点
    3. 需求沟通后，持续反馈，持续沟通
    
  ```

#### 技术调研

  ```
    1. 提高重视
    2. 明确需求
    3. 寻找方案（大厂>开源>自研）
    4. 跑通demo
  ```

#### 技术选型

  参考: [项目中怎样做技术选型](https://cloud.tencent.com/developer/article/1901155)

#### 技术架构

- [架构设计实践五部曲（一）：架构与架构图](https://www.infoq.cn/article/b1fCLl8Mk9L9qe45Zxp6)
- [架构设计实践五部曲（二）：业务架构与产品架构设计实践](https://www.infoq.cn/article/5A8LiWThDdHpkjeKgWLk)
- [架构设计实践五部曲（三）：从领域模型提取数据架构](https://www.infoq.cn/article/gecWdtRC85LD3kfXlWNU)
- [架构设计实践五部曲（四）：单体式与分布式的应用架构](https://www.infoq.cn/article/ZzI05OBgks2kspUWa5y7)
- [架构设计实践五部曲（五）：技术架构的战略和战术原则](https://www.infoq.cn/article/rqdwwxdcwbxtwu8lbfsg)

#### 技术文档

  参考: [如何编制软件技术文档（软件技术文档编写标准规范）](https://kangle.im/post/49952.html)

#### 技术开发

- 1. 梳理流程，设计数据结构，交互协议确定
- 2. 开发解耦，业务代码编写，协议独立测试
- 3. 集成测试，前后端联调，业务功能测试
- 4. 技术部署，技术运维，技术监控

#### 复盘

  参考: [项目复盘该怎么做？一篇教你轻松搞定！附超级模版](https://www.cnblogs.com/zgq123456/articles/18312086)


随便写 

分布式，微服务中只强调API，无论是数据还是算法还是其他功能的API都是API，至于该API怎么实现的算法，怎么查询的数据，数据存在什么数据库中都不再强调。针对数据查询也就相当于在数据库上添加一层API，所以我现在把数据层称为数据服务层，或干脆就是API，盖层的好处：保护数据，添加访问权限，优化数据库查询，方便添加数据缓存等，再说了数据库表结构和API不是一一对应的，而且数据库也不必要是关系型数据库，网络数据库，一个TXT就可以是一个数据库，针对不同场景可以选择的不同的存储方式。
