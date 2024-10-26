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

- [Go基础](#go基础)
- [网络](#网络)
- [微服务](#微服务)
- [消息队列](#消息队列)
- [Docker](#docker)
[]()

[常用词汇理解](#常用词汇理解)

<hr>

#### Go基础

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
        <li>原子、互斥量或通道操作导致goroutine阻塞，调度器将把当前阻塞的goroutine从本地运行队列LRQ换出，并重新调度其它goroutine；</li>
        <li>网络请求和IO导致的阻塞，Go提供了网络轮询器（Netpoller）来处理，后台用epoll等技术实现IO多路复用。</li>
        <li>channel阻塞：当goroutine读写channel发生阻塞时，会调用gopark函数，该G脱离当前的M和P，调度器将新的G放入当前M。</li>
    </ul>
    </details>

32. 如果一个G一直占用占用资源怎么办？
    <details>
    <summary>Ans</summary>
    <ul>
        <li>如果有个goroutine一直占用资源，那么GMP模型会从正常模式转变为饥饿模式（类似于mutex），允许其它goroutine使用work stealing抢占（禁用自旋锁）。</li>
        <li>work stealing算法指，一个线程如果处于空闲状态，则帮其它正在忙的线程分担压力，从全局队列取一个G任务来执行，可以极大提高执行效率。</li>
    </ul>
    </details>

33. goroutine 什么时候会发生泄露？
    <details>
    <summary>Ans</summary>
    goroutine泄漏是指goroutine创建后，由于某种原因一直无法结束，导致资源无法释放。
    <p>暂时性泄露：</p>
    <ul>
        <li>获取长字符串中的一段长字符未释放</li>
        <li>获取长slice的一段导致长slice未释放</li>
        <li>在长slice新建slice导致泄露</li>
    </ul>
    string相比切片少了一个容量的cap字段，可以把string当成一个只读的切片类型。获取长string或者切片中的一段内容，由于新生成的对象和老的string或者切片共用一个内存空间，会导致老的string和切片资源暂时得不到释放，造成短暂的内存泄漏
    <p>永久性泄露：</p>
    <ul>
        <li>goroutine 永久阻塞而导致泄露</li>
        <li>time.Ticker未关闭导致泄露</li>
        <li>不正确使用Finalizer(Go版本的析构函数)导致泄露</li>
    </ul>
    </details>

34. go 竞态条件了解么？
    <details>
    所谓竞态竞争，就是当两个或以上的goroutine访问相同资源时，对资源进行读/写。
    <p>比如 <code>var a int = 0</code>,有两个协程分别对 a+=1, 我们发现最后 a 不一定为2，这就是竞态竞争。</p>
    <p>通常我们可以用<code>go run -race xx.go</code> 来进行检测</p>
    <p>解决方法是，对临界资源上锁，或者使用原子操作(atomics)，原子操作的开销小于上锁。还可以使用channel.</p>
    </details>

35. 若干个goroutine，有一个panic怎么办？
    <details>
    <summary>Ans</summary>
    <p>有一个 panic，那么剩余的 goroutine 也会退出，程序退出。</p>
    <p>如果不想程序退出，那么必须通过调用recover() 方法来捕获 panic 并恢复将要崩掉的程序。</p>
    </details>

36. defer 可以捕捉goroutine的子goroutine么?
    <details>
    <summary>Ans</summary>
    不可以。它们处于不同的调度器P中。对于子goroutine，必须通过 recover() 机制来进行恢复，然后结合日志进行打印(或者通过channel传递error).
    </details>

37. go 是怎么做参数校验的？
    <details>
    <summary>Ans</summary>
    go 采用 validator 库进行参数校验，它支持多种校验规则，比如：required、email、min、max、len、oneof等。

    <p>它具有以下独特功能：</p>
    <ul>
        <li>使用验证Tag或自定义validator进行跨字段Field和跨结构体验证。</li>
        <li>允许切片、数组和哈希表，多维字段的任何或所有级别进行校验。</li>
        <li>能够对哈希表key和value进行验证。</li>
        <li>通过在验证之前确定它的基础类型来处理类型接口。</li>
        <li>别名验证标签，允许将多个验证映射到单个标签，以便更轻松地定义结构体上的验证。</li>
        <li>gin web 框架的默认验证器</li>
    </ul>
    </details>

38. 中间件用过么？
    <details>
    <summary>Ans</summary>
    中间件是一种拦截器，它可以在请求到达目标方法之前，对请求进行拦截，也可以在目标方法执行之后，对响应进行拦截。中间件可以用于日志记录、身份验证、权限检查、参数校验等场景。
    </details>

39. go 解析tag是如何实现的？
    <details>
    <summary>Ans</summary>
    <p>在编译阶段，编译器会将tag解析为结构体字段的反射信息，并存储在结构体字段的反射信息中。</p>
    <p>在运行阶段，通过反射获取结构体字段的反射信息，从而获取tag信息。</p>
    </details>

40. 项目如何使用信号进行优雅的启停？
    <details>
    <summary>Ans</summary>
    <p>在程序启动时，监听系统信号，当收到系统信号时，执行相应的操作，比如：数据库连接、开启http服务、开启grpc服务等。</p>
    <p>在程序退出时，关闭所有资源，比如：关闭数据库连接、关闭文件句柄、关闭http服务、关闭grpc服务等。</p>
    </details>

41. 持久化怎么做的？
    <details>
    <summary>Ans</summary>
    <p>持久化是将数据存储到磁盘，以便在程序退出后仍然可以访问数据。在Go中，可以使用文件、数据库、缓存等存储方式来实现持久化。</p>
    <p>文件持久化：将数据存储到文件中，可以使用os包中的函数来读写文件。（1. 直接存储 2. 序列化成固定协议）</p>
    <p>数据库持久化：将数据存储到数据库中，可以使用数据库驱动程序来连接数据库，并执行SQL语句来操作数据。</p>
    <p>缓存持久化：将数据存储到缓存中，可以使用缓存服务，如Redis、Memcached等，来存储数据。</p>
    </details>

42. Channel 死锁的场景？
    <details>
    <summary>Ans</summary>
    <p>Channel 死锁是指两个或多个 goroutine 在等待对方释放资源时，导致程序无法继续执行的情况。</p>
    <p>常见的死锁场景有：</p>
    <ul>
        <li>当一个 channel 中没有数据，直接读取时</li>
        <li>当 channel 数据满了，再尝试写数据时</li>
        <li>向一个关闭的channel 写数据</li>
    </ul>
    </details>

43. 对已经关闭的chan进行读写会出现什么情况？
    <details>
    <summary>Ans</summary>
    <p>向已经关闭的 channel 写数据会导致 panic。</p>
    <p>从已经关闭的 channel 读数据，如果 channel 中还有数据，则可以正常读取，如果 channel 中没有数据，则返回零值。</p>
    </details>

44. 说受atomic底层是怎么实现的？
    <details>
    <summary>Ans</summary>
    <p>atomic 底层使用的是 CPU 提供的原子操作指令, 这些指令可以在不使用锁的情况下，保证对内存的原子操作，从而实现并发安全。</p>
    <p>通过源码可知，atomic采用CAS(CompareAndSwap)的方式实现的。所谓的CAS就是使用了CPU的原子性操作。在操作共享变量时，CAS不需要对其进行加锁，而是通过类似于乐观锁的方式进行检测，总是假设被操作的值未曾改变(即旧值相等),并一旦确认这个假设的真实性就立即进行值替换。本质上是不断占用CPU资源来避免加锁的开销。</p>
    </details>

45. channel 底层实现，是否线程安全？
    <details>
    <summary>Ans</summary>
    <p>channel 内部是一个环形链表，内部包含buf, sendx, recvx,lock, recvq, sendq 几个部分</p>
    <p>buf 是有缓冲的channel所特有的结构，用来存储缓存数据。是个循环链表。</p>
    <ul>
        <li>sendx和recvx用于记录buf这个循环链表中的发送和接收的index</li>
        <li>lock是个互斥锁</li>
        <li>recvq,sendq 分别是接收或者发送的goroutine抽象出来的结构体(sudog)的队列。是个双向链表。</li>
    </ul>
    </details>

46. map 的底层实现？
    <details>
    <summary>Ans</summary>
    <p>map 是 Go 语言中的一种数据结构，用于存储键值对。map 的底层实现是哈希表。</p>
    <p>里面最重要的是buckets(桶), buckets是一个指针，最终它指向的是一个结构体</p>
    <p>每个bucket固定包含8个key和value,实现bmap是一个固定大小的连续内存块，分为四部分，每个条目的状态，8个key值，8个value值，指向下个bucket的指针。</p>
    <p>创建哈希表使用的是 makemap 函数. map 的一个关键点在于，哈希函数的选择。在程序启动时，会检测cpu是否aes，如果支持则使用，不支持则使用 memhash, 这是函数在 alginit() 中完成。</p>
    <p>map 查找就是将key哈希后得到的64位用最后8个比特位计算在哪个桶，在bucket中，从前往后找到第一个空位。这样，在查找某个key时，先找到对应的桶，再去遍历 bucket 中的key。</p>
    </details>

47. select 的实现原理？
    <details>
    <summary>Ans</summary>
    <p>select 最重要的 scase 数据结构</p>
    <p>scase.c 为当前case语句所操作的channel指针，这也说明了一个case语句只能操作一个channel.</p>
    <p>scase.elem 表示缓冲区地址：</p>
    <ul>
        <li>caseRecv: scase.elem 表示读出channel的数据存放地址</li>
        <li>caseSend: scase.elem 表示将要写入channel的数据存放地址</li>
    </ul>
    <p>select 的主要实现位于 select.go 函数，主要功能如下</p>
    <ol>
        <li>锁定scase语句中所有的channel</li>
        <li>按照随机顺序检测scase的channel是否ready
            <ol>
                <li>如果case可读，则读取channel中数据，解锁所有的channel,然后返回（case index, true）</li>
                <li>如果case可写，则将数据写入channel，解锁所有的channel，然后返回（case index, false）</li>
                <li>所有的case 都未ready, 则解锁所有的channel, 然后返回（default index，false）</li>
            </ol>
        </li>
        <li>所有的case都未ready, 且没有default语句
            <ol>
                <li>将当前协程加入到所有channel的等待队列</li>
                <li>(等待)协程转入阻塞，等待被唤醒</li>
            </ol>
        </li>
        <li>唤醒后返回channel对应的case index
            <ol>
                <li>如果是读操作，解锁所有的channel，然后返回（case index, true）</li>
                <li>如果是写操作，解锁所有的channel，然后返回（case index, false）</li>
            </ol>
        </li>
    </ol>
    </details>

48. interface 底层实现？（待补充）
    <details>
    <summary>Ans</summary>
    <p>接口由两种类型实现 iface 和 eface。iface 是包含方法的接口，而 eface 不包含方法。</p>
    <p>iface tab表示接口的具体结构类型，而data是接口的值。</p>
    <p>eface 使用_type 直接表示类型，这样就无法使用方法。</p>
    <p></p>
    <p></p>
    </details>

48. reflect 底层实现？（待补充）
    <details>
    <summary>Ans</summary>
    <p>reflect 包实现了运行时反射，允许程序操作任意类型的对象。</p>
    <p>反射三大法则：</p>
    <ul>
        <li>反射从接口映射到反射对象</li>
        <li>反射从反射对象映射到接口值</li>
        <li>只有值可以修改，才可以修改反射对象</li>
    </ul>
    <p>type用于获取当前值的类型，value用于获取当前的值。</p>
    <p></p>
    </details>

49. go 调试/分析 工具用过哪些？
    <details>
    <summary>Ans</summary>
    <p>pprof：用于性能调优，针对CPU,内存和并发</p>
    <p>race：用于竞争检测</p>
    <p>godoc: 生成go文档</p>
    </details>

50. 进程被kill, 如何保证所有goroutine顺利退出
    <details>
    <summary>Ans</summary>
    <p>使用context包，通过context.WithCancel()创建一个可取消的context，然后通过context.WithTimeout()设置超时时间，当超时或者被取消时，所有goroutine都会收到通知，然后退出。</p>
    <p>goroutine 监听SIGKILL信号，一旦收到SIGKILL，则立即退出。</p>
    </details>

51. context 了解么？
    <details>
    <summary>Ans</summary>
    <p>context 是 Go 语言中用于在多个 goroutine 之间传递上下文信息，相同的 context 可以传递给运行在不同 goroutine 中的函数，上下文对于多个 goroutine 同时使用是安全的，context 包定义了上下文类型，可以使用background, TODO 创建一个上下文，在函数调用链之间传播 context， 也可以使用WithDeadLine, WithTimeout, WithCancel 或 WithValue 创建的修改副本替换它。</p>
    <p>context 的作用就是在不同的goroutine之间 同步请求特定的数据，取消信号以及处理请求的截至日期。</p>
    </details>

#### 网络

1. grpc 是什么？
    <details>
    <summary>Ans</summary>
    gRPC 是基于go的远程过程调用。RPC 框架的目标就是让远程服务调用更加简单、透明，RPC 框架负责屏蔽层的传输方式（TCP或者UDP）、序列化方式（XML/JSON/二进制）和通信细节。
    服务调用者可以像本地接口一样调用远程的服务提供者，而不需要关心底层通信细节和调用过程。
    </details>

2. grpc 为啥好，基本原理是什么，和http比呢？
    <details>
    <summary>Ans</summary>
    <p>grpc 是基于http2的，grpc 是一个现代开源的高性能远程过程调用框架，可以在任何环境中运行。它可以通过对负载平衡、跟踪、健康检查和身份验证的可插拔支持有效地连接数据中心和跨服务中兴的服务。它也适用于分布式计算的最后一英里，将设备、移动应用程序和浏览器连接到后端服务。</p>
    <p>区别：</p>
    <ul>
        <li>rpc是远程过程调用，就是本地去调用远程的函数；而http是通过 url 和符合restful风格的数据包去发送和获取数据。</li>
        <li>rpc一般使用的编解码协议更加高效，比如grpc使用protobuf编解码。而http一般使用json进行编解码，数据相比rpc更加直观，但是数据包也更大，效率低下。</li>
        <li>rpc一般用于服务内部调用，而http则用于和用户交互</li>
    </ul>
    <p>相似点：</p>
    <ul>
        <li>都有类似的机制，例如grpc的metadata机制和http的头部机制作用相似，而web框架和grpc框架都有拦截器的概念。</li>
    </ul>
    </details>

3. 什么是WebSocket?
    <details>
    <summary>Ans</summary>
    WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议。WebSocket 使得客户端和服务器之间的数据交换变得更加简单，允许服务端主动向客户端推送数据。在 WebSocket API 中，浏览器和服务器只需要完成一次握手，两者之间就直接可以创建持久性的连接，并进行双向数据传输。
    </details>

4. 全双工通讯协议的概念？
    <details>
    <p>全双工是通讯传输的一个术语。通信允许数据在两个方向上同时传输，它在能力上相当于两个单工通信方式的结合。全双工指同时进行信号的双向传输。</p>
    <p>拿演唱会举例：</p>
    <p>单工：我们是场外观众，只能通过大屏幕查看，不能够进行互动。</p>
    <p>半双工：我们是维护秩序保安，使用对讲机可以沟通，但同一时刻只能由一方进行数据传送。</p>
    <p>全双工是：我们是场内观众，可以同时进行数据传送。</p>
    </details>

5. WebSocket 和 Socket 的区别是什么？
    <details>
    <summary>Ans</summary>
    <p>Socket 是对 TCP/IP 协议的封装，它提供了一个端到端的通信方式，使得数据可以在网络中传输。</p>
    <p>WebSocket 是一个网络编程接口，是一种在单个 TCP 连接上进行全双工通信的协议，它使得客户端和服务器之间的数据交换变得更加简单，允许服务端主动向客户端推送数据，它允许在单个 TCP 连接上进行全双工通信。</p>
    </details>

6. http和WebSocket的区别是什么？
    <details>
    <summary>Ans</summary>
    <p>http 是一种应用层协议，它用于在网络上传输数据。而 WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议，它允许在客户端和服务器之间进行实时通信。</p>
    <p>http 是一种请求-响应协议，客户端发送一个请求，服务器返回一个响应。而 WebSocket 是一种全双工协议，客户端和服务器可以同时发送和接收数据。</p>
    </details>

7. http 和 https 的区别？
    <details>
    <summary>Ans</summary>
    <p>http 是一种超文本传输协议(Hypertext Transfer Protocol)，是一个在计算机世界里专门在两点之间传输文字、图片、音视频等文本数据的约定和规范。</p>
    <img src="../images/2020-3-3/14.jpg" />
    <p>HTTP 主要分为三部分： 超文本、传输、协议</p>
    <ul>
        <li>超文本就是不单单只是文本，它还可以传输图片、音视频，甚至点击文字或图片能够进行超链接的跳转。</li>
        <li>上面这些概念可以统称为数据，传输就是数据需要经过一系列的物理介质从一个端系统传送到另外一个端系统的过程。通常我们把传输数据包的一方成为 请求方， 把 接到二进制数据包的一方称为 应答方。</li>
        <li>而协议指的就是网络中（互联网）传递、管理信息的一些规范。如同人与人之间相互交流是需要遵循一定的规矩一样，计算机之间的相互通信需要共同遵守一定的规则，这些规则就称为协议，只不过是网络协议。</li>
    </ul>
    <p>TCP/IP网络模型：</p>
    <img src="../images/2020-3-3/15.jpg" />
    <img src="../images/2020-3-3/16.jpg" />
    <p>https 就是身披了一层 SSL 的 http</p>
    <img src="../images/2020-3-3/17.jpg" />

    http 和 https 的区别：
    <ul>
        <li>http 以 http:// 开头；https 以 https:// 开头</li>
        <li>http 是未经安全加密的协议，它的传输过程容易被攻击者监听、数据容易被窃取、发送方和接收方容易被伪造；而https 是安全的协议，它通过 密钥交换算法-签名算法-对称加密算法-摘要算法 能够解决上面问题。</li>
        <li>http 默认端口是80；https 默认端口是443</li>
    </ul>
    </details>

8. http get 和 post 区别？
    <details>
    <summary>Ans</summary>
    <p>http 中 get 和 post 是 http 中最常用的两个方法，基本上使用 http 方法中有 99% 都是在使用 Get 和 post 方法，所以有必要我们对两个方法有更加深刻的认识。</p>
    <ul>
        <li>get 方法一般用于请求，比如你在浏览器地址栏输入 xxx ,其实就是发送了一个get请求，它的主要特征是请求服务器返回资源，而post 方法一般用于 form 表单的提交， 相当于是把信息提交给服务器，等待服务器做出响应，get 相当于一个是 pull/拉的操作，而 post 相当于是一个 push/推 的操作。</li>
        <li>get 方法是不安全的，因为你在发送请求的过程中，你的请求参数会拼在URL后面，从而导致容易被攻击者窃取，对你的信息造成破坏和伪造；而post 方法是把参数放在请求体body 中的，对用户来说不可见。</li>
        <li>get 请求的URL 有长度限制，而 post 请求会把参数和值放在消息体中，对数据长度没有要求。</li>
        <li>get 请求会被浏览器主动 cache, 而 post 不会，除非手动设置。</li>
        <li>get 请求在浏览器反复地 回退/前进 操作是无害的，而post 操作会再次提交表单请求。</li>
        <li>get 请求在发送过程中会产生一个 TCP数据包；post 在发送过程中会产生两个TCP 数据包，对于 get 方式的请求，浏览器会把 http header 和 data 一并发送过去，服务器响应200（返回数据）;而对于post，浏览器先发送header, 服务器响应 100 continue, 浏览器再发送data, 服务器响应200 ok(返回数据)。</li>
    </ul>
    </details>

9. 什么是无状态协议，http是无状态协议么，怎么解决？
    <details>
    <summary>Ans</summary>
    <p>无状态协议 就是浏览器对于事务的处理没有记忆能力。举个例子来说就是比如客户端请求获得网页之后关闭浏览器，然后再次启动浏览器，登录该网站，但是服务器并不知道客户关闭了一次浏览器。</p>
    <p>http 就是一种无状态的协议，它对用户的操作没有记忆能力。可能大多数用户不相信，它可能觉得每次输入用户名和密码登录一个网站后，下次登录就不再重新输入用户名和密码了。这其实不是http做的事情，起作用的是 一个叫做 小甜饼(Cookie) 的机制。它能够让浏览器具有记忆能力。</p>
    <p>JWT 的 Cookie 信息存储在客户端，而不是服务器内存中。也就是说JWT 直接本地进行验证就可以，验证完毕后，这个Token 就会在 Session 中随请求一起发送到服务器，通过这种方式，可以节省服务器资源，并且 token 可以进行多次验证。</p>
    <p>JWT 支持跨域认证，Cookies 只能用在单个 节点的域 或者 它的子域 中有效。如果它们尝试通过第三个节点访问，就会被禁止。使用JWT 可以解决这个问题，使用JWT 能够通过多个节点进行用户认证，也就是我们常说的跨域认证。</p>
    </details>

10. UDP 和 TCP 的区别？
    <details>
    <summary>Ans</summary>
    <p>UDP User DataGram Protocol 用户数据包协议。它不需要所谓的 握手操作，从而加快了通信速度，允许网络上的其他主机在接收方同意通信之前进行数据传输。</p>
    <p>UDP 的特点主要有：</p>
    <ul>
        <li>UDP 能够支持容忍数据包丢失的带宽密集型应用程序。</li>
        <li>UDP 具有低延迟的特点</li>
        <li>UDP 能够发送大量的数据包</li>
        <li>UDP 能够允许 DNS 查找，DNS 是建立在 UDP 之上的应用层协议。</li>
    </ul>
    <p>TCP Transmission Control Protocol 传输控制协议。它能够帮助你确定计算机连接到 Internet 以及它们之间的数据传输。通过三次握手来建立TCP连接，三次握手就是用来启动和确认 TCP 连接的过程。一旦连接建立后，就可以发送数据了，当数据传输完成后，会通过关闭虚拟电路来断开连接。</p>
    <p>TCP 的主要特点有：</p>
    <ul>
        <li>TCP 能够确保连接的建立和数据包的发送</li>
        <li>TCP 支持错误重传机制</li>
        <li>TCP 支持拥塞控制，能够在网络拥堵的情况下延迟发送</li>
        <li>TCP 能够提供错误校验和甄别有害的数据包</li>
    </ul>
    <p>UDP 和 TCP 的区别：</p>
    <ul>
        <li>TCP 是面向连接的协议；UDP是无连接的协议</li>
        <li>TCP 在发送数据前需要建立连接，然后再发送数据；UDP无需建立连接就可以直接发送大量数据</li>
        <li>TCP 会按照特定顺序重新排列数据包；UDP数据包没有固定顺序，所有数据包都相互独立</li>
        <li>TCP 传输速度比较慢；UDP 传输速度会更快</li>
        <li>TCP 头部有20字节；UDP 头部只有8字节</li>
        <li>TCP 是重量级的，在发送任何用户数据之前，TCP需要三次握手建立连接；UDP 是轻量级的，没有跟踪连接，消息排序等</li>
        <li>TCP 会进行错误校验，并能够进行错误恢复；UDP 也会错误检查，但会丢弃错误的数据包。</li>
        <li>TCP 有发送确认；UDP 没有</li>
        <li>TCP 会使用握手协议，例如 SYN，SYN-ACK，ACK； UDP 无握手协议。</li>
        <li>TCP 是可靠的，因为它可以确保数据传送到路由器；UDP 中不能保证数据发送到目标。</li>

    </ul>
    </details>

11. TCP 三次握手和四次挥手？
    <details>
    <summary>Ans</summary>
    <p>TCP 是一种面向连接的、可靠的、基于字节流的传输层通信协议，它能够保证数据包的准确送达。</p>
    <p>三次握手：</p>
    <img src="../images/2020-3-3/18.jpg" />
    <p>四次挥手：</p>
    <img src="../images/2020-3-3/19.jpg" />
    </details>

12. 简述 http1.0/1.1/2.0 的区别？
    <details>
    <summary>Ans</summary>
    <p>http1.0：</p>
    <ul>
        HTTP 1.0 是在 1996 年引入的，从那时开始，它的普及率就达到了惊人的效果。
        <li>HTTP 1.0 仅仅提供了最基本的认证，这时候用户名和密码还未经加密，因此很容易收到窥探</li>
        <li>HTTP 1.0 被设计用来使用短链接，即每次发送数据都会经过 TCP 的三次握手和四次挥手，效率比较低。</li>
        <li>HTTP 1.0 只使用 header 中的 If-Modified-Since 和 Expires 作为缓存失效的标准。</li>
        <li>HTTP 1.0 不支持断点续传，也就是说，每次都会传送全部的页面和数据。</li>
        <li>HTTP 1.0 认为每台计算机只能绑定一个 IP，所以请求消息中的 URL 并没有传递主机名（hostname）。</li>
    </ul>
    <p>http1.1：</p>
    <ul>
        HTTP 1.1 是 HTTP 1.0 开发三年后出现的，也就是 1999 年，它做出了以下方面的变化
        <li>HTTP 1.1 使用了摘要算法来进行身份验证</li>
        <li>TTP 1.1 默认使用长连接，长连接就是只需一次建立就可以传输多次数据，传输完成后，只需要一次切断连接即可。长连接的连接时长可以通过请求头中的 keep-alive 来设置</li>
        <li>HTTP 1.1 中新增加了 E-tag，If-Unmodified-Since, If-Match, If-None-Match 等缓存控制标头来控制缓存失效。</li>
        <li>HTTP 1.1 支持断点续传，通过使用请求头中的 Range 来实现。</li>
        <li>HTTP 1.1 使用了虚拟网络，在一台物理服务器上可以存在多个虚拟主机（Multi-homed Web Servers），并且它们共享一个IP地址。</li>
    </ul>
    <p>http2.0：</p>
    <ul>
        HTTP 2.0 是 2015 年开发出来的标准，它主要做的改变如下
        <li>头部压缩，由于 HTTP 1.1 经常会出现 User-Agent、Cookie、Accept、Server、Range 等字段可能会占用几百甚至几千字节，而 Body 却经常只有几十字节，所以导致头部偏重。HTTP 2.0 使用 HPACK 算法进行压缩。</li>
        <li>二进制格式，HTTP 2.0 使用了更加靠近 TCP/IP 的二进制格式，而抛弃了 ASCII 码，提升了解析效率</li>
        <li>强化安全，由于安全已经成为重中之重，所以 HTTP2.0 一般都跑在 HTTPS 上。</li>
        <li>多路复用，即每一个请求都是是用作连接共享。一个请求对应一个id，这样一个连接上可以有多个请求。</li>
    </ul>
    </details>

13. 常用的 HTTP 请求头？
    <details>
    <summary>Ans</summary>
    <p>Date: 一个通用标头，可以出现在请求标头和响应标头中，表示的是格林威治标准时间，这个时间要比北京时间慢八个小时。</p>
    <p>Upgrade: 升级为其他协议</p>
    <p></p>
    <p>Accept：告诉服务器能够发送哪些媒体类型</p>
    <p>Accept-Charset：告诉服务器能够发送哪些字符集</p>
    <p>Accept-Encoding：告诉服务器能够发送哪些编码方式</p>
    <p>Accept-Language：告诉服务器能够发送哪些语言</p>
    <p>Authorization：告诉服务器能够发送哪些授权信息</p>
    <p>Cache-Control：告诉服务器哪些缓存行为是允许的</p>
    <p>Connection：告诉服务器是否需要持久连接</p>
    <p>Cookie：告诉服务器之前请求过的信息</p>
    <p>Host：告诉服务器请求的主机名</p>
    <p>Origin：告诉服务器请求的来源信息</p>
    <p>Referer：告诉服务器请求的来源页面</p>
    <p>User-Agent：告诉服务器客户端的信息</p>
    </details>

14. 常用的 HTTP 状态码？
    <details>
    <summary>Ans</summary>
    <p>200：请求成功</p>
    <p>301：永久重定向</p>
    <p>302：临时重定向</p>
    <p>400：请求错误</p>
    <p>401：未授权</p>
    <p>403：禁止访问</p>
    <p>404：未找到</p>
    <p>500：服务器错误</p>
    <p>502：网关错误</p>
    <p>503：服务不可用</p>
    <p>504：网关超时</p>
    </details>

15. 地址栏输入URL发生了什么？
    <details>
    <summary>Ans</summary>
    <p>1. 浏览器查找域名的 IP 地址：当用户在地址栏输入 URL 后，浏览器会首先查找域名的 IP 地址。浏览器会先查看本地 DNS 缓存(浏览器缓存->hosts)，如果找到对应的 IP 地址，则直接使用；如果没有找到，则向 DNS 服务器发送请求，获取域名的 IP 地址。</p>
    <p>首先，查询请求会先找到本地 DNS 服务器来查询是否包含 IP 地址，如果本地 DNS 无法查询到目标 IP 地址，就会向根域名服务器发起一个 DNS 查询。</p>
    <p>在由根域名服务器 -> 顶级域名服务器 -> 权威 DNS 服务器后，由权威服务器告诉本地服务器目标 IP 地址，再有本地 DNS 服务器告诉用户需要访问的 IP 地址。</p>
    <p>2. 浏览器需要和目标服务器建立 TCP 连接，需要经过三次握手的过程</p>
    <p>在建立连接后，浏览器会向目标服务器发起 HTTP-GET 请求，包括其中的 URL，HTTP 1.1 后默认使用长连接，只需要一次握手即可多次传输数据。</p>
    <p>如果目标服务器只是一个简单的页面，就会直接返回。但是对于某些大型网站的站点，往往不会直接返回主机名所在的页面，而会直接重定向。返回的状态码就不是 200 ，而是 301,302 以 3 开头的重定向码，浏览器在获取了重定向响应后，在响应报文中 Location 项找到重定向地址，浏览器重新第一步访问即可。</p>
    <p>然后浏览器重新发送请求，携带新的 URL，返回状态码 200 OK，表示服务器可以响应请求，返回报文。</p>
    [详细了解参考](https://blog.csdn.net/Newbie___/article/details/107212575)
    </details>

16. 为什么post是两个TCP包呢？
    <details>
    <summary>Ans</summary>
    <p>post 先去检测一下服务器能够正常应答，然后再把data携带进去，如果应答不了，就没有了第二步数据传输。就好像送快递一样，送之前先打电话，确认是否在家，在家再送过去，避免白跑一趟，资源浪费。</p>
    </details>

#### 微服务

1. 微服务了解么？
    <details>
    <summary>Ans</summary>
    微服务是一种开发软件的架构和组织方法，其中软件由通过明确定义的API进行通信的小型独立服务组成。微服务架构使应用程序更易于扩展和更快地开发，从而加速创新并缩短新功能的上市时间。
    <p>微服务有着自主，专用，灵活性等特点</p>
    </details>

2. 服务发现是怎么做的？
    <details>
    <summary>Ans</summary>
    服务发现是微服务架构中不可或缺的一部分，它能让服务之间相互发现，从而进行通信。服务发现主要有两种方式：客户端发现和服务器端发现。
    <p>客户端发现：当我们使用客户端发现的时候，客户端负责决定可用服务实例的网络地址并且在集群中对请求负载均衡，客户端访问服务登记表，也就是一个可用服务的数据库，然后客户端使用一种负载均衡算法选择一个可用的服务实例然后发起请求。</p>
    <p>服务器端发现：客户端通过负载均衡器向某个服务提出请求，负载均衡器查询服务注册表，并将请求转发到可用的服务实例。如同客户端发现，服务实例在服务注册表中注册或注销。</p>
    </details>

3. ETCD 用过么？
    <details>
    <summary>Ans</summary>
    etcd 是一个高度一致的分布式键值存储，它提供了一种可靠的方式来存储需要由分布式系统或机器集群访问的数据。它可以优雅地处理网络分区期间的领导者选举，即使领导者节点选取中也可以容忍机器故障。

    <p>etcd 是用Go语言编写的，它具有出色的跨平台支持，小的二进制文件和强大的社区。etcd 机器之间的通信通过Raft 共识算法处理。</p>
    </details>

4. 什么是wire?
    <details>
    <summary>Ans</summary>
    wire 是Google 开发的 自动依赖注入框架，专门用于 Go 语言。wire 通过 代码生成而非运行时反射 来实现依赖注入，这与许多其他语言中的依赖注入框架不同。这种方法使得注入的代码在编译时就已经确定，从而提高了性能并保证了代码的可维护性。
    </details>

5. 分布式锁？实现方式？
    <details>
    <summary>Ans</summary>
    分布式锁是控制分布式系统之间同步访问共享资源的一种机制。分布式锁可以保证在分布式系统中，多个节点对于共享资源只能有一个节点同时进行操作。
    <p>分布式锁的实现方式有：基于数据库、基于 Redis、基于 Zookeeper</p>
    基于数据库:
    <ul>
        基于唯一索引 通过无法插入数据，数据库行锁实现。
        <li>因为是基于数据库实现，需要考虑数据库的可用性和性能，双机部署，数据同步等</li>
        <li>不具备重入性，因为同一个线程在释放锁之前，行数据一直存在，无法再次成功插入数据。需要新增一列 记录获取锁的机器和线程信息，再次获取锁的时候先进行比对再进行后续操作。</li>
        <li>没有锁失效机制，需要新增一列，记录失效时间。</li>
        <li>不具备阻塞锁特性，需要优化获取逻辑，循环多次去获取。</li>
    </ul>
    基于redis:
    <ul>
        <li>无法保证过期时间，需要循环增加过期时间</li>
        <li>redissesion 具备watchdog 看门狗，定期检查线程是否过期，自动续命。集群使用lua脚本。</li>
        <li>多节点 使用 redlock, redlock 保证所有节点获取成功才成功</li>
    </ul>
    基于zookeeper:
    <ul>
        <li>需要额外搭建</li>
    </ul>
    </details>

6. CAP理论？
    <details>
    <summary>Ans</summary>
    CAP 理论是分布式系统设计中的基本理论，它指出，在分布式系统中，不可能同时满足以下三个特性：
    <p>Consistency（一致性）：所有节点在同一时间具有相同的数据。</p>
    <p>Availability（可用性）：系统在正常情况下可以响应请求。</p>
    <p>Partition tolerance（分区容错性）：系统在出现网络分区时仍能继续运行。</p>
    </details>

7. BASE理论？
    <details>
    <summary>Ans</summary>
    BASE 理论是分布式系统设计中的基本理论，它指出，在分布式系统中，不可能同时满足以下三个特性：
    <p>Basically Available（基本可用）：系统在正常情况下可以响应请求。</p>
    <p>Soft state（软状态）：系统允许在一定时间内存在不一致的状态。</p>
    <p>Eventual consistency（最终一致性）：系统在经过一定时间后，最终会达到一致的状态。</p>
    </details>

8. 分布式事务？
    <details>
    <summary>Ans</summary>
    分布式事务是指在一个分布式系统中，多个服务需要协同完成一个事务。分布式事务需要保证多个服务之间的数据一致性，即要么全部成功，要么全部失败。
    <p>分布式事务的实现方式有：两阶段提交xa、三阶段提交、TCC、Saga、本地消息表、事务消息、最大努力通知等。</p>
    </details>

9. 什么是Zookeeper?
    <details>
    <summary>Ans</summary>
    Zookeeper 是一个开源的分布式协调服务，它提供了一种分布式系统中的协调机制，可以用于实现分布式锁、配置管理、命名服务等功能。Zookeeper 使用一种树形结构来存储数据，每个节点都有一个唯一的路径，可以通过这个路径来访问节点上的数据。
    </details>

10. zookeeper 可以实现哪些功能？
    <details>
    <summary>Ans</summary>
    <p>1. 分布式锁</p>
    <p>2. 配置管理</p>
    <p>3. 数据发布/订阅</p>
    <p>4. 集群管理</p>
    <p>5. 分布式协调/通知</p>
    </details>

11. zookeeper 可以保证哪些分布式一致性特性？
    <details>
    <summary>Ans</summary>
    <ul>
        <li>顺序一致性</li>
        <li>原子性</li>
        <li>实时性</li>
        <li>可靠性</li>
    </ul>
    </details>

12. zookeeper 的数据模型？
    <details>
    <summary>Ans</summary>
    共享的、树形结构，由一系列的Znode数据节点组成，类似文件系统(目录不能存数据)。Znode存有数据信息，如版本号等等。Znode之间的层级关系，像文件系统中的目录结构一样。并且它是将数据存在内存中，这样可以提高吞吐、减少延迟。
    </details>

13. zookeeper 如何识别请求的先后顺序？
    <details>
    <summary>Ans</summary>
    zookeeper 会给每个更新请求，分配一个全局唯一的递增编号(zxid), 编号的大小体现事务操作的先后顺序。
    </details>

14. 分布式？
    <details>
    <summary>Ans</summary>
    分布式架构， 把系统按照模块拆分成多个子系统，多个子系统分布在不同的网络计算机上相互协作完成业务流程，系统之间需要进行通信。
    <p>优点：</p>
    <ul>
        <li>把模块拆分，使用接口通信，降低模块之间的耦合度</li>
        <li>把项目拆分成若干个子项目，不同的团队负责不同的子项目</li>
        <li>增加功能时只需要再增加一个子项目，调用其他系统的接口就可以</li>
        <li>可以灵活的进行分布式部署</li>
    </ul>
    缺点:
    <ul>
        <li>系统之间交互需要使用远程通信，接口开发增加工作量</li>
        <li>各个模块有一些通用的业务逻辑无法公用</li>
    </ul>
    </details>

15. 基于SOA架构?
    <details>
    <summary>Ans</summary>
    SOA: 面向服务的架构。也就是把工程拆分成服务层，表现层两个工程。服务层中包含业务逻辑，只需要对外提供服务即可。表现层只需要处理和页面的交互，业务逻辑都是调用服务层的服务来实现。
    </details>

16. 分布式架构和SOA架构有什么区别？
    <details>
    <summary>Ans</summary>
    SOA,主要还是从服务的角度，将工程拆分成服务层、表现层两个工程。
    <hr>
    分布式，主要还是从部署的角度，将应用按照访问压力进行归类，主要目标是充分利用服务器的资源，避免资源分配不均。
    </details>

17. 集群？
    <details>
    <summary>Ans</summary>
    一个集群系统是一群松散结合的服务器组，形成一个虚拟的服务器，为客户端提供统一的服务。对于这个客户端来说，通常在访问集群系统时不会意识到它的服务是由具体的哪一台服务器提供。集群的目的，是为实现负载均衡，容错，和灾难恢复。以达到系统可用性和可伸缩性的要求。集群系统一般应具有高可用性、可伸缩性、负载均衡、故障恢复和可维护性等特殊性能。一般同一工程上会部署多台服务器。
    </details>

18. 分布式与集群的区别？
    <details>
    <summary>Ans</summary>
    分布式是指将不同的业务分布在不同的地方。而集群指的是将几台服务器集中在一起，实现同一业务。一句话，分布式是并联工作的，集群是串联工作的。
    <hr>
    分布式中的每一个节点，都可以做集群。而集群并不一定就是分布式的。
    <hr>
    举例，分布式是淘宝的整个业务系统，将每个服务模块独立拆分出来，分别部署到不同的机器上，模块之间通过rpc通信。集群是数据库服务器的集群，实现读写分离，提高数据库并发性能。
    <hr>
    分布式是以缩短单个任务的执行时间来提升效率的，而集群是通过提高的那位时间内执行的任务数来提升效率的。
    <hr>
    举例：如果一个任务由10个子任务组成，每个子任务单独执行需要小时，则在一台服务器上执行该任务需10小时。采用分布式方案，提供10台服务器，每台服务器只负责处理一个子任务，不考虑子任务间的依赖关系，执行完，这个任务只需一个小时。
    <p>而集群方案，同样提供10台服务器，每台服务器都能独立处理这个任务。假设有10个任务同时到达，10台服务器将同时工作，1小时后，10个任务同时完成，这样，整体来看，还是1小时内完成一个任务。</p>
    </details>

19. 高并发？
    <details>
    <summary>Ans</summary>
    处理高并发常见的方法有哪些？
    <hr>
    数据层
    <ul>
        <li>数据库集群和库表散列</li>
        <li>分表分库</li>
        <li>开启缓存、索引</li>
        <li>表设计、SQL语句 优化</li>
        <li>缓存服务器、搜索服务器、图片服务器分离</li>
    </ul>
    项目层
    <ul>
        <li>采用面向服务分布式架构（分担服务器压力，提高并发能力）</li>
        <li>采用并发访问较高的详情系统采用静态页面，HTML静态化</li>
        <li>使用页面缓存</li>
        <li>业务解耦，提高并发能力</li>
        <li>使用分布式文件系统存储海量文件</li>
    </ul>
    应用层
    <ul>
        <li>使用负载均衡</li>
        <li>使用CDN</li>
        <li>使用消息队列</li>
    </ul>
    </details>

20. 高可用？
    <details>
    <summary>Ans</summary>
    目的：保证服务器硬件故障服务为依然可用，数据依然保存并能够访问。
    <hr>
    高可用的服务：
    <ul>
        <li>分级管理：核心应用和服务具有更高的优先级，比如用户及时付款比能否评价商品更重要</li>
        <li>超时设置：设置服务调用的超时时间，一旦超时，通信框架抛出异常，应用程序则根据服务调度策略选择重试or请求转移到其他服务器上</li>
        <li>异步调用：通过消息队列等异步方式完成，避免一个服务失败导致整个应用请求失败的情况。（不是所有服务都可以异步调用，对于获取用户信息这类调用，采用异步方式会延长响应时间，得不偿失，对于那些必须确认调用成功后才可以继续进行下一步操作的应用也不适合。）</li>
        <li>服务降级：网站访问高峰期间，为了保证核心应用的正常运行，需要对服务降级。（1.拒绝，拒绝优先级较低的服务，减少服务并发数，确保核心应用的正常运行。2.关闭功能，关闭部分不重要的服务，或者不重要的功能，节约系统开销。）</li>
        <li>幂等性设计：保证服务重复调用和调用一次产生的结构相同。</li>
    </ul>
    高可用的数据：
    <ul>
        保证数据高可用的主要手段有两种：一是数据备份，二是失效转移机制
        <li>数据备份：又分为冷备份和热备份，冷备份是定期复制，不能保证数据可用性。热备份又分为异步热备和同步热备，异步热备是指多分数据副本的写入操作异步完成，而同步方式则是指多分数据副本的写入操作同时完成。</li>
        <li>失效转移：若数据服务器集群中任何一台服务器宕机，那么应用程序针对这台服务器的所有读写操作都要重新路由到其他服务器，保证数据访问不会失败。</li>
    </ul>
    网站运行监控
    <ul>
        <li>监控数据采集：1. 用户行为日志收集，2. 服务器性能监控，3. 运行数据报告</li>
        <li>监控管理：1.系统报警 2. 失效转移 3. 自动优雅降级</li>
    </ul>
    </details>

21. 负载均衡：
    <details>
    <summary>Ans</summary>
    当一台服务器的性能达到极限时，我们可以使用服务器集群来提高网站的整体性能。那么，在服务器集群中，需要有一台服务器充当调度者的角色，用户的所有请求都会首先由它接收，调度者再根据每台服务器的负载情况讲请求分配给某一后端服务器去处理。
    <hr>
    1. http 重定向负载均衡
        <p>原理：当用户向服务器发起请求时，请求首先被集群调度者截获；调度者根据某种分配策略，选择一台服务
        器，并将选中的服务器的IP地址封装在HTTP响应消息头部的Location字段中，并将响应消息的状态码设为
        302，最后将这个响应消息返回给浏览器。当浏览器收到响应消息后，解析Location字段，并向该URL发起请
        求，然后指定的服务器处理该用户的请求，最后将结果返回给用户。
        </p>
        <p>优点：比较简单</p>
        <p>缺点：调度服务器只在客户端第一次向网站发起请求的时候起作用。当调度服务器向浏览器返回响应信息后，
        客户端此后的操作都基于新的URL进行的(也就是后端服务器)，此后浏览器就不会与调度服务器产生关系，浏
        览器需要每次请求两次服务器才能拿完成一次访问，性能较差。而且调度服务器在调度时，无法知道当前用户
        将会对服务器造成多大的压力，只不过是把请求次数平均分配给每台服务器罢了，浏览器会与后端服务器直接交互。</p>
    <hr>
    2. 反向代理负载均衡
        <p>原理：反向代理服务器是一个位于实际服务器之前的服务器，所有向我们网站发来的请求都首先要经过反向代
        理服务器，服务器根据用户的请求要么直接将结果返回给用户，要么将请求交给后端服务器处理，再返回给用
        户。反向代理服务器就可以充当服务器集群的调度者，它可以根据当前后端服务器的负载情况，将请求转发给
        一台合适的服务器，并将处理结果返回给用户。</p>
        <p>优点：</p>
        <ul>
            <li>部署简单</li>
            <li>隐藏后端服务器：与HTTP重定向相比，反向代理能够隐藏后端服务器，所有浏览器都不会与后端服务器直接
            交互，从而能够确保调度者的控制权，提升集群的整体性能。</li>
            <li>故障转移 ：与DNS负载均衡相比，反向代理能够更快速地移除故障结点。当监控程序发现某一后端服务器出
            现故障时，能够及时通知反向代理服务器，并立即将其删除。</li>
            <li>合理分配任务 ：HTTP重定向和DNS负载均衡都无法实现真正意义上的负载均衡，也就是调度服务器无法根据
            后端服务器的实际负载情况分配任务。但反向代理服务器支持手动设定每台后端服务器的权重。我们可以根据
            服务器的配置设置不同的权重，权重的不同会导致被调度者选中的概率的不同。</li>
        </ul>
        <p>缺点：</p>
        <ul>
            <li>调度者压力过大 ：由于所有的请求都先由反向代理服务器处理，那么当请求量超过调度服务器的最大负载
            时，调度服务器的吞吐率降低会直接降低集群的整体性能。</li>
            <li>制约扩展 ：当后端服务器也无法满足巨大的吞吐量时，就需要增加后端服务器的数量，可没办法无限量地增
            加，因为会受到调度服务器的最大吞吐量的制约。</li>
            <li>粘滞会话：反向代理服务器会引起一个问题。若某台后端服务器处理了用户的请求，并保存了该用户的
            session或存储了缓存，那么当该用户再次发送请求时，无法保证该请求仍然由保存了其Session或缓存的服
            务器处理，若由其他服务器处理，先前的Session或缓存就找不到了。</li>
            <hr>
            <li>解决办法1： 可以修改反向代理服务器的任务分配策略，以用户IP作为标识较为合适。相同的用户IP会交由同
            一台后端服务器处理，从而就避免了粘滞会话的问题。
            解决办法2： 可以在Cookie中标注请求的服务器ID，当再次提交请求时，调度者将该请求分配给Cookie中标
            注的服务器处理即可。</li>
        </ul>
        <p></p>
    <hr>
    3. IP负载均衡。
    <ul>
        <li>通过NAT实现负载均衡：响应报文一般比较大，每一次都需要NAT转换的话，大流量的时候，会导致调度器成为一个瓶颈。</li>
        <li>通过直接路由实现负载均衡</li>
    </ul>
    </details>

22. 分布式事务 异步通信问题解决方案。
    <details>
    <summary>Ans</summary>
    1. 延迟队列。 2. 定时轮询扫描。
    </details>

#### 消息队列

1. 消息队列了解么？
    <details>
    <summary>Ans</summary>
    就是消息的传输过程中保存消息的容器。
    <hr>
    消息队列是 中间件 是分布式系统中重要的组件，主要解决应用解耦，异步消息，流量削峰等问题，实现高性能，高可用，可伸缩和最终一致性架构。目前使用较多的消息队列有RabbitMQ,Kafka,NSQ。
    </details>

2. 消息队列应用场景
    <details>
    <summary>Ans</summary>
    <p>1. 异步处理</p>
    用户注册后，需要发注册邮件和注册短信。传统做法有两种 1. 串行 2. 并行。可以利用消息队列 异步进行处理。
    <p>2. 应用解耦</p>
    用户下单，订单系统需要通知库存系统。传统做法，订单系统调用库存系统的接口。可以利用消息队列，订单系统发送一个下单消息到消息队列，库存系统订阅下单消息，获取下单消息，进行库存处理。好处，解耦，库存系统挂掉不影响订单系统正常使用。
    <p>3. 流量削峰</p>
    秒杀活动，一般会因为流量过大，导致流量暴增，应用挂掉，为解决这个问题，一般需要在应用前端加入消息队列。1. 可以控制活动的人数 2. 可以缓解短时间内高流量压垮应用
    <p>4. 日志处理</p>
    日志处理是指将消息队列用在日志处理中，比如Kafka的应用。解决大量日志传输问题。
    <p>5. 消息通讯</p>
    消息通讯是指，消息队列一般都内置了高效的通信机制，因此也可以用在纯的消息通讯。比如点对点消息队列，聊天室等。
    </details>

3. MQ 选型对比？
    <details>
    <summary>Ans</summary>
    <p>Kafka是linkedin开源的MQ系统，主要特点是基于Pull的模式来处理消息消费，追求高吞吐量，一开始的目的就是用于日志收集和传输，0.8开始支持复制，不支持事务，适合产生大量数据的互联网服务的数据收集业务。</p>
    <p>RabbitMQ是使用Erlang语言开发的开源消息队列系统，基于AMQP协议来实现。AMQP的主要特征是面向消息、队列、路由（包括点对点和发布/订阅）、可靠性、安全。AMQP协议更多用在企业系统内，对数据一致性、稳定性和可靠性要求很高的场景，对性能和吞吐量的要求还在其次。</p>
    <p>RabbitMQ/Kafka 都能提供消息队列服务，但有很大的区别。</p>
    <p>在面向服务架构中通过消息代理（比如 RabbitMQ / Kafka等），使用生产者-消费者模式在服务间进行异步通信是一种比较好的思想。</p>
    <p>因为服务间依赖由强耦合变成了松耦合。消息代理都会提供持久化机制，在消费者负载高或者掉线的情况下会把消息保存起来，不会丢失。就是说生产者和消费者不需要同时在线，这是传统的请求-应答模式比较难做到的，需要一个中间件来专门做这件事。其次消息代理可以根据消息本身做简单的路由策略，消费者可以根据这个来做负载均衡，业务分离等。</p>
    <p>缺点也有，就是需要额外搭建消息代理集群（但优点是大于缺点的 ） 。</p>
    <p>RabbitMQ 支持 AMQP（二进制），STOMP（文本），MQTT（二进制），HTTP（里面包装其他协议）等协议。Kafka 使用自己的协议。</p>
    <p>Kafka 自身服务和消费者都需要依赖 Zookeeper。</p>
    <p>RabbitMQ 在有大量消息堆积的情况下性能会下降，Kafka不会。毕竟AMQP设计的初衷不是用来持久化海量消息的，而Kafka一开始是用来处理海量日志的。</p>
    <ul>
        <li>RabbitMq比kafka成熟，在可用性上，稳定性上，可靠性上，RabbitMq超过kafka。</li>
        <li>Kafka设计的初衷就是处理日志的，可以看做是一个日志系统，针对性很强，所以它并没有具备一个成熟MQ应该具备的特性。</li>
        <li>Kafka的性能（吞吐量、tps）比RabbitMq要强，这篇文章的作者认为，两者在这方面没有可比性。</li>
    </ul>
    </details>

4. 重复消费？
    <details>
    <summary>Ans</summary>
    <p>1. 消息重复消费的原因</p>
    <p>1.1 消息发送时重复</p>
    <p>1.2 消息消费时重复</p>
    <p>2. 如何避免消息重复消费</p>
    <p>2.1 消息生产时，保证消息唯一性，比如使用业务唯一ID + 消息ID的方式，防止消息重复</p>
    </details>

5. 丢消息？
    <details>
    <summary>Ans</summary>
    <p>1. 消息发送时丢失</p>
    <p>1.1 消息发送失败，没有进行重试</p>
    <p>1.2 消息发送成功，但MQ服务宕机，消息丢失</p>
    <p>2. 消息消费时丢失</p>
    <p>2.1 消费者消费消息成功，但MQ服务宕机，导致消息丢失</p>
    <p>2.2 消费者消费消息失败，但MQ服务没有回执，导致消息重复消费</p>
    <p>3. 如何避免消息丢失</p>
    <p>3.1 消息生产时，保证消息持久化, 非持久化消息及时处理不要堆积</p>
    <p>3.2 消息消费时，保证消息幂等性</p>
    </details>

6. SOA和分布式的区别？
    <details>
    <summary>Ans</summary>
    SOA，将工程拆分成服务层、表现层两个工程，服务层中包含业务逻辑，只需要对外提供服务即可。表现层只需要处理和页面的交互，业务逻辑都是调用服务层的服务来实现。
    <hr>
    分布式，主要还是从部署的角度，将应用按照访问压力进行归类，主要目标是充分利用服务器的资源，避免资源分配不均
    </details>

#### Docker

1. 什么是Docker、容器、镜像？
    <details>
    <summary>Ans</summary>
    Docker 是一个开源的应用容器引擎，让开发者可以打包他们的应用以及依赖包到一个可移植的容器中，然后发布到任何流行的 Linux 机器上，也可以实现虚拟化。容器是完全使用沙箱机制，相互之间不会有任何接口。
    <p>容器技术是轻量级的虚拟化技术，容器之间共享宿主机的内核，容器之间相互隔离，每个容器有自己的文件系统，容器之间进程相互隔离，互不影响。</p>
    <p>镜像是一种轻量级、可执行的独立软件包，用来打包软件运行环境和基于运行环境开发的软件，它包含运行某个软件所需的所有内容，包括代码、运行时、库、环境变量和配置文件。</p>
    </details>

2. Docker 和 虚拟机有啥不同？
    <details>
    <summary>Ans</summary>
    <p>docker 是轻量级的沙盒，在其中运行的只是应用，虚拟机里面还有额外的系统。</p>
    </details>

3. Docker 安全么？
    <details>
    <summary>Ans</summary>
    docker 利用了 Linux 内核中很多安全特性来保证不同容器之间的隔离，并且通过签名机制来对镜像进行验证。大量生产环境的部署证明，docker 虽然隔离性无法与虚拟机相比，但仍然具有极高的安全性。
    </details>

4. 如何清理后台停止的容器？
    <details>
    <summary>Ans</summary>
    docker rm $(docker ps -a -q -f status=exited)
    </details>

5. 如何查看镜像支持的环境变量？
    <details>
    <summary>Ans</summary>
    可以使用 docker run image env 命令
    </details>

6. 当启动容器的时候提示，exec format error? 如何解决？
    <details>
    <summary>Ans</summary>
    <p>exec format error 是因为容器镜像的操作系统和宿主机的操作系统不兼容导致的，比如容器镜像是基于 Linux 的，而宿主机是 Windows，或者容器镜像是基于 64 位的，而宿主机是 32 位的。</p>
    <p>解决方法：</p>
    <ul>
        <li>更换宿主机的操作系统，使其与容器镜像的操作系统兼容。</li>
        <li>更换容器镜像，使其与宿主机的操作系统兼容。</li>
        <li>使用 Docker 的多架构支持，将容器镜像转换为与宿主机的操作系统兼容的格式。</li>
    </ul>
    </details>

7. 本地的镜像文件都存放在哪里？
    <details>
    <summary>Ans</summary>
    <p>在 Linux 系统中，Docker 镜像文件默认存放在 /var/lib/docker 目录下，具体位置在 /var/lib/docker/overlay2 目录下。</p>
    <p>在 Windows 系统中，Docker 镜像文件存放在 C:\ProgramData\Docker\windowsfilter 目录下。</p>
    </details>

8. 如何退出一个镜像bash，而不终止它？
    <details>
    <summary>Ans</summary>
    按 Ctrl+p，后按 Ctrl+q，如果按 Ctrl+c 会使容器内的应用进程终止，进而会使 容器终止。
    </details>

9. 退出容器时自动删除？
    <details>
    <summary>Ans</summary>
    -rm ; docker run -rm -it ubuntu
    </details>

10. 如何批量清理临时镜像文件？
    <details>
    <summary>Ans</summary>
    docker rmi $(docker images -f dangling=true -q)
    </details>

11. docker 镜像应该遵循哪些原则？
    <details>
    <summary>Ans</summary>
    整体上，尽量保持镜像功能上的明确和内容的精简。
    <ul>
        <li>尽量选取满足需求但较小的基础系统镜像</li>
        <li>清理编译生成文件、安装包的缓存等临时文件</li>
        <li>安装各个软件时需要指定准确的版本号，并避免引入不必要依赖</li>
        <li>从安全角度考虑，应用尽量使用系统的库和依赖</li>
        <li>使用dockerfile 创建镜像时，添加.dockerignore或使用干净的工作目录</li>
    </ul>
    </details>

12. 容器退出后，通过docker ps 命令看不到，数据会丢失么？
    <details>
    <summary>Ans</summary>
    容器退出后，数据不会丢失，除非你明确删除了容器。容器退出后，容器内的数据仍然存在，可以通过docker start命令重新启动容器，或者使用docker attach命令重新连接到容器。
    <hr>
    使用 docker ps -a 查看
    </details>

13. 如何停止所有正在运行的容器？
    <details>
    <summary>Ans</summary>
    使用 docker kill $(docker ps -q) 命令
    </details>

14. 如何删除所有正在运行的容器？
    <details>
    <summary>Ans</summary>
    使用 docker rm $(docker ps -q) 命令
    </details>

15. 很多应用容器都是默认后台运行的，怎么查看它们的输出和日志信息？
    <details>
    <summary>Ans</summary>
    使用 docker logs container_id
    </details>

16. 如何在控制容器占用系统资源(CPU、内存)的限制？
    <details>
    <summary>Ans</summary>
    使用 docker run 命令的 -m 或 --memory 参数来限制容器的内存使用量，使用 --cpus 参数来限制容器的 CPU 使用量。
    </details>

17. 仓库、注册服务器、注册索引有什么关系？
    <details>
    <summary>Ans</summary>
    仓库（Repository）是存储镜像的地方，注册服务器（Registry）是存储仓库的服务器，注册索引（Index）是用于搜索和查找仓库的目录。
    </details>

18. 如何更改docker的默认存储设置？
    <details>
    <summary>Ans</summary>
    可以通过修改 Docker 的配置文件来更改默认存储设置。在 Linux 系统中，Docker 的配置文件通常位于 /etc/docker/daemon.json。在 Windows 系统中，Docker 的配置文件通常位于 C:\ProgramData\Docker\config\daemon.json。

    可以使用软连接
    </details>

19. 如何将一台宿主机的 docker 环境迁移到另外一台宿主机?
    <details>
    <summary>Ans</summary>
    可以通过以下步骤将一台宿主机的 Docker 环境迁移到另外一台宿主机：
    <ul>
        <li>备份宿主机的 Docker 数据。可以使用以下命令将 Docker 数据备份到指定目录：
            <pre>
            docker save -o /path/to/backup.tar $(docker images -q)
            </pre>
        </li>
        <li>将备份文件复制到目标宿主机。可以使用 scp 或其他文件传输工具将备份文件复制到目标宿主机。
            <pre>
            scp /path/to/backup.tar user@target-host:/path/to/backup.tar
            </pre>
        </li>
        <li>在目标宿主机上加载备份文件。使用以下命令在目标宿主机上加载备份文件：
            <pre>
            docker load -i /path/to/backup.tar
            </pre>
        </li>
        <li>启动容器。使用以下命令启动容器：
            <pre>
            docker start container_id
            </pre>
        </li>
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

2. Keycloak 是什么？
    <details>
    <summary>Ans</summary>
    Keycloak是一个开源的身份和访问管理解决方案，它提供了诸如单点登录（SSO）、多因素认证、用户管理、权限管理等功能。Keycloak可以帮助开发人员轻松地集成身份验证和授权功能到他们的应用程序中，而无需自己编写复杂的身份验证和授权逻辑。
    [详细了解参考](https://blog.csdn.net/m0_63144319/article/details/138858366)
    </details>

3. 单点登录 SSO?
    <details>
    <summary>Ans</summary>
    单点登录（Single Sign-On，SSO）是一种身份验证和授权机制，允许用户在一个地方登录，然后访问多个应用程序或系统，而无需在每个应用程序或系统中单独登录。单点登录的主要目标是简化用户身份验证过程，提高用户体验，并减少管理成本。
    </details>

4. 设计模式？
    <details>
    <summary>Ans</summary>
    设计模式（Design Pattern）是解决特定问题的经过验证的解决方案，它们在软件开发中得到了广泛的应用。设计模式可以帮助开发人员更好地理解和解决常见的问题，提高代码的可维护性和可扩展性。
    <p>个人理解，设计模式相当于一种特殊的方法，把一些常用的解决方法归纳出来，形成一种固定的模式，方便以后使用。<p>
    在项目中有使用到的模式，单例模式（数据库池 单例，唯一DB 进行操作）；工厂模式（多平台上传数据，OSS，MINIO，Hw等，统一实现上传等方法，避免紧密耦合）；适配器模式（协议结构体与内部对象的转换器，不用考虑参数增删，做到兼容）
    <hr>
    [详细了解参考](https://juejin.cn/post/7095581880200167432)
    </details>

5. 跨域？
    <details>
    <summary>Ans</summary>
    当异步请求时，访问的请求地址的协议、ip地址、端口号任意一个与当前站点不同时，就会涉及到跨域访问。
    <hr>
    解决方案：
    <ul>
        <li>jQuery 提供了 JSONP 实现</li>
        <li>W3C 提供了 CORS(跨域资源共享) 解决方案</li>
        <li>代理</li>
    </ul>
    </details>

6. 怎么加快访问速度，怎样进行性能调优？
    <details>
    <summary>Ans</summary>
    加快访问：
    <ul>
        <li>硬件上加大网络带宽，和服务器内存</li>
        <li>代码处理：静态页面，缓存，优化SQL，创建索引等</li>
    </ul>
    系统性能：
    <ul>
        <li>提高吞吐量：分布式集群，模块解耦，设计模式</li>
        <li>系统延迟：异步通信</li>
    </ul>
    </details>

7. 心跳？
    <details>
    <summary>Ans</summary>
    心跳检测机制一般有两个作用:
    <ul>
        <li>保活</li>
        <li>检测死链</li>
    </ul>
    <p>一般是客户端主动给服务器发送心跳包，服务器端做心跳检测决定是否连接，而不是反过来。从客户端的角度来说，客户端为了让自己得到服务器端的正常服务有必要主动和服务器保持连接状态正常，而服务器端不会局限于某个特定的客户端，如果客户端不能主动和其保持连接，那么就会主动回收与该客户端的连接。当然服务器端在收到客户端的心跳包时应该给客户端一个心跳应答。</p>

    <p>带业务类心跳包：在心跳包数据结构里面加上需要的业务字段信息，然后在定时器中定时发送，客户端发给服务器，服务器在应答心跳包中填上约定的业务数据信息即可。</p>
    <p>数据包与流量：当连接数较多时，进出服务器程序的数据包通常都是心跳包(为了保活),所以减轻网络代码压力，节省流量，在设计心跳包格式时应尽量减小心跳包的数据大小。</p>
    <p>心跳包与日志：记录心跳日志应设置为可配，可以关闭</p>
    </details>

[返回上级](https://feng6917.github.io/language-gulang/#面试题)

[Go Learn](https://feng6917.github.io/language-gulang/#目录)

---
参考链接如下

- [Go常见面试题【由浅入深】2022版](https://zhuanlan.zhihu.com/p/471490292)
- [WebSocket 面试题](https://www.cnblogs.com/zhaozhitong/p/12450124.html)
- [100%的面试官都会问的HTTP面试题](https://zhuanlan.zhihu.com/p/135947893)
- [面试官：消息队列使用场景有哪些？](https://cloud.tencent.com/developer/article/1961095)
