---
layout: post
title: "MySQL 数据备份"
date:   2024-4-1
tags: 
  - 数据库
comments: true
author: feng6917
---

<!-- more -->

### [目录]

- [直接通过命令备份](#普通备份恢复)
- [利用Cron实现定时备份](#脚本备份)

#### 直接通过命令备份

- 1. 备份

    ```bash
    mysqldump -u root -p123456 --all-databases > /data/mysql/all-databases.sql
    ```

- 2. 恢复

    ```bash
    mysql -u root -p123456 < /data/mysql/all-databases.sql
    ```

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">返回目录</a>
</div>

<hr style="background-color: blue;border: none;height: 10px;opacity: .1;width: 100%" />

#### 利用Cron实现定时备份

- 1. 备份脚本编写

      ```
      #保存备份个数，备份7天数据
      number=7
      #备份保存路径  路径名可自定义
      backup_dir=/root/mmysql/mysqlbackup
      #日期
      dd=`date +%Y-%m-%d-%H-%M-%S`
      #备份工具
      tool=mysqldump
      #用户名
      username=root
      #密码  自己的数据库密码
      password=root
      #将要备份的数据库
      database_name=db_myz
      #host
      host=192.168.23.68
      #port
      port=31506

      #如果文件夹不存在则创建
      if [ ! -d $backup_dir ];
      then
          mkdir -p $backup_dir;
      fi

      #简单写法 mysqldump -u root -p123456 users > /root/mysqlbackup/users-$filename.sql
      #变量写法  本实例采用变量写法，这样增强脚本可移植性、可读性，后期维护时只需修改变量名即可
      $tool -h$host -P$port -u $username -p$password $database_name > $backup_dir/$database_name-$dd.sql

      #写创建备份日志
      echo "创建数据部备份文件 $backup_dir/$database_name-$dd.sql" >> $backup_dir/log.txt

      #找出需要删除的备份
      delfile=`ls -l -crt $backup_dir/*.sql | awk '{print $9 }' | head -1`

      #判断现在的备份数量是否大于$number
      count=`ls -l -crt $backup_dir/*.sql | awk '{print $9 }' | wc -l`

      if [ $count -gt $number ]
      then
        #删除最早生成的备份，只保留number数量的备份
        rm $delfile
        #写删除文件日志
        echo "删除过期本份文件 $delfile" >> $backup_dir/log.txt
      fi
      ```

- 2. 使用 cron 定时执行脚本

      ```
        #service crond start //启动服务
        #service crond stop //关闭服务
        #service crond restart //重启服务
        #service crond reload //重新载入配置
        #service crond status //查看服务状态
        #cron 文件内容
        #0 2 * * * /root/mysql_backup_script.sh
        #cron 执行
        #crontab mysqlRollback.cron
        #cron 状态
        #crontab -l
      ```

<div style="text-align: right;">
    <a href="#目录" style="text-decoration: none;">返回目录</a>
</div>

<hr style="background-color: blue;border: none;height: 10px;opacity: .1;width: 100%" />

#### K8s Cronjob 定时备份

- 全量备份
  > /root/data/scripts 备份脚本的路径

  > /root/data/mysql_data 宿主机上mysql的data目录

  > /root/data/mysql_backup 备份文件夹

  ```
    apiVersion: v1
    kind: CronJob
    metadata:
      namespace: mysql_backup
      name:  full
    spec:
      jobTemplate:
        spec:
          completions: 1
          template:
            spec:
              restartPolicy: Never
              volumes:
                - name: mysql-script
                  hostPath:
                    path: /root/data/scripts
                - name: mysql-backup
                  hostPath:
                    path: /root/data/mysql-backup
                - name: local-time
                  hostPath:
                    path: /etc/localtime
                - name: mysql-data
                  hostPath:
                    path: /root/data/mysql-data
              containers:
                - name: mysqldump-container
                  image: percona/percona-xtrabackup:2.4
                  volumeMounts:
                    - name: mysql-script
                      mountPath: /root/data/scripts
                    - name: local-time
                      mountPath: /etc/localtime
                    - name: mysql-backup
                      mountPath: /root/data/mysql-backup
                    - name: mysql-data
                      mountPath: /var/lib/mysql

                  command:
                    - "sh"
                    - "/root/data/scripts/backup.sh"
      schedule: "0 * * * *"  # 这里为了测试1小时跑一次  正常时每周日跑1次
  ```

参考链接：

- [MySQL 数据库定时备份脚本实例](https://blog.csdn.net/SudongJang/article/details/125444498)
