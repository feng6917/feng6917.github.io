---
layout: post
title: " Context"
date:   2024-10-12
tags: 
  - Golang
comments: true
author: feng6917
---

<!-- more -->

### 目录

- [一、Context 是什么](#一context-是什么)
- [二、Context 实现原理](#二context-实现原理)
  - [基础结构](#基础结构)
  - [EmptyCtx](#emptyctx)
  - [方法实现](#方法实现)
  - [ValueCtx](#valuectx)

#### 一、Context 是什么

Context 是 Go 语言中用于在多个函数调用之间传递请求范围的值、取消信号、截止日期的机制。它通常用于控制 goroutine 的执行和资源管理。

Context 是 Go 应用开发常用的并发控制计数，可以控制多级的goroutine。

Context 翻译成中文是“上下文”，它可以控制一组呈树状结构的goroutine，每个goroutine拥有相同的上下文，通过它可以控制每个goroutine的行为。

典型的使用场景如下：
![img](../images/2024-10-14/1.jpg)

#### 二、Context 实现原理

Context实际上只定义了接口，凡是实现该接口的类型都可称为一种Context, 官方包中实现了几个常用的Context,分别可用于不同的场景。

###### 基础结构

```go
type Context interface {
    Deadline() (deadline time.Time, ok bool)
    Done() <-chan struct{}
    Err() error
    Value(key interface{}) interface{}
}
```

1. Deadline() (deadline time.Time, ok bool) 返回一个超时时间和标识是否已设置deadline的布尔值。如果没有设置deadline，则ok为false。此时deadline为一个初始值的time.Time。

2. Done() <-chan struct{} 返回一个只读的channel

    - 当context关闭后，Done()返回一个被关闭的管道，关闭的管道仍是可读的，据此goroutine可以收到关闭请求。
    - 当context未关闭时，Done返回nil。

3. Err()

    该方法描述context关闭的原因。关闭原因由context实现控制，不需要用户设置。比如Deadline Context, 关闭原因可能因为Deadline, 也可能提前被主动关闭，那么关闭原因就不同：

    - 因deadline关闭，Err()返回context.DeadlineExceeded
    - 因主动调用cancel()关闭，Err()返回context.Canceled

      当context关闭后，Err()返回关闭原因。如果context未关闭，Err()返回nil。

4. Value()

    有一种context，它不是用于控制呈树状分布的goroutine,而是用于在树状分布的goroutine间传递消息。Value()方法就是用于此种类型的context，该方法根据key值查询map中的value.

<hr style="background-color: blue;border: none;height: 15px;width: 100%" />

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

###### EmptyCtx

context 包中定义了一个空的context，名为emptyCtx,用于context的根节点，空的context只能简单的实现了Context接口，本身不包含任何值，仅用于Context的父节点。

```go
type emptyCtx int

func (*emptyCtx) Deadline() (deadline time.Time, ok bool) {
    return
}

func (*emptyCtx) Done() <-chan struct{} {
    return nil
}

func (*emptyCtx) Err() error {
    return nil
}

func (*emptyCtx) Value(key interface{}) interface{} {
    return nil
}
```

context 包中定义了一个公用的emptyCtx全局变量，名为background,可以使用context.Background()获取该变量。

```go
var (
    background = new(emptyCtx)
    todo       = new(emptyCtx)
)
```

- context.Background() 返回一个空的Context, 它不能被取消、不包含值、也没有截止时间，一般作为主函数、初始化中和测试代码的Context。
- context.TODO() 返回一个空的Context, 它不能被取消、不包含值、也没有截止时间，一般用于不确定应该使用哪种Context时。

###### 方法实现

包提供了4个方法创建不同类型的context，使用这些方法时如果没有父context,则使用background作为父context。

1. context.WithCancel(parent Context) (ctx Context, cancel CancelFunc) 创建一个可取消的context,返回子context和取消函数cancel。调用cancel()可以取消子context以及子context的子context。

2. context.WithDeadline(parent Context, deadline time.Time) (Context, CancelFunc) 创建一个可取消的context,返回子context和取消函数cancel。当时间到达deadline时，自动取消子context以及子context的子context。

3. context.WithTimeout(parent Context, timeout time.Duration) (Context, CancelFunc) 创建一个可取消的context,返回子context和取消函数cancel。当时间到达timeout时，自动取消子context以及子context的子context。

4. context.WithValue(parent Context, key, val interface{}) Context 创建一个可携带值的context,返回子context。WithValue()返回的context可以向下传递值，但是不能修改值。

    ![img](../images/2024-10-14/2.jpg)
struct cancelCtx, timeCtx, valueCtx都继承于Context。

- Deadline()

    Deadline()方法仅仅是返回timerCtx.deadline而已，而timerCtx.deadline是WithDeadline()或WithTimeout()方法创建timerCtx时传入的参数。

- Cancel()

    cancel()方法继承cancelCtx,只需要额外把timer关闭。

    timerCtx被关闭后，timerCtx.cancelCtx.err将会存储关闭原因。
  
  - 如果deadline到来之前手动关闭，则关闭原因与cancelCtx显示一致。
  - 如果deadline到来时自动关闭，则原因为：“context deadline exceeded”。

- WithDeadline()
  
  WithDeadline()方法实现步骤如下：
    1. 初始化一个timerCtx实例
    2. 将timerCtx实例添加到其父节点的children中（如果父节点也可以被cancel的话）
    3. 启动定时器，定时器到期后会自动cancel本Context
    4. 返回timerCtx实例和cancel()方法

  也就是说，timerCtx类型的context不仅支持手动cancel，也会在定时器到来后自动cancel。
  
- WithTimeout()

    WithTimeout()实际调用了WithDeadline,二者实现原理一致。

<hr style="background-color: blue;border: none;height: 15px;width: 100%" />

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

###### ValueCtx

```go
type valueCtx struct {
    Context
    key, val interface{}
}
```

valueCtx只是在Context基础上增加了一个key-value对，用于在各级协程间传递一些数据。

由于valueCtx既不需要cancel，也不需要deadline，那么只需要实现value（）接口即可。

1. Value()接口实现

    由valueCtx数据结构定义可见，valueCtx.key和valueCtx.val分别代表其key和value值。

    ```go
    func (c *valueCtx) Value(key interface{}) interface{} {
        if c.key == key {
            return c.val
        }
        return c.Context.Value(key)
    }
    ```

    这里有个细节需要关注一下，即当前context查找不到key时，会从父节点查找，如果查询不到则最终返回interface{}。也就是说，可以通过子context查询到父context的value值。

2. WithValue()方法实现

    ```go
    func WithValue(parent Context, key, val interface{}) Context {
        if key == nil {
            panic("nil key")
        }
        return &valueCtx{parent, key, val}
    }
    ```

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

###### 参考链接如下

- [Go 专家编程](https://www.topgoer.cn/docs/gozhuanjia/gochan4)
