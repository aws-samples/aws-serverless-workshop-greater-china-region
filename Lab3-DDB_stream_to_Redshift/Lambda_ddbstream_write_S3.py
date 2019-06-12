print('init lambda!!!')
import json
import time
import boto3
s3 = boto3.client('s3')
bucket = 'emrdata-huangzb'
prefix = 'ddb_stream'


def lambda_handler(event, context):
    print(json.dumps(event))

    table = ''
    try:
        for record in event['Records']:

            if record['eventName'] == 'REMOVE':
                return {
                    'statusCode': 400,
                    'body': 'REMOVE'
                }

            id = record['dynamodb']['NewImage']['id']['S']
            timestamp = record['dynamodb']['NewImage']['timestamp']['S']
            mois = str(record['dynamodb']['NewImage']['mois']['N'])
            thre = str(record['dynamodb']['NewImage']['thre']['N'])
            temp = str(record['dynamodb']['NewImage']['temp']['N'])
            table += id+' '+timestamp+' '+mois+' '+temp+' '+thre+'\n'
    except Exception as e:
        return {
            'statusCode': 500,
            'body': 'err code: '+str(e)
        }

    print(table)
    # 按小时分目录存S3
    key = prefix+time.strftime('/%Y/%m/%d/%H/',
                               time.localtime())+id+str(time.time())+'.csv'

    try:
        response = s3.put_object(
            Bucket=bucket,
            Key=key,
            Body=table
        )
    except Exception as e:
        return {
            'statusCode': 500,
            'body': 'err code: '+str(e)
        }

    return {
        'statusCode': 200,
        'body': 'S3 write response log: '+json.dumps(response)
    }
