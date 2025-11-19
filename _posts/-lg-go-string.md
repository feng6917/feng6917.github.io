---
layout: post
title: "Golang 常见数据结构 之 string"
date:   2024-9-27
tags: 
  - Golang
comments: true
author: feng6917
---

<!-- more -->

### 目录

- [一、sting 是什么](#一sting-是什么)
- [二、string 标准概念](#二string-标准概念)
- [三、string 数据结构](#三string-数据结构)
- [四、string 操作](#四string-操作)
- [五、string 为什么不允许修改](#五string-为什么不允许修改)
- [六、[]byte 转换成 string 不一定会拷贝](#六byte-转换成-string-不一定会拷贝内存)

#### 一、sting 是什么

- string 是不可变字节切片
- string 是只读的 byte slice
- string 底层是一个 byte 数组，因此可以和 byte slice 进行转换
- string 的长度是固定的，不可变的，因此可以很方便的进行切片操作
- string 的长度可以通过 len() 函数获取

#### 二、string 标准概念

Go 标准库 `builtin` 给出了所有内置类型的定义。
源代码位于 `src/builtin/builtin.go`，其中关于string的描述如下:

```go
type string string
```

- string 是8位字节序列的集合，通常是但并不一定非得是UTF-8编码的文本。
  - string 可以为空（长度为0），但不会是nil.
  - string 对象不可以修改。

#### 三、string 数据结构

string 的数据结构定义在 `src/runtime/string.go:stringStruct` 中:

```go
type stringStruct struct {
    str unsafe.Pointer
    len int
}
```

- stringStruct.str 是指向底层字节数组的指针
- stringStruct.len 是字符串的长度

#### 四、string 操作

1. 声明

    ```go
    var s string
    ```

    字符串构建过程是先根据字符串构建stringStruct,再转换成string.

    ```go
    func gostringnocopy(str *byte) string {
        ss := stringStruct{str: unsafe.Pointer(str), len: findnull(str)}
        s := *(*string)(unsafe.Pointer(&ss))
        return s
    }
    ```

    string 在 runtime 包中就是stringStruct, 对外呈现就是string。

2. []byte 转 string

    byte切片可以很方便的转换成string,因为string底层就是byte数组.

    ```go
    s := string([]byte{65, 66, 67})
    ```

    转换过程如下：
    I. 根据切片的长度申请内存空间，假设内存地址为p,切片长度为len(b);
    II. 构建string（string.str=p, string.len=len(b)）
    III. 拷贝数据（切片中数据拷贝到新申请的内存空间）

3. string 转 []byte
    string 可以方便的转成byte切片

    ```go
    b := []byte(s)
    ```

    转换过程如下：
    I. 根据字符串的长度申请切片内存空间
    II. 拷贝数据（字符串中数据拷贝到新申请的内存空间）

4. 字符串拼接

    字符串拼接可以使用 + 号操作符，也可以使用 strings 包中的 Join 函数。

    ```go
    s1 := "hello"
    s2 := "world"
    s3 := s1 + s2
    s4 := strings.Join([]string{s1, s2}, " ")
    ```

    - string是无法直接修改的，新字符串的内存空间是一次分配完成的，所以性能主要在拷贝数据上。
    - strings.Join 函数内部使用 bytes.Buffer 来拼接字符串，性能更好。

#### 五、string 为什么不允许修改

像C++语言中的string，其本身拥有内存空间，修改string是支持的。但在Go的实现中，string不包含内存空间，只有一个内存的指针，这样做的好处是string变得非常轻量，可以很方便的进行传递而不担心内存拷贝。

string通常只想字符串字面量，而字面量存储位置是只读段，而不是堆或栈上，所以才有了string不可修改的约定。

#### 六、[]byte 转换成 string 不一定会拷贝内存

byte切片转换成string的场景很多，为了性能上的考虑，有时候只是临时需要字符串的场景下，byte切片转换成string时并不会拷贝内存，而是直接返回一个string，这个string的指针（string.str）指向切片的内存。

比如，编译器会识别如下临时场景：
    - 使用m[string(b)]来查找map(map 是string为key, 临时把切片b转成string)
    - 字符串拼接，如 "<"+"string(b)"+">"
    - 字符串比较：string(b)=="abc"

临时把byte切片转换成string,也就避免了因byte切片同容改成而导致string引用失败的情况，所以此时可以不必拷贝内存新建一个string。

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

###### 参考链接如下

- [Go 专家编程](https://www.topgoer.cn/docs/gozhuanjia/gochan4)
