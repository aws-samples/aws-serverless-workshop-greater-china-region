#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ServerlessLab4Stack } from '../lib/lab4-stack';

const app = new cdk.App();
new ServerlessLab4Stack(app, 'ServerlessLab4WildRydesStack');
