---
layout: post
title: "企业知识库管理协同软件Confluence搭建"
date:   2024-8-22
tags: 
  - 工具类
comments: true
author: feng6917
---

实战记录Confluence企业Wiki平台部署：从MySQL数据库搭建、Confluence应用部署到软件破解和配置调优的完整技术方案。

<!-- more -->

<h2 id="c-1-0" class="mh1">一、数据库部署和库创建</h2>

- 1.1 # 创建挂载文件夹

    ```
    mkdir -p /data
    mkdir -p /data/mysql
    ```

- 1.2 # 拉取镜像 服务器上已有Mysql镜像可直接使用已有Mysql镜像版本

    ```
    docker pull mysql:5.7 （可替换）
    ```

- 1.3 # 运行镜像 端口可改

    ```
    docker run -itd -p 3306:3306 --name wiki-mysql -e MYSQL_ROOT_PASSWORD=123456 --restart=always --restart=on-failure:1 --oom-score-adj -1000 --privileged=true --log-opt max-size=10m --log-opt max-file=1 -v /data/mysql:/var/lib/mysql  mysql:5.7
    ```

- 1.4 # 连接mysql

    ```
        docker exec -it wiki-mysql bash
        mysql -uroot -p123456
    ```

- 1.5 # 创建数据库

    ```
        create database confluence default character set utf8mb4 collate utf8mb4_unicode_ci;
    ```

- 1.5 # 创建用户并授权

    ```
      # 创建用户
      create user 'confluence'@'%' identified by 'confluence';
      
      # 用户授权
      grant all privileges on `confluence`.* to 'confluence'@'%' identified by 'confluence' with grant option;
      
      grant all privileges on `confluence`.* to 'confluence'@'localhost' identified by 'confluence' with grant option;
      
      # 应用
      flush privileges;
    ```

- 1.6 # 设置隔离等级

    ```
        set global tx_isolation='READ-COMMITTED';
    ```

<h2 id="c-2-0" class="mh1">二、软件部署</h2>

- 2.1 # 拷贝本地 xxx.bin 到服务器
  - <https://www.atlassian.com/software/confluence/download-archives> 官网下载地址

  ```
      scp atlassian-confluence-7.4.6-x64.bin root@ip:/opt/
  ```

- 2.2 # 添加可执行权限&执行

    ```
        chmod +x atlassian-confluence-7.4.6-x64.bin
        ./atlassian-confluence-7.4.6-x64.bin
    ```

- 2.3 # 期间需要输入O、 1、 i、 y 如下图所示
    ![img](../images/2024-8-22/1.png)

- 2.4 # 完成后 浏览器上打开服务器 ip:8090

- 2.5 Language 选择中文
    ![img](../images/2024-8-22/2.png)

- 2.6 选择产品安装 下一步
    ![img](../images/2024-8-22/3.png)

- 2.7 勾选所有扩展功能 下一步
    ![img](../images/2024-8-22/4.png)

- 2.8 复制服务器ID
    ![img](../images/2024-8-22/5.png)

<h2 id="c-3-0" class="mh1">三、软件破解</h2>

- 3.1 拷贝服务器atlassian-extras-decoder-v2-3.4.1.jar 到本地

    ```
        mv /opt/atlassian/confluence/confluence/WEB-INF/lib/atlassian-extras-decoder-v2-3.4.1.jar /root/atlassian-extras-2.4.jar

        scp root@IP:/root/atlassian-extras-2.4.jar ./
    ```

- 3.2 windows 中执行 confluence_keygen.jar 打开破解工具（需安装 jdk）

    ```
        java -jar confluence_keygen.jar
        name 英文随便填 serverID 粘贴复制得服务器ID
    ```

- 3.3 点击.patch 选择atlassian-extras-2.4.jar

- 3.4 点击.gen
    ![img](../images/2024-8-22/6.png)

- 3.5 拷贝生成的atlassian-extras-2.4.jar 到服务器

    ```
        scp atlassian-extras-2.4.jar root@ip:/opt/atlassian/confluence/confluence/WEB-INF/lib/atlassian-extras-decoder-v2-3.4.1.jar
    ```

- 3.6  拷贝MySQL驱动到服务器

    ```
        scp mysqlconnectorjava5.1.44bin.jar root@ip:/opt/atlassian/confluence/confluence/WEB-INF/lib/
    ```

- 3.7 重启confluence

    ```
        停止：sh /opt/atlassian/confluence/bin/stop-confluence.sh
        启动：sh /opt/atlassian/confluence/bin/start-confluence.sh
    ```

- 3.8 登录web页面 localhost:8090 复制授权码并粘贴
    ![img](../images/2024-8-22/7.png)

<h2 id="c-4-0" class="mh1">四、软件配置</h2>

- 4.1 设置您的数据库 选择 我自己的数据库 下一步

- 4.2 数据库类型选择MySQl， 安装类型选择通过字符串 地址如下：

    ```
        jdbc:mysql://ip:port/confluence?useUnicode=true&characterEncoding=utf-8&autoReconnect=true
    ```

- 4.3 输入用户名 密码 测试连接 下一步

- 4.4 加载内容 选择空白站点 下一步

- 4.5 配置用户管理 选择 在Confluence中管理用户与组

- 4.6 配置系统管理员账户  admin@123456

- 4.7 设置成功
    ![img](../images/2024-8-22/8.png)

- 4.8 效果图

  ![img](../images/2024-8-22/9.png)

<h2 id="c-5-0" class="mh1">五、参考资源</h2>

- [Linux搭建confluence企业级WIKI](https://www.dczzs.com/articles/2021/09/14/1631581152758.html)
- [wiki的confluence 8.5.4安装部署](https://blog.csdn.net/weixin_44024436/article/details/135389431)
- [Confluence7.4安装并汉化](https://blog.whsir.com/post-5854.html)
- [Confluence官网下载地址](https://www.atlassian.com/software/confluence/download-archives)
- [为博客添加Gitalk评论插件](https://qiubaiying.github.io/2017/12/19/为博客添加-Gitalk-评论插件/)

<hr aria-hidden="true" style=" border: 0; height: 2px; background: linear-gradient(90deg, transparent, #1bb75c, transparent); margin: 2rem 0; " />

<!-- 目录容器 -->
<div style="position: fixed; bottom: 240px; right: 10px; width: 240px; height: 200px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; overflow-y: auto; font-family: 'roboto', 'Iowan Old Style', 'Ovo', 'Hoefler Text', Georgia, 'Times New Roman', 'TIBch', 'Source Han Sans', 'PingFangSC-Regular', 'Hiragino Sans GB', 'STHeiti', 'Microsoft Yahei', 'Droid Sans Fallback', 'WenQuanYi Micro Hei', sans-serif; font-size: 14px; line-height: 1.15; color: #444; letter-spacing: 0.33px; transition: all 0.3s ease;">
    <strong>目录</strong>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: none;">
            <li style="list-style-type: none;"><a href="#c-1-0">一、数据库部署和库创建</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-2-0">二、软件部署</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-3-0">三、软件破解</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-4-0">四、软件配置</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
            <li style="list-style-type: none;"><a href="#c-5-0">五、参考资源</a></li>
            <ul style="padding-left: 15px; list-style-type: none;"></ul>
        </ul>
</div>

本技术手册将持续更新，欢迎提交Issue和Pull Request

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

</style>
