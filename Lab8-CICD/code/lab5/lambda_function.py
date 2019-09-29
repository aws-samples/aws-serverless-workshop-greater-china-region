import json
#test

def lambda_handler(event, context):
    # TODO implement
    print('version:6')
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
