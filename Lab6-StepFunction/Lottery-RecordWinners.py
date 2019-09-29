import json
import boto3
from boto3.dynamodb.conditions import Key, Attr

def lambda_handler(event, context):
    # variables
    winner_details = event['winner_details']
    
    # retrieve the winners' employee id
    employee_ids = [winner['employee_id'] for winner in winner_details]
    
    # save the records in dynamodb
    dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')
    table = dynamodb.Table('Lottery-Winners')
    
    for employee_id in employee_ids:
        table.put_item(Item={
            'employee_id': employee_id
        })
        
    return {
        "body": {
            "winners": winner_details
        },
        "status_code": "SUCCESS" 
    }
