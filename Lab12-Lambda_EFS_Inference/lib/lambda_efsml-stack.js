"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const efs = require("@aws-cdk/aws-efs");
const core_1 = require("@aws-cdk/core");
class LambdaEfsmlStack extends cdk.Stack {
    constructor(scope, id, props) {
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
            keyName: 'zeyao-cn-northwest-1' // replacee with your own keyname
        });
        ec2SecurityGroup.connections.allowFromAnyIpv4(ec2.Port.tcp(22), 'Allow SSH from Internet');
        // Define Elastic File System file system
        const fs = new efs.FileSystem(this, 'LambdaEFSMLEFS', {
            vpc: vpc,
            securityGroup: efsSecurityGroup,
            throughputMode: efs.ThroughputMode.PROVISIONED,
            provisionedThroughputPerSecond: core_1.Size.gibibytes(1)
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
        });
        fs.connections.allowDefaultPortFrom(myEc2);
        // Mount EFS file system and install ML framework and pre-train model
        myEc2.userData.addCommands("yum check-update -y", "yum upgrade -y", "yum install -y amazon-efs-utils", "yum install -y nfs-utils", "file_system_id_1=" + fs.fileSystemId, "efs_mount_point_1=/mnt/efs/fs1", "mkdir -p \"${efs_mount_point_1}\"", "test -f \"/sbin/mount.efs\" && echo \"${file_system_id_1}:/ ${efs_mount_point_1} efs defaults,_netdev\" >> /etc/fstab || " +
            "echo \"${file_system_id_1}.efs." + cdk.Stack.of(this).region + ".amazonaws.com:/ ${efs_mount_point_1} nfs4 nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport,_netdev 0 0\" >> /etc/fstab", "mount -a -t efs,nfs4 defaults", 'echo "Installing Python3"', 'yum install python36 -y', 'echo "Installing virtual environment..."', 'python3 -m venv ${efs_mount_point_1}/lambda/pytorch', 'echo "Installing PyTorch..."', 'source ${efs_mount_point_1}/lambda/pytorch/bin/activate && pip3 install torchvision numpy', 'echo "Downloading and copying model..."', 'mkdir -p ${efs_mount_point_1}/lambda/model', 'echo "Changing folder permissions..."', 'chown -R 1000:1000 ${efs_mount_point_1}/lambda/');
        /* // Define Lambda function to execute inference
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
    
        const pcVer = executeInferenceFunction.addVersion('pcVer', undefined, undefined, 5) */
        new cdk.CfnOutput(this, 'Region', { value: this.region });
        new cdk.CfnOutput(this, 'InstancePublicIp', { value: myEc2.instancePublicIp });
        /* new cdk.CfnOutput(this, 'Funtion without provisionedConcurr', {value: executeInferenceFunction.functionArn})
        new cdk.CfnOutput(this, 'Funtion with provisionedConcurr', {value: pcVer.functionArn}) */
    }
}
exports.LambdaEfsmlStack = LambdaEfsmlStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhX2Vmc21sLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFtYmRhX2Vmc21sLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEscUNBQXNDO0FBQ3RDLHdDQUF5QztBQUV6Qyx3Q0FBeUM7QUFLekMsd0NBQTBDO0FBRTFDLE1BQWEsZ0JBQWlCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDN0MsWUFBWSxLQUFvQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUNsRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixxQkFBcUI7UUFDckIsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUM5QyxNQUFNLEVBQUUsQ0FBQztZQUNULFdBQVcsRUFBRSxDQUFDO1NBQ2YsQ0FBQyxDQUFDO1FBRUgsMkNBQTJDO1FBQzNDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUN2RSxHQUFHO1lBQ0gsaUJBQWlCLEVBQUUsa0JBQWtCO1NBQ3RDLENBQUMsQ0FBQztRQUVILE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtZQUM3RSxHQUFHO1lBQ0gsaUJBQWlCLEVBQUUscUJBQXFCO1NBQ3pDLENBQUMsQ0FBQztRQUVILE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUN2RSxHQUFHO1lBQ0gsaUJBQWlCLEVBQUUsa0JBQWtCO1NBQ3RDLENBQUMsQ0FBQztRQUVILGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENB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SyxDQUFDLGdCQUFnQixFQUFDLENBQUMsQ0FBQTtRQUM1RTtpR0FDeUY7SUFDM0YsQ0FBQztDQUNGO0FBMUhELDRDQTBIQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjZGsgPSByZXF1aXJlKCdAYXdzLWNkay9jb3JlJyk7XG5pbXBvcnQgZWMyID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWVjMicpO1xuaW1wb3J0IGlhbSA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1pYW0nKTtcbmltcG9ydCBlZnMgPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtZWZzJyk7XG5pbXBvcnQgY3IgPSByZXF1aXJlKCdAYXdzLWNkay9jdXN0b20tcmVzb3VyY2VzJyk7XG5pbXBvcnQgbGFtYmRhID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWxhbWJkYScpO1xuaW1wb3J0IGFwaWd3ID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWFwaWdhdGV3YXknKTtcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuaW1wb3J0IHsgQXJuLCBTaXplIH0gZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5cbmV4cG9ydCBjbGFzcyBMYW1iZGFFZnNtbFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5Db25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIERlZmluZSBvbmUgbmV3IFZQQ1xuICAgIGNvbnN0IHZwYyA9IG5ldyBlYzIuVnBjKHRoaXMsICdMYW1iZGFFRlNNTFZQQycsIHtcbiAgICAgIG1heEF6czogMixcbiAgICAgIG5hdEdhdGV3YXlzOiAxLFxuICAgIH0pO1xuXG4gICAgLy8gRGVmaW5lIEVDMiAmIExhbWJkYSAmIEVGUyBTZWN1cml0eSBHcm91cFxuICAgIGNvbnN0IGVjMlNlY3VyaXR5R3JvdXAgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgJ0xhbWJkYUVGU01MRUMyU0cnLCB7XG4gICAgICB2cGMsXG4gICAgICBzZWN1cml0eUdyb3VwTmFtZTogXCJMYW1iZGFFRlNNTEVDMlNHXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBsYW1iZGFTZWN1cml0eUdyb3VwID0gbmV3IGVjMi5TZWN1cml0eUdyb3VwKHRoaXMsICdMYW1iZGFFRlNNTExhbWJkYVNHJywge1xuICAgICAgdnBjLFxuICAgICAgc2VjdXJpdHlHcm91cE5hbWU6IFwiTGFtYmRhRUZTTUxMYW1iZGFTR1wiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZWZzU2VjdXJpdHlHcm91cCA9IG5ldyBlYzIuU2VjdXJpdHlHcm91cCh0aGlzLCAnTGFtYmRhRUZTTUxFRlNTRycsIHtcbiAgICAgIHZwYyxcbiAgICAgIHNlY3VyaXR5R3JvdXBOYW1lOiBcIkxhbWJkYUVGU01MRUZTU0dcIizCoFxuICAgIH0pO1xuXG4gICAgZWMyU2VjdXJpdHlHcm91cC5jb25uZWN0aW9ucy5hbGxvd1RvKGVmc1NlY3VyaXR5R3JvdXAsIGVjMi5Qb3J0LnRjcCgyMDQ5KSk7XG4gICAgbGFtYmRhU2VjdXJpdHlHcm91cC5jb25uZWN0aW9ucy5hbGxvd1RvKGVmc1NlY3VyaXR5R3JvdXAsIGVjMi5Qb3J0LnRjcCgyMDQ5KSk7XG5cbiAgICAvLyBEZWZpbmUgYW4gRUMyIGluc3RhbmNlIHRvIG1vdW50IEVGUyBzeXN0ZW1cbiAgICBjb25zdCBteUVjMiA9IG5ldyBlYzIuSW5zdGFuY2UodGhpcywgJ2Vmc0luc3RhbmNlJywge1xuICAgICAgdnBjLFxuICAgICAgdnBjU3VibmV0czoge1xuICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QVUJMSUMsXG4gICAgICB9LFxuICAgICAgc2VjdXJpdHlHcm91cDogZWMyU2VjdXJpdHlHcm91cCxcbiAgICAgIGluc3RhbmNlVHlwZTogZWMyLkluc3RhbmNlVHlwZS5vZihlYzIuSW5zdGFuY2VDbGFzcy5UMiwgZWMyLkluc3RhbmNlU2l6ZS5YTEFSR0UyKSxcbiAgICAgIG1hY2hpbmVJbWFnZTogbmV3IGVjMi5BbWF6b25MaW51eEltYWdlKHsgZ2VuZXJhdGlvbjogZWMyLkFtYXpvbkxpbnV4R2VuZXJhdGlvbi5BTUFaT05fTElOVVggfSksXG4gICAgICAvLyBrZXlOYW1lOiAnemV5YW8tYXAtbm9ydGhlYXN0LTEnICAgIC8vIHJlcGxhY2VlIHdpdGggeW91ciBvd24ga2V5bmFtZVxuICAgICAga2V5TmFtZTogJ3pleWFvLWNuLW5vcnRod2VzdC0xJyAgICAvLyByZXBsYWNlZSB3aXRoIHlvdXIgb3duIGtleW5hbWVcbiAgICB9KVxuXG4gICAgZWMyU2VjdXJpdHlHcm91cC5jb25uZWN0aW9ucy5hbGxvd0Zyb21BbnlJcHY0KGVjMi5Qb3J0LnRjcCgyMiksICdBbGxvdyBTU0ggZnJvbSBJbnRlcm5ldCcpXG5cbiAgICAvLyBEZWZpbmUgRWxhc3RpYyBGaWxlIFN5c3RlbSBmaWxlIHN5c3RlbVxuICAgIGNvbnN0IGZzID0gbmV3IGVmcy5GaWxlU3lzdGVtKHRoaXMsICdMYW1iZGFFRlNNTEVGUycsIHtcbiAgICAgIHZwYzogdnBjLFxuICAgICAgc2VjdXJpdHlHcm91cDogZWZzU2VjdXJpdHlHcm91cCxcbiAgICAgIHRocm91Z2hwdXRNb2RlOiBlZnMuVGhyb3VnaHB1dE1vZGUuUFJPVklTSU9ORUQsXG4gICAgICBwcm92aXNpb25lZFRocm91Z2hwdXRQZXJTZWNvbmQ6IFNpemUuZ2liaWJ5dGVzKDEpXG4gICAgfSk7XG5cbiAgICBjb25zdCBFZnNBY2Nlc3NQb2ludCA9IG5ldyBlZnMuQWNjZXNzUG9pbnQodGhpcywgJ0Vmc0FjY2Vzc1BvaW50Jywge1xuICAgICAgZmlsZVN5c3RlbTogZnMsXG4gICAgICBwYXRoOiAnL2xhbWJkYScsXG4gICAgICBwb3NpeFVzZXI6IHtcbiAgICAgICAgZ2lkOiAnMTAwMCcsXG4gICAgICAgIHVpZDogJzEwMDAnXG4gICAgICB9LFxuICAgICAgY3JlYXRlQWNsOiB7XG4gICAgICAgIG93bmVyR2lkOiAnMTAwMCcsXG4gICAgICAgIG93bmVyVWlkOiAnMTAwMCcsXG4gICAgICAgIHBlcm1pc3Npb25zOiAnNzc3JyAgICAgICAgXG4gICAgICB9XG4gICAgfSlcblxuICAgIGZzLmNvbm5lY3Rpb25zLmFsbG93RGVmYXVsdFBvcnRGcm9tKG15RWMyKTtcblxuICAgIC8vIE1vdW50IEVGUyBmaWxlIHN5c3RlbSBhbmQgaW5zdGFsbCBNTCBmcmFtZXdvcmsgYW5kIHByZS10cmFpbiBtb2RlbFxuICAgIG15RWMyLnVzZXJEYXRhLmFkZENvbW1hbmRzKFxuICAgICAgXCJ5dW0gY2hlY2stdXBkYXRlIC15XCIsXG4gICAgICBcInl1bSB1cGdyYWRlIC15XCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgIFwieXVtIGluc3RhbGwgLXkgYW1hem9uLWVmcy11dGlsc1wiLCAgICAgICAgICAgICAgIFxuICAgICAgXCJ5dW0gaW5zdGFsbCAteSBuZnMtdXRpbHNcIiwgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICBcImZpbGVfc3lzdGVtX2lkXzE9XCIgKyBmcy5maWxlU3lzdGVtSWQsXG4gICAgICBcImVmc19tb3VudF9wb2ludF8xPS9tbnQvZWZzL2ZzMVwiLFxuICAgICAgXCJta2RpciAtcCBcXFwiJHtlZnNfbW91bnRfcG9pbnRfMX1cXFwiXCIsXG4gICAgICBcInRlc3QgLWYgXFxcIi9zYmluL21vdW50LmVmc1xcXCIgJiYgZWNobyBcXFwiJHtmaWxlX3N5c3RlbV9pZF8xfTovICR7ZWZzX21vdW50X3BvaW50XzF9IGVmcyBkZWZhdWx0cyxfbmV0ZGV2XFxcIiA+PiAvZXRjL2ZzdGFiIHx8IFwiICtcbiAgICAgIFwiZWNobyBcXFwiJHtmaWxlX3N5c3RlbV9pZF8xfS5lZnMuXCIgKyBjZGsuU3RhY2sub2YodGhpcykucmVnaW9uICsgXCIuYW1hem9uYXdzLmNvbTovICR7ZWZzX21vdW50X3BvaW50XzF9IG5mczQgbmZzdmVycz00LjEscnNpemU9MTA0ODU3Nix3c2l6ZT0xMDQ4NTc2LGhhcmQsdGltZW89NjAwLHJldHJhbnM9Mixub3Jlc3Zwb3J0LF9uZXRkZXYgMCAwXFxcIiA+PiAvZXRjL2ZzdGFiXCIsXG4gICAgICBcIm1vdW50IC1hIC10IGVmcyxuZnM0IGRlZmF1bHRzXCIsXG5cbiAgICAgICdlY2hvIFwiSW5zdGFsbGluZyBQeXRob24zXCInLFxuICAgICAgJ3l1bSBpbnN0YWxsIHB5dGhvbjM2IC15JyxcblxuICAgICAgJ2VjaG8gXCJJbnN0YWxsaW5nIHZpcnR1YWwgZW52aXJvbm1lbnQuLi5cIicsXG4gICAgICAncHl0aG9uMyAtbSB2ZW52ICR7ZWZzX21vdW50X3BvaW50XzF9L2xhbWJkYS9weXRvcmNoJyxcbiAgICAgICdlY2hvIFwiSW5zdGFsbGluZyBQeVRvcmNoLi4uXCInLFxuICAgICAgJ3NvdXJjZSAke2Vmc19tb3VudF9wb2ludF8xfS9sYW1iZGEvcHl0b3JjaC9iaW4vYWN0aXZhdGUgJiYgcGlwMyBpbnN0YWxsIHRvcmNodmlzaW9uIG51bXB5JyxcblxuICAgICAgJ2VjaG8gXCJEb3dubG9hZGluZyBhbmQgY29weWluZyBtb2RlbC4uLlwiJyxcbiAgICAgICdta2RpciAtcCAke2Vmc19tb3VudF9wb2ludF8xfS9sYW1iZGEvbW9kZWwnLFxuICAgICAgXG4gICAgICAnZWNobyBcIkNoYW5naW5nIGZvbGRlciBwZXJtaXNzaW9ucy4uLlwiJyxcbiAgICAgICdjaG93biAtUiAxMDAwOjEwMDAgJHtlZnNfbW91bnRfcG9pbnRfMX0vbGFtYmRhLydcbiAgICApO1xuXG4gICAgLyogLy8gRGVmaW5lIExhbWJkYSBmdW5jdGlvbiB0byBleGVjdXRlIGluZmVyZW5jZVxuICAgIGNvbnN0IGV4ZWN1dGVJbmZlcmVuY2VGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0xhbWJkYUVGU01MRXhlY3V0ZUluZmVyZW5jZScsIHtcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICdQWVRIT05QQVRIJzogJy9tbnQvaW5mZXJlbmNlL3B5dG9yY2gvbGliL3B5dGhvbjMuNi9zaXRlLXBhY2thZ2VzJyxcbiAgICAgICAgJ1RPUkNIX0hPTUUnOiAnL21udC9pbmZlcmVuY2UvbW9kZWwnXG4gICAgICB9LFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfNixcbiAgICAgIGhhbmRsZXI6ICdtYWluLmxhbWJkYV9oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnbGFtYmRhJykpLFxuICAgICAgdnBjLFxuICAgICAgdnBjU3VibmV0czogdnBjLnNlbGVjdFN1Ym5ldHMoeyBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFIH0pLFxuICAgICAgc2VjdXJpdHlHcm91cDogbGFtYmRhU2VjdXJpdHlHcm91cCxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKDMpLFxuICAgICAgbWVtb3J5U2l6ZTogMzAwOCxcbiAgICAgIHJlc2VydmVkQ29uY3VycmVudEV4ZWN1dGlvbnM6IDEwLFxuICAgICAgZmlsZXN5c3RlbTogbGFtYmRhLkZpbGVTeXN0ZW0uZnJvbUVmc0FjY2Vzc1BvaW50KEVmc0FjY2Vzc1BvaW50LCAnL21udC9pbmZlcmVuY2UnKVxuICAgIH0pXG4gICAgZXhlY3V0ZUluZmVyZW5jZUZ1bmN0aW9uLnJvbGU/LmFkZE1hbmFnZWRQb2xpY3koaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKFwiQW1hem9uRWxhc3RpY0ZpbGVTeXN0ZW1DbGllbnRGdWxsQWNjZXNzXCIpKTtcblxuICAgIGNvbnN0IHBjVmVyID0gZXhlY3V0ZUluZmVyZW5jZUZ1bmN0aW9uLmFkZFZlcnNpb24oJ3BjVmVyJywgdW5kZWZpbmVkLCB1bmRlZmluZWQsIDUpICovXG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUmVnaW9uJywge3ZhbHVlOiB0aGlzLnJlZ2lvbn0pXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0luc3RhbmNlUHVibGljSXAnLCB7dmFsdWU6IG15RWMyLmluc3RhbmNlUHVibGljSXB9KVxuICAgIC8qIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdGdW50aW9uIHdpdGhvdXQgcHJvdmlzaW9uZWRDb25jdXJyJywge3ZhbHVlOiBleGVjdXRlSW5mZXJlbmNlRnVuY3Rpb24uZnVuY3Rpb25Bcm59KVxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdGdW50aW9uIHdpdGggcHJvdmlzaW9uZWRDb25jdXJyJywge3ZhbHVlOiBwY1Zlci5mdW5jdGlvbkFybn0pICovXG4gIH1cbn1cbiJdfQ==