# 概述

本实验演示如何使用Lambda函数将DynamoDB转储为CSV格式并存储在S3存储桶中。 lambda可以按需手动触发，也可以通过CloudWatch事件定期触发。

官方方法是利用[AWS Data Pipeline](https://docs.aws.amazon.com/datapipeline/latest/DeveloperGuide/dp-template-exportddbtos3.html)，但是AWS Data Pipeline在北京区域和宁夏区域均没有发布。 使用EMR群集将数据导出到Hive table并转换为CSV格式的方式涉及到EMR群集以及Hive external table的创建和维护。
本实验演示了如何使用 DynamoDB API和Lambda 扫描DynamoDB表并将其导出为CSV格式，该方法成本较低，并且不需要基础架构维护工作。

# 步骤一 准备测试数据
```
cd load-data
python MoviesCreateTable.py
python MoviesLoadData.py

## 检查数据大小
aws dynamodb scan --table-name Movies --select "COUNT" --region cn-north-1 --profile cn-north-1
{
    "Count": 4609,
    "ScannedCount": 4609,
    "ConsumedCapacity": null
}

aws dynamodb scan --table-name airport-codes --select "COUNT" --region cn-north-1 --profile cn-north-1
{
    "Count": 54736,
    "ScannedCount": 54736,
    "ConsumedCapacity": null
}

aws dynamodb scan --table-name Orders --select "COUNT" --region cn-north-1 --profile cn-north-1
{
    "Count": 100000,
    "ScannedCount": 100000,
    "ConsumedCapacity": null
}
```

# 步骤一 创建 Lambda函数

本实验使用[serverless framework](https://www.serverless.com/)进行 Lambda 函数的创建

1. 运行下列命令

```
npm install -g serverless
serverless create --template aws-nodejs --path ddb2csv-lambda
cd ddb2csv-lambda
```

2. 拷贝handler.js, serverless.yml, layer/, test-data.json 到 ddb2csv-lambda


# 步骤二 创建 Lambda函数Layer

```
cd layer/nodejs
npm install
```

# 步骤三 部署 Lambda函数

请根据您的环境修改serverless.yml 中的三个参数
```
      inTableName: Movies
      outS3Bucket: s3://solutions-aws-cn/results/Movies
      outFileName: Movies-export.csv
```

```
cd ddb2csv-lambda
# 部署函数
serverless deploy -v --aws-profile cn-north-1 --region cn-north-1
# 可选，如果函数有更新，请执行下面的命令
serverless deploy function -f Ddb2Csv -v --aws-profile cn-north-1 --region cn-north-1
```

# 测试
## 导出之前创建的Movies表
```
## 可根据您的环境修改 test-data.json
{
    "tablename": "Movies",
    "s3bucket": "serverless-hands-on",
    "filename": "Movies-export.csv",
    "action": "dump"
}

## 调用函数
serverless invoke -f Ddb2Csv -l --aws-profile cn-north-1 --region cn-north-1 --path test-data.json
{
    "statusCode": 200,
    "body": {
        "message": "Upload the DynamoDB dump to S3. Your function executed successfully!",
        "input": {
            "tablename": "Movies",
            "s3bucket": "serverless-hands-on",
            "filename": "Movies-export.csv",
            "action": "dump"
        }
    }
}
--------------------------------------------------------------------
2020-08-12 09:16:49.115 (+00:00)	22525c13-3fc2-4c5a-844e-e7138b4dd55a	INFO	Do scanDynamoDB
2020-08-12 09:16:49.699 (+00:00)	22525c13-3fc2-4c5a-844e-e7138b4dd55a	INFO	putting new key year into headers
2020-08-12 09:16:49.720 (+00:00)	22525c13-3fc2-4c5a-844e-e7138b4dd55a	INFO	putting new key info into headers year
2020-08-12 09:16:49.722 (+00:00)	22525c13-3fc2-4c5a-844e-e7138b4dd55a	INFO	putting new key title into headers year,info
2020-08-12 09:16:50.139 (+00:00)	22525c13-3fc2-4c5a-844e-e7138b4dd55a	INFO	Do scanDynamoDB
2020-08-12 09:16:50.661 (+00:00)	22525c13-3fc2-4c5a-844e-e7138b4dd55a	INFO	Do scanDynamoDB
2020-08-12 09:16:51.061 (+00:00)	22525c13-3fc2-4c5a-844e-e7138b4dd55a	INFO	Do scanDynamoDB
2020-08-12 09:16:51.520 (+00:00)	22525c13-3fc2-4c5a-844e-e7138b4dd55a	INFO	Do scanDynamoDB
2020-08-12 09:16:52.059 (+00:00)	22525c13-3fc2-4c5a-844e-e7138b4dd55a	INFO	File Written

## 查询导出的文件
aws s3 cp s3://serverless-hands-on/Movies-export.csv . --profile cn-north-1 --region cn-north-1

## 确认导出数据条数与DynamoDB Table的Item 数量一致
cat Movies-export.csv | wc -l
4609

## 查看样例
head -10 Movies-export.csv
year,info,title
1933,"{""actors"":[""Fay Wray"",""Robert Armstrong"",""Bruce Cabot""],""release_date"":""1933-03-07T00:00:00Z"",""plot"":""A film crew goes to a tropical island for an exotic location shoot and discovers a colossal giant gorilla who takes a shine to their female blonde star."",""genres"":[""Adventure"",""Fantasy"",""Horror""],""image_url"":""http://ia.media-imdb.com/images/M/MV5BMTkxOTIxMDU2OV5BMl5BanBnXkFtZTcwNjM5NjQyMg@@._V1_SX400_.jpg"",""directors"":[""Merian C. Cooper"",""Ernest B. Schoedsack""],""rating"":8,""rank"":3551,""running_time_secs"":6000}",King Kong
....

```


## 5万行数据表导出测试

```
## Sample event, you can put below json in test-data.json
{
    "tablename": "airport-codes",
    "s3bucket": "serverless-hands-on",
    "filename": "airport-codes-export.csv",
    "action": "dump"
}
serverless invoke -f Ddb2Csv -l --aws-profile cn-north-1 --region cn-north-1 --path test-data.json
aws s3 cp s3://serverless-hands-on/airport-codes-export.csv . --profile cn-north-1 --region cn-north-1
cat airport-codes-export.csv | wc -l
   54736
```

## 10万行数据表导出测试

```
## Sample event, you can put below json in test-data.json
{
    "tablename": "Orders",
    "s3bucket": "serverless-hands-on",
    "filename": "Orders-export.csv",
    "action": "dump"
}
serverless invoke -f Ddb2Csv -l --aws-profile cn-north-1 --region cn-north-1 --path test-data.json
aws s3 cp s3://serverless-hands-on/Orders-export.csv . --profile cn-north-1 --region cn-north-1
cat Orders-export.csv | wc -l
   100000
```

# 清理
```
## DyanmoDB tables
aws dynamodb delete-table --table-name Movies --region cn-north-1 --profile cn-north-1
aws dynamodb delete-table --table-name airport-codes --region cn-north-1 --profile cn-north-1
aws dynamodb delete-table --table-name Orders --region cn-north-1 --profile cn-north-1

## S3 files
aws s3 rm s3://serverless-hands-on/Movies-export.csv --profile cn-north-1 --region cn-north-1
aws s3 rm s3://serverless-hands-on/airport-codes-export.csv --profile cn-north-1 --region cn-north-1
aws s3 rm s3://serverless-hands-on/airport-codes-export.csv --profile cn-north-1 --region cn-north-1

## Lambda function
cd ddb2csv-lambda
sls remove --aws-profile cn-north-1 --region cn-north-1
```