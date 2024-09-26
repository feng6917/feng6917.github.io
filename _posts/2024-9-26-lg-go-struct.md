---
layout: post
title: "Golang 常见数据结构 之 Struct"
date:   2024-9-26
tags: 
  - Golang
comments: true
author: feng6917
---

<!-- more -->

### 目录

- [一、Struct 是什么](#一struct-是什么)
- [二、Tag 的本质](#二tag-的本质)

#### 一、Struct 是什么

Go的struct生命允许字段附带`Tag`来对字段做一些标记。该`Tag`不仅仅是一个字符串那么简单，因为其主要用于反射场景，`reflect`包中提供了操作`Tag`的方法，所以`Tag`的字符串格式有一定的要求，通常由反引号包围的字符串，字符串由一个或多个键值对组成，键值对之间使用空格分隔，键值对之间使用反引号包围。

- Struct 是一种聚合数据类型，它是由零个或多个任意类型的值聚合成的实体。
- Struct 的每个值称为字段（Field）。
- Struct 类型可以看作字段的集合。
- Struct 类型是值类型。
- Struct 类型具有匿名和具名两种形式。

#### 二、Tag 的本质

1. Tag 规则

    Tag 本身是一个字符串，但字符串中确是：`以空格分隔的 key:value 对`。

    - key: 必须是非空字符串，字符串不能包含控制符号、空格、引号、冒号。
    - value: 以双引号标记的字符串
    - 注意：冒号前后不能有空格

2. Tag 是Struct的一部分

    Tag 只有在反射场景中才有用，而反射包中提供了操作Tag的方法。

    ```
        type StructField struct {
            Name string
            Type reflect.Type
            Tag  reflect.StructTag
        }

        type StructTag string
    ```

    描述一个结构体成员的结构中包含了一个`reflect.StructTag`类型的字段`Tag`，`reflect.StructTag`本质上是一个字符串，它就是Tag的值。

3. Tag 的使用

    Tag 的使用场景：`反射`、`ORM`、`JSON`等。

    - 反射：通过反射获取Tag的值
    - ORM：将Tag的值解析为数据库字段名
    - JSON：将Tag的值解析为JSON字段名

    ```
        type User struct {
            Name string `json:"name" db:"name" form:"name"`
            Age  int    `json:"age" db:"age" form:"age"`
        }
    ```

    - `json:"name"`：表示JSON序列化时，`Name`字段对应的JSON字段名为`name`
    - `db:"name"`：表示ORM映射数据库时，`Name`字段对应的数据库字段名为`name`
    - `form:"name"`：表示表单提交时，`Name`字段对应的表单字段名为`name`

4. Tag 的解析

    Tag 的解析需要使用反射包中的方法，`reflect.StructTag`类型提供了`Get`方法，可以获取Tag中指定key的值。

    ```
        func (tag StructTag) Get(key string) string
    ```

    - `key`：Tag中指定key的值
    - `return`：Tag中指定key的值，如果不存在则返回空字符串

    ```
        type User struct {
            Name string `json:"name" db:"name" form:"name"`
            Age  int    `json:"age" db:"age" form:"age"`
        }

        func main() {
            u := User{
                Name: "张三",
                Age:  18,
            }

            v := reflect.ValueOf(u)

            for i := 0; i < v.NumField(); i++ {
                tag := v.Type().Field(i).Tag
                jsonTag := tag.Get("json")
                dbTag := tag.Get("db")
                formTag := tag.Get("form")

                fmt.Printf("Field: %s, JSON Tag: %s, DB Tag: %s, Form Tag: %s\n", v.Type().Field(i).Name, jsonTag, dbTag, formTag)
            }
        }
    ```

    - `Field`：获取结构体成员的名称
    - `NumField`：获取结构体成员的数量
    - `Type`：获取结构体成员的类型
    - `Get`：获取Tag中指定key的值

    输出结果：

    ```
        Field: Name, JSON Tag: name, DB Tag: name, Form Tag: name
        Field: Age, JSON Tag: age, DB Tag: age, Form Tag: age
    ```

5. Tag 存在的意义

    Tag 存在的意义在于，它可以在运行时动态地获取结构体成员的信息，从而实现一些高级的功能，如ORM、JSON序列化等。

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

###### 参考链接如下

- [Go 专家编程](https://www.topgoer.cn/docs/gozhuanjia/gochan4)
