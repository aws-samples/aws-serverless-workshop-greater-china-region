#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { LambdaEfsmlStack } from '../lib/lambda_efsml-stack';

const app = new cdk.App();
new LambdaEfsmlStack(app, 'LambdaEfsmlStack', { 
    env: { 
      account: process.env.CDK_DEFAULT_ACCOUNT, 
      region: process.env.CDK_DEFAULT_REGION 
  }});
