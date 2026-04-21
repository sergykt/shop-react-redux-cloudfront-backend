import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { FRONTEND_URL } from "../constants";
import { ProductService } from "../product-service";

export class DeployBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the API Gateway REST API
    const apiGateway = new apigateway.RestApi(this, "API-Gateway", {
      restApiName: "Shop API",
      description: "API for the Shop application",
      defaultCorsPreflightOptions: {
        allowOrigins: [FRONTEND_URL],
        allowMethods: ["GET", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    new ProductService(this, "ProductService", { apiGateway });

    new cdk.CfnOutput(this, "ApiGatewayUrl", {
      value: apiGateway.url,
      description: "URL of the API Gateway endpoint",
      exportName: "ApiGatewayUrl",
    });
  }
}
