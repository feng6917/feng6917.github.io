---
layout: post
title: "Golang 常见数据结构 之 iota"
date:   2024-9-27
tags: 
  - Golang
comments: true
author: feng6917
---

<!-- more -->

### 目录

- [一、iota 是什么](#一iota-是什么)
- [二、iota 的用法](#二iota-的用法)

#### 一、iota 是什么

iota 是 Go 语言的常量计数器，只能在常量的表达式中使用。

iota 在 const 关键字出现时将被重置为 0（const 内部的第一行之前），const 中每新增一行常量声明将使 iota 计数一次（iota 可理解为 const 语句块中的行索引）。

#### 二、iota 的用法

    1. 定义枚举值

        ```go
        const (
            Sunday = iota
            Monday
            Tuesday
            Wednesday
            Thursday
            Friday
            Saturday
        )
        ```

    2. 位运算

    ```go
    const (
        _ = iota
        KB = 1 << (10 * iota)
        MB
        GB
        TB
        PB)
    ```

    3. 自增值

    ```go
    const (
        a = iota
        b
        c
        d = "f"
        e
        f
        g = iota
        h
    )
    ```

    4. 自定义类型和自增枚举

    ```go
    type Direction int

    const (
        North Direction = iota
        East
        South
    )
    ```

    案例参考:

    ```go
    const (
        bit0, mask0 = 1 << iota, 1<<iota - 1   //const声明第0行，即iota==0
        bit1, mask1                            //const声明第1行，即iota==1, 表达式继承上面的语句
        _,_                                   //const声明第2行，即iota==2
        bit3, mask3                            //const声明第3行，即iota==3
    )
    ```

    - 第0行 iota == 0，所以 bit0 == 1 << 0 == 1，mask0 == 1<<0 - 1 == 0
    - 第1行 iota == 1，所以 bit1 == 1 << 1 == 2，mask1 == 1<<1 - 1 == 1
    - 第2行 iota == 2，但被跳过了，所以 bit2 == 0，mask2 == 0
    - 第3行 iota == 3，所以 bit3 == 1 << 3 == 8，mask3 == 1<<3 - 1 == 7

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

###### 参考链接如下

- [Go 专家编程](https://www.topgoer.cn/docs/gozhuanjia/gochan4)
