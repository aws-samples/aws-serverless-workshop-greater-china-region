from datetime import datetime
from random import randint
from time import sleep
import boto3
dynamodb = boto3.resource('dynamodb')
batchnumber = 2000
table = dynamodb.Table('ddbstream2')
acc =0
while True:
    with table.batch_writer() as batch:
        for i in range(batchnumber):
            batch.put_item(
                Item={
                    'id': str(abs(hash(datetime.utcnow().isoformat()+'devicename'))),
                    'timestamp': datetime.utcnow().isoformat(),
                    'temp': randint(0, 99),
                    'mois': randint(0, 99),
                    'thre': randint(0, 30)
                }
            )
    acc += batchnumber
    print(str(acc))
    sleep(1)
pass

