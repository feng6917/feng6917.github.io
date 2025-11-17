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

<h2 id="c-1-0" style="text-align: center; color: black; background: linear-gradient(#fff 60%, #b2e311ff 40%); margin: 1.4em 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; letter-spacing: .33px;" href="https://guidest.com/cn/markdown/image/">一、图片</h2>

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

<h2 id="c-3-0" style="text-align: center; color: black; background: linear-gradient(#fff 60%, #b2e311ff 40%); margin: 1.4em 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; letter-spacing: .33px;">三、代码块</h2>

Markdown代码块允许你以适当的格式和语法高亮显示代码。它们保留空格、缩进和特殊字符，使代码易于阅读。

- 行内代码
  
  对于文本中的短代码片段，使用单个反引号：

  ```
  使用 `console.log()` 在JavaScript中打印输出。
  ```

  结果：

  使用 `console.log()` 在JavaScript中打印输出。

- 围栏代码块
  
  对于多行代码，使用三个反引号（```）或三个波浪号（~~~）：

  - 基本语法

    ```
    import "fmt"

    function main() {
        fmt.Println("Hello, world!")
    }
    ```

  - 指定编程语言

    ```go
    import "fmt"

    function main() {
        fmt.Println("Hello, world!")
    }
    ```

  - 常用语言标识符

    - javascript 或 js - JavaScript
    - python 或 py - Python
    - java - Java
    - cpp 或 c++ - C++
    - html - HTML
    - css - CSS
    - json - JSON
    - xml - XML
    - bash 或 shell - Shell脚本
    - sql - SQL
    - php - PHP
    - ruby - Ruby
    - go - Go
    - rust - Rust
    - typescript 或 ts - TypeScript

- 高级示例
  - Python示例

    ```python
    # 列表推导式示例
    numbers = [1, 2, 3, 4, 5]
    squares = [x**2 for x in numbers]
    print(squares)  # 输出：[1, 4, 9, 16, 25]
    ```

- HTML 代码块

    <div class="code-container" data-language="go">
    <pre><code>  import "fmt"
    func main() {
        fmt.Println("Hello, World!")
    }</code></pre>
    </div>

<h2 id="c-4-0" style="text-align: center; color: black; background: linear-gradient(#fff 60%, #b2e311ff 40%); margin: 1.4em 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; letter-spacing: .33px;">四、复选框</h2>

<h3 id="c-4-1" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">4.1 基础复选框语法</h3>

Markdown 复选框是交互式元素，允许您在 Markdown 文档中创建任务列表。它们提供了一种直观的方式来跟踪项目进度、创建检查清单，并直接在文档中管理任务。

- 基本语法使用方括号和特定字符：
  - [ ] 创建未选中的复选框
  - [x] 创建已选中的复选框

- 标准 Markdown 任务列表语法简单直接，广受支持：

  - [ ] 未完成任务
  - [x] 已完成任务
  - [ ] 另一个未完成任务
    - [ ] 嵌套子任务
    - [x] 已完成子任务

- 替代列表标记
  
  可以使用星号 (*) 代替连字符 (-)：
  
  ```
  * [ ] 买菜
  * [x] 洗衣服
  * [ ] 倒垃圾
  ```

- 重要语法规则
  1. 间距很重要：方括号前后必须有空格
  2. 大小写敏感：已选中项目使用小写 'x'
  3. 列表格式：必须遵循正确的列表语法

<h3 id="c-4-2" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">4.2 高级格式化技巧</h3>

- 优先级指示器

  - [ ] 🔴 关键 bug 修复
  - [ ] 🟠 重要功能请求
  - [ ] 🟡 中等优先级增强
  - [ ] 🟢 低优先级清理

- 状态指示器

  - [ ] ⏳ 进行中
  - [ ] ⏸️ 暂停
  - [ ] ❓ 需要澄清
  - [ ] 🔄 审查中
  - [x] ✅ 已完成
  - [x] ❌ 已取消

- 每日站会跟踪
  - 昨天完成的任务
    - [x] ~~设置开发环境~~ ✅ 张三
    - [x] ~~创建项目结构~~ ✅ 李四
    - [x] ~~设计数据库 ERD~~ ✅ 王五
  - 今天计划的任务
    - [ ] 实现用户注册 API [张三] 🔄 进行中
    - [ ] 创建登录表单组件 [李四] ⏳ 今天开始
    - [ ] 设置单元测试框架 [王五] 📋 已计划

  - 阻塞问题
    - [ ] ❗ API 文档缺失 - 需要产品团队提供
    - [ ] ⚠️ 数据库迁移脚本待审查
    - [ ] 🔒 需要生产环境访问权限

<h3 id="c-4-3" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">4.3 HTML 增强复选框</h3>

对于支持 HTML 的平台，您可以创建更复杂的复选框：

```
<!-- 基础复选框 -->
<input type="checkbox" disabled> 基础只读复选框
<input type="checkbox" disabled checked> 已完成只读复选框

<!-- 带 CSS 类的样式复选框 -->
<input type="checkbox" disabled class="priority-high"> 高优先级任务
<input type="checkbox" disabled checked class="completed-success"> 成功完成

<!-- 带标签以提高可访问性 -->
<label>
  <input type="checkbox" disabled> 
  带合适标签的任务
</label>

<!-- 带额外元数据的自定义复选框 -->
<div class="task-item">
  <input type="checkbox" id="task-123" disabled>
  <label for="task-123">
    <span class="task-title">完成用户身份验证</span>
    <span class="task-meta">预估: 4小时 | 截止: 1月20日 | 分配给: 张三</span>
  </label>
</div>
```

增强复选框的 CSS 样式

```
/* 自定义任务列表样式 */
.task-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.task-item input[type="checkbox"] {
  margin-right: 10px;
  transform: scale(1.2);
}

.task-title {
  font-weight: bold;
  margin-right: 10px;
}

.task-meta {
  font-size: 0.9em;
  color: #666;
}

.priority-high + label {
  border-left: 3px solid #ff4444;
  padding-left: 8px;
}

.completed-success:checked + label {
  text-decoration: line-through;
  opacity: 0.7;
  color: #28a745;
}
```

<h2 id="c-5-0" style="text-align: center; color: black; background: linear-gradient(#fff 60%, #b2e311ff 40%); margin: 1.4em 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; letter-spacing: .33px;">五、表格</h2>

<h3 id="c-5-1" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">5.1 基础表格语法</h3>

Markdown 表格是一种用于组织和展示结构化数据的标记语法，通过简单的符号组合就能创建出整洁美观的表格。掌握Markdown表格制作技巧，能让你的文档内容更加清晰有条理，是每个内容创作者必备的技能。

- 表格语法核心元素
  创建 Markdown表格 需要掌握三个核心符号：
  - `|` (竖线) `-` 分隔不同的列
  - `-` (连字符) `-` 定义表头分隔线
  - `:` (冒号) `-` 对齐方式

- 基础表格结构：

  ```
  | 表头1   | 表头2   | 表头3   |
  |---------|---------|---------|
  | 内容1   | 内容2   | 内容3   |
  | 内容4   | 内容5   | 内容6   |
  ```

- 语法要点说明
  - 表头和数据行之间必须有分隔线
  - 分隔线至少需要三个连字符 `---`
  - 两端的竖线 `|` 是可选的，但建议保留以提高可读性
  - 不需要严格对齐，但对齐后更美观

- 表格格式化技巧
  通过在分隔线中添加冒号来控制对齐方式：

  ```
  | 左对齐 | 居中对齐 | 右对齐 |
  |:------:|:--------:|:------:|
  |  内容1 |  内容2   |  内容3 |
  |  内容4 |  内容5   |  内容6 |
  ```

- 表格内容格式化
  在表格单元格中可以使用其他 Markdown语法：

  ```
  | 功能     | 语法示例              | 效果预览    |
  |----------|----------------------|-------------|
  | 加粗     | `**重要内容**`       | **重要内容** |
  | 斜体     | `*强调内容*`         | *强调内容*  |
  | 代码     | `` `print()` ``      | `print()`   |
  | 链接     | `[链接](URL)`        | [链接](#)   |
  | 删除线   | `~~删除内容~~`       | ~~删除内容~~ |
  ```  

<h3 id="c-5-2" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">5.2 高级表格</h3>

- 处理长文本内容

  当表格中有长文本时，可以使用以下表格格式化技巧：

  ```
  | 项目名称 | 简短描述 | 详细说明 |
  |----------|----------|----------|
  | 项目A    | 数据分析工具 | 这是一个功能强大的数据分析工具，支持多种数据格式导入、实时数据处理、可视化图表生成等功能 |
  | 项目B    | 文档管理系统 | 企业级文档管理解决方案，提供版本控制、权限管理、在线协作编辑等核心功能 |
  ```

- 单元格内换行
  
  虽然标准 Markdown语法 不直接支持单元格内换行，但可以使用 HTML 标签：

  ```
  | 姓名 | 联系方式 |
  |------|----------|
  | 张三 | 电话：138-0000-0000<br>邮箱：zhang@example.com |
  | 李四 | 电话：139-1111-1111<br>邮箱：li@example.com |
  ```

- 表格中的特殊字符

  在Markdown表格中使用特殊字符需要转义：

  ```
  | 字符 | 转义方法 | 说明 |
  |------|----------|------|
  | \|   | `\|`     | 竖线需要转义避免破坏表格结构 |
  | \-   | `\-`     | 在分隔行中可能需要转义 |
  | \    | `\\`     | 反斜杠本身需要转义 |
  ```  

<h3 id="c-5-3" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">5.3 结合 HTML 实现复杂表格</h3>

当标准 Markdown语法 无法满足需求时，可以结合 HTML：

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

<h2 id="c-6-0" style="text-align: center; color: black; background: linear-gradient(#fff 60%, #b2e311ff 40%); margin: 1.4em 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; letter-spacing: .33px;">六、分隔线</h2>

<h3 id="c-6-1" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">6.1 基础分割线语法</h3>

1. 使用三个或更多的连字符 `-`、星号 `*` 或下划线 `_` 来创建水平分割线：

    - 渲染效果：
        1. ---
        2. ***
        3. ___

2. 带文本的分割线（自定义）

   由于原生Markdown不支持带文本的分割线，但可以通过HTML或CSS实现：

   <div align="center">
   <strong>· · ·</strong>
   </div>

   <p align="center">•••</p>

<h3 id="c-6-2" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">6.2 HTML 分割线完整指南</h3>

1. 基础`<hr>` 标签

   <p>上面的内容</p>
   <hr>
   <p>下面的内容</p>

2. 带样式的分割线

基础样式

<hr style="border: none; height: 2px; background: linear-gradient(90deg, transparent, #333, transparent);">

<hr style="border: none; height: 1px; background-color: #e0e0e0;">

<hr style="border: 0; border-top: 3px double #8c8c8c;">

2. 渐变分割线：

<hr style="border: 0;height: 1px;background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.75), rgba(0,0,0,0));">

3. 带图标的分割线

<div style="text-align: center; margin: 2rem 0;">

<hr style="
    display: inline-block;
    width: 30%;
    vertical-align: middle;
    border: none;
    height: 1px;
    background: #ccc;
">
<span style="
    display: inline-block;
    padding: 0 1rem;
    color: #666;
    font-size: 1.2rem;
">❦</span>
<hr style="
    display: inline-block;
    width: 30%;
    vertical-align: middle;
    border: none;
    height: 1px;
    background: #ccc;
">
</div>

4. 动画分割线

<hr style="
  border: 0;
  height: 3px;
  background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7, #ff6b6b);
  background-size: 400% 400%;
  animation: gradientShift 3s ease infinite;
">

<style>
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>

<hr class="section-divider" />

<hr aria-hidden="true" style="
    border: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #1bb75c, transparent);
    margin: 2rem 0;
" />

5. 可重用的分割线类

<style>
/* 基础分割线 */
.divider {
  border: none;
  height: 1px;
  background-color: #e0e0e0;
  margin: 2rem 0;
}

/* 渐变分割线 */
.divider-gradient {
  border: none;
  height: 2px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  margin: 2rem 0;
}

/* 虚线分割线 */
.divider-dashed {
  border: none;
  height: 1px;
  background: repeating-linear-gradient(
    90deg,
    #ccc,
    #ccc 5px,
    transparent 5px,
    transparent 10px
  );
  margin: 2rem 0;
}

/* 阴影分割线 */
.divider-shadow {
  border: none;
  height: 6px;
  background: linear-gradient(180deg,
    rgba(0,0,0,0.1) 0%,
    transparent 50%,
    rgba(0,0,0,0.1) 100%);
  margin: 2rem 0;
}

/* 带文本的分割线容器 */
.divider-with-text {
  display: flex;
  align-items: center;
  margin: 2rem 0;
  color: #666;
}

.divider-with-text::before,
.divider-with-text::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #e0e0e0;
}

.divider-text {
  padding: 0 1rem;
  font-size: 0.9rem;
}
</style>

<p>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp普通内容</p>
<hr class="divider">
<p>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp渐变分割线下方</p>
<hr class="divider-gradient">
<p>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp虚线分割线下方</p>
<hr class="divider-dashed">

<div class="divider-with-text">
  <span class="divider-text">继续阅读</span>
</div>

<div class="divider" role="separator" aria-orientation="horizontal"></div>

<h2 id="c-7-0" style="text-align: center; color: black; background: linear-gradient(90deg,transparent, #1bb75c 40%, transparent); margin: 1.4rem 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 14px; letter-spacing: .33px;"></h2>

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
            <li style="list-style-type: none;"><a href="#c-3-0">三、代码块</a></li>
            <ul style="padding-left: 15px; list-style-type: none;">
            </ul>
            <li style="list-style-type: none;"><a href="#c-4-0">四、复选框</a></li>
            <ul style="padding-left: 15px; list-style-type: none;">
                <li style="list-style-type: none;"><a href="#c-4-1">4.1 基础复选框语法</a></li>
                <li style="list-style-type: none;"><a href="#c-4-2">4.2 高级格式化技巧</a></li>
                <li style="list-style-type: none;"><a href="#c-4-3">4.3 HTML 增强复选框</a></li>
            </ul>
            <li style="list-style-type: none;"><a href="#c-5-0">五、表格</a></li>
            <ul style="padding-left: 15px; list-style-type: none;">
                <li style="list-style-type: none;"><a href="#c-5-1">5.1 基础表格语法</a></li>
                <li style="list-style-type: none;"><a href="#c-5-2">5.2 高级表格</a></li>
                <li style="list-style-type: none;"><a href="#c-5-3">5.3 结合 HTML 实现复杂表格</a></li>
            </ul>
            <li style="list-style-type: none;"><a href="#c-6-0">六、内容间隔 </a></li>
            <ul style="padding-left: 15px; list-style-type: none;">
                <li style="list-style-type: none;"><a href="#c-6-1">6.1 基础分割线语法</a></li>
                <li style="list-style-type: none;"><a href="#c-6-2">6.2 HTML分割线完整指南</a></li>
            </ul>
            <li style="list-style-type: none;"><a href="#c-7-0">七、交互式内容</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-8-0">八、输入密码查看页面</a></li>
        </ul>
</div>

本技术手册将持续更新，欢迎提交Issue和Pull Request
