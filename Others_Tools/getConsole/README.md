
该工具示例是在AWS委派一个临时用户12小时，生成URL并直接打开访问console。  

3种使用方式：
* 用默认profile打开控制台  
```
./getConsole.sh
```
* 用指定的profile打开控制台，以下示例指定profile名为iad  
```
./getConsole.sh iad
```
* 用指定的profile打开控制台访问某个服务，以下示例指定profile名为iad访问S3控制台  
```
./getConsole.sh s3 iad
```

临时Token原理和示例参考官方文档：
https://docs.aws.amazon.com/zh_cn/IAM/latest/UserGuide/id_roles_providers_enable-console-custom-url.html#STSConsoleLink_programPython