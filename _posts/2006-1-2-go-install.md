---
layout: post
title: "Go 安装与使用指南"
date:   2020-3-3
tags: 
  - Golang
comments: true
author: feng6917
---

持续更新 ...

<!-- more -->

<h2 id="c-1-0" class="mh1">一、安装包下载</h2>

1. 请求 [下载地址](https://go.dev/dl/) 进行安装包下载
2. 根据 Mac、Linux、Windows 选择不同环境进行下载，点击 show 选择不同版本
   ![img](../images/2020-3-3/1.jpg)

<h2 id="c-2-0" class="mh1">二、不同环境安装</h2>

<h2 id="c-2-1" class="mh2">2.1 Linux</h2>

1. **下载安装包**

2. 通过删除 `/usr/local/go` 文件夹（如果存在）来删除任何以前的 Go 安装，然后将您刚刚下载的存档解压到 `/usr/local`，在 `/usr/local/go` 中创建一个新的 Go 树：

   ```bash
   rm -rf /usr/local/go && tar -C /usr/local -xzf go1.23.0.linux-amd64.tar.gz
   ```

3. 将 `/usr/local/go/bin` 添加到 `PATH` 环境变量：

   ```bash
   # 您可以通过将以下行添加到您的 $HOME/.profile 或 /etc/profile (对于系统范围的安装) 来执行此操作：
   
   export PATH=$PATH:/usr/local/go/bin
   
   # 注意：对配置文件所做的更改可能要等到您下次登录计算机时才会生效。要立即应用更改，只需直接运行 shell 命令或使用 source $HOME/.profile 等命令从配置文件中执行这些更改。
   ```

4. 打开命令提示符并输入以下命令来验证是否已安装 Go：

   ```bash
   go version
   ```

5. 安装脚本参考：

   ```bash
   #!/bin/bash
   # 下载最新 Go 版本 (替换为实际需要版本)
   GO_VERSION="1.17.6"
   #wget https://golang.org/dl/go${GO_VERSION}.linux-amd64.tar.gz
   
   # 解压到 /usr/local
   sudo tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz
   
   # 设置环境变量
   echo 'export PATH=$PATH:/usr/local/go/bin' | sudo tee -a /etc/profile
   echo 'export GOPATH=$HOME/go' | sudo tee -a /etc/profile
   echo 'export PATH=$PATH:$GOPATH/bin' | sudo tee -a /etc/profile
   
   # 立即生效
   source /etc/profile
   
   # 验证安装
   go version
   ```

<h2 id="c-2-2" class="mh2">2.2 Mac</h2>

1. **下载安装包**

2. 打开下载的包文件，按照提示安装 Go
   > 该软件包将 Go 发行版安装到 `/usr/local/go`。该软件包应将 `/usr/local/go/bin` 目录放入您的 `PATH` 环境变量中。您可能需要重新启动任何打开的终端会话才能使更改生效。

3. 打开命令提示符并输入以下命令来验证是否已安装 Go：

   ```bash
   go version
   ```

<h2 id="c-2-3" class="mh2">2.3 Windows</h2>

1. **下载安装包**

2. 打开下载的 MSI 文件并按照提示安装 Go
   > 默认情况下，安装程序将安装 Go to Program Files 或 Program Files (x86)。您可以根据需要更改位置。安装后，您需要关闭并重新打开所有打开的命令提示符，以便安装程序对环境所做的更改反映在命令提示符中。

3. **验证您是否已安装 Go**
   1. 输入 Win+Q, cmd, Enter 确认
   2. 打开命令提示符并输入以下命令来验证是否已安装 Go：

      ```bash
      go version
      ```

<h2 id="c-3-0" class="mh1">三、 参数配置</h2>

<h2 id="c-3-1" class="mh1">3.1 GO111MODULE</h2>

>
> - `GO111MODULE=off`，无模块支持，go 命令行将不会支持 module 功能，寻找依赖包的方式将会沿用旧版本那种通过 vendor 目录或者 GOPATH 模式来查找。
> - `GO111MODULE=on`，模块支持，go 命令行会使用 modules，而一点也不会去 GOPATH 目录下查找。
> - `GO111MODULE=auto`，默认值，go 命令行将会根据当前目录来决定是否启用 module 功能。这种情况下可以分为两种情形：
>   （1）当前目录在 GOPATH/src 之外且该目录包含 go.mod 文件，开启模块支持。
>   （2）当前文件在包含 go.mod 文件的目录下面。

```bash
go env -w GO111MODULE=on
```

<h2 id="c-3-2" class="mh2">3.2 GOPROXY</h2>

>
> 一些第三方代码库是在国外服务器上的，因为一些限制，我们不能很顺利的使用和下载这些仓库，这样就会导致下载缓慢或者失败，所以这个时候就需要一个代理来实现下载，这个代理就是中间商，可以跨过限制来访问。

```bash
# 国内七牛云代理
go env -w GOPROXY=https://goproxy.cn,direct
```

<h2 id="c-4-0" class="mh1">四、构建和运行</h2>

### 1. 编写代码

1. 新建 `go_test` 文件夹：

   ```
   make dir go_test
   ```

2. 新建 `hello.go` 文件：

   ```
   $ vi hello.go
   --------------------------------------------
   package main
   
   import "fmt"
   
   func main() {
   
     fmt.Println("Hello World!")
     
   }
   ```

### 2. 构建

1. **初始化**：

   ```bash
   go mod init hello
   go mod tidy
   ```

2. **构建、运行**：

   ```bash
   go build
   ./hello
   ```

### 3. git submodule

1. **添加子模块**：

   ```bash
   git submodule add https://github.com/xxx/xxx.git
   ```

2. **更新子模块**：

   ```bash
   git submodule update --init --recursive
   ```

3. **删除子模块**：

   ```bash
   git rm --cached xxx
   rm -rf xxx
   rm .gitmodules
   git commit -m "remove submodule"
   ```

### 4. go.mod replace & indirect (建议使用)

1. **replace**：

   ```bash
   replace github.com/xxx/xxx => github.com/xxx/xxx v1.0.0
   ```

2. **indirect**：

   ```bash
   require (
       github.com/xxx/xxx v1.0.0
       github.com/xxx/xxx v1.0.0 // indirect
   )
   ```

<h2 id="c-5-0" class="mh1">五、多平台编译</h2>

> **环境变量说明**
>
> - **GOOS**：目标可执行程序运行操作系统，支持 darwin，freebsd，linux，windows
> - **GOARCH**：目标可执行程序操作系统构架，包括 386，amd64，arm
> - **更新工具链的命令**：go get go@1.21.0

### 1. Mac 下编译 Linux, Windows 平台的 64 位可执行程序

- **Linux**：

  ```
  CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o appName main.go
  ```

- **Windows**：

  ```
  CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -o appName main.go
  ```

### 2. Linux 下编译 Mac, Windows 平台的 64 位可执行程序

- **Mac**：

  ```
  CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -o appName main.go
  ```

- **Windows**：

  ```
  CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -o appName main.go
  ```

### 3. Windows 下编译其他平台

- **Mac**：

  ```
  SET CGO_ENABLED=0
  SET GOOS=darwin
  SET GOARCH=amd64
  go build -o appName main.go
  ```

- **Linux**：

  ```
  SET CGO_ENABLED=0
  SET GOOS=linux
  SET GOARCH=amd64
  go build -o appName main.go
  ```

<h2 id="c-6-0" class="mh1">六、Web Grpc</h2>

- [扩展程序导出](https://www.bilibili.com/opus/575052862027578581)
- [Google 导出和安装 扩展程序](https://www.cnblogs.com/CRobot/p/18820596)

----

<hr aria-hidden="true" style=" border: 0; height: 2px; background: linear-gradient(90deg, transparent, #1bb75c, transparent); margin: 2rem 0; " />

<!-- 目录容器 -->
<div class="mi1">
    <strong>目录</strong>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
            <li style="list-style-type: none;"><a href="#c-1-0">一、安装包下载</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-2-0">二、不同环境安装</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-2-1">2.1 Linux</a></li>
                    <li style="list-style-type: none;"><a href="#c-2-2">2.2 Mac</a></li>
                    <li style="list-style-type: none;"><a href="#c-2-3">2.3 Windows</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-3-0">三、 参数配置</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-3-1">3.1 GO111MODULE</a></li>
                    <li style="list-style-type: none;"><a href="#c-3-2">3.2 GOPROXY</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-4-0">四、构建和运行</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-5-0">五、多平台编译</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-6-0">六、Web Grpc</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
        </ul>
</div>

<style>
    /* 一级段落 */
    .mh1 {
      text-align: center;
      color: black;
      background: linear-gradient(#fff 60%, #b2e311ff 40%);
      margin: 1.4em 0 1.1em;
      font-size: 1.4em;
      font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif;
      line-height: 1.7;
      letter-spacing: .33px;
    }
    /* 二级段落 */

    .mh2 {
      -webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;
    }

    /* 目录 高度、宽度 可自行调整*/
    .mi1 {
      position: fixed; bottom: 240px; right: 10px; width: 240px; height: 220px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; overflow-y: auto; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; font-size: 14px; line-height: 1.15; color: #444; letter-spacing: 0.33px; transition: all 0.3s ease;
    }

</style>

本技术手册将持续更新，欢迎提交Issue和Pull Request
