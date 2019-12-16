# 在中国区配合 Jenkins 和 CodeBuild，codeDeploy 实现 Lambda 的自动化发布与部署

本文使用 Jenkins 结合 CodeBuild, CodeDeploy 实现 Serverless 的 CI/CD 工作流，用于自动化发布已经部署 lambda 函数。
在 AWS 海外区，CI/CD 工作流可以用 codepipeline 这项产品来方便的实现，由于中国区暂时未发布此款产品，此文采用 [Jenkins](https://jenkins.io/zh/) 做替代方案管理 CICD 工作流。

本文在此所涵盖的所有产品在中国区都可以使用。

## CICD 基本概念

- 持续集成( Continuous Integration,简称CI ) 是指在应用代码的新组件集成到共享存储库之后自动测试和构建软件的流程。这样一来，就可以打造出始终处于工作状态的应用“版本”。
- 持续交付( Continuous Deployment, 简称CD )是指将CI流程中创建的应用交付到类似生产环境的过程，在该过程中将对应用进行额外的自动化测试，以确保应用在部署到生产环境以及交付到真实用户手中时能够发挥预期作用。

## 架构综述
本文最终达到的效果为，源代码在 Github repo 中，每当有新的 commit，将自动触发 Jenkins CICD 工作流，Jenkin 会利用 CodeBuild 做构建，以及CodeDeploy 自动部署发布 lambda 新版本。

## 前提条件
- 本文基于 AWS China 北京区 (**cn-north-1**), 如果您希望在宁夏区，请自行替换代码中所有 region code 为 **cn-northwest-1** 。
- 请先启动一台 EC2 Linux Server 作为 jenkins server。**确保此 EC2 的安全组允许 22 端口与 8080 端口开放**。

## 具体步骤
本文基于 **Amazon Linux 2 AMI** 安装，```java -version``` 为 ```openjdk version "1.8.0_201"```

### 步骤一：搭建配置 Jenkins Server

0. 配置权限 
   登录到 EC2 实例中，执行以下命令。
   ```
   # 如果使用 Amazon linux 系统，AWSCLI 已经自动安装；如果没有，则需要运行下列命令手动安装 AWSCLI
   #  pip install awscli
   aws configure 
   # 配置 AWS AKSK credentials
   ```
   有关于从哪里获取 AKSK 相应信息，请参考[管理访问秘钥](https://docs.aws.amazon.com/zh_cn/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_CreateAccessKey)
   此 AKSK 至少应当有更新、部署 lambda 函数, s3 基本权限, CodeBuild 以及 CodeDeploy 的权限

1. 安装 Jenkins      
   ```
   sudo yum install java
   # 此为官方镜像
   sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
   sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io.key
   sudo yum install jenkins
   sudo chkconfig jenkins on
   sudo service jenkins start
   ``` 
   
   查看 Jenkins 初始密码
   ```
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```   
   
1. 登录 Jenkins   
   在浏览器输入输入EC2的公网IP地址（如果想保持此实例 ip 固定，最好提前绑定一个 [弹性EIP](https://docs.aws.amazon.com/zh_cn/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html) 固定 ip），比如3.213.113.xx:8080，然后出现如下界面，输入上面得到的默认密码。
   ![](img/jenkins-initial.png)

   选择 **安装推荐插件**
   ![](img/get-started.png)

   配置用户
   ![](img/create-username.png)

   Jenkins setup 完成。
   ![](img/jenkins-ready.png)

1. Github 生成 access token

   进入自己的 Github 地址，在 setting - developer setting 当中，新生成一个 GitHub token，用于 Jenkins 访问 GitHub。记录下生成的token字符串，比如： bf6adc27311a39ad0b5c9a63xxxxxxxxxxxxxx 用于后续配置。
   ![](img/generate-token.png)

   Payload URL设置Jenkins Server的地址（如 3.213.113.xx:8080） 。

1. 点击“Add Webhooks”

   创建或者选择一个 public repository，用于放置用于后续 lambda 函数部署的源码，点击 Settings 配置 webhooks。
   ![](img/settings-webhook.png)

   右侧点击 **add webhook**
   
   在Payload URL，输入 ```http://EC2公网IP地址/github-wekhook/```  
   ![](img/webhook.png)

1. Jenkins 配置

   进入系统配置
   ![](img/configure-system.png)

   添加权限
   ![](img/add-credentials.png)

   选择类型为 **secret text**，输入刚才从 Github 生成的 Access Token，点击“添加”。
   ![](img/add-access-token.png)

   点击 **test connection** 测试链接，没有报错说明配置成功。
   ![](img/test-connection.png)


### 步骤二：新建 lambda 函数
新建基于 python 的 lambda 函数。此 lambda 函数为我们的目标 lambda 函数，在本实验完成后，每当有新的 commit，都会触发此 lambda 函数进行自动化部署。
如您不清楚步骤，请参考[创建您的第一个 Lambda 函数](https://github.com/aws-samples/aws-serverless-workshop-greater-china-region/blob/master/Others_Beginner_Labs/lab1.md) 
此文重在搭建 CICD 流水线，代码会直接用默认生成的 python 代码 lambda_function.py。

publish 此 lambda，版本为1，并且创建别名（alias）。

除此以外，还需要添加另外两个文件 
- [appspec.template.yaml](appspec.template.yaml), 用于 codedeploy 配置文件。请将此文件当中的函数名以及 alias（别名）替换为自己对应的值。
- [buildspec.yml](buildspec.yml)，用于 codebuild 配置文件，修改替换文件中尖括号标注部分（去掉尖括号）。

### 步骤三：配置 CodeBuild
点击跳转至 [CodeBuild 控制台](https://console.amazonaws.cn/codesuite/codebuild/projects?region=cn-north-1)，点击 **create build project** （创建构建项目）。

项目名称任选，如 **jenkins-build**，源设置为 Github，填自己的 repo 链接以及刚才从 Github 生成的 Access Token。
![](img/codebuild-add-source.png)

环境设置如下
![](img/codebuild-OS.png)

如果您是第一次使用 codebuild, 直接选择 **新服务角色**；如果您已经有 codebuild 角色，点击 **现有服务角色** 在下拉框中选择对应角色。
![](img/codebuild-role.png)

buildspec 保持默认值： **使用 buildspec 文件** ，以及名称留空即可。
![](img/codebuild-buildspec.png)

构件部分，选择无构件即可。其他部分保持默认值不变，点击 **创建构建项目**

### 步骤四：配置 CodeDeploy
如您希望了解 CodeDeploy 的概念，请参考[AWS CodeDeploy 快速入门](https://aws.amazon.com/cn/blogs/china/getting-started-with-codedeploy/)。以下为具体操作步骤。

先创建一个角色(role) 供 codedeploy 使用，使 codedeploy 能够有更新 lambda 的权限。

新建一个 codeDeploy 应用，选择 lambda 平台，命名为如 ``first-try-with-jenkins``
![](img/create-deploy-application.png)

点击刚刚创建的应用，新建一个 deployment group，同样命名为``first-try-with-jenkins``.
![](img/create-deployment-group.png)

service role 选择刚才创建的 codedeploy 的 role。部署策略，此文以 all at once（全部切换）为例，也可以根据需要选择其他的线性或者金丝雀的部署策略。
![](img/deployment-policy.png)

下一步我们创建一个 Jenkin 的项目，配置 codedeploy 相应信息。

### 步骤五：新建 Jenkins 项目

新建项目之前，先安装 codebuild 的插件。点击 **系统管理** -- **插件管理(plugin)**   
![](img/jenkins-plugin.png)

在可选插件里，选择 **AWS CodeBuild Plugin**    
![](img/jenkins-codebuild-plugin.png)

新建一Jenkins个项目，点击“Create a new project” -- "freestyle project"   
![](img/new-item.png)

配置Github项目的地址，源代码管理选择Git方式。   
![](img/source-github.png)

触发构建，选择 Github hook trigger for GITScm polling   
![](img/add-trigger.png)

添加构建步骤，新增 codebuild 步骤
![](img/add-codebuild-step.png)

配置 AKSK , region, project-name，其他 project source details 因为我们已经在 codebuild 当中配置过，不用填写 override 值。
![](img/codebuild-configuration.png)

### 步骤六：测试效果
提交代码更新到github，此时 codebuild 自动被触发，查看 Jenkins，codebuild 以及 codedeploy 的日志

![](img/jenkins-build-history.png)

点击某个编译，选择 **控制台输出**，成功的日志类似如下：
![](img/jenkins-console-logs.png)

如果失败，请对应着日志提醒查看失败原因。
![](img/jenkins-fail-logs.png)

在 codedeploy的 deploy 列表中，点击某个具体 item 查看。
![](img/codedeploy-history.png)

在 codebuild 中查看日志。
![](img/codebuild-history.png)

![](img/codebuild-detail-log.png)


