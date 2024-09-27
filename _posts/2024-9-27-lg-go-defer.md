---
layout: post
title: "Golang 常见数据结构 之 defer"
date:   2024-9-27
tags: 
  - Golang
comments: true
author: feng6917
---

<!-- more -->

### 目录

- [一、defer 是什么](#一defer-是什么)
- [二、defer 规则](#二defer-规则)
- [三、defer 实现原理](#三defer-实现原理)
- [四、defer 的创建和执行](#四defer-的创建和执行)

#### 一、defer 是什么

defer 是 Go 语言中的一种关键字，用于延迟执行函数。defer 语句会在函数返回之前执行，通常用于释放资源、关闭文件、解锁互斥锁等操作。

defer 语句的语法如下：

```go
defer function()
```

其中，function() 是要延迟执行的函数。当 defer 语句被执行时，函数会被压入一个栈中，当函数返回时，栈中的函数会按照后进先出的顺序依次执行。

#### 二、defer 规则

1. 延迟函数的参数在defer语句出现时就已经确定下来了

2. 延迟函数执行按后进先出顺序执行，即先出现的defer最后执行。

3. 延迟函数可能操作主函数的具名返回值。

#### 三、defer 实现原理

源码包 `src/runtime/runtime2.go:_defer` 定义了defer的数据结构：

```go
type _defer struct {
    heap      bool
    rangefunc bool    // true for rangefunc list
    sp        uintptr // sp at time of defer
    pc        uintptr // pc at time of defer
    fn        func()  // can be nil for open-coded defers
    link      *_defer // next defer on G; can point to either heap or stack!

    // If rangefunc is true, *head is the head of the atomic linked list
    // during a range-over-func execution.
    head *atomic.Pointer[_defer]
}
```

- heap：一个布尔值，表示这个 _defer 结构体是否在堆上分配。Go 语言运行时系统会根据需要决定是否将_defer 结构体放在堆上，以避免栈溢出。

- rangefunc：一个布尔值，表示这个 _defer 是否与 range 语句相关。如果为 true，则表示这个_defer 是在 range 语句中使用的，并且会涉及到一个原子链表。

- sp：一个 uintptr 类型的值，表示在执行 defer 语句时的栈指针（stack pointer）。这个值用于在函数返回时正确地恢复栈的状态。

- pc：一个 uintptr 类型的值，表示在执行 defer 语句时的程序计数器（program counter）。这个值用于在函数返回时正确地恢复执行的位置。

- fn：一个函数类型的值，表示要延迟执行的函数。这个函数在 defer 语句执行时被调用。

- link：一个指向 _defer 结构体的指针，表示下一个延迟函数调用。这个指针可以指向堆上的_defer 结构体，也可以指向栈上的 _defer 结构体。

- head：一个指向 atomic.Pointer[_defer] 类型的指针，用于在 range 语句中存储链表的头节点。这个字段只在 rangefunc 为 true 时有效。

新声明的defer总是添加到链表头部，函数返回前执行defer则是从链表首部依次取出执行。

一个goroutine可能连续调用多个函数，defer添加过程进入函数时添加defer，离开函数时取出defer，所以即便调用多个函数，也总是能保证defer是按后进先出顺序执行的。

#### 四、defer 的创建和执行

源码包 `src/runtime/panic.go` 定义了两个方法分别用于创建defer和执行defer：

- deferproc：创建defer,在声明defer处调用，其将defer函数存入goroutine的链表中。
- deferreturn：执行defer，在return指令（ret指令）函数返回前调用，其从goroutine的链表中取出defer函数并执行。

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

###### 参考链接如下

- [Go 专家编程](https://www.topgoer.cn/docs/gozhuanjia/gochan4)
