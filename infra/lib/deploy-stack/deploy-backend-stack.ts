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
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    const productService = new ProductService(this, "ProductService", {
      apiGateway,
    });

    new cdk.CfnOutput(this, "ApiGatewayUrl", {
      value: apiGateway.url,
      description: "URL of the API Gateway endpoint",
      exportName: "ApiGatewayUrl",
    });

    new cdk.CfnOutput(this, "ProductsTableName", {
      value: productService.productsTable.tableName,
      description: "Name of the DynamoDB products table",
      exportName: "ProductsTableName",
    });

    new cdk.CfnOutput(this, "StockTableName", {
      value: productService.stockTable.tableName,
      description: "Name of the DynamoDB stock table",
      exportName: "StockTableName",
    });
  }
}
