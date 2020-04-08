import sys
import boto3
import logging
import time
import json

from os import getenv
from boto3 import client

LOGGING_LEVEL = getenv('LOGGING_LEVEL', 'INFO')

logger = logging.getLogger(__name__)
if getenv('AWS_EXECUTION_ENV') is None:
  logging.basicConfig(stream=sys.stdout, level=LOGGING_LEVEL)
else:
  logger.setLevel(LOGGING_LEVEL)

eventBridgeClient = boto3.client('events')
dlqClient = boto3.client('sqs')
EVENT_BUS_NAME = getenv('EVENT_BUS_NAME')
EVENT_SOURCE_ARN = getenv('EVENT_SOURCE_ARN')
EVENT_TARGET_LAMBDA_ARN = getenv('EVENT_TARGET_LAMBDA_ARN')
# uncomment for firehose consumer experiment
# EVENT_TARGET_FIREHOSE_ARN = getenv('EVENT_TARGET_FIREHOSE_ARN')
MAX_ATTEMPT = getenv('MAX_ATTEMPT')
DLQ_URL = getenv('DLQ_URL')

def lambda_handler(event, context):

    if 'Records' not in event or len(event['Records']) == 0:
        raise KeyError('No records are available to operate')

    print('record received from dynamodb stream %s' % json.dumps(event['Records']))
    # create non-default eventbridge bus
    custom_bus()
    for record in event['Records']:
        if 'dynamodb' not in record:
            logger.error('Record does not have DynamoDB data')
            continue
        logger.debug(record['dynamodb'])
        switch = {
            "INSERT":insert_handle,
            "MODIFY":update_handle,
            "REMOVE":delete_handle
        }
        cookie = {
            "eventID":record['eventID'],
            "dynamodb":record['dynamodb'],
            "placeholder":"null"
        }
        try:
            switch[record['eventName']](cookie)
        except KeyError as e:
            pass

    print('Successfully processed %s records.' % str(len(event['Records'])))

def custom_bus():
    pass
    # uncomment for other consumer connection

    # don't use aws* that reserverd for internal service, otherwise 'NotAuthorizedForSourceException' could happen
    # LambdaConsumerPattern = '{\n  "source": [\n    "update.aws.dynamodb"\n  ]\n}'
    # ruleResult = eventBridgeClient.put_rule(
    #     Name = 'LambdaConsumer',
    #     EventPattern = LambdaConsumerPattern,
    #     EventBusName = EVENT_BUS_NAME
    # )
    # print('put rule result for lambda %s' % ruleResult)

    # FirehosePattern = '{\n  "source": [\n    "insert.aws.dynamodb"\n  ]\n}'
    # ruleResult = eventBridgeClient.put_rule(
    #     Name = 'FirehoseConsumer',
    #     EventPattern = FirehosePattern,
    #     EventBusName = EVENT_BUS_NAME
    # )
    # print('put rule result for kinesis firehose %s' % ruleResult)

    # targetResult = eventBridgeClient.put_targets(
    #     Rule = 'LambdaConsumer',
    #     EventBusName = EVENT_BUS_NAME,
    #     Targets=[
    #         {
    #             'Id': 'LambdaTargetId',
    #             'Arn': EVENT_TARGET_LAMBDA_ARN
    #             # 'RoleArn': EVENT_TARGET_ROLE_ARN
    #         },
    #     ]
    # )
    # print('put targets result for lambda %s' % targetResult)

    # targetResult = eventBridgeClient.put_targets(
    #     Rule = 'FirehoseConsumer',
    #     EventBusName = EVENT_BUS_NAME,
    #     Targets=[
    #         {
    #             'Id': 'FirehoseTargetId',
    #             'Arn': EVENT_TARGET_FIREHOSE_ARN
    #             # 'RoleArn': EVENT_TARGET_ROLE_ARN
    #         },
    #     ]
    # )
    # print('put targets result for firehose %s' % targetResult)

def publish_eventbridge(cookie):
    attemptCount = 0
    while (attemptCount < int(MAX_ATTEMPT)):
        response = eventBridgeClient.put_events(
            Entries = [
                {
                    'Time': time.time(),
                    'Source': 'update.aws.dynamodb',
                    'Resources': [
                        EVENT_SOURCE_ARN,
                    ],
                    'DetailType': 'operations in dynamodb',
                    'Detail': json.dumps(cookie['dynamodb']),
                    'EventBusName': EVENT_BUS_NAME
                },
            ]
        )
        # check ErrorCode or ErrorMessage for possible failure and retry
        try:
            response['Entries'].index('ErrorCode')
        except ValueError as e:
            print('detail input %s' % json.dumps(cookie['dynamodb']))
            print('put events result %s' % json.dumps(response))
            return
        attemptCount += 1
    # send to dlq for further processing
    publish_dlq(cookie)

def insert_handle(cookie):
    print('enter into insert process with eventID %s' % cookie['eventID'])
    publish_eventbridge(cookie)

def update_handle(cookie):
    print('enter into update process with eventID %s' % cookie['eventID'])
    if 'NewImage' not in cookie['dynamodb']:
        logger.info('Record does not have a NewImage to process')
    publish_eventbridge(cookie)

def delete_handle(cookie):
    print('enter into delete process with eventID %s' % cookie['eventID'])
    publish_eventbridge(cookie)

def publish_dlq(cookie):
    print('send failed events to dlq %s' % DLQ_URL)
    send_resp = dlqClient.send_message(
    QueueUrl = DLQ_URL,
    DelaySeconds = 10,
    MessageAttributes = {
        'Title': {
            'DataType': 'String',
            'StringValue': 'Message failed send to EventBridge'
        },
        'Author': {
            'DataType': 'String',
            'StringValue': 'AaRon'
        }
    },
    MessageBody = (
        '%s' % (cookie)
    )
)