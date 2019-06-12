# 搭建无服务器架构的网站 (入门)  
This lab is to build a serverless website with Amazon API Gateway and AWS Lambda  
本实验的目的是使用 Amazon API Gateway 和 AWS Lambda 快速搭建一个无服务器网站  

## 搭建 Hello World

1. 新建一个 Lambda 
在AWS控制台打开Lambda服务，点击新建一个Lambda函数
![1](./img/img01.png)
  
2. 输入一个名字，选择开发语言  
观察这里可以使用的开发语言，并选择Python3.7开发语言进行本实验  
选择一个执行角色，先选择Lambda_basic_excution，这个角色可以让Lambda上传Logs到CloudWatch  
![2](./img/img02.png)
然后点击创建函数  

3. 保存Lambda函数  
观察Lambda函数的配置界面：触发器、代码窗口、Lambda权限、角色权限、内存、运行超时时间、并发  
在本实验中，以上配置暂时保持默认值  
![a](./img/imga.png)
![b](./img/imgb.png)

4. 创建API  
在AWS控制，APIGateway服务中，新建一个API
![3](./img/img03.png)  
配置基本信息  
![4](./img/img04.png)

5. 创建一个GET方法
![5](./img/img05.png)
![6](./img/img06.png)
选择GET之后记得点打勾

6. 配置API触发Lambda
这里选择配置较简易的代理集成，并输入Lambda的名称（输入前面的字母就可以下拉选择），完成保存
![7](./img/img07.png)
如果要让API进行数据转换的话，则可以取消代理集成，直接配置转换模版  

7. 部署API
完成前面的步骤之后，API就配置好了，要投入使用还需要将其部署生效
![8](./img/img08.png)
输入部署的“阶段”名字，阶段的意思就是说这个部署的API是什么版本？是测试，开发，还是生产接口，这样以后每次修改，就可以针对不同的阶段进行部署，先开发、测试，然后部署上生产
![9](./img/img09.png)

8. 访问URL
部署完之后，从阶段的界面可以找到访问的URL，这个就是API的URL，用浏览器访问这个URL即会访问到这个API，并且触发Lambda进行响应
![10](./img/img10.png)
打开浏览器访问URL的效果
![11](./img/img11.png)

9. 修改Lambda
回到Lambda的界面，对代码的响应部分进行修改，记得要保存Lambda
![12](./img/img12.png)
刷新并观察浏览器的响应。
![13](./img/img13.png)


## 访问数据库

1. 创建一个 DynamoDB 数据库表  
到AWS控制台的DynamoDB服务界面，创建一个DynamoDB数据库表
![14](./img/img14.png)

2. 命名，并配置主键
给数据库表定义一个名称（跟其他表不要冲突），并设置主键，例如“id”
![15](./img/img15.png)   

1. 数据库中创建记录
为你的数据库表创建一些记录，类似如下
![16](./img/img16.png)
有没留意到，这个数据库创建记录的过程并没有先定义字段，而是新增记录的同时就自动完成了新建字段的过程  

1. 用Lambda访问DynamoDB
在Lambda的代码界面用以下的代码代替原来的代码，注意修改数据库表名称 TableName='your_DynamoDB_name'
```
import json
import boto3
client = boto3.client('dynamodb')

def lambda_handler(event, context):
    response = client.scan(
        TableName='your_DynamoDB_name')
    
    return {
        'statusCode': 200,
        'body': (json.dumps(response, indent=4, ensure_ascii=False))
    }
```
代码替换后的效果如下图，记得保存
![17](./img/img17.png)

5. 刷新浏览器访问  
刷新刚才访问APIGateway的浏览器页面，这时候，你将看到你的整个数据库查询响应以JSON格式返回了
![18](./img/img18.png)
如果报错查询不到数据库，则请检查上面的数据库表名称是否跟你刚才新建的数据库表名一致

## 配置 Lambda 的访问权限  
在前面的步骤中，如果没有配置 Lambda 访问 DynamoDB 的访问权限，实际上是无法访问到数据库的，需要在IAM中新建如下的角色。并且修改Lambda的执行权限为这个新建的角色。可以由IAM管理员统一新建该角色为lambda_access_dynamoDB，然后每位学员只需要修改自己Lambda的执行角色。

1. 创建一个新角色，受信实体选择Lambda  
![20](./img/img20.png)

2. 配置权限策略，配置 AmazonDynamoDBFullAccess 权限和 AWSLambdaBasicExecutionRole  
![21](./img/img21.png)

3. 配置角色的名称，完成新建  
![22](./img/img22.png)

4. 修改Lambda的执行角色，为新建的角色  
![23](./img/img23.png)

## 思考  

* Lambda 的运行内存应该设置多少，是否越大或越小越好？
* 为什么不用设置 CPU ？
* 为什么需要超时时间？
* 什么情况下需要 VPC，Lambda运行在哪？
* Lambda 支持什么开发语言？不在列表上的能支持吗？