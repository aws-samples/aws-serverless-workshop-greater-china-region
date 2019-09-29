import json
import boto3
import uuid

def lambda_handler(event, context):
    # Retrieve the body from API Gateway event
    input = event['body']
    
    client = boto3.client('stepfunctions')
    transaction_id = "{}-{}".format("Lottery",  uuid.uuid1())
    
    # Start Step Functions Execution
    response = client.start_execution(
        stateMachineArn='arn:aws:states:ap-southeast-1:379951292773:stateMachine:Lottery',
        name=transaction_id,
        input=input
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps(response['executionArn'])
    }
