---
layout: post
title: "一些常见命令记录"
date:   2024-4-1
tags: 
  - 杂七杂八
comments: true
author: feng6917
---

`一些操作命令记录，持续更新`

<!-- more -->

### 目录

- [Win](#win)
- [Linux](#linux)
- [K8s](#k8s)
- [Helm](#helm)
- [Git](#git)
- [Docker](#docker)
- [Git](#git)
- [Visual Studio Code](#visual-studio-code)

#### Win

- 快速锁定电脑
  `win + L`
- 所有窗口展开折叠
  `win + D`
- 切换打开的应用与窗口
  `alt + Tab`
- 打开我的电脑
  `win + E`
- 进入任务管理器
  `ctrl + Alt + Delete`
- 搜索
  `win + Q`
- 中文 简体繁体 切换
  `Ctrl + Shift + F`
- 切换输入法
  `Ctrl + Space`

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

<hr style="background-color: blue;border: none;height: 15px;width: 100%" />

#### Linux

##### 设置时区

- 临时设置  `cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime`

- 同步设置

  ```
    root@ubuntu1804:~# apt install ntpdate

    root@ubuntu1804:~# date 
    Tue Dec 13 15:12:07 CST 2022
    
    root@ubuntu1804:~# date -d '-1 day'
    Mon Dec 12 15:12:22 CST 2022
    
    root@ubuntu1804:~# ntpdate ntp.aliyun.com
    13 Dec 15:12:36 ntpdate[15040]: adjust time server 203.107.6.88 offset 0.002588 sec
    
    root@ubuntu1804:~# date 
    Tue Dec 13 15:12:40 CST 2022  #同步后的时间
  ```

[Linux](#linux)

##### apt常用命令

- apt

  ```
    列出所有可更新的软件清单命令：sudo apt update

    升级软件包：sudo apt upgrade

    列出可更新的软件包及版本信息：apt list --upgradeable

    升级软件包，升级前先删除需要更新软件包：sudo apt full-upgrade

    安装指定的软件命令：sudo apt install <package_name>

    安装多个软件包：sudo apt install <package_1> <package_2> <package_3>

    更新指定的软件命令：sudo apt update <package_name>

    显示软件包具体信息,例如：版本号，安装大小，依赖关系等等：sudo apt show <package_name>

    删除软件包命令：sudo apt remove <package_name>

    清理不再使用的依赖和库文件: sudo apt autoremove

    移除软件包及配置文件: sudo apt purge <package_name>

    查找软件包命令： sudo apt search <keyword>

    列出所有已安装的包：apt list --installed

    列出所有已安装的包的版本信息：apt list --all-versions
  ```

[Linux](#linux)

##### 文件&文件夹常用命令

- 处理目录的常用命令

  ```
    ls（英文全拼：list files）: 列出目录及文件名
    cd（英文全拼：change directory）：切换目录
    pwd（英文全拼：print work directory）：显示目前的目录
    mkdir（英文全拼：make directory）：创建一个新的目录
    rmdir（英文全拼：remove directory）：删除一个空的目录
    cp（英文全拼：copy file）: 复制文件或目录
    rm（英文全拼：remove）: 删除文件或目录
    mv（英文全拼：move file）: 移动文件与目录，或修改文件与目录的名称
  ```

- Linux 文件内容查看

  ```
    # 查询服务器中大于1G的文件
    find / -type f -size +1G

    # 查询服务器中大于1G的文件及属性信息
    find / -type f -size +1G  -print0 | xargs -0 ls -l

    # 查询大文件并排序
    find / -type f -size +1G  -print0 | xargs -0 du -h | sort -nr

    cat  由第一行开始显示文件内容
    tac  从最后一行开始显示，可以看出 tac 是 cat 的倒着写！
    nl   显示的时候，顺道输出行号！
    more 一页一页的显示文件内容
    less 与 more 类似，但是比 more 更好的是，他可以往前翻页！
    head 只看头几行
    tail 只看尾巴几行

    # tail 命令可用于查看文件的内容，有一个常用的参数 -f 常用于查阅正在改变的日志文件。
    tail -f --since 1s logs.txt
  ```

- 拷贝文件

  ```
    # 拷贝本地文件到服务器 可拷贝多个
    scp test root@VM2:/backup

    # 拷贝服务器文件到本地 -r 递归文件夹
    scp -r root@192.168.163.130:/root/ /root

    # 拷贝服务器到另一台服务器
    scp root@192.168.163.128:/root/test3 root@192.168.163.130:/backup/
  ```

- 压缩解压缩文件

  ```
    # 压缩文件(带不带gz取决于带不带z)
    tar -zcvf test.tar.gz ./xxx
    # 解压缩
    tar -zxvf ./test.tar.gz
  ```  

- grep

  ```
    grep -v 排除内容
    grep -B 显示匹配行和之前num行
    grep -A 显示匹配行和之后num行
    grep -C 显示匹配行和前后num行
    grep --color=auto 匹配字符串加色显示
    grep -n 打印行号
    grep -i 不区分大小写
    grep -w 匹配单词
    grep -E 即egrep使用扩展正则表达式
    grep -e 匹配多个模式
    grep -c 匹配到的行数
  ```

[Linux](#linux)

##### 性能相关

- 查看进程&端口

  ```
    # 查找指定进程格式
    ps -ef | grep 进程关键字

    # 杀死进程 强杀 -9
    kill -9 PID

    # 查询端口
      1. 查询所有
      netstat -ntlp
      2. 查询指定 
      losf -i:xxxx
      netstat -tunlp |grep xxxx
    
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
    96

  ```

- 日志输出

  ```
  # shell中可能经常能看到：echo log > /dev/null 2>&1 命令的结果可以通过%>的形式来定义输出
    /dev/null ：代表空设备文件
    >  ：代表重定向到哪里，例如：echo "123" > /home/123.txt
    1  ：表示stdout标准输出，系统默认值是1，所以">/dev/null"等同于"1>/dev/null"
    2  ：表示stderr标准错误
    &  ：表示等同于的意思，2>&1，表示2的输出重定向等同于1
    2>&1 & 将这个（标准输出&错误输出）任务放到后台去执行
  ```

- 空间占用

  ```  
  # 空间使用率
  [root@k8s-master-7 ~]# df ./myz/ -h
  Filesystem               Size  Used Avail Use% Mounted on
  /dev/mapper/centos-root   50G   41G  9.7G  81% /
  
  # 查询文件，文件夹 空间占用
  [root@k8s-master-147 glusterVol]# du -sh model/
  997M model/
  ```

- 系统情况
  - 查看CPU型号

    ```
      [root@k8s-master-253 ~]# dmidecode -s processor-version
      Intel(R) Xeon(R) Gold 6240R CPU @ 2.40GHz
      Intel(R) Xeon(R) Gold 6240R CPU @ 2.40GHz
    ```  

  - 查看内存占用

    ```
      [root@k8s-master-253 ~]# free -h
                    total        used        free      shared  buff/cache   available
      Mem:           251G         51G        151G        1.9G         48G        193G
      Swap:            0B          0B          0B
    ```

  - 查看磁盘分区

    ```
      [root@k8s-master-253 ~]# lsblk
      NAME            MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
      sda               8:0    0 160.1T  0 disk /data_ssd
      nvme0n1         259:0    0 931.5G  0 disk 
      ├─nvme0n1p1     259:2    0   200M  0 part /boot/efi
      ├─nvme0n1p2     259:3    0     1G  0 part /boot
      └─nvme0n1p3     259:4    0   454G  0 part 
        ├─centos-root 253:0    0    50G  0 lvm  /
        ├─centos-swap 253:1    0     4G  0 lvm  
        ├─centos-home 253:2    0   100G  0 lvm  /home
        └─centos-data 253:3    0   300G  0 lvm  /data
      nvme1n1         259:1    0 931.5G  0 disk /data_hdd
    ```  

##### 网络相关

- 查看网络

  ```
  # 查看网络
  [root@k8s-master-253 ~]# ifconfig
  eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
          inet 192.168.0.253  netmask 255.255.255.0  broadcast 192.168.0.255
          inet6 fe80::250:56ff:fe8f:8a6f  prefixlen 64  scopeid 0x20<link>
          ether 52:50:56:8f:8a:6f  txqueuelen 1000  (Ethernet)
          RX packets 4469448  bytes 614670874 (584.7 MiB)
          RX errors 0  dropped 0  overruns 0  frame 0
          TX packets 4469448  bytes 614670874 (584.7 MiB)
          TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
  ```

- 修改网络

  ```
  # 修改网络
  [root@k8s-master-253 ~]# vim /etc/sysconfig/network-scripts/ifcfg-eth0
  TYPE="Ethernet"
  PROXY_METHOD="none"
  BROWSER_ONLY="no"
  BOOTPROTO="static"
  DEFROUTE="yes"
  IPV4_FAILURE_FATAL="no"
  IPV6INIT="yes"
  IPV6_AUTOCONF="yes"
  IPV6_DEFROUTE="yes"
  IPV6_FAILURE_FATAL="no"
  IPV6_ADDR_GEN_MODE="stable-privacy"
  NAME="eth0"
  UUID="b8e6a5c2-9a0d-4c2f-9b6b-9d8f8a6f8a6f" # 修改为eth0的UUID
  DEVICE="eth0"
  # 指定网卡设备是否在系统启动时自动激活
  ONBOOT="yes"
  # IP地址
  IPADDR="192.168.0.253"
  # 掩码
  NETMASK="255.255.255.0"
  # 网关
  GATEWAY="192.168.0.1"
  # DNS
  DNS1="114.114.114.114"
  DNS2="8.8.8.8"
  ```

- 重启网络

  ```
  # 重启网络
  [root@k8s-master-253 ~]# systemctl restart network
  # 启动或者关闭网络
  [root@k8s-master-253 ~]# ifdown ifcfg-eth0 && sudo ifup ifcfg-eth0
  ```

- ntfs 网盘挂载

  ```
  https://www.cnblogs.com/Firlsy/p/17379714.html
  ```

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

<hr style="background-color: blue;border: none;height: 15px;width: 100%" />

#### K8s

- 部署应用

  ```
  kubectl create app.yaml
  kubectl apply -f app.yaml
  kubectl replace -f app.yaml
  ```

- 查看 deployment `kubectl get deployment -A | grep app`

- 编辑 deployment `kubectl edit deployment app`

- 查看 pod `kubectl get pod -o wide`

- 查看 pod 详情 `kubectl describe pod pod-name | grep xxx -A 10`

- 查看 log `kubectl logs pod-name --tail 20`

- 查看所有容器 日志 `kubectl logs <podname> --all-containers`

- 查看Pod里业务容器的命令 `kubectl get pods myapp-pod -o jsonpath={.spec.containers[*].name}`

- 查看pod里某个容器日志 `kubectl logs <podname> -c container-name`

- 进入 Pod 容器终端， -c container-name 可以指定进入哪个容器 `kubectl exec -it pod-name -- bash`

- 伸缩扩展副本 `kubectl scale deployment test-k8s --replicas=5`

- 把集群内端口映射到节点 `kubectl port-forward pod-name 8090:8080`

- 查看历史

  `kubectl rollout history deployment test-k8s`

- 回到上个版本

  `kubectl rollout undo deployment test-k8s`

- 回到指定版本

  `kubectl rollout undo deployment test-k8s --to-revision=2`

- 删除部署

  `kubectl delete deployment test-k8s`

- 查看全部

  `kubectl get all`

- 重新部署

  `kubectl rollout restart deployment test-k8s`

- 命令修改镜像，--record 表示把这个命令记录到操作历史中

  `kubectl set image deployment test-k8s test-k8s=ccr.ccs.tencentyun.com/k8s-tutorial/test-k8s:v2-with-error --record`

- 暂停运行，暂停后，对 deployment 的修改不会立刻生效，恢复后才应用设置

  `kubectl rollout pause deployment test-k8s`

- 恢复

  `kubectl rollout resume deployment test-k8s`

- 输出到文件

  `kubectl get deployment test-k8s -o yaml >> app2.yaml`

- 删除全部资源

  `kubectl delete all --all`

- 创建命名空间

  `kubectl create namespace testapp`

- 部署应用到指定的命名空间

  `kubectl apply -f app.yml --namespace testapp`

- 查询

  `kubectl get pod --namespace kube-system`

- 拷贝本地服务到pod中

  `kubectl cp ./server-name pod-name:/dir-name`

- 查看pod多个容器日志

  ```

  1. 查看指定pod中容器信息
  kubectl -n tidb-cluster get pods basic-tidb-0 -o jsonpath={.spec.containers[*].name}
  2. 查看指定pod 指定容器 日志 -c 置顶容器
  kubectl -n tidb-cluster logs basic-tidb-0 -c tidb

  ```

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

<hr style="background-color: blue;border: none;height: 15px;width: 100%" />

### Helm

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

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

<hr style="background-color: blue;border: none;height: 15px;width: 100%" />

#### Visual Studio Code

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

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

<hr style="background-color: blue;border: none;height: 15px;width: 100%" />

#### Git

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

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

<hr style="background-color: blue;border: none;height: 15px;width: 100%" />

#### Docker

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

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>

<hr style="background-color: blue;border: none;height: 15px;width: 100%" />

#### CURL

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

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">Top</a>
</div>
