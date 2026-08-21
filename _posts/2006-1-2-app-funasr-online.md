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

<h2 id="c-3-1" class="mh2">3.1 离线安装包清单</h2>

| 文件 | 说明 | 必须 |
|------|------|------|
| `funasr-runtime-sdk-online-cpu-0.1.13.tar` | Docker 镜像 | 是 |
| `funasr-runtime-resources.tar` | 模型 | 是 |
| `start_funasr.sh` | 一键启动 | 是 |
| `stop_funasr.sh` | 停止清理 | 建议 |
| `funasr_samples.tar.gz` | 客户端样例 | 可选 |

拷贝示例：

```bash
mkdir -p /mnt/usb/funasr-offline
cp -a \
  funasr-runtime-sdk-online-cpu-0.1.13.tar \
  funasr-runtime-resources.tar \
  start_funasr.sh \
  stop_funasr.sh \
  /mnt/usb/funasr-offline/
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

<h2 id="c-4-2" class="mh2">4.2 方式 A：脚本启动（推荐）</h2>

```bash
cd /data_hdd/funasr
chmod +x start_funasr.sh stop_funasr.sh
./start_funasr.sh
```

<h2 id="c-4-3" class="mh2">4.3 方式 B：手动命令启动（与脚本等价）</h2>

```bash
cd /data_hdd/funasr

# ---------- 1. 清理旧容器 ----------
docker rm -f funasr-online 2>/dev/null || true

# ---------- 2. 检查端口 ----------
ss -lntp | grep 10096 || echo "端口 10096 空闲"

# ---------- 3. 启动容器 ----------
docker run -d --name funasr-online \
  --privileged=true \
  --restart=unless-stopped \
  --network host \
  -v /data_hdd/funasr/funasr-runtime-resources/models:/workspace/models \
  registry.cn-hangzhou.aliyuncs.com/funasr_repo/funasr:funasr-runtime-sdk-online-cpu-0.1.13 \
  /bin/bash -c "sleep infinity"

# ---------- 4. 启动 FunASR 2pass 服务 ----------
docker exec -d funasr-online bash -c '
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

# ---------- 5. 查看启动日志（模型加载约数十秒）----------
docker exec -it funasr-online tail -f /workspace/models/log.txt
# 看到 listen on port:10096 后 Ctrl+C 退出
```

挂载关系：

```text
/data_hdd/funasr/funasr-runtime-resources/models  ->  /workspace/models
```

说明：

- `--network host`：直接监听宿主机端口，避免 `-p` 触发 iptables 报错
- `--port 10096`：服务监听 **10096**
- `--certfile 0`：关闭 SSL，客户端使用 **`ws://`**

<h2 id="c-4-4" class="mh2">4.4 方式 C：Helm 部署（K8s）</h2>

适用于已具备 **Kubernetes + Helm 3** 的离线/内网集群。Chart 位于仓库 **`garbge/funasr`**，与 Docker 方案共用同一套模型目录与 2pass 启动参数，默认 **`hostNetwork: true`** 直接监听节点 `10096` 端口。

<h2 id="c-4-4-1" class="mh3">4.4.1 Chart 结构</h2>

```text
garbge/funasr/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── deployment.yaml
    └── service.yaml
```

<h2 id="c-4-4-2" class="mh3">4.4.2 关键配置（values.yaml）</h2>

| 项 | 默认值 | 说明 |
|----|--------|------|
| `funasr.deployment.image` | `registry.zhst.com/tool/funasr` | 镜像仓库（可按环境改） |
| `funasr.deployment.imageVersion` | `funasr-runtime-sdk-online-cpu-0.1.13` | 镜像 tag |
| `funasr.deployment.modelsHostPath` | `/data_hdd/funasr/funasr-runtime-resources/models` | 宿主机模型目录（hostPath） |
| `funasr.deployment.hostNetwork` | `true` | 与 Docker `--network host` 等价 |
| `funasr.service.ws.port` | `10096` | Service 端口 |
| `funasr.service.ws.targetPort` | `10096` | 容器监听端口 |

默认 `values.yaml` 片段：

```yaml
funasr:
  deployment:
    replicas: 1
    image: registry.zhst.com/tool/funasr
    imageVersion: funasr-runtime-sdk-online-cpu-0.1.13
    modelsHostPath: /data_hdd/funasr/funasr-runtime-resources/models
    hostNetwork: true
  service:
    type: ClusterIP
    ws:
      port: 10096
      targetPort: 10096
```

<h2 id="c-4-4-3" class="mh3">4.4.3 前置条件</h2>

1. 完成 **4.1 准备与加载**：模型已解压到 `modelsHostPath`，且存在 `damo/`、`thuduj12/`。
2. 集群节点能拉到 Chart 中配置的镜像。若仍使用阿里云离线包镜像，可在节点执行：

```bash
docker load -i /data_hdd/funasr/funasr-runtime-sdk-online-cpu-0.1.13.tar

# 按 values.yaml 中的 image:tag 重新打 tag（示例）
docker tag \
  registry.cn-hangzhou.aliyuncs.com/funasr_repo/funasr:funasr-runtime-sdk-online-cpu-0.1.13 \
  registry.zhst.com/tool/funasr:funasr-runtime-sdk-online-cpu-0.1.13
```

3. 部署节点上 **10096 端口未被占用**（`hostNetwork` 模式下与 Docker 方案相同）。

<h2 id="c-4-4-4" class="mh3">4.4.4 安装与升级</h2>

```bash
# 进入 Chart 目录（路径按实际仓库位置调整）
cd /path/to/feng6917.github.io/garbge/funasr

# 首次安装
helm install funasr . \
  --namespace funasr \
  --create-namespace

# 修改 values 后升级
helm upgrade funasr . \
  --namespace funasr

# 自定义模型路径或镜像（无需改文件）
helm upgrade funasr . \
  --namespace funasr \
  --set funasr.deployment.modelsHostPath=/data_hdd/funasr/funasr-runtime-resources/models \
  --set funasr.deployment.image=registry.cn-hangzhou.aliyuncs.com/funasr_repo/funasr \
  --set funasr.deployment.imageVersion=funasr-runtime-sdk-online-cpu-0.1.13
```

Deployment 启动逻辑（与 Docker `run_server_2pass.sh` 参数一致）：

- 校验 `/workspace/models/damo` 是否存在
- 后台执行 `run_server_2pass.sh`，日志写入 `/workspace/models/log.txt`
- 容器通过 `sleep infinity` 常驻（避免启动脚本退出导致 Pod 重启）

<h2 id="c-4-4-5" class="mh3">4.4.5 Helm 部署验证</h2>

```bash
kubectl get pod,svc -n funasr -l k8s-app=funasr-funasr

# 查看 Pod 名
POD=$(kubectl get pod -n funasr -l k8s-app=funasr-funasr -o jsonpath='{.items[0].metadata.name}')

# 服务日志（应出现 listen on port:10096）
kubectl exec -n funasr "$POD" -- tail -n 50 /workspace/models/log.txt

# 节点端口（hostNetwork 下为 Pod 所在节点 IP）
ss -lntp | grep 10096
nc -vz <节点IP> 10096
```

业务连接地址（与 Docker 方案相同）：

```text
ws://<Pod所在节点IP>:10096
```

<h2 id="c-5-0" class="mh1">五、验证</h2>

```bash
# 容器状态
docker ps | grep funasr-online

# 端口监听
ss -lntp | grep 10096

# 服务日志
docker exec -it funasr-online tail -n 100 /workspace/models/log.txt

# 进程参数
docker exec funasr-online bash -c 'ps -ef | grep -v grep | grep -E "run_server|funasr|wss"'

# TCP 连通
nc -vz 127.0.0.1 10096

# 官方客户端（ssl=0）
docker exec -it funasr-online bash -c '
cd /workspace/FunASR/runtime/python/websocket &&
python3 funasr_wss_client.py \
  --host 127.0.0.1 \
  --port 10096 \
  --mode 2pass \
  --ssl 0 \
  --audio_in /workspace/FunASR/runtime/python/html/static/audio/asr_example.wav
'
```

日志应出现：

```text
listen on port:10096
```

进程应包含：`--port 10096 --certfile 0`

业务连接地址：

```text
ws://<离线机IP>:10096
```

<h2 id="c-6-0" class="mh1">六、日常运维</h2>

<h2 id="c-6-1" class="mh2">6.1 看日志</h2>

```bash
docker exec -it funasr-online tail -f /workspace/models/log.txt
```

<h2 id="c-6-2" class="mh2">6.2 仅重启 FunASR 进程（不重建容器）</h2>

```bash
# 杀掉服务进程
docker exec funasr-online bash -c 'pkill -f funasr-wss-server-2pass || true'
sleep 1

# 重新拉起
docker exec -d funasr-online bash -c '
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

docker exec -it funasr-online tail -f /workspace/models/log.txt
```

<h2 id="c-6-3" class="mh2">6.3 整容器重建启动</h2>

脚本方式：

```bash
cd /data_hdd/funasr
./stop_funasr.sh
./start_funasr.sh
```

手动方式：

```bash
docker rm -f funasr-online 2>/dev/null || true

docker run -d --name funasr-online \
  --privileged=true \
  --restart=unless-stopped \
  --network host \
  -v /data_hdd/funasr/funasr-runtime-resources/models:/workspace/models \
  registry.cn-hangzhou.aliyuncs.com/funasr_repo/funasr:funasr-runtime-sdk-online-cpu-0.1.13 \
  /bin/bash -c "sleep infinity"

docker exec -d funasr-online bash -c '
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
```

<h2 id="c-6-4" class="mh2">6.4 停止</h2>

脚本：

```bash
cd /data_hdd/funasr
./stop_funasr.sh
```

手动：

```bash
docker rm -f funasr-online
```

<h2 id="c-6-5" class="mh2">6.5 进入容器排查</h2>

```bash
docker exec -it funasr-online bash
ls /workspace/models/damo/
ps -ef | grep funasr
tail -n 100 /workspace/models/log.txt
```

热词（可选）：

```text
/data_hdd/funasr/funasr-runtime-resources/models/hotwords.txt
```

格式：`热词 权重`（如 `阿里巴巴 20`），启动命令加：

```bash
--hotword /workspace/models/hotwords.txt
```

<h2 id="c-6-6" class="mh2">6.6 Helm 运维</h2>

```bash
POD=$(kubectl get pod -n funasr -l k8s-app=funasr-funasr -o jsonpath='{.items[0].metadata.name}')

# 实时日志
kubectl exec -n funasr "$POD" -- tail -f /workspace/models/log.txt

# 仅重启 Pod（会重新执行 run_server_2pass.sh）
kubectl rollout restart deployment/funasr-funasr -n funasr
kubectl rollout status deployment/funasr-funasr -n funasr

# 卸载
helm uninstall funasr -n funasr
```

说明：

- Chart 内 **未** 单独拆出「只杀 2pass 进程」步骤；日常重启推荐 `kubectl rollout restart`。
- `hostNetwork: true` 时，Service 主要用于集群内发现；实际 WebSocket 连 **节点 IP:10096**。
- 修改模型路径、端口或镜像后，执行 `helm upgrade` 并观察 Pod 重建是否成功。

<h2 id="c-7-0" class="mh1">七、路径与参数对照</h2>

| 用途 | 路径/值 |
|------|---------|
| `ROOT` | `/data_hdd/funasr` |
| `MODELS_DIR` | `/data_hdd/funasr/funasr-runtime-resources/models` |
| 容器内模型 | `/workspace/models` |
| 网络 | `host` |
| 端口 | `10096` |
| SSL | 关闭（`--certfile 0`） |
| 客户端协议 | `ws://` |
| Helm Chart | `garbge/funasr` |
| Helm Release | `funasr`（namespace: `funasr`） |
| K8s Deployment | `funasr-funasr` |

| 参数 | 值 |
|------|----|
| `--download-model-dir` | `/workspace/models` |
| `--vad-dir` | `damo/speech_fsmn_vad_zh-cn-16k-common-onnx` |
| `--model-dir` | `damo/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-onnx` |
| `--online-model-dir` | `damo/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-online-onnx` |
| `--punc-dir` | `damo/punc_ct-transformer_zh-cn-common-vad_realtime-vocab272727-onnx` |
| `--lm-dir` | `damo/speech_ngram_lm_zh-cn-ai-wesp-fst` |
| `--itn-dir` | `thuduj12/fst_itn_zh` |
| `--port` | `10096` |
| `--certfile` | `0` |

<h2 id="c-8-0" class="mh1">八、注意事项</h2>

1. **架构**：x86_64 CPU 镜像，ARM 不可用。
2. **镜像类型**：online 实时 2pass，不要换成 `funasr-runtime-sdk-cpu`。
3. **host + 端口**：必须在 `run_server_2pass.sh` 中显式 `--port 10096`。
4. **协议**：关 SSL 后用 `ws://IP:10096`；客户端测试加 `--ssl 0`。
5. **ROOT 写死**：包必须放在 `/data_hdd/funasr`。
6. **无需外网**：模型本地挂载，不访问 ModelScope。
7. **保留 `--privileged=true`**。
8. **磁盘**：镜像+模型未压缩通常 10GB+。
9. **ITN 目录名**：若不是 `fst_itn_zh`，改启动命令中 `--itn-dir`。
10. **不要用 `curl https://` 测 WebSocket**；用 `nc` / 官方 `funasr_wss_client.py`。
11. **`docker restart funasr-online` 后不会自动拉起 2pass 进程**，需再执行一次第六节的「启动 FunASR 2pass 服务」命令，或直接 `./start_funasr.sh`。
12. **Helm 方案**：模型仍走宿主机 `hostPath`，不依赖 PV；须保证 **Pod 调度到有模型的节点**，且该节点已具备镜像。
13. **Helm 与 Docker 勿同节点同端口并存**：均占用 `10096`，二选一或改端口。

<h2 id="c-9-0" class="mh1">九、流程速查</h2>

```text
有网机 (/data_hdd/myz/funasr)
  → docker save 镜像.tar
  → tar 模型.tar
  → 生成 start/stop 脚本
  → 拷贝到介质

离线机 (/data_hdd/funasr)
  → docker load
  → tar -xvf 模型
  → 任选一种启动方式：
     A) ./start_funasr.sh
     B) docker run + docker exec run_server_2pass.sh
     C) helm install funasr garbge/funasr -n funasr --create-namespace
  → 客户端连 ws://IP:10096
```

<hr aria-hidden="true" style=" border: 0; height: 2px; background: linear-gradient(90deg, transparent, #1bb75c, transparent); margin: 2rem 0; " />

<!-- 目录容器 -->
<div class="mi1">
    <strong>目录</strong>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
            <li style="list-style-type: none;"><a href="#c-1-0">一、部署约定</a></li>
            <li style="list-style-type: none;"><a href="#c-2-0">二、现网模型清单（已确认）</a></li>
            <li style="list-style-type: none;"><a href="#c-3-0">三、有网机打包</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-3-1">3.1 离线安装包清单</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-4-0">四、离线机部署</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-4-1">4.1 准备与加载</a></li>
                    <li style="list-style-type: none;"><a href="#c-4-2">4.2 方式 A：脚本启动（推荐）</a></li>
                    <li style="list-style-type: none;"><a href="#c-4-3">4.3 方式 B：手动命令启动（与脚本等价）</a></li>
                    <li style="list-style-type: none;"><a href="#c-4-4">4.4 方式 C：Helm 部署（K8s）</a></li>
                    <ul style="padding-left: 15px; list-style-type: none;">
                        <li style="list-style-type: none;"><a href="#c-4-4-1">4.4.1 Chart 结构</a></li>
                        <li style="list-style-type: none;"><a href="#c-4-4-2">4.4.2 关键配置（values.yaml）</a></li>
                        <li style="list-style-type: none;"><a href="#c-4-4-3">4.4.3 前置条件</a></li>
                        <li style="list-style-type: none;"><a href="#c-4-4-4">4.4.4 安装与升级</a></li>
                        <li style="list-style-type: none;"><a href="#c-4-4-5">4.4.5 Helm 部署验证</a></li>
                    </ul>
                </ul>
            <li style="list-style-type: none;"><a href="#c-5-0">五、验证</a></li>
            <li style="list-style-type: none;"><a href="#c-6-0">六、日常运维</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-6-1">6.1 看日志</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-2">6.2 仅重启 FunASR 进程（不重建容器）</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-3">6.3 整容器重建启动</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-4">6.4 停止</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-5">6.5 进入容器排查</a></li>
                    <li style="list-style-type: none;"><a href="#c-6-6">6.6 Helm 运维</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-7-0">七、路径与参数对照</a></li>
            <li style="list-style-type: none;"><a href="#c-8-0">八、注意事项</a></li>
            <li style="list-style-type: none;"><a href="#c-9-0">九、流程速查</a></li>
        </ul>
</div>

