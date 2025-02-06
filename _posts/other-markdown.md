---
layout: post
title: "Markdown 使用参考"
date:   2024-10-12
tags: 
  - 杂七杂八
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
- [八、输入密码查看页面](#八输入密码查看页面)

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

    <hr style="background-color: blue;border: none;height: 15px;width: 100%" />

#### 七、折叠

    <details>
        <summary>点击展开</summary>
        <p>内容</p>
    </details>

#### 八、输入密码查看页面
>
> 把js代码放到首位，pass1 为设置的登录密码.

```javascript
    <SCRIPT language=JavaScript>

    function password() {

        var testV=0;

        var pass1=prompt('赶紧输密码:', '');

        while (testV < 3) {

            if ( !pass1) history.go(-1);

            if (pass1=="myz") {

                alert('密码正确!');

                break;

            }

            testV+=1;

            if (testV==1) {
                pass1=prompt('密码错了，搞什么啊！还剩两次机会。');
            }

            else if (testV==2) {
                pass1=prompt('密码错了，搞什么啊！还剩一次机会。');
            }

        }

        if (pass1 !="password" & testV==3) history.go(-1);

        return " ";

    }

    document.write(password());

    </SCRIPT>
```

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>
