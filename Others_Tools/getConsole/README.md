# getConsole
  
该示例工具调用本机 AWS Profile 委派一个临时用户12小时，并直接打开访问 console  
命令：`./getConsole.sh [<service-name>] <profile>`
  
## 三种使用方式示例
* 用默认 profile(default) 打开控制台  
```
./getConsole.sh
```
* 用指定的 profile 打开控制台，以下示例指定 profile 名为 iad  
```
./getConsole.sh iad
```
* 用指定的 profile 打开控制台访问某个服务，以下示例指定 profile 名为 iad 访问 S3 控制台  
```
./getConsole.sh s3 iad
```
## 读取的 AWS Profile 位置
```
~/.aws/config
~/.aws/credentials
```
## 文档
临时Token原理和示例参考官方文档：
https://docs.aws.amazon.com/zh_cn/IAM/latest/UserGuide/id_roles_providers_enable-console-custom-url.html#STSConsoleLink_programPython