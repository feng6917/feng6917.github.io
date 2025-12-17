# Kubernetes常用命令和操作笔记

<h2 id="c-1-0" class="mh2">1. 📦 部署与更新</h2>

```bash
# 部署应用
kubectl apply -f app.yaml
kubectl replace -f app.yaml  # 替换式更新

# 重新部署
kubectl rollout restart deployment <deployment-name>

# 命令式更新镜像（记录到历史）
kubectl set image deployment <deploy-name> <container-name>=<image:tag> --record

# 暂停/恢复部署更新
kubectl rollout pause deployment <deployment-name>
kubectl rollout resume deployment <deployment-name>
```

<h2 id="c-2-0" class="mh2">2. 🔍 查看与查询</h2>

```bash
# 查看 Deployment
kubectl get deployment -A | grep <关键字>
kubectl get deployment -o yaml >> output.yaml  # 输出到文件

# 查看 Pod
kubectl get pod -o wide
kubectl get pod --namespace <namespace>

# 查看全部资源
kubectl get all

# 查看 Pod 详情（过滤显示）
kubectl describe pod <pod-name> | grep <关键字> -A 10

# 获取 Pod 中容器名
kubectl get pods <pod-name> -o jsonpath='{.spec.containers[*].name}'
```

<h2 id="c-3-0" class="mh2">3. 📝 日志查看</h2>

```bash
# 查看最新日志
kubectl logs <pod-name> --tail 20

# 查看所有容器日志
kubectl logs <pod-name> --all-containers

# 查看指定容器日志
kubectl logs <pod-name> -c <container-name>

# 命名空间下查看日志
kubectl -n <namespace> logs <pod-name> -c <container-name>
```

<h2 id="c-4-0" class="mh2">4. 🛠️ 调试与操作</h2>

```bash
# 进入容器终端
kubectl exec -it <pod-name> -- bash
kubectl exec -it <pod-name> -c <container-name> -- bash  # 指定容器

# 端口转发
kubectl port-forward <pod-name> <本地端口>:<容器端口>

# 文件拷贝
kubectl cp ./local-file <pod-name>:/path/in/pod

# 编辑资源
kubectl edit deployment <deployment-name>
```

<h2 id="c-5-0" class="mh2">5. 📊 伸缩与回滚</h2>

```bash
# 伸缩副本数
kubectl scale deployment <deployment-name> --replicas=5

# 查看发布历史
kubectl rollout history deployment <deployment-name>

# 回滚操作
kubectl rollout undo deployment <deployment-name>           # 回退到上一版本
kubectl rollout undo deployment <deployment-name> --to-revision=2  # 回退到指定版本
```

<h2 id="c-6-0" class="mh2">6. 🗑️ 删除与清理</h2>

```bash
# 删除部署
kubectl delete deployment <deployment-name>

# 删除所有资源
kubectl delete all --all

# 按条件删除 Pod
kubectl -n <namespace> get po | grep <关键字> | awk '{print $1}' | xargs kubectl -n <namespace> delete po
```

<h2 id="c-7-0" class="mh2">7. 📁 命名空间管理</h2>

```bash
# 创建命名空间
kubectl create namespace <namespace-name>

# 在指定命名空间部署
kubectl apply -f app.yaml --namespace <namespace-name>
```

<h2 id="c-8-0" class="mh2">8. 🌐 服务与网络</h2>

```yaml
# svc 负载均衡 NodePort 方式参考
apiVersion: v1

kind: Service
metadata:
  annotations:
    meta.helm.sh/release-name: httptrans-internal
    meta.helm.sh/release-namespace: hummingbird
    service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http
  creationTimestamp: "2025-06-17T06:22:50Z"
  labels:
    app.kubernetes.io/managed-by: Helm
  name: httptrans-internal
  namespace: hummingbird
  resourceVersion: "31130901"
  uid: b7a438c1-f1e9-406c-89d8-61efcd5f328f
spec:
  clusterIP: 10.96.229.81
  clusterIPs:

  - 10.96.229.81
  externalTrafficPolicy: Cluster
  internalTrafficPolicy: Cluster
  ipFamilies:
  - IPv4
  ipFamilyPolicy: SingleStack
  ports:
  - name: http
    nodePort: 31628
    port: 8080
    protocol: TCP
    targetPort: 8080
  selector:
    k8s-app: httptrans-internal
  sessionAffinity: None
  type: NodePort
status:
  loadBalancer: {}
```

```nginx
// 获取真实IP地址
externalTrafficPolicy: LocalexternalTrafficPolicy: Local

type: NodePort
// 代理转发
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Original-User-Agent $http_user_agent;
proxy_set_header X-Forwarded-Proto $scheme;
```

<h2 id="c-9-0" class="mh2">9. 💾 存储维护 (GlusterFS 示例)</h2>

```bash
# 1. 停止服务（缩容到0副本）
kubectl scale deployment <deploy-name> --replicas=0

# 2. 停止并删除 Gluster 卷
gluster volume stop <volume-name>
gluster volume delete <volume-name>

# 3. 清理存储目录
rm -rf /data/gluster/brick/<volume-name>/*

# 4. 重建卷
gluster volume create <volume-name> transport tcp <host>:/path/to/brick

# 5. 启动卷
gluster volume start <volume-name>

# 6. 检查状态
gluster volume info <volume-name>

# 7. 恢复服务
kubectl scale deployment <deploy-name> --replicas=<original-number>
```

<!-- 目录容器 -->
<div class="mi1">
    <strong>目录</strong>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
            <li style="list-style-type: none;"><a href="#c-1-0">1. 📦 部署与更新</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-2-0">2. 🔍 查看与查询</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-3-0">3. 📝 日志查看</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-4-0">4. 🛠️ 调试与操作</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-5-0">5. 📊 伸缩与回滚</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-6-0">6. 🗑️ 删除与清理</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-7-0">7. 📁 命名空间管理</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-8-0">8. 🌐 服务与网络</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-9-0">9. 💾 存储维护 (GlusterFS 示例)</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
        </ul>
    <strong><a href="../_posts/-cmd.md">回到上级</a></strong>
</div>

<style>
     /* 二级段落 */

    .mh2 {
      -webkit-text-size-adjust: 100%; letter-spacing: .33px; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; line-height: 1.7; color: #1cc03cff; border-left: 4px solid #1bb75cff; padding-left: 6px; margin: 1.4em 0 1.1em;
    }
    /* 目录 高度、宽度 可自行调整*/
    .mi1 {
      position: fixed; bottom: 240px; right: 10px; width: 240px; height: 220px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; overflow-y: auto; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; font-size: 14px; line-height: 1.15; color: #444; letter-spacing: 0.33px; transition: all 0.3s ease;
    }

</style>
