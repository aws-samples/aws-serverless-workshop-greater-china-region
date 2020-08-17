## AWS Serverless Workshop for AWS China Region
AWS 无服务器沉浸日动手实验（AWS 中国区）  

* Lab1 搭建无服务器架构的网站（入门）  
  使用 Amazon API Gateway 和 AWS Lambda 快速搭建一个无服务器网站。  
  涉及到的服务有 AWS Lambda，Amazon API Gateway，Amazon Dynamodb，Amazon CloudWatch。

* Lab2 EC2 卷快照的生命周期管理（运维应用）  
  使用 Lambda 对 EC2 所挂载的 EBS 进行自动化的快照生命周期管理。  
  涉及到的服务有 AWS Lambda，Amazon EC2 与 EBS，Amazon CloudWatch Event。  

* Lab3 Amazon S3 自动转换图片格式（Lambda Layer与环境变量）
  利用 Lambda 对 S3 存储桶中新增的图像文件自动进行转码和转换大小  
  涉及服务 Amazon S3, AWS Lambda。利用 Lambda Layer 进行依赖包管理，利用环境变量进行变量管理。  

* Lab4 Serverless Web 应用（网站动静分离，监控与灰度发布）   
  部署一个动静分离的Web应用程序(Wild Rydes)。该应用使用 ReactJS 向用户提供 Web 界面。对 Global 标准的 Wild Rydes Lab 中文化并增加了监控、版本管理与灰度发布的内容。比 Lab1 更深入些。  
  涉及到的服务有 AWS Lambda，Amazon API Gateway，Amazon Dynamodb。
  
* Lab6 无服务器工作流 AWS StepFunction（工作流）  
  利用 AWS StepFunction 工作流服务，打造构建一个无服务器化的抽奖程序。  
  涉及到的服务有 AWS Lambda，Amazon API Gateway，AWS Step Functions，Amazon SNS，Amazon Dynamodb。

* Lab7 通过 AWS LAMBDA 发送微信公众号推送（微信后台）  
  使用无服务器架构 AWS LAMBDA 实现微信通知。涉及到的服务有 AWS Lambda，Amazon SNS。  

* Lab8A 无服务器架构的 CI/CD （持续集成和持续部署）Global Region  
  利用 AWS Code 系列（**codepipeline**，**codecommit**, **codebuild**, **codedeploy**）实现 Serverless 的 CI/CD 工作流。

* Lab8B 无服务器架构的 CI/CD （持续集成和持续部署）China Region  
  在中国区配合 Jenkins 和 AWS CodeDeploy 实现 Lambda 的自动化发布与部署

* Lab9 使用 AWS CDK 创建无服务器短URL应用（基础设施即代码）  
  利用 CDK 部署和更新一个无服务器的应用  
  涉及到的服务有 AWS Lambda，Amazon API Gateway，Amazon Dynamodb，Amazon CloudWatch，Amazon SNS。在 AWS 日常运维中，推荐使用 CDK 进行基础设施管理，CDK 基于 CloudFormation 现已支持大部分的 AWS 服务。

* Lab10 无服务器服务架构下基于Amazon EventBridge的事件分发架构
  利用SAM框架实现将DynamoDB流所触发的更新事件转发到Amazon EventBridge事件总线，同时利用AWS SQS实现发送失败消息的存储
  涉及到的主要服务有AWS Lambda，Amazon EventBridge，Amazon Dynamodb，Amazon SQS

* Lab12 Lambda_EFS_Inference Lambda 借助 EFS 实现模型推理  
  Lambda 函数通过 EFS 文件系统挂载大文件，实现机器学习推理场景。同时，借助 Provisioned Concurrency 特性，去除函数冷启动，极大提升推理响应时间。  
  涉及到的服务有 AWS Lambda，EFS, EC2。

* Lab13 借助 Lambda 函数导出 DynamoDB 表存储为 CSV 格式并存储到 S3 桶
  利用 Lambda 函数扫描 DynamoDB 表并将其导出为 CSV 格式存储到 S3 桶。该方案可用于定时将 DynamoDB 表注入到 S3 数据湖或者导出到基于 CSV 格式的第三方分析服务。该方案采用无服务器的方式，无需 AWS Data Pipeline的创建或者 EMR 群集以及 Hive external table 的创建和维护。
  涉及到的服务有 AWS Lambda，DynamoDB, S3。

* Others Labs  
  与 Lab1 采用类似的无服务器架构，创建您的第一个 AWS LAMBDA 函数，创建 Serverless 架构的调查问卷表单，通过流量转移安全部署 AWS LAMBDA 函数。  
  利用 Lambda 做 Redshift 数据注入。  
  Lambda 预热的范例等(该方式已可通过 Provisioned Concurrency 替代)。  
  
  
以上除了 Lab8A 之外，其他均可在 AWS 中国区进行。  
  
## Lambda 的注意事项

* Lambda 角色权限生效时间的问题  
Lambda 运行一次后，如果在 IAM 中修改了 Lambda 对应的Role 的权限策略，再执行 Lambda 如果还是运行之前那个 Lambda Container 的话，Lambda 的权限改变并不会生效。只有运行新的Container 才会使用新的权限。  
例如：调试 Lambda 时，去 IAM 里面修改了该角色权限，立刻再运行 Lambda 会发现权限没生效。这时候要么等一段时间，即等Lambda 释放 Container，要么随便修改一个配置或代码并保存Lambda ，也就是强制其更新 Container ，再运行的时候新权限就会生效。  


## License Summary

This sample code is made available under the MIT-0 license. See the LICENSE file.
