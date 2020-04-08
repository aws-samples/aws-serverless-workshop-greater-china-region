from __future__ import print_function
import json
import boto3
import json

def handler(event, context):
    # samples to follow: https://github.com/aws-samples/serverless-app-examples/blob/master/python/logicmonitor-send-eventbridge-events/lambda_function.py

    args = {}
    args['detail'] = json.dumps(event, indent=4)
    print(args['detail'])