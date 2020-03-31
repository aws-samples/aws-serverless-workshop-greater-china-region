import * as cdk from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');
import s3deploy = require('@aws-cdk/aws-s3-deployment');

export class ServerlessLab4Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stack = cdk.Stack.of(this);

    const webSiteBucket = new s3.Bucket(this, `WildRydesBucket`, {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
    });
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('./dist/tutorial')],
      destinationBucket: webSiteBucket,
      destinationKeyPrefix: '/' // optional prefix in destination bucket
    });

    new cdk.CfnOutput(this, `${stack.stackName}-S3-StaticWebSite-Domain`, {
      value: `${webSiteBucket.bucketWebsiteUrl}`,
      exportName: 'S3-StaticWebSite-Domain',
      description: 'url of static website on S3.'
    });
  }
}
