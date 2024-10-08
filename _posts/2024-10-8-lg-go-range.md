---
layout: post
title: "Golang 常见数据结构 之 range"
date:   2024-10-8
tags: 
  - Golang
comments: true
author: feng6917
---

<!-- more -->

### 目录

- [一、for range 过程](#一for-range-过程)

#### 一、for range 过程

1. range for slice

    遍历slice前会先获取slice中的长度len_temp作为循环次数，循环体中，每次循环会先获取元素值，如果for-range中接收index和value的话，则会对index和value进行一次赋值。

    由于循环开始前循环次数就已经确定了，所以循环过程中新添加的元素是没办法遍历到的。

2. range for map

    遍历map时没有指定循环次数，循环体与遍历slice类似。由于map底层实现与slice 不同，map底层使用hash表实现，插入数据位置时随机的，所以遍历过程中新插入的数据不能保证遍历到。

    ```go
    package main
    import (
        "fmt"
    )
    func main() {
        m := make(map[int]int, 5)
        for i := 0; i < 5; i++ {
            m[i] = i
        }
        for k, v := range m {
            fmt.Println(k, v)
        }
    }
    ```

3. range for channel

    遍历channel是最特殊的，这是由channel的实现机制决定的.

    channel遍历是一次从channel中读取数据，读取前是不知道里面有多少个元素的。如果channel中没有元素，则会阻塞等待，如果channel已被关闭，则会解除阻塞并退出循环。

    ```go
    package main
    import (
        "fmt"
    )
    func main() {
        ch := make(chan int, 5)
        for i := 0; i < 5; i++ {
            ch <- i
        }
        close(ch)
        for v := range ch {
            fmt.Println(v)
        }
    }
    ```

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

###### 参考链接如下

- [Go 专家编程](https://www.topgoer.cn/docs/gozhuanjia/gochan4)
