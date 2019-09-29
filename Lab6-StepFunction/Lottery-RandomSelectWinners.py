import json
import boto3
from random import randint
from boto3.dynamodb.conditions import Key, Attr

TOTAL_NUM = 10

def lambda_handler(event, context):
    # variables
    num_of_winners = event['num_of_winners']
    
    # query in dynamodb
    dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')
    table = dynamodb.Table('Lottery-Employee')

    # random select the winners, if has duplicate value, re-run the process
    while True:
        lottery_serials = [randint(1,TOTAL_NUM) for i in range(num_of_winners)]
        if len(lottery_serials) == len(set(lottery_serials)):
            break
    
    # retrieve the employee details from dynamodb
    results = [table.query(KeyConditionExpression=Key('lottery_serial').eq(serial), IndexName='lottery_serial-index') for serial in lottery_serials]
    
    # format results
    winner_details = [result['Items'][0] for result in results]
    
    return {
        "body": {
            "num_of_winners": num_of_winners,
            "winner_details": winner_details
        }
    }
        
    