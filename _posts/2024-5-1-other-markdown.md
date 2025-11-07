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

<h2 style="text-align: center; color: black; background: linear-gradient(#fff 60%, #b2e311ff 40%); margin: 1.4em 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; letter-spacing: .33px;">一、Lua 脚本与 Redis</h2>

<!-- 目录容器 -->
<div style="position: fixed; bottom: 240px; right: 10px; width: 240px; height: 320px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; overflow-y: auto; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; font-size: 14px; line-height: 1.15; color: #444; letter-spacing: 0.33px; transition: all 0.3s ease;">
<strong>目录</strong>
<ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
    <li style="list-style-type: none;"><a href="#c-0-0">一、Lua 脚本与 Redis</a></li>
    <ul style="padding-left: 15px; list-style-type: none;">
<li style="list-style-type: none;"><a href="#c-1-0">1.1 为什么要在 Redis 中使用 Lua 脚本？</a></li>
</ul>
    <li style="list-style-type: none;"><a href="#c-1-1">二、go-redis 执行 Lua 脚本</a></li>
<ul style="padding-left: 15px; list-style-type: none;">
    <li style="list-style-type: none;"><a href="#c-2-0">2.1 在 Go 中执行 Lua 脚本</a></li>
</ul>
<li style="list-style-type: none;"><a href="#c-2-1">三、Redis 的 Script Load 及其应用</a></li>
<ul style="padding-left: 15px; list-style-type: none;">
    <li style="list-style-type: none;"><a href="#c-3-0">3.1 Script Load 是什么？</a></li>
    <li style="list-style-type: none;"><a href="#c-3-1">3.2 Script Load 的应用场景</a></li>
    <li style="list-style-type: none;"><a href="#c-3-2">3.3 Go-redis 示例：使用 Script Load 优化</a></li>
</ul>
<li style="list-style-type: none;"><a href="#c-3-3">四、Go 语言中的 embed 特性</a></li>
<ul style="padding-left: 15px; list-style-type: none;">
    <li style="list-style-type: none;"><a href="#c-4-0">4.1 embed 是什么？</a></li>
    <li style="list-style-type: none;"><a href="#c-4-1">4.2 embed 的应用场景</a></li>
    <li style="list-style-type: none;"><a href="#c-4-2">4.3 使用 go:embed 优化 Lua 脚本管理</a></li>
</ul>
<li style="list-style-type: none;"><a href="#c-4-3">五、总结</a></li>
</ul>
</div>
