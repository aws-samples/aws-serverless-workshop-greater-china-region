# lambda-pc-test

本项目用于测试Lambda的预配置并发功能，以及结合Autoscaling实现预配置并发的自动扩展
- PCTestFunction/src/main - Lambda 函数代码.
- events - 本地测试用的输入事件.
- PCTestFunction/src/test - 单元测试. 
- template.yaml - AWS资源定义模版.

由于本程序主要是测试预配置并发，函数本身没有具体业务逻辑通过sleep模拟执行过程，核心部分在template.yaml 通过本文
可以了解如果通过SAM配置预配置并发，以及如何与AutoScaling结合使用，具体相见博客。

## 部署应用程序

无服务器应用程序模型命令行接口 （SAM CLI） 是 AWS CLI 的扩展，它增加了用于构建和测试 Lambda 应用程序的功能。它使用 Docker 在与 Lambda 匹配的 Amazon Linux 环境中运行函数。它还可以模拟应用程序的生成环境和 API。

要使用 SAM CLI，您需要以下工具。

* SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
* Java8 - [Install the Java SE Development Kit 8](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)
* Maven - [Install Maven](https://maven.apache.org/install.html)
* Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)

若要首次生成和部署应用程序，请在 shell 中运行以下内容：

```bash
sam build
sam deploy --guided
```

第一个命令将生成应用程序的源。第二个命令将打包并部署到 AWS，并包含一系列提示：

* **Stack Name**: 要部署到Cloudformation的堆栈的名称。这是您的帐户和地区的唯一，可以使用您的项目名称。
* **AWS Region**: 要将应用部署到的 AWS 区域。
* **Confirm changes before deploy**: 如果设置为"是"，则在执行之前将显示任何更改集，供手动审阅。如果设置为"否"，AWS SAM CLI 将自动部署应用程序更改。
* **Allow SAM CLI IAM role creation**: 许多 AWS SAM 模板（包括本示例）创建 AWS Lambda 功能访问 AWS 服务所需的 AWS IAM 角色。默认情况下，这些权限范围将归结为所需的最低权限。要部署创建或修改 IAM 角色的 AWS 云表单堆栈，必须CAPABILITY_IAM"功能"的"安全"值。如果未通过此提示提供权限，则要部署此示例，必须显式将"-CAPABILITY_IAM"传递给"sam 部署"命令。
* **Save arguments to samconfig.toml**: 如果设置为"是"，您的选择将保存到项目内的配置文件中，以便将来只需重新运行"sam 部署"，而无需参数即可将更改部署到应用程序。

同时也可以使用如下命令实现本地Lambda测试：                                                                                                                                            
     
 `sam local invoke` 命令.

```bash
lambda-pc-test$ sam local invoke PCTestFunction --event events/event.json
```

The SAM CLI 还可以模拟应用程序API调用. 使用 `sam local start-api` 在本地端口 3000上运行API.

```bash
lambda-pc-test$ sam local start-api
lambda-pc-test$ curl http://localhost:3000/
```

The SAM CLI 使用如下配置定义了API的路由路径，以及调用方法.

```yaml
      Events:
        HelloWorld:
          Type: Api
          Properties:
            Path: /hello
            Method: get
```

## 查看Lambda日志

为了简化问题调试, SAM CLI 提供了 `sam logs`命令. `sam logs` 查看日志信息.

`NOTE`: 此命令适用于所有 AWS Lambda 函数;不只是您使用 SAM 部署的函数.

```bash
lambda-pc-test$ sam logs -n PCTestFunction --stack-name lambda-pc-test --tail
```

更多信息参考 [SAM CLI Documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-logging.html).

## 单元测试

测试 `PCTestFunction/src/test` 

```bash
lambda-pc-test$ cd PCTestFunction
PCTestFunction$ mvn test
```

## 删除资源

若要删除您创建的示例应用程序，请使用 AWS CLI。假设您对堆栈名称使用了项目名称，您可以运行以下操作：

```bash
aws cloudformation delete-stack --stack-name lambda-pc-test
```

## 相关资源

SAM介绍与使用 [AWS SAM developer guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html) 

AWS Serverless应用程序仓库介绍 [AWS Serverless Application Repository main page](https://aws.amazon.com/serverless/serverlessrepo/)
