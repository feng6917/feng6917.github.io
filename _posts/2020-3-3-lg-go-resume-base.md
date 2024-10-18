---
layout: post
title: "面试题-八股文问题"
date:   2020-3-3
tags: 
  - Gulang
comments: true
author: feng6917
---

`gulang 基础面试汇总`

<!-- more -->

#### 目录

[Go基础面试题]()

[常用词汇理解](#常用词汇理解)

<hr>

#### Go基础面试题

1. = 和 := 的区别

    <details>
    <summary>Ans</summary>
    = 赋值变量，赋值操作符
    <p>:= 定义变量，是一个声明并赋值操作符</p>  
    <ul>
        <li>在函数体外，不能使用 := 来给变量赋值，只能用 = 或者 var =</li>
    </ul>
    </details>

2. 指针的作用

    <details>
    <summary>Ans</summary>
    <ul>
        <li>指针可以记录变量在内存中的地址，通过地址可以快速定位到变量，从而操作该变量。</li>
        <li>指针可以节省内存空间，因为指针直接指向内存地址，不需要存储变量的值。</li>
    </ul>
    </details>

3. go 允许多个返回值么
    <details>
    <summary>Ans</summary>
    <ul>
        <li>Go 允许多个返回值</li>
    </ul>
    </details>

4. go 有异常类型么
    <details>
    <summary>Ans</summary>
    <ul>
        <li>Go 没有异常类型，但有错误类型</li>
    </ul>
    </details>

5. 什么是协程（Goroutine）
    <details>
    <summary>Ans</summary>
    协程是用户态轻量级线程，它是线程调度的基本单位。通常在函数前加上go关键字就能实现并发。一个Goroutine会以一个很小的栈启动2KB或4KB，当遇到栈空间不足时，栈会自动伸缩， 因此可以轻易实现成千上万个goroutine同时启动。
    </details>

6. 如何高效的拼接字符串
    <details>
    <summary>Ans</summary>
    strings.Join ≈ strings.Builder > bytes.Buffer > "+" > fmt.Sprintf
    </details>

7. 什么是rune类型
    <details>
    <summary>Ans</summary>
    ASCII 码只需要 7 bit 就可以完整地表示，但只能表示英文字母在内的128个字符，为了表示世界上大部分的文字系统，发明了 Unicode， 它是ASCII的超集，包含世界上书写系统中存在的所有字符，并为每个代码分配一个标准编号（称为Unicode CodePoint），在 Go 语言中称之为 rune，是 int32 类型的别名。
    </details>

8. go 支持默认参数或可选参数么
    <details>
    <summary>Ans</summary>
    不支持。但是可以利用结构体参数，或者...传入参数切片数组。
    </details>

9. defer 的执行顺序
    <details>
    <summary>Ans</summary>
    defer执行顺序和调用顺序相反，类似于栈后进先出(LIFO)。
    <p>defer在return之后执行，但在函数退出之前，defer可以修改返回值。</p>
    <ol>
        <li>Go 中的 defer 语句会将函数推迟到外层函数返回之后执行。</li>
        <li>推迟的函数调用会被压入一个栈中。当外层函数返回时，被推迟的函数会按照后进先出的顺序调用。</li>
    </ol>
    </details>

10. go 语言tag的用处
    <details>
    <summary>Ans</summary>
    <ul>
        <li>结构体中的tag常用于json序列化、orm映射、Gin Form、 Form binding等</li>
    </ul>
    </details>

11. 如何获取一个结构体的所有tag
    <details>
    <summary>Ans</summary>
    <ul>
        <li>reflect 包</li>
    </ul>
    </details>

12. 如何判断两个字符串切片（slice）是相等的
    <details>
    <summary>Ans</summary>
    <ul>
        <li>使用reflect.DeepEqual()函数</li>
    </ul>
    </details>

13. 结构体打印时，%v,%s+v,%#v的区别
    <details>
    <summary>Ans</summary>
    <ul>
        <li>%v 值的默认格式</li>
        <li>%+v 类似%v，但输出结构体时会添加字段名</li>
        <li>%#v 值的Go语法表示</li>
    </ul>
    </details>

14. go 语言如何表示枚举值
    <details>
    <summary>Ans</summary>
    <ul>
        <li>使用const关键字定义枚举值</li>
        <li>使用Itoa进行自增</li>
    </ul>
    </details>

15. 空结构体的用途
    <details>
    <summary>Ans</summary>
    <ul>
        <li>空结构体不占用内存空间</li>
        <li>空结构体可以作为结构体字段的占位符</li>
        <li>空结构体可以作为通道的缓冲区</li>
    </ul>
    </details>

16. go 里面的int和int32的区别
    <details>
    <summary>Ans</summary>
    <ul>
        <li>go语言中的int的大小是和操作系统位数相关的，如果是32位操作系统，int类型的大小就是4字节。如果是64位操作系统，int类型的大小就是8个字节。除此之外uint也与操作系统有关。</li>
        <li>int8占1个字节，int16占2个字节，int32占4个字节，int64占8个字节。</li>
    </ul>
    </details>

17. init() 函数是什么时候执行的，可以执行多次么
    <details>
    <summary>Ans</summary>
    <p>init()函数是go初始化的一部分，由runtime初始化每个导入的包，初始化不是按照从上到下的导入顺序，而是按照解析的依赖关系，没有依赖的包最先初始化。</p>
    <p>每个包首先初始化包作用域的常量和变量（常量优先于变量），然后执行包的init()函数。同一个包，甚至是同一个源文件可以有多个init()函数。init()函数没有入参和返回值，不能被其他函数调用，同一个包内多个init()函数的执行顺序不作保证。</p>
    <p>执行顺序：import –> const –> var –>init()–>main()</p>
    <p>一个文件可以有多个init()函数！</p>
    </details>

18. 多个init()函数的意义何在
    <details>
    <summary>Ans</summary>
    <ol>
        <li>分离初始化逻辑：可以将不同的初始化逻辑分离到不同的init()函数中，使得代码更加模块化和清晰。</li>
        <li>顺序控制：init()函数的执行顺序是确定的，它们按照它们在文件中的出现顺序执行</li>
        <li>简化包的初始化：通过将初始化逻辑分散到多个init()函数中，可以简化包的初始化过程。</li>
        <li>并行执行：在Go 1.9版本之后，init()函数可以并行执行。这意味着多个init()函数可以在不同的goroutine中并行执行，从而提高程序的启动速度。</li>
    </ol>
    </details>

19. 如何知道一个对象是分配到堆上还是栈上
    <details>
    <summary>Ans</summary>
    Go局部变量会进行逃逸分析。如果变量离开作用域后没有被引用，则优先分配到栈上，否则分配到堆上。那么如何判断是否发生了逃逸呢？

    <code>go build -gcflags '-m -m -l' xxx.go.</code>

    关于逃逸的可能情况：变量大小不确定，变量类型不确定，变量分配的内存超过用户栈最大值，暴露给了外部指针。
    </details>

20. 2个interface{} 可以比较么
    <details>
    <summary>Ans</summary>
    <ul>
        <li>不能直接比较</li>
        <li>需要先判断类型是否一致</li>
        <li>类型一致，再判断值是否一致</li>
    </ul>
    </details>

21. 函数返回局部变量的指针是安全的么？
    <details>
    <summary>Ans</summary>
    <ul>
        <li>不安全</li>
        <li>函数返回局部变量的指针，当函数返回后，局部变量会被销毁，此时指针指向的内存区域已经无效</li>
    </ul>
    </details>

22. 无缓冲的channel和有缓冲的channel的区别
    <details>
    <summary>Ans</summary>
    <ul>
        <li>无缓冲的channel：发送的数据如果没有被接收方接收，那么发送方阻塞；如果一直接收不到发送方的数据，接收方阻塞；</li>
        <li>有缓冲的channel：发送方在缓冲区满的时候阻塞，接收方不阻塞；接收方在缓冲区为空的时候阻塞，发送方不阻塞。</li>
    </ul>
    </details>

23. 为什么会有协程泄露(Goroutine Leak)
    <details>
    <summary>Ans</summary>
    协程泄露主要是指协程创建后没有进行释放，主要原因是：
    <ul>
        <li>缺少接收器，导致发送阻塞</li>
        <li>缺少发送器，导致接收阻塞</li>
        <li>死锁。多个协程由于竞争资源导致死锁。</li>
        <li>创建协程的没有回收。</li>
    </ul>
    </details>

24. go 可以限制运行时操作系统的线程数量么，常见的goroutine函数有哪些
    <details>
    <summary>Ans</summary>
    <ul>
        <li>go可以限制运行时操作系统的线程数量，通过runtime包中的GOMAXPROCS函数可以设置。该值默认为CPU逻辑核数，如果设的太大，会引起频繁的线程切换，降低性能。</li>
        <li>常见的goroutine函数有：
          <ul>
              <li>runtime.Gosched() 让出当前goroutine的执行权限，调度器安排其它等待的任务运行，并在下次某个时候从该位置恢复执行。</li>
              <li>runtime.Goexit() 退出当前goroutine，不会影响其他goroutine的执行。</li>
              <li>runtime.GOMAXPROCS() 设置可执行的CPU核数，默认为CPU逻辑核数。</li>
          </ul>
        </li>
    </ul>
    </details>

25. new 和 make 的区别
    <details>
    <summary>Ans</summary>
    <ul>
        <li>new用于分配内存，make用于初始化slice、map和channel。</li>
        <li>new返回的是指向类型的指针，make返回的是类型本身。</li>
        <li>new返回的指针指向的值为类型的零值，make返回的值是类型的零值。</li>
    </ul>
    </details>

26. 简述Golang 面向对象是如何实现的？
    <details>
    <summary>Ans</summary>
    Go实现面向对象的两个关键是struct和interface。
    <ul>
        <li>封装：对于同一个包，对象对包内的文件可见；对不同的包，需要将对象以大写开头才是可见的。</li>
        <li>继承：继承是编译时特征，在struct内加入所需要继承的类即可</li>
        <li>多态：多态是运行时特征，Go多态通过interface来实现。类型和接口是松耦合的，某个类型的实例可以赋给它所实现的任意接口类型的变量。</li>
    </ul>
    </details>

27. uint型变量值分为为1，2，它们相减的结果是多少？
    <details>
    <summary>Ans</summary>
    答案，结果会溢出，如果是32位系统，结果是2^32-1，如果是64位系统，结果2^64-1.
    </details>

28. golang的内存管理的原理清楚吗？简述go内存管理机制。
    <details>
    <summary>Ans</summary>
    <ul>
        <li>spans, bitmap, arena</li>
        <li>mcentral, mcache, mheap</li>
        <li>内存回收 标记清除、三色标记、+ 混合写屏障法</li>
    </ul>
    参考：
    [内存分配](https://feng6917.github.io/lg-go-gc-1/)
    [内存回收](https://feng6917.github.io/lg-go-gc-2/)
    </details>

29. mutex有几种模式？分别是什么？
    <details>
    <summary>Ans</summary>
    两种模式：正常模式和饥饿模式。
    参考：[Mutex](https://feng6917.github.io/lg-go-mutex/)
    </details>

30. go 如何进行调度的？详细说一下
    <details>
    <summary>Ans</summary>
    <p>GMP</p>
    参考：[goroutine](https://feng6917.github.io/lg-go-goroutine/)
    </details>

31. go 什么时候发生阻塞，阻塞时，调度器会怎么做？
    <details>
    <summary>Ans</summary>
    <ul>

    </ul>
    </details>

#### 常用词汇理解

1. QPS、TPS、RT、并发数理解和性能优化

    <details>
    <summary>Ans</summary>
    QPS (Queries Per Second) 每秒查询数
    <ul>
        <li>代表每秒能响应的查询次数。这里的查询数指的是用户的请求到服务器做出响应成功的次数。</li>
        <li>简单理解可以理解为查询等于请求request,也就是qps=每秒钟request的数量。</li>
        <li>QPS = 并发数/RT</li>
    </ul>
    TPS (Transactions Per Second) 每秒事务数
    <ul>
        <li>一个事务是指一个客户机 向服务器发送请求 然后服务器做出反应的过程。客户机在发送请求时开始计时，收到服务器响应后结束计时，以此计算使用的时间和完成的事务个数。</li>
        <li>针对单接口而言，TPS可以认为是等价于QPS的。</li>
    </ul>
    RT （Response Time）响应时间
    <ul>
        <li>系统从输入到输出的时间间隔，代表从客户端发起请求到服务端接收请求并响应所有数据的时间差。一般取平均响应时间。</li>
    </ul>
    并发数
    <ul>
        <li>指系统能够同时处理的请求或事务数量。</li>
    </ul>
    </details>

[返回上级](https://feng6917.github.io/language-gulang/#面试题)

[Go Learn](https://feng6917.github.io/language-gulang/#目录)

---
参考链接如下

- [面试题](http://mian.topgoer.com/)
