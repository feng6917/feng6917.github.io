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

- [一、select 是什么](#一select-是什么)
- [二、select 实现](#二select-实现)

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

#### 二、select 实现

Golang 实现select时，定义了一个数据结构表示每个case语句（含default，default实际上时一种特殊的case）,select 执行过程可以类比成一个函数，函数输入case数据，输出选中的case，然后程序流程转到选中的case块。

1. case 数据结构

    ```go
    type scase struct {
        c    *hchan         // chan
        elem unsafe.Pointer // data element
    }
    ```

    1. c *hchan: 为当前所操作的chanel指针，表示与该`case`分支相关联的通道。`hchan`是GO语言内部表示通道的结构体，包含了通道的缓冲区、发送和接收队列等信息。
    2. elem unsafe.Pointer: 表示缓冲区地址，这是一个`unsafe.Pointer`类型的指针，用于存储从通道中读取或写入的数据。`unsafe.Pointer`是一个特殊的指针类型，可以指向任何类型的内存地址，因此可以用于存储任意类型的数据。

2. select 实现逻辑

    ```go
        func selectgo(cas0 *scase, order0 *uint16, pc0 *uintptr, nsends, nrecvs int, block bool) (int, bool) {
    ```

    函数参数：
    1. cas0 为scase数组的首地址，selectgo()就是从这些scase中找出一个返回。
    2. order0 为一个两倍cas0数组长度的buffer，保存scase随机序列pollorder和scase中channel地址序列lockorder。
        - pollorder: 每次selectgo执行都会把是case序列打乱，防止selectgo总是从同一个case开始检查。
        - lockorder: 所有case语句中channel序列，以达到去重防止对channel加锁时重复加锁的目的。

    3. pc0 为一个uintptr数组，保存每个case的返回pc（Program Counter），也就是selectgo()返回后，程序继续执行的地址。
    4. nsends 为发送case的数量。
    5. nrecvs 为接收case的数量。
    6. block 为是否阻塞模式，如果为false，则表示非阻塞模式。

    函数返回值：
    1. int: 选中case的编号，这个case编号跟代码一致。
    2. bool: 是否成功从channel中读取了数据，如果选中的case是从channel中读数据，则该返回值表示是否读取成功。

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

###### 参考链接如下

- [Go 专家编程](https://www.topgoer.cn/docs/gozhuanjia/gochan4)
