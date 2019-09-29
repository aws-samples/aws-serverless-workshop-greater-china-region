import json
import boto3

codedeploy = boto3.client('codedeploy')
codepipeline = boto3.client('codepipeline')


def lambda_handler(event, context):
    print(json.dumps(event))
    job_data = event['CodePipeline.job']['data']
    user_parameters = job_data['actionConfiguration']['configuration']['UserParameters']
    # print(params)
    params = json.loads(user_parameters)
    if 'bucket' not in params or 'key' not in params:
        raise Exception('Your UserParameters JSON must include the both path and bucket name')

    bucket = params['bucket']
    key = params['key']
    bundleType = params['bundleType']
    APPLICATION_NAME = params['APPLICATION_NAME']
    DEPLOYMENT_GROUP_NAME = params['DEPLOYMENT_GROUP_NAME']

    response = codedeploy.create_deployment(
        applicationName=APPLICATION_NAME,
        deploymentGroupName=DEPLOYMENT_GROUP_NAME,
        revision={
            'revisionType': 'S3',
            's3Location': {
                'bucket': bucket,
                'key': key,
                'bundleType': bundleType
            }
        },
        deploymentConfigName='CodeDeployDefault.LambdaAllAtOnce',
        description='Deploy from deploy4lambda lambda function',
    )
    print(json.dumps(response))

    jobId = event["CodePipeline.job"]["id"]
    print(jobId)
    result = codepipeline.put_job_success_result(
        jobId=jobId
    )
    print(result)
    return "Complete."
