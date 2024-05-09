#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BedrockReferenceArchitectureCdkStack } from '../lib/cdk-stack';

const app = new cdk.App();
new BedrockReferenceArchitectureCdkStack(app, 'BedrockReferenceArchitectureCdkStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});