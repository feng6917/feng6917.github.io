---
layout: post
title: "Golang GC 之 逃逸分析"
date:   2024-10-12
tags: 
  - Golang
comments: true
author: feng6917
---

<!-- more -->

### 目录
>
> 所谓逃逸分析（escape analysis）是指由编译器决定内存分配的位置，不需要程序员决定。
> 函数中申请一个新的对象。
>
> - 如果分配在栈中，则函数执行结束可自动将内存回收。
> - 如果分配在堆中，则函数执行结束可交给GC来回收。
>
> 逃逸分析在编译阶段就进行了，所以逃逸分析不会影响程序运行时的性能。、

- [一、逃逸策略](#一逃逸策略)
- [二、逃逸场景](#二逃逸场景)
- [三、逃逸总结](#三逃逸总结)

#### 一、逃逸策略

每当函数中申请新的对象，编译器会根据对象是否被函数外部引用来决定是否逃逸。

1. 如果函数外部没有引用，则优先放到栈上。
2. 如果函数外部存在引用，则必定放在堆上。

注意，对于函数外部没有引用的对象，也有可能放在堆中，比如内存过大超过栈的存储能力。

<hr style="background-color: blue;border: none;height: 10px;opacity: .1;width: 100%" />

#### 二、逃逸场景

1. 指针逃逸

    Go可以返回局部变量指针，这其实是一种典型的变量指针逃逸案例。

    ```go
    package main

    func main() {
        foo()
    }

    func foo() *int {
        var a int = 1
        return &a
    }

    CMD:
    go build -gcflags=-m

    OUTPUT:
    ./main.go:7:6: can inline foo
    ./main.go:3:6: can inline main
    ./main.go:4:5: inlining call to foo
    ./main.go:8:6: moved to heap: a
    ```

2. 栈空间不足逃逸

    当栈空间不足以存放当前对象时或无法判断当前切片长度时，会将对象分配到堆上。

    ```go
    package main

    func main() {
        foo()
    }

    func foo() {
        s := make([]int, 1000, 1000)

        for index, _ := range s {
            s[index] = index
        }
    }

    CMD:
    go build -gcflags=-m

    OUTPUT:
    ./main.go:7:6: can inline foo
    ./main.go:3:6: can inline main
    ./main.go:4:5: inlining call to foo
    ./main.go:4:5: make([]int, 1000, 1000) does not escape
    ./main.go:8:11: make([]int, 1000, 1000) does not escape
    ./main.go:8:11: make([]int, 1000, 1000) does not escape

    OUTPUT(10000):
    ./main.go:7:6: can inline foo
    ./main.go:3:6: can inline main
    ./main.go:4:5: inlining call to foo
    ./main.go:4:5: make([]int, 10000, 10000) escapes to heap
    ./main.go:8:11: make([]int, 10000, 10000) escapes to heap
    ```

3. 动态类型逃逸

    变量在赋值过程中，如果接收者是接口类型，那么值可能发生逃逸。

    很多函数参数为interface类型，比如fmt.Println(a …interface{})，编译期间很难确定其参数的具体类型，也会产生逃逸。

    ```go
    package main

    func main() {
        foo()
    }

    func foo() {
        var i interface{} = 1
        fmt.Println(i)
    }

    CMD:
    go build -gcflags=-m

    OUTPUT:
    ./main.go:11:13: inlining call to fmt.Println
    ./main.go:5:6: can inline main
    ./main.go:10:22: 1 escapes to heap
    ./main.go:11:13: ... argument does not escape
    ```

4. 闭包逃逸
    闭包引用了函数外部变量，不得不放到堆上，则闭包发生逃逸。

    ```go
    package main

    import "fmt"

    func main() {
        f := foo()
        for i := 0; i < 5; i++ {
            fmt.Println("val: ", f())
        }
    }

    func foo() func() int {
        a := 0
        return func() int {
            a += 1
            return a
        }
    }

    CMD: go run .

    OUTPUT:
    val:  1
    val:  2
    val:  3
    val:  4
    val:  5

    CMD:
    go build -gcflags=-m

    OUTPUT:
    ./main.go:12:6: can inline foo
    ./main.go:14:9: can inline foo.func1
    ./main.go:6:10: inlining call to foo
    ./main.go:14:9: can inline main.foo.func1
    ./main.go:8:25: inlining call to main.foo.func1
    ./main.go:8:14: inlining call to fmt.Println
    ./main.go:6:10: func literal does not escape
    ./main.go:8:14: ... argument does not escape
    ./main.go:8:15: "val: " escapes to heap
    ./main.go:8:25: ~r0 escapes to heap
    ./main.go:13:2: moved to heap: a
    ./main.go:14:9: func literal escapes to heap
    ```

<hr style="background-color: blue;border: none;height: 10px;opacity: .1;width: 100%" />

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

#### 三、逃逸总结

- 堆上分配内存比在堆中分配内存有更高的效率
- 栈上分配的内存不需要GC处理
- 堆上分批的内存使用完毕会交给GC处理
- 逃逸分析目的是决定内存分配地址是栈还是堆
- 逃逸分析在编译阶段完成

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

###### 参考链接如下

- [Go 专家编程](https://www.topgoer.cn/docs/gozhuanjia/gochan4)
