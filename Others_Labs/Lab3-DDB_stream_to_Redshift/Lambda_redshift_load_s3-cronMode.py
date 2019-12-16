print('init Lambda!')
import json,time
import psycopg2
import boto3
ssm = boto3.client('ssm')
response = ssm.get_parameter(
    Name='dbpwd',
    WithDecryption=False
)
value = json.loads(response['Parameter']['Value'])

REDSHIFT_DATABASE = 'db'
REDSHIFT_USER = value['uname']
REDSHIFT_PASSWD = value['pwd']
REDSHIFT_PORT = 5439
REDSHIFT_ENDPOINT = 'db.coft5pbsrsdc.cn-north-1.redshift.amazonaws.com.cn'
try:
    conn = psycopg2.connect(
        dbname=REDSHIFT_DATABASE,
        user=REDSHIFT_USER,
        password=REDSHIFT_PASSWD,
        port=REDSHIFT_PORT,
        host=REDSHIFT_ENDPOINT)
    conn.autocommit = True
    print('connected redshift')
except Exception as ERROR:
    print("Connection Issue: ", ERROR)


def lambda_handler(event, context):
    print(json.dumps(event))

    bucket = 'emrdata-huangzb'
    key = 'ddb_stream'+time.strftime('/%Y/%m/%d/%H/', time.localtime(time.time() - 1*60*60))
    s3str = "'s3://"+bucket+"/"+key+"'"
    #s3str = "'s3://emrdata-huangzb/ddb_stream/2019/01/01'"
    REDSHIFT_QUERY = "COPY ddbstream2 \
                    FROM "+s3str +\
        " IAM_ROLE 'arn:aws-cn:iam::313497334385:role/Redshift-read-S3'\
                    DELIMITER ' '\
                    REMOVEQUOTES\
                    REGION 'cn-north-1'\
                    "
    try:
        cursor = conn.cursor()
        print(cursor.execute(REDSHIFT_QUERY))
        cursor.close()
        print('finish load redshift')
    except Exception as ERROR:
        print("Execution Issue: ", ERROR)

    return {
        'statusCode': 200,
        'body': json.dumps(response)
    }
