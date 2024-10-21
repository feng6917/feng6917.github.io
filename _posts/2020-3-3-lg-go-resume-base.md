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

[Go基础](#go基础)

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
    <p>Socket 是对 TCP/IP 协议的封装，它提供了一个端到端的通信方式，使得数据可以在网络中传输。而 WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议，它使得客户端和服务器之间的数据交换变得更加简单，允许服务端主动向客户端推送数据。</p>
    <p>Socket 是一个网络编程接口，它提供了一种方式来在网络上进行通信。而 WebSocket 是一种协议，它允许在单个 TCP 连接上进行全双工通信。</p>
    </details>

6. http和WebSocket的区别是什么？
    <details>
    <summary>Ans</summary>
    <p>http 是一种应用层协议，它用于在网络上传输数据。而 WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议，它允许在客户端和服务器之间进行实时通信。</p>
    <p>http 是一种请求-响应协议，客户端发送一个请求，服务器返回一个响应。而 WebSocket 是一种全双工协议，客户端和服务器可以同时发送和接收数据。</p>
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

#### Gin

#### 数据库

1. 数据库事务的四大特性是什么？
    <details>

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

- [Go常见面试题【由浅入深】2022版](https://zhuanlan.zhihu.com/p/471490292)
- [WebSocket 面试题](https://www.cnblogs.com/zhaozhitong/p/12450124.html)
