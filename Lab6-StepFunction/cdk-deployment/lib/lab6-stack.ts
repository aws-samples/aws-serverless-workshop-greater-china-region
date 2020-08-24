import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';
import * as lambda from '@aws-cdk/aws-lambda';
import * as sns from '@aws-cdk/aws-sns';
import * as sns_sub from '@aws-cdk/aws-sns-subscriptions';
import * as path from 'path';

export class ServerlessWorkshopLab6Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stack = cdk.Stack.of(this);

    // create SNS topic
    const topic = new sns.Topic(this, 'Lottery-Notification', {
      displayName: `Lottery`
    });
    const notifyEmail = this.node.tryGetContext('notifyEmail');
    if (notifyEmail) {
      topic.addSubscription(new sns_sub.EmailSubscription(notifyEmail));
    }

    // create Dynamodb Tables
    const lotteryWinnersTable = new dynamodb.Table(this, 'Lottery-Winners', {
      tableName: 'Lottery-Winners',
      partitionKey: { name: 'employee_id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const lotteryEmployeeTable = new dynamodb.Table(this, 'Lottery-Employee', {
      tableName: 'Lottery-Employee',
      partitionKey: { name: 'employee_id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    lotteryEmployeeTable.addGlobalSecondaryIndex({
      indexName: 'lottery_serial-index',
      partitionKey: { name: 'lottery_serial', type: dynamodb.AttributeType.NUMBER },
    });

    // create step Lambda functions
    const lambdaCodeAsset = lambda.Code.fromAsset(path.join(__dirname, '../../'), {
      exclude: [ 'cdk-deployment', 'docs', '*.json', '*.md' ],
    });

    const lotteryInputWinners = new lambda.Function(this, 'Lottery-InputWinners', { 
      code: lambdaCodeAsset,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'Lottery-InputWinners.lambda_handler',
      timeout: cdk.Duration.seconds(10),
    });

    const lotteryRandomSelectWinners = new lambda.Function(this, 'Lottery-RandomSelectWinners', { 
      code: lambdaCodeAsset,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'Lottery-RandomSelectWinners.lambda_handler',
      timeout: cdk.Duration.minutes(2),
    });
    lotteryEmployeeTable.grantReadData(lotteryRandomSelectWinners);

    const lotteryValidateWinners = new lambda.Function(this, 'Lottery-ValidateWinners', { 
      code: lambdaCodeAsset,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'Lottery-ValidateWinners.lambda_handler',
      timeout: cdk.Duration.minutes(2),
    });
    lotteryWinnersTable.grantReadData(lotteryValidateWinners);

    const lotteryRecordWinners = new lambda.Function(this, 'Lottery-RecordWinners', { 
      code: lambdaCodeAsset,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'Lottery-RecordWinners.lambda_handler',
      timeout: cdk.Duration.minutes(2),
    });
    lotteryWinnersTable.grantWriteData(lotteryRecordWinners);

    // create state of step function
    const failure = new sfn.Fail(this, 'Fail', {
    });

    const inputLotteryWinners = new tasks.LambdaInvoke(this, 'Input Lottery Winners', {
      lambdaFunction: lotteryInputWinners,
      resultPath: '$',
      payloadResponseOnly: true,
    }).addCatch(failure, {
      errors: [ 'CustomError' ]
    }).addCatch(failure, {
      errors: [ 'States.ALL' ]
    });

    const randomSelectWinners = new tasks.LambdaInvoke(this, 'Random Select Winners', {
      lambdaFunction: lotteryRandomSelectWinners,
      inputPath: '$.body',
      payloadResponseOnly: true,
    }).addRetry({
      maxAttempts: 2,
      interval: cdk.Duration.seconds(1),
      errors: [ 'States.ALL' ]
    }).addCatch(failure, {
      errors: [ 'States.ALL' ]
    });

    const validateWinners = new tasks.LambdaInvoke(this, 'Validate Winners', {
      lambdaFunction: lotteryValidateWinners,
      inputPath: '$.body',
      payloadResponseOnly: true,
    }).addRetry({
      maxAttempts: 2,
      interval: cdk.Duration.seconds(1),
      errors: [ 'States.ALL' ]
    }).addCatch(failure, {
      errors: [ 'States.ALL' ]
    });

    const notifyWinners = new tasks.SnsPublish(this, 'Notify Winners', {
      topic,
      message: sfn.TaskInput.fromDataAt('$.sns'),
    });
    const recordWinners = new tasks.LambdaInvoke(this, 'Record Winner Queue', {
      lambdaFunction: lotteryRecordWinners,
      inputPath: '$.body',
      payloadResponseOnly: true,
      timeout: cdk.Duration.seconds(300),
    });
    const notifyAndRecordParrallel = new sfn.Parallel(this, 'Send SNS and Record In Dynamodb')
      .branch(notifyWinners)
      .branch(recordWinners)
      .addRetry({
        maxAttempts: 2,
        interval: cdk.Duration.seconds(1),
        errors: [ 'States.ALL' ]
      }).addCatch(failure, {
        errors: [ 'States.ALL' ]
      });

    const winnerChoice = new sfn.Choice(this, 'Is Winner In Past Draw');
    winnerChoice.when(sfn.Condition.numberEquals('$.status', 0), notifyAndRecordParrallel);
    winnerChoice.when(sfn.Condition.numberEquals('$.status', 1), randomSelectWinners);

    const definition = inputLotteryWinners
      .next(randomSelectWinners)
      .next(validateWinners)
      .next(winnerChoice);

    new sfn.StateMachine(this, 'Lottery', {
      definition,
    });
  }
}
