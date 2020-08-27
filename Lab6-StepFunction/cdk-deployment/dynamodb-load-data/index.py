import subprocess
import os
import tempfile
import json
import json
import traceback
import logging
import shutil
from datetime import datetime
from uuid import uuid4
import urllib3

logger = logging.getLogger()
logger.setLevel(logging.INFO)
http = urllib3.PoolManager()

CFN_SUCCESS = "SUCCESS"
CFN_FAILED = "FAILED"

def handler(event, context):

    def cfn_error(message=None):
        logger.error("| cfn_error: %s" % message)
        cfn_send(event, context, CFN_FAILED, reason=message)

    try:
        logger.info(event)

        # cloudformation request type (create/update/delete)
        request_type = event['RequestType']

        # extract resource properties
        props = event['ResourceProperties']
        old_props = event.get('OldResourceProperties', {})
        physical_id = event.get('PhysicalResourceId', None)

        try:
            bucket_name = props['BucketName']
            object_key  = props['ObjectKey']
        except KeyError as e:
            cfn_error("missing request resource property %s. props: %s" % (str(e), props))
            return

        s3_source_file = f"s3://{bucket_name}/{object_key}"
        dynamodb_json_name = str(uuid4())

        logger.info(f"| s3_source: {s3_source_file}")
        logger.info(f"| s3_dest: {dynamodb_json_name}")

        # if we are creating a new resource, allocate a physical id for it
        # otherwise, we expect physical id to be relayed by cloudformation
        if request_type == "Create":
            physical_id = f"serverless.lab6.{str(uuid4())}"
        else:
            if not physical_id:
                cfn_error(f"invalid request: request type is '{request_type}' but 'PhysicalResourceId' is not defined")
                return

        # delete or create/update 
        if request_type == "Delete":
            pass

        if request_type == "Update":
            # do not support so far
            pass

        if request_type == "Update" or request_type == "Create":
            aws_command("s3", "cp", s3_source_file, dynamodb_json_name)
            aws_command("dynamodb", "batch-write-item", "--request-items", f"file:///tmp/{dynamodb_json_name}")

        cfn_send(event, context, CFN_SUCCESS, physicalResourceId=physical_id)
    except KeyError as e:
        cfn_error("invalid request. Missing key %s" % str(e))
    except Exception as e:
        logger.exception(e)
        cfn_error(str(e))

#---------------------------------------------------------------------------------------------------
# executes an "aws" cli command
def aws_command(*args):
    aws=os.path.join(os.path.dirname(os.path.realpath(__file__)), 'aws')
    logger.info("| aws %s" % ' '.join(args))
    subprocess.check_call(["python3", aws] + list(args), cwd='/tmp/')

#---------------------------------------------------------------------------------------------------
# sends a response to cloudformation
def cfn_send(event, context, responseStatus, responseData={}, physicalResourceId=None, noEcho=False, reason=None):

    responseUrl = event['ResponseURL']
    logger.info(responseUrl)

    responseBody = {}
    responseBody['Status'] = responseStatus
    responseBody['Reason'] = reason or ('See the details in CloudWatch Log Stream: ' + context.log_stream_name)
    responseBody['PhysicalResourceId'] = physicalResourceId or context.log_stream_name
    responseBody['StackId'] = event['StackId']
    responseBody['RequestId'] = event['RequestId']
    responseBody['LogicalResourceId'] = event['LogicalResourceId']
    responseBody['NoEcho'] = noEcho
    responseBody['Data'] = responseData

    body = json.dumps(responseBody)
    logger.info("| response body:\n" + body)

    headers = {
        'content-type' : '',
        'content-length' : str(len(body))
    }

    try:
        response = http.request('PUT',
                                responseUrl,
                                body=body,
                                headers=headers,
                                retries=False)
        logger.info("| status code: " + str(response.status))
    except Exception as e:
        logger.error("| unable to send response to CloudFormation")
        logger.exception(e)