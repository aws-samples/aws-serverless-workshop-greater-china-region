from aws_cdk import core, aws_lambda, aws_iam, aws_s3, aws_s3_notifications, aws_lambda_event_sources
from cdk_watchful import Watchful
import json


class CdkImgProcessStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # The code that defines your stack goes here
        lambda_layer = aws_lambda.LayerVersion(self, "pillow_layer",
                                               code=aws_lambda.Code.asset(
                                                   "./python-pillow-6.2.1.zip"),
                                               compatible_runtimes=[
                                                   aws_lambda.Runtime.PYTHON_3_7],
                                               description="Pillow_upload_from_cdk"
                                               )
        # aws_lambda.LayerVersion.from_layer_version_arn(self, "pillow_layer",
        #                                             layer_version_arn="arn:aws-cn:lambda:cn-northwest-1:313497334385:layer:pillow:4"
        #                                             )

        # The code that defines your stack goes here
        mylambda = aws_lambda.Function(self, "myfunction_id",
                                       description="lambda trigger by S3 to convert image",
                                       # function_name="img-process-cdk-deploy",  # the name will be auto create
                                       code=aws_lambda.Code.asset("./lambda"),
                                       handler="lambda_function.lambda_handler",
                                       runtime=aws_lambda.Runtime.PYTHON_3_7,
                                       timeout=core.Duration.seconds(60),
                                       memory_size=256,
                                       reserved_concurrent_executions=10,
                                       layers=[lambda_layer],
                                       dead_letter_queue_enabled=True,  # cdk will create a new SQS for this
                                       # role = aws_iam.Role.from_role_arn(self, "mylambda_role",
                                       #         role_arn="arn:aws-cn:iam::313497334385:role/Lambda-access-img-process-S3bucket"
                                       #         )  # cdk will create a role for this
                                       )

        with open('./env.js', 'r') as f:
            env = json.load(f)
            for (k, v) in env.items():
                mylambda.add_environment(k, v)

        #create a new bucket, Import bucket can not add event trigger
        s3_bucket = aws_s3.Bucket(self, "mybucket",
                                  # bucket name will be auto created or define here
                                  # bucket_name="img-process-cdk-created"
                                  )
        mylambda.add_event_source(
            aws_lambda_event_sources.S3EventSource(s3_bucket,
                                                   events=[
                                                       aws_s3.EventType.OBJECT_CREATED],
                                                   filters=[aws_s3.NotificationKeyFilter(
                                                       prefix='input/')]
                                                   )
        )
        s3_bucket.grant_read_write(mylambda)
        # or the following method is the same
        # s3_bucket.add_event_notification(aws_s3.EventType.OBJECT_CREATED,
        #         aws_s3_notifications.LambdaDestination(mylambda),
        #         aws_s3.NotificationKeyFilter(prefix='input/')
        #     )

        # monitor
        # wf = Watchful(self, 'watchful', alarm_email=myemail)
        # wf.watch_scope(self)
