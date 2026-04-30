#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployBackendStack } from "../lib/deploy-stack";
import { ImportServiceStack } from "../lib/import-service-stack";

const app = new cdk.App();

new DeployBackendStack(app, "DeployBackendStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new ImportServiceStack(app, "ImportServiceStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
