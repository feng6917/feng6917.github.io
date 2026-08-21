---
layout: post
title: "CosyVoice2：文本转语音离线部署完整方案（Docker Compose｜三 GPU｜流式 TTS）"
date:   2026-8-21
tags: 
  - 软件类
comments: true
author: feng6917
---

本文是一份 **CosyVoice2-0.5B 中文文本转语音（TTS）自托管部署手册**，覆盖有网机准备、离线/内网 master 构建启动、音色注册、验证试听、API 对接与日常运维。目标是在 **GPU 服务器** 上跑通流式语音合成服务，业务链路为 `jionlptime` → `understanding` → 检索 → **TTS 播报**（流式，目标首包 ≤ 500ms）。

<!-- more -->

<h2 id="c-1-0" class="mh1">一、部署约定</h2>

| 项 | 值 |
|----|----|
| 主模型 | CosyVoice2-0.5B（ModelScope `iic/CosyVoice2-0.5B`，约 4.5GB） |
| 备选模型 | CosyVoice-300M-SFT（显存 4–6GB）；≤4GB 可 PoC MeloTTS |
| 镜像 | `chinese-tts:cu118`（CUDA 11.8 + PyTorch cu118） |
| 运行环境 | CentOS 7.6 + Docker ≥20.10 + 驱动 515.x（CUDA 11.7） |
| 部署根目录 | `/data_hdd/cosyvoice` |
| 部署方式 | 宿主机 **Docker Compose** + 三张物理 GPU（非 K8s 工作负载） |
| GPU 实例 | 物理 GPU **4 / 5 / 6** → 端口 **50000 / 50001 / 50002** |
| 试听页 | `serve_demo` → **8080** |
| 输出格式 | PCM 24kHz s16le |

**分工：** 有网本机准备源码/模型/wheel/镜像 → master 导入并 `compose up`。master **禁止** `git clone` 或多线程 ModelScope 下载。

显存 ≥8GB 用 CosyVoice2（需注册音色）；4–6GB 可换 300M-SFT。驱动 515.x 须用 **cu118** 镜像。

<h2 id="c-2-0" class="mh1">二、目录与实例规划</h2>

```text
/data_hdd/cosyvoice/
├── models/CosyVoice2-0.5B/    # 权重（llm.pt ≈1.9GB）
├── models/CosyVoice-ttsfrd/   # 可选，改善数字读音
├── build/CosyVoice/           # 构建源码（必须预置）
├── build/wheels/              # 可选 torch 2.1.2+cu118 wheel
├── prompts/                   # 参考音频
├── scripts/ config/ examples/
├── Dockerfile  docker-compose.yml  .env
└── outputs/  logs/
```

| 容器 | 物理 GPU | 端口 |
|------|----------|------|
| `chinese-tts-gpu4` | 4 | 50000 |
| `chinese-tts-gpu5` | 5 | 50001 |
| `chinese-tts-gpu6` | 6 | 50002 |

单卡 PoC：`docker compose --profile single-gpu up -d tts`。

<h2 id="c-3-0" class="mh1">三、前置检查（master）</h2>

```bash
nvidia-smi                                          # 515.x / CUDA 11.7，可见卡 4/5/6
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu20.04 nvidia-smi
nvidia-smi --query-gpu=index,name,memory.total --format=csv
```

GPU 容器失败时，安装 NVIDIA Container Toolkit 后执行 `systemctl restart docker`。

<h2 id="c-4-0" class="mh1">四、有网机准备</h2>

在仓库 `chinese-tts/` 下执行。`DEPLOY_HOST` 按现场改。

<h2 id="c-4-1" class="mh2">4.1 同步部署文件</h2>

```bash
export DEPLOY_HOST=root@k8s-master-157
export DEPLOY_ROOT=/data_hdd/cosyvoice
bash scripts/sync_to_server.sh
ssh "$DEPLOY_HOST" "cd $DEPLOY_ROOT && sed -i 's/\r$//' scripts/*.sh && chmod +x scripts/*.sh"
```

首次也可手动拷贝：

```bash
scp -r Dockerfile docker-compose.yml .env.example scripts prompts config examples \
  "$DEPLOY_HOST:/data_hdd/cosyvoice/"
```

<h2 id="c-4-2" class="mh2">4.2 CosyVoice 源码</h2>

```bash
bash scripts/prepare_cosyvoice_src.sh
scp -r build/CosyVoice "$DEPLOY_HOST:/data_hdd/cosyvoice/build/"
```

<h2 id="c-4-3" class="mh2">4.3 模型权重</h2>

ModelScope：[iic/CosyVoice2-0.5B](https://www.modelscope.cn/models/iic/CosyVoice2-0.5B)

```bash
bash scripts/wget_models_local.sh CosyVoice2-0.5B
scp -r models/CosyVoice2-0.5B "$DEPLOY_HOST:/data_hdd/cosyvoice/models/"
ssh "$DEPLOY_HOST" "ls -lh /data_hdd/cosyvoice/models/CosyVoice2-0.5B/llm.pt"
```

关键文件含 `llm.pt`（约 1.9GB）等，合计约 **4.5GB**。备选：`bash scripts/download_models_docker.sh CosyVoice2-0.5B`。

<h2 id="c-4-4" class="mh2">4.4 PyTorch wheel（可选）</h2>

```bash
bash scripts/download_pytorch_wheels.sh
scp build/wheels/*.whl "$DEPLOY_HOST:/data_hdd/cosyvoice/build/wheels/"
```

<h2 id="c-4-5" class="mh2">4.5 镜像导出（可选）</h2>

```bash
bash scripts/build_and_export.sh
scp cosyvoice-tts.tar "$DEPLOY_HOST:/data_hdd/cosyvoice/"
ssh "$DEPLOY_HOST" "docker load -i /data_hdd/cosyvoice/cosyvoice-tts.tar"
```

<h2 id="c-5-0" class="mh1">五、master 安装启动</h2>

```bash
cd /data_hdd/cosyvoice
bash scripts/init_dirs.sh                    # 报 $'\r' 则先 sed -i 's/\r$//' scripts/*.sh
cp -n .env.example .env
bash scripts/check_build_ready.sh            # 须有 build/CosyVoice + llm.pt
bash scripts/docker_build_master.sh --no-cache   # 已 load 镜像可跳过
docker compose up -d tts-gpu4 tts-gpu5 tts-gpu6
docker compose logs -f tts-gpu4              # 首启加载 1～3 分钟
```

**.env 要点：** `DATA_ROOT`、`TTS_PORT_GPU4/5/6`、`MODEL_DIR`、`MAX_CONC`。

防火墙（按需）：

```bash
firewall-cmd --add-port=50000-50002/tcp --permanent
firewall-cmd --add-port=8080/tcp --permanent
firewall-cmd --reload
```

<h2 id="c-6-0" class="mh1">六、音色注册</h2>

CosyVoice2 **无开箱 spk**，须写入 `spk2info.pt`。`prompt_text` 必须与参考音频内容一致。

| spk_id | 场景 | prompt_text | WAV |
|--------|------|-------------|-----|
| `zh_female` | 默认播报 | 希望你以后能够做的比我还好呦。 | `build/CosyVoice/asset/zero_shot_prompt.wav` |
| `zh_male_std` | 告警/正式 | 请注意，系统检测到异常情况，请立即查看处理。 | `prompts/zh_male_std.wav` |
| `zh_female_soft` | 引导 | 您好，我来为您介绍一下具体的操作步骤。 | `prompts/zh_female_soft.wav` |
| `zh_female_news` | 新闻列举 | 今日要闻，下面为您播报最新检索结果。 | `prompts/zh_female_news.wav` |
| `zh_male_news` | 公告安保 | 据现场监控显示，相关人员已出现在指定区域。 | `prompts/zh_male_news.wav` |
| `zh_female_young` | 轻提示 | 太好了，已经帮您找到了，快来看一看吧。 | `prompts/zh_female_young.wav` |
| `zh_male_calm` | 长说明 | 接下来我将为您说明每一项配置的详细含义。 | `prompts/zh_male_calm.wav` |
| `zh_child` | 童声可选 | 你好呀，我们一起去看一看吧。 | `prompts/zh_child.wav` |

业务映射见 `config/voices.yaml`（如 `search_result→zh_female`，`alert→zh_male_std`）。

PoC 可从 [阿里云 CosyVoice 音色列表](https://help.aliyun.com/zh/model-studio/cosyvoice-voice-list) 下载试听 MP3（**右键保存音频**），见 **6.3**。

```bash
cd /data_hdd/cosyvoice
bash scripts/download_prompt_assets.sh
bash scripts/register_all_speakers.sh
bash scripts/list_speakers.sh
```

<h2 id="c-6-3" class="mh2">6.3 阿里云音色下载（PoC）</h2>

1. 打开 [音色列表](https://help.aliyun.com/zh/model-studio/cosyvoice-voice-list)，参考 **cosyvoice-v2** 分组。
2. 「音频试听」列 **右键另存为** MP3 → `prompts/{voice}.raw.mp3`。
3. 转 WAV 并注册（`prompt_text` 须与音频内容逐字一致）：

```bash
bash scripts/prepare_prompt_wav.sh longyingjing
bash scripts/register_speaker.sh longyingjing "（听写文本）" prompts/longyingjing.wav
```

常用 `voice` / `spk_id`：`longyingjing`（龙应静）、`longyingxiao`（龙应笑）、`longshuo_v2`（龙硕）、`longanran`（龙安燃）等，完整列表见官方页。

<h2 id="c-7-0" class="mh1">七、验证与试听</h2>

```bash
curl -sf http://127.0.0.1:50000/docs
curl -X POST "http://127.0.0.1:50000/inference_sft" \
  -F "tts_text=你好，语音合成测试。" -F "spk_id=zh_female" -o /tmp/test.pcm
bash scripts/serve_demo.sh   # → http://<ip>:8080/tts-queue-demo.html
```

推荐用 **tts-queue-demo.html** 验证三 GPU 轮询与多音色。服务地址填 `http://<ip>:50000,50001,50002`。

![文本转语音测试页面：连续提交排队播放](../images/2026-8-21/1.png)

<h2 id="c-8-0" class="mh1">八、API 对接</h2>

| 能力 | 方式 |
|------|------|
| OpenAPI | `GET /docs` |
| SFT 合成 | `POST /inference_sft`（form：`tts_text`、`spk_id`）→ PCM 24kHz |
| 双工流式 | `ws://<host>:50000/ws/bistream` |
| 多卡 | 业务轮询 50000–50002 |

WebSocket 双工流式示例：

```text
→ {"type":"start","spk_id":"zh_female"}
→ {"type":"text","chunk":"你好，"}
→ {"type":"end"}
← binary PCM
← {"type":"done"}
```

<h2 id="c-9-0" class="mh1">九、日常运维与常见问题</h2>

```bash
cd /data_hdd/cosyvoice
docker compose ps
docker compose logs -f tts-gpu4
docker compose restart tts-gpu4 tts-gpu5 tts-gpu6
```

| 现象 | 处理 |
|------|------|
| `$'\r'` 脚本报错 | `sed -i 's/\r$//' scripts/*.sh` |
| build/pip 线程失败 | 本机 `build_and_export.sh` + `docker load` |
| 驱动与 CUDA 不匹配 | 用 cu118 镜像 |
| 合成 OOM | 降 `MAX_CONC` 或换 300M-SFT |
| 音色不像 | `prompt_text` 与 WAV 须逐字一致 |
| 8080/5000x 不通 | 检查 firewall 与服务地址 |

参考：[CosyVoice](https://github.com/FunAudioLLM/CosyVoice) · [CosyVoice2-0.5B](https://www.modelscope.cn/models/iic/CosyVoice2-0.5B) · [阿里云音色列表](https://help.aliyun.com/zh/model-studio/cosyvoice-voice-list)

<hr aria-hidden="true" style=" border: 0; height: 2px; background: linear-gradient(90deg, transparent, #1bb75c, transparent); margin: 2rem 0; " />

<!-- 目录容器 -->
<div class="mi1">
    <strong>目录</strong>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
            <li style="list-style-type: none;"><a href="#c-1-0">一、部署约定</a></li>
            <li style="list-style-type: none;"><a href="#c-2-0">二、目录与实例规划</a></li>
            <li style="list-style-type: none;"><a href="#c-3-0">三、前置检查</a></li>
            <li style="list-style-type: none;"><a href="#c-4-0">四、有网机准备</a></li>
            <li style="list-style-type: none;"><a href="#c-5-0">五、master 安装启动</a></li>
            <li style="list-style-type: none;"><a href="#c-6-0">六、音色注册</a></li>
            <li style="list-style-type: none;"><a href="#c-7-0">七、验证与试听</a></li>
            <li style="list-style-type: none;"><a href="#c-8-0">八、API 对接</a></li>
            <li style="list-style-type: none;"><a href="#c-9-0">九、日常运维与常见问题</a></li>
        </ul>
</div>
