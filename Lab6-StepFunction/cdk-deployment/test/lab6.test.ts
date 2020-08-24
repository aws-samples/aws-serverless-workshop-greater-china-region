import * as cdk from '@aws-cdk/core';
import * as lab from '../lib/lab6-stack';
import '@aws-cdk/assert/jest';

describe('Lab6 stack', () => {
    let app: cdk.App;
    let stack: cdk.Stack;

    beforeEach(() => {
        app = new cdk.App();
        stack = new lab.ServerlessWorkshopLab6Stack(app, 'MyTestStack');
    });

    test('state machine is created', () => {
        expect(stack).toHaveResourceLike('AWS::StepFunctions::StateMachine', {
        });
    });

});