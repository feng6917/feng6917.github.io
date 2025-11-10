---
layout: post
title: "Markdown与HTML语法技术手册"
date:   2024-10-12
tags: 
  - 工具
comments: true
author: feng6917
---

本技术手册详细对比Markdown与HTML在文档编写中的语法差异与应用场景，为技术文档编写者提供全面的语法参考和最佳实践指南。

<!-- more -->

<h2 id="c-1-0" style="text-align: center; color: black; background: linear-gradient(#fff 60%, #b2e311ff 40%); margin: 1.4em 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; letter-spacing: .33px;">一、图片嵌入</h2>

<h3 id="c-1-1" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">1.1 Markdown图片语法</h3>

```
![替代文本描述](../images/2024-10-12/1.jpg)
![带尺寸控制](path/to/image.jpg){width=80% height=auto}
```

- 技术说明：
  - `![]()` 为Markdown标准图片语法
  - 方括号内为alt文本，对SEO和可访问性至关重要
  - 部分解析器支持花括号内的尺寸控制（非标准）

<h3 id="c-1-2" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">1.2 HTML图片语法</h3>

```
<img src="../images/2024-10-12/1.jpg" alt="替代文本描述" width="600" height="400" loading="lazy" />
<img src="image.jpg" alt="响应式图片" style="max-width: 100%; height: auto;" />
```

- 技术特性：
  - 完整的属性控制：`src`, `alt`, `width`, `height`
  - `loading="lazy"`：延迟加载优化性能
  - 支持内联样式和CSS类
  - 可添加`title`属性提供悬停提示

<h2 id="c-2-0" style="text-align: center; color: black; background: linear-gradient(#fff 60%, #b2e311ff 40%); margin: 1.4em 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; letter-spacing: .33px;">二、文档内导航</h2>

<h3 id="c-2-1" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">2.1 Markdown锚点链接</h3>

```
## 技术架构设计

[跳转到架构设计](#技术架构设计)
[外部链接](https://example.com)
```

- 实现原理：
  - 标题自动生成锚点（基于文本内容）
  - 使用`[]()`语法创建链接

<h3 id="c-2-2" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">2.2 HTML导航</h3>

```
<h2 id="architecture">技术架构设计</h2>

<a href="#architecture" class="nav-link" data-section="design">跳转到架构设计</a>

<a href="https://example.com" target="_blank" rel="noopener noreferrer">外部链接</a>
```

- 高级特性：
  - 精确的ID控制
  - 自定义样式和类
  - 支持外部链接和`target="_blank"`属性

<h2 id="c-3-0" style="text-align: center; color: black; background: linear-gradient(#fff 60%, #b2e311ff 40%); margin: 1.4em 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; letter-spacing: .33px;">三、引用块实现</h2>

<h3 id="c-3-1" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">3.1 Markdown引用语法</h3>

```
> 这是一段重要的技术说明
> 
> > 嵌套引用支持
> 
> **引用中的格式化文本**
```

<h3 id="c-3-2" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">3.2 HTML引用块</h3>

```
<blockquote cite="https://tools.ietf.org/html/rfc1149" class="technical-quote">
    <p>Avian carriers can provide high delay, low throughput, and low altitude service.</p>
    <footer>— RFC 1149, <cite>IP over Avian Carriers</cite></footer>
</blockquote>
```

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

```
| 协议 | 端口 | 默认状态 | 安全建议 |
|------|------|----------|----------|
| HTTP | 80   | 开启     | **关闭** |
| HTTPS| 443  | 开启     | 保持开启 |
| SSH  | 22   | 开启     | 修改端口 |
```

<h3 id="c-5-2" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">5.2 HTML高级表格</h3>

```
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
```

- 表格增强：
  - 语义化结构（`thead`, `tbody`, `tfoot`）
  - 响应式设计支持
  - 排序和筛选功能

<h2 id="c-6-0" style="text-align: center; color: black; background: linear-gradient(#fff 60%, #b2e311ff 40%); margin: 1.4em 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; letter-spacing: .33px;">六、内容分隔</h2>

<h3 id="c-6-1" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">6.1 Markdown分隔线</h3>

```
---
***
___（下划线样式）
```

<h3 id="c-6-2" style="-webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;">6.2 HTML分隔元素</h3>

```
<hr class="section-divider" />

<hr aria-hidden="true" style="
    border: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #1bb75c, transparent);
    margin: 2rem 0;
" />

<div class="divider" role="separator" aria-orientation="horizontal"></div>

<hr style="background-color: blue;border: none;height: 15px;width: 100%" />

```

<hr aria-hidden="true" style="
    border: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #1bb75c, transparent);
    margin: 2rem 0;
" />

<div class="divider" role="separator" aria-orientation="horizontal"></div>

- 技术考量：
  - 语义化分隔（role="separator"）
  - 可访问性优化（aria-hidden）
  - CSS渐变和动画效果

<h2 id="c-7-0" style="text-align: center; color: black; background: linear-gradient(90deg,transparent, #1bb75c 40%, transparent); margin: 1.4rem 0 1.1em; font-size: 1.4em; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 14px; letter-spacing: .33px;">七、交互式内容</h2>

```
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
```

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

<!-- 目录容器 -->
<div style="position: fixed; bottom: 240px; right: 10px; width: 240px; height: 320px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; overflow-y: auto; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; font-size: 14px; line-height: 1.15; color: #444; letter-spacing: 0.33px; transition: all 0.3s ease;">
    <strong>目录</strong>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
            <li style="list-style-type: none;"><a href="#c-1-0">一、图片嵌入</a></li>
            <ul style="padding-left: 15px; list-style-type: none;">
                <li style="list-style-type: none;"><a href="#c-1-1">1.1 Markdown图片语法</a></li>
                <li style="list-style-type: none;"><a href="#c-1-2">1.2 HTML图片语法</a></li>
            </ul>
            <li style="list-style-type: none;"><a href="#c-2-0">二、文档内导航</a></li>
            <ul style="padding-left: 15px; list-style-type: none;">
                <li style="list-style-type: none;"><a href="#c-2-1">2.1 Markdown锚点链接</a></li>
                <li style="list-style-type: none;"><a href="#c-2-2">2.2 HTML导航</a></li>
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

---
本技术手册将持续更新，欢迎提交Issue和Pull Request
