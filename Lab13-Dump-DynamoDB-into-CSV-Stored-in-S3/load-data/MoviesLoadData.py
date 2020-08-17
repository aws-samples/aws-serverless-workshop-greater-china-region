from __future__ import print_function # Python 2/3 compatibility
import boto3
import json
import decimal
import csv

dynamodb = boto3.resource('dynamodb', region_name='cn-north-1')

tableName = 'Movies'

# table = dynamodb.Table(tableName)

# with open("moviedata.json") as json_file:
#     movies = json.load(json_file, parse_float = decimal.Decimal)
#     for movie in movies:
#         year = int(movie['year'])
#         title = movie['title']
#         info = movie['info']

#         print("Adding movie:", year, title)

#         table.put_item(
#            Item={
#                'year': year,
#                'title': title,
#                'info': info,
#             }
#         )


def write_to_dynamo(rows, tableName):
    try:
        table = dynamodb.Table(tableName)
    except Exception as error:
        print("Error loading DynamoDB table. Check if table %s was created correctly" % tableName)
    
    try:
        with table.batch_writer() as batch:
            for i in range(len(rows)):
                batch.put_item(
                    Item=rows[i]
                )
    except Exception as error:
        print("Error executing batch_writer %s" % error)

# tableName = 'airport-codes'
# table = dynamodb.Table(tableName)
# batch_size = 100
# batch = []

# with open("airport-codes.csv", encoding='utf-8') as csv_file:
#     for row in csv.DictReader(csv_file):
#         if len(batch) >= batch_size:
#             write_to_dynamo(batch, tableName)
#             batch.clear()
#         batch.append(row)
    
#     if batch:
#         write_to_dynamo(batch, tableName)


tableName = 'Orders'
table = dynamodb.Table(tableName)
batch_size = 100
batch = []

with open("Orders.csv", encoding='utf-8') as csv_file:
    for row in csv.DictReader(csv_file):
        if len(batch) >= batch_size:
            write_to_dynamo(batch, tableName)
            batch.clear()
        batch.append(row)

    if batch:
        write_to_dynamo(batch, tableName)
