## 通过Lambda实现实时用户行为数据采集，并通过Personalize实现实时推荐

该代码库展示了如何通过Lambda集成Kinesis进行数据的采集接入，同时通过Lambda实现点击数据实时导入到Personalize数据集，用于实现推荐。

## 基本架构：

![Architecture](https://github.com/VerRan/aws-serverless-workshop-greater-china-region/blob/master/Lab11-Kinesis-Lambda-Personalize/img/arhitecture.png)

DynamoDB表中的插入，更新和删除等操作通过DynamoDB流捕获，并用于触发AWS Lambda函数或其他后端服务（消费者）。目前单个DynamoDB流分片所能触发的后端服务（消费者）不能超过两个，超出部分将被限流。该代码库利用DynamoDB流触发后端Lambda函数，该Lambda函数捕获流事件并将其发布到Amazon EventBridge事件总线以触发数倍的后端服务（消费者），同时Lambda函数如果在所配置的重试次数之内无法将事件发布到Amazon EventBridge事件总线，它将把消息发送到SQS死信队列，用于后续调查定位。该代码库实现的语言为Python，Java版本可以参考[这里](https://github.com/awslabs/aws-dynamodb-stream-eventbridge-fanout "这里")

## 配置步骤：
* personalize配置
* kinesis配置
* lambda开发，实现流数据的接收，并同步到Kinesis的 Event trackers
* lambda部署

### Personalize配置：
* 参考 ![personalize入门](https://docs.aws.amazon.com/personalize/latest/dg/getting-started-console.html)
* 配置支持实时数据，创建Event trackers来实现实时数据的采集，参考 ![Event Trackers](https://docs.aws.amazon.com/personalize/latest/dg/recording-events.html)

### Kinesis配置：
* 配置kinesis 收集用户行为数据，![Kinesis 配置](https://docs.aws.amazon.com/streams/latest/dev/amazon-kinesis-streams.html)
* Kinesis创建完成后，可以通过 test/java/sendClickToKinesis.py 来测试实时消息发送，这里需要注意替换 kinesis的流名称

### lambda开发：
* 接收kinesis流事件数据，这里需要注意默认kiensis的数据是经过base64编码的，因此需要先解码
* 如果行为数据与personalize event tracker中配置的schema不通的话可以在lambda中转换
* 将转换后的数据发送到personalize
* 代码实现细节详见 src/main/com/sample/ClickStreamProcess.java

### lambda部署：
方法1
* 可以在项目目录下执行 mvn package 
* 然后将打包后的jar包，通过 lambda console 直接上jar包，并配置 入口类为com.sample.ClickStreamProcess::ClickStreamProcess
* 配置lambda 触发器为Kinesis
* lambda 执行角色需要增加Personalize的权限

方法2
* 通过SAM 定义事件源头，以及权限等
* sam build 打包应用
* sam deploy 发布应用