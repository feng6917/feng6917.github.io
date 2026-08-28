---
layout: post
title: "FG-CLIP2-So400m：1152 维图文向量离线部署完整方案（Docker｜FastAPI｜8200）"
date:   2026-8-28
tags: 
  - 软件类
comments: true
author: feng6917
---

本文是一份 **FG-CLIP2-So400m（1152 维）离线镜像构建与 HTTP 服务部署手册**，覆盖离线包准备、Docker 镜像构建、FastAPI 常驻服务、HTTP 协议、验证联调、踩坑记录与热更新运维。目标是在 **CentOS 7.6 + NVIDIA 驱动 515.x（CUDA 11.7）+ Tesla T4** 上构建 `fgclip2:cu117-1152` 镜像，在 `10.0.0.157` 提供 **8200** 端口图文向量 HTTP 服务。

<!-- more -->

<h2 id="c-1-0" class="mh1">一、架构概览</h2>

| 项 | 值 |
|----|----|
| 适用环境 | CentOS 7.6 / NVIDIA 驱动 515.76（CUDA 11.7）/ Docker 19.03 / Tesla T4 |
| 部署主机 | `10.0.0.157`（k8s-master-157） |
| 镜像 | `fgclip2:cu117-1152` |
| 模型 | `360zhinao/fg-clip2-so400m`（向量维度 **1152**） |
| 服务端口 | **8200**（多卡扩展 8201～8203） |
| 部署根目录 | `/data_hdd/fgclip2` |

```
模型权重 (/models)
    ↓
embed_server.py（FastAPI，模型常驻 GPU）
    ↓
POST /api/v1/embed/text   → 1152 维文本向量
POST /api/v1/embed/image  → 1152 维图片向量
    ↓
embed_test（Go 联调）
```

| 组件 | 版本 |
|------|------|
| 基础镜像 | `nvidia/cuda:11.7.1-cudnn8-runtime-ubuntu20.04` |
| Python | 3.10（Miniconda，不装 conda PyTorch） |
| torch | **2.2.2+cu118**（pip 离线 wheel + 11 个 nvidia-cu11 包） |
| torchvision | **0.17.2+cu118** |
| numpy | **1.26.4** |
| pillow | **10.4.0** |
| transformers | **4.57.6** |
| FastAPI / uvicorn | 离线 wheel |
| 向量维度 | **1152**（So400m） |

> **说明**：宿主机驱动最高 CUDA 11.7，容器 base 用 11.7；PyTorch 使用 **cu118 pip wheel**（向后兼容 11.7 驱动），**不要**用 cu12 或 CUDA 11.8 容器 base。


<h2 id="c-2-0" class="mh1">二、目录结构（157 服务器）</h2>

```text
/data_hdd/fgclip2/
├── build/
│   ├── Dockerfile
│   ├── embed_server.py
│   └── offline/
│       ├── miniconda.sh
│       ├── torch-wheels/          # torch + nvidia + torchvision + sympy 等
│       └── wheels/                # numpy/transformers/fastapi 等
├── models/
│   └── fg-clip2-so400m/           # 9 个模型文件
└── fgclip2-cu117-1152.tar.gz      # 可选：镜像备份
```

<h2 id="c-2-1" class="mh2">2.1 模型文件（9 个，缺一不可）</h2>

```text
config.json
configuration_fgclip2.py
modeling_fgclip2.py
preprocessor_config.json
special_tokens_map.json
tokenizer_config.json
tokenizer.model
tokenizer.json
model.safetensors          # 约 4.3GB
```

ModelScope 下载根路径：

```text
https://modelscope.cn/api/v1/models/360zhinao/fg-clip2-so400m/repo?Revision=master&FilePath=
```


<h2 id="c-3-0" class="mh1">三、离线包准备</h2>

<h2 id="c-3-1" class="mh2">3.1 Miniconda</h2>

```bash
cd /data_hdd/fgclip2/build/offline
wget -c -O miniconda.sh https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
# 备选：中科大 https://mirrors.ustc.edu.cn/anaconda/miniconda/Miniconda3-latest-Linux-x86_64.sh
```

<h2 id="c-3-2" class="mh2">3.2 torch-wheels（约 2.5～3GB）</h2>

```bash
mkdir -p /data_hdd/fgclip2/build/offline/torch-wheels
cd /data_hdd/fgclip2/build/offline/torch-wheels
BASE="https://download.pytorch.org/whl/cu118"

wget -c "${BASE}/torch-2.2.2%2Bcu118-cp310-cp310-linux_x86_64.whl"
wget -c "${BASE}/torchvision-0.17.2%2Bcu118-cp310-cp310-linux_x86_64.whl"
wget -c "${BASE}/nvidia_cublas_cu11-11.11.3.6-py3-none-manylinux1_x86_64.whl"
wget -c "${BASE}/nvidia_cuda_cupti_cu11-11.8.87-py3-none-manylinux1_x86_64.whl"
wget -c "${BASE}/nvidia_cuda_nvrtc_cu11-11.8.89-py3-none-manylinux1_x86_64.whl"
wget -c "${BASE}/nvidia_cuda_runtime_cu11-11.8.89-py3-none-manylinux1_x86_64.whl"
wget -c "${BASE}/nvidia_cudnn_cu11-8.7.0.84-py3-none-manylinux1_x86_64.whl"
wget -c "${BASE}/nvidia_cufft_cu11-10.9.0.58-py3-none-manylinux1_x86_64.whl"
wget -c "${BASE}/nvidia_curand_cu11-10.3.0.86-py3-none-manylinux1_x86_64.whl"
wget -c "${BASE}/nvidia_cusolver_cu11-11.4.1.48-py3-none-manylinux1_x86_64.whl"
wget -c "${BASE}/nvidia_cusparse_cu11-11.7.5.86-py3-none-manylinux1_x86_64.whl"
wget -c "${BASE}/nvidia_nccl_cu11-2.19.3-py3-none-manylinux1_x86_64.whl"
wget -c "${BASE}/nvidia_nvtx_cu11-11.8.86-py3-none-manylinux1_x86_64.whl"
```

**triton 2.2.0**：推理不必装；Dockerfile 先装 nvidia 再 `--no-deps` 装 torch 即可。

<h2 id="c-3-3" class="mh2">3.3 wheels（transformers + HTTP 依赖）</h2>

**推荐本机 Windows `pip download` 后 scp**，或 157 上用 Docker 下载（需加线程限制参数，见踩坑表）。

必须包含：

- `numpy==1.26.4`、`pillow==10.4.0`
- `transformers==4.57.6`、`safetensors`、`sentencepiece`、`protobuf`、`tokenizers`、`huggingface-hub`、`regex`、`pyyaml` 等
- `fastapi`、`uvicorn`、`python-multipart`、`pydantic`、`pydantic-core`、`starlette`、`annotated-types`、`anyio`、`h11`、`click`

FastAPI 生态 **不要用清华 `/packages/` 直链 wget**（403），用官方 PyPI：

```bash
PY="https://files.pythonhosted.org/packages"
cd /data_hdd/fgclip2/build/offline/wheels
wget -c "${PY}/52/b3/7e4df40e585df024fac2f80d1a2d579c854ac37109675db2b0cc22c0bb9e/fastapi-0.115.6-py3-none-any.whl"
wget -c "${PY}/61/14/33a3a1352cfa71812a3a21e8c9bfb83f60b0011f5e36f2b1399d51928209/uvicorn-0.34.0-py3-none-any.whl"
wget -c "${PY}/45/58/38b5afbc1a800eeea951b9285d3912613f2603bdf897a4ab0f4bd7f405fc/python_multipart-0.0.20-py3-none-any.whl"
wget -c "${PY}/f3/26/3e1bbe954fde7ee22a6e7d31582c642aad9e84ffe4b5fb61e63b87cd326f/pydantic-2.10.4-py3-none-any.whl"
wget -c "${PY}/32/90/3b15e31b88ca39e9e626630b4c4a1f5a0dfd09076366f4219429e6786076/pydantic_core-2.27.2-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl"
wget -c "${PY}/96/00/2b325970b3060c7cecebab6d295afe763365822b1306a12eeab198f74323/starlette-0.41.3-py3-none-any.whl"
wget -c "${PY}/78/b6/6307fbef88d9b5ee7421e68d78a9f162e0da4900bc5f5793f6d3d0e34fb8/annotated_types-0.7.0-py3-none-any.whl"
wget -c "${PY}/46/eb/e7f063ad1fec6b3178a3cd82d1a3c4de82cccf283fc42746168188e1cdd5/anyio-4.8.0-py3-none-any.whl"
wget -c "${PY}/95/04/ff642e65ad6b90db43e668d70ffb6736436c7ce41fcc549f4e9472234127/h11-0.14.0-py3-none-any.whl"
wget -c "${PY}/7e/d4/7ebdbd03970677812aac39c869717059dbb71a4cfc033ca6e5221787892c/click-8.1.8-py3-none-any.whl"
```


<h2 id="c-4-0" class="mh1">四、Dockerfile（完整）</h2>

157 部署路径：`/data_hdd/fgclip2/build/Dockerfile`  
本仓库副本：`embed_server/Dockerfile`（COPY 源文件名为 `fgclip2_embed_server.py`，157 上请命名为 `embed_server.py`）

```dockerfile
FROM nvidia/cuda:11.7.1-cudnn8-runtime-ubuntu20.04

ENV DEBIAN_FRONTEND=noninteractive \
    NVIDIA_DISABLE_REQUIRE=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/opt/conda/bin:$PATH \
    MODEL_PATH=/models \
    PORT=8200 \
    USE_FP16=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl git \
    && rm -rf /var/lib/apt/lists/*

COPY offline/miniconda.sh /tmp/miniconda.sh
RUN bash /tmp/miniconda.sh -b -p /opt/conda && rm /tmp/miniconda.sh

RUN conda install -y --override-channels \
    -c https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/main \
    python=3.10 pip

COPY offline/torch-wheels /tmp/torch-wheels
RUN pip install --no-index --find-links=/tmp/torch-wheels \
      nvidia-cublas-cu11==11.11.3.6 \
      nvidia-cuda-cupti-cu11==11.8.87 \
      nvidia-cuda-nvrtc-cu11==11.8.89 \
      nvidia-cuda-runtime-cu11==11.8.89 \
      nvidia-cudnn-cu11==8.7.0.84 \
      nvidia-cufft-cu11==10.9.0.58 \
      nvidia-curand-cu11==10.3.0.86 \
      nvidia-cusolver-cu11==11.4.1.48 \
      nvidia-cusparse-cu11==11.7.5.86 \
      nvidia-nccl-cu11==2.19.3 \
      nvidia-nvtx-cu11==11.8.86 \
 && pip install --no-index --find-links=/tmp/torch-wheels --no-deps torch==2.2.2 \
 && pip install --no-index --find-links=/tmp/torch-wheels --no-deps torchvision==0.17.2 \
 && pip install --no-index --find-links=/tmp/torch-wheels sympy networkx fsspec \
 && rm -rf /tmp/torch-wheels

COPY offline/wheels /tmp/wheels
RUN pip install --no-index --find-links=/tmp/wheels numpy==1.26.4 pillow==10.4.0

RUN python -c "import torch, torchvision, numpy as np; from PIL import Image; print('torch', torch.__version__); print('numpy', np.__version__)"

RUN pip install --no-index --find-links=/tmp/wheels --no-deps \
    transformers==4.57.6 safetensors==0.4.5 sentencepiece==0.2.0 protobuf==4.25.3 \
 && pip install --no-index --find-links=/tmp/wheels --no-deps \
    tokenizers huggingface-hub regex requests pyyaml packaging filelock tqdm \
 && pip install --no-index --find-links=/tmp/wheels --no-deps \
    fastapi uvicorn python-multipart pydantic pydantic-core starlette \
    annotated-types anyio h11 click \
 && rm -rf /tmp/wheels

RUN python -c "import torch, transformers; print('torch', torch.__version__); print('transformers', transformers.__version__)"

COPY embed_server.py /app/embed_server.py
WORKDIR /app
EXPOSE 8200
CMD ["python", "/app/embed_server.py"]
```

<h2 id="c-4-1" class="mh2">构建</h2>

```bash
cd /data_hdd/fgclip2/build
docker build -t fgclip2:cu117-1152 .
```


<h2 id="c-5-0" class="mh1">五、embed_server.py（完整）</h2>

157 部署路径：`/data_hdd/fgclip2/build/embed_server.py`  
本仓库副本：`embed_server/fgclip2_embed_server.py`

实现要点：

- 启动时加载模型一次（FastAPI `lifespan`），避免每次请求冷启动
- 文本兼容 **`text`**（单条）与 **`texts[]`**（批量）两种请求体；`texts` 长度 N 时返回 **N 条** `features`
- 批量请求会打印日志：`embed/text batch=N texts=[...]`，便于与 searchmanager 侧 `plan.EncodeTexts` 对照
- 图片使用 **`multipart/form-data`**，字段名 **`image`**
- 响应向量 **L2 归一化**，`preview.l2=1.0`，与线上一致
- `AutoImageProcessor(..., use_fast=False)` + `torch.compiler.is_compiling` 补丁，兼容 torch 2.2.x

```python
import io
import math
import os
from contextlib import asynccontextmanager
from typing import Optional

import torch

# torch 2.2.x 无 is_compiling，transformers fast image processor 会报错
if hasattr(torch, "compiler") and not hasattr(torch.compiler, "is_compiling"):
    torch.compiler.is_compiling = lambda: False

import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image
from pydantic import BaseModel
from transformers import AutoImageProcessor, AutoModelForCausalLM, AutoTokenizer

MODEL_PATH = os.environ.get("MODEL_PATH", "/models")
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8200"))
USE_FP16 = os.environ.get("USE_FP16", "1") == "1"
TEXT_MAX_LEN = int(os.environ.get("TEXT_MAX_LEN", "64"))
WALK_TYPE = os.environ.get("WALK_TYPE", "short")
NORMALIZE_OUTPUT = os.environ.get("NORMALIZE_OUTPUT", "1") == "1"
PREVIEW_HEAD_TAIL = int(os.environ.get("PREVIEW_HEAD_TAIL", "8"))

state = {}


def determine_max_patches(image: Image.Image) -> int:
    w, h = image.size
    max_val = (w // 16) * (h // 16)
    if max_val > 784:
        return 1024
    if max_val > 576:
        return 784
    if max_val > 256:
        return 576
    if max_val > 128:
        return 256
    return 128


def to_features(vec: torch.Tensor) -> list[float]:
    return [float(x) for x in vec.detach().float().cpu().numpy().reshape(-1).tolist()]


def l2_normalize(vec: list[float]) -> tuple[list[float], float]:
    norm = math.sqrt(sum(x * x for x in vec))
    if norm < 1e-12:
        return vec, 0.0
    return [x / norm for x in vec], norm


def make_resp(features: list[list[float]], normalize: bool = NORMALIZE_OUTPUT) -> dict:
    out_feats: list[list[float]] = []
    previews: list[dict] = []
    dim = 0

    for raw in features:
        if normalize:
            feat, _ = l2_normalize(raw)
            preview_l2 = 1.0
        else:
            feat = raw
            preview_l2 = math.sqrt(sum(x * x for x in raw))

        dim = len(feat)
        n = min(PREVIEW_HEAD_TAIL, dim)
        out_feats.append(feat)
        previews.append({
            "dim": dim,
            "head": feat[:n],
            "tail": feat[-n:] if n else [],
            "l2": preview_l2,
        })

    return {
        "ok": True,
        "count": len(out_feats),
        "dim": dim,
        "projected": False,
        "part": False,
        "scene": False,
        "features": out_feats,
        "preview": previews,
    }


def fail(status_code: int, message: str):
    raise HTTPException(status_code, detail={"ok": False, "error": message})


def pick_texts(text: Optional[str], texts: Optional[list[str]]) -> list[str]:
    """兼容 embed_test(text) 与 go-server vl_bridge(texts[] 批量)。"""
    if texts is not None:
        picked = [(item or "").strip() for item in texts]
        if picked:
            return picked
    if text:
        s = text.strip()
        if s:
            return [s]
    return []


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"loading model from {MODEL_PATH} ...")
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_PATH,
        trust_remote_code=True,
    ).cuda().eval()

    if USE_FP16:
        model = model.half()

    state["model"] = model
    state["tokenizer"] = AutoTokenizer.from_pretrained(MODEL_PATH)
    state["image_processor"] = AutoImageProcessor.from_pretrained(
        MODEL_PATH,
        use_fast=False,
    )
    state["dim"] = None

    print(f"model ready, fp16={USE_FP16}, walk_type={WALK_TYPE}")
    yield


app = FastAPI(title="fg-clip2-embed", lifespan=lifespan)


class TextReq(BaseModel):
    text: Optional[str] = None
    texts: Optional[list[str]] = None
    part: bool = False
    project: bool = False
    projected: bool = False
    scene: bool = False


@app.get("/healthz")
def healthz():
    return {
        "ok": True,
        "dim": state.get("dim"),
        "model_path": MODEL_PATH,
    }


@app.post("/api/v1/embed/text")
def embed_text(req: TextReq):
    queries = pick_texts(req.text, req.texts)
    if not queries:
        fail(400, "text or texts is required")
    if any(not q for q in queries):
        fail(400, "texts contains empty string")

    print(
        f"embed/text batch={len(queries)} "
        f"texts={[q[:64] for q in queries]!r}",
        flush=True,
    )

    model = state["model"]
    tok = state["tokenizer"]

    inp = tok(
        [q.lower() for q in queries],
        padding="max_length",
        max_length=TEXT_MAX_LEN,
        truncation=True,
        return_tensors="pt",
    ).to(model.device)

    with torch.no_grad():
        with torch.autocast("cuda", enabled=USE_FP16, dtype=torch.float16):
            feat = model.get_text_features(**inp, walk_type=WALK_TYPE)

    vecs = [to_features(feat[i]) for i in range(len(queries))]
    state["dim"] = len(vecs[0])
    print(f"embed/text done count={len(vecs)} dim={state['dim']}", flush=True)
    return make_resp(vecs)


@app.post("/api/v1/embed/image")
async def embed_image(image: UploadFile = File(...)):
    raw = await image.read()
    if not raw:
        fail(400, "empty image")

    try:
        pil = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as e:
        fail(400, f"invalid image: {e}")

    model = state["model"]
    proc = state["image_processor"]

    img_in = proc(
        images=pil,
        max_num_patches=determine_max_patches(pil),
        return_tensors="pt",
    ).to(model.device)

    with torch.no_grad():
        with torch.autocast("cuda", enabled=USE_FP16, dtype=torch.float16):
            feat = model.get_image_features(**img_in)

    vec = to_features(feat[0])
    state["dim"] = len(vec)
    return make_resp([vec])


if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT, log_level="info")
```


<h2 id="c-6-0" class="mh1">六、启动服务</h2>

```bash
docker stop fgclip2-gpu3 2>/dev/null; docker rm fgclip2-gpu3 2>/dev/null

docker run -d --name fgclip2-gpu3 \
  --gpus '"device=3"' \
  --shm-size=4g \
  -p 8200:8200 \
  --restart unless-stopped \
  -v /data_hdd/fgclip2/models/fg-clip2-so400m:/models:ro \
  fgclip2:cu117-1152

docker logs -f fgclip2-gpu3   # 等到 "model ready"
```

<h2 id="c-6-1" class="mh2">多卡扩展（GPU 3/4/5/6）</h2>

| 容器名 | GPU | 宿主机端口 |
|--------|-----|------------|
| fgclip2-gpu3 | 3 | 8200 |
| fgclip2-gpu4 | 4 | 8201 |
| fgclip2-gpu5 | 5 | 8202 |
| fgclip2-gpu6 | 6 | 8203 |

<h2 id="c-6-2" class="mh2">镜像备份</h2>

```bash
docker save fgclip2:cu117-1152 | gzip > /data_hdd/fgclip2/fgclip2-cu117-1152.tar.gz
```


<h2 id="c-7-0" class="mh1">七、HTTP 业务协议</h2>

<h2 id="c-7-1" class="mh2">7.1 请求格式</h2>

<h2 id="c-7-1-1" class="mh3">embed_test（Go 测试客户端）</h2>

```http
POST /api/v1/embed/text
Content-Type: application/json

{"text":"找一个男人"}
```

```http
POST /api/v1/embed/image
Content-Type: multipart/form-data

image=<图片文件>
```

> **注意**：图片接口字段名必须是 **`image`**。

<h2 id="c-7-2" class="mh2">7.2 统一响应格式</h2>

```json
{
    "ok": true,
    "count": 1,
    "dim": 1152,
    "projected": false,
    "part": false,
    "scene": false,
    "features": [[ /* 1152 维，已 L2 归一化 */ ]],
    "preview": [{
        "dim": 1152,
        "head": [ /* 前 8 维 */ ],
        "tail": [ /* 后 8 维 */ ],
        "l2": 1.0
    }]
}
```

| 字段 | 说明 |
|------|------|
| `ok` | 成功为 `true`；失败时 HTTP 4xx/5xx，`detail.error` |
| `dim` | So400m 固定 **1152**（线上旧服务可能为 512/1024，模型不同） |
| `count` | 与 `features` 长度一致；单条为 1，批量 expand 为 N |
| `features` | 向量数组，每条 1152 维；服务端已 L2 归一化 |
| `preview` | 与 `features` 等长，每条含 `l2`（归一化后为 **1.0**） |
| `projected` | 当前 So400m 直连，固定 `false` |

<h2 id="c-7-3" class="mh2">7.3 健康检查</h2>

```http
GET /healthz
→ {"ok": true, "dim": 1152, "model_path": "/models"}
```


<h2 id="c-8-0" class="mh1">八、验证命令</h2>

<h2 id="c-8-1" class="mh2">8.1 文本</h2>

```bash
curl -s -X POST http://127.0.0.1:8200/api/v1/embed/text \
  -H "Content-Type: application/json" \
  -d '{"text":"穿蜘蛛侠衣服的人"}'
```

<h2 id="c-8-2" class="mh2">8.2 图片</h2>

```bash
curl -s -m 120 -X POST http://127.0.0.1:8200/api/v1/embed/image \
  -F "image=@/path/to/test.jpg"
```

Apifox：POST → form-data → 参数名 `image` → 类型 file → 超时 **120s+**。

<h2 id="c-8-3" class="mh2">8.3 一键检查</h2>

```bash
curl -s -X POST http://127.0.0.1:8200/api/v1/embed/text \
  -H "Content-Type: application/json" \
  -d '{"text":"测试"}' | python3 -c "
import sys,json,math
d=json.load(sys.stdin)
v=d['features'][0]
print('ok=',d['ok'],'dim=',d['dim'])
print('l2=',d['preview'][0]['l2'],'norm=',round(math.sqrt(sum(x*x for x in v)),6))
"
```

期望：`ok=True dim=1152 l2=1.0 norm=1.0`。

<h2 id="c-8-4" class="mh2">8.4 embed_test 联调</h2>

`embed_test/main.go` 中：

```go
const embedDim = 1152
```

```bash
cd embed_test
go run . -base-url=http://10.0.0.157:8200 -text="找一个男人" -img-dir=black_test
```

`cmd/vearch_import`、`cmd/vearch_search` 已为 1152 维；Vearch space 也需对应 1152。


<h2 id="c-9-0" class="mh1">九、踩坑与解决方案</h2>

| # | 现象 | 原因 | 解决方案 |
|---|------|------|----------|
| 1 | `cuda>=11.8` 容器启动失败 | 驱动 515.76 最高 CUDA 11.7 | 使用 `nvidia/cuda:11.7.1-*` base，pip 用 cu118 wheel |
| 2 | conda 装 PyTorch `iJIT_NotifyEvent` | conda MKL 2025 与 PyTorch 冲突 | **不用 conda PyTorch**，pip 离线 cu118 wheel |
| 3 | transformers 5.x 无法加载 | 需要 torch≥2.5 | 固定 **transformers==4.57.6** + **torch≥2.2** |
| 4 | torch 2.1 + transformers 4.57 import 失败 | `register_pytree_node` 需 torch 2.2+ | 升级 **torch 2.2.2+cu118** |
| 5 | `libcupti.so.11.8` import 失败 | `--no-deps` 装 torch 缺 nvidia 包 | Dockerfile **先装 11 个 nvidia-cu11**，再 `--no-deps torch` |
| 6 | `No module named 'numpy'` | 刻意删 numpy wheel | **numpy==1.26.4** 在 transformers 之前安装 |
| 7 | `No module named 'PIL'` | pillow 装太晚 | **numpy+pillow** 在 import torchvision 之前 |
| 8 | `No module named 'torchvision'` | FG-CLIP2 modeling 依赖 | 离线装 **torchvision 0.17.2+cu118** |
| 9 | pip download `can't start new thread` | Docker 默认线程/进程限制 | wget 直链下 wheel，或 docker 加 `seccomp=unconfined --pids-limit=-1` |
| 10 | 清华 wget 403 | 镜像禁止裸 wget `/packages/` | 用 **files.pythonhosted.org** 或本机 pip download + scp |
| 11 | fastapi 找不到 / starlette 缺失 | wheels 未下载或 `--no-deps` 漏依赖 | 补全 fastapi 生态 10 个 wheel，Dockerfile 显式列出 |
| 12 | go-server 422 `text required` | 发送 `texts[]` 而非 `text` | embed_server 同时支持 **text** 和 **texts** |
| 13 | 图片 500 `torch.compiler.is_compiling` | transformers fast processor + torch 2.2 | **`use_fast=False`** + `is_compiling` 补丁 |
| 14 | 图片请求“没反应” | 推理慢或 Apifox 超时/方法错误 | POST + form-data + `image` 文件，超时 120s+ |
| 15 | curl 管道 Broken pipe | 157 默认 python2.7 + head 截断 | 用 **python3** 解析 JSON |
| 16 | VlSearch expand 失败，`features` 只有 1 条 | 旧版只 encode 第一条 `texts` | **`pick_texts` 批量 encode**，`make_resp` 返回等长 `features` |


<h2 id="c-10-0" class="mh1">十、性能说明</h2>

| 场景 | 耗时 |
|------|------|
| 首次启动 load 模型 | 30s～2min |
| `docker exec python -c` 单次推理 | 每次冷启动，很慢 |
| FastAPI 常驻服务首次 forward | 数秒～数十秒（CUDA 预热） |
| 预热后单次 text/image | 通常数百 ms 级（T4 + FP16） |

**建议**：生产必须使用 **常驻 HTTP 服务**（本方案），不要每次 `docker exec` 临时跑 Python。


<h2 id="c-11-0" class="mh1">十一、代码更新后操作步骤（157）</h2>

本地改完 `embed_server/fgclip2_embed_server.py` 或 `embed_server/Dockerfile` 后，在 **k8s-master-157** 上按变更类型选择路径。

<h2 id="c-11-1" class="mh2">11.1 变更类型对照</h2>

| 变更内容 | 是否需要 rebuild 镜像 | 推荐方式 |
|----------|----------------------|----------|
| 仅 `embed_server.py`（逻辑、协议、日志等） | 否 | **热更新**（§11.3） |
| `Dockerfile`、离线 wheel、依赖版本 | 是 | **重建镜像**（§11.4） |
| 模型权重 | 否（换挂载目录即可） | 更新 `/data_hdd/fgclip2/models/` 后 restart |

<h2 id="c-11-2" class="mh2">11.2 从本机同步到 157</h2>

在本机 `vl-embed` 仓库目录执行（将 `10.0.0.157` 换成实际 IP）：

```bash
# 仅更新 Python 服务（最常见）
scp embed_server/fgclip2_embed_server.py root@10.0.0.157:/data_hdd/fgclip2/build/embed_server.py

# 若 Dockerfile 也改了
scp embed_server/Dockerfile root@10.0.0.157:/data_hdd/fgclip2/build/Dockerfile
```

> 157 上文件名是 **`embed_server.py`**，本仓库为 **`fgclip2_embed_server.py`**，scp 时直接写到目标名即可。

<h2 id="c-11-3" class="mh2">11.3 热更新（仅 embed_server.py，推荐）</h2>

在 **157** 上执行，无需 rebuild，约 1～2 分钟（含模型 reload）：

```bash
# 1. 覆盖容器内 Python 文件
docker cp /data_hdd/fgclip2/build/embed_server.py fgclip2-gpu3:/app/embed_server.py

# 2. 重启容器（必须 restart 才会重新 import 代码）
docker restart fgclip2-gpu3

# 3. 等待模型加载完成
docker logs -f fgclip2-gpu3
# 看到 "model ready" 后再测接口
```

多卡实例逐个更新（示例 GPU 4，端口 8201）：

```bash
docker cp /data_hdd/fgclip2/build/embed_server.py fgclip2-gpu4:/app/embed_server.py
docker restart fgclip2-gpu4
docker logs -f fgclip2-gpu4
```

<h2 id="c-11-4" class="mh2">11.4 重建镜像（Dockerfile / 依赖变更）</h2>

在 **157** 上执行，耗时约 10～30 分钟（取决于是否命中 Docker 缓存）：

```bash
cd /data_hdd/fgclip2/build

# 1. 构建新镜像（tag 不变则覆盖旧 tag）
docker build -t fgclip2:cu117-1152 .

# 2. 停旧容器
docker stop fgclip2-gpu3 2>/dev/null; docker rm fgclip2-gpu3 2>/dev/null

# 3. 用新镜像启动（参数与 §6 一致）
docker run -d --name fgclip2-gpu3 \
  --gpus '"device=3"' \
  --shm-size=4g \
  -p 8200:8200 \
  --restart unless-stopped \
  -v /data_hdd/fgclip2/models/fg-clip2-so400m:/models:ro \
  fgclip2:cu117-1152

# 4. 确认启动
docker logs -f fgclip2-gpu3
```

多卡：对每个 `fgclip2-gpuN` 重复 stop/rm/run，改 `--gpus` 与 `-p`（见 §6 多卡表）。

可选备份新镜像：

```bash
docker save fgclip2:cu117-1152 | gzip > /data_hdd/fgclip2/fgclip2-cu117-1152.tar.gz
```

<h2 id="c-11-5" class="mh2">11.5 更新后验证（必做）</h2>

```bash
# 健康检查
curl -s http://127.0.0.1:8200/healthz

# 单条文本
curl -s -X POST http://127.0.0.1:8200/api/v1/embed/text \
  -H "Content-Type: application/json" \
  -d '{"text":"测试"}' | python3 -c "
import sys,json
d=json.load(sys.stdin)
assert d['ok'] and d['count']==1 and d['dim']==1152
print('single OK', d['count'], d['dim'])
"
```

<h2 id="c-11-6" class="mh2">11.6 回滚</h2>

热更新回滚：用上一版 `embed_server.py` 再 `docker cp` + `docker restart`。

镜像回滚：从备份恢复后重新 run：

```bash
gunzip -c /data_hdd/fgclip2/fgclip2-cu117-1152.tar.gz | docker load
# 再按 §11.4 步骤 2～3 启动容器
```


<h2 id="c-12-0" class="mh1">十二、相关本地文件</h2>

| 文件 | 说明 |
|------|------|
| **`garbge/FG-CLIP2-So400m-部署文档.md`** | 原始部署文档副本 |
| `embed_server/fgclip2_embed_server.py` | HTTP 服务源码副本（与 §5 一致） |
| `embed_server/Dockerfile` | 镜像构建副本（与 §4 一致，COPY 文件名略有不同） |
| `embed_test/README.md` | embed_test 协议与 Vearch 联调 |
| `embed_test/main.go` | 图文相似度测试（需 `embedDim=1152`） |
| `VL 多模态检索协议文档.md` | 上层 VlSearch 检索协议 |


<h2 id="c-13-0" class="mh1">十三、版本演进摘要</h2>

```
pytorch:2.0.1-cuda11.7 容器 + pip transformers 5.x     → 版本冲突
conda pytorch 2.1.2+cu117                               → iJIT_NotifyEvent
pip torch 2.1.0+cu118 --no-deps                         → libcupti 缺失 + transformers pytree 不兼容
pip torch 2.2.2 + nvidia 11 包 + transformers 4.57.6    → 文本 OK
+ numpy/pillow/torchvision/fastapi + embed_server       → 完整 8200 HTTP 服务
+ texts[] 批量 encode + use_fast=False              → go-server expand + 图片 OK
```


*文档生成环境：k8s-master-157，镜像 tag `fgclip2:cu117-1152`，验证通过：text dim=1152，preview.l2=1.0。*


<hr aria-hidden="true" style=" border: 0; height: 2px; background: linear-gradient(90deg, transparent, #1bb75c, transparent); margin: 2rem 0; " />

<!-- 目录容器 -->
<div class="mi1">
    <strong>目录</strong>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
            <li style="list-style-type: none;"><a href="#c-1-0">一、架构概览</a></li>
            <li style="list-style-type: none;"><a href="#c-2-0">二、目录结构（157 服务器）</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-2-1">2.1 模型文件</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-3-0">三、离线包准备</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-3-1">3.1 Miniconda</a></li>
                    <li style="list-style-type: none;"><a href="#c-3-2">3.2 torch-wheels</a></li>
                    <li style="list-style-type: none;"><a href="#c-3-3">3.3 wheels</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-4-0">四、Dockerfile（完整）</a></li>
            <li style="list-style-type: none;"><a href="#c-5-0">五、embed_server.py（完整）</a></li>
            <li style="list-style-type: none;"><a href="#c-6-0">六、启动服务</a></li>
            <li style="list-style-type: none;"><a href="#c-7-0">七、HTTP 业务协议</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-7-1">7.1 请求格式</a></li>
                    <li style="list-style-type: none;"><a href="#c-7-2">7.2 统一响应格式</a></li>
                    <li style="list-style-type: none;"><a href="#c-7-3">7.3 健康检查</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-8-0">八、验证命令</a></li>
            <li style="list-style-type: none;"><a href="#c-9-0">九、踩坑与解决方案</a></li>
            <li style="list-style-type: none;"><a href="#c-10-0">十、性能说明</a></li>
            <li style="list-style-type: none;"><a href="#c-11-0">十一、代码更新后操作步骤</a></li>
                <ul style="padding-left: 15px; list-style-type: none;">
                    <li style="list-style-type: none;"><a href="#c-11-1">11.1 变更类型对照</a></li>
                    <li style="list-style-type: none;"><a href="#c-11-2">11.2 从本机同步到 157</a></li>
                    <li style="list-style-type: none;"><a href="#c-11-3">11.3 热更新</a></li>
                    <li style="list-style-type: none;"><a href="#c-11-4">11.4 重建镜像</a></li>
                    <li style="list-style-type: none;"><a href="#c-11-5">11.5 更新后验证</a></li>
                    <li style="list-style-type: none;"><a href="#c-11-6">11.6 回滚</a></li>
                </ul>
            <li style="list-style-type: none;"><a href="#c-12-0">十二、相关本地文件</a></li>
            <li style="list-style-type: none;"><a href="#c-13-0">十三、版本演进摘要</a></li>
        </ul>
</div>
