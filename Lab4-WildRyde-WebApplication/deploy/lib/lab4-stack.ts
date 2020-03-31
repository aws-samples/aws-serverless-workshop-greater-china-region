import * as cdk from '@aws-cdk/core';
import apigateway = require('@aws-cdk/aws-apigateway');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import iam = require('@aws-cdk/aws-iam');
import lambda = require('@aws-cdk/aws-lambda');
import s3 = require('@aws-cdk/aws-s3');
import s3deploy = require('@aws-cdk/aws-s3-deployment');
import path = require('path');

export class ServerlessLab4Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stack = cdk.Stack.of(this);

    const webSiteBucket = new s3.Bucket(this, `WildRydesBucket`, {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
    });
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('./dist/tutorial')],
      destinationBucket: webSiteBucket,
      destinationKeyPrefix: '/', // optional prefix in destination bucket
      retainOnDelete: false,
    });

    new cdk.CfnOutput(this, `${stack.stackName}-S3-StaticWebSite-Domain`, {
      value: `${webSiteBucket.bucketWebsiteUrl}`,
      exportName: 'S3-StaticWebSite-Domain',
      description: 'url of static website on S3.'
    });

    // part 2 -- create backend including dynamodb and lambda
    const ridesTable = new dynamodb.Table(this, 'RidesTable', {
      tableName: 'Rides',
      partitionKey: { name: 'RideId', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambdaRole = new iam.Role(this, `WildRydes-Lambda-Role`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ]
    });
    // allow lambda role to write data to given table
    ridesTable.grantWriteData(lambdaRole);

    const wildRydesLambda = new lambda.Function(this, `WildRydesLambda`, {
      runtime: lambda.Runtime.NODEJS_12_X,
      role: lambdaRole,
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist/lambda/')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(29),
    });

    // part 3 -- backend integrate with API Gateway
    const api = new apigateway.RestApi(this, 'WildRydesAPI', {
      deployOptions: {
          stageName: 'prod',
      },
      endpointConfiguration: {
        types: [ apigateway.EndpointType.REGIONAL ]
      }
    });
    const rideRes = api.root.addResource('ride');
    rideRes.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
    });
    
    // part 4 -- canary deployment
    const versionThreeFleets = wildRydesLambda.addVersion('version-three-fleets');
    const stableLambdaAlias = new lambda.Alias(this, 'WildRydesLambdaStable', {
      version: versionThreeFleets,
      aliasName: 'stable',
    });
    rideRes.addMethod('POST', new apigateway.LambdaIntegration(stableLambdaAlias));
  }
}
