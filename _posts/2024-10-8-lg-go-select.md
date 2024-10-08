---
layout: post
title: "Golang 常见数据结构 之 select"
date:   2024-10-8
tags: 
  - Golang
comments: true
author: feng6917
---

<!-- more -->

### 目录

- [一、select 是什么](#一iota-是什么)
- [二、select 实现](#二iota-的用法)

#### 一、select 是什么、

select 是 Go 语言中的一个关键字，用于在多个通道上进行非阻塞的通信操作。它允许一个 goroutine 同时等待多个通道的操作，并在其中一个通道上接收到数据时执行相应的操作。

select 语句的基本语法如下：

```go
select {
case <-ch1:
    // 处理 ch1 上的数据
case ch2 <- data:
    // 将数据发送到 ch2
default:
    // 如果所有通道都不可用，则执行默认操作
}
```

在 select 语句中，每个 case 语句表示一个通道操作。如果某个 case 语句中的通道操作可以立即执行，则 select 语句将选择该 case 语句并执行其中的操作。如果所有 case 语句中的通道操作都不可用，则 select 语句将选择 default 语句并执行其中的操作。

#### 二、 select 实现

Golang 实现select时，定义了一个数据结构表示每个case语句（含default，default实际上时一种特殊的case）,select 执行过程可以类比成一个函数，函数输入case数据，输出选中的case，然后程序流程转到选中的case块。



<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

###### 参考链接如下

- [Go 专家编程](https://www.topgoer.cn/docs/gozhuanjia/gochan4)
