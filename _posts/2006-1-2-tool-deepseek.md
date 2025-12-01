---
layout: post
title: "CentOS 系统离线部署 Ollama + DeepSeek 指南"
date:   2025-2-13
tags: 
  - 工具类
comments: true
author: feng6917
---

CentOS离线安装Ollama并部署DeepSeek模型，包含环境检查、路径配置、模型导入和测试验证完整流程。
<!-- more -->

<h2 id="c-1-0" class="mh1">一、环境检查与准备工作</h2>

### 1. 查看服务器 CPU 型号

```bash
# 查看服务器 CPU 架构
lscpu | grep Architecture
# 或直接查看 CPU 信息
lscpu
```

**CPU 型号与安装包对应关系：**

- `x86_64` CPU → 下载 `ollama-linux-amd64`
- `aarch64` 或 `arm64` CPU → 下载 `ollama-linux-arm64`

### 2. 下载离线安装包

**安装包下载地址：**

- Ollama 发布页：<https://github.com/ollama/ollama/releases/>
- DeepSeek 模型：<https://hf-mirror.com/bartowski>

**版本说明：**

- Ollama 版本：0.5.7（建议使用最新版本）
- DeepSeek 模型：DeepSeek-R1-Distill-Llama-8B-Q4_K_M
- 下载加速：可使用 <https://get-github.hexj.org/> 或迅雷加速

---

<h2 id="c-2-0" class="mh1">二、离线安装 Ollama</h2>

### 1. 传输文件到服务器

```bash
# 将文件从本地传输到服务器
scp ollama-linux-amd64.tgz root@10.0.0.7:/data_hdd/ollama/
scp ollama-linux-amd64-rocm.tgz root@10.0.0.7:/data_hdd/ollama/
scp install_ollama.sh root@10.0.0.7:/data_hdd/ollama/
```

### 2. 安装 Ollama

```bash
# 进入安装目录
cd /data_hdd/ollama

# 赋予安装脚本执行权限
chmod +x install_ollama.sh

# 执行安装脚本
./install_ollama.sh
```

**安装脚本调整内容：**

- 将在线下载改为使用本地文件 <https://ollama.com/install.sh> -> ../template/install_ollama.sh
- 在服务配置中添加：`Environment="OLLAMA_HOST=0.0.0.0"`

---

<h2 id="c-3-0" class="mh1">三、配置模型存储路径</h2>

### 1. 停止 Ollama 服务

```bash
sudo systemctl stop ollama
sudo systemctl disable ollama.service
```

### 2. 创建新的模型存储目录

```bash
# 创建目录
sudo mkdir -p /data_hdd/ollama/models

# 设置权限
sudo chown -R ollama:ollama /data_hdd/ollama/models
sudo chmod -R 775 /data_hdd/ollama/models
```

### 3. 修改服务配置文件

```bash
sudo vi /etc/systemd/system/ollama.service
```

**修改后的配置文件内容：**

```ini
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
ExecStart=/usr/local/bin/ollama serve
User=root
Group=root
Restart=always
RestartSec=3
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="OLLAMA_MODELS=/data_hdd/ollama/models"

[Install]
WantedBy=default.target
```

### 4. 重启服务并验证

```bash
# 重载服务配置
sudo systemctl daemon-reload

# 重启 Ollama 服务
sudo systemctl restart ollama.service

# 查看服务状态
sudo systemctl status ollama

# 验证路径更改
ls -la /data_hdd/ollama/models/
# 应能看到 blobs 和 manifests 文件夹
```

---

<h2 id="c-4-0" class="mh1">四、DeepSeek 模型选择与部署</h2>

### 1. 不同尺寸模型对比

| 模型版本 | 内存要求 | 适用场景 |
|---------|---------|---------|
| DeepSeek-R1-Distill-Llama-8B | 8GB+ | 个人使用、轻量任务 |
| DeepSeek-R1-Distill-Qwen-14B | 16GB+ | 中等复杂度任务 |
| DeepSeek-R1-Distill-Qwen-32B | 32GB+ | 企业级应用、复杂推理 |
| DeepSeek-R1-Distill-Qwen-70B | 64GB+ | 专业研究、高级任务 |

### 2. 下载并导入模型

```bash
# 下载 32B 模型示例（根据实际情况选择）
wget https://hf-mirror.com/bartowski/DeepSeek-R1-Distill-Qwen-32B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-32B-Q8_0.gguf

# 传输到服务器
scp DeepSeek-R1-Distill-Qwen-32B-Q8_0.gguf root@10.0.0.7:/data_hdd/ollama/source/

# 创建 Modelfile
cat > Modelfile << EOF
FROM /data_hdd/ollama/source/DeepSeek-R1-Distill-Qwen-32B-Q8_0.gguf
TEMPLATE """{{ .Prompt }}"""
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 4096
EOF

# 导入模型
ollama create deepseek-r1:32b -f Modelfile
```

---

<h2 id="c-5-0" class="mh1">五、测试模型功能</h2>

### 1. 基础对话测试

```bash
# 启动对话
ollama run deepseek-r1:32b

# 测试问题示例
# 如何用手机拍摄美食照片？
# 如何用手机拍摄美食照片，分步骤说明？
```

### 2. 代码生成测试

**测试用例：Python 网页图片下载工具**

```
[语言] Python
[功能] 自动下载网页图片
[要求]
- 处理SSL证书错误
- 显示下载进度
- 保存到指定文件夹
```

---

<h2 id="c-6-0" class="mh1">六、可选组件安装</h2>

### 1. AnythingLLM 部署（可选）

```bash
# 使用国内镜像源
docker pull swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/mintplexlabs/anythingllm:latest

# 运行容器
docker run -d \
  --name anythingllm \
  -p 3000:3000 \
  -v /data/anythingllm:/app/server/storage \
  swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/mintplexlabs/anythingllm:latest
```

### 2. 问题解决方案

- **Docker 线程错误**：调整系统参数或使用 Docker 配置优化
- **内存不足**：根据实际硬件选择合适尺寸的模型
- **网络问题**：使用镜像源或代理加速下载

---

<h2 id="c-7-0" class="mh1">七、卸载流程</h2>

### 1. 停止并删除服务

```bash
# 停止服务
sudo systemctl stop ollama
sudo systemctl disable ollama

# 删除服务文件
sudo rm /etc/systemd/system/ollama.service
```

### 2. 删除二进制文件

```bash
# 查找并删除 ollama 二进制文件
sudo rm $(which ollama)
```

### 3. 清理相关文件和用户

```bash
# 删除模型文件
sudo rm -r /usr/share/ollama

# 删除数据目录（谨慎操作）
sudo rm -r /data_hdd/ollama/models

# 删除用户和用户组
sudo userdel ollama
sudo groupdel ollama
```

---

**提示：** 部署前请确保服务器有足够的磁盘空间和内存，建议至少预留模型大小 1.5 倍的空间用于运行缓存。

<h2 id="c-8-0" class="mh1">八、参考资源</h2>

<h3 id="c-8-1" class="mh2">8.1 相关技术链接</h3>

- 学习资源
  - [deepseek离线部署](https://blog.csdn.net/linuxxx110/article/details/145440984)
  - [linux离线部署Ollama+Deepseek r1+open webui](https://deepseek.csdn.net/67ab1c2579aaf67875cb9624.html)
  - [deepseek离线部署](https://blog.csdn.net/linuxxx110/article/details/145440984)
  - [curl http:宿主机IP:11434提示访问拒绝](https://www.cnblogs.com/boris2012/p/18233286)
  - [linux下ollama更换模型路径](https://blog.csdn.net/hooksten/article/details/145418987)
  - [如何卸载ollama](https://blog.csdn.net/LJX_ahut/article/details/139424004)
  - [DeepSeek 实用集成](https://github.com/deepseek-ai/awesome-deepseek-integration/blob/main/README_cn.md)
  - [ollama协议文档](https://github.com/ollama/ollama/blob/main/docs/api.md#generate-embeddings)

<hr aria-hidden="true" style=" border: 0; height: 2px; background: linear-gradient(90deg, transparent, #1bb75c, transparent); margin: 2rem 0; " />

<!-- 目录容器 -->
<div class="mi1">
    <strong>目录</strong>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
            <li style="list-style-type: none;"><a href="#c-1-0">一、环境检查与准备工作</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-2-0">二、离线安装 Ollama</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-3-0">三、配置模型存储路径</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-4-0">四、DeepSeek 模型选择与部署</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-5-0">五、测试模型功能</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-6-0">六、可选组件安装</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-7-0">七、卸载流程</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-8-0">八、参考资源</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-8-1">8.1 相关技术链接</a></li>
                </ul>
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
