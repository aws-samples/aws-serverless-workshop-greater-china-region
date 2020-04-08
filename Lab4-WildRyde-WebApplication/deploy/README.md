# 使用 AWS CDK 部署 Lab4 -- Wild Rydes

## 环境准备

- 安装 Node.js LTS(比如 12.x)
- 安装 AWS CLI，并`configure`你的aws account

## 部署方式

```shell
npm run init # 安装依赖以及初始化cdk
npm run deploy
```

按照[第三步文档](../readme3.md#更新网页应用的配置)中的步骤，将以上部署命令输出的`ServerlessLab4WildRydesStack.WildRydesAPIEndpoint`替换到本地`dist/tutorial/js/config.js`文件中，并用本地文件替换S3 Bucket中的`js/config.js`文件。

## 环境清理
```shell
npm run cleanup
```
**注意**：实验中创建的`serverlesslab4wildrydesst-wildrydesbucket`开头的S3 Bucket以及DynamoDB Table `Rides`也会被删除，如有需要的数据请提前备份。