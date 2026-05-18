#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import * as dotenv from "dotenv";
import { DeployBackendStack } from "../lib/deploy-stack";
import { ImportServiceStack } from "../lib/import-service-stack";
import { AuthorizerStack } from "../lib/authorization-service-stack";

dotenv.config();

const app = new cdk.App();

new AuthorizerStack(app, "AuthorizerStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

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
