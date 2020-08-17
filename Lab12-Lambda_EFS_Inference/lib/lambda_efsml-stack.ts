import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import efs = require('@aws-cdk/aws-efs');
import cr = require('@aws-cdk/custom-resources');
import lambda = require('@aws-cdk/aws-lambda');
import apigw = require('@aws-cdk/aws-apigateway');
import path = require('path');
import { Arn, Size } from '@aws-cdk/core';

export class LambdaEfsmlStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define one new VPC
    const vpc = new ec2.Vpc(this, 'LambdaEFSMLVPC', {
      maxAzs: 2,
      natGateways: 1,
    });

    // Define EC2 & Lambda & EFS Security Group
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'LambdaEFSMLEC2SG', {
      vpc,
      securityGroupName: "LambdaEFSMLEC2SG",
    });

    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaEFSMLLambdaSG', {
      vpc,
      securityGroupName: "LambdaEFSMLLambdaSG",
    });

    const efsSecurityGroup = new ec2.SecurityGroup(this, 'LambdaEFSMLEFSSG', {
      vpc,
      securityGroupName: "LambdaEFSMLEFSSG", 
    });

    ec2SecurityGroup.connections.allowTo(efsSecurityGroup, ec2.Port.tcp(2049));
    lambdaSecurityGroup.connections.allowTo(efsSecurityGroup, ec2.Port.tcp(2049));

    // Define an EC2 instance to mount EFS system
    const myEc2 = new ec2.Instance(this, 'efsInstance', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: ec2SecurityGroup,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.XLARGE2),
      machineImage: new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX }),
      // keyName: 'zeyao-ap-northeast-1'    // replacee with your own keyname
      keyName: 'xxxxxx'    // replacee with your own keyname
    })

    ec2SecurityGroup.connections.allowFromAnyIpv4(ec2.Port.tcp(22), 'Allow SSH from Internet')

    // Define Elastic File System file system
    const fs = new efs.FileSystem(this, 'LambdaEFSMLEFS', {
      vpc: vpc,
      securityGroup: efsSecurityGroup,
      throughputMode: efs.ThroughputMode.PROVISIONED,
      provisionedThroughputPerSecond: Size.gibibytes(1)
    });

    const EfsAccessPoint = new efs.AccessPoint(this, 'EfsAccessPoint', {
      fileSystem: fs,
      path: '/lambda',
      posixUser: {
        gid: '1000',
        uid: '1000'
      },
      createAcl: {
        ownerGid: '1000',
        ownerUid: '1000',
        permissions: '777'        
      }
    })

    fs.connections.allowDefaultPortFrom(myEc2);

    // Mount EFS file system and install ML framework and pre-train model
    myEc2.userData.addCommands(
      "yum check-update -y",
      "yum upgrade -y",                             
      "yum install -y amazon-efs-utils",               
      "yum install -y nfs-utils",                      
      "file_system_id_1=" + fs.fileSystemId,
      "efs_mount_point_1=/mnt/efs/fs1",
      "mkdir -p \"${efs_mount_point_1}\"",
      "test -f \"/sbin/mount.efs\" && echo \"${file_system_id_1}:/ ${efs_mount_point_1} efs defaults,_netdev\" >> /etc/fstab || " +
      "echo \"${file_system_id_1}.efs." + cdk.Stack.of(this).region + ".amazonaws.com:/ ${efs_mount_point_1} nfs4 nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport,_netdev 0 0\" >> /etc/fstab",
      "mount -a -t efs,nfs4 defaults",

      'echo "Installing Python3"',
      'yum install python36 -y',

      'echo "Installing virtual environment..."',
      'python3 -m venv ${efs_mount_point_1}/lambda/pytorch',
      'echo "Installing PyTorch..."',
      'source ${efs_mount_point_1}/lambda/pytorch/bin/activate && pip3 install torchvision numpy',

      'echo "Downloading and copying model..."',
      'mkdir -p ${efs_mount_point_1}/lambda/model',
      
      'echo "Changing folder permissions..."',
      'chown -R 1000:1000 ${efs_mount_point_1}/lambda/'
    );

    // Define Lambda function to execute inference
    const executeInferenceFunction = new lambda.Function(this, 'LambdaEFSMLExecuteInference', {
      environment: {
        'PYTHONPATH': '/mnt/inference/pytorch/lib/python3.6/site-packages',
        'TORCH_HOME': '/mnt/inference/model'
      },
      runtime: lambda.Runtime.PYTHON_3_6,
      handler: 'main.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda')),
      vpc,
      vpcSubnets: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE }),
      securityGroup: lambdaSecurityGroup,
      timeout: cdk.Duration.minutes(3),
      memorySize: 3008,
      reservedConcurrentExecutions: 10,
      filesystem: lambda.FileSystem.fromEfsAccessPoint(EfsAccessPoint, '/mnt/inference')
    })
    executeInferenceFunction.role?.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonElasticFileSystemClientFullAccess"));

    const pcVer = executeInferenceFunction.addVersion('pcVer', undefined, undefined, 5)

    new cdk.CfnOutput(this, 'Region', {value: this.region})
    new cdk.CfnOutput(this, 'InstancePublicIp', {value: myEc2.instancePublicIp})
    /* new cdk.CfnOutput(this, 'Funtion without provisionedConcurr', {value: executeInferenceFunction.functionArn})
    new cdk.CfnOutput(this, 'Funtion with provisionedConcurr', {value: pcVer.functionArn}) */
  }
}
