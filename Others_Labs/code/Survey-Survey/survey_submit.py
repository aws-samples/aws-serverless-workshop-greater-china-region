from yattag import Doc
import uuid
import boto3
import os
import json

def lambda_handler(event, context):

    ItemData = {}
    ItemData['id'] = str(uuid.uuid4())
    for param in event["queryStringParameters"]:
        value = event["queryStringParameters"][param]
        
        if not value:
            value = "-"
            
        ItemData[param] = value
    
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ['TABLE_NAME'])
    table.put_item(
        Item = ItemData
    )


    doc, tag, text = Doc().tagtext()

    with tag('html'):
        with tag('body'):
            with tag('div', align='center'):
                with tag('h1'):
                    doc.stag('br')
                    doc.stag('br')
                    doc.stag('br')
                    doc.stag('br')
                
                    doc.stag('br')
                    doc.stag('br')
                    text("Your answers were submitted! Thank you!")

    htmlResult = doc.getvalue()

    return {
            'statusCode': "200",
            'body': htmlResult,
            'headers': {
                'Content-Type': 'text/html',
            }
        }
