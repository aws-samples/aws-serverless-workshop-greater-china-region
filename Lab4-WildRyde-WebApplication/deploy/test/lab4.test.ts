import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import Deploy = require('../lib/lab4-stack');

test('Stack can be synthesised.', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Deploy.ServerlessLab4Stack(app, 'MyTestStack');
    // THEN
    
});
