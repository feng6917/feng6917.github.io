---
layout: post
title: "Markdown 使用参考"
date:   2024-10-12
tags: 
  - dev
comments: true
author: feng6917
---

<!-- more -->

### 目录

- [一、图片](#一图片)
- [二、跳转](#二跳转)
- [三、引用](#三引用)
- [四、代码块](#四代码块)
- [五、表格](#五表格)
- [六、间隔线](#六间隔线)
- [七、折叠][#七折叠]

#### 一、图片

1. markdown 语法

    ![图片](../images/2024-10-12/1.jpg)

2. html 语法

    <img src="../images/2024-10-12/1.jpg" alt="图片" />

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

#### 二、跳转

1. markdown 语法

    [目录](#目录)

2. html 语法

    <a href="#目录" style="text-decoration: none;">目录</a>

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

#### 三、引用

1. markdown 语法
    > 引用内容

2. html 语法
    <blockquote>
        <p>引用内容</p>
    </blockquote>

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

#### 四、代码块

1. markdown 语法

    ```go
    func main() {
        fmt.Println("hello world")
    }
    ```

2. html 语法
    <pre><code class="language-go">func main() {
        fmt.Println("hello world")
    }</code></pre>

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

#### 五、表格

1. Markdown 表格语法

    | 表头1 | 表头2 | 表头3 |
    | ----- | ----- | ----- |
    | 内容1 | 内容2 | 内容3 |
    | 内容4 | 内容5 | 内容6 |

2. html 语法
    <table>
        <thead>
            <tr>
                <th>表头1</th>
                <th>表头2</th>
                <th>表头3</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>内容1</td>
                <td>内容2</td>
                <td>内容3</td>
            </tr>
            <tr>
                <td>内容4</td>
                <td>内容5</td>
                <td>内容6</td>
            </tr>
        </tbody>
    </table>

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

#### 六、间隔线

1. markdown 语法

    ---

2. html 语法
    <hr />

    <hr style="background-color: blue;border: none;height: 10px;opacity: .1;width: 100%" />

#### 七、折叠

    <details>
        <summary>点击展开</summary>
        <p>内容</p>
    </details>

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>
