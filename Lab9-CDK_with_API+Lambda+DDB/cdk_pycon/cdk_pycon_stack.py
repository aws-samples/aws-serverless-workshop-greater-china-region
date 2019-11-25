from aws_cdk import core, aws_dynamodb, aws_lambda, aws_apigateway
from cdk_watchful import Watchful


class CdkPyconStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # define the table that maps short codes to URLs.
        table = aws_dynamodb.Table(self, "Table",
                        partition_key=aws_dynamodb.Attribute(
                            name="id",
                            type=aws_dynamodb.AttributeType.STRING))

        # define the API gateway request handler. all API requests will go to the same function.
        handler = aws_lambda.Function(self, "UrlShortFunction",
                                      code=aws_lambda.Code.asset("./lambda"),
                                      handler="handler.main",
                                      runtime=aws_lambda.Runtime.PYTHON_3_7)

        # pass the table name to the handler through an environment variable and grant
        # the handler read/write permissions on the table.
        handler.add_environment('TABLE_NAME', table.table_name)
        table.grant_read_write_data(handler)

        # define the API endpoint and associate the handler
        api = aws_apigateway.LambdaRestApi(self, "UrlShortApi",
                                           handler=handler,
                                           endpoint_types=[aws_apigateway.EndpointType.REGIONAL])

        wf = Watchful(self, 'watchful', alarm_email='your@email.com')
        wf.watch_scope(self)
