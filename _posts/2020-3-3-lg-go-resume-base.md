---
layout: post
title: "面试题-八股文问题"
date:   2020-3-3
tags: 
  - Golang
comments: true
author: feng6917
---

`golang 基础面试汇总`

<!-- more -->

#### 目录

[常用词汇理解](#常用词汇理解)

#### 常用词汇理解

1. QPS、TPS、RT、并发数理解和性能优化
   - QPS (Queries Per Second) 每秒查询数
    > 代表每秒能响应的查询次数。这里的查询数指的是用户的请求到服务器做出响应成功的次数。
    > 简单理解可以理解为查询等于请求request,也就是qps=每秒钟request的数量。
    > QPS = 并发数/RT
   - TPS (Transactions Per Second) 每秒事务数
    > 一个事务是指一个客户机 向服务器发送请求 然后服务器做出反应的过程。客户机在发送请求时开始计时，收到服务器响应后结束计时，以此计算使用的时间和完成的事务个数。
    > 针对单接口而言，TPS可以认为是等价于QPS的。
   - RT （Response Time）响应时间
    > 系统从输入到输出的时间间隔，代表从客户端发起请求到服务端接收请求并响应所有数据的时间差。一般取平均响应时间。
   - 并发数
    > 指系统能够同时处理的请求或事务数量。

[返回上级](https://feng6917.github.io/language-golang/#面试题)

[Go Learn](https://feng6917.github.io/language-golang/#目录)

---
参考链接如下

- [面试题](http://mian.topgoer.com/)
