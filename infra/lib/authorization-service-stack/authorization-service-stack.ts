import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";

export class AuthorizerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the Lambda function for the basic authorizer
    const authorizerLambda = new lambda.Function(this, "authorizer-lambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: "index.basicAuthorizer",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../resources/build/handlers/basicAuthorizer")
      ),
      environment: {
        GITHUB_ACCOUNT_NAME: process.env.GITHUB_ACCOUNT_NAME || "",
        GITHUB_PASSWORD: process.env.GITHUB_PASSWORD || "",
      },
    });

    // Grant permission for API Gateway to invoke the authorizer Lambda function
    authorizerLambda.addPermission("AllowApiGatewayInvokeAuthorizer", {
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      action: "lambda:InvokeFunction",
    });

    // Output the ARN of the authorizer Lambda function for use in other stacks
    new cdk.CfnOutput(this, "BasicAuthorizerLambdaArn", {
      value: authorizerLambda.functionArn,
      exportName: "BasicAuthorizerLambdaArn",
    });
  }
}
