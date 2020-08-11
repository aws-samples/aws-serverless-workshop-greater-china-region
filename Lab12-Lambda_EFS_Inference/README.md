# Lab 12 Lambda_EFS_Inference Lambda 借助 EFS 实现模型推理
本实验演示 Lambda 函数如何通过 EFS 文件系统挂载大文件，突破自身可用存储空间限制（解压文件不超过250MB 以及 /tmp 容量512MB），实现机器学习推理场景。同时，借助 Provisioned Concurrency 特性，去除函数冷启动，极大提升推理响应时间。

## 架构图
通过 EC2 instance 挂载 EFS 文件系统，并提前安装 Pytorch 框架和预训练模型；之前再将其挂载至 Lambda 函数。Lambda 函数分为 未开启 Provisioned Concurrency 和 开启两个版本。
![image](https://github.com/ilove2git/aws-serverless-workshop-greater-china-region/blob/dev/Lab12-Lambda_EFS_Inference/image/architecture.png)

## 使用 AWS CDK 部署
本 Lab 附带了 Typescript 编写的 CDK 样例在模块主目录下面，按以下步骤即可完整部署： 

1.本地安装 AWS-CDK 与 Typescript
```
npm install aws-cdk -g
npm install typescript -g
```
2.下载此模块代码目录及所有文件

3.进入下载后的模块目录
```
cd Lab12-Lambda_EFS_Inference
```
_注意: 此目录无需单独执行 cdk init 来初始化工程目录，已包含初始化后的工程目录结构和文件_

4.安装目录中package.json文件中包含的模块
```
npm install
```
5.更新 lib/lambda_efsml-stack.ts 文件中将使用的 EC2 keypair 名字

6.配置 CDK 执行环境
```
cdk bootstrap aws://{account_id}/{region} --profile {profileName}
```
7.部署环境
```
cdk deploy --profile {profileName}
```
_部署完成后，脚本将输出如下内容：_
Key  | Value  | Description
---- | ----- | ------  
FuntionwithoutprovisionedConcurr  | arn:aws:lambda:cn-northwest-1:XXX | 未配置 ProvisionedConcurrency 版本
FuntionwithprovisionedConcurr  | arn:aws:lambda:cn-northwest-1:XXX | 已配置 ProvisionedConcurrency 版本
InstancePublicIp  | xxx.xxx.xxx.xxx | EC2 公网 IP 地址
Region  | cn-northwest-1 | 部署区域

8.销毁环境
```
cdk destroy --profile {profileName}
```

## 测试验证
部署完成后，Lambda 函数挂载了预安装 Pytorch 框架和预训练模型的EFS文件系统。其中，Lambda 函数包含两个版本：
* 未配置 ProvisionedConcurrency 版本
* 已配置 ProvisionedConcurrency 版本

我们的测试也将分别调用两个不同版本，一方面，验证通过 Lambda+EFS 完成模型推理的功能；另一方面，比较有无 Provisioned Concurrency 配置的函数调用响应时长；

#### 部署模型介绍
Pytorch 预训练模型链接：[ntsnet-cub200](https://pytorch.org/hub/nicolalandro_ntsnet-cub200_ntsnet/)

1.通过 AWS CLI 调用 Lambda 函数查看推理结果： 
```
$ aws lambda invoke \
    --function-name LambdaEFSMLDemo-LambdaEFSMLExecuteInference17332C2-0546aa45dfXXXXXX \
    --region cn-northwest-1 \
    --cli-binary-format raw-in-base64-out \
    --payload '{"url": "https://upload.wikimedia.org/wikipedia/commons/a/aa/Papageitaucher_Fratercula_arctica.jpg"}' \
    /tmp/return.json 
```
推理使用的图片，一种叫大西洋角嘴海雀的鸟：
![](https://upload.wikimedia.org/wikipedia/commons/a/aa/Papageitaucher_Fratercula_arctica.jpg)  

推理结果输出图片中的鸟属于什么类别：
```
{"bird_class": "106.Horned_Puffin"}
```

2.比较有无 Provisioned Concurrency 配置的函数调用响应时长，以下为两种不同版本下 Lambda 函数执行时长的日志信息:
* 有 Provisioned Concurrency 版本运行时间
```
REPORT RequestId: 014300b5-f874-4939-8f24-8237c6cced48 ** Duration: 2951.29 ms ** Billed Duration: 3000 ms Memory Size: 3008 MB Max Memory Used: 1102 MB
```

* 无 Provisioned Concurrency 版本运行时间
```
REPORT RequestId: 08dcfbcf-6270-45e1-bc66-8ecc7825b535 Duration: 11135.36 ms Billed Duration: 11200 ms Memory Size: 3008 MB Max Memory Used: 596 MB
```

由此可见，Provisioned Concurrency 通过消除 Lambda 冷启动时间，极大地缩减了函数响应延迟。尤其针对于机器学习推理场景，本身EFS挂载、模型和框架加载等多重因素，容易造成环境初始化时间过长。
