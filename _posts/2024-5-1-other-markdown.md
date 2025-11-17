---
layout: post
title: "Markdown与HTML语法技术手册"
date:   2024-10-12
tags: 
  - 工具类
comments: true
author: feng6917
---

本技术手册详细对比Markdown与HTML在文档编写中的语法差异与应用场景，为技术文档编写者提供全面的语法参考和最佳实践指南。

<!-- more -->

<h2 id="c-1-0" style="text-align: center; color: black; background: linear-gradient(#fff 60%, #b2e311ff 40%); margin: 1.4em 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; letter-spacing: .33px;" href="https://guidest.com/cn/markdown/image/">一、图片嵌入</h2>

<h3 id="c-1-1" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">1.1 基础语法</h3>

```
![替代文字](图片路径)
![替代文字](图片路径 "图片标题")
```

- 语法组成部分：
  - 开头一个感叹号 !
  - 接着一个方括号，里面放上图片的替代文字（alt text）
  - 接着一个普通括号，里面放上图片的路径或URL
  - 可选：在路径后添加引号包围的标题文字

- 技术说明：
  - `![]()` 为Markdown标准图片语法
  - 方括号内为alt文本，对SEO和可访问性至关重要
  - 部分解析器支持花括号内的尺寸控制（非标准）

<h3 id="c-1-2" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">1.2 实际使用示例</h3>

本地图片示例：

  ```
  ![项目截图](./images/screenshot.png)
  ![用户界面](../assets/ui-demo.jpg "用户界面演示")
  ![应用图标](images/icon.svg "应用图标")
  ```

网络图片示例：

  ```
  ![示例图片](https://dummyimage.com/largerectangle/09f/fff&text=guidest.com)
  ![网站Logo](https://dummyimage.com/largerectangle/09f/fff&text=guidest.com "网站标志")
  ```  

<h3 id="c-1-3" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">1.3 路径使用推荐</h3>

相对路径（推荐）：

```
同级目录：photo.jpg
子目录：images/photo.jpg
上级目录：../photos/photo.jpg
```

绝对路径：

```
Windows：C:\Users\username\Pictures\screenshot.png
macOS/Linux：/Users/username/Documents/image.png
```

路径使用建议：

```
推荐使用相对路径，便于项目移植
建议创建专门的图片文件夹（如 images/、assets/）
使用有意义的文件名，便于管理
注意路径分隔符在不同操作系统中的差异
```

<h3 id="c-1-4" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">1.4 调整图片尺寸</h3>

Markdown原生语法无法直接调整图片大小，需要使用HTML标签：

```
<img src="chart.png" width="300" height="200" alt="统计图表">
<img src="logo.png" width="50%" alt="响应式图片">
```

<h3 id="c-1-5" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">1.5 图片居中展示</h3>

方法一：使用center标签

```
<center>
![架构图](diagram.png)
</center>
```

方法二：使用div + CSS

```
<div style="text-align: center;">
  <img src="image.jpg" alt="居中图片" style="max-width: 100%;">
</div>
```

方法三：使用p标签对齐

```
<p align="center">
  <img src="image.jpg" alt="居中图片" width="400">
</p>
```

<h3 id="c-1-6" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">1.6 图文混排</h3>

```
<img src="../images/2024-10-12/1.jpg" style="float:right; margin:0 0 1em 1em;" width="150">
这里是环绕文字内容，图片会浮动在右侧...
```

<h2 id="c-2-0" style="text-align: center; color: black; background: linear-gradient(#fff 60%, #b2e311ff 40%); margin: 1.4em 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; letter-spacing: .33px;">二、链接</h2>

<h3 id="c-2-1" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">2.1 基础语法-内联链接</h3>

内联链接是最常用的链接方式，格式简单直观：

```
[链接文字](链接地址)
[链接文字](链接地址 "可选标题")
```

- 基本示例:

    ```
    这是一个 [百度搜索](https://www.baidu.com) 的链接
    这是一个 [GitHub](https://github.com "全球最大的代码托管平台") 带标题的链接
    ```

- 显示效果：
  - 这是一个 [百度搜索](https://www.baidu.com) 的链接
  - 这是一个 [GitHub](https://github.com "全球最大的代码托管平台") 带标题的链接

- 标题作用：

    ```
    鼠标悬停时显示提示信息
    提升网站无障碍访问性
    对搜索引擎优化有帮助
    ```

<h3 id="c-2-2" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">2.2 基础语法-自动链接</h3>

直接输入网址或邮箱地址，Markdown会自动识别：

```
直接网址：https://www.example.com
用尖括号：<https://www.example.com>
邮箱地址：example@email.com
或者：<example@email.com>
```

- 显示效果：
  - 直接网址：<https://www.example.com>
  - 用尖括号：<https://www.example.com>
  - 邮箱地址：<example@email.com>

<h3 id="c-2-3" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">2.3 基础语法-引用式链接</h3>  

- 为什么使用引用式链接？

    引用式链接将链接定义与使用分离，特别适合：

    ```
    长文档或需要多次引用相同链接
    让文档正文更清爽，不被长网址打断
    便于链接的统一管理和更新
    提高 Markdown 源文件的可读性
    ```

- 基本语法:

    ```
    [链接文字][参考标签]

    [参考标签]: 链接地址 "可选标题"
    ```

- 实用示例:

    我经常使用 [Google][1] 搜索，也会查看 [维基百科][wiki] 获取知识。有时候也会访问 [GitHub][1] 查看代码。

    [1]: https://www.google.com "Google 搜索引擎"
    [wiki]: https://zh.wikipedia.org "中文维基百科"

<h3 id="c-2-4" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">2.4 页面内锚点链接</h3>

用于在同一文档内跳转，特别适合长文档导航：

```
## 目录
- [第一章：介绍](#第一章介绍)
- [第二章：安装](#第二章安装)
- [第三章：使用方法](#第三章使用方法)

# 第一章：介绍
这里是介绍内容...

# 第二章：安装
这里是安装说明...

# 第三章：使用方法
这里是使用说明...

[回到顶部](#)
```

- 锚点规则：
  - 标题会自动生成锚点
  - 锚点名称是标题的小写形式
  - 空格替换为连字符 -
  - 移除特殊字符

<h3 id="c-2-5" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">2.5 自定义锚点</h3>  

<h2 id="architecture">技术架构设计</h2>

<a href="#architecture" class="nav-link" data-section="design">跳转到架构设计</a>

<a href="https://example.com" target="_blank" rel="noopener noreferrer">外部链接</a>

<h3 id="c-2-6" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">2.6 链接技巧</h3>

- Markdown 图片链接和链接图片

  将图片与链接结合创建强大的图片链接元素：

  ```
  [![图片描述](图片地址)](链接地址)

  示例：
   [![GitHub Logo](https://github.com/favicon.ico)](https://github.com)
   [![点击访问我们的网站](https://example.com/logo.png)](https://example.com)
  ```

  这种图片链接技巧非常适合创建可点击的标志、横幅和行动按钮。

- Markdown 文件链接
  
  创建指向各种文件类型的链接：

  ```
  下载文件：
    - [PDF 文档](./documents/manual.pdf)
    - [Excel 表格](./data/report.xlsx)
    - [另一个 Markdown 文件](./other-page.md)

    外部文件链接：
    - [远程 PDF](https://example.com/document.pdf)
    - [GitHub 仓库文件](https://github.com/user/repo/blob/main/README.md)
  ```  

- 在新标签页打开链接

  虽然标准 Markdown 语法不支持在新标签页打开链接，但可以使用 HTML：

  ```
  <a href="https://www.example.com" target="_blank">在新窗口打开</a>
  <a href="https://www.example.com" target="_blank" rel="noopener noreferrer">安全的外部链接</a>  
  ```

- 脚注链接（扩展语法）

  脚注为文档添加补充说明，不干扰正文阅读：

  ```
  这是一个包含脚注的段落[^1]，还有另一个脚注[^note]。

  [^1]: 这是第一个脚注的内容。
  [^note]: 这是命名脚注，可以包含更多详细信息。
  ```

- URL 管理和链接管理

  有效的 URL 管理策略：  

  ```
  简短 URL 提高可读性：
    [文档](https://bit.ly/docs-link)

  查询参数：
    [搜索结果](https://example.com/search?q=markdown&type=docs)

  协议特定 URL：
    [发送邮件](mailto:contact@example.com?subject=Question)
    [下载文件](ftp://files.example.com/download.zip)
    [打开应用](myapp://deep-link/page)
  ```

<h2 id="c-3-0" style="text-align: center; color: black; background: linear-gradient(#fff 60%, #b2e311ff 40%); margin: 1.4em 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; letter-spacing: .33px;">三、引用块实现</h2>

<h3 id="c-3-1" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">3.1 Markdown引用语法</h3>

> 这是一段重要的技术说明
>
> > 嵌套引用支持
>
> **引用中的格式化文本**

<h3 id="c-3-2" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">3.2 HTML引用块</h3>

<blockquote cite="https://tools.ietf.org/html/rfc1149" class="technical-quote">
    <p>Avian carriers can provide high delay, low throughput, and low altitude service.</p>
    <footer>— RFC 1149, <cite>IP over Avian Carriers</cite></footer>
</blockquote>

- 语义化优势：
  - `cite`属性提供引用来源
  - 支持内部结构化（`footer`, `cite`）
  - CSS样式精确控制

<h2 id="c-4-0" style="text-align: center; color: black; background: linear-gradient(#fff 60%, #b2e311ff 40%); margin: 1.4em 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; letter-spacing: .33px;">四、代码块展示</h2>

<h3 id="c-4-1" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">4.1 Markdown代码块</h3>

```go
package main

import "fmt"

func main() {
    // 这是一个Go示例
    fmt.Println("Hello, World!")
}
```

<h3 id="c-4-2" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">4.2 HTML代码展示</h3>

<div class="code-container" data-language="javascript">
    <pre><code>package main
import "fmt"
func main() {
    fmt.Println("Hello, World!")
}</code></pre>
</div>

<h2 id="c-5-0" style="text-align: center; color: black; background: linear-gradient(#fff 60%, #b2e311ff 40%); margin: 1.4em 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; letter-spacing: .33px;">五、数据表格</h2>

<h3 id="c-5-1" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">5.1 Markdown表格</h3>

| 协议 | 端口 | 默认状态 | 安全建议 |
|------|------|----------|----------|
| HTTP | 80   | 开启     | **关闭** |
| HTTPS| 443  | 开启     | 保持开启 |
| SSH  | 22   | 开启     | 修改端口 |

<h3 id="c-5-2" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">5.2 HTML高级表格</h3>

<table class="technical-table" aria-describedby="table-desc">
    <caption id="table-desc">网络服务端口配置表</caption>
    <thead>
        <tr>
            <th scope="col">协议</th>
            <th scope="col">端口</th>
            <th scope="col">默认状态</th>
            <th scope="col">安全建议</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td data-label="协议">HTTP</td>
            <td data-label="端口">80</td>
            <td data-label="默认状态">开启</td>
            <td data-label="安全建议"><span class="warning">关闭</span></td>
        </tr>
    </tbody>
    <tfoot>
        <tr>
            <td colspan="4">* 生产环境建议最小化开放端口</td>
        </tr>
    </tfoot>
</table>

- 表格增强：
  - 语义化结构（`thead`, `tbody`, `tfoot`）
  - 响应式设计支持
  - 排序和筛选功能

<h2 id="c-6-0" style="text-align: center; color: black; background: linear-gradient(#fff 60%, #b2e311ff 40%); margin: 1.4em 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; letter-spacing: .33px;">六、内容分隔</h2>

<h3 id="c-6-1" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">6.1 Markdown分隔线</h3>

---
***
———————————

<h3 id="c-6-2" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">6.2 HTML分隔元素</h3>

<hr class="section-divider" />

<hr aria-hidden="true" style="
    border: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #1bb75c, transparent);
    margin: 2rem 0;
" />

<div class="divider" role="separator" aria-orientation="horizontal"></div>

<h2 id="c-7-0" style="text-align: center; color: black; background: linear-gradient(90deg,transparent, #1bb75c 40%, transparent); margin: 1.4rem 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 14px; letter-spacing: .33px;"></h2>

- 技术考量：
  - 语义化分隔（role="separator"）
  - 可访问性优化（aria-hidden）
  - CSS渐变和动画效果

<h2 id="c-7-0" style="text-align: center; color: black; background: linear-gradient(#fff 60%, #b2e311ff 40%); margin: 1.4em 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; letter-spacing: .33px;">七、交互式内容</h2>

<details class="technical-details" open>
    <summary class="details-summary">
        系统需求说明
    </summary>
    <div class="details-content">
        <ul>
            <li>操作系统: Ubuntu 20.04+ 或 CentOS 8+</li>
            <li>内存: 最低 4GB，推荐 8GB</li>
            <li>存储: 50GB 可用空间</li>
        </ul>
    </div>
</details>

<h2 id="c-8-0" style="text-align: center; color: black; background: linear-gradient(#fff 60%, #b2e311ff 40%); margin: 1.4em 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; letter-spacing: .33px;">八、输入密码查看页面</h2>

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

<hr aria-hidden="true" style=" border: 0; height: 2px; background: linear-gradient(90deg, transparent, #1bb75c, transparent); margin: 2rem 0; " />

<!-- 目录容器 -->
<div style="position: fixed; bottom: 240px; right: 10px; width: 240px; height: 320px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; overflow-y: auto; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; font-size: 14px; line-height: 1.15; color: #444; letter-spacing: 0.33px; transition: all 0.3s ease;">
    <strong>目录</strong>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
            <li style="list-style-type: none;"><a href="#c-1-0">一、图片</a></li>
            <ul style="padding-left: 15px; list-style-type: none;">
                <li style="list-style-type: none;"><a href="#c-1-1">1.1 基础语法</a></li>
                <li style="list-style-type: none;"><a href="#c-1-2">1.2 实际使用示例</a></li>
                <li style="list-style-type: none;"><a href="#c-1-3">1.3 路径使用推荐</a></li>
                <li style="list-style-type: none;"><a href="#c-1-4">1.4 调整图片尺寸</a></li>
                <li style="list-style-type: none;"><a href="#c-1-5">1.5 图片居中展示</a></li>
                <li style="list-style-type: none;"><a href="#c-1-6">1.6 图文混排</a></li>
            </ul>
            <li style="list-style-type: none;"><a href="#c-2-0">二、链接</a></li>
            <ul style="padding-left: 15px; list-style-type: none;">
                <li style="list-style-type: none;"><a href="#c-2-1">2.1 基础语法-内联链接</a></li>
                <li style="list-style-type: none;"><a href="#c-2-2">2.2 基础语法-自动链接</a></li>
                <li style="list-style-type: none;"><a href="#c-2-3">2.3 基础语法-引用式链接</a></li>
                <li style="list-style-type: none;"><a href="#c-2-4">2.4 页面内锚点链接</a></li>
                <li style="list-style-type: none;"><a href="#c-2-5">2.5 自定义锚点</a></li>
                <li style="list-style-type: none;"><a href="#c-2-6">2.6 链接技巧</a></li>
            </ul>
            <li style="list-style-type: none;"><a href="#c-3-0">三、引用块实现</a></li>
            <ul style="padding-left: 15px; list-style-type: none;">
                <li style="list-style-type: none;"><a href="#c-3-1">3.1 Markdown引用语法</a></li>
                <li style="list-style-type: none;"><a href="#c-3-2">3.2 HTML引用块</a></li>
            </ul>
            <li style="list-style-type: none;"><a href="#c-4-0">四、代码块展示</a></li>
            <ul style="padding-left: 15px; list-style-type: none;">
                <li style="list-style-type: none;"><a href="#c-4-1">4.1 Markdown代码块</a></li>
                <li style="list-style-type: none;"><a href="#c-4-2">4.2 HTML代码展示</a></li>
            </ul>
            <li style="list-style-type: none;"><a href="#c-5-0">五、数据表格</a></li>
            <ul style="padding-left: 15px; list-style-type: none;">
                <li style="list-style-type: none;"><a href="#c-5-1">5.1 Markdown表格</a></li>
                <li style="list-style-type: none;"><a href="#c-5-2">5.2 HTML高级表格</a></li>
            </ul>
            <li style="list-style-type: none;"><a href="#c-6-0">六、内容间隔 </a></li>
            <ul style="padding-left: 15px; list-style-type: none;">
                <li style="list-style-type: none;"><a href="#c-6-1">6.1 Markdown分割线</a></li>
                <li style="list-style-type: none;"><a href="#c-6-2">6.2 HTML分割元素</a></li>
            </ul>
            <li style="list-style-type: none;"><a href="#c-7-0">七、交互式内容</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-8-0">八、输入密码查看页面</a></li>
        </ul>
</div>

本技术手册将持续更新，欢迎提交Issue和Pull Request
