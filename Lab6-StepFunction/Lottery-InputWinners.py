import json

class CustomError(Exception):
    pass

def lambda_handler(event, context):
    num_of_winners = event['input']
    
    # Trigger the Failed process
    if 'exception' in event:
        raise CustomError("An error occurred!!")
    
    return {
        "body": {
            "num_of_winners": num_of_winners
        }
    }
