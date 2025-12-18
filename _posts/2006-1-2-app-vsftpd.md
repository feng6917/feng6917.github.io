---
layout: post
title: "ftp服务器软件 vsftpd 搭建"
date:   2024-4-1
tags: 
  - 软件类
comments: true
author: feng6917
---

vsftpd 是“very secure FTP daemon”的缩写，是一个完全免费的、开放源代码的ftp服务器软件。特点是：非常高的安全性需求、带宽限制、良好的可伸缩性等。

<!-- more -->

<h2 id="c-1-0" class="mh1">一、安装部署</h2>

```shell
[root@k8s-master-7 ~]# rpm -qa | grep vsftpd
```

```
[root@k8s-master-7 ~]# systemctl status vsftpd
Unit vsftpd.service could not be found.
```

1. 在本地拷贝 vsftpd 到服务器 [vsftpd 下载链接](<http://rpmfind.net/linux/rpm2html/search.php?query=vsftpd(x86-64)>) (已提供离线安装包)

    ```
    $ scp vsftpd-3.0.2-28.el7.x86_64.rpm root@10.0.0.7:/root/
    root@10.0.0.7's password:
    vsftpd-3.0.2-28.el7.x86_64.rpm                100%  172KB  11.3MB/s   00:00

    ```

2. 开始安装

    ```
    [root@k8s-master-7 ~]#  rpm -ivh vsftpd-3.0.2-28.el7.x86_64.rpm
    警告：vsftpd-3.0.2-28.el7.x86_64.rpm: 头V3 RSA/SHA256 Signature, 密钥 ID f4a80eb5: NOKEY
    准备中...                          ################################# [100%]
    正在升级/安装...
        1:vsftpd-3.0.2-28.el7              ################################# [100%]

    [root@k8s-master-7 ~]# systemctl start vsftpd
    ```

3. 查看状态

    ```
    [root@k8s-master-7 ~]# systemctl status vsftpd
    ● vsftpd.service - Vsftpd ftp daemon
        Loaded: loaded (/usr/lib/systemd/system/vsftpd.service; disabled; vendor preset: disabled)
        Active: active (running) since 一 2023-03-20 17:27:19 CST; 19s ago
        Process: 210253 ExecStart=/usr/sbin/vsftpd /etc/vsftpd/vsftpd.conf (code=exited, status=0/SUCCESS)
    Main PID: 210255 (vsftpd)
        Tasks: 1
        Memory: 576.0K
        CGroup: /system.slice/vsftpd.service
                └─210255 /usr/sbin/vsftpd /etc/vsftpd/vsftpd.conf

    3月 20 17:27:18 k8s-master-7 systemd[1]: Starting Vsftpd ftp daemon...
    3月 20 17:27:19 k8s-master-7 systemd[1]: Started Vsftpd ftp daemon.
    ```

4. 查看 ftp 监听端口

    ```
    [root@k8s-master-7 ~]# netstat -antup | grep ftp
    tcp6       0      0 :::21                   :::*                    LISTEN      210255/vsftpd
    ```

<h2 id="c-2-0" class="mh1">二、软件配置</h2>

1. 添加用户(用户可自定义，符合命名规则即可)

    ```
    [root@k8s-master-7 ~]# adduser ftpzhst
    ```

2. 修改用户密码

    ```
    [root@k8s-master-7 ~]# passwd ftpzhst
    更改用户 ftpzhst 的密码 。
    新的 密码：
    无效的密码： 密码包含用户名在某些地方
    重新输入新的 密码：
    passwd：所有的身份验证令牌已经成功更新。

    ps: ftp1111 可自定义设置
    ```

3. 创建一个供 ftp 服务使用的文件目录(文件目录可自定义)

    ```
    [root@k8s-master-7 ~]# mkdir /var/ftpzhst
    ```

4. 更改 ftp 服务目录拥有者为添加的该用户

    ```
    [root@k8s-master-7 ~]# chown -R ftpzhst:ftpzhst /var/ftpzhst
    ```

5. 修改 vsftpd.conf 配置文件, 配置 ftp 服务器为被动模式

    ```
    [root@k8s-master-7 ~]# vim /etc/vsftpd/vsftpd.conf # 使用vim 编辑文件
    ```

    ```
    #除下面提及的参数，其他参数保持默认值即可。

    #修改下列参数的值：
    #禁止匿名登录FTP服务器。
    anonymous_enable=NO
    #允许本地用户登录FTP服务器。
    local_enable=YES
    #监听IPv4 sockets。
    listen=YES

    #在行首添加#注释掉以下参数：
    #关闭监听IPv6 sockets。
    #listen_ipv6=YES

    #!!! 在配置文件的末尾添加下列参数：
    #设置本地用户登录后所在目录。
    local_root=/var/ftpzhst
    #全部用户被限制在主目录。
    chroot_local_user=YES
    #启用例外用户名单。
    chroot_list_enable=YES
    #指定例外用户列表文件，列表中用户不被锁定在主目录。
    chroot_list_file=/etc/vsftpd/chroot_list
    #开启被动模式。
    pasv_enable=YES
    allow_writeable_chroot=YES
    #本教程中为Linux实例的公网IP。
    pasv_address=<FTP服务器公网IP地址>
    #设置被动模式下，建立数据传输可使用的端口范围的最小值。
    #建议您把端口范围设置在一段比较高的范围内，例如60000~65535，有助于提高访问FTP服务器的安全性。
    pasv_min_port=<port number>
    #设置被动模式下，建立数据传输可使用的端口范围的最大值。
    pasv_max_port=<port number>
    ```

6. 创建 chroot_list 文件，并在文件中写入例外用户名单

    ```
    [root@k8s-master-7 ~]# vim /etc/vsftpd/chroot_list # 使用vim 编辑文件
    ```

7. 运行命令重启 vsftpd 服务

    ```
    [root@k8s-master-7 ~]# systemctl restart vsftpd.service
    ```

---

<!-- 目录容器 -->
<div class="mi1">
    <strong>目录</strong>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
            <li style="list-style-type: none;"><a href="#c-1-0">一、安装部署</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-2-0">二、软件配置</a></li>
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
      position: fixed; bottom: 240px; right: 10px; width: 240px; height: 100px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; overflow-y: auto; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; font-size: 14px; line-height: 1.15; color: #444; letter-spacing: 0.33px; transition: all 0.3s ease;
    }

</style>

本技术手册将持续更新，欢迎提交Issue和Pull Request
