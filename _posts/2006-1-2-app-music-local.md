---
layout: post
title: "music_local：本地音乐库服务（Go + React + Docker）"
date:   2026-4-22
tags: 
  - 软件类
comments: true
author: feng6917
---

本文记录一个本地音乐库服务 `music_local` 的使用与部署方式（本地运行 / Docker / Docker Compose），以及常见问题排查要点。

<!-- more -->

- 项目源码：[feng6917/music_local](https://github.com/feng6917/music_local)

<h2 id="c-1-0" class="mh1">一、介绍</h2>

一个本地音乐库服务：

- **后端**：Go（HTTP API + 可选托管 `web/dist` 静态站点）
- **前端**：React + TypeScript + Vite（构建产物输出到 `web/dist`）
- **部署方式**：本地运行 / Docker 镜像 / Docker Compose（前后端分离，Nginx 同域反代到后端）

<h2 id="c-2-0" class="mh1">二、快速开始（本地运行）</h2>

<h2 id="c-2-1" class="mh2">2.1 启动后端（Go）</h2>

在项目根目录执行：

```powershell
go run ./cmd/server/main.go
```

默认行为：

- **监听地址**：`:8787`
- **数据目录**：`./data`
- **数据库**：`./music.db`
- **前端静态目录**：`./web/dist`（若存在则可由后端托管）
- **CORS**：默认允许 `http://localhost:5173`（配合前端 dev server）

<h2 id="c-2-2" class="mh2">2.2 启动前端开发服务器（Vite）</h2>

在另一个终端：

```powershell
cd .\web
npm install
npm run dev
```

前端 dev server 默认 `http://localhost:5173`，并通过代理把 `/api`、`/health` 转发到后端 `http://127.0.0.1:8787`（见 `web/vite.config.ts`）。

<h2 id="c-3-0" class="mh1">三、配置（环境变量）</h2>

后端通过环境变量配置（见 `internal/config/config.go`）：

- **`MUSIC_ADDR`**：监听地址，默认 `:8787`
- **`MUSIC_DATA_DIR`**：音乐文件扫描根目录，默认 `./data`
- **`MUSIC_DB_PATH`**：SQLite DB 路径，默认 `./music.db`
- **`MUSIC_WEB_DIST`**：前端静态文件目录，默认 `./web/dist`
- **`MUSIC_JWT_SECRET`**：JWT 密钥
  - 未设置时会使用固定的开发默认值并打印 warning
  - **生产环境务必设置为强随机值**
- **`MUSIC_CORS_ORIGIN`**：CORS 允许的 origin，默认 `http://localhost:5173`

PowerShell 示例：

```powershell
$env:MUSIC_ADDR=":8788"
$env:MUSIC_DATA_DIR="D:\Music"
$env:MUSIC_DB_PATH="D:\music_local\music.db"
$env:MUSIC_JWT_SECRET="please-change-me"
go run ./cmd/server/main.go
```

<h2 id="c-4-0" class="mh1">四、常见问题</h2>

<h2 id="c-4-1" class="mh2">4.1 端口被占用（`bind: Only one usage...`）</h2>

这是 Windows 下端口占用导致的。可用以下方式结束占用进程：

```powershell
netstat -ano | Select-String ":8787"
taskkill /PID <PID> /F
```

或直接换端口启动：

```powershell
$env:MUSIC_ADDR=":8788"
go run ./cmd/server/main.go
```

<h2 id="c-5-0" class="mh1">五、构建前端（产出 `web/dist`）</h2>

```powershell
cd .\web
npm ci
npm run build
```

构建完成后，静态资源在 `web/dist`。若你希望后端直接托管静态站点，确保 `MUSIC_WEB_DIST` 指向该目录（默认就是）。

<h2 id="c-6-0" class="mh1">六、Docker</h2>

<h2 id="c-6-1" class="mh2">6.1 构建后端镜像</h2>

在项目根目录：

```powershell
docker build -f Dockerfile.server -t music_local_server:latest .
```

<h2 id="c-6-2" class="mh2">6.2 构建前端镜像（Nginx 托管 + 反代 `/api` 到后端）</h2>

```powershell
docker build -f web/Dockerfile.web -t music_local_web:latest ./web
```

> `music_local_web` 镜像内置 `web/nginx.conf`：将 `/api/`、`/health` 反代到 Compose 服务名 `music_local_server:8787`。

<h2 id="c-6-3" class="mh2">6.3 Docker Compose 一键启动（推荐）</h2>

```powershell
docker compose up -d --build
```

默认端口：

- **API**：`http://localhost:8787`
- **Web**：`http://localhost:8080`

默认持久化：

- `./data` → 容器 `/data`（音乐库目录）
- `./_db` → 容器 `/db`（SQLite 存放目录，文件为 `/db/music.db`）

停止：

```powershell
docker compose down
```

<h2 id="c-7-0" class="mh1">七、文档</h2>

- 构建命令速查：`build.md`

<hr aria-hidden="true" style=" border: 0; height: 2px; background: linear-gradient(90deg, transparent, #1bb75c, transparent); margin: 2rem 0; " />

<!-- 目录容器 -->
<div class="mi1">
    <strong>目录</strong>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
            <li style="list-style-type: none;"><a href="#c-1-0">一、介绍</a></li>
            <li style="list-style-type: none;"><a href="#c-2-0">二、快速开始（本地运行）</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-2-1">2.1 启动后端（Go）</a></li>
                    <li style="list-style-type: none;"><a href="#c-2-2">2.2 启动前端开发服务器（Vite）</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-3-0">三、配置（环境变量）</a></li>
            <li style="list-style-type: none;"><a href="#c-4-0">四、常见问题</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-4-1">4.1 端口被占用（bind）</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-5-0">五、构建前端（产出 web/dist）</a></li>
            <li style="list-style-type: none;"><a href="#c-6-0">六、Docker</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-6-1">6.1 构建后端镜像</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-2">6.2 构建前端镜像</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-3">6.3 Docker Compose 一键启动</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-7-0">七、文档</a></li>
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

本技术手册将持续更新，欢迎提交 Issue 和 Pull Request

