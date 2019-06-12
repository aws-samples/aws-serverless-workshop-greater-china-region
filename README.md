## AWS Serverless Workshop Greater China Region

AWS Serverless Workshop for Greater China Region  
AWS 无服务器沉浸日动手实验（中国区）  

* Lab1 搭建无服务器架构的网站 (入门)  
  使用 Amazon API Gateway 和 AWS Lambda 快速搭建一个无服务器网站

* Lab2 EC2 卷快照的生命周期管理  
  使用 Lambda 对 EC2 所挂载的 EBS 进行自动化的快照生命周期管理

* Lab3 DynamoDB stream 写入 Redshift  
  在数据持续写入 DynamoDB 的情况下，以 DynamoDB Stream 触发 Lambda，并通过几种不同方式注入数据到 Redshift。讨论了加载数据到 Redshift 的几种场景的架构。(本实验是开放性的 Lab)

* Lab4 Serverless Web 应用（动静分离）   
  部署一个动静分离的Web应用程序(Wild Rydes)。该应用使用 ReactJS 向用户提供 Web 界面。Global 标准的 Lab 中文化并增加了监控、版本管理与灰度发布的内容。
  
* Lab5 AWS Lambda 预热
  对于 Lambda 冷启动时间比较长的场景进行定时预热的示例

* Lab6 StepFunction (under_construction)

## Lambda 的注意事项

* Lambda 角色权限生效时间的问题  
Lambda 运行一次后，如果在 IAM 中修改了 Lambda 对应的Role 的权限策略，再执行 Lambda 如果还是运行之前那个 Lambda Container 的话，Lambda 的权限改变并不会生效。只有运行新的Container 才会使用新的权限。  
例如：调试 Lambda 时，去 IAM 里面修改了该角色权限，立刻再运行 Lambda 会发现权限没生效。这时候要么等一段时间，即等Lambda 释放 Container，要么随便修改一个配置或代码并保存Lambda ，也就是强制其更新 Container ，再运行的时候新权限就会生效。  


## License Summary

This sample code is made available under the MIT-0 license. See the LICENSE file.
