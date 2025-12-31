---
layout: post
title: "常见命令速查手册"
date:   2024-4-1
tags: 
  - 工具类
comments: true
author: feng6917
---

本手册汇总了Windows、Linux、容器技术、开发工具及数据库等领域的高频命令与实用操作，涵盖日常开发、系统运维与云端协作全流程，方便随时查阅。

<!-- more -->

<h2 id="c-1-0" class="mh1">Win 快捷键</h2>

<h2 id="c-1-1" class="mh2">1. 系统基础与效率（系统操作 + 窗口管理 + 应用切换）</h2>

#### 🏠 **系统与桌面操作**

- **快速锁定** `Win + L`
- **运行对话框** `Win + R`
- **文件资源管理器** `Win + E`
- **系统设置** `Win + I`
- **搜索/小娜** `Win + S`
- **操作中心** `Win + A`
- **全部窗口最小化/还原** `Win + D`
- **显示桌面（预览）** `Win + ,`
- **任务视图/时间线** `Win + Tab`
- **任务管理器** `Ctrl + Shift + Esc`

#### 🪟 **窗口管理**

- **最大化** `Win + ↑`
- **最小化** `Win + ↓`
- **左贴靠** `Win + ←`
- **右贴靠** `Win + →`
- **四角贴靠** `Win + ←/→ + ↑/↓`
- **虚拟桌面** 新建 `Win + Ctrl + D`  关闭 `Win + Ctrl + F4`

#### 🔄 **应用切换**

- **切换应用** `Alt + Tab`
- **反向切换** `Alt + Shift + Tab`
- **同应用窗口切换** `Ctrl + Tab`
- **关闭窗口** `Alt + F4`
- **安全选项** `Ctrl + Alt + Delete`

---
<h2 id="c-1-2" class="mh2">2. 文件、文本与输入（资源管理器 + 文本编辑 + 输入法）</h2>

#### 📁 **文件资源管理器**

- **新建文件夹** `Ctrl + Shift + N`
- **重命名** `F2`
- **彻底删除** `Shift + Delete`
- **属性** `Alt + Enter`
- **地址栏定位** `Alt + D`
- **文件夹内搜索** `Ctrl + F`
- **刷新** `F5`

#### ✍️ **文本编辑（通用）**

- **复制/剪切/粘贴** `Ctrl + C / X / V`
- **全选** `Ctrl + A`
- **撤销/恢复** `Ctrl + Z / Y`
- **查找/替换** `Ctrl + F / H`
- **保存** `Ctrl + S`
- **打印** `Ctrl + P`
- **新建/打开** `Ctrl + N / O`
- **关闭标签/窗口** `Ctrl + W`

#### 🈯 **输入法与语言**

- **中英文切换** `Shift`
- **切换输入法** `Win + Space` / `Ctrl + Space`
- **简繁切换** `Ctrl + Shift + F`
- **全角/半角** `Shift + Space`
- **中英文标点** `Ctrl + .`
- **软键盘开关** `Win + Ctrl + O`
- **添加/设置语言** `Win + I` → 时间和语言 → 语言

---
<h2 id="c-1-3" class="mh2">3. 浏览、开发与命令行（浏览器 + 命令行）</h2>

#### 🌐 **浏览器（Chrome/Edge）**

- **标签页** 新建 `Ctrl + T` 关闭 `Ctrl + W`  恢复 `Ctrl + Shift + T`
- **切换标签页** `Ctrl + Tab` `Ctrl + PgUp/PgDn`
- **跳转标签页** `Ctrl + 1~9`
- **页面刷新** `F5`  `Ctrl + R`  **强制刷新** `Ctrl + F5`
- **地址栏定位** `Ctrl + L`
- **查找** `Ctrl + F`
- **缩放页面** `Ctrl + + / - / 0`
- **开发者工具** `F12`

#### 💻 **命令行（CMD/PowerShell/WSL）**

- **复制/粘贴** `Ctrl + C / V`（CMD需先进入标记模式 `Ctrl + M`）
- **WSL专用复制粘贴** `Ctrl + Shift + C / V`
- **清屏** `Ctrl + L`
- **查找** `Ctrl + F`
- **自动补全** `Tab`
- **历史命令** `↑ / ↓`
- **字体调整** `Ctrl + + / -`（WSL）
- **全屏切换** `Alt + Enter`（WSL）

<h2 id="c-2-0" class="mh1">Linux 常用命令速查手册</h2>

<h2 id="c-2-1" class="mh2">1. 系统时间与时区</h2>

### 设置时区

```bash
# 临时设置时区
cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

# 安装时间同步工具
apt install ntpdate -y

# 同步时间（阿里云NTP服务器）
ntpdate ntp.aliyun.com

# 时间操作示例
date                          # 查看当前时间
date -d '-1 day'             # 查看昨天时间
date -d '+1 hour'            # 查看一小时后时间
```

---

<h2 id="c-2-2" class="mh2">2. 包管理命令</h2>

### APT 常用命令（Debian/Ubuntu）

```bash
# 更新源列表
sudo apt update

# 升级已安装的包
sudo apt upgrade

# 完整升级（会处理依赖变化）
sudo apt full-upgrade

# 软件包管理
sudo apt install <package_name>          # 安装软件包
sudo apt install <pkg1> <pkg2> <pkg3>   # 安装多个软件包
sudo apt remove <package_name>          # 删除软件包
sudo apt purge <package_name>           # 删除软件包及配置文件
sudo apt autoremove                     # 自动删除不需要的包

# 查询与搜索
apt list --upgradeable                  # 列出可更新的软件包
apt list --installed                    # 列出已安装的软件包
apt show <package_name>                 # 显示软件包详细信息
apt search <keyword>                    # 搜索软件包

# 清理缓存
sudo apt autoclean                      # 清理旧版本软件包缓存
sudo apt clean                          # 清理所有软件包缓存
```

---

<h2 id="c-2-3" class="mh2">3. 文件与目录操作</h2>

### 基本目录操作

```bash
ls          # 列出目录内容
ls -l       # 详细信息
ls -la      # 显示所有文件（含隐藏文件）
ls -lh      # 人类可读大小格式

cd <path>   # 切换目录
cd ~        # 返回家目录
cd -        # 返回上一个目录

pwd         # 显示当前目录路径

mkdir <dir>            # 创建目录
mkdir -p a/b/c         # 递归创建多级目录

rmdir <dir>            # 删除空目录
rm -r <dir>            # 递归删除目录
rm -rf <dir>           # 强制递归删除

cp <src> <dest>        # 复制文件
cp -r <src> <dest>     # 递归复制目录

mv <src> <dest>        # 移动/重命名文件
```

### 文件查看与搜索

```bash
# 查看文件内容
cat file.txt           # 显示整个文件
less file.txt          # 分页查看（可前后翻页）
head -n 20 file.txt    # 查看前20行
tail -n 20 file.txt    # 查看后20行
tail -f file.txt       # 实时追踪文件变化
tail -f --since 1s logs.txt  # 每秒刷新查看日志

# 查找大文件
find / -type f -size +1G                      # 查找大于1G的文件
find / -type f -size +1G -print0 | xargs -0 ls -l  # 带详细信息
find / -type f -size +1G -print0 | xargs -0 du -h | sort -nr  # 排序显示

# 文件匹配与删除
ls -l list20240[0-4]*.tar.gz                  # 通配符匹配
rm -v list20240[0-4]*.tar.gz                  # 安全删除（显示过程）

# 查看服务位置
which nginx # 查看服务配置文件位置
```

### 文件传输

```bash
# SCP 文件传输
scp file.txt user@remote:/path/              # 上传文件
scp -r dir/ user@remote:/path/               # 上传目录
scp user@remote:/path/file.txt ./            # 下载文件
scp -r user@remote:/path/dir/ ./             # 下载目录

# 跨服务器传输
scp user1@server1:/path/file user2@server2:/path/
```

### 压缩与解压

```bash
# 压缩文件/目录
tar -zcvf archive.tar.gz ./directory/        # gzip压缩
tar -jcvf archive.tar.bz2 ./directory/       # bzip2压缩

# 解压文件
tar -zxvf archive.tar.gz                     # 解压gzip
tar -jxvf archive.tar.bz2                    # 解压bzip2

# 查看压缩包内容
tar -ztvf archive.tar.gz                     # 查看gzip包内容
tar -jtvf archive.tar.bz2                    # 查看bzip2包内容
```

### grep 文本搜索

```bash
grep "pattern" file.txt                      # 基本搜索
grep -i "pattern" file.txt                   # 忽略大小写
grep -n "pattern" file.txt                   # 显示行号
grep -v "pattern" file.txt                   # 反向匹配（排除）
grep -w "word" file.txt                      # 全词匹配
grep -r "pattern" ./                         # 递归搜索目录
grep -A 3 "pattern" file.txt                 # 显示匹配行及后3行
grep -B 3 "pattern" file.txt                 # 显示匹配行及前3行
grep -C 3 "pattern" file.txt                 # 显示匹配行前后各3行
grep --color=auto "pattern" file.txt         # 高亮显示
grep -e "pat1" -e "pat2" file.txt            # 多个模式
grep -c "pattern" file.txt                   # 统计匹配行数
```

---

<h2 id="c-2-4" class="mh2">4. 性能监控与系统状态</h2>

### 进程管理

```bash
# 进程查询
ps -ef | grep <process_name>                 # 查找进程
pgrep <process_name>                         # 获取进程PID
pstree                                       # 树状显示进程

# 杀死进程
kill <pid>                                   # 正常终止
kill -9 <pid>                                # 强制终止
pkill <process_name>                         # 按名称终止进程
killall <process_name>                       # 终止所有同名进程

# 实时监控
top                                         # 实时系统监控
htop                                        # 增强版top（需安装）

# 全局查看cpu, 内存等
[root@k8s-master-253 ~]# top
top - 14:23:39 up 81 days, 23:39,  1 user,  load average: 1.25, 2.87, 3.90
Tasks: 1285 total,   2 running, 1283 sleeping,   0 stopped,   0 zombie
%Cpu(s): 15.7 us,  2.5 sy,  0.0 ni, 81.8 id,  0.1 wa,  0.0 hi,  0.0 si,  0.0 st
KiB Mem : 26358512+total, 15847916+free, 54207492 used, 50898468 buff/cache
KiB Swap:        0 total,        0 free,        0 used. 20271936+avail Mem 

PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND                                                                                                                                                                                                                                                             
214234 root      20   0 8053792   7.0g  15336 S  1479  2.8  26077:19 singerserver 

按`x`高亮排序命令，默认应该时%CPU，按CPU占用排序
按shift + (</>) 左右箭头，切换不同类型排序

# 查看CPU逻辑核数
[root@k8s-master-253 ~]# cat /proc/cpuinfo| grep "processor"|wc -l
```

### 端口与网络连接

```bash
# 端口查询
netstat -tunlp                               # 查看所有监听端口
netstat -tunlp | grep <port>                 # 查询指定端口
lsof -i:<port>                               # 查看端口占用进程
ss -tunlp                                    # 替代netstat（更快）

# 进程使用的端口
lsof -p <pid>                                # 查看进程打开的文件/端口
```

### 系统资源

```bash
# CPU信息
cat /proc/cpuinfo                            # 查看CPU详细信息
nproc                                        # 查看CPU核心数
lscpu                                        # 查看CPU架构信息
dmidecode -s processor-version               # 查看CPU型号
# 示例输出：
Intel(R) Xeon(R) Gold 6240R CPU @ 2.40GHz
Intel(R) Xeon(R) Gold 6240R CPU @ 2.40GHz
# 注：显示两行表示服务器有2个物理CPU

# 内存信息
free -h                                      # 查看内存使用情况
# 示例输出：
              total        used        free      shared  buff/cache   available
Mem:           251G         51G        151G        1.9G         48G        193G
Swap:            0B          0B          0B

# 各字段解释：
# total     - 总内存大小
# used      - 已使用内存（包含buff/cache）
# free      - 空闲内存
# shared    - 共享内存
# buff/cache - 缓存和缓冲区内存（可被回收）
# available - 可用内存（估算可用于启动新应用的内存）
# Swap      - 交换分区使用情况


cat /proc/meminfo                            # 详细内存信息
# 关键指标示例：
MemTotal:       263585212 kB    # 总内存
MemFree:        158479168 kB    # 空闲内存
MemAvailable:   202719368 kB    # 可用内存
Buffers:          1048576 kB    # 缓冲区内存
Cached:          47457894 kB    # 页面缓存
SwapTotal:             0 kB     # 交换分区总大小
SwapFree:              0 kB     # 空闲交换分区

vmstat 1 10                                  # 虚拟内存统计
# 示例输出：
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 2  0      0 151G   1.9G   48G     0    0     0     0  102  345 15  2 82  0  0

# 磁盘信息
df -h                                        # 查看磁盘使用情况
df -h <path>                                 # 查看指定路径磁盘
du -sh <directory>                           # 查看目录大小
du -h --max-depth=1                          # 查看一级子目录大小
lsblk                                        # 查看块设备信息
# 示例输出及解析：
NAME            MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
sda               8:0    0 160.1T  0 disk /data_ssd       # SATA硬盘，160T，挂载到/data_ssd
nvme0n1         259:0    0 931.5G  0 disk                # NVME固态硬盘，未直接挂载
├─nvme0n1p1     259:2    0   200M  0 part /boot/efi      # EFI系统分区
├─nvme0n1p2     259:3    0     1G  0 part /boot          # 引导分区
└─nvme0n1p3     259:4    0   454G  0 part                # 主分区（LVM物理卷）
  ├─centos-root 253:0    0    50G  0 lvm  /              # 根分区，LVM逻辑卷
  ├─centos-swap 253:1    0     4G  0 lvm  [SWAP]         # 交换分区
  ├─centos-home 253:2    0   100G  0 lvm  /home          # 用户家目录分区
  └─centos-data 253:3    0   300G  0 lvm  /data          # 数据分区
nvme1n1         259:1    0 931.5G  0 disk /data_hdd      # 另一块NVME硬盘，挂载到/data_hdd

# 各字段含义：
# NAME - 设备名称
# MAJ:MIN - 主设备号:次设备号
# RM - 是否可移动设备（1=可移动，0=不可移动）
# SIZE - 设备容量
# RO - 是否只读（1=只读，0=读写）
# TYPE - 类型（disk=磁盘，part=分区，lvm=LVM逻辑卷）
# MOUNTPOINT - 挂载点

fdisk -l                                     # 查看磁盘分区

# I/O监控
iostat -x 1                                  # 磁盘I/O统计
iotop                                       # 实时I/O监控（需安装）

# 统计文件夹内存占用
du -s 20000* | awk '{sum += $1} END {print sum/1024 "M"}'
du -s $(ls -d [0-9]* 2>/dev/null | grep -E '^[0-9]{1,5}$') | awk '{sum += $1} END {print sum/1024 "M"}'
```

---

<h2 id="c-2-5" class="mh2">5. 网络配置与管理</h2>

### 网络接口配置

```bash
# 查看网络配置
ifconfig                                     # 查看所有网络接口
ip addr show                                 # 使用ip命令查看
hostname -I                                  # 查看本机IP地址

# 修改网络配置（CentOS/RHEL）
vi /etc/sysconfig/network-scripts/ifcfg-eth0

# 典型配置文件内容
# 网络接口类型
TYPE="Ethernet"           # 接口类型：Ethernet（以太网）、Bridge（桥接）、Bond（绑定）
                          # 对于虚拟化环境可能有：vlan、vxlan等
# 启动协议
BOOTPROTO="static"        # IP获取方式：
                          # static/none - 静态IP（手动配置）
                          # dhcp - 动态获取（从DHCP服务器）
                          # bootp - 较老的协议
                          # autoip - 自动IP（link-local）
# 开机自启
ONBOOT="yes"              # 系统启动时是否激活该网卡
                          # yes - 开机自动启用
                          # no - 需要手动启用
# IPv4地址配置
IPADDR="192.168.0.253"    # 主IP地址（必需）
PREFIX="24"               # 子网掩码位数（替代NETMASK的CIDR表示法）
NETMASK="255.255.255.0"   # 传统子网掩码表示法（与PREFIX二选一）
                          # 掩码计算：24位 = 255.255.255.0
# 网关配置
GATEWAY="192.168.0.1"     # 默认网关地址
                          # 注意：一个接口只能有一个默认网关
# DNS服务器配置
DNS1="114.114.114.114"    # 主DNS服务器（国内公用DNS）
DNS2="8.8.8.8"           # 备用DNS服务器（Google DNS）
DNS3="8.8.4.4"           # 第二备用DNS服务器
                          # DNS配置会写入 /etc/resolv.conf
```

### 网络服务管理

```bash
# 重启网络服务（CentOS 7+）
systemctl restart network

# 重启网络服务（Ubuntu）
systemctl restart networking
# 或
systemctl restart systemd-networkd

# 启停单个网卡
ifdown eth0 && ifup eth0

# 查看网络连接状态
ip link show                                 # 查看链路状态
ip route show                                # 查看路由表
```

### 网络测试

```bash
ping <host>                                  # 测试网络连通性
traceroute <host>                            # 追踪路由路径
mtr <host>                                   # 结合ping和traceroute
nslookup <domain>                            # DNS查询
dig <domain>                                 # 详细DNS查询

# 端口测试
telnet <host> <port>                         # TCP端口测试
nc -zv <host> <port>                         # 快速端口测试
```

---

<h2 id="c-2-6" class="mh2">6. 进程管理与日志</h2>

### 后台进程管理

```bash
# 运行后台进程
command &                                    # 后台运行
nohup command &                              # 后台运行且退出终端不终止

# 进程管理
jobs                                        # 查看后台作业
fg %<job_id>                                # 切换到前台
bg %<job_id>                                # 切换到后台
disown -h %<job_id>                         # 从作业列表中移除

# 输出重定向
# shell中可能经常能看到：echo log > /dev/null 2>&1 命令的结果可以通过%>的形式来定义输出
/dev/null ：代表空设备文件
>  ：代表重定向到哪里，例如：echo "123" > /home/123.txt
1  ：表示stdout标准输出，系统默认值是1，所以">/dev/null"等同于"1>/dev/null"
2  ：表示stderr标准错误
&  ：表示等同于的意思，2>&1，表示2的输出重定向等同于1
2>&1 & 将这个（标准输出&错误输出）任务放到后台去执行
```

### 服务管理（systemd）

```bash
# 服务控制
systemctl start <service>                    # 启动服务
systemctl stop <service>                     # 停止服务
systemctl restart <service>                  # 重启服务
systemctl reload <service>                   # 重载配置
systemctl enable <service>                   # 设置开机启动
systemctl disable <service>                  # 禁用开机启动
systemctl status <service>                   # 查看服务状态

# 日志查看
journalctl -u <service>                      # 查看服务日志
journalctl -f -u <service>                   # 实时查看服务日志
journalctl --since "1 hour ago"              # 查看最近1小时日志
```

### 磁盘挂载（NTFS）

```bash
# 查看NTFS支持
lsmod | grep ntfs                           # 检查NTFS模块

# 安装NTFS支持（CentOS/RHEL）
yum install epel-release -y
yum install ntfs-3g -y

# 挂载NTFS磁盘
mkdir /mnt/windows
mount -t ntfs-3g /dev/sdb1 /mnt/windows

# 自动挂载（/etc/fstab）
/dev/sdb1  /mnt/windows  ntfs-3g  defaults  0  0
```

---

## 使用技巧

1. **命令历史**

   ```bash
   history                    # 查看命令历史
   !<number>                  # 执行历史中第n条命令
   !!                        # 上一条命令
   Ctrl+R                    # 反向搜索历史命令
   ```

2. **命令别名**

   ```bash
   alias ll='ls -la'         # 创建别名
   alias rm='rm -i'          # 安全删除（需确认）
   unalias ll                # 删除别名
   ```

3. **文件权限**

   ```bash
   chmod 755 file.sh         # 设置权限
   chown user:group file     # 修改所有者
   ```

4. **环境变量**

   ```bash
   echo $PATH                # 查看PATH变量
   export PATH=$PATH:/new/path  # 临时添加PATH
   ```

<h2 id="c-3-0" class="mh2">Kubernetes常用命令和操作笔记</h2>
<h2 id="c-3-1" class="mh2">1. 📦 部署与更新</h2>

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

<h2 id="c-3-2" class="mh2">2. 🔍 查看与查询</h2>

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

<h2 id="c-3-3" class="mh2">3. 📝 日志查看</h2>

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

<h2 id="c-3-4" class="mh2">4. 🛠️ 调试与操作</h2>

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

<h2 id="c-3-5" class="mh2">5. 📊 伸缩与回滚</h2>

```bash
# 伸缩副本数
kubectl scale deployment <deployment-name> --replicas=5

# 查看发布历史
kubectl rollout history deployment <deployment-name>

# 回滚操作
kubectl rollout undo deployment <deployment-name>           # 回退到上一版本
kubectl rollout undo deployment <deployment-name> --to-revision=2  # 回退到指定版本
```

<h2 id="c-3-6" class="mh2">6. 🗑️ 删除与清理</h2>

```bash
# 删除部署
kubectl delete deployment <deployment-name>

# 删除所有资源
kubectl delete all --all

# 按条件删除 Pod
kubectl -n <namespace> get po | grep <关键字> | awk '{print $1}' | xargs kubectl -n <namespace> delete po
```

<h2 id="c-3-7" class="mh2">7. 📁 命名空间管理</h2>

```bash
# 创建命名空间
kubectl create namespace <namespace-name>

# 在指定命名空间部署
kubectl apply -f app.yaml --namespace <namespace-name>
```

<h2 id="c-3-8" class="mh2">8. 🌐 服务与网络</h2>

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

<h2 id="c-3-9" class="mh2">9. 💾 存储维护 (GlusterFS 示例)</h2>

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

<h2 id="c-4-0" class="mh1">Helm</h2>

- 查看帮助

  `helm help`

- 查看当前安装的charts

  `helm list --namespace namespace-name`

- 搜索 charts

  `helm search chart-name`

- 查看chart 状态

  `helm status chart-name`

- 删除charts 不同版本命令不一致

  `helm delete --purge chart-name`

- 安装chart

  ```

  helm install -name chart-name --namespace namespace-name chart-path/
  (helm v3.0) helm install chart-name chart-path/ -n namespace

  ```

- 卸载chart

  ```

  helm uninstall chart-name --namespace namespace-name
  (helm v3.0) helm uninstall chart-name -n namespace

  ```

- helmfile

  ```

  helmfile.yml
  
  releases:
    - name: storeproxy
      namespace: singer
      chart: "../services/store_proxy"
      values:
      - "../services/store_proxy/values.yaml"
      wait: false
      atomic: false

  ```

  ```

  # 部署

  helmfile -f helmfile.yaml apply

  # 移除

  helmfile -f helmfile.yaml delete

  ```

<h2 id="c-5-0" class="mh2">Visual Studio Code</h2>

- 高亮标注：

  ```

      # TODO： 标记代码中要实现的功能或任务
      # FIXME：标记代码中需要修复的问题或缺陷
      # NOTE：提供额外的注释或提示信息，帮助理解代码意图或涉及决策
      # BUG: 标记已知的Bug或错误
      # XXX: 标记需要警惕或重点关注的代码块
      # HACK：标记临时性修复或不优雅的解决方案
    ```

- 折叠所有方法 `ctrl + k + 0`

- 打开(所有)折叠终端 `ctrl + (k) + j`

- 复制一行（向上或向下）

  `alt + shfit + up/down`

- 单行注释

  `ctrl + /`

- 多行注释

  `alt + shift + a`

- 移动一行

  `alt + up/down`

- 显示/隐藏左侧目录栏

  `ctrl + b`

- 删除当前行

  `ctrl + shift + k`

- 控制台终端显示或隐藏

  `ctrl + ~; ctrl + j`

- 查找文件/安装 vscode 插件地址

  `ctrl + p`

- 代码格式化

  `shift + alt + f`

- 新建一个窗口

  `ctrl + alt + n`

- 行增加/减少缩进

  `ctrl + [/]`

- 字体放大/缩小

  `ctrl +/-`

- 拆分编辑器

  `ctrl + \`

- 关闭(所有)窗口

  `ctrl + (k) + w`

- 切换全屏

  `F11`

- 快速回到顶部/底部

  `ctrl + Home/End`

- 多行同时添加内容(光标)

  `ctrl + alt + up/down`

- (全局)替换

  `ctrl + (shift) + h`

<h2 id="c-6-0" class="mh2">Git 常用命令总结</h2>

- 把要提交的文件的信息添加到暂存区中

  `git add`

- 列出本地的所有分支，当前所在分支以 "*" 标出

  `git branch`

- 创建新分支，新的分支基于上一次提交建立

  `git branch <分支名>`

- 重命名本地分支

  `git branch -m new_branch_name`  

- 删除指定的本地分支

  `git branch -d <分支名称>`

- 强制删除指定的本地分支

  `git branch -D <分支名称>`

- 切换到已存在的指定分支

  `git checkout <分支名称>`

- 创建并切换到指定的分支，保留所有的提交记录

  `git checkout -b <分支名称>`

- 默认在当前目录下创建和版本库名相同的文件夹并下载版本到该文件夹下

  `git clone <远程仓库的网址>`

- 指定本地仓库的目录

  `git clone <远程仓库的网址> <本地目录>`

- -b 指定要克隆的分支，默认是master分支

  `git clone <远程仓库的网址> -b <分支名称> <本地目录>`

- 把暂存区中的文件提交到本地仓库中并添加描述信息

  `git commit -m "<提交的描述信息>"`

- 修改上次提交的描述信息

  `git commit --amend`

- 查看配置信息 --local：仓库级，--global：全局级，--system：系统级

  `git config <--local | --global | --system> -l`

- 查看当前生效的配置信息

  `git config -l`

- 配置提交记录中的用户信息 --global 全局

  ```
  git config --global user.name <用户名>
  git config --global user.email <邮箱地址>
  ```

- 比较当前文件和暂存区中文件的差异，显示没有暂存起来的更改

  `git diff`

- 比较两个分支之间的差异

  `git diff <分支名称> <分支名称>`

- 将远程仓库所有分支的最新版本全部取回到本地

  `git fetch <远程仓库的别名>`

- 初始化本地仓库，在当前目录下生成 .git 文件夹

  `git init`

- 打印所有的提交记录

  `git log`

- 打印指定数量的最新提交的记录

  `git log -<指定的数量>`

- 把指定的分支合并到当前所在的分支下，并自动进行新的提交

  `git merge <分支名称>`

- 重命名文件或者文件夹

  `git mv <源文件/文件夹> <目标文件/文件夹>`

- 从远程仓库获取最新版本

  `git pull`

- 把本地仓库的分支推送到远程仓库的指定分支

  `git push <远程仓库的别名> <本地分支名>:<远程分支名>`

- 删除指定的远程仓库的分支

  ```
  git push <远程仓库的别名> :<远程分支名>
  git push <远程仓库的别名> --delete <远程分支名>
  ```

- 将 HEAD 的指向改变，撤销到指定的提交记录，文件未修改

  `git reset <commit ID>`

- 生成一个新的提交来撤销某次提交，此次提交之前的所有提交都会被保留

  `git revert <commit ID>`

- 移除跟踪指定的文件/文件夹，并从本地仓库的文件夹中删除

  `git rm -r <文件路径>`

- 查看本地仓库的状态

  `git status`

- 打印所有的标签

  `git tag`

- 添加轻量标签，指向提交对象的引用，可以指定之前的提交记录

  `git tag <标签名称> [<commit ID>]`

- 切换到指定的标签

  `git checkout <标签名称>`

- 删除指定的标签

  `git tag -d <标签名称>`

- 将指定的标签提交到远程仓库

  `git push <远程仓库的别名> <标签名称>`

- 将本地所有的标签全部提交到远程仓库

  `git push <远程仓库的别名> –tags`

- 本地修改数据抛弃

  ```
  git stash
  git stash drop
  ```

- 创建 submodule

  `git submodule add <submodule_url>`

- 获取 submodule

  ```
  一种方式是在克隆主项目的时候带上参数 --recurse-submodules

  一种可行的方式是，在当前主项目中执行：
  git submodule init & git submodule update
  ```

- 删除全局配置

  `git config --global --unset user.name`

- 删除局部配置

  `git config --unset user.name`

- 本地合并 commitID

  ```
  # 查看前10个commit
  git log -10
  # 从版本库恢复文件到暂存区，不改动工作区的内容
  git reset --soft 295ac3b842b4ecb6eff1c9954a281a4606a8bc84 # 别人改的commitID
  # add已经跟踪的文件
  git add -u
  # 提交
  git commit -m "修改信息"
  # 强制push以替换远程仓的commitID
  git push --force
  ```

- 分支基于rebase合并

  ```
  git pull = git fetch + git merge
  分支合并 dev 合并 到 master

  1. 切换到master 拉取最新代码 git pull
  2. 基于master调整 git rebase master
  3. 根据提示处理
  3.1 没有改变 可以进行跳过
    提示信息：NOCHANGE ...
    操作：git rebase skip
  3.2 有冲突 解决冲突 提交
    提示信息： CONFLICT ...
    操作：1. 解决冲突
      2. 提交 git add .
      3. 提交注释 git commit xxx
      4. 查看状态 git status
      5. 继续 git rebase --continue
  4. 推送 git push

  5. 基于分支下某文件夹、文件合并 new_branch 合并 old_branch
  5.1 git checkout old_branch
  5.2 git pull
  5.3 git checkout new_branch
  5.4 git pull
  5.5 git checkout old_branch dir/file
  ```

- 删除某次提交

  ```
  # 查询提交日志
  git log -10
  # 基于某个版本tag开始调整
  git rebase -i xxxxxxx
  # 删除某次提交
  pick -> drop
  # 出现 no branch 问题执行
  git rebase --continue
  ```

- 移除提交内容，如提交大文件无法上传，需要将其移除

  ```
  # 移除文件
  git filter-branch -f --index-filter 'git rm --cached --ignore-unmatch local/1-6/124.mp4'
  ```  

- 设置代理

  ```
  # 查看代理
  git config --global --get http.proxy
  git config --global --get https.proxy
  # 重置代理
  git config --global --unset http.proxy
  git config --global --unset https.proxy
  # 设置代理
  git config --global http.proxy '127.0.0.1:7890'
  git config --global https.proxy '127.0.0.1:7890'

  git config --global http.proxy socks5://127.0.0.1:1080
  git config --global https.proxy socks5://127.0.0.1:1080
  ```

- Git 建议使用提交规范

  ```
  <type>(<scope>): <subject>
  build(package.json): 修改typescript版本到3.4.1

  选择改动类型 (<type>)
  填写改动范围 (<scope>)
  写一个精简的描述 (<subject>)

  ```

  - type

    ```
    type为必填项，用于指定commit的类型，约定了feat、fix两个主要type，以及docs、style、build、refactor、revert五个特殊type，其余type暂不使用。
    ```

    - 主要 type

      > feat: 增加新功能
      >
      > fix: 修复 bug

    - 特殊 type

      > docs 只改动了文档相关的内容
      >
      > style 不影响代码含义的改动，例如去掉空格、改变缩进、增删分号
      >
      > build 构造工具的或者外部依赖的改动，例如 webpack、npm
      >
      > refactor 代码重构时使用
      >
      > revert 执行 git revert 打印的 message

    - 暂不使用 type

      > test 添加测试或者修改现有测试
      >
      > perf 提高性能的改动
      >
      > ci 与 CI(持续集成服务)有关的改动
      >
      > chore 不修改 src 或者 test 的其余修改

  - scope

    ```
    scope也为必填项，用于描述改动的范围，格式为项目名/模块名，例如：node-pc/common rrd-h5/activity，而we-sdk不需指定模块名。如果一次commit修改多个模块，建议拆分成多次commit，以便更好追踪和维护。
    ```

  - git 大文件拉取指定分支

    ```
    首先深度clone项目,只会clone最近提交的分支,体积很小,但只有主分支,其他分支需要另外下载
    $ git clone --depth 1 https://github.com/dogescript/xxxxxxx.git

    切换到项目路径:指定需要下载的其他分支
    $ cd xxxxxxx
    $ git remote set-branches origin 'remote_branch_name'
    $ git fetch --depth 1 origin remote_branch_name
    ```  

<h2 id="c-7-0" class="mh2">Docker & Docker Compose</h2>

- 运行bash应用
    `docker run -it xxxx /bin/bash`

- 查看镜像信息

  `docker iamges / docker image ls`

- 添加标签 (标签起到引用或快捷方式的作用)

  `docker tag destTagImage sourceImage`

- 获取镜像详细信息 -f (返回形式：json)

  `docker inspect imageID`

- 搜索远端仓库中共享的镜像

  ```
  docker search TERM （--automated=false 仅显示自动创建的镜像/ --n0-trunc=false 输出信息不截断显示/ --stars=0 指定仅显示评价为指定星级以上的镜像）
  ep: docker search mysql
  ```

- 删除镜像(-f 强行删除)

  `docker rmi imageID`

- 查看本机上存在的所有容器

  `docker ps -a`

- 创建镜像三种形式

  ```
  基于已有镜像的容器创建/基于本地模板导入/基于Dockerfile创建

  存入和载入镜像

  docker save -o dst.tar(指定输出压缩文件) source1-image:tag source2-image:tag ...

  docker load --input source-image.tar /docker load < source-image.tar
  ```

- 上传镜像

  `docker push NAME[:TAG]`

- 创建容器

  `docker create`

- 启动容器

  `docker start`

- docker run 运行时后台所进行的标注操作

  ```
  . 检查本地是否攒在指定的镜像，不存在就从公有仓库下载
  . 利用镜像创建并启动一个容器
  . 分配一个文件系统，并在只读的镜像层外挂载一层可读写层
  . 从宿主主机配置一个IP地址给容器
  . 执行用户指定的应用程序
  . 执行完毕后容器被终止
  ```

- 启动一个bash终端，允许用户进行交互

  ```
  docker run -it xxx-image /bin/bash
  -t 让docker分配一个伪终端并绑定到容器的标准输入上
  -i 让容器的标注输入保持打开
  退出容器 Ctrl+C / exit
  ```

- 让docker容器在后台以守护态（Daemonized）形式运行 -d

  `docker run -d xxx-image /bin/bash`

- 终止运行中的容器 docker stop

  `docker ps -a -q 查看处于终止状态的容器的id信息`

- 将一个运行态的容器终止，重新启动

  `docker restart xxx-image`

- 进入容器

  `docker exec -ti xxx-image /bin/bash`

- 删除处于终止状态的容器

  ```
  docker rm [options] container [container...]
  -f --force=false 强行终止并删除一个运行中的容器
  -l --link=false 删除容器的连接，但保留容器
  -v --volumes=false 删除容器挂在的数据卷
  ```

- 导出容器

  `docker export container > xxx.tar`

- 导入容器

  `cat xxx.tar | docker import xxx.tar`

- 映射到指定地址的指定端口

  ```
  -P 是允许外部访问容器需要暴露的端口
  docker -p ip:port:containerPort
  ```

- 查看映射端口配置

  `docker port 查看当前映射的端口设置`

- 容器有自己的内部网络和IP地址（使用docker inspect+ 容器id可以获取所有的变量值）

- dockerfile 由一行行命令语句组成，支持以#开头的注释行

  ```
  # 第一行必须指定基于的基础镜像
  FROM ...
  # 维护者信息
  MAINTAINER docker_user <docker_user@email.com>
  # 容器启动时执行命令
  CMD /usr/sbin/nginx
  # FROM 格式为FROM image /image:tag
  第一条指令必须为FROM指令。并且，如果在同一个Dockerfile中创建多个镜像时，可以使用多个FROM指令（每个镜像一次）
  ```

- 二次封装镜像

  ```
  1. 运行镜像 docker run -it xxx:xxx /bin/bash
  2. root@7e7570d0a997:/# 执行相应操作（下载安装等）
  3. 打包镜像 docker commit -m "操作内容" 7e7570d0a997 xxx:xxx
  ```

- docker 无法拉取镜像
  Error response from daemon: Get <https://registry.zhst.com/v2/>: x509: certificate signed by unknown authority

  ```
    修改 /etc/docker/daemon.json
    "insecure-registries" : ["registry.zhst.com"], //添加配置
  ```  

- docker compose

  ```
  # 启动服务 -d 守护进程 后台运行
  docker-compose up -d 
  # 启动指定服务
  docker-compose up -d service_name
  # 停止服务
  docker-compose down
  # 查看服务状态
  docker-compose ps
  # 查看服务日志
  docker-compose logs
  # 查看服务配置
  docker-compose config
  # 查看服务镜像 
  docker-compose images
  ```

<h2 id="c-8-0" class="mh2">CURL</h2>

- post 请求

  ```
    curl 'http://localhost:31080/UserService/Login' \
    -H "Content-Type:application/json" \
    -X POST \
    -d '{"username":"admin","password":"zhst*2020"}' \
    -s | python -m json.tool
  ```

- S3 上传文件

  ```
    # 本地上传文件名称
    file=./vv.tar
    # s3上传文件地址
    objname="vv.tar"
    # s3上传bucket名称
    bucket=public
    # s3地址:port
    url="10.100.3.106:8333"
    # key
    s3Key="bird"
    # secret
    s3Secret="QJ0V11MQDJHYTDHZ3SCIJSKD"
    # 上传文件类型 需要根据文件类型进行调整
    contentType="application/x-compressed-tar"

    resource="/${bucket}/${objname}"
    dateValue=`date -R`
    stringToSign="PUT\n\n${contentType}\n${dateValue}\n${resource}"
    signature=`echo -en ${stringToSign} | openssl sha1 -hmac ${s3Secret} -binary | base64`

    curl -X PUT -T "${file}" -H "Date: ${dateValue}"  -H "Content-Type: ${contentType}" -H "Authorization: AWS ${s3Key}:${signature}" "http://${url}${resource}"

  ```

<h2 id="c-9-0" class="mh2">XShell</h2>

- ctrl + l 清屏
- ctrl + a 光标移到行首
- ctrl + e 光标移到行尾
- ctrl + c 终止当前命令
- ctrl + z 暂停当前命令
- ctrl + r 搜索历史命令
- ctrl + u 删除光标到行首的内容
- ctrl + k 删除光标到行尾的内容
- ctrl + w 删除光标左边的单词
- ctrl + y 粘贴 ctrl + u 或 ctrl + k 删除的内容
- ctrl + t 交换光标左右两边的字符

<h2 id="c-10-0" class="mh2">MySQL</h2>

- 查看数据库sleep连接数及清理

  ```
  # 查看数据库连接数
  SHOW STATUS WHERE `variable_name` = 'Threads_connected';
  # 查看连接详细信息
  SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST;
  # 组装SQL语句 命令Sleep 且 时间大于1s的连接
  SELECT GROUP_CONCAT(CONCAT('KILL ', id) SEPARATOR ';') AS kill_commands
  FROM information_schema.processlist
  WHERE command = 'Sleep' AND time > 1;
  # 根据结果 杀掉所有连接
  KILL 79;KILL 78;KILL 74;KILL 76;KILL 18;KILL 3348;KILL 3346;KILL 4554
  ```

<!-- 目录容器 -->
<div class="mi1">
    <strong>目录</strong>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
            <li style="list-style-type: none;"><a href="#c-1-0">Win 快捷键</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-2-0">Linux 常用命令速查手册</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-3-0">Kubernetes常用命令和操作笔记</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-4-0">Helm</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-5-0">Visual Studio Code</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-6-0">Git 常用命令总结</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-7-0">Docker 常用命令总结</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-8-0">CURL</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-9-0">XShell</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-10-0">MySQL</a></li>
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
      position: fixed; bottom: 240px; right: 10px; width: 240px; height: 320px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; overflow-y: auto; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; font-size: 14px; line-height: 1.15; color: #444; letter-spacing: 0.33px; transition: all 0.3s ease;
    }

</style>

本技术手册将持续更新，欢迎提交Issue和Pull Request
