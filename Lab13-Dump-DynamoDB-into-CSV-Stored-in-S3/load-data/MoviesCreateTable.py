from __future__ import print_function  # Python 2/3 compatibility
import boto3

dynamodb = boto3.resource('dynamodb', region_name='cn-north-1')


# table = dynamodb.create_table(
#     TableName='Movies',
#     KeySchema=[
#         {
#             'AttributeName': 'year',
#             'KeyType': 'HASH'  #Partition key
#         },
#         {
#             'AttributeName': 'title',
#             'KeyType': 'RANGE'  #Sort key
#         }
#     ],
#     AttributeDefinitions=[
#         {
#             'AttributeName': 'year',
#             'AttributeType': 'N'
#         },
#         {
#             'AttributeName': 'title',
#             'AttributeType': 'S'
#         },

#     ],
#     ProvisionedThroughput={
#         'ReadCapacityUnits': 10,
#         'WriteCapacityUnits': 10
#     }
# )

# print("Table status:", table.table_status)

table = dynamodb.create_table(
    TableName='airport-codes',
    KeySchema=[
        {
            'AttributeName': 'ident',
            'KeyType': 'HASH'  # Partition key
        },
        {
            'AttributeName': 'name',
            'KeyType': 'RANGE'  # Sort key
        }
    ],
    AttributeDefinitions=[
        {
            'AttributeName': 'ident',
            'AttributeType': 'S'
        },
        {
            'AttributeName': 'name',
            'AttributeType': 'S'
        }
    ],
    ProvisionedThroughput={
        'ReadCapacityUnits': 200,
        'WriteCapacityUnits': 200
    }
)

print("Table status:", table.table_status)


table = dynamodb.create_table(
    TableName='Orders',
    KeySchema=[
        {
            'AttributeName': 'uuid',
            'KeyType': 'HASH'  # Partition key
        }
    ],
    AttributeDefinitions=[
        {
            'AttributeName': 'uuid',
            'AttributeType': 'S'
        }
    ],
    ProvisionedThroughput={
        'ReadCapacityUnits': 200,
        'WriteCapacityUnits': 200
    }
)

print("Table status:", table.table_status)
