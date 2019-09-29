import json
import boto3
from boto3.dynamodb.conditions import Key, Attr

def lambda_handler(event, context):
    # variables
    num_of_winners = event['num_of_winners']
    winner_details = event['winner_details']
    
    # query in dynamodb
    dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')
    table = dynamodb.Table('Lottery-Winners')

    # valiate whether the winner has already been selected in the past draw
    winners_employee_id = [winner['employee_id'] for winner in winner_details]
    results = [table.query(KeyConditionExpression=Key('employee_id').eq(employee_id)) for employee_id in winners_employee_id]
    output = [result['Items'] for result in results if result['Count'] > 0]
    
    # if winner is in the past draw, return 0 else return 1
    has_winner_in_queue = 1 if len(output) > 0 else 0
    return {
        "body": {
            "num_of_winners": num_of_winners,
            "winner_details": winner_details
        },
        "status": has_winner_in_queue
    }
        