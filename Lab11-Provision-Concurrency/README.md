# lambda-pc-test

本项目用于测试Lambda的预配置并发功能，以及结合Autoscaling实现预配置并发的自动扩展,具体细节[参考博客](https://amazonaws-china.com/cn/blogs/china/introduction-to-lambda-pre-configured-concurrency/)
- PCTestFunction/src/main - Lambda 函数代码.
- events - 本地测试用的输入事件.
- PCTestFunction/src/test - 单元测试. 
- template.yaml - AWS资源定义模版.

由于本程序主要是测试预配置并发，函数本身没有具体业务逻辑通过sleep模拟执行过程，核心部分在template.yaml 通过本文
可以了解如果通过SAM配置预配置并发，以及如何与AutoScaling结合使用，具体相见博客。



## 测试步骤
* 下载代码
* 使用apache ab 实现压力测试，来模拟用户请求压力
* 添加预配置并发，然后再次测试
* 对比ab测试数据，分析X-Ray监控数据

## 部署应用程序
* 步骤 1 – 初始化项目 sam init
* 步骤 2 – 构建应用程序 cd lambda-pc-test,  /sam build
* 步骤 3 -部署应用程序 sam deploy —guided


## 压力测试
通过Apache AB 测试：
ab -n 1000 -c 50 https://xxxxx.xxx.amazonaws.com/Prod/pctest //api地址需要根据实际替换