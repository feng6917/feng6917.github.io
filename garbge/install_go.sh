# 下载最新 Go 版本 (替换为实际需要版本)
GO_VERSION="1.17.6"
#wget https://golang.org/dl/go${GO_VERSION}.linux-amd64.tar.gz

# 解压到 /usr/local
sudo tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz

# 设置环境变量
echo 'export PATH=$PATH:/usr/local/go/bin' | sudo tee -a /etc/profile
echo 'export GOPATH=$HOME/go' | sudo tee -a /etc/profile
echo 'export PATH=$PATH:$GOPATH/bin' | sudo tee -a /etc/profile

# 立即生效
source /etc/profile

# 验证安装
go version
