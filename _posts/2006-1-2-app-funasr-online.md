---
layout: post
title: "FunASR Online：语音转文字离线部署完整方案（Docker｜Helm｜2pass｜ws://）"
date:   2026-8-13
tags: 
  - 软件类
comments: true
author: feng6917
---

本文是一份 **FunASR Online（`funasr-runtime-sdk-online-cpu-0.1.13`）语音转文字（语音识别）离线部署手册**，覆盖有网机打包、离线机加载/启动（**Docker 脚本 / 手动命令 / Helm Chart**）、验证、日常运维与参数对照。目标是在 **无外网** 环境跑通实时 2pass 识别服务，客户端通过 **`ws://IP:10096`** 接入。

<!-- more -->

<h2 id="c-1-0" class="mh1">一、部署约定</h2>

| 项 | 值 |
|----|----|
| 有网机打包路径 | `/data_hdd/myz/funasr` |
| 离线机部署路径 | `/data_hdd/funasr` |
| 镜像 | `funasr-runtime-sdk-online-cpu-0.1.13` |
| 容器 | `funasr-online` |
| 网络模式 | `host`（规避 K8s 节点 iptables 冲突；Helm 默认 `hostNetwork: true`） |
| 对外端口 | `10096` |
| SSL | 关闭（`--certfile 0`，使用 `ws://`） |
| 压缩 | 不使用 gzip |
| 部署方式 | Docker 脚本 / 手动命令 / Helm Chart（`garbge/funasr`） |

<h2 id="c-2-0" class="mh1">二、现网模型清单（已确认）</h2>

```text
funasr-runtime-resources/models/
├── damo/
│   ├── punc_ct-transformer_zh-cn-common-vad_realtime-vocab272727-onnx
│   ├── speech_fsmn_vad_zh-cn-16k-common-onnx
│   ├── speech_ngram_lm_zh-cn-ai-wesp-fst
│   ├── speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-online-onnx
│   └── speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-onnx
└── thuduj12/
    └── fst_itn_zh   # 若目录名不同，以 ls 结果为准
```

打包前确认：

```bash
ls /data_hdd/myz/funasr/funasr-runtime-resources/models/thuduj12/
```

<h2 id="c-3-0" class="mh1">三、有网机打包</h2>

在 **k8s-master-157** 执行：

```bash
cd /data_hdd/myz/funasr

# ---------- 1. 导出 Docker 镜像（不压缩）----------
docker save \
  -o funasr-runtime-sdk-online-cpu-0.1.13.tar \
  registry.cn-hangzhou.aliyuncs.com/funasr_repo/funasr:funasr-runtime-sdk-online-cpu-0.1.13

# ---------- 2. 打包模型目录（不压缩）----------
tar -cvf funasr-runtime-resources.tar funasr-runtime-resources

# ---------- 3. 生成 start_funasr.sh ----------
cat > start_funasr.sh << 'EOF'
#!/bin/bash
set -euo pipefail

ROOT="/data_hdd/funasr"
IMG="registry.cn-hangzhou.aliyuncs.com/funasr_repo/funasr:funasr-runtime-sdk-online-cpu-0.1.13"
NAME="funasr-online"
HOST_PORT="10096"
MODELS_DIR="${ROOT}/funasr-runtime-resources/models"

echo "[1/4] 检查镜像..."
if ! docker image inspect "${IMG}" >/dev/null 2>&1; then
  echo "镜像不存在，请先执行: docker load -i ${ROOT}/funasr-runtime-sdk-online-cpu-0.1.13.tar"
  exit 1
fi

echo "[2/4] 检查模型..."
if [ ! -d "${MODELS_DIR}/damo" ]; then
  echo "模型目录不存在: ${MODELS_DIR}"
  echo "请先在 ${ROOT} 下执行: tar -xvf funasr-runtime-resources.tar"
  exit 1
fi

if ss -lntp 2>/dev/null | grep -q ":${HOST_PORT} "; then
  echo "端口 ${HOST_PORT} 已被占用，请先释放后再启动"
  ss -lntp | grep ":${HOST_PORT} "
  exit 1
fi

echo "[3/4] 启动容器..."
docker rm -f "${NAME}" >/dev/null 2>&1 || true
docker run -d --name "${NAME}" \
  --privileged=true \
  --restart=unless-stopped \
  --network host \
  -v "${MODELS_DIR}:/workspace/models" \
  "${IMG}" \
  /bin/bash -c "sleep infinity"

echo "[4/4] 启动 FunASR 2pass 服务..."
docker exec -d "${NAME}" bash -c '
cd /workspace/FunASR/runtime &&
nohup bash run_server_2pass.sh \
  --download-model-dir /workspace/models \
  --vad-dir damo/speech_fsmn_vad_zh-cn-16k-common-onnx \
  --model-dir damo/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-onnx \
  --online-model-dir damo/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-online-onnx \
  --punc-dir damo/punc_ct-transformer_zh-cn-common-vad_realtime-vocab272727-onnx \
  --lm-dir damo/speech_ngram_lm_zh-cn-ai-wesp-fst \
  --itn-dir thuduj12/fst_itn_zh \
  --port 10096 \
  --certfile 0 \
  > /workspace/models/log.txt 2>&1
'

sleep 2
echo "----------------------------------------"
echo "部署完成"
echo "  路径  : ${ROOT}"
echo "  模型  : ${MODELS_DIR}"
echo "  容器名: ${NAME}"
echo "  网络  : host"
echo "  端口  : ${HOST_PORT}"
echo "  SSL   : 关闭"
echo "  地址  : ws://<本机IP>:${HOST_PORT}"
echo "  日志  : docker exec -it ${NAME} tail -f /workspace/models/log.txt"
echo "----------------------------------------"
EOF
chmod +x start_funasr.sh

# ---------- 4. 生成 stop_funasr.sh ----------
cat > stop_funasr.sh << 'EOF'
#!/bin/bash
docker rm -f funasr-online >/dev/null 2>&1 || true
echo "funasr-online 已停止并删除"
EOF
chmod +x stop_funasr.sh

# ---------- 5. 核对产物 ----------
ls -lh \
  funasr-runtime-sdk-online-cpu-0.1.13.tar \
  funasr-runtime-resources.tar \
  start_funasr.sh \
  stop_funasr.sh
```

<h2 id="c-4-0" class="mh1">四、离线机部署</h2>

部署目录：`/data_hdd/funasr`

要求：Linux x86_64、已装 Docker、**无需外网**

<h2 id="c-4-1" class="mh2">4.1 准备与加载</h2>

```bash
mkdir -p /data_hdd/funasr
cd /data_hdd/funasr

# 将离线包放到该目录，结构：
# /data_hdd/funasr/
# ├── funasr-runtime-sdk-online-cpu-0.1.13.tar
# ├── funasr-runtime-resources.tar
# ├── start_funasr.sh
# └── stop_funasr.sh

docker load -i funasr-runtime-sdk-online-cpu-0.1.13.tar
docker images | grep funasr-runtime-sdk-online-cpu-0.1.13

tar -xvf funasr-runtime-resources.tar
ls /data_hdd/funasr/funasr-runtime-resources/models/damo/
ls /data_hdd/funasr/funasr-runtime-resources/models/thuduj12/
```

<h2 id="c-4-2" class="mh2">4.2 启动（推荐脚本）</h2>

```bash
cd /data_hdd/funasr
chmod +x start_funasr.sh stop_funasr.sh
./start_funasr.sh
```

也可手动 `docker run` + `docker exec run_server_2pass.sh`，参数与 `start_funasr.sh` 一致。

<h2 id="c-4-3" class="mh2">4.3 方式 C：Helm 部署（K8s）</h2>

适用于 **Kubernetes + Helm 3** 环境。Chart：`garbge/funasr`，默认 `hostNetwork: true`，监听节点 **10096**。

<h2 id="c-4-3-1" class="mh3">4.3.1 关键配置</h2>

| 项 | 默认值 | 说明 |
|----|--------|------|
| `funasr.deployment.image` | `registry.zhst.com/tool/funasr` | 镜像仓库（可按环境改） |
| `funasr.deployment.imageVersion` | `funasr-runtime-sdk-online-cpu-0.1.13` | 镜像 tag |
| `funasr.deployment.modelsHostPath` | `/data_hdd/funasr/funasr-runtime-resources/models` | 宿主机模型目录（hostPath） |
| `funasr.deployment.hostNetwork` | `true` | 与 Docker `--network host` 等价 |
| `funasr.service.ws.port` | `10096` | Service 端口 |
| `funasr.service.ws.targetPort` | `10096` | 容器监听端口 |

<h2 id="c-4-3-2" class="mh3">4.3.2 安装与验证</h2>

前置：完成 **4.1**；节点已 load 镜像；**10096** 空闲。

```bash
cd /path/to/garbge/funasr
helm install funasr . -n funasr --create-namespace

POD=$(kubectl get pod -n funasr -l k8s-app=funasr-funasr -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n funasr "$POD" -- tail -n 50 /workspace/models/log.txt
# 应出现 listen on port:10096；客户端 ws://<节点IP>:10096
```

<h2 id="c-5-0" class="mh1">五、验证</h2>

```bash
docker ps | grep funasr-online
ss -lntp | grep 10096
docker exec -it funasr-online tail -n 100 /workspace/models/log.txt   # 应出现 listen on port:10096
nc -vz 127.0.0.1 10096
```

客户端地址：`ws://<离线机IP>:10096`（`--certfile 0`，测试加 `--ssl 0`）。

<h2 id="c-6-0" class="mh1">六、日常运维</h2>

```bash
docker exec -it funasr-online tail -f /workspace/models/log.txt
cd /data_hdd/funasr && ./stop_funasr.sh && ./start_funasr.sh   # 重启（勿仅用 docker restart）
./stop_funasr.sh   # 停止
```

Helm：`kubectl rollout restart deployment/funasr-funasr -n funasr`；卸载 `helm uninstall funasr -n funasr`。

热词（可选）：`models/hotwords.txt`，格式 `热词 权重`，启动加 `--hotword /workspace/models/hotwords.txt`。

<h2 id="c-7-0" class="mh1">七、注意事项</h2>

1. **x86_64 CPU** 镜像；须用 **online 2pass**，勿换 `funasr-runtime-sdk-cpu`。
2. **`--network host` + `--port 10096` + `--certfile 0`**，客户端用 `ws://`。
3. 离线包路径 **`/data_hdd/funasr`**；模型本地挂载，无需外网。
4. **`docker restart` 不会自动拉起 2pass**，须 `./start_funasr.sh`。
5. Helm 与 Docker **勿同节点同占 10096**；Pod 须调度到有模型的节点。

<hr aria-hidden="true" style=" border: 0; height: 2px; background: linear-gradient(90deg, transparent, #1bb75c, transparent); margin: 2rem 0; " />

<!-- 目录容器 -->
<div class="mi1">
    <strong>目录</strong>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
            <li style="list-style-type: none;"><a href="#c-1-0">一、部署约定</a></li>
            <li style="list-style-type: none;"><a href="#c-2-0">二、现网模型清单（已确认）</a></li>
            <li style="list-style-type: none;"><a href="#c-3-0">三、有网机打包</a></li>
            <li style="list-style-type: none;"><a href="#c-4-0">四、离线机部署</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-4-1">4.1 准备与加载</a></li>
                    <li style="list-style-type: none;"><a href="#c-4-2">4.2 启动（推荐脚本）</a></li>
                    <li style="list-style-type: none;"><a href="#c-4-3">4.3 Helm 部署（K8s）</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-5-0">五、验证</a></li>
            <li style="list-style-type: none;"><a href="#c-6-0">六、日常运维</a></li>
            <li style="list-style-type: none;"><a href="#c-7-0">七、注意事项</a></li>
        </ul>
</div>

