# 使用 AWS CDK 部署 Lab6 -- 无服务器化的抽奖程序

## 环境准备

- 安装 Node.js LTS(比如 12.x)
- 安装 AWS CLI，并`configure`你的aws account

## 部署方式

```shell
npm i && npx cdk bootstrap  # 安装依赖以及初始化cdk toolkit
npx cdk deploy
```

为SNS通知创建邮件订阅
```shell
npx cdk deploy -c notifyEmail=name@domain.com
```

## 环境清理
```shell
npx cdk destroy
```