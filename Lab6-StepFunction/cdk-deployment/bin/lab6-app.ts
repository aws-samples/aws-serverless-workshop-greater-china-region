#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ServerlessWorkshopLab6Stack } from '../lib/lab6-stack';

const app = new cdk.App();
new ServerlessWorkshopLab6Stack(app, 'ServerlessWorkshopLab6',{
    env: {
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
    }
});
