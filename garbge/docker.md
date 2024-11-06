#### Docker

1. 什么是Docker、容器、镜像？
    <details>
    <summary>Ans</summary>
    Docker 是一个开源的应用容器引擎，让开发者可以打包他们的应用以及依赖包到一个可移植的容器中，然后发布到任何流行的 Linux 机器上，也可以实现虚拟化。容器是完全使用沙箱机制，相互之间不会有任何接口。
    容器技术是轻量级的虚拟化技术，容器之间共享宿主机的内核，容器之间相互隔离，每个容器有自己的文件系统，容器之间进程相互隔离，互不影响。
    镜像是一种轻量级、可执行的独立软件包，用来打包软件运行环境和基于运行环境开发的软件，它包含运行某个软件所需的所有内容，包括代码、运行时、库、环境变量和配置文件。
    </details>

2. Docker 和 虚拟机有啥不同？
    <details>
    <summary>Ans</summary>
    docker 是轻量级的沙盒，在其中运行的只是应用，虚拟机里面还有额外的系统。
    </details>

3. Docker 安全么？
    <details>
    <summary>Ans</summary>
    docker 利用了 Linux 内核中很多安全特性来保证不同容器之间的隔离，并且通过签名机制来对镜像进行验证。大量生产环境的部署证明，docker 虽然隔离性无法与虚拟机相比，但仍然具有极高的安全性。
    </details>

4. 如何清理后台停止的容器？
    <details>
    <summary>Ans</summary>
    docker rm $(docker ps -a -q -f status=exited)
    </details>

5. 如何查看镜像支持的环境变量？
    <details>
    <summary>Ans</summary>
    可以使用 docker run image env 命令
    </details>

6. 当启动容器的时候提示，exec format error? 如何解决？
    <details>
    <summary>Ans</summary>
    exec format error 是因为容器镜像的操作系统和宿主机的操作系统不兼容导致的，比如容器镜像是基于 Linux 的，而宿主机是 Windows，或者容器镜像是基于 64 位的，而宿主机是 32 位的。
    解决方法：

        更换宿主机的操作系统，使其与容器镜像的操作系统兼容。
        更换容器镜像，使其与宿主机的操作系统兼容。
        使用 Docker 的多架构支持，将容器镜像转换为与宿主机的操作系统兼容的格式。

    </details>

7. 本地的镜像文件都存放在哪里？
    <details>
    <summary>Ans</summary>
    在 Linux 系统中，Docker 镜像文件默认存放在 /var/lib/docker 目录下，具体位置在 /var/lib/docker/overlay2 目录下。
    在 Windows 系统中，Docker 镜像文件存放在 C:\ProgramData\Docker\windowsfilter 目录下。
    </details>

8. 如何退出一个镜像bash，而不终止它？
    <details>
    <summary>Ans</summary>
    按 Ctrl+p，后按 Ctrl+q，如果按 Ctrl+c 会使容器内的应用进程终止，进而会使 容器终止。
    </details>

9. 退出容器时自动删除？
    <details>
    <summary>Ans</summary>
    -rm ; docker run -rm -it ubuntu
    </details>

10. 如何批量清理临时镜像文件？
    <details>
    <summary>Ans</summary>
    docker rmi $(docker images -f dangling=true -q)
    </details>

11. docker 镜像应该遵循哪些原则？
    <details>
    <summary>Ans</summary>
    整体上，尽量保持镜像功能上的明确和内容的精简。

        尽量选取满足需求但较小的基础系统镜像
        清理编译生成文件、安装包的缓存等临时文件
        安装各个软件时需要指定准确的版本号，并避免引入不必要依赖
        从安全角度考虑，应用尽量使用系统的库和依赖
        使用dockerfile 创建镜像时，添加.dockerignore或使用干净的工作目录

    </details>

12. 容器退出后，通过docker ps 命令看不到，数据会丢失么？
    <details>
    <summary>Ans</summary>
    容器退出后，数据不会丢失，除非你明确删除了容器。容器退出后，容器内的数据仍然存在，可以通过docker start命令重新启动容器，或者使用docker attach命令重新连接到容器。

    使用 docker ps -a 查看
    </details>

13. 如何停止所有正在运行的容器？
    <details>
    <summary>Ans</summary>
    使用 docker kill $(docker ps -q) 命令
    </details>

14. 如何删除所有正在运行的容器？
    <details>
    <summary>Ans</summary>
    使用 docker rm $(docker ps -q) 命令
    </details>

15. 很多应用容器都是默认后台运行的，怎么查看它们的输出和日志信息？
    <details>
    <summary>Ans</summary>
    使用 docker logs container_id
    </details>

16. 如何在控制容器占用系统资源(CPU、内存)的限制？
    <details>
    <summary>Ans</summary>
    使用 docker run 命令的 -m 或 --memory 参数来限制容器的内存使用量，使用 --cpus 参数来限制容器的 CPU 使用量。
    </details>

17. 仓库、注册服务器、注册索引有什么关系？
    <details>
    <summary>Ans</summary>
    仓库（Repository）是存储镜像的地方，注册服务器（Registry）是存储仓库的服务器，注册索引（Index）是用于搜索和查找仓库的目录。
    </details>

18. 如何更改docker的默认存储设置？
    <details>
    <summary>Ans</summary>
    可以通过修改 Docker 的配置文件来更改默认存储设置。在 Linux 系统中，Docker 的配置文件通常位于 /etc/docker/daemon.json。在 Windows 系统中，Docker 的配置文件通常位于 C:\ProgramData\Docker\config\daemon.json。

    可以使用软连接
    </details>

19. 如何将一台宿主机的 docker 环境迁移到另外一台宿主机?
    <details>
    <summary>Ans</summary>
    可以通过以下步骤将一台宿主机的 Docker 环境迁移到另外一台宿主机：

        备份宿主机的 Docker 数据。可以使用以下命令将 Docker 数据备份到指定目录：
            <pre>
            docker save -o /path/to/backup.tar $(docker images -q)
            </pre>
        
        将备份文件复制到目标宿主机。可以使用 scp 或其他文件传输工具将备份文件复制到目标宿主机。
            <pre>
            scp /path/to/backup.tar user@target-host:/path/to/backup.tar
            </pre>
        
        在目标宿主机上加载备份文件。使用以下命令在目标宿主机上加载备份文件：
            <pre>
            docker load -i /path/to/backup.tar
            </pre>
        
        启动容器。使用以下命令启动容器：
            <pre>
            docker start container_id
            </pre>
        

    </details>
