## 基于EventBridge实现的AWS DynamoDB Stream消息总线

该代码库展示了如何利用无服务器服务来实现将从[DynamoDB流](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html "DynamoDB流")所触发的更新事件转发到[Amazon EventBridge](https://aws.amazon.com/eventbridge/ "Amazon EventBridge")事件总线，同时利用AWS SQS实现发送失败消息的存储

## 基本架构：

![Architecture](https://github.com/yike5460/SAM/blob/master/img/Architecture.png)

DynamoDB表中的插入，更新和删除等操作通过DynamoDB流捕获，并用于触发AWS Lambda函数或其他后端服务（消费者）。目前单个DynamoDB流分片所能触发的后端服务（消费者）不能超过两个，超出部分将被限流。该代码库利用DynamoDB流触发后端Lambda函数，该Lambda函数捕获流事件并将其发布到Amazon EventBridge事件总线以触发数倍的后端服务（消费者），同时Lambda函数如果在所配置的重试次数之内无法将事件发布到Amazon EventBridge事件总线，它将把消息发送到SQS死信队列，用于后续调查定位。该代码库实现的语言为Python，Java版本可以参考[这里](https://github.com/awslabs/aws-dynamodb-stream-eventbridge-fanout "这里")

## 安装步骤：
在此我们会利用到SAM工具来实现关键服务的模版编排，编译测试和一键部署。[了解什么是SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html "了解什么是SAM")以及如何[安装SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html "安装SAM")

步骤一：
确保您的SAM版本已是最新。
```shell
bash-3.2$ brew upgrade aws-sam-cli
bash-3.2$ sam --version
SAM CLI, version 0.47.0
```
创建您的AWS EventBridge事件总线，这里我们默认名称是fanoutBus
![Create EventBridge](https://github.com/yike5460/SAM/blob/master/img/Create-EventBridge.png)

步骤二：
编译并本地测试，其中的prod.json为模拟DynamoDB流触发Lambda函数传递的event事件，包括数据的插入，更新和删除操作，利用SAM提供的本地镜像我们可以实现FanoutLambda函数的基本功能，event.json为模拟EventBridge传到后端消费服务的event事件，实现ConsumerLambda函数的进一步验证。
```shell
bash-3.2$ sam build
bash-3.2$ sam local invoke "FanoutLambda" -e events/prod.json
bash-3.2$ sam local invoke "ConsumerLambda" -e events/event.json
```
您也可以通过如下命令生成自己的测试文件custom.json
```shell
bash-3.2$ sam local generate-event dynamodb update > events/custom.json
```

步骤三：
创建相应dynamoDB并使能DynamoDB流功能，记录下该DynamoDB流的ARN
![Create-DynamoDB-Stream](https://github.com/yike5460/SAM/blob/master/img/Create-DynamoDB-Stream.png)

准备部署所需参数，该模版包含以下参数：
1. DynamoDBStreamArn（必须），源DynamoDB流的ARN
2. EventBusName（必须），默认为fanoutBus，这里需要跟您之前创建的EventBridge事件总线名称一致
3. EventBridgeMaxAttempt（可选），Lambda将消息发送至EventBridge的重试次数

接下来部署服务，加入-g选项按照提示输入上述的模版参数
```shell
bash-3.2$ sam deploy -g
```
输出如下，其中FanoutDlqUrl为我们所创建的SQS死信队列，FanoutLambdaName为创建的实现消息Fanout的Lambda函数，ConsumerLambdaName为创建的接受EventBridge消息的后端消费服务。该示例中默认创建的EventBridge规则的源是“update.aws.dynamodb"，EventBridge根据该规则源将消息分发到对应的消费者ConsumerLambdaName，您也可以新增例如“update.aws.dynamodb"的规则源来实现将不同的消息分发至其他消费者（如Firehose）。注意我们在fanout.py中我们也留下了部分注释的示例代码供您参考或直接放开来定制EventBridge的规则和目标，实现总线消息基于不同规则向不同消费者服务的分发。
```shell
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Outputs                                                                                                                                                                                   
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Key                 FanoutDlqUrl                                                                                                                                                          
Description         Fanout DLQ URL                                                                                                                                                        
Value               https://sqs.cn-northwest-1.amazonaws.com.cn/<account id>/<lambda name>                                                                                

Key                 FanoutLambdaName                                                                                                                                                      
Description         Fanout Lambda Function Name                                                                                                                                           
Value               <lambda name>

Key                 ConsumerLambdaName                                                                                                                                                                       
Description         Consumer Lambda Function Name                                                                                                                                                            
Value               <lambda name> 
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
```

Successfully created/updated stack - fanout in cn-northwest-1

步骤四：
为了让Lambda能自动创建EventBridge，在上步命令部署完毕后，我们需要更新已部署的Lambda的名为‘FanoutLambdaRolePolicy1’的IAM内联策略（仅测试）
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "events:*",
            "Resource": "*"
        }
    ]
}
```
## 功能测试
尝试在您之前创建的DynamoDB中进行表项的新增，更新或者删除操作，通过Lambda集成的CloudWatch查看DynamoDB流事件是否正常触发到您的FanoutLambda，进一步查看ConsumerLambda的调试输出查看EventBridge的分发消息是否正常到达
![CloudWatch](https://github.com/yike5460/SAM/blob/master/img/CloudWatch.png)

## License
This project is licensed under the Apache-2.0 License.