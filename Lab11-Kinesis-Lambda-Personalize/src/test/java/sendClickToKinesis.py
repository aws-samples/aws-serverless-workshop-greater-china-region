###用于模拟发送消息到Kinesis
import json
import boto3
import random
import datetime

kinesis = boto3.client('kinesis')
def getReferrer():
    data = {}
    now = datetime.datetime.now()

    ##构造点击事件，此部分的属性名称可以自定义，然后在lambda部分转换为personalize可以接受的名称
    userId = random.random() * 100000
    data['USER_ID'] = userId
    data['EVENT_TYPE'] = "CLICK"
    sessionId = random.random() * 100000
    data['SESSION_ID'] = sessionId
    itemId = random.random() * 100
    data['ITEM_ID'] = itemId

    return data

while True:
    data = json.dumps(getReferrer())
    print(data)
    kinesis.put_record(
        StreamName="$test-1", # 替换为，您实际创建的流名称
        Data=data,
        PartitionKey="partitionkey")

